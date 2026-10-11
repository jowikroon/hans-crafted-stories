// mpg-build-status v1 — MarketplaceGrowth bouwstatus, afgeleid uit de code zelf.
//
// Uitgangspunt: een statusdashboard dat je handmatig vult, liegt binnen twee weken.
// Alles hieronder wordt daarom afgeleid uit GitHub — niet uit een vinkje.
//
// De kernvergelijking: de SHA van de laatste Production-deployment tegenover de SHA van
// `main`. Wat op main staat maar niet in die deploy zit, is gebouwd en niet uitgerold.
// Zijn ze gelijk, dan staat er niets ongereleased — hoe verleidelijk het ook is om dat
// wél te vermoeden op basis van featurenamen.
//
// Vercel-deployments zijn zichtbaar via de GitHub Deployments API (vercel[bot] schrijft ze
// daarheen), dus er is geen Vercel-token nodig. Eén credential volstaat.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OWNER = Deno.env.get("MPG_OWNER") || "jowikroon";
const REPO = Deno.env.get("MPG_REPO") || "marketplacegrowth";
const TTL_MS = 30 * 60 * 1000;
const TRACKER_KEY = "project-tracker:page_a49b2b7b57d08191a8a9006804700814";
const GH = "https://api.github.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const days = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

/** Token uit env, anders uit cms_secrets. Zonder token geen data — en dat zeggen we ook. */
async function getToken(admin: any): Promise<{ token: string | null; reason: string | null; source: string | null }> {
  const env = Deno.env.get("GITHUB_PAT");
  if (env) return { token: env, reason: null, source: "env" };
  const { data } = await admin.from("cms_secrets").select("value").eq("name", "github_pat").maybeSingle();
  if (data?.value) return { token: data.value, reason: null, source: "cms_secrets" };
  return {
    token: null, source: null,
    reason: "github_pat_missing — zet GITHUB_PAT als edge-function secret, of voeg een rij 'github_pat' toe aan cms_secrets",
  };
}

async function gh(token: string, path: string) {
  const r = await fetch(`${GH}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "mpg-build-status" },
  });
  if (!r.ok) throw new Error(`${path} → ${r.status} ${(await r.text()).slice(0, 140)}`);
  return r.json();
}

/** Bestandsnamen in een map op een specifieke ref. Lege lijst als de map daar niet bestaat. */
async function dirAt(token: string, path: string, ref: string): Promise<string[]> {
  try {
    const d = await gh(token, `/repos/${OWNER}/${REPO}/contents/${path}?ref=${ref}`);
    return Array.isArray(d) ? d.filter((x: any) => x.type === "dir" || x.type === "file").map((x: any) => x.name) : [];
  } catch { return []; }
}

/** Routes uit App.tsx — het navigatiecontract van de app. */
async function routesAt(token: string, ref: string): Promise<string[]> {
  try {
    const r = await fetch(`${GH}/repos/${OWNER}/${REPO}/contents/src/App.tsx?ref=${ref}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.raw", "User-Agent": "mpg-build-status" },
    });
    if (!r.ok) return [];
    const src = await r.text();
    return [...new Set([...src.matchAll(/path="([^"]*)"/g)].map((m) => m[1]))].sort();
  } catch { return []; }
}


