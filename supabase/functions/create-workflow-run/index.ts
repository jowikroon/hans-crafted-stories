/**
 * create-workflow-run — creates a workflow_runs row and returns its id.
 *
 * Called by the frontend before kicking off a long-running operation so it
 * can subscribe to workflow_logs for that run_id and show live sub-step bullets.
 *
 * Flow:
 *   1. Verify the caller's JWT → resolve user_id.
 *   2. INSERT a workflow_runs row with status "processing".
 *   3. Return { run_id } immediately.
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

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized — valid session required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: run, error: insertError } = await supabaseAdmin
      .from("workflow_runs")
      .insert({ user_id: user.id, status: "processing" })
      .select("id")
      .single();

    if (insertError || !run) {
      console.error("[create-workflow-run] insert error:", insertError);
      return new Response(
        JSON.stringify({ ok: false, error: "Failed to create workflow run" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, run_id: run.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[create-workflow-run] unexpected error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
