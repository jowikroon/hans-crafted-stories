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
    }),
    [editing, overrides, selectedKey, selectedEl, select, saveStyle, saveText, revert, reloadOverrides]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function labelFor(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const txt = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
  return txt ? `${tag} · ${txt}` : tag;
}
