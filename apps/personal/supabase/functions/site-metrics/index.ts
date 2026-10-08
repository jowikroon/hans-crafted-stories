// site-metrics v1: the measurement engine behind /dashboards/hvl.
//
// POST { action: "harvest", force?, background? }   (service role or admin; background answers 202 after step 0)
//   0. Every kick, also when the 20h guard skips the rest: lead alerts that did not go out
//      (notified_at still null, 10 minutes to 7 days old) get another try, oldest first, 10 a kick.
//   1. Search Console per day x {site, page, query, device} -> hvl_gsc_daily
//      GA4 per day x {site, page, channel, event, device}     -> hvl_ga4_daily
//      First run backfills (16 months GSC, 14 months GA4) in oldest-first 60-day chunks, so an
//      interrupted run resumes from max(d) per dimension; later runs refresh the last 5 days
//      (Search Console revises recent days). Every row carries the run's harvested_at; once a
//      (dim, from..to) chunk is fetched in full and stored, its rows with an older harvested_at are
//      keys Google no longer returns, and they are deleted.
//   2. Sitemap self-heal: when Search Console lists no sitemap, submit /sitemap.xml.
//   3. Merged PRs -> site_changes (see prs.ts), so every future improvement is measured
//      without anyone filling in a form. The next cursor is taken just before the GitHub call,
//      minus 10 minutes, so a PR merged while it runs is still seen next time (pr_number dedups).
//   4. Retention: site_events older than 13 months are deleted (the privacy statement's maximum).
//   5. Every change with a deploy date and a metric gets a fresh before/after verdict (impact.ts),
//      a concluded one too until 14 days after its measurement window, while Search Console
//      finalizes those days.
//   Runs at most once per 20h unless forced. Scheduling: no clock of its own (CLAUDE.md puts new
//   schedules in OpenClaw); analytics-ga4-gsc kicks it on each run of the existing 6-hourly
//   dashboard-evaluator, and the 20h guard makes that one harvest a day.
// POST { action: "evaluate" }                  (service role or admin): step 5 only.
// POST { action: "lead", id }                  (anyone; called by the contact_submissions trigger)
//   One Telegram message for a submission younger than 10 minutes that was not notified yet.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { deployDay, evaluate, isSearchMetric, type ChangeInput, type DailyRow, type Metric } from "./impact.ts";
import { planPr, type PrLike } from "./prs.ts";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GA4_PROPERTY_ID = Deno.env.get("GA4_PROPERTY_ID") || "395015361";
const GSC_SITE_OVERRIDE = Deno.env.get("GSC_SITE_URL") || "";
const SITE = "https://hansvanleeuwen.com";
const REPO = "jowikroon/hans-crafted-stories";
const TZ = "Europe/Amsterdam";
const STATE_KEY = "site-metrics:last";
const GUARD_MS = 20 * 60 * 60 * 1000;
const BUDGET_MS = 90_000; // stop starting new chunks after this; the next run resumes
const CHUNK_DAYS = 60;
const GSC_BACKFILL_DAYS = 485;
const GA4_BACKFILL_DAYS = 425;
const REFRESH_DAYS = 5;
const RECHECK_DAYS = 14; // a concluded verdict is recomputed this long after its measurement window
const PR_CURSOR_MARGIN_MS = 10 * 60_000;
const EVENT_RETENTION_MONTHS = 13;
const LEAD_FRESH_MS = 10 * 60_000; // the public trigger path only alerts a just-inserted lead
const LEAD_RETRY_MS = 7 * 86_400_000; // the privileged retry gives up on older ones
const LEAD_RETRY_LIMIT = 10;
const ADMIN_EMAILS = [...(Deno.env.get("ADMIN_EMAILS") || "").split(","), "hansvl3@gmail.com"]
  .map((e) => e.trim().toLowerCase()).filter(Boolean);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const makeClient = () => createClient(SB_URL, SB_KEY);
type SB = ReturnType<typeof makeClient>;

// ---------- dates (Amsterdam) ----------
const ymd = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const addDays = (s: string, n: number) => new Date(new Date(`${s}T12:00:00Z`).getTime() + n * 86_400_000).toISOString().slice(0, 10);
const minDay = (a: string, b: string) => (a < b ? a : b);

