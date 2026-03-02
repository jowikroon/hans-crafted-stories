/**
 * SSR entry for prerendering hero routes. Used by scripts/prerender.mjs after vite build --ssr.
 * Prerender script stubs localStorage/document/window before importing this bundle.
 */
import React from "react";
import { renderToString } from "react-dom/server";
import App from "./App";
import type { BlogPostRow } from "@/lib/api/content";
import { getHeroPost, getHeroPostHead, HERO_SLUGS } from "@/data/heroPosts";

export interface RenderOptions {
  /** Initial language for SSR (e.g. "en" for /about prerender). */
  initialLang?: "en" | "nl";
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
      },
    })
  );
  return { html };
}

export { getHeroPost, getHeroPostHead, HERO_SLUGS };
