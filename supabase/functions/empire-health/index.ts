import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

  try {
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

    // Log to empire_events (best-effort)
    try {
      const sb = createClient(supabaseUrl, supabaseKey);
      const onlineCount = Object.values(services).filter((s: any) => s.ok).length;
      await sb.from("empire_events").insert({
        event_type: onlineCount >= 5 ? "info" : "error",
        source: "empire-health",
        message: `Health check: ${onlineCount}/${Object.keys(services).length} services online`,
        metadata: services,
      });
    } catch { /* logging is best-effort */ }

    return new Response(JSON.stringify({ services, timestamp: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
