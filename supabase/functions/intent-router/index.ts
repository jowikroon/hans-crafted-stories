/**
 * intent-router — LLM-based intent classification with auth + provider fallback.
 *
 * Hardened version:
 *   - Auth guard (JWT / apikey / commander token)
 *   - Provider cascade: Lovable → Gemini → Anthropic → graceful unknown
 *   - On total provider failure, returns { intent: "unknown", confidence: 0 }
 *     instead of a 5xx error, so the frontend pipeline degrades gracefully
 *   - X-AI-Provider response header
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateRequest } from "../_shared/auth.ts";
import { textCompletion } from "../_shared/ai-fallback.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-commander-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WORKFLOW_CONTEXT = [
  { name: "autoseo", description: "Optimize product titles for SEO across NL/BE/DE/EN markets" },
  { name: "product-titles", description: "Rewrite and optimize product titles for better conversion and SEO" },
  { name: "health-check", description: "Check all services and infrastructure health status" },
  { name: "product-feed", description: "Optimize and sync product feeds across channels (Channable, Google Shopping)" },
  { name: "campaign", description: "Generate and launch marketing campaigns with AI-powered copy" },
  { name: "scraper", description: "Scrape competitor data, pricing, and product information from websites" },
  { name: "monday-orchestrator", description: "Central orchestrator that receives Monday.com item events and routes to specialist workflows" },
  { name: "google", description: "Control Gmail, Google Sheets, Drive — summarize emails, add rows, list files" },
  { name: "site-audit", description: "Full multi-signal SEO audit of a URL: technical checks, content analysis, PageSpeed, AI scorecard report" },
];

const SYSTEM_PROMPT = `You are an intent classifier for a digital marketing automation platform.
Given user input, classify it into one of these workflows:
${JSON.stringify(WORKFLOW_CONTEXT, null, 2)}

Respond ONLY with valid JSON (no markdown, no code fences):
{"intent": "workflow-name", "confidence": 0.0-1.0, "missing_params": ["param1"] | null, "clarification": "question to ask user" | null}

Rules:
- If the input clearly matches a workflow, set confidence >= 0.7
- If the input is ambiguous but could match, set confidence 0.4-0.7 and provide a clarification question
- If no workflow matches at all, set intent to "unknown" and confidence to 0.0
- missing_params should list any required parameters the user didn't provide
- Be strict: only classify as a workflow if the user's intent genuinely relates to it
- IMPORTANT: Generic conversational questions such as "what can you do", "tell me all you can do", "what are your capabilities", "help me", "who are you", "what do you know", or any greeting/capability question must ALWAYS be classified as intent "unknown" with confidence 0.0 — they are chat questions, not workflow requests`;

const FALLBACK_RESULT = { intent: "unknown", confidence: 0, missing_params: null, clarification: null };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // ── Auth guard ──────────────────────────────────────
  const auth = await validateRequest(req);
  if (auth.error) return auth.error;

  try {
    const { input, context, router_context } = await req.json();

    if (!input || typeof input !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing 'input' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const hierarchyHint =
      router_context &&
      typeof router_context === "object" &&
      (router_context.primaryGoal != null || router_context.activeTabs?.length || router_context.subTools?.length)
        ? `\nCommand Center context: primaryGoal=${router_context.primaryGoal ?? "none"}, activeTabs=[${(router_context.activeTabs ?? []).join(", ")}], subTools=[${(router_context.subTools ?? []).join(", ")}]. Prefer intents that match this context when relevant.`
        : "";

    const userContent = [
      context ? `Context: ${context}` : "",
      hierarchyHint ? `Hierarchy: ${hierarchyHint}` : "",
      `User input: "${input}"`,
    ].filter(Boolean).join("\n\n");

    // ── Provider fallback (non-streaming) ────────────────
    const { text, provider, error } = await textCompletion({
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
      model: "google/gemini-2.5-flash",
      maxTokens: 300,
      temperature: 0.1,
    });

    if (error || !text) {
      console.error("[intent-router] All providers failed:", error);
      // Graceful degradation: return unknown instead of 5xx
      return new Response(JSON.stringify(FALLBACK_RESULT), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-AI-Provider": "none" },
      });
    }

    let result;
    try {
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      result = JSON.parse(cleaned);
    } catch {
      console.error("[intent-router] Failed to parse LLM response:", text.slice(0, 200));
      result = FALLBACK_RESULT;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-AI-Provider": provider },
    });
  } catch (error) {
    console.error("intent-router error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
