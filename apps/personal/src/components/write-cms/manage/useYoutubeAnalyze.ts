import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Analysis runs in the Supabase edge function `blog-youtube-analyze` (v13+).
// We call it in ASYNC mode: the function replies 202 immediately and keeps
// working server-side (EdgeRuntime.waitUntil); progress + result land in
// `blog_cms_youtube_sources` (status / pipeline_steps / error_message).
// This survives long Gemini video-transcripts that used to kill the request
// on the edge wall-clock and left the UI with a meaningless "non-2xx" error.

export type YouTubeAnalyzePhase = "idle" | "analyzing" | "analyzed" | "error";

export interface YouTubeAnalysisResult {
  sourceId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  keyTopics: string[];
  articleOpportunities: string[];
  contextSummary: string;
}

export function extractVideoId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/** Pull the human-readable error (+ pipeline steps) out of a FunctionsHttpError.
 *  supabase-js only exposes "Edge Function returned a non-2xx status code" on
 *  `.message`; the actual payload lives on `.context` (a Response). */
export async function describeFunctionError(fnError: unknown): Promise<{ message: string; steps: string[] }> {
  const fallback = { message: fnError instanceof Error ? fnError.message : "Analyze function failed", steps: [] as string[] };
  const ctx = (fnError as { context?: Response })?.context;
  if (!ctx || typeof ctx.json !== "function") return fallback;
  try {
    const body = await ctx.json() as { error?: string; steps?: string[] };
    return {
      message: body.error ? String(body.error) : fallback.message,
      steps: Array.isArray(body.steps) ? body.steps.map(String) : [],
    };
  } catch {
    return fallback;
  }
}

interface SourceRow {
  id: string;
  title: string | null;
  channel_name: string | null;
  thumbnail_url: string | null;
  key_topics: string[] | null;
  article_opportunities: string[] | null;
  context_summary: string | null;
  status: string | null;
  error_message: string | null;
  pipeline_steps: string[] | null;
}

/** Start an async analysis and poll the DB until it lands. `onSteps` receives
 *  the live pipeline steps ("transcript via Gemini… 33k tekens" etc.). */
export async function analyzeVideoAsync(
  url: string,
  videoId: string,
  onSteps?: (steps: string[]) => void,
  maxAttempts = 100, // × 3s ≈ 5 min — Gemini-transcripts van lange video's mogen even duren
): Promise<YouTubeAnalysisResult> {
  const { error: fnError } = await supabase.functions.invoke("blog-youtube-analyze", {
    body: { url, video_id: videoId, async: true },
  });
  if (fnError) {
    const { message, steps } = await describeFunctionError(fnError);
    onSteps?.(steps);
    throw new Error(steps.length ? `${message} — laatste stap: ${steps[steps.length - 1]}` : message);
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(3000);
    const { data } = await (supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> })
      .from("blog_cms_youtube_sources")
      .select("id,title,channel_name,thumbnail_url,key_topics,article_opportunities,context_summary,status,error_message,pipeline_steps")
      .eq("video_id", videoId)
      .maybeSingle() as { data: SourceRow | null };

    if (!data) continue;
    if (Array.isArray(data.pipeline_steps) && data.pipeline_steps.length) onSteps?.(data.pipeline_steps.map(String));

    if (data.status === "analyzed") {
      return {
        sourceId: String(data.id),
        title: String(data.title ?? ""),
        channelName: String(data.channel_name ?? ""),
        thumbnailUrl: String(data.thumbnail_url ?? ""),
        keyTopics: Array.isArray(data.key_topics) ? data.key_topics : [],
        articleOpportunities: Array.isArray(data.article_opportunities) ? data.article_opportunities : [],
        contextSummary: String(data.context_summary ?? ""),
      };
    }
    if (data.status === "error") {
      const last = Array.isArray(data.pipeline_steps) && data.pipeline_steps.length ? ` — laatste stap: ${data.pipeline_steps[data.pipeline_steps.length - 1]}` : "";
      throw new Error(`${data.error_message ?? "Analyse mislukt"}${last}`);
    }
    // status "processing" → keep polling
  }
  throw new Error("Analyse duurde langer dan 5 minuten. De video kan erg lang zijn — probeer opnieuw of check de bron in Manage.");
}

export function useYoutubeAnalyze() {
  const [phase, setPhase] = useState<YouTubeAnalyzePhase>("idle");
  const [result, setResult] = useState<YouTubeAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[]>([]);

  const analyze = useCallback(async (url: string) => {
    const videoId = extractVideoId(url);
    if (!videoId) {
      setError("Invalid YouTube URL, cannot extract video ID");
      setPhase("error");
      return;
    }
    setPhase("analyzing");
    setError(null);
    setResult(null);
    setSteps([]);

    try {
      const res = await analyzeVideoAsync(url, videoId, setSteps);
      setResult(res);
      setPhase("analyzed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "YouTube analyze failed");
      setPhase("error");
    }
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setResult(null);
    setError(null);
    setSteps([]);
  }, []);

  return { phase, result, error, steps, analyze, reset };
}
