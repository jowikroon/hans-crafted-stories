import { useCallback, useEffect, useState } from "react";

/**
 * useSkin — selectable visual presets ("skins") for the /writing frontpage.
 *
 * Each skin only re-paints the --w2-* CSS custom properties defined in
 * writing-v2.css via [data-skin="<id>"] on <html>. Layout & markup are
 * identical across skins, so switching is instant and SEO-neutral.
 *
 * Source of truth: localStorage('writing_skin'). The anti-FOUC init in
 * index.html reads the same key before paint. A redactional sitewide
 * default can later be layered in from Supabase (see Portal Pages tab),
 * but localStorage keeps it shippable with zero schema changes.
 */

export type SkinId =
  | "editorial-light"
  | "paper"
  | "mono-dark"
  | "slate"
  | "comfy";

export const SKINS: { id: SkinId; label: string; hint: string }[] = [
  { id: "editorial-light", label: "Editorial", hint: "Warm paper, sans — the default look" },
  { id: "paper", label: "Paper", hint: "Softer paper with a serif display face" },
  { id: "mono-dark", label: "Mono Dark", hint: "Dark, compact, green accent (v1 redesign)" },
  { id: "slate", label: "Slate", hint: "Cool neutral, blue accent, product-blog feel" },
  { id: "comfy", label: "Comfy", hint: "Light with airier spacing and larger type" },
];

const STORAGE_KEY = "writing_skin";
const DEFAULT_SKIN: SkinId = "editorial-light";

function isSkin(v: string | null): v is SkinId {
  return !!v && SKINS.some((s) => s.id === v);
}

export function readStoredSkin(): SkinId {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (isSkin(v)) return v;
  } catch {
    /* ignore */
  }
  return DEFAULT_SKIN;
}

function applySkin(skin: SkinId) {
  const root = document.documentElement;
  if (skin === DEFAULT_SKIN) root.removeAttribute("data-skin");
  else root.setAttribute("data-skin", skin);
}

export function useSkin() {
  const [skin, setSkinState] = useState<SkinId>(() =>
    typeof window === "undefined" ? DEFAULT_SKIN : readStoredSkin()
  );

  // Keep <html> in sync (covers the case where init script didn't run, e.g. SSR).
  useEffect(() => {
    applySkin(skin);
  }, [skin]);

  // React to changes from other tabs / the Portal control.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && isSkin(e.newValue)) setSkinState(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setSkin = useCallback((next: SkinId) => {
    setSkinState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    applySkin(next);
  }, []);

  return { skin, setSkin, skins: SKINS };
}
