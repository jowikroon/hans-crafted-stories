import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const N8N_HOST = "https://n8n.srv1402218.hstgr.cloud";
const BLOG_INIT_URL = `${N8N_HOST}/webhook/blog-init`;
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
      setError(err instanceof Error ? err.message : "Could not reach blog-init");
      setPhase("error");
    }
  }

  /** Append the active voice template's Voice DNA to the brand-voice context so the
   *  ghost-writer actually writes in Hans's fingerprint (the n8n workflow fetches the
   *  template but never uses it — this is the working path). */
  async function buildDnaSuffix(category: string): Promise<string> {
    try {
      const { data } = await supabase
        .from("hvl_voice_templates")
        .select("calibration_sentence,signature_phrases,strengths,watch_outs,unique_markers,banned_words,tone")
        .eq("category", category)
        .is("archived_at", null)
        .limit(1)
        .maybeSingle();
      if (!data) return "";
      const d = data as {
        calibration_sentence?: string; signature_phrases?: string[]; strengths?: string[];
        watch_outs?: string[]; unique_markers?: string[]; banned_words?: string[]; tone?: string;
      };
      const parts: string[] = [];
      if (d.calibration_sentence?.trim()) parts.push(`Calibration sentence (match this voice exactly): "${d.calibration_sentence.trim()}"`);
      if (d.signature_phrases?.length) parts.push(`Signature phrases to weave in naturally: ${d.signature_phrases.join("; ")}`);
      if (d.strengths?.length) parts.push(`Voice strengths to lean into: ${d.strengths.join("; ")}`);
      if (d.watch_outs?.length) parts.push(`Watch-outs — avoid these habits: ${d.watch_outs.join("; ")}`);
      if (d.unique_markers?.length) parts.push(`Unique markers that distinguish this voice from generic AI prose: ${d.unique_markers.join("; ")}`);
      if (d.banned_words?.length) parts.push(`Banned words (never use): ${d.banned_words.join(", ")}`);
      return parts.length ? `\n\n--- VOICE DNA (${d.tone ?? category}) ---\n${parts.join("\n")}` : "";
    } catch {
      return "";
    }
  }

  async function confirmPhase2(updatedBrandVoice: string, category: string) {
    if (!init) return;
    setPhase("resuming");
    setError(null);
    try {
      const dnaSuffix = await buildDnaSuffix(category);
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
          brand_voice_context: updatedBrandVoice + dnaSuffix,
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
