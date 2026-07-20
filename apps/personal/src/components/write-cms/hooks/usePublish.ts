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

/* Every published article opens with an "In het kort" summary card
   (:::kort block). If the author didn't write one, derive a starter
   version from the excerpt (split into up to 3 sentences) so no post
   ships without it; the CMS/author can refine afterwards. */
function ensureKortBlock(content: string | null, excerpt: string | null): string | null {
  const md = content || "";
  if (/^:::kort\s*$/m.test(md) || /^:::kort\s/m.test(md)) return null; // already present
  const src = (excerpt || "").trim();
  if (!src) return null; // nothing to derive from — don't invent
  const items = src
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  if (!items.length) return null;
  const block = `:::kort\n${items.join("\n")}\n:::\n\n`;
  return block + md;
}

export function usePublish(onDone?: () => void): UsePublishReturn {
  const [action, setAction] = useState<PublishAction>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const publish = useCallback(async (postId: string) => {
    setAction("publishing");
    setErrorMessage(null);
    try {
      // Guarantee the "In het kort" card on first publish (EN + NL).
      const kortUpdate: Record<string, string> = {};
      try {
        const { data: row } = await supabase
          .from("blog_posts")
          .select("content, content_nl, excerpt, excerpt_nl")
          .eq("id", postId)
          .single();
        if (row) {
          const en = ensureKortBlock(row.content, row.excerpt);
          const nl = ensureKortBlock(row.content_nl, row.excerpt_nl || row.excerpt);
          if (en) kortUpdate.content = en;
          if (nl) kortUpdate.content_nl = nl;
        }
      } catch {
        /* non-blocking — publish continues without the auto-card */
      }

      const { error } = await supabase
        .from("blog_posts")
        .update({
          ...kortUpdate,
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
