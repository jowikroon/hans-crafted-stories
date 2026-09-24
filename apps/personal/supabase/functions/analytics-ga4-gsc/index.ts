// analytics-ga4-gsc v8 — hansvanleeuwen.com Command Center
//
// v8 (2026-08-10): ECHT DATUMBEREIK. v7 negeerde elke parameter en zat vast op 30 dagen; daardoor kon
//   geen enkel dashboard een periodefilter tonen zonder te liegen. Nu:
//     - from/to (YYYY-MM-DD), standaard de laatste 14 VOLLEDIGE dagen t/m gisteren, Europe/Amsterdam
//     - vergelijkperiode automatisch even lang, direct ervoor  (compare: prev | yoy | none)
//     - cache-sleutel per bereik (anders serveer je stale data van een ander venster)
//     - meta.completeness meldt GSC-vertraging en of het venster is ingekort
//   v7-velden (sessions_30d etc.) blijven bestaan voor terugwaartse compatibiliteit.
// v7: service-account eerst (google_sa_key), user-OAuth als fallback.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GA4_PROPERTY_ID = Deno.env.get("GA4_PROPERTY_ID") || "395015361";
const GSC_SITE_OVERRIDE = Deno.env.get("GSC_SITE_URL") || "";
const TTL_MS = 6 * 60 * 60 * 1000;
const TZ = "Europe/Amsterdam";
const GSC_LAG_DAYS = 3;

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
async function fetchGSC(token: string, R: any) {
  let site = GSC_SITE_OVERRIDE;
  if (!site) {
    const lr = await fetch("https://www.googleapis.com/webmasters/v3/sites", { headers: { Authorization: `Bearer ${token}` } });
    const ld = await lr.json();
    if (!lr.ok) throw new Error(`gsc sites: ${JSON.stringify(ld).slice(0, 200)}`);
    const e = ld.siteEntry || [];
    site = (e.find((x: any) => x.siteUrl === "sc-domain:hansvanleeuwen.com") || e.find((x: any) => (x.siteUrl || "").includes("hansvanleeuwen.com")) || {}).siteUrl || "";
    if (!site) throw new Error("gsc: geen hansvanleeuwen.com property");
  }
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
  const queries = await q({ startDate: from, endDate: to, dimensions: ["query"], rowLimit: 15 });
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
    queries: (queries.rows ?? []).map((r: any) => ({ query: r.keys?.[0] ?? "", ...shape(r) })),
    ...current, // v7-compatibiliteit
  };
}

async function readCache(key: string) {
  const r = await fetch(`${SB_URL}/rest/v1/hvl_analytics_cache?key=eq.${encodeURIComponent(key)}&select=data,fetched_at`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
  if (!r.ok) return null;
  return (await r.json())?.[0] ?? null;
}
async function writeCache(key: string, data: unknown) {
  await fetch(`${SB_URL}/rest/v1/hvl_analytics_cache?on_conflict=key`, {
    method: "POST",
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ key, data, fetched_at: new Date().toISOString() }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = new URL(req.url);
  let body: Record<string, any> = {};
  if (req.method === "POST") body = await req.json().catch(() => ({}));
  const force = body.force === true || url.searchParams.get("force") === "1";

  const R = resolveRange(body, url);
  const cacheKey = `dashboard:${R.from}:${R.to}:${R.compare}`;

  if (!force) {
    const c = await readCache(cacheKey);
    if (c && Date.now() - new Date(c.fetched_at).getTime() < TTL_MS) {
      return json({ ...(c.data as Record<string, unknown>), cached: true, fetched_at: c.fetched_at });
    }
  }

  const admin = createClient(SB_URL, SB_KEY);
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
    const c = await readCache(cacheKey);
    const base = { ok: false, configured: false, reason: reason || "no_token", error: "Geen Google-toegang." };
    return json(c ? { ...(c.data as Record<string, unknown>), ...base, cached: true } : base, 200);
  }

  const payload: Record<string, any> = {
    ok: true, configured: true, version: 8, token_source: tokenSource,
    generated_at: new Date().toISOString(),
    range: { from: R.from, to: R.to, days: R.days, compare: R.compare, prev_from: R.prevFrom, prev_to: R.prevTo, timezone: TZ },
    range_days: R.days, // v7-compatibiliteit
    errors: {},
  };
  try { payload.ga4 = await fetchGA4(token, R); } catch (e) { payload.errors.ga4 = String(e).slice(0, 300); }
  try { payload.gsc = await fetchGSC(token, R); } catch (e) { payload.errors.gsc = String(e).slice(0, 300); }

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

  await writeCache(cacheKey, payload);
  return json({ ...payload, cached: false });
});
