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
// See src/test/gscCoverage.test.ts for the response shapes these rules exist
// to handle.

export const SITE_ORIGIN = "https://hansvanleeuwen.com";

// ---------------------------------------------------------------------------
// Sitemap coverage (GSC sitemaps.list)
// ---------------------------------------------------------------------------

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
 *    them double-counts. Index entries never contribute to the totals; the
 *    caller expands each index into its children (`sitemaps.list` with
 *    `sitemapIndex=`) and passes those in as ordinary leaves. An index whose
 *    children GSC has not listed yet is passed as `unresolvedIndexes`, and
 *    then both totals are unknown — also when unrelated leaves exist, since
 *    their sum would silently omit the index's pages.
 * 3. `contents` is broken down by type; only `web` entries are pages. An
 *    absent/empty `contents` means "not processed yet" (unknown), while a
 *    non-empty `contents` with no `web` entry is a processed image/video/news
 *    sitemap that legitimately holds zero pages.
 * 4. An unprocessed leaf makes BOTH totals partial — its pages are missing
 *    from the submitted sum just as much as from the indexed sum.
 */
export function summarizeSitemaps(entries: SitemapEntry[], opts: { unresolvedIndexes?: number } = {}): SitemapSummary {
  let submitted = 0;
  let indexed = 0;
  let leafCount = 0;
  let sawWebContent = false;
  let allSubmittedKnown = true;
  let allIndexedKnown = true;
  let sitemapWarnings = 0;
  let sitemapErrors = 0;
  const unresolved = (opts.unresolvedIndexes ?? 0) > 0;

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
      // `submitted` is optional in this response shape too, so folding a
      // missing count in as zero would under-report the site total exactly
      // the way a missing `indexed` would.
      if (c.submitted != null) {
        subForSitemap += Number(c.submitted);
      } else if (!isIndex) {
        allSubmittedKnown = false;
      }
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
    // An index whose children GSC did not list contributes pages we cannot
    // see, so any total next to it is partial — even when other leaves exist.
    indexed_pages: leafCount > 0 && allIndexedKnown && sawWebContent && !unresolved ? indexed : null,
    submitted_pages: leafCount > 0 && allSubmittedKnown && !unresolved ? submitted : null,
    sitemap_warnings: sitemapWarnings,
    sitemap_errors: sitemapErrors,
    sitemaps,
  };
}

/**
 * Merge the top-level `sitemaps.list` entries with the children listed under
 * each index, keeping the first occurrence of every path. GSC can list a
 * child both on its own (submitted separately) and under its index; counting
 * it twice would inflate every total.
 */
