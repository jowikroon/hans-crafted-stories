/**
 * llm-resume — resume an LLM job with fallback model (Codex or OpenAI) after user approval
 *
 * Flow:
 *   1. Client inserts approval (type=model_switch, payload={ selected_model: "codex"|"openai" })
 *   2. Client calls this endpoint with llm_job_id, system, messages
 *   3. Verify llm_job belongs to user, status=needs_choice
 *   4. Verify approval exists for this llm_job
 *   5. Call fallback API (OpenAI) with selected model
 *   6. Update llm_job to succeeded, return { reply }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const body = await req.json().catch(() => ({}));
    const { llm_job_id, system, messages } = body as {
      llm_job_id?: string;
      system?: string;
      messages?: Array<{ role: string; content: string }>;
    };

    if (!llm_job_id || typeof llm_job_id !== "string") {
      return new Response(
        JSON.stringify({ error: "llm_job_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!system || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "system and messages are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: job, error: jobError } = await supabaseAdmin
      .from("llm_jobs")
      .select("id, user_id, status, allowed_models")
      .eq("id", llm_job_id)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: "LLM job not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (job.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (job.status !== "needs_choice") {
      return new Response(
        JSON.stringify({ error: "Job is not awaiting model choice" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: approval } = await supabaseAdmin
      .from("approvals")
      .select("id, payload")
      .eq("llm_job_id", llm_job_id)
      .eq("approved_by", user.id)
      .eq("type", "model_switch")
      .eq("status", "approved")
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    const selectedModel = (approval?.payload as { selected_model?: string })?.selected_model;
    if (!selectedModel || !["codex", "openai"].includes(selectedModel)) {
      return new Response(
        JSON.stringify({
          error: "Approval required. Insert an approval with type=model_switch and payload.selected_model (codex or openai) first.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "Fallback API not configured (OPENAI_API_KEY)" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Both Codex and OpenAI fallback use OpenAI API; model selection
    const model = selectedModel === "codex" ? "gpt-4" : "gpt-4";

    const llmRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          ...messages,
        ],
        max_tokens: 2000,
      }),
    });

    const llmData = await llmRes.json().catch(() => ({}));
    const reply = llmData.choices?.[0]?.message?.content || "Sorry, the fallback model couldn't generate a response.";

    if (!llmRes.ok) {
      await supabaseAdmin
        .from("llm_jobs")
        .update({
          status: "failed",
          error_code: "fallback_failed",
          result_data: { error: llmData.error?.message || llmRes.statusText },
          updated_at: new Date().toISOString(),
        })
        .eq("id", llm_job_id);
      return new Response(
        JSON.stringify({ error: llmData.error?.message || "Fallback model failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await supabaseAdmin
      .from("llm_jobs")
      .update({
        status: "succeeded",
        result_data: { reply },
        updated_at: new Date().toISOString(),
      })
      .eq("id", llm_job_id);

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("llm-resume:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
