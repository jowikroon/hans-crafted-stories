import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ─── blog-voice-suggest (design contract #15b) ────────────────────────────────
// LLM-grade "waarom" for the Stage-2 voice proposal. The React hook
// useVoiceProposal already ranks templates deterministically (Tier-1) and ships
// a recommendation instantly; this function upgrades the recommendation + the
// one-line Dutch rationale to Tier-2 (vendor LLM). The client treats this as a
// best-effort enhancement: if it errors, times out, or the key is missing, the
// deterministic proposal stands. Same gateway as ai-content-suggest.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Candidate {
  id: string;
  name: string;
  tone?: string;
  description?: string;
  writing_style?: string;
  category?: string;
  recently_used?: boolean;
}

interface Signal {
  title?: string;
  angle?: string;
  summary?: string;
  category?: string;
  topics?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const { signal, candidates } = (await req.json()) as { signal: Signal; candidates: Candidate[] };

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return json({ error: "no candidates" }, 400);
    }
    // No key → let the client keep its deterministic pick (soft signal, not an error).
    if (!LOVABLE_API_KEY) {
      return json({ recommended_id: candidates[0].id, reasoning: "", provider: "none" });
    }

    const s = signal ?? {};
    const list = candidates
      .map((c, i) =>
        `${i + 1}. id=${c.id} | "${c.name}"${c.tone ? ` (${c.tone})` : ""} | categorie=${c.category ?? "?"}` +
        `${c.recently_used ? " | LET OP: net nog gebruikt" : ""}` +
        `${c.writing_style ? `\n   stijl: ${String(c.writing_style).slice(0, 160)}` : ""}` +
        `${c.description ? `\n   omschrijving: ${String(c.description).slice(0, 160)}` : ""}`
      )
      .join("\n");

    const systemPrompt =
      `Je bent de hoofdredacteur van Hans van Leeuwen. Je kiest welke van zijn bestaande ` +
      `schrijfstemmen het best past bij een nieuw artikel. Je kent al zijn stemmen (hieronder) ` +
      `en weet wat hij recent schreef. Kies de sterkste match op onderwerp, invalshoek en categorie. ` +
      `Vermijd dezelfde stem als de vorige post tenzij die duidelijk de beste keuze is. ` +
      `Antwoord UITSLUITEND met JSON: {"recommended_id":"<exacte id uit de lijst>","reasoning":"<1 Nederlandse zin, concreet, max 30 woorden, geen aanhalingstekens>"}. ` +
      `De id MOET exact uit de lijst komen.`;

    const userPrompt =
      `ARTIKEL-SIGNAAL\n` +
      `titel: ${s.title ?? ""}\n` +
      `invalshoek: ${s.angle ?? ""}\n` +
      `categorie: ${s.category ?? ""}\n` +
      `onderwerpen: ${(s.topics ?? []).join(", ")}\n` +
      `samenvatting: ${(s.summary ?? "").slice(0, 400)}\n\n` +
      `BESCHIKBARE STEMMEN\n${list}\n\n` +
      `Welke stem en waarom? Geef de JSON.`;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    let content = "";
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) {
        // Soft-fail to the deterministic top pick on rate-limit/credit/other gateway errors.
        return json({ recommended_id: candidates[0].id, reasoning: "", provider: "lovable", gateway_status: res.status });
      }
      const data = await res.json();
      content = data.choices?.[0]?.message?.content || "";
    } finally {
      clearTimeout(timer);
    }

    let recommended_id = candidates[0].id;
    let reasoning = "";
    try {
      const parsed = JSON.parse(content);
      const validIds = new Set(candidates.map((c) => c.id));
      if (parsed.recommended_id && validIds.has(String(parsed.recommended_id))) {
        recommended_id = String(parsed.recommended_id);
      }
      if (typeof parsed.reasoning === "string") reasoning = parsed.reasoning.trim().slice(0, 240);
    } catch {
      // keep deterministic fallback
    }

    return json({ recommended_id, reasoning, provider: "lovable" });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});
