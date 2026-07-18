import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { describeFunctionError } from "../manage/useYoutubeAnalyze";

// ─── "Editors at work" — echte scores + toepasbare fixes ─────────────────────
// Eén on-demand LLM-review via de edge function `blog-editor-review` (Anthropic →
// Gemini fallback). Bewust geen review-bij-elke-toetsaanslag: de deterministische
// signalen (banned words, targets) zitten al live in de Voice-kaart; de LLM-pass
// is de dure, diepe blik en draait alleen op "Review nu". Scores persist server-
// side naar blog_posts (voice/seo/readability) + blog_cms_agent_reviews.

export interface EditorIssue {
  id: string;
  dim: "voice" | "seo" | "readability";
  kind: "replace" | "meta" | "manual";
  target?: string;
  replacement?: string;
  note: string;
  why: string;
  delta: number;
}
export interface EditorScores { voice: number; seo: number; readability: number }

export type EditorsStatus = "idle" | "running" | "done" | "error";

interface RunArgs {
  postId: string;
  title: string;
  content: string;
  metaDescription?: string | null;
  category?: string | null;
}

export function useEditorsAtWork() {
  const [status, setStatus] = useState<EditorsStatus>("idle");
  const [scores, setScores] = useState<EditorScores | null>(null);
  const [verdict, setVerdict] = useState<string>("");
  const [issues, setIssues] = useState<EditorIssue[]>([]);
  const [provider, setProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [handled, setHandled] = useState<Record<string, "applied" | "dismissed">>({});
  const [metaBusy, setMetaBusy] = useState(false);

  const runReview = useCallback(async ({ postId, title, content, metaDescription, category }: RunArgs) => {
    setStatus("running");
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("blog-editor-review", {
        body: { action: "score", post_id: postId, title, content, meta_description: metaDescription ?? "", category: category ?? "" },
      });
      if (fnErr) {
        const fe = await describeFunctionError(fnErr);
        throw new Error(fe.message);
      }
      const d = (data ?? {}) as { ok?: boolean; error?: string; scores?: EditorScores; verdict?: string; issues?: EditorIssue[]; provider?: string };
      if (!d.ok || !d.scores) throw new Error(d.error ?? "Review gaf geen resultaat");
      setScores(d.scores);
      setVerdict(d.verdict ?? "");
      setIssues(Array.isArray(d.issues) ? d.issues : []);
      setProvider(d.provider ?? null);
      setHandled({});
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review mislukt");
      setStatus("error");
    }
  }, []);

  /** Pas een replace-fix toe op het juiste taalveld. Retourneert het veld dat
   *  geraakt is, of null als de doeltekst (inmiddels) niet meer bestaat. */
  const applyReplace = useCallback((
    issue: EditorIssue,
    fields: { content: string; content_nl: string },
    setField: (key: "content" | "content_nl", value: string) => void,
  ): "content" | "content_nl" | null => {
    if (issue.kind !== "replace" || !issue.target || issue.replacement == null) return null;
    for (const key of ["content", "content_nl"] as const) {
      const cur = fields[key];
      if (cur.includes(issue.target)) {
        setField(key, cur.replace(issue.target, issue.replacement));
        setHandled((h) => ({ ...h, [issue.id]: "applied" }));
        return key;
      }
    }
    setHandled((h) => ({ ...h, [issue.id]: "dismissed" }));
    return null;
  }, []);

  /** Genereer een meta description en schrijf hem direct op de post (autosave
   *  beheert dit veld niet). Caller doet daarna refetch(). */
  const applyMeta = useCallback(async (issue: EditorIssue, postId: string, title: string, content: string): Promise<string | null> => {
    setMetaBusy(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("blog-editor-review", {
        body: { action: "generate_meta", title, content },
      });
      if (fnErr) throw new Error((await describeFunctionError(fnErr)).message);
      const meta = String((data as { meta_description?: string })?.meta_description ?? "").trim();
      if (!meta) throw new Error("Lege meta description");
      await supabase.from("blog_posts").update({ meta_description: meta }).eq("id", postId);
      setHandled((h) => ({ ...h, [issue.id]: "applied" }));
      return meta;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Meta genereren mislukt");
      return null;
    } finally {
      setMetaBusy(false);
    }
  }, []);

  const dismiss = useCallback((id: string) => setHandled((h) => ({ ...h, [id]: "dismissed" })), []);

  const openIssues = issues.filter((i) => !handled[i.id]);

  return { status, scores, verdict, issues, openIssues, handled, provider, error, metaBusy, runReview, applyReplace, applyMeta, dismiss };
}
