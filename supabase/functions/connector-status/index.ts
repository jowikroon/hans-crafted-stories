import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // ── Authentication ──────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return new Response(JSON.stringify({ error: "Authorization required" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabaseAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  // ────────────────────────────────────────────────────────────────────────

  const connectors = [
    { id: 'firecrawl', label: 'Firecrawl', envKey: 'FIRECRAWL_API_KEY' },
    { id: 'perplexity', label: 'Perplexity', envKey: 'PERPLEXITY_API_KEY' },
    { id: 'slack', label: 'Slack', envKey: 'SLACK_API_KEY' },
    { id: 'elevenlabs', label: 'ElevenLabs', envKey: 'ELEVENLABS_API_KEY' },
  ];

  const statuses = connectors.map((c) => ({
    id: c.id,
    label: c.label,
    connected: !!Deno.env.get(c.envKey),
  }));

  return new Response(JSON.stringify({ success: true, data: statuses }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