// ---------- auth ----------
function timingSafeEqual(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  if (x.length !== y.length || x.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
async function isPrivileged(req: Request, sb: SB): Promise<boolean> {
  const bearer = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!bearer) return false;
  if (timingSafeEqual(bearer, SB_KEY)) return true;
  const { data } = await sb.auth.getUser(bearer);
  const user = data?.user;
  if (!user?.id || user.is_anonymous) return false;
  if (ADMIN_EMAILS.includes(String(user.email ?? "").toLowerCase())) return true;
  const { data: isAdmin } = await sb.rpc("has_role", { _user_id: user.id, _role: "admin" });
  return isAdmin === true;
}

// ---------- Google service-account token ----------
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
async function googleToken(sb: SB, scope: string): Promise<string> {
  const { data } = await sb.from("cms_secrets").select("value").eq("name", "google_sa_key").maybeSingle();
  if (!data?.value) throw new Error("cms_secrets.google_sa_key ontbreekt");
  const sa = JSON.parse(data.value as string);
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ iss: sa.client_email, scope, aud: sa.token_uri || "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const key = await crypto.subtle.importKey("pkcs8", pemToDer(sa.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claims}`));
  const r = await fetch(sa.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${header}.${claims}.${b64url(sig)}` }),
  });
  const t = await r.json();
  if (!r.ok || !t.access_token) throw new Error(`google token: ${JSON.stringify(t).slice(0, 160)}`);
  return t.access_token as string;
}

async function gfetch(url: string, token: string, init: RequestInit = {}) {
  const r = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(30_000),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url.split("?")[0].slice(-60)}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : {};
}

// Same choice as analytics-ga4-gsc: the domain property if there is one, else the URL-prefix
// property on this host (today that is https://hansvanleeuwen.com/).
async function resolveSite(token: string): Promise<string> {
  if (GSC_SITE_OVERRIDE) return GSC_SITE_OVERRIDE;
  const host = new URL(SITE).hostname;
  const entries = ((await gfetch("https://www.googleapis.com/webmasters/v3/sites", token)).siteEntry ?? []) as { siteUrl: string }[];
  const own = (u: string) => { try { const h = new URL(u).hostname; return h === host || h === `www.${host}`; } catch { return false; } };
  const site = entries.find((e) => e.siteUrl === `sc-domain:${host}`)?.siteUrl
    ?? entries.find((e) => own(e.siteUrl) && new URL(e.siteUrl).hostname === host)?.siteUrl
    ?? entries.find((e) => own(e.siteUrl))?.siteUrl;
  if (!site) throw new Error("gsc: geen property voor hansvanleeuwen.com");
  return site;
}

// ---------- upserts ----------
async function upsert(sb: SB, table: string, rows: Record<string, unknown>[]) {
  for (let i = 0; i < rows.length; i += 1000) {
    const { error } = await sb.from(table).upsert(rows.slice(i, i + 1000), { onConflict: "d,dim,key" });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

/**
 * After a (dim, from..to) chunk was fetched in full and upserted with harvested_at = runAt, the
 * rows still carrying an older harvested_at are keys Google dropped when it revised those days.
 * Only call this on a complete chunk: a partial response would delete live data.
 */
async function dropStale(sb: SB, table: string, dim: string, from: string, to: string, runAt: string): Promise<number> {
  const { error, count } = await sb.from(table).delete({ count: "exact" })
    .eq("dim", dim).gte("d", from).lte("d", to).lt("harvested_at", runAt);
  if (error) throw new Error(`${table} stale: ${error.message}`);
  return count ?? 0;
}

async function lastDay(sb: SB, table: string, dim: string): Promise<string | null> {
  const { data } = await sb.from(table).select("d").eq("dim", dim).order("d", { ascending: false }).limit(1).maybeSingle();
  return (data?.d as string | undefined) ?? null;
}

/** Oldest-first chunks from the resume point (or backfill start) through `end`. */
function chunks(resume: string | null, backfillFrom: string, end: string): [string, string][] {
  const start = resume ? addDays(resume, -REFRESH_DAYS) : backfillFrom;
  const out: [string, string][] = [];
  for (let a = start; a <= end; a = addDays(a, CHUNK_DAYS)) out.push([a, minDay(addDays(a, CHUNK_DAYS - 1), end)]);
  return out;
}

// ---------- Search Console ----------
const GSC_DIMS: Record<string, string[]> = { site: ["date"], page: ["date", "page"], query: ["date", "query"], device: ["date", "device"] };

async function harvestGsc(sb: SB, token: string, site: string, deadline: number, runAt: string) {
  const today = ymd(new Date());
  const end = addDays(today, -1); // fresh data; the refresh window rewrites it as Google finalizes
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
  const stats: Record<string, number> = {};
  let removed = 0;
  let complete = true;
  for (const [dim, dims] of Object.entries(GSC_DIMS)) {
    stats[dim] = 0;
    for (const [from, to] of chunks(await lastDay(sb, "hvl_gsc_daily", dim), addDays(today, -GSC_BACKFILL_DAYS), end)) {
      if (Date.now() > deadline) { complete = false; break; }
      const rows: Record<string, unknown>[] = [];
      for (let startRow = 0; ; startRow += 25000) {
        const d = await gfetch(url, token, {
          method: "POST",
          body: JSON.stringify({ startDate: from, endDate: to, dimensions: dims, rowLimit: 25000, startRow, dataState: "all" }),
        });
        for (const r of d.rows ?? []) {
          rows.push({
            d: r.keys[0], dim, key: dim === "site" ? "" : String(r.keys[1]).slice(0, 500),
            clicks: Math.round(r.clicks ?? 0), impressions: Math.round(r.impressions ?? 0),
            ctr: r.ctr ?? null, position: r.position ?? null, harvested_at: runAt,
          });
        }
        if ((d.rows ?? []).length < 25000) break;
      }
      // Reached only when every page came back and the upsert succeeded (both throw otherwise).
      await upsert(sb, "hvl_gsc_daily", rows);
      removed += await dropStale(sb, "hvl_gsc_daily", dim, from, to, runAt);
      stats[dim] += rows.length;
    }
  }
  return { stats, removed, complete };
}

// ---------- GA4 ----------
const GA4_DIMS: Record<string, { dim: string | null; metrics: string[] }> = {
  site: { dim: null, metrics: ["sessions", "totalUsers", "screenPageViews", "engagedSessions", "userEngagementDuration", "eventCount", "keyEvents"] },
  page: { dim: "pagePath", metrics: ["sessions", "totalUsers", "screenPageViews", "engagedSessions", "userEngagementDuration", "eventCount", "keyEvents"] },
  channel: { dim: "sessionDefaultChannelGroup", metrics: ["sessions", "totalUsers", "engagedSessions", "userEngagementDuration", "keyEvents"] },
  event: { dim: "eventName", metrics: ["eventCount", "keyEvents"] },
  device: { dim: "deviceCategory", metrics: ["sessions", "totalUsers", "engagedSessions", "keyEvents"] },
};
const GA4_COL: Record<string, string> = {
  sessions: "sessions", totalUsers: "users", screenPageViews: "pageviews", engagedSessions: "engaged_sessions",
  userEngagementDuration: "engagement_sec", eventCount: "events", keyEvents: "key_events",
};

async function harvestGa4(sb: SB, token: string, deadline: number, runAt: string) {
  const today = ymd(new Date());
  const end = addDays(today, -1);
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`;
  const stats: Record<string, number> = {};
  let removed = 0;
  let complete = true;
  for (const [dim, spec] of Object.entries(GA4_DIMS)) {
    stats[dim] = 0;
    for (const [from, to] of chunks(await lastDay(sb, "hvl_ga4_daily", dim), addDays(today, -GA4_BACKFILL_DAYS), end)) {
      if (Date.now() > deadline) { complete = false; break; }
      const rows: Record<string, unknown>[] = [];
      for (let offset = 0; ; offset += 100000) {
        const d = await gfetch(url, token, {
          method: "POST",
          body: JSON.stringify({
            dateRanges: [{ startDate: from, endDate: to }],
            dimensions: [{ name: "date" }, ...(spec.dim ? [{ name: spec.dim }] : [])],
            metrics: spec.metrics.map((name) => ({ name })),
            limit: 100000, offset, keepEmptyRows: false,
          }),
        });
        for (const r of d.rows ?? []) {
          const raw = r.dimensionValues[0].value as string;
          const row: Record<string, unknown> = {
            d: `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`, dim,
            key: spec.dim ? String(r.dimensionValues[1].value).slice(0, 500) : "",
            harvested_at: runAt,
          };
          spec.metrics.forEach((m, i) => {
            const v = Number(r.metricValues[i].value ?? 0);
            row[GA4_COL[m]] = GA4_COL[m] === "engagement_sec" ? v : Math.round(v);
          });
          rows.push(row);
        }
        if ((d.rows ?? []).length < 100000) break;
      }
      // Reached only when every page came back and the upsert succeeded (both throw otherwise).
      await upsert(sb, "hvl_ga4_daily", rows);
      removed += await dropStale(sb, "hvl_ga4_daily", dim, from, to, runAt);
      stats[dim] += rows.length;
    }
  }
  return { stats, removed, complete };
}

// ---------- sitemap self-heal ----------
async function ensureSitemap(sb: SB, site: string): Promise<string> {
  const read = await googleToken(sb, "https://www.googleapis.com/auth/webmasters.readonly");
  const base = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/sitemaps`;
  const list = await gfetch(base, read);
  if ((list.sitemap ?? []).length > 0) return `ok: ${(list.sitemap as { path: string }[]).map((s) => s.path).join(", ")}`;
  try {
    const write = await googleToken(sb, "https://www.googleapis.com/auth/webmasters");
    await gfetch(`${base}/${encodeURIComponent(`${SITE}/sitemap.xml`)}`, write, { method: "PUT" });
    return "submitted: /sitemap.xml ingediend in Search Console";
  } catch (e) {
    const msg = String(e);
    return msg.includes("403")
      ? "missing: geen sitemap in Search Console en het service-account mag niet indienen (maak het Eigenaar in Search Console)"
      : `missing: indienen mislukt (${msg.slice(0, 120)})`;
  }
}

// ---------- merged PRs -> site_changes ----------
async function syncPrs(sb: SB, since: string | null) {
  const { data: pat } = await sb.from("cms_secrets").select("value").eq("name", "github_pat").maybeSingle();
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "site-metrics" };
  if (pat?.value) headers.Authorization = `Bearer ${pat.value}`;
  const r = await fetch(`https://api.github.com/repos/${REPO}/pulls?state=closed&base=main&sort=updated&direction=desc&per_page=60`, {
    headers, signal: AbortSignal.timeout(20_000),
  });
  if (!r.ok) throw new Error(`github ${r.status}`);
  const cutoff = since ?? new Date(Date.now() - 30 * 86_400_000).toISOString();
  const prs = ((await r.json()) as PrLike[]).filter((p) => p.merged_at && p.merged_at > cutoff);

  const { data: planned } = await sb.from("site_changes").select("id, linear_issue").eq("status", "planned").not("linear_issue", "is", null);
  const byIssue = new Map((planned ?? []).map((p) => [p.linear_issue as string, p.id as string]));
  let activated = 0, inserted = 0;
  for (const pr of prs.sort((a, b) => (a.merged_at! < b.merged_at! ? -1 : 1))) {
    const plan = planPr(pr, new Set(byIssue.keys()));
    if (plan.type === "skip") continue;
    const { data: existing } = await sb.from("site_changes").select("id").eq("pr_number", pr.number).maybeSingle();
    if (existing) continue;
    if (plan.type === "activate") {
      for (const issue of plan.issues) {
        const patch: Record<string, unknown> = { deployed_at: pr.merged_at, pr_number: pr.number, status: "measuring" };
        if (plan.measure) {
          // The Measure line overrides the plan: metric and expectation always, the rest when named.
          const m = plan.measure;
          patch.primary_metric = m.metric;
          patch.expected = m.expect;
          if (m.pathsGiven) patch.paths = m.paths; // an empty paths= means the whole site
          if (m.days) patch.measure_days = m.days;
          if (m.baseline) patch.baseline_days = m.baseline;
        }
        const { error } = await sb.from("site_changes").update(patch).eq("id", byIssue.get(issue)!).eq("status", "planned");
        if (!error) { activated++; byIssue.delete(issue); }
        break; // one PR number per row (unique index)
      }
      continue;
    }
    const m = plan.measure;
    const { error } = await sb.from("site_changes").insert({
      title: pr.title.slice(0, 200), kind: plan.kind, linear_issue: plan.issues[0] ?? null, pr_number: pr.number,
      deployed_at: pr.merged_at, paths: m?.paths ?? [], primary_metric: m?.metric ?? null,
      expected: m?.expect ?? "up", measure_days: m?.days ?? 28, baseline_days: m?.baseline ?? 28,
      status: plan.status, source: "pr",
    });
    if (!error) inserted++;
  }
  return { seen: prs.length, activated, inserted };
}

