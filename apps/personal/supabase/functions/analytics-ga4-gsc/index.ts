// analytics-ga4-gsc v9 — hansvanleeuwen.com Command Center
//
// v9 (HAN-93): INDEXATIE. Bovenop v8, zonder het v8-contract te wijzigen:
//   - gsc.indexed_pages / submitted_pages uit de GSC Sitemaps API (sitemap-indexen uitgeklapt)
//   - gsc.indexing_issues: elke URL uit de eigen sitemap.xml door URL Inspection
//   - beide zijn site-breed, niet per bereik: één snapshot (cache-sleutel "gsc-coverage", 12u TTL),
//     samengevoegd in de gsc van elk antwoord. Alleen service-role (de dashboard-evaluator-cron)
//     en admins mogen hem verversen: URL Inspection heeft een dagquota en de anon key is publiek.
//   - top-queries gerangschikt op vertoningen i.p.v. een willekeurige greep uit 0-klik-rijen
//   - een standaardbereik-antwoord wordt ook als "dashboard" weggeschreven, de sleutel die
//     AnalyticsMode en SCBriefs direct uit de tabel lezen (v8 schreef die niet meer).
// v8 (2026-08-10): ECHT DATUMBEREIK. v7 negeerde elke parameter en zat vast op 30 dagen; daardoor kon
//   geen enkel dashboard een periodefilter tonen zonder te liegen. Nu:
//     - from/to (YYYY-MM-DD), standaard de laatste 14 VOLLEDIGE dagen t/m gisteren, Europe/Amsterdam
//     - vergelijkperiode automatisch even lang, direct ervoor  (compare: prev | yoy | none)
//     - cache-sleutel per bereik (anders serveer je stale data van een ander venster)
//     - meta.completeness meldt GSC-vertraging en of het venster is ingekort
//   v7-velden (sessions_30d etc.) blijven bestaan voor terugwaartse compatibiliteit.
// v7: service-account eerst (google_sa_key), user-OAuth als fallback.
/* eslint-disable @typescript-eslint/no-explicit-any -- de 17 `any`'s komen uit de v8-productiecode
   (Google-JSON, supabase-client, bereik-object); die typeren is een aparte refactor. De HAN-93-laag
   is any-vrij, en `deno check` (strict) geeft 0 fouten op het geheel. */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  SITE_ORIGIN,
  applySectionResult,
  coverageFields,
  coverageStatus,
  dedupeSitemaps,
  inspectableUrls,
  parseSitemapLocs,
  rankTopQueries,
  selectInspectionWindow,
  summarizeSitemaps,
  timingSafeEqualStr,
  type CoverageBlocked,
  type CoverageSnapshot,
  type IndexingIssue,
  type IndexingResult,
  type QueryRow,
  type SectionResult,
  type SitemapEntry,
  type SitemapSummary,
} from "./coverage.ts";

const GA4_PROPERTY_ID = Deno.env.get("GA4_PROPERTY_ID") || "395015361";
const GSC_SITE_OVERRIDE = Deno.env.get("GSC_SITE_URL") || "";
const TTL_MS = 6 * 60 * 60 * 1000;
const TZ = "Europe/Amsterdam";
const GSC_LAG_DAYS = 3;

// HAN-93 — site-brede indexatie-snapshot
const COVERAGE_KEY = "gsc-coverage";
const COVERAGE_TTL_MS = 12 * 60 * 60 * 1000;
const DASHBOARD_ALIAS_KEY = "dashboard"; // gelezen door AnalyticsMode en SCBriefs
const INSPECT_MAX = 60; // URL's per run; ~34 vandaag, daarboven roteert het venster per dag
const INSPECT_CONCURRENCY = 4; // ruim onder URL Inspection's 600/min
const FETCH_TIMEOUT_MS = 15_000; // één hangende Google-call mag de 150s wall-clock niet opeten
const INSPECT_BUDGET_MS = 60_000; // na dit budget geen nieuwe inspecties meer; de rest telt als skipped
const TOP_QUERIES = 15;

