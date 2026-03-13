/**
 * trigger-webhook — authenticated server-side proxy for write-tier n8n workflow triggers.
 *
 * Enforces:
 *   1. Valid Supabase JWT (authenticated user session required)
 *   2. Admin role check via has_role() RPC — non-admin gets 403
 *   3. Allowlist of known write-tier workflow names — prevents open-proxy abuse
 *
 * Flow:
 *   1. Verify caller JWT → resolve user_id.
 *   2. Check admin role — non-admin gets 403.
 *   3. Resolve workflow_name against allowlist → n8n webhook URL.
 *   4. INSERT a workflow_runs row with status "pending".
 *   5. Fire the n8n webhook with a 30-second AbortController timeout.
 *   6. Return { success: true, run_id } immediately.
 *      n8n is expected to ACK, then run async and UPDATE the run record.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-commander-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const N8N_BASE = Deno.env.get("N8N_BASE") || "https://n8n.srv1402218.hstgr.cloud";

// Allowlist — only these workflow names can be proxied; URL is resolved server-side.
const WRITE_WEBHOOKS: Record<string, { url: string; label: string }> = {
  "autoseo":             { url: `${N8N_BASE}/webhook/autoseo`,             label: "AutoSEO Brain" },
  "product-titles":      { url: `${N8N_BASE}/webhook/product-titles`,      label: "Product Title Optimizer" },
  "product-feed":        { url: `${N8N_BASE}/webhook/product-feed`,        label: "Product Feed Optimizer" },
  "campaign":            { url: `${N8N_BASE}/webhook/campaign`,            label: "Campaign Generator" },
  "scraper":             { url: `${N8N_BASE}/webhook/scraper`,             label: "Web Scraper" },
  "monday-orchestrator": { url: `${N8N_BASE}/webhook/monday-orchestrator`, label: "Monday.com Orchestrator" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── 1. Authenticate the caller (JWT required) ─────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized — valid session required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 2. Admin role check ───────────────────────────────────────────────────
    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      console.warn(`[trigger-webhook] non-admin attempt user=${user.id}`);
      return new Response(
        JSON.stringify({ success: false, error: "Admin role required for write-tier workflows" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 3. Parse body and resolve workflow from allowlist ─────────────────────
    const body = await req.json().catch(() => ({}));
    const { workflow_name, ...forwardPayload } = body as { workflow_name?: string; [k: string]: unknown };

    if (!workflow_name || typeof workflow_name !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "workflow_name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const target = WRITE_WEBHOOKS[workflow_name];
    if (!target) {
      return new Response(
        JSON.stringify({ success: false, error: `Unknown workflow: ${workflow_name}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 4. Insert workflow_runs row ───────────────────────────────────────────
    let run_id: string = crypto.randomUUID();
    let trackingEnabled = false;

    try {
      const { data: run, error: insertError } = await supabaseAdmin
        .from("workflow_runs")
        .insert({
          user_id: user.id,
          workflow_name,
          workflow_label: target.label,
          status: "pending",
        })
        .select("id")
        .single();

      if (!insertError && run) {
        run_id = run.id;
        trackingEnabled = true;
        await supabaseAdmin
          .from("workflow_runs")
          .update({ status: "processing" })
          .eq("id", run_id);
      } else {
        console.warn("[trigger-webhook] workflow_runs insert failed (non-fatal):", insertError);
      }
    } catch (dbErr) {
      console.warn("[trigger-webhook] workflow_runs unavailable (non-fatal):", dbErr);
    }

    // ── 5. Fire n8n — 30-second timeout ─────────────────────────────────────
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      console.log(`[trigger-webhook] user=${user.id} workflow=${workflow_name} run_id=${run_id}`);

      const n8nRes = await fetch(target.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...forwardPayload, run_id, user_id: user.id }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!n8nRes.ok) {
        const errBody = await n8nRes.text().catch(() => "");
        const errText = `n8n returned HTTP ${n8nRes.status}${errBody ? ": " + errBody.slice(0, 200) : ""}`;
        console.warn(`[trigger-webhook] ${errText} run_id=${run_id}`);
        if (trackingEnabled) {
          await supabaseAdmin
            .from("workflow_runs")
            .update({
              status: "error",
              error_message: errText,
              result_data: { n8n_status: n8nRes.status, n8n_body: errBody.slice(0, 500) },
              completed_at: new Date().toISOString(),
            })
            .eq("id", run_id);
        }
      }
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const isTimeout = fetchErr instanceof Error && fetchErr.name === "AbortError";
      const errText = isTimeout
        ? "n8n did not respond within 30 seconds (timeout)"
        : (fetchErr instanceof Error ? fetchErr.message : "n8n unreachable");

      console.error(`[trigger-webhook] fetch error run_id=${run_id}:`, errText);
      if (trackingEnabled) {
        await supabaseAdmin
          .from("workflow_runs")
          .update({
            status: "error",
            error_message: errText,
            result_data: { timeout: isTimeout },
            completed_at: new Date().toISOString(),
          })
          .eq("id", run_id);
      }
    }

    // ── 6. Return immediately — frontend subscribes to Realtime for final status ──
    return new Response(
      JSON.stringify({ success: true, run_id, data: { run_id, tracking_enabled: trackingEnabled } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[trigger-webhook] unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
