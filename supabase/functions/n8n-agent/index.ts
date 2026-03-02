/**
 * n8n-agent — LLM orchestration for Command Center / n8n workflow help
 *
 * Primary: Lovable gateway (Gemini). On 429/503/unavailable, creates llm_job with
 * status=needs_choice and returns { needs_choice, llm_job_id }
 * so the client can show the model-switch modal. User picks Codex or OpenAI
 * and calls llm-resume to continue.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getErrorCode(status: number): string {
  if (status === 429) return "rate_limited";
  if (status === 503) return "unavailable";
  if (status >= 500) return "unavailable";
  return "unknown";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { system, messages } = await req.json();

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

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create llm_job for tracking (enables fallback flow when primary fails)
    const { data: job, error: jobError } = await supabaseAdmin
      .from("llm_jobs")
      .insert({
        user_id: user.id,
        purpose: "chat",
        status: "running",
        requested_model: "claude",
        allowed_models: ["codex", "openai"],
      })
      .select("id")
      .single();

    if (jobError || !job) {
      console.error("llm_jobs insert failed:", jobError);
      // Continue without job — fallback flow won't work but chat still can
    }

    let response: Response;
    try {
      const llmResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: system },
            ...messages,
          ],
          max_tokens: 2000,
        }),
      });

      let data: { choices?: Array<{ message?: { content?: string } }> };
      try {
        data = await llmResponse.json();
      } catch {
        data = {};
      }
      const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

      if (llmResponse.ok) {
        if (job?.id) {
          await supabaseAdmin
            .from("llm_jobs")
            .update({ status: "succeeded", updated_at: new Date().toISOString() })
            .eq("id", job.id);
        }
        response = new Response(JSON.stringify({ reply }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        // Primary failed (429, 503, etc.) — create needs_choice
        const errorCode = getErrorCode(llmResponse.status);
        if (job?.id) {
          await supabaseAdmin
            .from("llm_jobs")
            .update({
              status: "needs_choice",
              error_code: errorCode,
              updated_at: new Date().toISOString(),
            })
            .eq("id", job.id);
        }
        response = new Response(
          JSON.stringify({
            needs_choice: true,
            llm_job_id: job?.id ?? null,
            error_code: errorCode,
          }),
          {
            status: 202,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    } catch (fetchErr) {
      const errorCode = fetchErr instanceof Error && fetchErr.name === "TypeError" ? "unavailable" : "timeout";
      if (job?.id) {
        await supabaseAdmin
          .from("llm_jobs")
          .update({
            status: "needs_choice",
            error_code: errorCode,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
      }
      response = new Response(
        JSON.stringify({
          needs_choice: true,
          llm_job_id: job?.id ?? null,
          error_code: errorCode,
        }),
        {
          status: 202,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return response;
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
