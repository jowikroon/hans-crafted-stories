import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import {
  getOverrides,
  saveOverride as apiSave,
  deleteOverride as apiDelete,
  type OverrideStyle,
  type PageOverride,
} from "@/lib/api/overrides";
import { DEFAULT_LOGO_ID, LOGO_SETTING_KEY } from "@/lib/logos";
import { DEFAULT_HEADER_ID, HEADER_SETTING_KEY } from "@/lib/headers";
import { DEFAULT_RADAR_ID, RADAR_SETTING_KEY } from "@/lib/radar-variants";
import { DEFAULT_FONT_ID, FONT_SETTING_KEY, fontById } from "@/lib/fonts";
import { LogoProvider } from "@/contexts/LogoContext";
import { HeaderProvider } from "@/contexts/HeaderContext";
import { FontProvider } from "@/contexts/FontContext";
import { NavMenuProvider } from "@/contexts/NavMenuContext";
import { NAV_SETTING_KEY, parseNavSetting, serializeNavSetting, type NavMenuItem } from "@/lib/navMenu";
import { useLang } from "@/hooks/useLang";
import { parsePath } from "@/lib/i18n/routes";
import { supabase } from "@/integrations/supabase/client";
import {
  applyTextPreservingMarkup,
  collectSegments,
  fullText,
  resolveTextEdit,
  type Resolution,
} from "@/lib/editSource/resolve";
import {
  createSourceEdit,
  findPageContentByValue,
  getSourceEdit,
  listRecentSourceEdits,
  loadSourceMap,
  watchSourceEdit,
  type SourceEdit,
} from "@/lib/api/sourceEdits";

const STYLE_TAG_ID = "page-overrides-style";

/** Guardrail (2026-08-26 incident): een style-override met een structurele
 * selector ("body > div > div", "#root > div", ...) raakt tientallen elementen
 * site-breed — één zo'n rij verborg maandenlang de cookie-banner (en daarmee
 * elke consent-grant). Structurele selectors zijn nooit een geldige
 * edit-overlay-target; weiger ze bij het injecteren. */
const STRUCTURAL_SELECTOR = /^\s*(html|body|#root)\s*(>\s*(div|main|section|span)\s*){0,3}$/i;
function isUnsafeStyleSelector(sel: string | null | undefined): boolean {
  if (!sel) return false;
  const t = sel.trim();
  if (t === "" || t.endsWith(">")) return true; // kapotte selector zoals "body > "
  return STRUCTURAL_SELECTOR.test(t);
}

/** Overrides zijn per pagina opgeslagen; pas ze alleen toe op die pagina.
 * (Voorheen werden alle rijen site-breed geïnjecteerd.) Rijen zonder
 * page_path blijven site-breed voor terugwaartse compatibiliteit. */
function overrideAppliesHere(pagePath: string | null | undefined, currentPath?: string): boolean {
  if (!pagePath || pagePath === "*") return true;
  const here = currentPath ?? (typeof window === "undefined" ? null : window.location.pathname);
  if (here == null) return true;
  return here === pagePath || here === pagePath.replace(/\/$/, "");
}

function camelToKebab(s: string) {
  return s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}

/** Build a stable CSS path for elements the tagger didn't tag. */
export function computeCssPath(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node.nodeType === 1 && node.tagName.toLowerCase() !== "body") {
    const tag = node.tagName.toLowerCase();
    const parent = node.parentElement;
    if (!parent) break;
    const sameTag = Array.from(parent.children).filter(
      (c) => c.tagName.toLowerCase() === tag
    );
    const idx = sameTag.indexOf(node) + 1;
    parts.unshift(sameTag.length > 1 ? `${tag}:nth-of-type(${idx})` : tag);
    node = parent;
  }
  return "body > " + parts.join(" > ");
}

