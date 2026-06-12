import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// ─── 4-stage YouTube → Article modal (design contract #14) ────────────────────
// The design prototype's animated flow, wired to the REAL pipeline:
//   Stage 1 ANALYZE  — edge fn blog-youtube-analyze (topics/summary, typewriter)
//   Stage 2 VOICE    — n8n blog-init (brand voice memory, editable confirm)
//   Stage 3 GHOST    — n8n blog-ghost-write (~40s, animated stage ticker)
//   Stage 4 DONE     — draft card + gates + review score + open-in-editor
// Animations: typewriter results, stage rail with pulse, progress shimmer, done stamp.

const N8N = "https://n8n.srv1402218.hstgr.cloud";

interface Props {
  youtube: string;
  topic: string;
  angle: string;
  category: string;
  onClose: () => void;
  onDone: () => void;
}

type Stage = 1 | 2 | 3 | 4;

interface GhostResult {
  post_id?: string;
  title?: string;
  word_count?: number;
  reading_time?: string;
  gaps_count?: number;
  editorial_stage?: string;
  review_scores?: { hoofdredacteur?: number | null };
  linkedin_post_nl?: string;
  seo?: { meta_title?: string; meta_description?: string };
  error?: string;
}

/** Typewriter that reveals lines one by one. */
function useTypewriter(lines: string[], speed = 14) {
  const [out, setOut] = useState<string[]>([]);
  const idx = useRef(0);
  const chars = useRef(0);

  useEffect(() => {
    idx.current = 0;
    chars.current = 0;
    setOut([]);
    if (!lines.length) return;
    const t = setInterval(() => {
      const li = idx.current;
      if (li >= lines.length) { clearInterval(t); return; }
      chars.current += 2;
      const line = lines[li];
      setOut((prev) => {
        const next = [...prev];
        next[li] = line.slice(0, chars.current);
        return next;
      });
      if (chars.current >= line.length) { idx.current += 1; chars.current = 0; }
    }, speed);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines.join("")]);

  return out;
}

const GHOST_TICKER = [
  "Transcript ophalen (Gemini)…",
  "Editorial brief bouwen (Claude Haiku)…",
  "Skeleton draft schrijven in jouw stem (Claude Sonnet)…",
  "Hoofdredacteur-review…",
  "Anti-detectie pass + SEO-metadata…",
  "Draft opslaan…",
];

