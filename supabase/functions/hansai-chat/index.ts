/**
 * hansai-chat — streaming AI chat with auth + provider fallback.
 *
 * Hardened version:
 *   - Auth guard (JWT / apikey / commander token)
 *   - Provider cascade: Gemini Direct → Lovable Gateway → Anthropic Direct
 *   - On provider failure, transparently falls back to next provider
 *   - X-AI-Provider response header indicates which provider served the request
 *   - Existing persona/voice/autonomous logic preserved exactly
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateRequest } from "../_shared/auth.ts";
import { completionWithFallback } from "../_shared/ai-fallback.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-commander-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

// ── SSE adapter: normalize Gemini SSE → OpenAI-style SSE ─────

function geminiToOpenAIStream(geminiRes: Response): ReadableStream {
  const reader = geminiRes.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  return new ReadableStream({
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
            } catch (_) { /* skip malformed */ }
          }
        }
      } catch (e) {
        controller.error(e);
      }
    },
  });
}

/** Convert Anthropic SSE to OpenAI-style SSE */
function anthropicToOpenAIStream(anthropicRes: Response): ReadableStream {
  const reader = anthropicRes.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  return new ReadableStream({
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
            if (!trimmed.startsWith("data: ")) continue;
            const json = trimmed.slice(6).trim();
            if (!json || json === "[DONE]") continue;
            try {
              const data = JSON.parse(json);
              if (data.type === "content_block_delta" && data.delta?.text) {
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ choices: [{ delta: { content: data.delta.text } }] })}\n\n`));
              }
            } catch (_) { /* skip */ }
          }
        }
      } catch (e) {
        controller.error(e);
      }
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // ── Auth guard ──────────────────────────────────────
  const auth = await validateRequest(req);
  if (auth.error) return auth.error;

  try {
    const { messages, model, router_context, autonomous, voice, persona, system_prompt } = await req.json();

    // ── Separate system messages from conversation messages ──
    const rawMessages = messages || [];
    const conversationMessages = rawMessages.filter((m: any) => m.role !== "system");
    const clientSystemMsg = rawMessages.find((m: any) => m.role === "system");

    // ── Build system prompt (client override > persona > voice > default) ──
    const hierarchyHint =
      router_context &&
      typeof router_context === "object" &&
      (router_context.primaryGoal != null || router_context.activeTabs?.length || router_context.subTools?.length)
        ? `\n\nCommand Center focus: primaryGoal=${router_context.primaryGoal ?? "none"}, tabs=[${(router_context.activeTabs ?? []).join(", ")}], subTools=[${(router_context.subTools ?? []).join(", ")}]. When relevant, tailor answers to this context (e.g. SEO, n8n, campaigns, system health).`
        : "";

    let systemContent: string;

    // If the client sends an explicit system_prompt field or a system message,
    // use it directly. This is how Samantha sends its context-rich prompt.
    if (system_prompt && typeof system_prompt === "string" && system_prompt.length > 50) {
      systemContent = system_prompt + hierarchyHint;
    } else if (clientSystemMsg && typeof clientSystemMsg.content === "string" && clientSystemMsg.content.length > 50) {
      systemContent = clientSystemMsg.content + hierarchyHint;
    } else if (persona && typeof persona === "object" && persona.key === "jarvis") {
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

    // ── Provider fallback (streaming) ───────────────────
    const result = await completionWithFallback({
      system: systemContent,
      messages: conversationMessages,
      model: model || "google/gemini-3-flash-preview",
      stream: true,
    });

    if (!result.ok) {
      return new Response(
        JSON.stringify({ error: result.error || "All AI providers failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Normalize SSE stream to OpenAI format ───────────
    const provider = result.provider;
    const rawRes = result.response!;

    let stream: ReadableStream;
    if (provider === "gemini") {
      stream = geminiToOpenAIStream(rawRes);
    } else if (provider === "anthropic") {
      stream = anthropicToOpenAIStream(rawRes);
    } else {
      // Lovable already returns OpenAI-format SSE
      stream = rawRes.body!;
    }

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "X-AI-Provider": provider },
    });
  } catch (error) {
    console.error("hansai-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
