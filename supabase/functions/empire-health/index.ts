import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function checkEndpoint(url: string, timeout = 5000): Promise<{ ok: boolean; latency: number; error?: string }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return { ok: res.ok || res.status === 204, latency: Date.now() - start };
  } catch (e) {
    return { ok: false, latency: Date.now() - start, error: (e as Error).message };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const [shield, portal, brain, muscle, senses, memory, api] = await Promise.all([
      checkEndpoint("https://cloudflare.com/cdn-cgi/trace"),
      checkEndpoint("https://hansvanleeuwen.com"),
      checkEndpoint("https://n8n.hansvanleeuwen.com/healthz"),
      checkEndpoint("http://187.124.1.75:22", 3000).then(r => ({ ...r, ok: !r.ok ? false : r.ok })).catch(() => ({ ok: false, latency: 0, error: "unreachable" })),
      checkEndpoint("http://187.124.1.75:3100", 3000),
      checkEndpoint(`${supabaseUrl}/rest/v1/`, 3000),
      checkEndpoint(`${supabaseUrl}/functions/v1/site-audit`, 3000),
    ]);

    const services = {
      shield: { ...shield, name: "Cloudflare Zero Trust" },
      portal: { ...portal, name: "hansvanleeuwen.com" },
      brain: { ...brain, name: "n8n Orchestration" },
      muscle: { ...muscle, name: "Claude Code CLI" },
      senses: { ...senses, name: "MCP Gateway" },
      memory: { ...memory, name: "Database" },
      immune: { ...api, name: "Edge Functions" },
    };

    // Log to empire_events
    try {
      const sb = createClient(supabaseUrl, supabaseKey);
      const onlineCount = Object.values(services).filter((s) => s.ok).length;
      await sb.from("empire_events").insert({
        event_type: onlineCount === 7 ? "info" : "error",
        source: "empire-health",
        message: `Health check: ${onlineCount}/7 services online`,
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
