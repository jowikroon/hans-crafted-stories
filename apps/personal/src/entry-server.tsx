/**
 * SSR entry for prerendering hero routes. Used by scripts/prerender.mjs after vite build --ssr.
 * Prerender script stubs localStorage/document/window before importing this bundle.
 */
import React from "react";
import { renderToString } from "react-dom/server";
import App from "./App";
import type { BlogPostRow } from "@/lib/api/content";
import { getBlogPosts } from "@/lib/api/content";
import { getHeroPost, getHeroPostHead, HERO_SLUGS } from "@/data/heroPosts";
import { getBlogPostHead, getBlogPostJsonLd, detectBlogPostLang, primaryBlogPostLang } from "@/lib/seo/blogPostHead";
import { clearRootHtml, replaceSsrFallbackHtml, serializeJsonForHtmlScript } from "@/lib/seo/staticHtml";
import { SERVICE_PAGES, SERVICE_PAGES_UPDATED, SERVICE_BYLINE, EXPERIENCE_STRIP, RATES_PAGE, PRICING_NL, PRICING_EN } from "@/data/servicePages";
import { translations } from "@/data/translations";
import { songs } from "@/data/music";
import { LOCALIZED_ROUTES, alternatesFor, absoluteUrl, localizePath, OG_LOCALE } from "@/lib/i18n/routes";

export interface RenderOptions {
  /** Initial language for SSR (e.g. "en" for /about prerender). */
  initialLang?: "en" | "nl";
  /** Pre-fetched blog posts for /writing prerender. */
  preloadedBlogPosts?: BlogPostRow[] | null;
}

export function render(
  url: string,
  preloadedBlogPost?: BlogPostRow | null,
  options?: RenderOptions
): { html: string } {
  const html = renderToString(
    React.createElement(App, {
      serverContext: {
        location: url,
        preloadedBlogPost: preloadedBlogPost ?? null,
        initialLang: options?.initialLang,
        preloadedBlogPosts: options?.preloadedBlogPosts ?? null,
      },
    })
  );
  return { html };
}

export {
  getHeroPost,
  getHeroPostHead,
  HERO_SLUGS,
  getBlogPosts,
  getBlogPostHead,
  getBlogPostJsonLd,
  detectBlogPostLang,
  primaryBlogPostLang,
  clearRootHtml,
  replaceSsrFallbackHtml,
  serializeJsonForHtmlScript,
  SERVICE_PAGES,
  SERVICE_PAGES_UPDATED,
  SERVICE_BYLINE,
  EXPERIENCE_STRIP,
  RATES_PAGE,
  PRICING_NL,
  PRICING_EN,
  translations,
  songs,
  LOCALIZED_ROUTES,
  alternatesFor,
  absoluteUrl,
  localizePath,
  OG_LOCALE,
};