// ---------- impact ----------
async function evaluateAll(sb: SB) {
  // Concluded changes too: Search Console revises recent days and a chunked backfill can still
  // supply a missing baseline, so a verdict stays live until RECHECK_DAYS after its window.
  const { data: changes } = await sb.from("site_changes")
    .select("id, deployed_at, paths, primary_metric, expected, baseline_days, measure_days, status")
    .in("status", ["measuring", "planned", "concluded"]).not("deployed_at", "is", null).not("primary_metric", "is", null);
  const gscLast = await lastDay(sb, "hvl_gsc_daily", "page");
  const { data: firstGsc } = await sb.from("hvl_gsc_daily").select("d").order("d").limit(1).maybeSingle();
  const { data: firstEvent } = await sb.from("site_events").select("ts").order("ts").limit(1).maybeSingle();
  const today = ymd(new Date());
  const yesterday = addDays(today, -1);
  const eventsSince = firstEvent?.ts ? addDays(ymd(new Date(firstEvent.ts as string)), 1) : yesterday; // first day is partial
  let n = 0;
  for (const c of changes ?? []) {
    const ch = c as unknown as ChangeInput & { id: string; status: string };
    if (ch.status === "concluded" && today > addDays(deployDay(ch.deployed_at), ch.measure_days + RECHECK_DAYS)) continue;
    const search = isSearchMetric(ch.primary_metric as Metric);
    const last = search ? gscLast ?? yesterday : yesterday;
    const since = search ? (firstGsc?.d as string | undefined) ?? null : eventsSince;
    const from = addDays(ch.deployed_at.slice(0, 10), -ch.baseline_days - 1);
    const to = addDays(ch.deployed_at.slice(0, 10), ch.measure_days + 1);
    const { data: rows, error } = await sb.rpc("site_metric_daily", { p_paths: ch.paths ?? [], p_from: from, p_to: to });
    if (error) throw new Error(`site_metric_daily: ${error.message}`);
    const result = evaluate(ch, (rows ?? []) as DailyRow[], last, since);
    await sb.from("site_changes").update({ result, result_at: result.computed_at, status: result.status }).eq("id", ch.id);
    n++;
  }
  return n;
}

