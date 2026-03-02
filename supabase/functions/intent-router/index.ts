import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const WORKFLOW_CONTEXT = [
  { name: "autoseo", description: "Optimize product titles for SEO across NL/BE/DE/EN markets" },
  { name: "product-titles", description: "Rewrite and optimize product titles for better conversion and SEO" },
  { name: "health-check", description: "Check all services and infrastructure health status" },
  { name: "product-feed", description: "Optimize and sync product feeds across channels (Channable, Google Shopping)" },
  { name: "campaign", description: "Generate and launch marketing campaigns with AI-powered copy" },
  { name: "scraper", description: "Scrape competitor data, pricing, and product information from websites" },
  { name: "google", description: "Control Gmail, Google Sheets, Drive — summarize emails, add rows, list files" },
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userContent = [context ? `Context: ${context}` : "", hierarchyHint ? `Hierarchy: ${hierarchyHint}` : "", `User input: "${input}"`].filter(Boolean).join("\n\n");

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI gateway error", status: response.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    let result;
    try {
      const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      result = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse LLM response:", raw);
      result = { intent: "unknown", confidence: 0, missing_params: null, clarification: null };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("intent-router error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
