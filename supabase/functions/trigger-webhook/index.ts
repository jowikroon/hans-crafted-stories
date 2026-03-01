import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-commander-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function verifyCommanderToken(req: Request): boolean {
  const expected = Deno.env.get("COMMANDER_WEBHOOK_TOKEN");
  if (!expected) return true; // if not configured, allow (backward compat)
  const provided = req.headers.get("x-commander-token") ?? "";
  return provided === expected;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (!verifyCommanderToken(req)) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized — invalid or missing X-COMMANDER-TOKEN" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { webhook_url, payload } = await req.json();

    if (!webhook_url) {
      return new Response(JSON.stringify({ success: false, error: "Webhook URL is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate URL format
    try {
      new URL(webhook_url);
    } catch {
      return new Response(JSON.stringify({ success: false, error: "Invalid webhook URL" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Triggering webhook:", webhook_url);

    const response = await fetch(webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return new Response(JSON.stringify({
      success: response.ok,
      status: response.status,
      data: responseData,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook trigger error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