// ---------- lead alert ----------
type LeadResult = { sent: true } | { skipped: string } | { error: string };
type LeadRetry = { tried: number; sent: number } | { error: string };

/** One Telegram message for a submission row; notified_at marks it sent. Callers check age and state. */
async function sendLead(sb: SB, row: Record<string, unknown>): Promise<LeadResult> {
  const { data: chat } = await sb.from("autoccp_thresholds").select("value_text").eq("key", "telegram_chat_id").maybeSingle();
  const bot = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!bot || !chat?.value_text) return { skipped: "telegram niet geconfigureerd" };
  const text = [
    "Nieuwe aanvraag via hansvanleeuwen.com",
    `${row.name} <${row.email}>`,
    `Reden: ${row.reason}${row.page ? ` · pagina ${row.page}` : ""}${row.lang ? ` · ${row.lang}` : ""}`,
    "",
    String(row.message).slice(0, 800),
    "",
    `${SITE}/dashboards/hvl`,
  ].join("\n");
  const r = await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat.value_text, text, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  if (!r?.ok) return { error: `telegram ${r?.status ?? "onbereikbaar"}` };
  await sb.from("contact_submissions").update({ notified_at: new Date().toISOString() }).eq("id", row.id as string);
  return { sent: true };
}

/** The trigger path (public key): only a just-inserted row, so it cannot re-send old leads. */
async function notifyLead(sb: SB, id: unknown): Promise<LeadResult> {
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return { skipped: "bad id" };
  const { data: row } = await sb.from("contact_submissions").select("*").eq("id", id).maybeSingle();
  if (!row) return { skipped: "not found" };
  if (row.notified_at) return { skipped: "already notified" };
  if (Date.now() - new Date(row.created_at as string).getTime() > LEAD_FRESH_MS) return { skipped: "too old" };
  return await sendLead(sb, row);
}