// Zelfde allowlist als src/hooks/useAdmin.tsx (inclusief de ingebakken fallback), zodat CMS en
// server het eens zijn over wie admin is. De CMS leest VITE_ADMIN_EMAILS (build-time); een edge
// function kan alleen secrets lezen, dus beide namen worden geaccepteerd.
const ADMIN_EMAILS = [
  ...(Deno.env.get("ADMIN_EMAILS") || "").split(","),
  ...(Deno.env.get("VITE_ADMIN_EMAILS") || "").split(","),
  "hansvl3@gmail.com",
]
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ---------- datum, altijd Europe/Amsterdam ----------
function ymdIn(d: Date, tz = TZ) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
const parseYmd = (s: string) => new Date(`${s}T12:00:00Z`);
const addDays = (s: string, n: number) => ymdIn(new Date(parseYmd(s).getTime() + n * 86400000));
const daysBetween = (a: string, b: string) =>
  Math.round((parseYmd(b).getTime() - parseYmd(a).getTime()) / 86400000) + 1;
const isYmd = (s: unknown) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

/** Standaard: laatste 14 VOLLEDIGE dagen, eindigend gisteren. Vandaag telt nooit mee. */
function resolveRange(body: Record<string, any>, url: URL) {
  const p = (k: string) => body?.[k] ?? url.searchParams.get(k) ?? undefined;
  const today = ymdIn(new Date());
  const yesterday = addDays(today, -1);

  let to = isYmd(p("to")) ? String(p("to")) : yesterday;
  let from = isYmd(p("from")) ? String(p("from")) : addDays(to, -13);
  if (parseYmd(from) > parseYmd(to)) [from, to] = [to, from];

  // vandaag en de toekomst afkappen: incomplete dagen vervuilen elke vergelijking
  let clamped = false;
  if (parseYmd(to) >= parseYmd(today)) { to = yesterday; clamped = true; }
  if (parseYmd(from) > parseYmd(to)) from = addDays(to, -13);

  const len = daysBetween(from, to);
  const compare = (["prev", "yoy", "none"].includes(String(p("compare")))) ? String(p("compare")) : "prev";

  let prevFrom: string | null = null, prevTo: string | null = null;
  if (compare === "prev") { prevTo = addDays(from, -1); prevFrom = addDays(prevTo, -(len - 1)); }
  else if (compare === "yoy") { prevFrom = addDays(from, -365); prevTo = addDays(to, -365); }

  return { from, to, days: len, compare, prevFrom, prevTo, today, clamped };
}

