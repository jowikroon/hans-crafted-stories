import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const N8N_HOST = "https://n8n.srv1402218.hstgr.cloud";
const AGENT_REVIEW_URL = `${N8N_HOST}/webhook/blog-agent-review`;
const HEADER_IMAGE_URL = `${N8N_HOST}/webhook/blog-header-image`;

export interface ReviewRow {
  id: string;
  agent_key: string;
  agent_label: string;
  score: number | null;
  status: string;
  output: Record<string, unknown> | string | null;
  created_at: string;
}

export type ReviewsStatus = "idle" | "loading" | "loaded" | "running" | "error";

export interface UseReviewsReturn {
  reviews: ReviewRow[];
  status: ReviewsStatus;
  errorMessage: string | null;
  runAgents: (postId: string) => Promise<void>;
  refetch: () => Promise<void>;
  generateImage: (postId: string) => Promise<void>;
  imageStatus: "idle" | "generating" | "done" | "error";
}

export function useReviews(postId?: string): UseReviewsReturn {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [status, setStatus] = useState<ReviewsStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<"idle" | "generating" | "done" | "error">("idle");

  const fetchReviews = useCallback(async () => {
    if (!postId) return;
    setStatus("loading");
    try {
      const { data, error } = await (supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> })
        .from("blog_cms_agent_reviews")
        .select("id, agent_key, agent_label, score, status, output, created_at")
        .eq("article_id", postId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      setReviews((data ?? []) as unknown as ReviewRow[]);
      setStatus("loaded");
    } catch {
      // Table may not exist or be empty — not a hard error
      setReviews([]);
      setStatus("loaded");
    }
  }, [postId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const runAgents = useCallback(async (id: string) => {
    setStatus("running");
    setErrorMessage(null);
    try {
      const res = await fetch(AGENT_REVIEW_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: id }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Agent review failed (${res.status}): ${text.slice(0, 200)}`);
      }

      const result = await res.json().catch(() => null);

      // Reviewer-uitval is GEEN kwaliteitsoordeel. De n8n-workflow antwoordt bij een
      // LLM-fout met { success:false, total_score:0, verdict:"reject" } — dat mag nooit
      // als afkeuring in de reviews-tabel of de kwaliteitspoort belanden.
      const r = result as { success?: boolean; error?: unknown } | null;
      if (!r || typeof r !== "object" || r.success === false || r.error) {
        const reason = r && typeof r === "object" ? String(r.error ?? "onbekende fout") : "leeg antwoord";
        setStatus("error");
        setErrorMessage(`Reviewer niet beschikbaar — geen oordeel geveld (${reason.slice(0, 140)}). De draft is ongewijzigd; probeer later opnieuw.`);
        return;
      }

      // n8n doesn't persist to blog_cms_agent_reviews (known bug).
      // Save the response from React side if we got valid data.
      if (result && typeof result === "object") {
        try {
          await (supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> })
            .from("blog_cms_agent_reviews")
            .insert({
              article_id: id,
              agent_key: "editorial",
              agent_label: "Editorial Review",
              task: "Full editorial review",
              output: result,
              score: result.overall_score ?? result.score ?? null,
              status: "completed",
              model: result.model ?? "claude-sonnet",
            } as Record<string, unknown>);
        } catch {
          // Insert failed — still show the result
        }
      }

      await fetchReviews();
      setStatus("loaded");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Agent review failed");
    }
  }, [fetchReviews]);

  const generateImage = useCallback(async (id: string) => {
    setImageStatus("generating");
    try {
      const res = await fetch(HEADER_IMAGE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: id }),
      });
      if (!res.ok) throw new Error(`Image generation failed (${res.status})`);
      setImageStatus("done");
    } catch {
      setImageStatus("error");
    }
  }, []);

  return { reviews, status, errorMessage, runAgents, generateImage, imageStatus, refetch: fetchReviews };
}
