import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { page, group, fields } = await req.json();

    if (!page || !group || !fields?.length) {
      return new Response(JSON.stringify({ error: "Missing page, group, or fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build a structured prompt with field context
    const fieldDescriptions = fields.map(
      (f: { content_label: string; content_key: string; content_type: string; content_value: string }) =>
        `- "${f.content_label}" (key: ${f.content_key}, type: ${f.content_type}): "${f.content_value}"`
    ).join("\n");

    const systemPrompt = `You are an expert copywriter for a professional portfolio website belonging to Hans van Leeuwen, an e-commerce manager and marketplace specialist based in the Netherlands.

Your task: improve the copy for a specific content group on a page. Return ONLY a JSON object mapping each content_key to its improved value. Do not add keys that weren't provided.

Guidelines:
- "heading" type: concise, impactful, under 60 characters
- "subheading" type: supporting context, under 80 characters  
- "body" type: engaging professional copy, keep roughly the same length
- "button" type: clear action-oriented text, 2-4 words
- "label" type: short section label, 1-3 words
- Maintain the professional yet approachable tone of the existing site
- Keep the same language as the original (Dutch or English)
- Don't radically change meaning — improve clarity, impact, and professionalism`;

    const userPrompt = `Page: "${page}" — Content group: "${group}"

Current fields:
${fieldDescriptions}

Return improved copy as a JSON object like: {"content_key_1": "improved value", "content_key_2": "improved value"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    console.log("AI response content:", content);

    try {
      const parsed = JSON.parse(content);
      // Handle both {"key": "val"} and {"suggestions": {"key": "val"}} formats
      const suggestions = parsed.suggestions || parsed;
      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Could not parse AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("ai-content-suggest error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
