import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { keyword } = await req.json();
    if (!keyword) {
      return new Response(JSON.stringify({ success: false, error: "Keyword is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Keyword research for:", keyword);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are an SEO keyword research expert. When given a seed keyword, analyze it and return structured data about related keywords, search intent, and content suggestions.",
          },
          {
            role: "user",
            content: `Analyze the keyword: "${keyword}". Provide comprehensive keyword research data.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "keyword_analysis",
              description: "Return structured keyword research data",
              parameters: {
                type: "object",
                properties: {
                  seed_keyword: { type: "string" },
                  search_intent: {
                    type: "string",
                    enum: ["informational", "navigational", "transactional", "commercial"],
                  },
                  difficulty: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                  },
                  related_keywords: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        keyword: { type: "string" },
                        intent: { type: "string", enum: ["informational", "navigational", "transactional", "commercial"] },
                        difficulty: { type: "string", enum: ["low", "medium", "high"] },
                        relevance: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["keyword", "intent", "difficulty", "relevance"],
                      additionalProperties: false,
                    },
                  },
                  content_suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        type: { type: "string", enum: ["blog post", "guide", "comparison", "listicle", "how-to"] },
                        target_keyword: { type: "string" },
                      },
                      required: ["title", "type", "target_keyword"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string" },
                },
                required: ["seed_keyword", "search_intent", "difficulty", "related_keywords", "content_suggestions", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "keyword_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ success: false, error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ success: false, error: "AI returned no structured data" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, data: analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Keyword research error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
