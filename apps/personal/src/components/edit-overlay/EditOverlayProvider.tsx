import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getOverrides,
  saveOverride as apiSave,
  deleteOverride as apiDelete,
  type OverrideStyle,
  type PageOverride,
} from "@/lib/api/overrides";
import { DEFAULT_LOGO_ID, LOGO_SETTING_KEY } from "@/lib/logos";
import { DEFAULT_HEADER_ID, HEADER_SETTING_KEY } from "@/lib/headers";
import { DEFAULT_FONT_ID, FONT_SETTING_KEY, fontById } from "@/lib/fonts";
import { LogoProvider } from "@/contexts/LogoContext";
import { HeaderProvider } from "@/contexts/HeaderContext";
import { FontProvider } from "@/contexts/FontContext";

const STYLE_TAG_ID = "page-overrides-style";

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

/** Resolve a stable key + selector for an element (prefers lovable-tagger id). */
export function keyForElement(el: Element): { key: string; selector: string } {
  const lovId = el.getAttribute("data-lov-id");
  if (lovId) return { key: lovId, selector: `[data-lov-id="${lovId}"]` };
  const path = computeCssPath(el);
  return { key: path, selector: path };
}

interface EditOverlayValue {
  editing: boolean;
  setEditing: (v: boolean) => void;
  overrides: Map<string, PageOverride>;
  selectedKey: string | null;
  selectedEl: HTMLElement | null;
  select: (el: HTMLElement | null) => void;
  saveStyle: (patch: OverrideStyle) => Promise<void>;
  saveText: (text: string | null) => Promise<void>;
  revert: () => Promise<void>;
  reloadOverrides: () => Promise<void>;
  /** Active header logo id (site-wide setting). */
  activeLogoId: string;
  setActiveLogo: (id: string) => Promise<void>;
  /** Active header style id (site-wide setting). */
  activeHeaderId: string;
  setActiveHeader: (id: string) => Promise<void>;
  /** Active font style id (site-wide setting). */
  activeFontId: string;
  setActiveFont: (id: string) => Promise<void>;
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

  const reloadOverrides = useCallback(async () => {
    const list = await getOverrides();
    setOverrides(new Map(list.map((o) => [o.element_key, o])));
  }, []);

  // Load once on the client (for every visitor).
  useEffect(() => {
    if (typeof window === "undefined") return;
    void reloadOverrides();
  }, [reloadOverrides]);

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
      const decls = Object.entries(o.style || {})
        .filter(([, v]) => v != null && v !== "")
        .map(([k, v]) => `${camelToKebab(k)}:${v} !important`)
        .join(";");
      if (decls) css.push(`${o.selector || `[data-lov-id="${o.element_key}"]`}{${decls}}`);
    });
    tag.textContent = css.join("\n");
  }, [overrides]);

  // ── Apply TEXT overrides via DOM (best-effort; re-applied on DOM mutations) ──
  useEffect(() => {
    if (typeof document === "undefined") return;
    const applyText = () => {
      overrides.forEach((o) => {
        if (o.element_key.startsWith("__site__:")) return; // site settings, not DOM text
        if (o.text_override == null || o.text_override === "") return;
        const sel = o.selector || `[data-lov-id="${o.element_key}"]`;
        document.querySelectorAll(sel).forEach((el) => {
          if (el.textContent !== o.text_override) el.textContent = o.text_override!;
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
  }, [overrides]);

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
    [selectedEl, overrides, upsertLocal]
  );

  const saveText = useCallback(
    async (text: string | null) => {
      if (!selectedEl) return;
      const { key, selector } = keyForElement(selectedEl);
      const existing = overrides.get(key);
      const merged: PageOverride = {
        element_key: key,
        selector,
        page_path: window.location.pathname,
        label: existing?.label ?? labelFor(selectedEl),
        text_override: text,
        style: existing?.style || {},
      };
      upsertLocal(merged);
      await apiSave(merged);
    },
    [selectedEl, overrides, upsertLocal]
  );

  const revert = useCallback(async () => {
    if (!selectedKey) return;
    setOverrides((prev) => {
      const next = new Map(prev);
      next.delete(selectedKey);
      return next;
    });
    await apiDelete(selectedKey);
  }, [selectedKey]);

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
      revert,
      reloadOverrides,
      activeLogoId,
      setActiveLogo,
      activeHeaderId,
      setActiveHeader,
      activeFontId,
      setActiveFont,
    }),
    [editing, overrides, selectedKey, selectedEl, select, saveStyle, saveText, revert, reloadOverrides, activeLogoId, setActiveLogo, activeHeaderId, setActiveHeader, activeFontId, setActiveFont]
  );

  return (
    <Ctx.Provider value={value}>
      <HeaderProvider value={{ activeHeaderId, setActiveHeader }}>
        <LogoProvider value={{ activeLogoId, setActiveLogo }}>
          <FontProvider value={{ activeFontId, setActiveFont }}>{children}</FontProvider>
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
