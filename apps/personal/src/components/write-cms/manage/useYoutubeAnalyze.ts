import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Analysis runs in the Supabase edge function `blog-youtube-analyze`
// (oEmbed metadata + transcript best-effort + Claude topic extraction + persistence).

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

export function useYoutubeAnalyze() {
  const [phase, setPhase] = useState<YouTubeAnalyzePhase>("idle");
  const [result, setResult] = useState<YouTubeAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("blog-youtube-analyze", {
        body: { url, video_id: videoId },
      });
      if (fnError) throw new Error(fnError.message ?? "Analyze function failed");
      const data = (fnData ?? {}) as Record<string, unknown>;
      if (data.error) throw new Error(String(data.error));

      // n8n may return the result inline or as { source_id } for async polling
      const sourceId = (data.source_id ?? data.id) as string | undefined;
      if (sourceId) {
        await pollForResult(sourceId);
      } else {
        // Inline result
        setResult({
          sourceId: String(data.stored_source_id ?? ""),
          title: String(data.title ?? ""),
          channelName: String(data.channel_name ?? ""),
          thumbnailUrl: String(data.thumbnail_url ?? ""),
          keyTopics: Array.isArray(data.key_topics) ? (data.key_topics as string[]) : [],
          articleOpportunities: Array.isArray(data.article_opportunities) ? (data.article_opportunities as string[]) : [],
          contextSummary: String(data.context_summary ?? ""),
        });
        setPhase("analyzed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "YouTube analyze failed");
      setPhase("error");
    }
  // pollForResult is a function declaration scoped to the hook and only uses stable React setters.
  // Keeping analyze stable avoids restarting consumers that subscribe to it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pollForResult(sourceId: string, attempts = 0): Promise<void> {
    if (attempts > 20) {
      setError("Analysis timed out after 60s, check n8n workflows.");
      setPhase("error");
      return;
    }
    await sleep(3000);
    const { data } = await (supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> })
      .from("blog_cms_youtube_sources")
      .select("id,title,channel_name,thumbnail_url,key_topics,article_opportunities,context_summary,status,error_message")
      .eq("id", sourceId)
      .maybeSingle() as { data: Record<string, unknown> | null };

    if (!data) return pollForResult(sourceId, attempts + 1);

    const kTopics = Array.isArray(data.key_topics) ? (data.key_topics as string[]) : [];
    if (data.status === "analyzed" || kTopics.length > 0) {
      setResult({
        sourceId: String(data.id),
        title: String(data.title ?? ""),
        channelName: String(data.channel_name ?? ""),
        thumbnailUrl: String(data.thumbnail_url ?? ""),
        keyTopics: kTopics,
        articleOpportunities: Array.isArray(data.article_opportunities) ? (data.article_opportunities as string[]) : [],
        contextSummary: String(data.context_summary ?? ""),
      });
      setPhase("analyzed");
    } else if (data.status === "error") {
      setError(String(data.error_message ?? "n8n analysis failed"));
      setPhase("error");
    } else {
      return pollForResult(sourceId, attempts + 1);
    }
  }

  const reset = useCallback(() => {
    setPhase("idle");
    setResult(null);
    setError(null);
  }, []);

  return { phase, result, error, analyze, reset };
}
