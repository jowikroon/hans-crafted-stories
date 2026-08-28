// Pure logic for the analytics-ga4-gsc edge function.
//
// Everything here is deliberately free of Deno globals, network calls and
// `jsr:` imports so it can be imported — and therefore typechecked and unit
// tested — from the Vite app's test suite. The edge function's own file is
// outside `tsconfig.app.json`'s `include` and outside vitest's collection
// glob, so logic left in `index.ts` is never verified by CI. Keeping the
// decision-making here is what makes it verifiable; `index.ts` should hold
// only I/O and orchestration.
//
// See coverage.test.ts for the response shapes these rules exist to handle.

export const SITE_ORIGIN = "https://hansvanleeuwen.com";

export interface SitemapContentEntry {
  type?: string;
  submitted?: string | number;
  indexed?: string | number;
}

export interface SitemapEntry {
  path?: string;
  isSitemapsIndex?: boolean;
  contents?: SitemapContentEntry[];
  warnings?: string | number;
  errors?: string | number;
  lastDownloaded?: string;
}

export interface SitemapSummaryRow {
  path: string;
  is_index: boolean;
  submitted: number;
  indexed: number | null;
  warnings: number;
  errors: number;
  last_downloaded: string | null;
}

export interface SitemapSummary {
  indexed_pages: number | null;
  submitted_pages: number | null;
  sitemap_warnings: number;
  sitemap_errors: number;
  sitemaps: SitemapSummaryRow[];
}

/**
 * Reduce a GSC `sitemaps.list` response into site-wide page totals.
 *
 * The rules encoded here exist because this endpoint can misreport in several
 * directions, and a confident wrong number on the dashboard's headline tile is
 * worse than an honest "unknown":
 *
 * 1. `SitemapContent.indexed` is documented "Deprecated; do not use" and real
 *    responses zero-fill it (`{"type":"web","submitted":"890","indexed":"0"}`
 *    for a sitemap whose URLs are indexed). A zero next to a positive
 *    submitted count is therefore treated as unavailable.
 * 2. A sitemap-index entry aggregates its children, so counting it alongside
 *    them double-counts. Index entries never contribute to the totals. This
 *    endpoint exposes no parent/child linkage, so an index-only submission
 *    reports unknown rather than a possibly-wrong number.
 * 3. `contents` is broken down by type; only `web` entries are pages. An
 *    absent/empty `contents` means "not processed yet" (unknown), while a
 *    non-empty `contents` with no `web` entry is a processed image/video/news
 *    sitemap that legitimately holds zero pages.
 * 4. An unprocessed leaf makes BOTH totals partial — its pages are missing
 *    from the submitted sum just as much as from the indexed sum.
 */
export function summarizeSitemaps(entries: SitemapEntry[]): SitemapSummary {
  let submitted = 0;
  let indexed = 0;
  let leafCount = 0;
  let sawWebContent = false;
  let allSubmittedKnown = true;
  let allIndexedKnown = true;
  let sitemapWarnings = 0;
  let sitemapErrors = 0;

  const sitemaps = entries.map((s) => {
    const isIndex = !!s.isSitemapsIndex;
    const rawContents = s.contents ?? [];
    const webContents = rawContents.filter((c) => c.type === "web");
    let subForSitemap = 0;
    let idxForSitemap = 0;
    let idxKnown = rawContents.length > 0;

    if (!isIndex) {
      leafCount++;
      if (webContents.length > 0) sawWebContent = true;
      if (rawContents.length === 0) {
        allIndexedKnown = false;
        allSubmittedKnown = false;
      }
    }

    for (const c of webContents) {
      subForSitemap += Number(c.submitted ?? 0);
      if (c.indexed != null) {
        idxForSitemap += Number(c.indexed);
      } else {
        idxKnown = false;
        if (!isIndex) allIndexedKnown = false;
      }
    }

    // Rule 1: a zero indexed count beside a positive submitted count is the
    // deprecated placeholder, not a deindexed sitemap.
    if (idxKnown && idxForSitemap === 0 && subForSitemap > 0) {
      idxKnown = false;
      if (!isIndex) allIndexedKnown = false;
    }

    const warnings = Number(s.warnings ?? 0);
    const errors = Number(s.errors ?? 0);
    sitemapWarnings += warnings;
    sitemapErrors += errors;

    if (!isIndex) {
      submitted += subForSitemap;
      indexed += idxForSitemap;
    }

    return {
      path: s.path ?? "",
      is_index: isIndex,
      submitted: subForSitemap,
      indexed: idxKnown ? idxForSitemap : null,
      warnings,
      errors,
      last_downloaded: s.lastDownloaded ?? null,
    };
  });

  return {
    indexed_pages: leafCount > 0 && allIndexedKnown && sawWebContent ? indexed : null,
    submitted_pages: leafCount > 0 && allSubmittedKnown ? submitted : null,
    sitemap_warnings: sitemapWarnings,
    sitemap_errors: sitemapErrors,
    sitemaps,
  };
}

/**
 * The normalized absolute URL to inspect for a post, or null when the post is
 * canonicalized off-site and should be skipped entirely.
 *
 * Returns the parsed `.href` rather than the raw column: the CMS form stores
 * `canonical_url` untrimmed while `new URL()` tolerates surrounding
 * whitespace, so a padded value would pass the origin check and then be
 * rejected verbatim by URL Inspection. Normalizing also canonicalizes the
 * dedup key (host case, default ports).
 */
export function selfCanonicalUrl(canonicalUrl: string | null | undefined, slug: string): string | null {
  const raw = (canonicalUrl ?? "").trim();
  if (!raw) return `${SITE_ORIGIN}/writing/${slug}`;
  // A leading-slash canonical ("/writing/custom") is valid and is emitted
  // verbatim by getBlogPostCanonical(), so resolve it against the site
  // origin rather than letting new URL() throw and silently drop the post.
  // Only leading-slash values get a base: arbitrary text must still fail to
  // parse rather than be coerced into a same-origin URL that nothing serves.
  // Protocol-relative values ("//other.example/x") also take the base and are
  // then correctly rejected by the origin comparison below.
  const base = raw.startsWith("/") ? SITE_ORIGIN : undefined;
  try {
    const u = base ? new URL(raw, base) : new URL(raw);
    return u.origin === new URL(SITE_ORIGIN).origin ? u.href : null;
  } catch {
    return null;
  }
}

/**
 * Fold a page of `blog_posts` rows into the running set of URLs to inspect.
 *
 * Dedup happens here, incrementally, rather than after collection: pagination
 * stops on the count of UNIQUE urls, so a page of posts all sharing one
 * canonical must not look "full". `seen` is seeded with the static URLs by the
 * caller so a post canonicalizing to `/writing` cannot claim a second slot.
 */
export function collectInspectionUrls(
  rows: { slug: string; canonical_url: string | null }[],
  seen: Set<string>,
  out: string[],
): void {
  for (const p of rows) {
    const url = selfCanonicalUrl(p.canonical_url, p.slug);
    if (!url) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
}