/** Resolve a stable key + selector for an element (prefers lovable-tagger id). Used for STYLE overrides. */
export function keyForElement(el: Element): { key: string; selector: string } {
  const lovId = el.getAttribute("data-lov-id");
  if (lovId) return { key: lovId, selector: `[data-lov-id="${lovId}"]` };
  const path = computeCssPath(el);
  return { key: path, selector: path };
}

/**
 * Key + selector for a TEXT override. Language-scoped (HAN-177: a NL text must
 * never overwrite the EN page) and anchored on the build-time source tag
 * (data-src) when that tag is unique on the page — CSS paths break as soon as
 * the layout changes.
 */
export function textKeyForElement(el: Element, lang: string): { key: string; selector: string; dataSrc: string | null } {
  const dataSrc = el.getAttribute("data-src");
  if (dataSrc && typeof document !== "undefined") {
    const selector = `[data-src="${dataSrc.replace(/"/g, '\\"')}"]`;
    if (document.querySelectorAll(selector).length === 1) return { key: `src:${dataSrc}@${lang}`, selector, dataSrc };
  }
  const path = computeCssPath(el);
  return { key: `${path}@${lang}`, selector: path, dataSrc };
}

/** Result of a text save, for the panel UI. */
export interface TextSaveResult {
  kind: "noop" | "github" | "page_content" | "overlay_only";
  job: SourceEdit | null;
  reason?: string;
}

const LOGO_MOTION_KEY = "__site__:logoMotion";

/** Routes (EN base path) whose copy can come from page_content, and their page key. */
const PAGE_CONTENT_PAGES: Record<string, string> = { "/": "home", "/about": "about", "/work": "work" };

interface EditOverlayValue {
  editing: boolean;
  setEditing: (v: boolean) => void;
  overrides: Map<string, PageOverride>;
  selectedKey: string | null;
  selectedEl: HTMLElement | null;
  select: (el: HTMLElement | null) => void;
  saveStyle: (patch: OverrideStyle) => Promise<void>;
  /** Save a text edit: live overlay for everyone + write-back to its source (code via PR, or CMS row). */
  saveText: (text: string) => Promise<TextSaveResult>;
  /** Remove the runtime text override of the selected element (does not touch the source). */
  revertText: () => Promise<void>;
  /** Text override currently applied to the selected element (current language). */
  selectedTextOverride: PageOverride | null;
  /** Latest write-back job per text-override key. */
  sourceJobs: Map<string, SourceEdit>;
  /** Last write-back jobs site-wide (newest first). */
  recentJobs: SourceEdit[];
  refreshRecentJobs: () => Promise<void>;
  /** Current page language ("nl" | "en"). */
  lang: string;
  revert: () => Promise<void>;
  /** Maak de laatste wijziging in deze sessie ongedaan (undo-stack). */
  undoLast: () => Promise<boolean>;
  /** Aantal wijzigingen in de sessie-undo-stack. */
  undoCount: number;
  reloadOverrides: () => Promise<void>;
  /** Active header logo id (site-wide setting). */
  activeLogoId: string;
  setActiveLogo: (id: string) => Promise<void>;
  /** Active header style id (site-wide setting). */
  activeHeaderId: string;
  setActiveHeader: (id: string) => Promise<void>;
  activeRadarId: string;
  setActiveRadar: (id: string) => Promise<void>;
  /** Active font style id (site-wide setting). */
  activeFontId: string;
  setActiveFont: (id: string) => Promise<void>;
  /** Editable header menu (site-wide setting). */
  navItems: NavMenuItem[];
  setNavItems: (items: NavMenuItem[]) => Promise<void>;
  /** Logo hover motion on/off (site-wide setting; default on). */
  logoMotion: boolean;
  setLogoMotion: (on: boolean) => Promise<void>;
}

const Ctx = createContext<EditOverlayValue | null>(null);

export function useEditOverlay() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useEditOverlay must be used within EditOverlayProvider");
  return v;
}