/**
 * The privileged retry on every harvest kick: the insert trigger is a lead's only other call, so
 * an alert that failed there (Telegram down, a timeout) would otherwise be lost. Rows younger than
 * LEAD_FRESH_MS belong to the trigger path, so the two never alert the same lead at once.
 */
async function retryLeads(sb: SB): Promise<LeadRetry> {
  const now = Date.now();
  const { data, error } = await sb.from("contact_submissions").select("*").is("notified_at", null)
    .gte("created_at", new Date(now - LEAD_RETRY_MS).toISOString())
    .lt("created_at", new Date(now - LEAD_FRESH_MS).toISOString())
    .order("created_at").limit(LEAD_RETRY_LIMIT);
  if (error) return { error: `contact_submissions: ${error.message}`.slice(0, 300) };
  let sent = 0;
  for (const row of data ?? []) if ("sent" in (await sendLead(sb, row))) sent++;
  return { tried: (data ?? []).length, sent };
}

// ---------- retention ----------
/** First-party events are kept at most EVENT_RETENTION_MONTHS (the privacy statement says so). */
async function pruneEvents(sb: SB): Promise<number> {
  const cutoff = new Date();
  cutoff.setUTCMonth(cutoff.getUTCMonth() - EVENT_RETENTION_MONTHS);
  const { error, count } = await sb.from("site_events").delete({ count: "exact" }).lt("ts", cutoff.toISOString());
  if (error) throw new Error(`site_events: ${error.message}`);
  return count ?? 0;
}

