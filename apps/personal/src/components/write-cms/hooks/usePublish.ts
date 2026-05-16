import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const N8N_HOST = "https://n8n.srv1402218.hstgr.cloud";
const AUTO_SEO_URL = `${N8N_HOST}/webhook/blog-auto-seo`;

export type PublishAction = "idle" | "publishing" | "scheduling" | "unpublishing" | "done" | "error";

export interface UsePublishReturn {
  action: PublishAction;
  errorMessage: string | null;
  publish: (postId: string) => Promise<void>;
  unpublish: (postId: string) => Promise<void>;
  schedule: (postId: string, scheduledAt: string) => Promise<void>;
}

export function usePublish(onDone?: () => void): UsePublishReturn {
  const [action, setAction] = useState<PublishAction>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const publish = useCallback(async (postId: string) => {
    setAction("publishing");
    setErrorMessage(null);
    try {
      const { error } = await supabase
        .from("blog_posts")
        .update({
          published: true,
          status: "published",
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId);
      if (error) throw error;

      // Trigger Auto SEO (fire-and-forget — don't block publish on it)
      fetch(AUTO_SEO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId }),
      }).catch(() => {});

      setAction("done");
      onDone?.();
    } catch (err) {
      setAction("error");
      setErrorMessage(err instanceof Error ? err.message : "Publish failed");
    }
  }, [onDone]);

  const unpublish = useCallback(async (postId: string) => {
    setAction("unpublishing");
    setErrorMessage(null);
    try {
      const { error } = await supabase
        .from("blog_posts")
        .update({
          published: false,
          status: "draft",
          scheduled_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId);
      if (error) throw error;
      setAction("done");
      onDone?.();
    } catch (err) {
      setAction("error");
      setErrorMessage(err instanceof Error ? err.message : "Unpublish failed");
    }
  }, [onDone]);

  const schedule = useCallback(async (postId: string, scheduledAt: string) => {
    setAction("scheduling");
    setErrorMessage(null);
    try {
      const { error } = await supabase
        .from("blog_posts")
        .update({
          status: "scheduled",
          scheduled_at: scheduledAt,
          published: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId);
      if (error) throw error;
      setAction("done");
      onDone?.();
    } catch (err) {
      setAction("error");
      setErrorMessage(err instanceof Error ? err.message : "Schedule failed");
    }
  }, [onDone]);

  return { action, errorMessage, publish, unpublish, schedule };
}
