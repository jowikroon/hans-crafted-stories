/**
 * google-agent — Gemini-backed agent for Google (Gmail, Sheets, Drive) control.
 *
 * Option B from docs/gemini-google-control.md. Accepts a user message, calls Gemini
 * with a system prompt for Google tasks. Future: add function calling + OAuth to
 * execute Gmail/Sheets/Drive API actions.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the Google control agent for the Sovereign AI Empire. You help with Gmail, Google Sheets, and Google Drive.

When the user asks to do something with their email, sheets, or drive (e.g. "summarize my last 10 emails", "add a row to my SEO sheet", "list my Drive files for project X"):
- Acknowledge the request and explain what you would do.
- For now, you cannot execute actions yet (OAuth and tool execution are being added). Say what steps the user could take manually, or what will be possible once connected.

Keep answers concise and actionable. Respond in the same language the user writes in (Dutch or English).`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const message = body.message ?? body.input ?? "";
    const messages = Array.isArray(body.messages) ? body.messages : [{ role: "user" as const, content: message || "What can you do with my Google?" }];

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const apiKey = geminiKey || lovableKey;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY or LOVABLE_API_KEY required" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const model = "gemini-2.0-flash";

    if (geminiKey) {
      const contents = messages
        .filter((m: { role: string }) => m.role === "user" || m.role === "model")
        .map((m: { role: string; content: string }) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: typeof m.content === "string" ? m.content : "" }],
        }));
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: contents.length ? contents : [{ role: "user", parts: [{ text: message || "What can you do?" }] }],
          generationConfig: { maxOutputTokens: 2048 },
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error("Gemini API error:", res.status, errText);
        return new Response(JSON.stringify({ error: "Gemini API error", reply: "I couldn’t process that. Try again or check your Gemini API key." }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response.";
      return new Response(JSON.stringify({ reply: text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m: { role: string; content: string }) => ({ role: m.role, content: typeof m.content === "string" ? m.content : "" })),
        ],
        max_tokens: 2048,
      }),
    });
    const data = await res.json().catch(() => ({}));
    const reply = data?.choices?.[0]?.message?.content ?? "No response.";
    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("google-agent error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", reply: "Something went wrong." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