async function harvest(sb: SB, prev: Record<string, unknown>, leads: LeadRetry): Promise<Record<string, unknown>> {
  const started = Date.now();
  const deadline = started + BUDGET_MS;
  const runAt = new Date(started).toISOString(); // harvested_at of every row this run writes
  const out: Record<string, unknown> = { started_at: runAt };
  const errors: Record<string, string> = {};
  let complete = true;
  if ("error" in leads) errors.leads = leads.error; else out.lead_retry = leads;

  let site: string | null = null;
  try {
    const token = await googleToken(sb, "https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly");
    try {
      site = await resolveSite(token); out.gsc_site = site;
      const g = await harvestGsc(sb, token, site, deadline, runAt); out.gsc = g.stats; out.gsc_removed = g.removed; complete &&= g.complete;
    } catch (e) { errors.gsc = String(e).slice(0, 300); }
    try { const g = await harvestGa4(sb, token, deadline, runAt); out.ga4 = g.stats; out.ga4_removed = g.removed; complete &&= g.complete; }
    catch (e) { errors.ga4 = String(e).slice(0, 300); }
  } catch (e) { errors.google = String(e).slice(0, 300); }
  if (site) { try { out.sitemap = await ensureSitemap(sb, site); } catch (e) { errors.sitemap = String(e).slice(0, 300); } }
  // Taken before GitHub answers: a PR merged after its response was built is missing from it, so
  // the next run must still look back past this moment (pr_number keeps re-seen PRs single).
  const prsCursor = new Date(Date.now() - PR_CURSOR_MARGIN_MS).toISOString();
  try { out.prs = await syncPrs(sb, (prev.prs_synced_at as string | undefined) ?? null); out.prs_synced_at = prsCursor; }
  catch (e) { errors.prs = String(e).slice(0, 300); out.prs_synced_at = prev.prs_synced_at ?? null; }
  try { out.events_pruned = await pruneEvents(sb); } catch (e) { errors.retention = String(e).slice(0, 300); }
  try { out.evaluated = await evaluateAll(sb); } catch (e) { errors.evaluate = String(e).slice(0, 300); }

  out.errors = errors;
  out.complete = complete && !errors.gsc && !errors.ga4 && !errors.google;
  out.duration_ms = Date.now() - started;
  await sb.from("hvl_analytics_cache").upsert({ key: STATE_KEY, data: out, fetched_at: new Date().toISOString() }, { onConflict: "key" });
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const action = String(body.action ?? "harvest");
  const sb = makeClient();

  if (action === "lead") return json(await notifyLead(sb, body.id));
  if (!(await isPrivileged(req, sb))) return json({ error: "forbidden" }, 403);

  if (action === "evaluate") return json({ ok: true, evaluated: await evaluateAll(sb) });
  if (action !== "harvest") return json({ error: "unknown action" }, 400);

  // Every 6-hourly kick, before the 20h guard: undelivered lead alerts must not wait a day.
  const leads = await retryLeads(sb).catch((e): LeadRetry => ({ error: String(e).slice(0, 300) }));

  const { data: state } = await sb.from("hvl_analytics_cache").select("data, fetched_at").eq("key", STATE_KEY).maybeSingle();
  const prev = (state?.data ?? {}) as Record<string, unknown>;
  const fresh = state && Date.now() - new Date(state.fetched_at as string).getTime() < GUARD_MS && prev.complete === true;
  if (fresh && body.force !== true) return json({ ok: true, skipped: "harvested < 20h ago", at: state!.fetched_at, lead_retry: leads });

  // The scheduled kick asks for background mode: answer now, harvest in this worker's own lifetime.
  const rt = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime;
  if (body.background === true && rt) {
    rt.waitUntil(harvest(sb, prev, leads).catch(() => {}));
    return json({ ok: true, started: true, lead_retry: leads }, 202);
  }
  const out = await harvest(sb, prev, leads);
  return json({ ok: Object.keys(out.errors as Record<string, string>).length === 0, ...out });
});
