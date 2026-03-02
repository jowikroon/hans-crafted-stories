/**
 * trigger-webhook — async n8n dispatch proxy
 *
 * Flow:
 *   1. Verify the caller's JWT → resolve user_id.
 *   2. INSERT a workflow_runs row with status "pending".
 *   3. Fire the n8n webhook with a 30-second AbortController timeout.
 *      n8n is expected to ACK with 200 almost immediately, then run async.
 *   4. Return { success: true, run_id } to the frontend immediately.
 *      The frontend subscribes to Realtime to get the final result.
 *
 * CRITICAL FIX (2026-03-02): Changed all response fields from "ok" to "success"
 * to match frontend expectation in HansAI.tsx (json.success check).
 * Without this fix, every workflow call fails with "Workflow returned failure".
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-commander-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── 1. Authenticate the caller ────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

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

    // ── 2. Parse request body ─────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const { webhook_url, payload } = body as { webhook_url?: string; payload?: Record<string, unknown> };

    if (!webhook_url || typeof webhook_url !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "webhook_url is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    try {
      new URL(webhook_url);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid webhook_url" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 3. Best-effort insert into workflow_runs ─────────────────────────────
    // If this table is missing or schema diverged in a linked project, do not hard-fail.
    // We still trigger n8n and return success so /run commands keep working.
    let run_id: string = crypto.randomUUID();
    let trackingEnabled = false;

    try {
      const { data: run, error: insertError } = await supabaseAdmin
        .from("workflow_runs")
        .insert({ user_id: user.id, status: "pending" })
        .select("id")
        .single();

      if (!insertError && run) {
        run_id = run.id;
        trackingEnabled = true;

        // Mark as "processing" synchronously so the frontend can show a spinner
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

    // ── 4. Fire n8n — 30-second timeout (up from 5s to support complex workflows) ──
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      console.log(`[trigger-webhook] Firing n8n run_id=${run_id} → ${webhook_url}`);

      const n8nRes = await fetch(webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(payload ?? {}), run_id, user_id: user.id }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!n8nRes.ok) {
        const errBody = await n8nRes.text().catch(() => "");
        const errText = `n8n returned HTTP ${n8nRes.status}${errBody ? ": " + errBody.slice(0, 200) : ""}`;
        console.warn(`[trigger-webhook] ${errText} for run_id=${run_id}`);
        if (trackingEnabled) {
          await supabaseAdmin
            .from("workflow_runs")
            .update({
              status: "error",
              error_message: errText,
              result_data: { n8n_status: n8nRes.status, n8n_body: errBody.slice(0, 500), webhook_url },
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

      console.error(`[trigger-webhook] fetch error for run_id=${run_id}:`, errText);
      if (trackingEnabled) {
        await supabaseAdmin
          .from("workflow_runs")
          .update({
            status: "error",
            error_message: errText,
            result_data: { timeout: isTimeout, webhook_url },
          })
          .eq("id", run_id);
      }
    }

    // ── 5. Return immediately with run_id — frontend subscribes to Realtime ───
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
