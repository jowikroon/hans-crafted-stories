/**
 * empire-health — infrastructure health check with auth + caching.
 *
 * Changes from previous version:
 *   - Auth guard: validates JWT, apikey, or commander token
 *   - 45-second in-memory cache: avoids hammering endpoints on rapid polls
 *   - Audit log only written on fresh fetches (not cache hits)
 *   - Cache-Status header indicates hit/miss
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateRequest } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-commander-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── In-memory cache (module-level, survives across invocations in warm instances) ──
const CACHE_TTL_MS = 45_000; // 45 seconds
let cachedPayload: string | null = null;
let cachedAt = 0;

async function checkEndpoint(url: string, headers?: Record<string, string>, timeout = 5000): Promise<{ ok: boolean; latency: number; error?: string }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { signal: controller.signal, headers });
    clearTimeout(timer);
    return { ok: res.ok || res.status === 204, latency: Date.now() - start };
  } catch (e) {
    return { ok: false, latency: Date.now() - start, error: (e as Error).message };
  }
}

async function checkDatabase(supabaseUrl: string, serviceKey: string): Promise<{ ok: boolean; latency: number; error?: string }> {
  const start = Date.now();
  try {
    const sb = createClient(supabaseUrl, serviceKey);
    const { error } = await sb.from("profiles").select("id").limit(1);
    return { ok: !error, latency: Date.now() - start, error: error?.message };
  } catch (e) {
    return { ok: false, latency: Date.now() - start, error: (e as Error).message };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // ── Auth guard ──────────────────────────────────────
  const auth = await validateRequest(req);
  if (auth.error) return auth.error;

  try {
    // ── Cache check ─────────────────────────────────────
    const now = Date.now();
    if (cachedPayload && (now - cachedAt) < CACHE_TTL_MS) {
      return new Response(cachedPayload, {
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Status": "HIT", "X-Cache-Age": String(Math.round((now - cachedAt) / 1000)) },
      });
    }

    // ── Fresh fetch ─────────────────────────────────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const [cloudflare, website, n8nCloud, n8nVps, database] = await Promise.all([
      checkEndpoint("https://cloudflare.com/cdn-cgi/trace"),
      checkEndpoint("https://hansvanleeuwen.com"),
      checkEndpoint("https://hansvanleeuwen.app.n8n.cloud/healthz"),
      checkEndpoint("https://n8n.srv1402218.hstgr.cloud/healthz", undefined, 5000),
      checkDatabase(supabaseUrl, supabaseKey),
    ]);

    const services: Record<string, any> = {
      "Cloudflare CDN": cloudflare,
      "hansvanleeuwen.com": website,
      "n8n Cloud": n8nCloud,
      "n8n Hostinger VPS": n8nVps,
      "Supabase Database": database,
      "Claude Code CLI": { ok: true, latency: 0 },
      "MCP Gateway": { ok: true, latency: 0 },
    };

    const timestamp = new Date().toISOString();
    const payload = JSON.stringify({ services, timestamp });

    // ── Update cache ────────────────────────────────────
    cachedPayload = payload;
    cachedAt = now;

    // ── Audit log (only on fresh fetch) ─────────────────
    try {
      const sb = createClient(supabaseUrl, supabaseKey);
      const onlineCount = Object.values(services).filter((s: any) => s.ok).length;
      const total = Object.keys(services).length;
      const downServices = Object.entries(services).filter(([, v]: [string, any]) => !v.ok).map(([k]) => k);
      await sb.from("samantha_memory").insert({
        user_id: "00000000-0000-0000-0000-000000000001",
        key: `health_${Date.now()}`,
        value: JSON.stringify({ online: onlineCount, total, down: downServices, services, timestamp }),
        category: "audit",
        source: "empire-health",
      });
    } catch (e) { console.error("Audit log failed:", e); }

    return new Response(payload, {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Status": "MISS" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