/** Tracker snapshots are published by the connected Page refresh, not bundled into the app. */
async function readTracker(admin: any) {
  const { data, error } = await admin.from("hvl_analytics_cache")
    .select("data,fetched_at").eq("key", TRACKER_KEY).maybeSingle();
  const snapshot = data?.data;
  if (error || !snapshot || snapshot.schema_version !== 1 ||
      snapshot.page_id !== "page_a49b2b7b57d08191a8a9006804700814" ||
      !Array.isArray(snapshot.sections) ||
      !snapshot.sections.every((s: any) => typeof s.id === "string" && typeof s.markdown === "string")) {
    return { available: false, reason: error ? "Tracker ophalen mislukt" : "Tracker is nog niet gesynchroniseerd" };
  }
  const synced = Date.parse(data.fetched_at);
  const sourceUpdated = Date.parse(snapshot.source_updated_at);
  if (!Number.isFinite(synced) || !Number.isFinite(sourceUpdated)) {
    return { available: false, reason: "Tracker heeft geen geldige actualisatiedatum" };
  }
  return {
    available: true, ...snapshot,
    page_url: "https://chatgpt.com/space/page_a49b2b7b57d08191a8a9006804700814",
    synced_at: data.fetched_at,
    stale: Date.now() - synced > 36 * 60 * 60 * 1000,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = new URL(req.url);
  let body: Record<string, any> = {};
  if (req.method === "POST") body = await req.json().catch(() => ({}));
  const force = body.force === true || url.searchParams.get("force") === "1";
  const cacheKey = `mpg-build:${OWNER}/${REPO}`;

  const admin = createClient(SB_URL, SB_KEY);
  // verify_jwt alone also accepts the public anon JWT. Require a real admin user.
  const bearer = req.headers.get("Authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!bearer) return json({ ok: false, reason: "Inloggen vereist" }, 401);
  const { data: identity, error: authError } = await admin.auth.getUser(bearer);
  if (authError || !identity?.user) return json({ ok: false, reason: "Inloggen vereist" }, 401);
  const { data: role, error: roleError } = await admin.from("user_roles")
    .select("id").eq("user_id", identity.user.id).eq("role", "admin").limit(1);
  if (roleError || !role?.length) return json({ ok: false, reason: "Geen beheerderstoegang" }, 403);
  const projectTracker = await readTracker(admin);

  if (!force) {
    const r = await fetch(`${SB_URL}/rest/v1/hvl_analytics_cache?key=eq.${encodeURIComponent(cacheKey)}&select=data,fetched_at`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
    const c = r.ok ? (await r.json())?.[0] : null;
    if (c && Date.now() - new Date(c.fetched_at).getTime() < TTL_MS) {
      return json({ ...(c.data as Record<string, unknown>), cached: true, fetched_at: c.fetched_at, project_tracker: projectTracker });
    }
  }

  const { token, reason, source } = await getToken(admin);
  if (!token) return json({ ok: false, configured: false, reason, project_tracker: projectTracker }, 200);

  try {
    const repo = await gh(token, `/repos/${OWNER}/${REPO}`);
    const mainSha: string = (await gh(token, `/repos/${OWNER}/${REPO}/commits/${repo.default_branch}`)).sha;

    // Productie-deploys komen van vercel[bot] via de GitHub Deployments API.
    const deployments: any[] = await gh(token, `/repos/${OWNER}/${REPO}/deployments?per_page=30`);
    const prod = deployments.filter((d) => /^prod/i.test(d.environment || ""));
    const latestProd = prod[0] ?? null;
    const prodSha: string | null = latestProd?.sha ?? null;

    // DE kernvergelijking. Gelijk = niets ongereleased.
    const drift = prodSha ? prodSha !== mainSha : null;

    const [fnMain, fnProd, routesMain] = await Promise.all([
      dirAt(token, "supabase/functions", mainSha),
      prodSha ? dirAt(token, "supabase/functions", prodSha) : Promise.resolve([]),
      routesAt(token, mainSha),
    ]);
    const notDeployed = fnMain.filter((f) => !fnProd.includes(f) && f !== "_shared");
    const deployed = fnMain.filter((f) => fnProd.includes(f) && f !== "_shared");

    // Routes zonder enige edge function die er qua naam bij hoort: kandidaat "leeg".
    const slug = (r: string) => r.replace(/^\/+|\/+$/g, "").split("/")[0].replace(/[:*]/g, "");
    const hollow = routesMain
      .map(slug).filter((s) => s && !["", "*", "app", "auth", "dashboard"].includes(s))
      .filter((s, i, a) => a.indexOf(s) === i)
      .filter((s) => !fnMain.some((f) => f.includes(s) || s.includes(f.split("-")[0])));

    const prs: any[] = await gh(token, `/repos/${OWNER}/${REPO}/pulls?state=all&per_page=50&sort=updated&direction=desc`);
    const open = prs.filter((p) => p.state === "open")
      .map((p) => ({ n: p.number, title: p.title, since: p.created_at.slice(0, 10), age_days: days(p.created_at) }));
    const merged = prs.filter((p) => p.merged_at)
      .map((p) => ({ n: p.number, title: p.title, merged: p.merged_at.slice(0, 10) }));

    const branches: any[] = await gh(token, `/repos/${OWNER}/${REPO}/branches?per_page=100`);
    const stray = branches.map((b) => b.name).filter((n) => n !== repo.default_branch);

    const dormantDays = days(repo.pushed_at);
    const deploySeries = prod.slice(0, 8).map((d) => ({ date: d.created_at.slice(0, 10), sha: d.sha.slice(0, 8), age_days: days(d.created_at) }));

    // Volgende stap volgens één regel: wat al gebouwd is wint van wat nog gebouwd moet worden.
    // Staat er niets ongereleased, dan is stilstand zelf het probleem.
    let next: { headline: string; why: string; rule: string };
    if (drift && notDeployed.length) {
      next = {
        headline: "Rol uit wat al af is",
        why: `${notDeployed.length} edge function(s) staan op ${repo.default_branch} maar niet in de productie-deploy: ${notDeployed.join(", ")}. Eén deploy zet ze live.`,
        rule: "wat al gebouwd is wint van wat nog gebouwd moet worden",
      };
    } else if (dormantDays > 21) {
      next = {
        headline: "Herstart de ontwikkeling",
        why: `Productie loopt gelijk met ${repo.default_branch} — er staat niets ongereleased. De repo heeft ${dormantDays} dagen geen commit gehad. Stilstand is hier het probleem, niet de release.`,
        rule: "geen drift + lange stilte = het werk is gestopt, niet geblokkeerd",
      };
    } else {
      next = {
        headline: "Ruim de openstaande PR's op",
        why: `${open.length} PR's open, oudste ${open[0]?.age_days ?? 0} dagen. Geen drift, recent nog activiteit.`,
        rule: "geen drift en recent actief = onderhoud vóór nieuwe scope",
      };
    }

    const payload = {
      ok: true, configured: true, version: 1, token_source: source,
      generated_at: new Date().toISOString(),
      repo: {
        full_name: repo.full_name, private: repo.private, language: repo.language,
        default_branch: repo.default_branch, pushed_at: repo.pushed_at.slice(0, 10),
        dormant_days: dormantDays,
      },
      release: {
        main_sha: mainSha.slice(0, 8),
        prod_sha: prodSha?.slice(0, 8) ?? null,
        prod_date: latestProd?.created_at?.slice(0, 10) ?? null,
        days_since_prod: latestProd ? days(latestProd.created_at) : null,
        drift,
        not_deployed: notDeployed,
        deployed_count: deployed.length,
      },
      capabilities: { edge_functions: fnMain.filter((f) => f !== "_shared"), routes: routesMain, hollow_routes: hollow },
      prs: { open, merged: merged.slice(0, 12), open_count: open.length },
      branches: { stray, count: stray.length },
      deploys: deploySeries,
      next_step: next,
      meta: {
        derivation: "Alles afgeleid uit de GitHub API. De uitrolstatus komt uit het verschil tussen de SHA van de laatste Production-deployment en die van de default branch — niet uit handmatige invoer.",
        caveat: "Uitgerold betekent: de code zat in de productie-deploy. Niet: iemand gebruikt het.",
      },
    };

    await fetch(`${SB_URL}/rest/v1/hvl_analytics_cache?on_conflict=key`, {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ key: cacheKey, data: payload, fetched_at: new Date().toISOString() }),
    });

    return json({ ...payload, cached: false, project_tracker: projectTracker });
  } catch (e) {
    return json({ ok: false, configured: true, error: String(e).slice(0, 400), project_tracker: projectTracker }, 200);
  }
});
