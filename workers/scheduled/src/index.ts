// hvl-edge-cron — hourly cache-warm + health ping for the live sites.
// Not deployed automatically: run `npx wrangler deploy` from workers/scheduled/
// with a Cloudflare API token (CLOUDFLARE_API_TOKEN) in the environment.
//
// What it does each hour:
//   1. Warms the edge cache for key pages on each HEALTH_URL (GET).
//   2. Health-pings each site root (HEAD) and records status/latency.
//   3. Pings the empire-health Supabase function so downtime surfaces centrally.
// It does NOT trigger the SEO/competitor flows — those run via cowork-dispatch.

interface Env {
  HEALTH_URLS: string;
  WARM_PATHS: string;
  EMPIRE_HEALTH_URL: string;
}

async function timedFetch(url: string, init?: RequestInit) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, init);
    return { url, ok: res.ok, status: res.status, ms: Date.now() - t0 };
  } catch (e) {
    return { url, ok: false, status: 0, ms: Date.now() - t0, error: String(e) };
  }
}

async function run(env: Env) {
  const sites = (env.HEALTH_URLS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const paths = (env.WARM_PATHS || "/").split(",").map((s) => s.trim()).filter(Boolean);

  const warm = await Promise.all(
    sites.flatMap((site) =>
      paths.map((p) => timedFetch(site.replace(/\/$/, "") + p, { method: "GET", cf: { cacheTtl: 300 } } as RequestInit))
    )
  );
  const health = await Promise.all(sites.map((site) => timedFetch(site, { method: "HEAD" })));

  if (env.EMPIRE_HEALTH_URL) {
    await timedFetch(env.EMPIRE_HEALTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "hvl-edge-cron", at: new Date().toISOString(), health }),
    }).catch(() => null);
  }

  const down = health.filter((h) => !h.ok);
  console.log(JSON.stringify({ warmed: warm.length, health, down: down.length }));
  return { warmed: warm.length, health, down };
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(run(env).then(() => undefined));
  },
  // Manual trigger / readiness check.
  async fetch(_req: Request, env: Env): Promise<Response> {
    const result = await run(env);
    return new Response(JSON.stringify(result, null, 2), { headers: { "Content-Type": "application/json" } });
  },
};