// ---------- service-account token ----------
function pemToDer(pem: string) {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}
function b64url(data: string | ArrayBuffer) {
  const bin = typeof data === "string" ? data : String.fromCharCode(...new Uint8Array(data));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function getServiceAccountToken(admin: any) {
  const { data } = await admin.from("cms_secrets").select("value").eq("name", "google_sa_key").maybeSingle();
  if (!data?.value) return { token: null, reason: "sa_key_missing" };
  let sa: any;
  try { sa = JSON.parse(data.value); } catch { return { token: null, reason: "sa_key_invalid_json" }; }
  try {
    const now = Math.floor(Date.now() / 1000);
    const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claims = b64url(JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly",
      aud: sa.token_uri || "https://oauth2.googleapis.com/token",
      iat: now, exp: now + 3600,
    }));
    const key = await crypto.subtle.importKey("pkcs8", pemToDer(sa.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claims}`));
    const jwt = `${header}.${claims}.${b64url(sig)}`;
    const r = await fetch(sa.token_uri || "https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
    });
    const t = await r.json();
    if (!r.ok || !t.access_token) return { token: null, reason: `sa_token_failed: ${JSON.stringify(t).slice(0, 160)}` };
    return { token: t.access_token, reason: null };
  } catch (e) { return { token: null, reason: `sa_sign_failed: ${String(e).slice(0, 120)}` }; }
}
async function getUserGoogleToken(sb: any, userId: string) {
  const { data: row } = await sb.from("user_google_tokens").select("access_token, refresh_token, expires_at, scopes").eq("user_id", userId).single();
  if (!row) return { token: null, reason: "google_not_connected" };
  if (new Date(row.expires_at).getTime() > Date.now() + 60_000) return { token: row.access_token };
  const cid = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID"), csec = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
  if (!cid || !csec) return { token: null, reason: "oauth_not_configured" };
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: cid, client_secret: csec, refresh_token: row.refresh_token, grant_type: "refresh_token" }),
  });
  if (!r.ok) return { token: null, reason: "refresh_failed" };
  const t = await r.json();
  await sb.from("user_google_tokens").update({ access_token: t.access_token, expires_at: new Date(Date.now() + (t.expires_in || 3600) * 1000).toISOString(), updated_at: new Date().toISOString() }).eq("user_id", userId);
  return { token: t.access_token };
}

// ---------- GA4 met expliciet bereik ----------
async function fetchGA4(token: string, R: any) {
  const ranges: any[] = [{ startDate: R.from, endDate: R.to, name: "cur" }];
  if (R.prevFrom) ranges.push({ startDate: R.prevFrom, endDate: R.prevTo, name: "prev" });

  const body = {
    requests: [
      { dateRanges: ranges, dimensions: [{ name: "date" }], metrics: [{ name: "sessions" }], orderBys: [{ dimension: { dimensionName: "date" } }], limit: 400 },
      { dateRanges: [{ startDate: R.from, endDate: R.to }], dimensions: [{ name: "pagePath" }, { name: "pageTitle" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 10 },
      { dateRanges: [{ startDate: R.from, endDate: R.to }], dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 10 },
      { dateRanges: ranges, metrics: [{ name: "totalUsers" }, { name: "screenPageViews" }, { name: "bounceRate" }, { name: "averageSessionDuration" }] },
    ],
  };
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:batchRunReports`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`ga4: ${JSON.stringify(data).slice(0, 300)}`);
  const [trend, pages, channels, tot] = data.reports || [];

  const isPrev = (row: any) => {
    const v = row?.dimensionValues?.[row.dimensionValues.length - 1]?.value;
    return v === "prev" || v === "date_range_1";
  };
  const series: { date: string; value: number }[] = [];
  let cur = 0, prev = 0;
  for (const row of trend?.rows ?? []) {
    const raw = row.dimensionValues?.[0]?.value ?? "";
    const v = Number(row.metricValues?.[0]?.value ?? 0);
    if (isPrev(row)) { prev += v; continue; }
    cur += v;
    series.push({ date: `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`, value: v });
  }
  series.sort((a, b) => a.date.localeCompare(b.date));

  const totRows = tot?.rows ?? [];
  const metricsOf = (i: number) => ({
    users: Number(totRows[i]?.metricValues?.[0]?.value ?? 0),
    pageviews: Number(totRows[i]?.metricValues?.[1]?.value ?? 0),
    bounce_rate: Math.round(Number(totRows[i]?.metricValues?.[2]?.value ?? 0) * 1000) / 10,
    avg_session_sec: Math.round(Number(totRows[i]?.metricValues?.[3]?.value ?? 0)),
  });
  const pct = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 1000) / 10 : null);

  return {
    current: { sessions: cur, ...metricsOf(0) },
    previous: R.prevFrom ? { sessions: prev, ...metricsOf(1) } : null,
    change_pct: R.prevFrom ? { sessions: pct(cur, prev) } : null,
    series,
    top_pages: (pages?.rows ?? []).map((r: any) => ({
      path: r.dimensionValues?.[0]?.value ?? "", title: r.dimensionValues?.[1]?.value ?? "",
      sessions: Number(r.metricValues?.[0]?.value ?? 0),
    })),
    channels: (channels?.rows ?? []).map((r: any) => ({
      channel: r.dimensionValues?.[0]?.value ?? "", sessions: Number(r.metricValues?.[0]?.value ?? 0),
    })),
    // v7-compatibiliteit
    sessions_30d: cur, sessions_prev_30d: prev, sessions_change_pct: R.prevFrom ? pct(cur, prev) : null,
  };
}

