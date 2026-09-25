import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-commander-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { page, group, fields } = await req.json();

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return jsonResponse({ error: "No fields provided" }, 400);
    }

    // Try Gemini first, fallback to OpenAI
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!geminiKey && !openaiKey) {
      return jsonResponse({ error: "No AI API key configured (GEMINI_API_KEY or OPENAI_API_KEY)" }, 500);
    }

    const fieldDescriptions = fields.map((f: any) =>
      `- ${f.content_label} (key: ${f.content_key}, type: ${f.content_type}): current value = "${(f.content_value || "").slice(0, 200)}"`
    ).join("\n");

    const prompt = `You are a professional copywriter for hansvanleeuwen.com, the site of a freelance e-commerce manager specializing in Amazon and Bol.com marketplaces in the Netherlands.

I need you to suggest improved text for the following fields on the "${page}" page, section "${group}".

Current fields:
${fieldDescriptions}

Rules:
- Write in English unless the field label suggests Dutch
- Be concise, professional, strategic
- Optimize for SEO (e-commerce, Amazon, Bol.com, marketplace management)
- Keep headings short and punchy
- Keep descriptions scannable and benefit-focused
- Never use an em dash (U+2014); use a comma, colon, parentheses or a new sentence instead
- Return ONLY a JSON object mapping content_key to suggested value
- Do not include any explanation, just the JSON object

Respond with JSON only:`;

    let suggestions: Record<string, string> = {};

    // JSON mode + no thinking budget: gemini-2.5-flash otherwise spends the
    // output budget on thinking and returns truncated, unparseable JSON.
    if (geminiKey) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 8192,
              temperature: 0.7,
              responseMimeType: "application/json",
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        try {
          suggestions = JSON.parse(cleaned);
        } catch {
          console.error("Failed to parse Gemini response:", cleaned.slice(0, 200));
        }
      } else {
        console.error("Gemini error:", res.status, await res.text().catch(() => ""));
      }
    }

    // Fallback to OpenAI if Gemini failed
    if (Object.keys(suggestions).length === 0 && openaiKey) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content ?? "";
        try {
          suggestions = JSON.parse(text);
        } catch {
          console.error("Failed to parse OpenAI response:", text.slice(0, 200));
        }
      } else {
        console.error("OpenAI error:", res.status);
      }
    }

    if (Object.keys(suggestions).length === 0) {
      return jsonResponse({ error: "AI failed to generate suggestions. Check API keys." }, 502);
    }

    return jsonResponse({ suggestions });
  } catch (error) {
    console.error("ai-content-suggest error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
