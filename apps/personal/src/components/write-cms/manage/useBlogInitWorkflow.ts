import { useState } from "react";

const N8N_HOST = "https://n8n.srv1402218.hstgr.cloud";
const BLOG_INIT_URL = `${N8N_HOST}/webhook/hans-blog-init`;
const GHOST_WRITER_URL = `${N8N_HOST}/webhook/blog-ghost-write`;

/** Normalized response after Phase 1 (Blog Init). */
export interface InitResponse {
  brand_voice: string;
  recent_posts: string;
  category: string;
  has_memory: boolean;
}

export type WorkflowPhase = "idle" | "verifying" | "resuming" | "done" | "error";

export interface BlogInitWorkflow {
  topic: string;
  youtube: string;
  angle: string;
  phase: WorkflowPhase;
  init: InitResponse | null;
  error: string | null;
  setTopic: (v: string) => void;
  setYoutube: (v: string) => void;
  setAngle: (v: string) => void;
  startPhase1: (category: string) => Promise<void>;
  confirmPhase2: (updatedBrandVoice: string, category: string) => Promise<void>;
  cancel: () => void;
  onDispatched?: () => void;
}

/** Read HTTP error body (truncated) for display. */
async function describeError(res: Response): Promise<string> {
  let body = "";
  try { body = (await res.text()).slice(0, 200); } catch { /* empty */ }
  return `HTTP ${res.status}${body ? `: ${body}` : ""}`;
}

export function useBlogInitWorkflow(onDispatched?: () => void): BlogInitWorkflow {
  const [topic, setTopic] = useState("");
  const [youtube, setYoutube] = useState("");
  const [angle, setAngle] = useState("");
  const [phase, setPhase] = useState<WorkflowPhase>("idle");
  const [init, setInit] = useState<InitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startPhase1(category: string) {
    if (!topic.trim() && !youtube.trim()) {
      setError("Enter a YouTube URL or topic to start.");
      return;
    }
    setError(null);
    setPhase("verifying");
    try {
      const res = await fetch(BLOG_INIT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: category || "general",
          raw_idea_or_data: youtube.trim() || topic.trim(),
          proposed_angle: angle.trim() || topic.trim(),
        }),
      });
      if (!res.ok) throw new Error(await describeError(res));
      const data = await res.json();

      // Normalize: n8n returns brand_voice_context / narrative_history,
      // but tolerate legacy aliases brand_voice / recent_posts.
      const normalized: InitResponse = {
        brand_voice: data.brand_voice_context ?? data.brand_voice ?? "",
        recent_posts: data.narrative_history ?? data.recent_posts ?? "",
        category: data.category ?? category ?? "general",
        has_memory: data.has_memory ?? (data.brand_voice_context || data.brand_voice ? true : false),
      };
      setInit(normalized);
      setPhase("verifying"); // stays verifying — user must confirm
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach hans-blog-init");
      setPhase("error");
    }
  }

  async function confirmPhase2(updatedBrandVoice: string, category: string) {
    if (!init) return;
    setPhase("resuming");
    setError(null);
    try {
      // POST directly to Ghost Writer — no resume_url needed.
      // Ghost Writer Process Input accepts `title` as the topic/URL.
      const res = await fetch(GHOST_WRITER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: youtube.trim() || topic.trim(),
          language: "nl",
          category: category || "general",
          cluster: "autoriteit",
          proposed_angle: angle.trim() || topic.trim(),
          brand_voice_context: updatedBrandVoice,
          narrative_history: init.recent_posts,
          source: "blog-cms-manage",
          timestamp: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(await describeError(res));
      setPhase("done");
      setInit(null);
      setTopic("");
      setYoutube("");
      setAngle("");
      onDispatched?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ghost Writer dispatch failed");
      setPhase("error");
    }
  }

  function cancel() {
    setInit(null);
    setPhase("idle");
    setError(null);
  }

  return { topic, youtube, angle, phase, init, error, setTopic, setYoutube, setAngle, startPhase1, confirmPhase2, cancel, onDispatched };
}
