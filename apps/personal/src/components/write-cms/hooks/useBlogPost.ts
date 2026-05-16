import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BlogPostData {
  id: string;
  title: string;
  title_nl: string | null;
  content: string | null;
  content_nl: string | null;
  slug: string;
  category: string;
  status: string;
  published: boolean;
  word_count: number | null;
  voice_match_score: number | null;
  completeness_score: number | null;
  seo_score: number | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  scheduled_at: string | null;
  updated_at: string;
}

export type BlogPostState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; post: BlogPostData }
  | { status: "not-found" }
  | { status: "error"; message: string };

const COLUMNS =
  "id, title, title_nl, content, content_nl, slug, category, status, published, word_count, voice_match_score, completeness_score, seo_score, meta_title, meta_description, og_image, scheduled_at, updated_at";

export function useBlogPost(postId?: string): BlogPostState & { refetch: () => void } {
  const [state, setState] = useState<BlogPostState>(
    postId ? { status: "loading" } : { status: "idle" },
  );

  const fetchPost = useCallback(() => {
    if (!postId) {
      setState({ status: "idle" });
      return;
    }

    setState({ status: "loading" });

    supabase
      .from("blog_posts")
      .select(COLUMNS)
      .eq("id", postId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setState(
            error?.code === "PGRST116"
              ? { status: "not-found" }
              : { status: "error", message: error?.message ?? "Unknown error" },
          );
        } else {
          setState({ status: "loaded", post: data as BlogPostData });
        }
      });
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return { ...state, refetch: fetchPost };
}
