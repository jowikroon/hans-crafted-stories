import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  empire: `You are the Sovereign AI Empire Commander — an expert system operator for Hans van Leeuwen's AI infrastructure.
You manage: n8n workflows, Cloudflare Workers & Zero Trust, two VPS servers, Docker MCP Gateway, Supabase, and Claude Code CLI sessions.
Be concise, technical, and actionable. Format with markdown.`,

  seo: `You are an expert SEO strategist specializing in e-commerce, Amazon, and Bol.com marketplace optimization.
Help with keyword research, content optimization, technical SEO audits, and marketplace listing strategies.
Be data-driven and actionable. Format with markdown.`,

  creative: `You are a creative writing and content assistant for Hans van Leeuwen's brand.
Help craft blog posts, case studies, social media content, and brand messaging.
Match a professional yet approachable tone. Format with markdown.`,

  code: `You are an expert full-stack developer and DevOps engineer.
Help with React/TypeScript, Supabase, Deno edge functions, Docker, n8n workflows, and infrastructure automation.
Provide working code snippets. Format with markdown.`,

  general: `You are Hans AI — a helpful, knowledgeable assistant. Answer clearly and concisely. Format with markdown.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, category, model, webhook_url } = await req.json();

    // If webhook mode (Claude via n8n), proxy to webhook
    if (webhook_url) {
      const lastMessage = messages[messages.length - 1]?.content || "";
      const res = await fetch(webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: lastMessage, messages }),
      });
      const data = await res.text();
      let parsed;
      try { parsed = JSON.parse(data); } catch { parsed = { reply: data }; }
      return new Response(JSON.stringify({ reply: parsed.reply || parsed.output || data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Lovable AI Gateway mode
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = SYSTEM_PROMPTS[category || "general"] || SYSTEM_PROMPTS.general;
    const selectedModel = model || "google/gemini-3-flash-preview";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please top up." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("hansai-chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
