/**
 * n8n-filter-proxy — server-side proxy to n8n for Command Center filter/workflow list
 *
 * Keeps N8N_API_KEY and N8N_BASE_URL in Supabase secrets (never exposed to client).
 * GET /workflows: list workflows for the right-hand pane and "n8n: N workflows loaded" status.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const baseUrl = Deno.env.get("N8N_BASE_URL") || Deno.env.get("N8N_URL");
    const apiKey = Deno.env.get("N8N_API_KEY");
    if (!baseUrl || !apiKey) {
      console.error("n8n-filter-proxy: N8N_BASE_URL or N8N_API_KEY not set");
      return new Response(
        JSON.stringify({ error: "n8n filter not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiBase = baseUrl.replace(/\/$/, "") + "/api/v1";
    // List workflows for Command Center right pane and status "n8n: N workflows loaded"
    const n8nRes = await fetch(`${apiBase}/workflows`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "X-N8N-API-KEY": apiKey,
      },
    });

    const text = await n8nRes.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    if (!n8nRes.ok) {
      const err = (data as { message?: string; error?: string })?.message
        ?? (data as { message?: string; error?: string })?.error
        ?? n8nRes.statusText;
      return new Response(
        JSON.stringify({ error: err || `HTTP ${n8nRes.status}` }),
        { status: n8nRes.status >= 500 ? 502 : n8nRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("n8n-filter-proxy:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
