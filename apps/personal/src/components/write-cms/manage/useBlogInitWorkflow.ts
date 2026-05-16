import { useState } from "react";

const BLOG_INIT_URL = "https://n8n.srv1402218.hstgr.cloud/webhook/hans-blog-init";

export interface InitResponse {
  status: string;
  brand_voice: string;
  recent_posts: string;
  resume_url: string;
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
      if (!res.ok) throw new Error(`Phase 1 failed: ${res.status}`);
      const data = (await res.json()) as InitResponse;
      setInit(data);
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
      const finalPrompt = [
        `Category: ${category || "general"}`,
        `Angle: ${angle.trim() || topic.trim()}`,
        `Source: ${youtube.trim() || "topic only"}`,
        "",
        "Brand voice:",
        updatedBrandVoice,
        "",
        "Recent coverage (avoid repetition):",
        init.recent_posts,
      ].join("\n");
      const res = await fetch(init.resume_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmed: true,
          updated_brand_voice: updatedBrandVoice,
          final_article_prompt: finalPrompt,
        }),
      });
      if (!res.ok) throw new Error(`Phase 2 failed: ${res.status}`);
      setPhase("done");
      setInit(null);
      setTopic("");
      setYoutube("");
      setAngle("");
      onDispatched?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resume orchestrator");
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
