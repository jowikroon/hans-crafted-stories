// analytics-ga4-gsc — hansvanleeuwen.com Command Center
// Pulls live Google Analytics 4 (Data API) + Search Console (Search Analytics) data,
// caches the assembled dashboard JSON in public.hvl_analytics_cache (key='dashboard'),
// and returns it. Auth to Google via a service-account (secret GOOGLE_SA_KEY, JSON).
//
// Required secrets (Supabase → Project Settings → Edge Functions → Secrets):
//   GOOGLE_SA_KEY   = the full service-account JSON (one line is fine)
// Auto-provided by the platform: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Optional overrides (defaults are correct for hansvanleeuwen.com):
//   GA4_PROPERTY_ID = "395015361"
//   GSC_SITE_URL    = "" (auto-detected via sites.list when empty)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GA4_PROPERTY_ID = Deno.env.get("GA4_PROPERTY_ID") || "395015361";
const GSC_SITE_OVERRIDE = Deno.env.get("GSC_SITE_URL") || "";
const CACHE_KEY = "dashboard";
const TTL_MS = 6 * 60 * 60 * 1000; // 6h

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

type AnyRow = Record<string, unknown> & { dimensionValues?: { value?: string }[]; keys?: string[]; clicks?: number; impressions?: number; position?: number; ctr?: number };

