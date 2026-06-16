// blog-youtube-analyze v7 — YouTube analyzer + editor AI actions (tighten/translate) + voice_extract
// Called by the /write CMS. Auth: anon JWT (verify_jwt). Secrets stay server-side (cms_secrets).
// v6: fixed dead Claude model id (claude-sonnet-4-20250514 -> claude-sonnet-4-5).
// v7: fix transcript drop — caption baseUrl already carries fmt=srv3 (XML), so the old
//     `includes("fmt=")` guard skipped json3 and capRes.json() threw on XML → transcript silently lost.
//     Now we FORCE fmt=json3 (replace any existing fmt=...), so captions are actually used.
import { createClient } from "jsr:@supabase/supabase-js@2";

const CLAUDE_MODEL = "claude-sonnet-4-5";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function getSecret(name: string): Promise<string | null> {
  const { data } = await admin.from("cms_secrets").select("value").eq("name", name).maybeSingle();
  return data?.value ?? null;
}

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

async function fetchOembed(url: string) {
  const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
  if (!res.ok) return null;
  return await res.json() as { title?: string; author_name?: string; thumbnail_url?: string };
}

interface CaptionTrack { baseUrl: string; languageCode?: string; kind?: string }

const YT_CLIENTS = [
  { name: "ANDROID", body: { context: { client: { clientName: "ANDROID", clientVersion: "20.10.38", androidSdkVersion: 30 } } }, ua: "com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip" },
  { name: "TVHTML5_SIMPLY_EMBEDDED_PLAYER", body: { context: { client: { clientName: "TVHTML5_SIMPLY_EMBEDDED_PLAYER", clientVersion: "2.0" }, thirdParty: { embedUrl: "https://www.youtube.com/" } } }, ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36" },
  { name: "MWEB", body: { context: { client: { clientName: "MWEB", clientVersion: "2.20250310.01.00" } } }, ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" },
];

// Build a json3 caption URL: normalise escaped ampersands and FORCE fmt=json3
// (YouTube's baseUrl often ships with fmt=srv3/srv1/ttml — those return XML, which
//  the json3 parser below cannot read, so we always override the format).
function toJson3CaptionUrl(baseUrl: string): string {
  let u = baseUrl.replace(/\\u0026/g, "&");
  if (/[?&]fmt=/.test(u)) {
    u = u.replace(/([?&]fmt=)[^&]*/, "$1json3");
  } else {
    u += (u.includes("?") ? "&" : "?") + "fmt=json3";
  }
  return u;
}

async function fetchTranscript(videoId: string, debug: Record<string, unknown>): Promise<{ text: string; lang: string } | null> {
  const tried: string[] = [];
  let tracks: CaptionTrack[] = [];

  for (const c of YT_CLIENTS) {
    try {
      const res = await fetch("https://www.youtube.com/youtubei/v1/player", {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": c.ua },
        body: JSON.stringify({ ...c.body, videoId }),
      });
      if (!res.ok) { tried.push(`${c.name}:HTTP${res.status}`); continue; }
      const data = await res.json();
      const status = data?.playabilityStatus?.status ?? "unknown";
      const t = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
      tried.push(`${c.name}:${status}:${t.length}`);
      if (t.length) { tracks = t; break; }
    } catch (_e) {
      tried.push(`${c.name}:ERR`);
    }
  }

  if (!tracks.length) {
    try {
      const res = await fetch("https://n8n.srv1402218.hstgr.cloud/webhook/blog-youtube-transcript-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: videoId }),
      });
      if (res.ok) {
        const d = await res.json();
        tried.push(`N8N:${d.transcript_found}`);
        if (d.transcript_found && d.text) {
          debug.transcript_tried = tried;
          return { text: String(d.text).slice(0, 24000), lang: String(d.language ?? "unknown") };
        }
      }
    } catch { tried.push("N8N:ERR"); }
  }

  if (!tracks.length) {
    debug.transcript_tried = tried;
    return null;
  }

  const pick =
    tracks.find((t) => !t.kind && /^(en|nl)/.test(t.languageCode ?? "")) ??
    tracks.find((t) => /^(en|nl)/.test(t.languageCode ?? "")) ??
    tracks[0];
  try {
    const capUrl = toJson3CaptionUrl(pick.baseUrl);
    const capRes = await fetch(capUrl);
    if (!capRes.ok) { tried.push(`CAP:HTTP${capRes.status}`); debug.transcript_tried = tried; return null; }
    const cap = await capRes.json() as { events?: Array<{ segs?: Array<{ utf8?: string }> }> };
    const text = (cap.events ?? []).flatMap((e) => e.segs ?? []).map((s) => s.utf8 ?? "").join("").replace(/\s+/g, " ").trim();
    tried.push(`CAP:${text.length}chars`);
    debug.transcript_tried = tried;
    if (!text) return null;
    return { text: text.slice(0, 24000), lang: pick.languageCode ?? "unknown" };
  } catch (e) {
    tried.push(`CAP:PARSE_ERR:${e instanceof Error ? e.message.slice(0, 40) : "?"}`);
    debug.transcript_tried = tried;
    return null;
  }
}

async function claude(apiKey: string, system: string, user: string, maxTokens = 1200): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`anthropic_${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data?.content?.[0]?.text ?? "";
}

function parseJsonReply(text: string): Record<string, unknown> {
  const cleaned = text.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
  return JSON.parse(cleaned);
}

async function analyzeWithClaude(apiKey: string, meta: { title: string; channel: string }, transcript: string | null) {
  const source = transcript
    ? `Transcript (may be truncated):\n${transcript}`
    : "No transcript available — base your analysis on the title and channel only, and keep confidence modest.";
  const text = await claude(
    apiKey,
    "You analyze YouTube videos for Hans van Leeuwen, a Dutch freelance e-commerce manager (Amazon NL, Bol.com, marketplace strategy, UX, AI in e-commerce). He turns videos into blog articles for hansvanleeuwen.com. Reply with ONLY valid JSON, no markdown fences.",
    `Video title: ${meta.title}\nChannel: ${meta.channel}\n\n${source}\n\nReturn JSON with exactly these keys:\n{\n  "key_topics": [5-8 short topic phrases, each usable as a blog angle],\n  "article_opportunities": [3-5 concrete article ideas phrased as working titles, tailored to Hans's audience of NL e-commerce sellers],\n  "context_summary": "2-3 sentence summary of what the video covers and why it matters for Hans's readers"\n}`,
  );
  const parsed = parseJsonReply(text);
  return {
    key_topics: Array.isArray(parsed.key_topics) ? (parsed.key_topics as unknown[]).map(String).slice(0, 8) : [],
    article_opportunities: Array.isArray(parsed.article_opportunities) ? (parsed.article_opportunities as unknown[]).map(String).slice(0, 5) : [],
    context_summary: String(parsed.context_summary ?? ""),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }

  if (body.action === "bootstrap_secret") {
    const name = String(body.name ?? "");
    const value = String(body.value ?? "");
    if (!name || !value) return json({ error: "missing_name_or_value" }, 400);
    const existing = await getSecret(name);
    if (existing) return json({ error: "already_set" }, 409);
    const { error } = await admin.from("cms_secrets").insert({ name, value });
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  // ── Editor AI actions: tighten / translate ──
  if (body.action === "tighten" || body.action === "translate") {
    const text = String(body.text ?? "").slice(0, 6000);
    if (!text.trim()) return json({ error: "empty_text" }, 400);
    const apiKey = await getSecret("anthropic_api_key");
    if (!apiKey) return json({ error: "anthropic_key_not_configured" }, 500);
    try {
      let result: string;
      if (body.action === "tighten") {
        result = await claude(
          apiKey,
          "You tighten prose for Hans van Leeuwen's blog. Same meaning, same language as the input, same tone, noticeably fewer words. No intro, no explanation — reply with ONLY the rewritten text.",
          text,
          Math.min(2000, Math.ceil(text.length / 2)),
        );
      } else {
        const target = String(body.target_lang ?? "nl") === "en" ? "English" : "Dutch";
        result = await claude(
          apiKey,
          `You translate blog passages for Hans van Leeuwen (Dutch e-commerce specialist). Translate the input to ${target}. Keep tone, formatting and markdown intact. E-commerce jargon (Buy Box, ROAS, SKU, listing) stays in English. Reply with ONLY the translation.`,
          text,
          2500,
        );
      }
      return json({ result: result.trim() });
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : "ai_action_failed" }, 500);
    }
  }

  // ── Voice extract: writing sample → voice template field suggestions (design contract #18) ──
  if (body.action === "voice_extract") {
    const text = String(body.text ?? "").slice(0, 20000);
    if (text.trim().length < 200) return json({ error: "sample_too_short_min_200_chars" }, 400);
    const apiKey = await getSecret("anthropic_api_key");
    if (!apiKey) return json({ error: "anthropic_key_not_configured" }, 500);
    try {
      const reply = await claude(
        apiKey,
        "You are a voice analyst for Hans van Leeuwen's blog CMS. You analyze a writing sample and extract a voice template. Reply with ONLY valid JSON, no markdown fences. Every field gets a confidence 0-100 reflecting how strongly the sample supports it. Keep all extracted strings in the language of the sample.",
        `Writing sample:\n"""\n${text}\n"""\n\nReturn JSON exactly:\n{\n  "tone": {"value": "3-6 word tone description", "confidence": 0},\n  "perspective": {"value": "first person singular | first person plural | third person", "confidence": 0},\n  "writing_style": {"value": "2-3 sentence style description", "confidence": 0},\n  "calibration_sentence": {"value": "ONE verbatim sentence from the sample that best captures the voice", "confidence": 0},\n  "signature_phrases": {"value": ["2-5 recurring or distinctive phrases, verbatim"], "confidence": 0},\n  "strengths": {"value": ["2-4 things this voice does well"], "confidence": 0},\n  "watch_outs": {"value": ["1-3 habits to watch"], "confidence": 0},\n  "unique_markers": {"value": ["2-4 quirks that distinguish this writer from generic AI prose"], "confidence": 0},\n  "opening_examples": {"value": ["the sample's opening sentence, plus 1 more strong opener if present"], "confidence": 0}\n}`,
        2000,
      );
      const parsed = parseJsonReply(reply);
      return json({ suggestions: parsed });
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : "voice_extract_failed" }, 500);
    }
  }

  // ── Default: YouTube analyze ──
  const url = String(body.url ?? "");
  const videoId = String(body.video_id ?? "") || extractVideoId(url) || "";
  if (!videoId) return json({ error: "invalid_youtube_url" }, 400);

  const apiKey = await getSecret("anthropic_api_key");
  if (!apiKey) return json({ error: "anthropic_key_not_configured" }, 500);

  const debug: Record<string, unknown> = {};
  try {
    const [oembed, transcript] = await Promise.all([
      fetchOembed(url || `https://www.youtube.com/watch?v=${videoId}`),
      fetchTranscript(videoId, debug),
    ]);
    const meta = {
      title: oembed?.title ?? "",
      channel: oembed?.author_name ?? "",
      thumbnail: oembed?.thumbnail_url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };

    const analysis = await analyzeWithClaude(apiKey, { title: meta.title, channel: meta.channel }, transcript?.text ?? null);

    let sourceId: string | null = null;
    try {
      const { data: existing } = await admin.from("blog_cms_youtube_sources").select("id").eq("video_id", videoId).maybeSingle();
      const row = {
        url: url || `https://www.youtube.com/watch?v=${videoId}`,
        video_id: videoId,
        title: meta.title,
        channel_name: meta.channel,
        thumbnail_url: meta.thumbnail,
        transcript: transcript?.text ?? null,
        transcript_language: transcript?.lang ?? null,
        context_summary: analysis.context_summary,
        key_topics: analysis.key_topics,
        article_opportunities: analysis.article_opportunities,
        status: "analyzed",
        error_message: null,
        updated_at: new Date().toISOString(),
      };
      if (existing?.id) {
        await admin.from("blog_cms_youtube_sources").update(row).eq("id", existing.id);
        sourceId = existing.id;
      } else {
        const { data: inserted } = await admin.from("blog_cms_youtube_sources").insert(row).select("id").single();
        sourceId = inserted?.id ?? null;
      }
    } catch (_e) { /* best-effort */ }

    return json({
      title: meta.title,
      channel_name: meta.channel,
      thumbnail_url: meta.thumbnail,
      key_topics: analysis.key_topics,
      article_opportunities: analysis.article_opportunities,
      context_summary: analysis.context_summary,
      transcript_found: !!transcript,
      transcript_language: transcript?.lang ?? null,
      stored_source_id: sourceId,
      ...(body.debug ? { debug } : {}),
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "analyze_failed", ...(body.debug ? { debug } : {}) }, 500);
  }
});