// ---------- GSC met expliciet bereik + vertragingsclamp ----------
// Losgetrokken uit fetchGSC zodat de indexatie-snapshot dezelfde property gebruikt.
async function resolveGscSite(token: string): Promise<string> {
  if (GSC_SITE_OVERRIDE) return GSC_SITE_OVERRIDE;
  const lr = await fetch("https://www.googleapis.com/webmasters/v3/sites", { headers: { Authorization: `Bearer ${token}` } });
  const ld = await lr.json();
  if (!lr.ok) throw new Error(`gsc sites: ${JSON.stringify(ld).slice(0, 200)}`);
  const e = ld.siteEntry || [];
  const site = (e.find((x: any) => x.siteUrl === "sc-domain:hansvanleeuwen.com") || e.find((x: any) => (x.siteUrl || "").includes("hansvanleeuwen.com")) || {}).siteUrl || "";
  if (!site) throw new Error("gsc: geen hansvanleeuwen.com property");
  return site;
}

async function fetchGSC(token: string, R: any, site: string) {
  const lastReliable = addDays(R.today, -GSC_LAG_DAYS);
  const to = parseYmd(R.to) > parseYmd(lastReliable) ? lastReliable : R.to;
  const truncated = to !== R.to;
  const from = parseYmd(R.from) > parseYmd(to) ? to : R.from;

  const base = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
  const q = async (payload: any) => {
    const r = await fetch(base, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await r.json();
    if (!r.ok) throw new Error(`gsc query: ${JSON.stringify(d).slice(0, 200)}`);
    return d;
  };
  const shape = (t: any) => ({
    clicks: Math.round(t?.clicks ?? 0), impressions: Math.round(t?.impressions ?? 0),
    ctr: t?.ctr != null ? Math.round(t.ctr * 1000) / 10 : null,
    position: t?.position != null ? Math.round(t.position * 10) / 10 : null,
  });

  const totals = await q({ startDate: from, endDate: to, dimensions: [] });
  // De API sorteert alleen op klikken en kent geen sorteerparameter. Op deze site hebben bijna
  // alle queries 0 klikken, dus rowLimit 15 gaf een willekeurige greep uit gelijke rijen, niet
  // de top. Haal de volledige set op en rangschik zelf (rankTopQueries, getest).
  const queries = await q({ startDate: from, endDate: to, dimensions: ["query"], rowLimit: 25000 });
  const pages = await q({ startDate: from, endDate: to, dimensions: ["page"], rowLimit: 500 });

  let previous = null;
  if (R.prevFrom) {
    const pTo = parseYmd(R.prevTo) > parseYmd(lastReliable) ? lastReliable : R.prevTo;
    const pt = await q({ startDate: R.prevFrom, endDate: pTo, dimensions: [] });
    previous = shape(pt.rows?.[0]);
  }
  const current = shape(totals.rows?.[0]);
  const pct = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 1000) / 10 : null);

  return {
    site, range: { from, to }, truncated, last_reliable_day: lastReliable,
    current, previous,
    change_pct: previous ? { clicks: pct(current.clicks, previous.clicks), impressions: pct(current.impressions, previous.impressions) } : null,
    pages_with_traffic: (pages.rows ?? []).length,
    queries: rankTopQueries((queries.rows ?? []) as QueryRow[], TOP_QUERIES).map((r: any) => ({ query: r.keys?.[0] ?? "", ...shape(r) })),
    ...current, // v7-compatibiliteit
  };
}

