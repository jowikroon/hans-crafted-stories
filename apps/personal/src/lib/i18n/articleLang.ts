import { useSyncExternalStore } from "react";

/**
 * Deelt per artikel-slug of er een Engelse versie is (zie hasEnglishVersion in
 * lib/seo/blogPostHead). BlogPostPage schrijft; de Navbar leest, zodat de
 * ENG-schakelaar geen ?lang=en aanbiedt dat op een Nederlandse tekst uitkomt.
 * Bewust een klein extern store-object: Navbar en BlogPostPage zijn geen
 * ouder/kind, en de prerender (SSR) heeft geen effecten.
 */
const state = new Map<string, boolean>();
const listeners = new Set<() => void>();

export function setArticleHasEnglish(slug: string, hasEn: boolean): void {
  if (state.get(slug) === hasEn) return;
  state.set(slug, hasEn);
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => { listeners.delete(l); };
};

/** `null` = nog onbekend (artikel niet geladen). */
export function useArticleHasEnglish(slug: string | undefined): boolean | null {
  return useSyncExternalStore(
    subscribe,
    () => (slug && state.has(slug) ? (state.get(slug) as boolean) : null),
    () => (slug && state.has(slug) ? (state.get(slug) as boolean) : null),
  );
}
