import { useSyncExternalStore } from "react";
import type { Lang } from "@/lib/i18n/routes";

/**
 * Deelt per artikel-slug (a) of er een Engelse versie is en (b) de primaire
 * taal van het artikel (zie lib/seo/blogPostHead). BlogPostPage schrijft; de
 * Navbar en LangProvider lezen, zodat de UI-taal en de NL/ENG-schakelaar het
 * artikel volgen in plaats van altijd Engels te tonen (i18n-audit 2026-09-22).
 * Bewust een klein extern store-object: Navbar, LangProvider en BlogPostPage
 * zijn geen ouder/kind, en de prerender (SSR) heeft geen effecten.
 */
export interface ArticleLangInfo { hasEn: boolean; lang: Lang }
const state = new Map<string, ArticleLangInfo>();
const listeners = new Set<() => void>();

export function setArticleLangInfo(slug: string, info: ArticleLangInfo): void {
  const cur = state.get(slug);
  if (cur && cur.hasEn === info.hasEn && cur.lang === info.lang) return;
  state.set(slug, info);
  listeners.forEach((l) => l());
}

/** Backwards-compatible helper (PR #350). */
export function setArticleHasEnglish(slug: string, hasEn: boolean): void {
  const cur = state.get(slug);
  setArticleLangInfo(slug, { hasEn, lang: cur?.lang ?? "nl" });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => { listeners.delete(l); };
};
const snapshot = (slug: string | undefined) => (slug && state.has(slug) ? (state.get(slug) as ArticleLangInfo) : null);

/** `null` = nog onbekend (artikel niet geladen). */
export function useArticleLangInfo(slug: string | undefined): ArticleLangInfo | null {
  return useSyncExternalStore(subscribe, () => snapshot(slug), () => snapshot(slug));
}

export function useArticleHasEnglish(slug: string | undefined): boolean | null {
  const info = useArticleLangInfo(slug);
  return info ? info.hasEn : null;
}