async function readCache(key: string) {
  const r = await fetch(`${SB_URL}/rest/v1/hvl_analytics_cache?key=eq.${encodeURIComponent(key)}&select=data,fetched_at`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
  if (!r.ok) return null;
  return (await r.json())?.[0] ?? null;
}
async function writeCache(key: string, data: unknown, fetchedAt?: string) {
  await fetch(`${SB_URL}/rest/v1/hvl_analytics_cache?on_conflict=key`, {
    method: "POST",
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ key, data, fetched_at: fetchedAt ?? new Date().toISOString() }),
  });
}

// ---------- HAN-93: indexatie-snapshot ----------

// Status vóór parse: Google's frontend serveert bij 502/503 HTML, en een JSON-SyntaxError
// verstopt dan de echte HTTP-status.
async function googleGet(url: string, token: string): Promise<{ sitemap?: SitemapEntry[] }> {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  const text = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

async function settle<T>(fn: () => Promise<T>): Promise<SectionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    return { ok: false, error: String(e).slice(0, 300) };
  }
}

// Ingediend vs geïndexeerd uit de GSC Sitemaps API. Een sitemap-index wordt uitgeklapt via
// ?sitemapIndex=, zodat zijn kinderen als gewone bladeren meetellen; zonder dat bleef een
// index-only property voor altijd null en telde een index naast een losse sitemap maar half.
// Mislukt één kind-lijst, dan faalt de hele sectie: een deelsom als sitetotaal is erger dan
// "onbekend" (de vorige snapshot blijft dan staan, met de fout erbij).
async function fetchSitemapCoverage(token: string, site: string): Promise<SitemapSummary> {
  const base = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/sitemaps`;
  const top = ((await googleGet(base, token)).sitemap ?? []) as SitemapEntry[];
  const lists: SitemapEntry[][] = [top];
  const expanded = new Set<string>();
  let frontier = top.filter((e) => e.isSitemapsIndex && e.path);
  for (let depth = 0; depth < 2 && frontier.length > 0; depth++) {
    const next: SitemapEntry[] = [];
    for (const idx of frontier) {
      if (expanded.has(idx.path!)) continue;
      expanded.add(idx.path!);
      const children = ((await googleGet(`${base}?sitemapIndex=${encodeURIComponent(idx.path!)}`, token)).sitemap ?? []) as SitemapEntry[];
      lists.push(children);
      next.push(...children.filter((c) => c.isSitemapsIndex && c.path && !expanded.has(c.path)));
    }
    frontier = next;
  }
  return summarizeSitemaps(dedupeSitemaps(lists));
}

// Wat URL Inspection controleert: precies de URL's uit de eigen sitemap.xml (EN + /nl/,
// dienstpagina's, posts), in de vorm die Google ter indexatie krijgt. Een gespiegelde
// routelijst hier zou uit de pas lopen zodra er een pagina bijkomt.
async function fetchSitemapUrls(): Promise<string[]> {
  const get = async (u: string) => {
    const r = await fetch(u, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!r.ok) throw new Error(`${u}: HTTP ${r.status}`);
    return parseSitemapLocs(await r.text());
  };
  const root = await get(`${SITE_ORIGIN}/sitemap.xml`);
  let locs = root.locs;
  if (root.kind === "sitemapindex") {
    const children = inspectableUrls(root.locs);
    if (children.length > 50) throw new Error(`sitemap.xml: ${children.length} kind-sitemaps, meer dan de 50 die deze functie ophaalt`);
    locs = [];
    for (const child of children) locs.push(...(await get(child)).locs);
  }
  const urls = inspectableUrls(locs);
  if (urls.length === 0) throw new Error("sitemap.xml: geen inspecteerbare URL's");
  return urls;
}

// Een mislukt verzoek (403/429/5xx/timeout) is geen bewijs dat de pagina geïndexeerd is, alleen
// dat we niet konden kijken: `checked` telt alleen echte oordelen, `skipped` de rest, en als
// álles mislukt gooit dit in plaats van "0 problemen" te melden.
async function fetchIndexingIssues(token: string, site: string, urls: string[], total: number, rotated: boolean): Promise<IndexingResult> {
  const endpoint = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";
  const issues: IndexingIssue[] = [];
  let succeeded = 0;
  let failed = 0;
  let next = 0;
  // Samen met de 15s-timeout per call begrenst dit de lus, ook als Google op alles blijft hangen:
  // anders loopt de functie tegen de 150s aan en wordt er niets gecachet.
  const deadline = Date.now() + INSPECT_BUDGET_MS;
  const worker = async () => {
    while (next < urls.length) {
      const url = urls[next++];
      if (Date.now() > deadline) { failed++; continue; }
      try {
        const r = await fetch(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ inspectionUrl: url, siteUrl: site }),
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        if (!r.ok) { failed++; continue; }
        const d = await r.json();
        succeeded++;
        const idx = d?.inspectionResult?.indexStatusResult ?? {};
        const verdict = (idx.verdict as string) ?? "UNKNOWN";
        if (verdict !== "PASS") {
          issues.push({ url, verdict, coverage_state: idx.coverageState ?? null, last_crawl: idx.lastCrawlTime ?? null });
        }
      } catch {
        failed++;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(INSPECT_CONCURRENCY, urls.length) }, worker));
  if (urls.length > 0 && succeeded === 0) throw new Error(`url inspection: alle ${failed} verzoeken mislukt`);
  issues.sort((a, b) => a.url.localeCompare(b.url));
  return { checked: succeeded, skipped: failed, total, rotated, issues };
}

// Beide secties onafhankelijk: een falende sectie houdt haar vorige data, met de fout erbij.
async function refreshCoverage(token: string, knownSite: string | null, prev: CoverageSnapshot | null | undefined) {
  const now = new Date().toISOString();
  let site = knownSite;
  if (!site) {
    const s = await settle(() => resolveGscSite(token));
    if (!s.ok) {
      const fail = { ok: false as const, error: s.error };
      return { snap: { sitemaps: applySectionResult(prev?.sitemaps, fail, now), indexing: applySectionResult(prev?.indexing, fail, now) }, anyOk: false };
    }
    site = s.data;
  }
  const gscSite = site;
  const [sm, ix] = await Promise.all([
    settle(() => fetchSitemapCoverage(token, gscSite)),
    settle(async () => {
      const all = await fetchSitemapUrls();
      const win = selectInspectionWindow(all, INSPECT_MAX, Math.floor(Date.now() / 86_400_000));
      return fetchIndexingIssues(token, gscSite, win.urls, win.total, win.rotated);
    }),
  ]);
  const snap: CoverageSnapshot = {
    sitemaps: applySectionResult(prev?.sitemaps, sm, now),
    indexing: applySectionResult(prev?.indexing, ix, now),
  };
  return { snap, anyOk: sm.ok || ix.ok };
}

// Wie mag de snapshot verversen (en dus URL Inspection-quota uitgeven)?
// - "service": de service-role key. De dashboard-evaluator-cron (pg_cron, elke 6u) roept zo aan;
//   dat is geen gebruikerssessie, dus /auth/v1/user zou hem altijd weigeren en niets zou de
//   indexatie ooit automatisch verversen. Constant-time vergelijking.
// - "admin": zelfde regels als useAdmin.tsx, eerst de allowlist, dan has_role.
// - "error" is geen weigering: een haperende auth-lookup krijgt een eigen melding.
type CallerAuth = "service" | "admin" | "denied" | "error";
// Alleen wat callerAuth gebruikt; ReturnType<typeof createClient> is de generieke client en
// wist daardoor het parametertype van rpc().
interface AuthClient {
  auth: {
    getUser(jwt: string): Promise<{
      data: { user: { id: string; email?: string | null; is_anonymous?: boolean } | null };
      error: { status?: number } | null;
    }>;
  };
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }>;
}
async function callerAuth(req: Request, admin: AuthClient): Promise<CallerAuth> {
  const bearer = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!bearer) return "denied";
  if (SB_KEY && timingSafeEqualStr(bearer, SB_KEY)) return "service";
  try {
    const { data, error } = await admin.auth.getUser(bearer);
    if (error) {
      const st = (error as { status?: number }).status;
      return typeof st === "number" && st >= 400 && st < 500 ? "denied" : "error";
    }
    const user = data?.user;
    if (!user?.id || user.is_anonymous) return "denied";
    const email = String(user.email ?? "").trim().toLowerCase();
    if (email && ADMIN_EMAILS.includes(email)) return "admin";
    const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (roleErr) return "error";
    return isAdmin === true ? "admin" : "denied";
  } catch {
    return "error";
  }
}

// Een snapshot waarvan álle secties faalden zet de TTL-klok niet vooruit: de fouten worden wel
// vastgelegd, maar de volgende cron-run of admin-refresh probeert het meteen opnieuw.
async function storeCoverage(
  result: { snap: CoverageSnapshot; anyOk: boolean },
  prev: { data: CoverageSnapshot; fetched_at: string } | null,
): Promise<{ data: CoverageSnapshot; fetched_at: string }> {
  const fetchedAt = result.anyOk ? new Date().toISOString() : prev?.fetched_at ?? new Date(0).toISOString();
  await writeCache(COVERAGE_KEY, result.snap, fetchedAt);
  return { data: result.snap, fetched_at: fetchedAt };
}

// AnalyticsMode en SCBriefs lezen de tabel direct op sleutel "dashboard"; v8 schreef die niet
// meer (alleen per-bereik-sleutels), waardoor beide sinds 2026-08-10 bevroren data toonden.
// fetched_at = generated_at van de verkeersdata, zodat "synced" niet jonger oogt dan de data.
async function writeAlias(response: Record<string, unknown>) {
  const { cached: _cached, fetched_at: _fetchedAt, ...data } = response;
  await writeCache(DASHBOARD_ALIAS_KEY, data, (response.generated_at as string) ?? undefined);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = new URL(req.url);
  let body: Record<string, any> = {};
  if (req.method === "POST") body = await req.json().catch(() => ({}));
  const force = body.force === true || url.searchParams.get("force") === "1";

  const R = resolveRange(body, url);
  const cacheKey = `dashboard:${R.from}:${R.to}:${R.compare}`;
  // Standaardbereik = geen expliciete from/to/compare (zo roept de cron aan). Alleen dat antwoord
  // gaat naar de "dashboard"-alias; een eigen periode van /dashboards/hvl mag die niet overschrijven.
  const isDefaultRange = ["from", "to", "compare"].every((k) => (body?.[k] ?? url.searchParams.get(k)) == null);
  const admin = createClient(SB_URL, SB_KEY);

  // HAN-93: de indexatie-snapshot is site-breed, niet per bereik.
  let covRow: { data: CoverageSnapshot; fetched_at: string } | null = await readCache(COVERAGE_KEY).catch(() => null);
  const covFresh = !!covRow && Date.now() - new Date(covRow.fetched_at).getTime() < COVERAGE_TTL_MS;
  const wantCoverage = force || !covFresh;
  const auth: CallerAuth | null = wantCoverage ? await callerAuth(req, admin) : null;
  const mayRefreshCoverage = auth === "service" || auth === "admin";
  let refreshed = false;
  let blocked: CoverageBlocked = !wantCoverage || mayRefreshCoverage ? null : auth === "error" ? "auth_error" : "denied";
  const withCoverage = (p: Record<string, unknown>) => {
    const status = coverageStatus({ hasSnapshot: !!covRow, fresh: covFresh, refreshed });
    const cf = coverageFields(covRow?.data, status, blocked);
    const gsc = (p.gsc as Record<string, unknown> | undefined) ?? {};
    const errors = (p.errors as Record<string, string> | undefined) ?? {};
    return { ...p, gsc: { ...gsc, ...cf.gsc }, errors: { ...errors, ...cf.errors } };
  };

  let rangeCached: { data: Record<string, unknown>; fetched_at: string } | null = null;
  if (!force) {
    const c = await readCache(cacheKey);
    if (c && Date.now() - new Date(c.fetched_at).getTime() < TTL_MS) rangeCached = c;
  }
  if (rangeCached && !mayRefreshCoverage) {
    return json(withCoverage({ ...rangeCached.data, cached: true, fetched_at: rangeCached.fetched_at }));
  }

  let { token, reason } = await getServiceAccountToken(admin);
  let tokenSource: string | null = token ? "service_account" : null;
  if (!token) {
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    const { data: { user } } = await admin.auth.getUser(jwt);
    if (user) {
      const u = await getUserGoogleToken(admin, user.id);
      if (u.token) { token = u.token; tokenSource = "user_oauth"; reason = null; }
      else reason = `${reason} | ${u.reason}`;
    }
  }
  if (!token) {
    if (mayRefreshCoverage) blocked = "no_token";
    const c = rangeCached ?? (await readCache(cacheKey));
    const base = { ok: false, configured: false, reason: reason || "no_token", error: "Geen Google-toegang." };
    return json(withCoverage(c ? { ...(c.data as Record<string, unknown>), ...base, cached: true } : base), 200);
  }

  // Bereik vers uit de cache: alleen de snapshot hoeft nog ververst (cron met verse bereik-cache).
  if (rangeCached) {
    const cachedSite = (rangeCached.data.gsc as { site?: string } | undefined)?.site ?? null;
    const res = await refreshCoverage(token, cachedSite, covRow?.data);
    covRow = await storeCoverage(res, covRow);
    refreshed = res.anyOk; // alles mislukt = nog steeds stale, met de fouten erbij
    const response = withCoverage({ ...rangeCached.data, cached: true, fetched_at: rangeCached.fetched_at });
    if (isDefaultRange) await writeAlias(response);
    return json(response);
  }

  const payload: Record<string, any> = {
    ok: true, configured: true, version: 9, token_source: tokenSource,
    generated_at: new Date().toISOString(),
    range: { from: R.from, to: R.to, days: R.days, compare: R.compare, prev_from: R.prevFrom, prev_to: R.prevTo, timezone: TZ },
    range_days: R.days, // v7-compatibiliteit
    errors: {},
  };
  try { payload.ga4 = await fetchGA4(token, R); } catch (e) { payload.errors.ga4 = String(e).slice(0, 300); }
  let site: string | null = null;
  try { site = await resolveGscSite(token); payload.gsc = await fetchGSC(token, R, site); } catch (e) { payload.errors.gsc = String(e).slice(0, 300); }

  // Meetbetrouwbaarheid: GA4-sessies horen niet structureel onder GSC-klikken te liggen.
  const s = payload.ga4?.current?.sessions ?? null;
  const c = payload.gsc?.current?.clicks ?? null;
  payload.meta = {
    completeness: {
      today_excluded: true, clamped_to_yesterday: R.clamped,
      gsc_truncated: payload.gsc?.truncated ?? null,
      gsc_last_reliable_day: payload.gsc?.last_reliable_day ?? null,
    },
    plausibility: (s != null && c != null)
      ? { ga4_sessions: s, gsc_clicks: c, suspect: s < c, note: s < c ? "GA4 telt minder sessies dan GSC klikken registreert — vrijwel zeker een tagging- of Consent Mode-probleem, geen realiteit." : null }
      : { suspect: null, note: "onvoldoende data voor plausibiliteitscheck" },
  };

  // De bereik-cache blijft zonder snapshot: die wordt bij elk antwoord vers samengevoegd, anders
  // serveert een verse bereik-cache een oude indexatiestand.
  await writeCache(cacheKey, payload);

  if (mayRefreshCoverage) {
    const res = await refreshCoverage(token, site, covRow?.data);
    covRow = await storeCoverage(res, covRow);
    refreshed = res.anyOk;
  }
  const response = withCoverage({ ...payload, cached: false });
  if (isDefaultRange) await writeAlias(response);
  return json(response);
});