export function EditOverlayProvider({ children }: { children: React.ReactNode }) {
  const [editing, setEditing] = useState(false);
  const [overrides, setOverrides] = useState<Map<string, PageOverride>>(new Map());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedEl, setSelectedEl] = useState<HTMLElement | null>(null);
  const { lang } = useLang();

  // Source-rendered text per text node, captured before a text override touches
  // it. The write-back diff is always "source text -> new text", never
  // "override -> new text".
  const originals = useRef(new WeakMap<Text, { orig: string; applied: string }>());
  const originalOf = useCallback((t: Text): string | undefined => {
    const rec = originals.current.get(t);
    return rec && t.data === rec.applied ? rec.orig : undefined;
  }, []);

  // Write-back jobs (overlay_source_edits), keyed by text-override key.
  const [sourceJobs, setSourceJobs] = useState<Map<string, SourceEdit>>(new Map());
  const [recentJobs, setRecentJobs] = useState<SourceEdit[]>([]);

  // ── Sessie-undo-stack: vorige staat per gewijzigde key (null = key bestond niet) ──
  const undoStack = useRef<{ key: string; prev: PageOverride | null }[]>([]);
  const [undoCount, setUndoCount] = useState(0);
  const pushUndo = useCallback((key: string, prev: PageOverride | null) => {
    undoStack.current.push(
      prev ? { key, prev: { ...prev, style: { ...(prev.style || {}) } } } : { key, prev: null }
    );
    if (undoStack.current.length > 50) undoStack.current.shift();
    setUndoCount(undoStack.current.length);
  }, []);

  const reloadOverrides = useCallback(async () => {
    const list = await getOverrides();
    setOverrides(new Map(list.map((o) => [o.element_key, o])));
  }, []);

  // Load once on the client (for every visitor).
  useEffect(() => {
    if (typeof window === "undefined") return;
    void reloadOverrides();
  }, [reloadOverrides]);

  // Overrides zijn per pagina; bij client-side navigatie (o.a. de NL/ENG-
  // schakelaar) moeten ze opnieuw gefilterd worden, anders blijft de stylesheet
  // van de vorige pagina staan (i18n-audit 2026-09-22).
  const { pathname: routePath } = useLocation();

  // ── Apply STYLE overrides via an injected stylesheet (survives React re-renders) ──
  useEffect(() => {
    if (typeof document === "undefined") return;
    let tag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
    if (!tag) {
      tag = document.createElement("style");
      tag.id = STYLE_TAG_ID;
      document.head.appendChild(tag);
    }
    const css: string[] = [];
    overrides.forEach((o) => {
      if (o.element_key.startsWith("__site__:")) return; // site settings, not DOM styles
      if (!overrideAppliesHere(o.page_path, routePath)) return;
      if (isUnsafeStyleSelector(o.selector)) return;
      const decls = Object.entries(o.style || {})
        .filter(([, v]) => v != null && v !== "")
        .map(([k, v]) => `${camelToKebab(k)}:${v} !important`)
        .join(";");
      if (decls) css.push(`${o.selector || `[data-lov-id="${o.element_key}"]`}{${decls}}`);
    });
    tag.textContent = css.join("\n");
  }, [overrides, routePath]);

  // ── Apply TEXT overrides via DOM (best-effort; re-applied on DOM mutations) ──
  // Only the text nodes that differ are touched, so inline markup (<em>, links,
  // icons) survives; overrides with a language only apply in that language.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const applyText = () => {
      overrides.forEach((o) => {
        if (o.element_key.startsWith("__site__:")) return; // site settings, not DOM text
        if (!overrideAppliesHere(o.page_path, routePath)) return;
        if (o.text_override == null || o.text_override === "") return;
        if (o.lang && o.lang !== lang) return; // HAN-177: never cross languages
        const sel = o.selector || `[data-lov-id="${o.element_key}"]`;
        let nodes: NodeListOf<Element>;
        try {
          nodes = document.querySelectorAll(sel);
        } catch {
          return; // malformed legacy selector
        }
        nodes.forEach((el) => {
          // Guardrail (2026-07-03 incident): een text-override op een structureel
          // container-element (zoals #root) vervangt de hele DOM-boom door platte
          // tekst en sloopt de site. Sla overrides op containers en extreem lange
          // teksten over — text-overrides zijn bedoeld voor leaf-elementen.
          if (el.id === "root" || el.tagName === "BODY" || el.tagName === "HTML") return;
          if (el.children.length > 3) return;
          if ((o.text_override as string).length > 2000) return;
          const cur = el.textContent ?? "";
          const lead = cur.length - cur.trimStart().length;
          const trail = cur.length - cur.trimEnd().length;
          const target = cur.slice(0, lead) + o.text_override + (trail ? cur.slice(cur.length - trail) : "");
          if (cur === target) return;
          // remember the source text of every node before we change it
          collectSegments(el, (t) => t.data).forEach(({ node }) => {
            const rec = originals.current.get(node);
            if (!rec || node.data !== rec.applied) originals.current.set(node, { orig: node.data, applied: node.data });
          });
          applyTextPreservingMarkup(el, target);
          collectSegments(el, (t) => t.data).forEach(({ node }) => {
            const rec = originals.current.get(node);
            if (rec) rec.applied = node.data;
          });
        });
      });
    };
    applyText();
    const obs = new MutationObserver(() => {
      // debounce via microtask to avoid thrashing
      window.requestAnimationFrame(applyText);
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => obs.disconnect();
  }, [overrides, routePath, lang]);

  const select = useCallback((el: HTMLElement | null) => {
    if (!el) {
      setSelectedEl(null);
      setSelectedKey(null);
      return;
    }
    const { key } = keyForElement(el);
    setSelectedEl(el);
    setSelectedKey(key);
  }, []);

  const upsertLocal = useCallback((o: PageOverride) => {
    setOverrides((prev) => {
      const next = new Map(prev);
      next.set(o.element_key, o);
      return next;
    });
  }, []);

  const saveStyle = useCallback(
    async (patch: OverrideStyle) => {
      if (!selectedEl) return;
      const { key, selector } = keyForElement(selectedEl);
      const existing = overrides.get(key);
      pushUndo(key, existing ?? null);
      const merged: PageOverride = {
        element_key: key,
        selector,
        page_path: window.location.pathname,
        label: existing?.label ?? labelFor(selectedEl),
        text_override: existing?.text_override ?? null,
        style: { ...(existing?.style || {}), ...patch },
      };
      upsertLocal(merged);
      await apiSave(merged);
    },
    [selectedEl, overrides, upsertLocal, pushUndo]
  );

  const trackJob = useCallback((key: string, job: SourceEdit) => {
    setSourceJobs((prev) => {
      const next = new Map(prev);
      next.set(key, job);
      return next;
    });
    setRecentJobs((prev) => [job, ...prev.filter((j) => j.id !== job.id)].slice(0, 6));
  }, []);

  const refreshRecentJobs = useCallback(async () => {
    setRecentJobs(await listRecentSourceEdits(6));
  }, []);

  /** Follow one job until it settles (realtime + polling fallback). */
  const followJob = useCallback(
    (key: string, job: SourceEdit) => {
      const settled = (st: string) => ["live", "done", "needs_manual", "failed", "cancelled"].includes(st);
      if (settled(job.status)) return;
      let stopped = false;
      const onRow = (row: SourceEdit) => {
        if (stopped) return;
        trackJob(key, row);
        if (row.status === "live" || row.status === "done") void reloadOverrides();
        if (settled(row.status)) stop();
      };
      const unwatch = watchSourceEdit(job.id, onRow);
      const started = Date.now();
      const timer = window.setInterval(async () => {
        if (Date.now() - started > 15 * 60 * 1000) return stop();
        const row = await getSourceEdit(job.id);
        if (row) onRow(row);
      }, 5000);
      function stop() {
        stopped = true;
        unwatch();
        window.clearInterval(timer);
      }
    },
    [trackJob, reloadOverrides]
  );

  const saveText = useCallback(
    async (text: string): Promise<TextSaveResult> => {
      if (!selectedEl) return { kind: "noop", job: null };
      const el = selectedEl;
      const nextText = text.trim();
      const { key, selector, dataSrc } = textKeyForElement(el, lang);
      const segments = collectSegments(el, originalOf);
      const original = fullText(segments);
      const lead = original.length - original.trimStart().length;
      const trail = original.length - original.trimEnd().length;
      const newFull = original.slice(0, lead) + nextText + (trail ? original.slice(original.length - trail) : "");
      const map = await loadSourceMap();
      const res: Resolution = resolveTextEdit({ el, segments, newFull, map, lang });
      if (res.status === "noop") return { kind: "noop", job: null };

      const page_path = window.location.pathname;
      const base = {
        page_path,
        lang,
        element_key: key,
        data_src: res.owner ?? dataSrc,
        old_text: original.trim(),
        new_text: nextText,
      };

      // 1) CMS-backed copy (page_content): the database row IS the source.
      //    Only for pages that read page_content (usePageContent("home"|"about"|"work")).
      const cmsPage = PAGE_CONTENT_PAGES[parsePath(page_path).path];
      if (res.segment && cmsPage) {
        const rows = (await findPageContentByValue(res.segment.text)).filter((r) => r.page === cmsPage);
        const row =
          rows.find((r) => r.content_key.endsWith(`_${lang}`)) ??
          rows.find((r) => !/_(nl|en)$/.test(r.content_key)) ??
          null;
        if (row && res.a != null && res.b != null) {
          const newValue = row.content_value.slice(0, res.a) + (res.insert ?? "") + row.content_value.slice(res.b);
          const { data: auth } = await supabase.auth.getUser();
          const uid = auth.user?.id ?? null;
          const useLangRow = lang !== "en" && !row.content_key.endsWith(`_${lang}`);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sdb = supabase as any;
          let rowId = row.id;
          let contentKey = row.content_key;
          if (useLangRow) {
            // NL edit of an EN-only row: add a *_nl row instead of changing EN.
            contentKey = `${row.content_key}_${lang}`;
            const { data: created, error } = await sdb
              .from("page_content")
              .insert({ page: row.page, content_key: contentKey, content_value: newValue, content_group: row.content_group, content_label: `${row.content_label} (${lang.toUpperCase()})`, content_type: row.content_type, sort_order: row.sort_order })
              .select("id")
              .single();
            if (error) throw error;
            rowId = created.id;
          } else {
            await sdb.from("page_content_versions").insert({ content_id: row.id, page: row.page, content_key: row.content_key, content_value: row.content_value, content_group: row.content_group, content_label: row.content_label, changed_by: uid });
            const { error } = await sdb.from("page_content").update({ content_value: newValue }).eq("id", row.id);
            if (error) throw error;
          }
          applyTextPreservingMarkup(el, newFull);
          const job = await createSourceEdit({
            ...base,
            patch: { kind: "page_content", id: rowId, page: row.page, content_key: contentKey, created_key: useLangRow },
            status: "done",
            target: `page_content:${row.page}/${contentKey}`,
          });
          trackJob(key, job);
          return { kind: "page_content", job };
        }
      }

      // 2) Runtime override: the change is live for every visitor right away.
      const existing = overrides.get(key);
      pushUndo(key, existing ?? null);
      const merged: PageOverride = {
        element_key: key,
        selector,
        page_path,
        label: existing?.label ?? labelFor(el),
        text_override: nextText,
        style: existing?.style || {},
        lang,
        data_src: dataSrc,
        original_text: existing?.original_text ?? original.trim(),
      };
      upsertLocal(merged);
      await apiSave(merged);

      // 3) Write-back job: resolved -> worker commits to GitHub; otherwise flagged.
      const job = await createSourceEdit({
        ...base,
        patch: res.patch,
        status: res.status === "resolved" ? "queued" : "needs_manual",
        target: res.status === "resolved" ? `github:${res.patch.file}:${res.patch.line}` : null,
        error: res.status === "resolved" ? null : res.patch.reason,
      });
      trackJob(key, job);
      followJob(key, job);
      return res.status === "resolved"
        ? { kind: "github", job }
        : { kind: "overlay_only", job, reason: res.patch.reason };
    },
    [selectedEl, lang, originalOf, overrides, upsertLocal, pushUndo, trackJob, followJob]
  );

  const revertText = useCallback(async () => {
    if (!selectedEl) return;
    const { key } = textKeyForElement(selectedEl, lang);
    const existing = overrides.get(key);
    if (!existing) return;
    pushUndo(key, existing);
    // put the source text back into the DOM right away
    collectSegments(selectedEl, (t) => t.data).forEach(({ node }) => {
      const orig = originalOf(node);
      if (orig != null) node.data = orig;
    });
    setOverrides((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
    await apiDelete(key);
  }, [selectedEl, lang, overrides, pushUndo, originalOf]);

  const selectedTextOverride = selectedEl ? overrides.get(textKeyForElement(selectedEl, lang).key) ?? null : null;

  const revert = useCallback(async () => {
    if (!selectedKey) return;
    const existing = overrides.get(selectedKey);
    if (existing) pushUndo(selectedKey, existing);
    setOverrides((prev) => {
      const next = new Map(prev);
      next.delete(selectedKey);
      return next;
    });
    await apiDelete(selectedKey);
  }, [selectedKey, overrides, pushUndo]);

  const undoLast = useCallback(async () => {
    const entry = undoStack.current.pop();
    setUndoCount(undoStack.current.length);
    if (!entry) return false;
    if (entry.prev) {
      upsertLocal(entry.prev);
      await apiSave(entry.prev);
    } else {
      setOverrides((prev) => {
        const next = new Map(prev);
        next.delete(entry.key);
        return next;
      });
      await apiDelete(entry.key);
    }
    return true;
  }, [upsertLocal]);

  const activeLogoId = overrides.get(LOGO_SETTING_KEY)?.text_override || DEFAULT_LOGO_ID;

  const setActiveLogo = useCallback(
    async (id: string) => {
      const row: PageOverride = {
        element_key: LOGO_SETTING_KEY,
        selector: null,
        page_path: "*",
        label: "Header logo",
        text_override: id,
        style: {},
      };
      upsertLocal(row);
      await apiSave(row);
    },
    [upsertLocal]
  );

  const activeHeaderId = overrides.get(HEADER_SETTING_KEY)?.text_override || DEFAULT_HEADER_ID;

  const setActiveHeader = useCallback(
    async (id: string) => {
      const row: PageOverride = {
        element_key: HEADER_SETTING_KEY,
        selector: null,
        page_path: "*",
        label: "Header style",
        text_override: id,
        style: {},
      };
      upsertLocal(row);
      await apiSave(row);
    },
    [upsertLocal]
  );

  const activeRadarId = overrides.get(RADAR_SETTING_KEY)?.text_override || DEFAULT_RADAR_ID;

  const setActiveRadar = useCallback(
    async (id: string) => {
      const row: PageOverride = {
        element_key: RADAR_SETTING_KEY,
        selector: null,
        page_path: "*",
        label: "Radar variant",
        text_override: id,
        style: {},
      };
      upsertLocal(row);
      await apiSave(row);
    },
    [upsertLocal]
  );

  const activeFontId = overrides.get(FONT_SETTING_KEY)?.text_override || DEFAULT_FONT_ID;

  const setActiveFont = useCallback(
    async (id: string) => {
      const row: PageOverride = {
        element_key: FONT_SETTING_KEY,
        selector: null,
        page_path: "*",
        label: "Font style",
        text_override: id,
        style: {},
      };
      upsertLocal(row);
      await apiSave(row);
    },
    [upsertLocal]
  );

  const navItems = parseNavSetting(overrides.get(NAV_SETTING_KEY)?.text_override);

  const setNavItems = useCallback(
    async (items: NavMenuItem[]) => {
      const row: PageOverride = {
        element_key: NAV_SETTING_KEY,
        selector: null,
        page_path: "*",
        label: "Header menu",
        text_override: serializeNavSetting(items),
        style: {},
      };
      upsertLocal(row);
      await apiSave(row);
    },
    [upsertLocal]
  );

  const logoMotion = (overrides.get(LOGO_MOTION_KEY)?.text_override ?? "on") !== "off";
  const setLogoMotion = useCallback(
    async (on: boolean) => {
      const row: PageOverride = {
        element_key: LOGO_MOTION_KEY,
        selector: null,
        page_path: "*",
        label: "Logo hover motion",
        text_override: on ? "on" : "off",
        style: {},
      };
      upsertLocal(row);
      await apiSave(row);
    },
    [upsertLocal]
  );

  // ── Apply the active FONT style site-wide (CSS vars + on-demand webfont) ──
  useEffect(() => {
    if (typeof document === "undefined") return;
    const font = fontById(activeFontId);
    (font.hrefs || []).forEach((href, i) => {
      const id = `site-font-${font.id}-${i}`;
      if (document.getElementById(id)) return;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    });
    const root = document.documentElement;
    if (activeFontId && activeFontId !== DEFAULT_FONT_ID) {
      root.style.setProperty("--font-display", font.display);
      root.style.setProperty("--font-body", font.body);
    } else {
      // Fall back to the values defined in index.css :root.
      root.style.removeProperty("--font-display");
      root.style.removeProperty("--font-body");
    }
  }, [activeFontId]);

  const value = useMemo<EditOverlayValue>(
    () => ({
      editing,
      setEditing,
      overrides,
      selectedKey,
      selectedEl,
      select,
      saveStyle,
      saveText,
      revertText,
      selectedTextOverride,
      sourceJobs,
      recentJobs,
      refreshRecentJobs,
      lang,
      revert,
      undoLast,
      undoCount,
      reloadOverrides,
      activeLogoId,
      setActiveLogo,
      activeHeaderId,
      setActiveHeader,
      activeRadarId,
      setActiveRadar,
      activeFontId,
      setActiveFont,
      navItems,
      setNavItems,
      logoMotion,
      setLogoMotion,
    }),
    [editing, overrides, selectedKey, selectedEl, select, saveStyle, saveText, revertText, selectedTextOverride, sourceJobs, recentJobs, refreshRecentJobs, lang, revert, undoLast, undoCount, reloadOverrides, activeLogoId, setActiveLogo, activeHeaderId, setActiveHeader, activeRadarId, setActiveRadar, activeFontId, setActiveFont, navItems, setNavItems, logoMotion, setLogoMotion]
  );

  return (
    <Ctx.Provider value={value}>
      <HeaderProvider value={{ activeHeaderId, setActiveHeader }}>
        <LogoProvider value={{ activeLogoId, setActiveLogo, logoMotion, setLogoMotion }}>
          <FontProvider value={{ activeFontId, setActiveFont }}>
            <NavMenuProvider value={{ navItems, setNavItems }}>{children}</NavMenuProvider>
          </FontProvider>
        </LogoProvider>
      </HeaderProvider>
    </Ctx.Provider>
  );
}

function labelFor(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const txt = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
  return txt ? `${tag} · ${txt}` : tag;
}
