import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface VoiceTemplate {
  id: string;
  name: string;
  category: string;
  tone: string;
  banned_words: string[];
  content_rules: string | null;
  seo_guidelines: string | null;
  max_sentence_words: number | null;
  passive_voice_max_pct: number | null;
  avg_paragraph_sentences: number | null;
}

export function useVoiceTemplate(category: string | null | undefined) {
  const [template, setTemplate] = useState<VoiceTemplate | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!category) { setTemplate(null); return; }
    setLoading(true);
    (supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> })
      .from("hvl_voice_templates")
      .select("id,name,category,tone,banned_words,content_rules,seo_guidelines,max_sentence_words,passive_voice_max_pct,avg_paragraph_sentences")
      .eq("category", category)
      .is("archived_at", null)
      .order("is_default", { ascending: false })
      .limit(1)
      .then(({ data }: { data: VoiceTemplate[] | null }) => {
        setTemplate(data && data.length > 0 ? data[0] : null);
        setLoading(false);
      });
  }, [category]);

  return { template, loading };
}

/** Extract up to maxTips bullet-style lines from a content_rules string. */
export function parseContentTips(rules: string | null, maxTips = 4): string[] {
  if (!rules) return [];
  return rules
    .split(/[\n\r]+/)
    .map(l => l.replace(/^[-•*\d.)\s]+/, "").trim())
    .filter(l => l.length > 10)
    .slice(0, maxTips);
}

/** Count occurrences of each banned word in content (case-insensitive, whole-word). */
export function countBannedWords(content: string, bannedWords: string[]): { word: string; count: number }[] {
  if (!content || !bannedWords.length) return [];
  const lc = content.toLowerCase();
  return bannedWords
    .map(word => {
      const escaped = word.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matches = lc.match(new RegExp(`\\b${escaped}\\b`, "g"));
      return { word, count: matches ? matches.length : 0 };
    })
    .filter(x => x.count > 0);
}
