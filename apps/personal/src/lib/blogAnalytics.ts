/* blogAnalytics — GTM dataLayer events for the public blog (/writing/:slug).
   All events go through window.dataLayer; GTM (GTM-K22B6627) forwards them to
   GA4. Consent is handled by GTM/Consent Mode — this module only pushes.

   Events:
   - blog_view          once per article load (published only)
   - blog_toc_click     click on the in-article submenu (desktop TOC + mobile sheet)
   - blog_read_progress scroll thresholds 25/50/75 (once each per article)
   - blog_read_complete 90% scrolled AND >=30s dwell (once per article)
   - blog_share         copy_link | web_share | twitter | linkedin

   Reader-interest profiling happens in GA4 on the blog_category param
   (register as custom dimension), e.g. "3 AI articles read this week". */

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export interface BlogEventContext {
  slug: string;
  title: string;
  category: string;
  lang: string;
}

export const pushBlogEvent = (event: string, params: Record<string, unknown> = {}): void => {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
};

const ctxParams = (ctx: BlogEventContext) => ({
  blog_slug: ctx.slug,
  blog_title: ctx.title,
  blog_category: ctx.category || "Marketplace",
  blog_lang: ctx.lang,
});

/* Per-article session state so thresholds fire once per slug, and again
   after client-side navigation to another article. */
interface ReadState {
  slug: string;
  startedAt: number;
  fired: Set<string>;
}
let state: ReadState | null = null;

const ensureState = (slug: string): ReadState => {
  if (!state || state.slug !== slug) {
    state = { slug, startedAt: Date.now(), fired: new Set() };
  }
  return state;
};

const fireOnce = (slug: string, key: string, fn: () => void): void => {
  const s = ensureState(slug);
  if (s.fired.has(key)) return;
  s.fired.add(key);
  fn();
};

export const trackBlogView = (ctx: BlogEventContext): void => {
  ensureState(ctx.slug); // reset dwell clock on new article
  fireOnce(ctx.slug, "view", () => pushBlogEvent("blog_view", ctxParams(ctx)));
};

export const trackTocClick = (ctx: BlogEventContext, sectionId: string, sectionText: string, index: number, source: "toc" | "mtoc"): void => {
  pushBlogEvent("blog_toc_click", {
    ...ctxParams(ctx),
    toc_section_id: sectionId,
    toc_section: sectionText,
    toc_index: index + 1,
    toc_source: source,
  });
};

export const trackShare = (ctx: BlogEventContext, method: "copy_link" | "web_share" | "twitter" | "linkedin"): void => {
  pushBlogEvent("blog_share", { ...ctxParams(ctx), share_method: method });
};

const COMPLETE_MIN_DWELL_MS = 30_000;

/* Call from a scroll handler with current scrolled fraction (0..1). */
export const trackReadDepth = (ctx: BlogEventContext, fraction: number): void => {
  const pct = Math.round(fraction * 100);
  ([25, 50, 75] as const).forEach((t) => {
    if (pct >= t) {
      fireOnce(ctx.slug, `p${t}`, () =>
        pushBlogEvent("blog_read_progress", { ...ctxParams(ctx), percent: t }));
    }
  });
  if (pct >= 90) {
    const s = ensureState(ctx.slug);
    if (Date.now() - s.startedAt >= COMPLETE_MIN_DWELL_MS) {
      fireOnce(ctx.slug, "complete", () =>
        pushBlogEvent("blog_read_complete", {
          ...ctxParams(ctx),
          read_seconds: Math.round((Date.now() - s.startedAt) / 1000),
        }));
    }
  }
};
