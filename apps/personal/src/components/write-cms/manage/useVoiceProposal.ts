import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// ─── Voice proposal (design contract #15) ─────────────────────────────────────
// Stage 2 (VOICE) must ALWAYS arrive with a smart proposal, never a blank box.
// It does three things the old n8n-only path could not:
//   1. reads EVERY active voice template (hvl_voice_templates) — "the styles I know"
//   2. reads recent blog_posts — "what's already written" (which voice, how recently)
//   3. ranks them against the Stage-1 analyze signal (topics/angle/summary/category)
//      and returns a recommendation + a one-line Dutch "waarom" + the editable
//      brand-voice context (the same DNA the ghost-writer consumes).
// Fully client-side (Tier-1 deterministic) so it ships via the repo → Cloudflare
// deploy with no edge-function or n8n change and works even if blog-init is down.

export interface VoiceSignal {
  topics: string[];
  angle: string;
  summary: string;
  category: string;
  title: string;
}

export interface VoiceTemplate {
  id: string;
  name: string;
  short_code: string | null;
  category: string;
  tone: string;
  description: string | null;
  writing_style: string;
  target_audience: string;
  perspective: string;
  opening_examples: string[] | null;
  closing_examples: string[] | null;
  transition_examples: string[] | null;
  preferred_terms: string[] | null;
  banned_words: string[] | null;
  content_rules: string;
  is_default: boolean;
}

export interface RankedVoice {
  tpl: VoiceTemplate;
  score: number;
  reasons: string[];
  topicHits: string[];
  recentlyUsed: boolean;
}

export interface VoiceProposal {
  loading: boolean;
  ranked: RankedVoice[];
  chosenId: string | null;
  setChosenId: (id: string) => void;
  chosen: RankedVoice | null;
  /** One-line Dutch rationale for the chosen voice. */
  reasoning: string;
  /** Assembled brand-voice context for the chosen voice (editable downstream). */
  context: string;
  /** True when there are zero templates and we fall back to free text. */
  empty: boolean;
  /** True while the LLM is refining the recommendation (Tier-2 enhancement). */
  aiBusy: boolean;
  /** Source of the shown rationale: "ai" (LLM) or "rule" (deterministic floor). */
  reasoningTier: "ai" | "rule";
}

const STOP = new Set([
  "de","het","een","en","van","op","in","te","met","voor","aan","is","dat","die",
  "ik","je","we","ze","of","als","maar","ook","naar","over","door","bij","uit",
  "the","a","an","and","or","of","to","for","with","on","in","is","that","this",
  "your","you","how","what","why","een","der","den","tot","om","zo","wel","niet",
]);

function tokens(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9à-ÿ\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w));
}

function haystack(t: VoiceTemplate): string {
  return [
    t.name, t.short_code, t.category, t.tone, t.description, t.writing_style,
    t.target_audience, t.perspective, t.content_rules,
    (t.preferred_terms || []).join(" "),
  ].filter(Boolean).join(" ").toLowerCase();
}

/** Build the editable brand-voice context block from a template. */
export function buildContext(t: VoiceTemplate): string {
  const L: string[] = [];
  L.push(`Stem: ${t.name}${t.tone ? ` — ${t.tone}` : ""}.`);
  if (t.writing_style) L.push(`Stijl: ${t.writing_style}.`);
  if (t.perspective) L.push(`Perspectief: ${t.perspective}.`);
  if (t.target_audience) L.push(`Publiek: ${t.target_audience}.`);
  if (t.content_rules?.trim()) L.push(t.content_rules.trim());
  if (t.preferred_terms?.length) L.push(`Voorkeurstermen: ${t.preferred_terms.join(", ")}.`);
  if (t.banned_words?.length) L.push(`Vermijd: ${t.banned_words.join(", ")}.`);
  if (t.opening_examples?.length) L.push(`Voorbeeld-opening: "${t.opening_examples[0]}"`);
  return L.join(" ");
}