// ---------- helpers ----------
function b64url(bytes: Uint8Array): string {
  const s = btoa(String.fromCharCode(...bytes));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function pemToDer(pem: string): Uint8Array {
  const b64 = pem.replace(/-----BEGIN [^-]+-----/, "").replace(/-----END [^-]+-----/, "").replace(/\s+/g, "");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Mint a Google OAuth2 access token from the service-account JSON.
async function getAccessToken(sa: Record<string, unknown>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly",
    aud: sa.token_uri || "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const enc = new TextEncoder();
  const signingInput = `${b64url(enc.encode(JSON.stringify(header)))}.${b64url(enc.encode(JSON.stringify(claim)))}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(signingInput)));
  const jwt = `${signingInput}.${b64url(sig)}`;
  const res = await fetch(claim.aud, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`token: ${JSON.stringify(data)}`);
  return data.access_token as string;
}

// ---------- GA4 ----------
async function fetchGA4(token: string) {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:batchRunReports`;
  const body = {
    requests: [
      {
        dateRanges: [
          { startDate: "30daysAgo", endDate: "yesterday", name: "cur" },
          { startDate: "60daysAgo", endDate: "31daysAgo", name: "prev" },
        ],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      },
      {
        dateRanges: [{ startDate: "30daysAgo", endDate: "yesterday" }],
        dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 8,
      },
    ],
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`ga4: ${JSON.stringify(data)}`);

  const [trendRep, pagesRep] = data.reports ?? [];
  const series: { date: string; value: number }[] = [];
  let curTotal = 0;
  let prevTotal = 0;
  for (const row of trendRep?.rows ?? []) {
    const rng = row.dimensionValues?.[1]?.value; // dateRange name
    const dateRaw = row.dimensionValues?.[0]?.value ?? "";
    const v = Number(row.metricValues?.[0]?.value ?? 0);
    if (rng === "date_range_1" || rng === "prev") {
      prevTotal += v;
    } else {
      curTotal += v;
      const d = `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`;
      series.push({ date: d, value: v });
    }
  }
  series.sort((a, b) => a.date.localeCompare(b.date));
  const top_pages = (pagesRep?.rows ?? []).map((r: AnyRow) => ({
    path: r.dimensionValues?.[0]?.value ?? "",
    title: r.dimensionValues?.[1]?.value ?? "",
    sessions: Number(r.metricValues?.[0]?.value ?? 0),
  }));
  const change_pct = prevTotal > 0 ? Math.round(((curTotal - prevTotal) / prevTotal) * 1000) / 10 : null;
  return { sessions_30d: curTotal, sessions_prev_30d: prevTotal, sessions_change_pct: change_pct, series, top_pages };
}

// ---------- GSC ----------
async function fetchGSC(token: string) {
  let site = GSC_SITE_OVERRIDE;
  if (!site) {
    const lr = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const ld = await lr.json();
    if (!lr.ok) throw new Error(`gsc sites: ${JSON.stringify(ld)}`);
    const entries: AnyRow[] = ld.siteEntry ?? [];
    const domainMatch = entries.find((e) => e.siteUrl === "sc-domain:hansvanleeuwen.com");
    const anyMatch = entries.find((e) => (e.siteUrl || "").includes("hansvanleeuwen.com"));
    site = (domainMatch || anyMatch || {}).siteUrl || "";
    if (!site) throw new Error(`gsc: no hansvanleeuwen.com property found in ${JSON.stringify(entries.map((e) => e.siteUrl))}`);
  }
  const end = new Date(Date.now() - 3 * 86400000); // GSC lags ~3 days
  const start = new Date(end.getTime() - 27 * 86400000);
  const base = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
  const q = async (payload: unknown) => {
    const r = await fetch(base, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(`gsc query: ${JSON.stringify(d)}`);
    return d;
  };
  const totals = await q({ startDate: ymd(start), endDate: ymd(end), dimensions: [] });
  const queries = await q({ startDate: ymd(start), endDate: ymd(end), dimensions: ["query"], rowLimit: 10 });
  const pages = await q({ startDate: ymd(start), endDate: ymd(end), dimensions: ["page"], rowLimit: 500 });
  const t = totals.rows?.[0] ?? {};
  return {
    site,
    clicks: Math.round(t.clicks ?? 0),
    impressions: Math.round(t.impressions ?? 0),
    ctr: t.ctr != null ? Math.round(t.ctr * 1000) / 10 : null, // %
    position: t.position != null ? Math.round(t.position * 10) / 10 : null,
    pages_with_traffic: (pages.rows ?? []).length,
    queries: (queries.rows ?? []).map((r: AnyRow) => ({
      query: r.keys?.[0] ?? "",
      clicks: Math.round(r.clicks ?? 0),
      impressions: Math.round(r.impressions ?? 0),
      ctr: r.ctr != null ? Math.round(r.ctr * 1000) / 10 : null,
      position: r.position != null ? Math.round(r.position * 10) / 10 : null,
    })),
  };
}

// Index coverage — submitted vs indexed page counts, sourced from the sitemaps
// GSC has on file for the property (HAN-93: "indexed pages count").
//
// `SitemapContent.indexed` is a deprecated field in the Sitemaps API and may
// be omitted entirely from the response — either for every content entry, or
// just some of them (mixed responses happen). Only report the site-wide
// total when EVERY content entry across every sitemap carries a known
// `indexed` value; a partial sum would quietly under-report the real count,
// which is worse than admitting the total is unavailable.
async function fetchSitemapCoverage(token: string, site: string) {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/sitemaps`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const d = await r.json();
  if (!r.ok) throw new Error(`gsc sitemaps: ${JSON.stringify(d)}`);
  const entries: AnyRow[] = d.sitemap ?? [];
  let submitted = 0;
  let indexed = 0;
  let contentEntryCount = 0;
  let allIndexedKnown = true;
  const sitemaps = entries.map((s: AnyRow) => {
    const contents = (s.contents as { type?: string; submitted?: string | number; indexed?: string | number }[]) ?? [];
    let subForSitemap = 0;
    let idxForSitemap = 0;
    let idxKnown = contents.length > 0;
    for (const c of contents) {
      subForSitemap += Number(c.submitted ?? 0);
      contentEntryCount++;
      if (c.indexed != null) {
        idxForSitemap += Number(c.indexed);
      } else {
        idxKnown = false;
        allIndexedKnown = false;
      }
    }
    submitted += subForSitemap;
    indexed += idxForSitemap;
    return {
      path: s.path as string,
      submitted: subForSitemap,
      indexed: idxKnown ? idxForSitemap : null,
      warnings: Number(s.warnings ?? 0),
      errors: Number(s.errors ?? 0),
      last_downloaded: (s.lastDownloaded as string) ?? null,
    };
  });
  const indexedAvailable = contentEntryCount > 0 && allIndexedKnown;
  return { indexed_pages: indexedAvailable ? indexed : null, submitted_pages: submitted, sitemaps };
}

// Per-URL indexing issues via the URL Inspection API, sampled over the site's
// most-recently-updated published posts plus core static pages (HAN-93:
// "indexing issues are surfaced automatically"). Bounded to stay well under
// the API's per-minute quota.
//
// A request that errors (403/429/etc.) is not evidence the page is indexed —
// it's evidence we couldn't check. `checked` only counts URLs we actually got
// a verdict for, and if every request in the sample failed we throw instead
// of returning a "checked: N, 0 issues" result that would read as "all clean".
async function fetchIndexingIssues(token: string, site: string, sampleUrls: string[]) {
  const inspectUrl = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";
  const issues: { url: string; verdict: string; coverage_state: string | null; last_crawl: string | null }[] = [];
  let succeeded = 0;
  let failed = 0;
  for (const url of sampleUrls) {
    const r = await fetch(inspectUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inspectionUrl: url, siteUrl: site }),
    });
    const d = await r.json();
    if (!r.ok) { failed++; continue; } // couldn't inspect this URL — not the same as "indexed"
    succeeded++;
    const idx = d.inspectionResult?.indexStatusResult ?? {};
    const verdict = (idx.verdict as string) ?? "UNKNOWN";
    if (verdict !== "PASS") {
      issues.push({
        url,
        verdict,
        coverage_state: (idx.coverageState as string) ?? null,
        last_crawl: (idx.lastCrawlTime as string) ?? null,
      });
    }
  }
  if (sampleUrls.length > 0 && succeeded === 0) {
    throw new Error(`url inspection: all ${failed} sampled requests failed`);
  }
  return { checked: succeeded, skipped: failed, issues };
}

// ---------- cache (PostgREST, service-role) ----------
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
async function readCache() {
  const r = await fetch(`${SB_URL}/rest/v1/hvl_analytics_cache?key=eq.${CACHE_KEY}&select=data,fetched_at`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  if (!r.ok) return null;
  const rows = await r.json();
  return rows?.[0] ?? null;
}
async function writeCache(data: unknown) {
  await fetch(`${SB_URL}/rest/v1/hvl_analytics_cache?on_conflict=key`, {
    method: "POST",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({ key: CACHE_KEY, data, fetched_at: new Date().toISOString() }),
  });
}

const SITE_ORIGIN = "https://hansvanleeuwen.com";
const INDEXING_SAMPLE_SIZE = 15;

// Sample of URLs to run through the URL Inspection API: core static pages
// plus the most recently updated published posts (most likely to still be
// mid-crawl, so most likely to surface a real coverage issue).
//
// Posts with an external canonical_url are deliberately excluded — same rule
// as scripts/generate-sitemap.mjs — since their /writing/<slug> copy is
// intentionally not the canonical URL and would falsely report as a
// "not indexed" issue when GSC (correctly) indexes the external canonical
// instead.
// `startsWith(SITE_ORIGIN)` would be a substring-sanitization bug — a
// canonical_url like "https://hansvanleeuwen.com.evil.example/x" passes a
// prefix check but is not this origin. Compare parsed origins instead.
function isSelfCanonical(canonicalUrl: string | null): boolean {
  if (!canonicalUrl) return true;
  try {
    return new URL(canonicalUrl).origin === new URL(SITE_ORIGIN).origin;
  } catch {
    return false;
  }
}

async function sampleUrlsForInspection(): Promise<string[]> {
  const staticUrls = [`${SITE_ORIGIN}/`, `${SITE_ORIGIN}/writing`, `${SITE_ORIGIN}/about`, `${SITE_ORIGIN}/work`];
  const target = INDEXING_SAMPLE_SIZE - staticUrls.length;
  try {
    // Overfetch candidates before filtering out externally-canonical posts —
    // filtering post-limit would silently shrink the sample (or skip recent
    // posts entirely) whenever recently-updated posts happen to be
    // externally canonical, instead of backfilling from older ones.
    const r = await fetch(
      `${SB_URL}/rest/v1/blog_posts?select=slug,canonical_url&status=eq.published&published=eq.true&order=updated_at.desc&limit=${target * 4}`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
    );
    if (!r.ok) return staticUrls;
    const rows: { slug: string; canonical_url: string | null }[] = await r.json();
    const selfCanonical = rows.filter((p) => isSelfCanonical(p.canonical_url)).slice(0, target);
    // Prefer the post's own same-origin canonical_url when it differs from
    // the slug URL (e.g. /writing/custom-canonical) — inspecting the slug
    // URL instead would report a false issue for a page GSC correctly
    // treats as an alternate of its declared canonical.
    return [...staticUrls, ...selfCanonical.map((p) => p.canonical_url || `${SITE_ORIGIN}/writing/${p.slug}`)];
  } catch {
    return staticUrls;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  let force = false;
  try {
    if (req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      force = !!b?.force;
    } else {
      force = new URL(req.url).searchParams.get("force") === "1";
    }
  } catch (_) { /* ignore */ }

  // Serve fresh cache unless forced.
  if (!force) {
    const cached = await readCache();
    if (cached && Date.now() - new Date(cached.fetched_at).getTime() < TTL_MS) {
      return json({ ...cached.data, cached: true, fetched_at: cached.fetched_at });
    }
  }

  const saRaw = Deno.env.get("GOOGLE_SA_KEY");
  if (!saRaw) {
    // Surface a clear, non-secret status so the UI can show "connect" state.
    return json({ ok: false, configured: false, error: "GOOGLE_SA_KEY not set" }, 200);
  }

  const payload: Record<string, unknown> = { ok: true, configured: true, generated_at: new Date().toISOString(), range_days: 30, errors: {} };
  try {
    const sa = JSON.parse(saRaw);
    const token = await getAccessToken(sa);
    try { payload.ga4 = await fetchGA4(token); } catch (e) { payload.errors.ga4 = String(e); }
    try {
      const gsc = await fetchGSC(token) as Record<string, unknown>;
      try {
        const coverage = await fetchSitemapCoverage(token, gsc.site as string);
        gsc.indexed_pages = coverage.indexed_pages;
        gsc.submitted_pages = coverage.submitted_pages;
        gsc.sitemaps = coverage.sitemaps;
      } catch (e) { (payload.errors as Record<string, string>).sitemaps = String(e); }
      try {
        const sampleUrls = await sampleUrlsForInspection();
        const { checked, skipped, issues } = await fetchIndexingIssues(token, gsc.site as string, sampleUrls);
        gsc.indexing_checked = checked;
        gsc.indexing_skipped = skipped;
        gsc.indexing_issues = issues;
      } catch (e) { (payload.errors as Record<string, string>).indexing = String(e); }
      payload.gsc = gsc;
    } catch (e) { payload.errors.gsc = String(e); }
    await writeCache(payload);
    return json({ ...payload, cached: false });
  } catch (e) {
    return json({ ok: false, configured: true, error: String(e) }, 200);
  }
});
