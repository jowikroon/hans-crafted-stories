import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import RichEditor from "./RichEditor";

// ─── Dual-language SPLIT editor (design contract A1) ──────────────────────────
// SPLIT / EN / NL tabs, two RichEditors side by side with a divider, the
// non-primary column dimmed, word counts, and a live Translate button that
// fills the empty/target column via the edge function (claude translate action).

type LangMode = "split" | "en" | "nl";

interface Props {
  postId: string;
  contentEN: string;
  contentNL: string;
  onChangeEN: (md: string) => void;
  onChangeNL: (md: string) => void;
  bannedWords: string[];
  linkTargets?: { title: string; slug: string }[];
}

function wordCount(md: string): number {
  const t = (md ?? "").replace(/[#*_>`[\]()!-]/g, " ").replace(/\s+/g, " ").trim();
  return t ? t.split(" ").length : 0;
}

function readMinutes(en: number, nl: number): number {
  return Math.max(1, Math.round(Math.max(en, nl) / 220));
}

export default function LangSplit({ postId, contentEN, contentNL, onChangeEN, onChangeNL, bannedWords, linkTargets = [] }: Props) {
  const [mode, setMode] = useState<LangMode>("split");
  const [translating, setTranslating] = useState<null | "en" | "nl">(null);
  const [translateState, setTranslateState] = useState<"idle" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const wcEN = useMemo(() => wordCount(contentEN), [contentEN]);
  const wcNL = useMemo(() => wordCount(contentNL), [contentNL]);

  // Primary = the language with more words; translate fills the other one.
  const primary: "en" | "nl" = wcEN >= wcNL ? "en" : "nl";
  const target: "en" | "nl" = primary === "en" ? "nl" : "en";

  const translate = useCallback(async () => {
    const sourceMd = primary === "en" ? contentEN : contentNL;
    const sourceText = (sourceMd ?? "").trim();
    if (!sourceText) { setError("Niets om te vertalen — schrijf eerst de bron."); setTranslateState("error"); return; }
    setTranslating(target);
    setError(null);
    setTranslateState("idle");
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("blog-youtube-analyze", {
        body: { action: "translate", text: sourceText.slice(0, 12000), target_lang: target },
      });
      if (fnErr) throw new Error(fnErr.message);
      const d = (data ?? {}) as Record<string, unknown>;
      if (d.error) throw new Error(String(d.error));
      const result = String(d.result ?? "").trim();
      if (!result) throw new Error("Lege vertaling");
      if (target === "nl") onChangeNL(result); else onChangeEN(result);
      setTranslateState("done");
      setTimeout(() => setTranslateState("idle"), 2400);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Vertalen mislukt");
      setTranslateState("error");
    } finally {
      setTranslating(null);
    }
  }, [primary, target, contentEN, contentNL, onChangeEN, onChangeNL]);

  const showEN = mode === "split" || mode === "en";
  const showNL = mode === "split" || mode === "nl";

  const Column = ({ lang, label, value, onChange, dim }: { lang: "en" | "nl"; label: string; value: string; onChange: (md: string) => void; dim: boolean }) => (
    <div className={`lang-col${dim ? " dim" : ""}`}>
      <div className="lang-tag">
        {label}
        {translating === lang && <span className="lang-tag-busy"> · vertalen…</span>}
        {translateState === "done" && lang === target && <span className="lang-tag-done"> · vertaald ✓</span>}
      </div>
      <RichEditor
        docKey={`${postId}:${lang}`}
        value={value}
        placeholder={`Start ${label} content...`}
        onChange={onChange}
        bannedWords={bannedWords}
        lang={lang}
        linkTargets={linkTargets}
      />
    </div>
  );

  return (
    <div className="paper paper--editor-en lang-split-wrap">
      <div className="paper-head">
        <div className="lang-tabs">
          {(["split", "en", "nl"] as LangMode[]).map((m) => (
            <button key={m} className={`lang-tab${mode === m ? " on" : ""}`} onClick={() => setMode(m)}>
              {m === "split" ? "SPLIT" : m.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="paper-head-end">
          <span className="lang-stats">{wcEN.toLocaleString()} EN · {wcNL.toLocaleString()} NL · ~{readMinutes(wcEN, wcNL)} min</span>
          <button
            className={`focus-chip translate-chip${translating ? " working" : ""}${translateState === "done" ? " done" : ""}`}
            onClick={translate}
            disabled={!!translating}
            title={`Vertaal ${primary.toUpperCase()} → ${target.toUpperCase()} (vult de ${target.toUpperCase()}-kolom)`}
          >
            {translating ? (
              <>⟳ {primary.toUpperCase()}→{target.toUpperCase()}…</>
            ) : translateState === "done" ? (
              <>✓ Vertaald</>
            ) : (
              <>↔ {primary.toUpperCase()}→{target.toUpperCase()}</>
            )}
          </button>
        </div>
      </div>

      <div className={`editor-body ${mode}`}>
        {showEN && <Column lang="en" label="EN" value={contentEN} onChange={onChangeEN} dim={mode === "split" && primary !== "en"} />}
        {mode === "split" && <div className="lang-divider" />}
        {showNL && <Column lang="nl" label="NL" value={contentNL} onChange={onChangeNL} dim={mode === "split" && primary !== "nl"} />}
      </div>

      {error && (
        <div className="split-error">{error}<button onClick={() => setError(null)}>×</button></div>
      )}
    </div>
  );
}
