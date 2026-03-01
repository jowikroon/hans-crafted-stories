/**
 * n8n-create-workflow — create a workflow in n8n via REST API
 *
 * Accepts POST with workflow JSON (name, nodes, connections, etc.).
 * Validates and sanitizes, then POSTs to n8n with N8N_API_KEY.
 * N8N_BASE_URL and N8N_API_KEY must be set in Supabase secrets (never exposed to client).
 */
import { serve } from "https://deno.land/std@0.168.0/http_server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type N8nWorkflowPayload = {
  name?: string;
  nodes?: unknown[];
  connections?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  staticData?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

function isValidWorkflowBody(body: unknown): body is N8nWorkflowPayload {
  if (body === null || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  // n8n requires at least name (or we default it). nodes must be array if present.
  if (o.nodes !== undefined && !Array.isArray(o.nodes)) return false;
  if (o.connections !== undefined && (typeof o.connections !== "object" || o.connections === null)) return false;
  return true;
}

/** Sanitize: allow only fields n8n API accepts; no extra client stuff */
function sanitize(payload: N8nWorkflowPayload): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const name = typeof payload.name === "string" && payload.name.trim().length > 0
    ? payload.name.trim().slice(0, 128)
    : "AI-generated workflow";
  out.name = name;
  if (Array.isArray(payload.nodes)) out.nodes = payload.nodes;
  if (payload.connections && typeof payload.connections === "object") out.connections = payload.connections;
  if (payload.settings && typeof payload.settings === "object") out.settings = payload.settings;
  if (payload.staticData && typeof payload.staticData === "object") out.staticData = payload.staticData;
  if (payload.meta && typeof payload.meta === "object") out.meta = payload.meta;
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    // ── 1. Authenticate (optional but recommended: only logged-in users can create)
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "Authorization required" }),
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
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 2. Env: n8n API (server-only)
    const baseUrl = Deno.env.get("N8N_BASE_URL") || Deno.env.get("N8N_URL");
    const apiKey = Deno.env.get("N8N_API_KEY");
    if (!baseUrl || !apiKey) {
      console.error("n8n-create-workflow: N8N_BASE_URL or N8N_API_KEY not set");
      return new Response(
        JSON.stringify({ success: false, error: "Workflow creation not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiBase = baseUrl.replace(/\/$/, "") + "/api/v1";

    // ── 3. Parse and validate body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!isValidWorkflowBody(body)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid workflow: need valid name and/or nodes array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const payload = sanitize(body);

    // ── 4. POST to n8n
    const createRes = await fetch(`${apiBase}/workflows`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-N8N-API-KEY": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const text = await createRes.text();
    let data: { id?: string; name?: string; message?: string; error?: string };
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!createRes.ok) {
      const errMsg = data.message || data.error || createRes.statusText || `HTTP ${createRes.status}`;
      console.error("n8n-create-workflow: n8n API error", createRes.status, errMsg);
      return new Response(
        JSON.stringify({ success: false, error: errMsg }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const id = data.id ?? null;
    const name = data.name ?? payload.name;

    return new Response(
      JSON.stringify({
        success: true,
        id,
        name: name ?? undefined,
        url: id ? `${baseUrl.replace(/\/$/, "")}/workflow/${id}` : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("n8n-create-workflow:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