export default function YouTubeStageModal({ youtube, topic, angle, category, onClose, onDone }: Props) {
  const [stage, setStage] = useState<Stage>(1);
  const [error, setError] = useState<string | null>(null);

  // Stage 1
  const [analysisLines, setAnalysisLines] = useState<string[]>([]);
  const typedAnalysis = useTypewriter(analysisLines);
  const [analysisDone, setAnalysisDone] = useState(false);

  // Stage 2
  const [brandVoice, setBrandVoice] = useState("");
  const [hasMemory, setHasMemory] = useState(false);
  const [initBusy, setInitBusy] = useState(false);

  // Stage 3
  const [tick, setTick] = useState(0);
  const [ghost, setGhost] = useState<GhostResult | null>(null);

  const isYoutube = !!youtube.trim();
  const source = youtube.trim() || topic.trim();

  // Watchdog: if the analyze call hangs (VPN/extension/network), unlock the skip path
  useEffect(() => {
    if (analysisDone) return;
    const t = setTimeout(() => {
      setAnalysisLines((prev) => prev.length ? prev : [
        "> analyse duurt te lang (netwerk?) — je kunt zonder analyse door",
        "> de ghost-writer haalt het transcript zelf op ✓",
      ]);
      setAnalysisDone(true);
    }, 25000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisDone]);

  // ── Stage 1: analyze ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isYoutube) {
        setAnalysisLines([
          `> bron: eigen topic`,
          `> "${topic.trim()}"`,
          angle.trim() ? `> invalshoek: ${angle.trim()}` : `> geen invalshoek — ghost-writer kiest`,
          `> analyse overgeslagen (geen video) — door naar voice check ✓`,
        ]);
        setAnalysisDone(true);
        return;
      }
      try {
        const { data, error: fnErr } = await supabase.functions.invoke("blog-youtube-analyze", {
          body: { url: youtube.trim() },
        });
        if (cancelled) return;
        if (fnErr) throw new Error(fnErr.message);
        const d = (data ?? {}) as Record<string, unknown>;
        if (d.error) throw new Error(String(d.error));
        const topics = Array.isArray(d.key_topics) ? (d.key_topics as string[]) : [];
        const opps = Array.isArray(d.article_opportunities) ? (d.article_opportunities as string[]) : [];
        setAnalysisLines([
          `> video: ${String(d.title ?? "")}`,
          `> kanaal: ${String(d.channel_name ?? "")}`,
          `> transcript: ${d.transcript_found ? "gevonden ✓" : "niet beschikbaar — analyse op titel/kanaal"}`,
          `> topics: ${topics.slice(0, 4).join(" · ")}`,
          ...(opps.length ? [`> sterkste invalshoek: ${opps[0]}`] : []),
          `> samenvatting: ${String(d.context_summary ?? "").slice(0, 180)}`,
          `> analyse compleet ✓`,
        ]);
        setAnalysisDone(true);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Analyse mislukt");
          setAnalysisLines(["> analyse mislukt — je kunt zonder analyse door; de ghost-writer haalt het transcript zelf op ✓"]);
          setAnalysisDone(true);
        }
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Stage 2: voice memory ──
  const startVoiceCheck = useCallback(async () => {
    setStage(2);
    setInitBusy(true);
    setError(null);
    try {
      const res = await fetch(`${N8N}/webhook/blog-init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: category || "general", raw_idea_or_data: source, proposed_angle: angle.trim() || topic.trim() }),
      });
      if (!res.ok) throw new Error(`blog-init HTTP ${res.status}`);
      const d = await res.json();
      setBrandVoice(String(d.brand_voice_context ?? ""));
      setHasMemory(!!d.has_memory);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Voice check mislukt");
    } finally {
      setInitBusy(false);
    }
  }, [category, source, angle, topic]);

  // ── Stage 3: ghost-write (with DNA suffix, same path as useBlogInitWorkflow) ──
  const startGhostWrite = useCallback(async (voiceText: string) => {
    setStage(3);
    setError(null);
    setTick(0);
    const ticker = setInterval(() => setTick((t) => Math.min(t + 1, GHOST_TICKER.length - 1)), 9000);
    try {
      let dnaSuffix = "";
      try {
        const { data } = await supabase
          .from("hvl_voice_templates")
          .select("calibration_sentence,signature_phrases,watch_outs,banned_words,tone")
          .eq("category", category)
          .is("archived_at", null)
          .limit(1)
          .maybeSingle();
        const v = data as { calibration_sentence?: string; signature_phrases?: string[]; watch_outs?: string[]; banned_words?: string[]; tone?: string } | null;
        if (v) {
          const parts: string[] = [];
          if (v.calibration_sentence?.trim()) parts.push(`Calibration sentence: "${v.calibration_sentence.trim()}"`);
          if (v.signature_phrases?.length) parts.push(`Signature phrases: ${v.signature_phrases.join("; ")}`);
          if (v.watch_outs?.length) parts.push(`Watch-outs: ${v.watch_outs.join("; ")}`);
          if (v.banned_words?.length) parts.push(`Banned words: ${v.banned_words.join(", ")}`);
          if (parts.length) dnaSuffix = `\n\n--- VOICE DNA (${v.tone ?? category}) ---\n${parts.join("\n")}`;
        }
      } catch { /* DNA is optional */ }

      const res = await fetch(`${N8N}/webhook/blog-ghost-write`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: source,
          language: "nl",
          category: category || "general",
          cluster: "autoriteit",
          proposed_angle: angle.trim() || topic.trim(),
          brand_voice_context: voiceText + dnaSuffix,
          narrative_history: "",
          source: "blog-cms-stage-modal",
          timestamp: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`ghost-write HTTP ${res.status}${body ? `: ${body.slice(0, 120)}` : ""}`);
      }
      const d = (await res.json()) as GhostResult;
      if (d.error) throw new Error(String(d.error));
      setGhost(d);
      setStage(4);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ghost-write mislukt");
    } finally {
      clearInterval(ticker);
    }
  }, [category, source, angle, topic, onDone]);

  const stageLabel = ["", "ANALYZE", "VOICE", "GHOST-WRITE", "DONE"][stage];

  return (
    <div className="stage-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget && stage !== 3) onClose(); }}>
      <div className="stage-modal">
        {/* Stage rail */}
        <div className="stage-rail">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`stage-dot${stage === s ? " is-active" : ""}${stage > s ? " is-done" : ""}`}>
              <span className="dot" />
              <span className="lbl">{["Analyze", "Voice", "Ghost-write", "Done"][s - 1]}</span>
            </div>
          ))}
          <button className="stage-close" title={stage === 3 ? "Ghost-write loopt — even geduld" : "Sluiten"} onClick={() => stage !== 3 && onClose()}>×</button>
        </div>

        <div className="stage-body">
          <div className="stage-eyebrow">Stage {stage} · {stageLabel}</div>

          {/* ── STAGE 1 ── */}
          {stage === 1 && (
            <>
              <div className="stage-terminal">
                {typedAnalysis.map((l, i) => <div key={i} className="term-line">{l}<span className="caret" /></div>)}
                {!analysisDone && !error && <div className="term-line term-line--busy">analyseren…</div>}
              </div>
              <div className="stage-actions">
                <button className="stamp-btn stamp-btn--ghost stamp-btn--sm" onClick={onClose}>Annuleren</button>
                <button className="stamp-btn" disabled={!analysisDone} onClick={startVoiceCheck}>
                  Door naar voice check →
                </button>
              </div>
            </>
          )}

          {/* ── STAGE 2 ── */}
          {stage === 2 && (
            <>
              {initBusy ? (
                <div className="stage-terminal"><div className="term-line term-line--busy">editorial memory raadplegen…</div></div>
              ) : (
                <>
                  <p className="stage-note">
                    {hasMemory
                      ? "Brand-voice context uit je editorial memory — pas aan waar nodig, dit stuurt de hele draft."
                      : "Geen memory voor deze categorie — geef de ghost-writer 2-3 zinnen richting (Voice DNA gaat er automatisch bij)."}
                  </p>
                  <textarea
                    className="stage-voice-input"
                    rows={6}
                    value={brandVoice}
                    onChange={(e) => setBrandVoice(e.target.value)}
                    placeholder="bv. Analytisch maar toegankelijk. Eerste persoon. Data boven meningen. Korte zinnen."
                  />
                  <div className="stage-actions">
                    <button className="stamp-btn stamp-btn--ghost stamp-btn--sm" onClick={() => setStage(1)}>← Terug</button>
                    <button className="stamp-btn" onClick={() => startGhostWrite(brandVoice)}>
                      Start ghost-writer →
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── STAGE 3 ── */}
          {stage === 3 && (
            <>
              <div className="ghost-progress">
                <div className="ghost-bar"><div className="ghost-bar-fill" style={{ width: `${((tick + 1) / GHOST_TICKER.length) * 100}%` }} /></div>
                <ul className="ghost-ticker">
                  {GHOST_TICKER.map((t, i) => (
                    <li key={t} className={i < tick ? "done" : i === tick ? "active" : ""}>
                      {i < tick ? "✓" : i === tick ? <span className="spinner" /> : "·"} {t}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="stage-note stage-note--dim">5-staps pipeline draait (~40-60s). Niet wegklikken.</p>
            </>
          )}

          {/* ── STAGE 4 ── */}
          {stage === 4 && ghost && (
            <>
              <div className="done-stamp">DRAFT KLAAR</div>
              <div className="done-card">
                <div className="done-title">{ghost.title}</div>
                <div className="done-meta">
                  {ghost.word_count ?? "—"} woorden · {ghost.reading_time ?? "—"} · {ghost.gaps_count ?? 0} [HANS:] gates om in te vullen
                  {ghost.review_scores?.hoofdredacteur != null && <> · review {ghost.review_scores.hoofdredacteur}/100</>}
                </div>
                {ghost.seo?.meta_title && <div className="done-seo">SEO: {ghost.seo.meta_title}</div>}
              </div>
              <div className="stage-actions">
                <button className="stamp-btn stamp-btn--ghost stamp-btn--sm" onClick={onClose}>Sluiten</button>
                {ghost.post_id && (
                  <a className="stamp-btn" href={`/write/${ghost.post_id}`}>Open in editor →</a>
                )}
              </div>
            </>
          )}

          {error && (
            <div className="stage-error">
              {error}
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