export function useVoiceProposal(signal: VoiceSignal): VoiceProposal {
  const [templates, setTemplates] = useState<VoiceTemplate[]>([]);
  const [usage, setUsage] = useState<Record<string, number>>({}); // template_id → recency rank (0 = most recent)
  const [loading, setLoading] = useState(true);
  const [chosenId, setChosenId] = useState<string | null>(null);

  // Tier-2 LLM enhancement (best-effort; never blocks the deterministic floor).
  const [aiBusy, setAiBusy] = useState(false);
  const [llmRecId, setLlmRecId] = useState<string | null>(null);
  const [llmReasoning, setLlmReasoning] = useState("");
  const userPicked = useRef(false);
  const aiKeyRef = useRef<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [tplRes, postRes] = await Promise.all([
        supabase
          .from("hvl_voice_templates")
          .select("id,name,short_code,category,tone,description,writing_style,target_audience,perspective,opening_examples,closing_examples,transition_examples,preferred_terms,banned_words,content_rules,is_default")
          .is("archived_at", null),
        supabase
          .from("blog_posts")
          .select("voice_template_id,updated_at")
          .not("voice_template_id", "is", null)
          .order("updated_at", { ascending: false })
          .limit(20),
      ]);
      if (cancelled) return;
      const tpls = (tplRes.data ?? []) as VoiceTemplate[];
      const seen: Record<string, number> = {};
      let rank = 0;
      for (const row of (postRes.data ?? []) as { voice_template_id: string }[]) {
        if (row.voice_template_id && seen[row.voice_template_id] === undefined) {
          seen[row.voice_template_id] = rank++;
        }
      }
      setTemplates(tpls);
      setUsage(seen);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const { title, angle, summary, category, topics } = signal;
  const topicsKey = topics.join("|");

  const ranked = useMemo<RankedVoice[]>(() => {
    if (!templates.length) return [];
    const needle = new Set(
      tokens([title, angle, summary, topics.join(" ")].join(" "))
    );
    const cat = (category || "").toLowerCase().trim();

    const scored = templates.map((tpl) => {
      const hay = haystack(tpl);
      const reasons: string[] = [];
      let score = 0;

      // Topic / keyword overlap — the core signal.
      const topicHits: string[] = [];
      for (const tok of needle) {
        if (hay.includes(tok)) { score += 3; topicHits.push(tok); }
      }
      // Direct topic-phrase hits weigh extra.
      for (const tp of topics) {
        if (tp && hay.includes(tp.toLowerCase())) score += 2;
      }
      if (topicHits.length) reasons.push(`raakt je onderwerp (${topicHits.slice(0, 3).join(", ")})`);

      // Category match.
      if (cat && tpl.category.toLowerCase() === cat) { score += 8; reasons.push(`past op categorie ${tpl.category}`); }

      // Default voice gets a gentle baseline so it's never left behind.
      if (tpl.is_default) { score += 2; reasons.push("je standaardstem"); }

      // Recency: if this voice carried your last post, nudge toward variety —
      // unless it's also the strongest category/topic match (then keep it).
      const r = usage[tpl.id];
      const recentlyUsed = r === 0;
      if (recentlyUsed && !(cat && tpl.category.toLowerCase() === cat)) {
        score -= 2; reasons.push("net nog gebruikt — afwisseling kan");
      } else if (r !== undefined && r <= 4) {
        reasons.push("zit in je recente stemmen");
      }

      return { tpl, score, reasons, topicHits, recentlyUsed };
    });

    scored.sort((a, b) =>
      b.score - a.score ||
      Number(b.tpl.is_default) - Number(a.tpl.is_default) ||
      a.tpl.name.localeCompare(b.tpl.name)
    );
    return scored;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates, usage, title, angle, summary, category, topicsKey]);

  // Auto-select the top-ranked once data lands (Hans can override).
  useEffect(() => {
    if (chosenId === null && ranked.length) setChosenId(ranked[0].tpl.id);
  }, [ranked, chosenId]);

  // Tier-2: ask the LLM (blog-voice-suggest edge fn) to refine the pick + waarom.
  // Fires once per stable signal; soft-fails to the deterministic proposal.
  useEffect(() => {
    if (loading || ranked.length === 0) return;
    const key = JSON.stringify({ title, angle, category, topicsKey });
    if (aiKeyRef.current === key) return;
    aiKeyRef.current = key;

    let cancelled = false;
    setAiBusy(true);
    (async () => {
      try {
        const candidates = ranked.slice(0, 5).map((r) => ({
          id: r.tpl.id, name: r.tpl.name, tone: r.tpl.tone, description: r.tpl.description,
          writing_style: r.tpl.writing_style, category: r.tpl.category, recently_used: r.recentlyUsed,
        }));
        const { data, error } = await supabase.functions.invoke("blog-voice-suggest", {
          body: { signal: { title, angle, summary, category, topics }, candidates },
        });
        if (cancelled || error) return;
        const d = (data ?? {}) as { recommended_id?: string; reasoning?: string };
        const valid = ranked.some((r) => r.tpl.id === d.recommended_id);
        if (d.reasoning) setLlmReasoning(String(d.reasoning));
        if (valid && d.recommended_id) {
          setLlmRecId(d.recommended_id);
          if (!userPicked.current) setChosenId(d.recommended_id);
        }
      } catch { /* deterministic floor stands */ }
      finally { if (!cancelled) setAiBusy(false); }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, ranked, title, angle, category, topicsKey]);

  const chosen = useMemo(
    () => ranked.find((r) => r.tpl.id === chosenId) ?? ranked[0] ?? null,
    [ranked, chosenId]
  );

  // Prefer the LLM rationale when it explains the currently-chosen voice.
  const reasoningTier: "ai" | "rule" =
    llmReasoning && chosen && chosen.tpl.id === llmRecId ? "ai" : "rule";

  const reasoning = useMemo(() => {
    if (!chosen) return "";
    if (reasoningTier === "ai") return llmReasoning;
    const why = chosen.reasons.filter(Boolean);
    const head = why.length ? why[0].charAt(0).toUpperCase() + why[0].slice(1) : "Beste match op je input";
    const tail = why.slice(1, 3);
    return tail.length ? `${head}; ${tail.join("; ")}.` : `${head}.`;
  }, [chosen, reasoningTier, llmReasoning]);

  const context = useMemo(() => (chosen ? buildContext(chosen.tpl) : ""), [chosen]);

  const setChosen = useCallback((id: string) => { userPicked.current = true; setChosenId(id); }, []);

  return {
    loading,
    ranked,
    chosenId,
    setChosenId: setChosen,
    chosen,
    reasoning,
    context,
    empty: !loading && ranked.length === 0,
    aiBusy,
    reasoningTier,
  };
}