export function dedupeSitemaps(lists: SitemapEntry[][]): SitemapEntry[] {
  const seen = new Set<string>();
  const out: SitemapEntry[] = [];
  for (const list of lists) {
    for (const e of list) {
      const key = e.path ?? "";
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(e);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Which GSC property is ours
// ---------------------------------------------------------------------------

/**
 * Is this `sites.list` entry a property for this site? The domain property
 * (`sc-domain:hansvanleeuwen.com`) or a URL-prefix property whose parsed host
 * is the site or its www alias. A substring test (`includes("hansvanleeuwen.com")`)
 * would also accept "https://hansvanleeuwen.com.evil.example/" or
 * "https://evil.example/hansvanleeuwen.com" — CodeQL's "incomplete URL
 * substring sanitization".
 */
export function isOwnGscProperty(siteUrl: string): boolean {
  const host = new URL(SITE_ORIGIN).hostname;
  if (siteUrl === `sc-domain:${host}`) return true;
  try {
    const h = new URL(siteUrl).hostname;
    return h === host || h === `www.${host}`;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Which URLs to run through URL Inspection
// ---------------------------------------------------------------------------

const XML_ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decodeXml(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, ent: string) => {
    if (ent[0] === "#") {
      const code = ent[1] === "x" || ent[1] === "X" ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return XML_ENTITIES[ent.toLowerCase()] ?? m;
  });
}

/**
 * Pull the `<loc>` values out of a sitemap document.
 *
 * The site's own sitemap is the sample source for URL Inspection because it is
 * exactly the set of URLs the site declares canonical, in exactly the form
 * Google is asked to index — EN and /nl/ variants, service pages and posts,
 * produced by the same scripts/generate-sitemap.mjs that builds the site. A
 * route list mirrored into this function would drift the moment a page is
 * added.
 *
 * Only `<loc>` counts: a urlset also carries `<xhtml:link href=…>` hreflang
 * alternates, which point at pages that have their own `<loc>` entry.
 */
export function parseSitemapLocs(xml: string): { kind: "urlset" | "sitemapindex" | "unknown"; locs: string[] } {
  const kind = /<sitemapindex[\s>]/i.test(xml) ? "sitemapindex" : /<urlset[\s>]/i.test(xml) ? "urlset" : "unknown";
  const locs: string[] = [];
  const re = /<loc>\s*([\s\S]*?)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    let v = m[1];
    const cdata = /^<!\[CDATA\[([\s\S]*)\]\]>$/.exec(v);
    v = cdata ? cdata[1].trim() : decodeXml(v);
    if (v) locs.push(v);
  }
  return { kind, locs };
}

/**
 * Keep only absolute URLs on this site's origin, normalized and deduplicated
 * in first-seen order. Compares parsed origins rather than string prefixes: a
 * prefix check would accept "https://hansvanleeuwen.com.evil.example/x".
 * URL Inspection rejects URLs outside the property anyway, so an off-site or
 * relative `<loc>` would only burn a request.
 */
export function inspectableUrls(locs: string[]): string[] {
  const origin = new URL(SITE_ORIGIN).origin;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const loc of locs) {
    let u: URL;
    try {
      u = new URL(loc.trim());
    } catch {
      continue; // relative or malformed — not inspectable as-is
    }
    if (u.origin !== origin) continue;
    if (seen.has(u.href)) continue;
    seen.add(u.href);
    out.push(u.href);
  }
  return out;
}

/**
 * Bound how many URLs one run inspects. At today's size (~34 URLs) every run
 * checks everything. If the site ever outgrows `max`, rotate a window through
 * the sorted list keyed on the day, so every URL is still inspected within
 * ceil(total / max) days instead of the tail silently never being checked.
 */
export function selectInspectionWindow(
  urls: string[],
  max: number,
  dayIndex: number,
): { urls: string[]; total: number; rotated: boolean } {
  const total = urls.length;
  if (total <= max) return { urls: [...urls], total, rotated: false };
  const sorted = [...urls].sort();
  const windows = Math.ceil(total / max);
  const start = (((dayIndex % windows) + windows) % windows) * max;
  const picked: string[] = [];
  for (let i = 0; i < max; i++) picked.push(sorted[(start + i) % total]);
  return { urls: [...new Set(picked)], total, rotated: true };
}

// ---------------------------------------------------------------------------
// Top queries (GSC Search Analytics)
// ---------------------------------------------------------------------------

export interface QueryRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

/**
 * The Search Analytics API has no sort parameter and returns rows ordered by
 * clicks only. On a low-traffic site nearly every query has 0 clicks, so a
 * small `rowLimit` returns an arbitrary sample of tied rows — not the top
 * queries. The caller fetches the full set; this ranks by impressions, then
 * clicks, then the query text (so the order is stable), and keeps the top n.
 */
export function rankTopQueries(rows: QueryRow[], n: number): QueryRow[] {
  return [...rows]
    .sort(
      (a, b) =>
        (b.impressions ?? 0) - (a.impressions ?? 0) ||
        (b.clicks ?? 0) - (a.clicks ?? 0) ||
        String(a.keys?.[0] ?? "").localeCompare(String(b.keys?.[0] ?? "")),
    )
    .slice(0, n);
}

// ---------------------------------------------------------------------------
// Caller authorization
// ---------------------------------------------------------------------------

/**
 * Constant-time string equality over UTF-8 bytes, for comparing a presented
 * bearer against the service-role key. A plain `===` can return early at the
 * first differing byte, leaking how much of a guess was right through timing.
 * Length is compared up front; the key's length is not the secret.
 */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  if (x.length !== y.length || x.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Coverage snapshot bookkeeping
// ---------------------------------------------------------------------------

/**
 * One independently-refreshed part of the coverage snapshot (sitemap totals,
 * or URL Inspection results). A failed refresh keeps the last good data and
 * records the error beside it, so a transient Google failure neither wipes a
 * good snapshot nor hides behind it: the dashboard shows the old numbers, how
 * old they are, and why they are not newer.
 */
export interface CoverageSection<T> {
  data: T | null;
  fetched_at: string | null; // when `data` was last successfully fetched
  error: string | null; // most recent refresh error, cleared on success
  error_at: string | null;
}

// Both branches declare both keys so narrowing never depends on strictNullChecks: the app
// tsconfig runs with `strict: false`, where `if (result.ok)` does not narrow this union.
export type SectionResult<T> = { ok: true; data: T; error?: undefined } | { ok: false; error: string; data?: undefined };

export function applySectionResult<T>(
  prev: CoverageSection<T> | null | undefined,
  result: SectionResult<T>,
  nowIso: string,
): CoverageSection<T> {
  if (result.ok) return { data: result.data, fetched_at: nowIso, error: null, error_at: null };
  return {
    data: prev?.data ?? null,
    fetched_at: prev?.fetched_at ?? null,
    error: result.error ?? "unknown error",
    error_at: nowIso,
  };
}

export interface IndexingIssue {
  url: string;
  verdict: string;
  coverage_state: string | null;
  last_crawl: string | null;
}

export interface IndexingResult {
  checked: number;
  skipped: number;
  total: number;
  rotated: boolean;
  issues: IndexingIssue[];
}

/**
 * Carry forward issues for URLs this run did not successfully re-check. A URL
 * outside today's rotation window, or one whose request was skipped, has no
 * new verdict — dropping its earlier issue would read as "fixed" when it was
 * merely not looked at. URLs no longer in the sitemap are dropped. Sorted by
 * URL for a stable display.
 */
export function mergeIndexingIssues(
  prev: IndexingIssue[] | null | undefined,
  fresh: IndexingIssue[],
  checkedUrls: Iterable<string>,
  currentUrls: Iterable<string>,
): IndexingIssue[] {
  const checked = new Set(checkedUrls);
  const current = new Set(currentUrls);
  const carried = (prev ?? []).filter((i) => !checked.has(i.url) && current.has(i.url));
  const byUrl = new Map<string, IndexingIssue>();
  for (const i of [...carried, ...fresh]) byUrl.set(i.url, i);
  return [...byUrl.values()].sort((a, b) => a.url.localeCompare(b.url));
}

export interface CoverageSnapshot {
  sitemaps?: CoverageSection<SitemapSummary> | null;
  indexing?: CoverageSection<IndexingResult> | null;
}

/**
 * How the coverage attached to a response relates to "now":
 * - "refreshed": recomputed during this request
 * - "fresh": served from a snapshot younger than the coverage TTL
 * - "stale": a snapshot exists but is due for a refresh that did not happen
 * - "missing": no snapshot exists yet
 */
export type CoverageStatus = "fresh" | "refreshed" | "stale" | "missing";

/**
 * Why a refresh that was due (stale snapshot, or an explicit force) did not
 * happen, so the dashboard can say something truer than "stale":
 * - "denied": this caller may not spend URL Inspection quota — only the
 *   service role (the scheduled evaluator) and admins may
 * - "auth_error": the auth lookup itself failed; this is not a denial, retry
 * - "no_token": the caller was allowed, but no Google token was available
 */
export type CoverageBlocked = "denied" | "auth_error" | "no_token" | null;

export function coverageStatus(o: { hasSnapshot: boolean; fresh: boolean; refreshed: boolean }): CoverageStatus {
  if (o.refreshed) return "refreshed";
  if (!o.hasSnapshot) return "missing";
  return o.fresh ? "fresh" : "stale";
}

/**
 * Flatten a coverage snapshot into the `gsc` fields the dashboards read, plus
 * the per-section errors for the payload's `errors` block.
 */
export function coverageFields(
  snap: CoverageSnapshot | null | undefined,
  status: CoverageStatus,
  blocked: CoverageBlocked = null,
): { gsc: Record<string, unknown>; errors: Record<string, string> } {
  const sm = snap?.sitemaps ?? null;
  const ix = snap?.indexing ?? null;
  const gsc: Record<string, unknown> = { coverage_status: status, coverage_blocked: blocked };
  const errors: Record<string, string> = {};
  if (sm?.data) {
    gsc.indexed_pages = sm.data.indexed_pages;
    gsc.submitted_pages = sm.data.submitted_pages;
    gsc.sitemap_warnings = sm.data.sitemap_warnings;
    gsc.sitemap_errors = sm.data.sitemap_errors;
    gsc.sitemaps = sm.data.sitemaps;
    gsc.sitemaps_fetched_at = sm.fetched_at;
  }
  if (sm?.error) errors.sitemaps = sm.error;
  if (ix?.data) {
    gsc.indexing_checked = ix.data.checked;
    gsc.indexing_skipped = ix.data.skipped;
    gsc.indexing_total = ix.data.total;
    gsc.indexing_rotated = ix.data.rotated;
    gsc.indexing_issues = ix.data.issues;
    gsc.indexing_fetched_at = ix.fetched_at;
  }
  if (ix?.error) errors.indexing = ix.error;
  return { gsc, errors };
}
