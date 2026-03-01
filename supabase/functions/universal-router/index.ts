/**
 * universal-router — single entry for Command Center chat; forwards to n8n-agent with filter context
 *
 * Accepts: { messages, model?, system?, filter_context?, router_context? }
 * Enriches system prompt with filter_context, then forwards to n8n-agent.
 * Same request/response shape as n8n-agent (no streaming in this path).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function buildSystemWithFilter(baseSystem: string, filterContext: unknown): string {
  if (filterContext == null || (typeof filterContext === "object" && Object.keys(filterContext as object).length === 0)) {
    return baseSystem;
  }
  const prefix = "[Filter context for this request: " + JSON.stringify(filterContext) + "]\n\n";
  return prefix + baseSystem;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
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

    let body: { messages?: unknown[]; model?: string; system?: string; filter_context?: unknown; router_context?: unknown };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { messages = [], model, system: baseSystem = "", filter_context, router_context } = body;
    const system = buildSystemWithFilter(baseSystem, filter_context ?? router_context ?? null);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "");
    const res = await fetch(`${supabaseUrl}/functions/v1/n8n-agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ system, messages, model }),
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: text };
    }

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("universal-router:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
