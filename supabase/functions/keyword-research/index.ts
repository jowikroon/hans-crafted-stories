import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const { keyword } = await req.json();
    if (!keyword || typeof keyword !== "string") {
      return jsonResponse({ success: false, error: "Keyword is required" }, 400);
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!geminiKey && !openaiKey) {
      return jsonResponse({ success: false, error: "No AI API key configured" }, 500);
    }

    const prompt = `You are an expert SEO strategist for e-commerce businesses in the Netherlands and EU, specializing in Amazon and Bol.com marketplaces.

Analyze the seed keyword: "${keyword}"

Return ONLY a JSON object (no markdown, no explanation) with this structure:
{
  "seed_keyword": "${keyword}",
  "search_intent": "transactional|informational|navigational|commercial",
  "difficulty": "low|medium|high",
  "related_keywords": [
    { "keyword": "...", "intent": "...", "difficulty": "...", "relevance": "high|medium|low" }
  ],
  "content_suggestions": [
    { "title": "...", "type": "blog|landing|guide|comparison", "target_keyword": "..." }
  ],
  "summary": "Brief strategic summary of keyword opportunity"
}

Include 8-12 related keywords and 3-5 content suggestions. Focus on Dutch/EU market relevance.`;

    let result: any = null;

    // Try Gemini first. JSON mode + no thinking budget: gemini-2.5-flash otherwise
    // spends the output budget on thinking and returns truncated, unparseable JSON.
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
              temperature: 0.4,
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
        try { result = JSON.parse(cleaned); } catch { console.error("Gemini parse fail:", cleaned.slice(0, 100)); }
      } else {
        console.error("Gemini error:", res.status, (await res.text().catch(() => "")).slice(0, 200));
      }
    }

    // Fallback to OpenAI
    if (!result && openaiKey) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
          response_format: { type: "json_object" },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content ?? "";
        try { result = JSON.parse(text); } catch { console.error("OpenAI parse fail"); }
      } else {
        console.error("OpenAI error:", res.status);
      }
    }

    if (!result) {
      return jsonResponse({ success: false, error: "AI failed to generate keyword analysis" }, 502);
    }

    return jsonResponse({ success: true, data: result });
  } catch (error) {
    console.error("keyword-research error:", error);
    return jsonResponse({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
