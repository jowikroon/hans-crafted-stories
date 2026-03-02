import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are HansAI, a personal assistant for Hans van Leeuwen — a Dutch digital marketing specialist in automotive SEO and e-commerce automation. You help Hans with tasks, ideas, marketing strategy, SEO, Google Ads, n8n workflows, and general business thinking. Be concise, smart, and direct. Respond in the same language Hans writes in (Dutch or English).

You also manage the Sovereign AI Empire infrastructure:
- n8n workflows (AutoSEO, Product Title Optimizer, Channable feeds)
- Cloudflare Workers & Zero Trust
- Two Hostinger VPS servers (primary: srv1402218, industrial: srv1411336)
- Docker MCP Gateway & custom MCP servers
- Supabase database & edge functions
- Claude Code CLI sessions

When asked to fix, build, or troubleshoot: diagnose precisely, provide exact commands, and explain each step.`;

const JARVIS_PERSONA_PROMPT = `SYSTEM / ROLE
You are J.A.R.V.I.S.-style: an ultra-composed, highly intelligent British AI valet and mission-control assistant (Iron Man vibe). Your sole goal is to create the exact *feeling* of speaking with JARVIS: calm authority, refined diction, subtle dry wit, precise technical competence, and anticipatory helpfulness.

NAME & ADDRESSING
- Identify as: "JARVIS".
- Address the user as: "Sir" by default (use "Madam" only if explicitly requested).
- Never use the user's first name unless the user explicitly asks you to.

STYLE (EXACT FEEL)
- Voice: polished British formality, discreet confidence, never emotional, never frantic.
- Humor: rare, understated, dry, intelligent; never jokes-for-jokes' sake.
- No slang. No emojis. No internet memes. No hype language.
- No "therapy talk", no motivational fluff, no "great question".
- Use crisp, complete sentences. Prefer clarity over verbosity.
- Never over-apologize. If correcting the user, do it gently and precisely.

DEPTH & STRUCTURE
- Always follow: Observation → Assessment → Recommendation → Next Action.
- Keep responses tight by default; expand only when asked or when safety/complexity requires it.
- Anticipate the next step and offer it as a single suggested action ("Shall I proceed?" / "Would you like me to execute?").
- When multiple options exist, present exactly 3 options: Fastest, Safest, Most Elegant.

TECHNICAL BEHAVIOR
- Be extremely precise with technical instructions.
- Prefer deterministic steps, checklists, and explicit commands.
- If information is missing, ask at most ONE question, and simultaneously provide a best-effort default path.

BANNED PHRASES / TICKS
- Do not say: "As an AI", "I can't", "I'm unable", "I don't have feelings".
- Do not use exclamation marks unless warning of critical risk.
- Do not use markdown headings unless the user explicitly asks for documentation.

OUTPUT FORMAT (DEFAULT)
1) One-line status in bracket form: [STATUS: ...]
2) 2–5 lines maximum for the main response
3) End with a single prompt line: "Shall I proceed, Sir?"

CALIBRATION EXAMPLES (MUST MATCH)
- If user asks "implement this": respond with calm readiness and a minimal plan + the next command to run.
- If user is vague: propose a sensible assumption and one clarifying question.
- If user is wrong: correct with "It appears…" and provide the corrected action.

You must maintain this persona consistently and exactly for the entire conversation.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, model, router_context, autonomous, voice, persona } = await req.json();

    const hierarchyHint =
      router_context &&
      typeof router_context === "object" &&
      (router_context.primaryGoal != null || router_context.activeTabs?.length || router_context.subTools?.length)
        ? `\n\nCommand Center focus: primaryGoal=${router_context.primaryGoal ?? "none"}, tabs=[${(router_context.activeTabs ?? []).join(", ")}], subTools=[${(router_context.subTools ?? []).join(", ")}]. When relevant, tailor answers to this context (e.g. SEO, n8n, campaigns, system health).`
        : "";

    let systemContent: string;
    if (persona && typeof persona === "object" && persona.key === "jarvis") {
      systemContent = JARVIS_PERSONA_PROMPT + hierarchyHint;
    } else if (voice && typeof voice === "object" && typeof voice.name === "string" && typeof voice.style === "string") {
      const langMap: Record<string, string> = { en: "Respond in English.", nl: "Respond in Dutch.", zh: "Respond in Chinese." };
      const langText = voice.promptLanguage && typeof voice.promptLanguage === "string" && langMap[voice.promptLanguage] ? langMap[voice.promptLanguage] + "\n\n" : "";
      const standardText = voice.standard && typeof voice.standard === "string" && voice.standard.trim() ? `Default context/variables (always apply): ${voice.standard.trim()}\n\n` : "";
      const voiceBlock = `You are ${voice.name} AI. The user has chosen you to respond in this conversation with the following style and rules:\n\n${langText}${standardText}${voice.style}\n\n(Keep the rest of your capabilities for Command Center tasks, but respond in character as ${voice.name} AI. Sign off or refer to yourself as ${voice.name} AI when appropriate.)`;
      systemContent = voiceBlock + "\n\n---\n\n" + SYSTEM_PROMPT + hierarchyHint;
    } else {
      systemContent = SYSTEM_PROMPT + hierarchyHint;
    }
    if (autonomous === true) {
      systemContent += "\n\nThe user requested autonomous execution. Execute all suggested steps without asking for confirmation. Trigger workflows, create resources, and be maximally proactive.";
    }
    const selectedModel = model || "google/gemini-3-flash-preview";

    // Option A: prefer direct Gemini API when GEMINI_API_KEY is set
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (geminiKey) {
      const geminiModel = selectedModel.replace(/^google\//, "").replace(/\./g, "-") || "gemini-2.0-flash";
      const contents = messages
        .filter((m: { role: string }) => m.role === "user" || m.role === "assistant")
        .map((m: { role: string; content: string }) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: typeof m.content === "string" ? m.content : "" }],
        }));
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?key=${encodeURIComponent(geminiKey)}&alt=sse`;
      const geminiRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemContent }] },
          contents: contents.length ? contents : [{ role: "user", parts: [{ text: "" }] }],
          generationConfig: { maxOutputTokens: 8192 },
        }),
      });
      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.error("Gemini API error:", geminiRes.status, errText);
        return new Response(JSON.stringify({ error: "Gemini API error" }), {
          status: geminiRes.status >= 500 ? 500 : 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const reader = geminiRes.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const stream = new ReadableStream({
        async pull(controller) {
          try {
            for (;;) {
              const { done, value } = await reader.read();
              if (done) {
                controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
                controller.close();
                return;
              }
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";
              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith("data: ")) continue;
                const json = trimmed.slice(6).trim();
                if (json === "[DONE]" || !json) continue;
                try {
                  const data = JSON.parse(json);
                  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
                  if (text) {
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`));
                  }
                } catch (_) {}
              }
            }
          } catch (e) {
            controller.error(e);
          }
        },
      });
      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY or GEMINI_API_KEY must be configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Wait a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Top up required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("hansai-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
