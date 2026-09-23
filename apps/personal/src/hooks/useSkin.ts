import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * useSkin — selectable visual presets ("skins") for the /writing frontpage.
 *
 * Each skin only re-paints the --w2-* CSS custom properties defined in
 * writing-v2.css via [data-skin="<id>"] on <html>. Layout & markup are
 * identical across skins, so switching is instant and SEO-neutral.
 *
 * Source of truth: localStorage('writing_skin'). The anti-FOUC init in
 * index.html reads the same key before paint.
 *
 * Altijd licht starten (2026-09-23): only LIGHT skins are remembered. A dark
 * skin (mono-dark) can still be chosen, but applies to the current page only:
 * it is not stored, it is ignored on load, and a route change drops it. A redactional sitewide
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
/** Skins that may be remembered and applied on load. Twin: index.html skin init. */
export const LIGHT_SKINS: readonly SkinId[] = ["editorial-light", "paper", "slate", "comfy"];

function isSkin(v: string | null): v is SkinId {
  return !!v && SKINS.some((s) => s.id === v);
}

const isLightSkin = (v: SkinId) => LIGHT_SKINS.includes(v);

export function readStoredSkin(): SkinId {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (isSkin(v) && isLightSkin(v)) return v;
  } catch {
    /* ignore */
  }
  return DEFAULT_SKIN;
}

/**
 * Route change (called from useLightOnRouteChange): a page-local dark skin that
 * is still on <html> after its page unmounted must not colour the next page.
 */
export function resetPageLocalSkin() {
  if (typeof document === "undefined") return;
  const current = document.documentElement.getAttribute("data-skin");
  if (current && isSkin(current) && !isLightSkin(current)) applySkin(readStoredSkin());
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

  // React to (light) changes from other tabs / the Portal control. A dark skin
  // from another tab never switches this page.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && isSkin(e.newValue) && isLightSkin(e.newValue)) setSkinState(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // A page-local dark skin ends at the next route: back to the remembered light skin.
  const { pathname } = useLocation();
  useEffect(() => {
    setSkinState((current) => (isLightSkin(current) ? current : readStoredSkin()));
  }, [pathname]);

  const setSkin = useCallback((next: SkinId) => {
    setSkinState(next);
    if (isLightSkin(next)) {
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
    }
    applySkin(next);
  }, []);

  return { skin, setSkin, skins: SKINS };
}
