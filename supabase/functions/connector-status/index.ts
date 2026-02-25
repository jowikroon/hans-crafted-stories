const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
