import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useVoiceProposal, buildContext, type VoiceSignal, type VoiceTemplate } from "./useVoiceProposal";
import { analyzeVideoAsync, extractVideoId, describeFunctionError } from "./useYoutubeAnalyze";

// ─── 4-stage YouTube → Article modal (design contract #14 + #15) ──────────────
//   Stage 1 ANALYZE  — edge fn blog-youtube-analyze → minimalist summary card
//   Stage 2 VOICE    — ALWAYS proposes a voice (templates + post history + signal)
//   Stage 3 GHOST    — edge fn blog-ghostwrite (multi-provider, geen n8n-dependency)
//   Stage 4 DONE     — draft card + gates + review score + open-in-editor

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

interface Analysis {
  isVideo: boolean;
  title: string;
  channel: string;
  transcriptFound: boolean | null; // null = own topic (no video)
  topics: string[];
  angle: string;
  summary: string;
  note?: string;
}

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
  provider?: string;
  error?: string;
}

const GHOST_TICKER = [
  "Transcript ophalen of hergebruiken…",
  "Editorial brief bouwen…",
  "Draft schrijven in jouw stem…",
  "SEO-metadata…",
  "Draft opslaan…",
];

export default function YouTubeStageModal({ youtube, topic, angle, category, onClose, onDone }: Props) {
  const [stage, setStage] = useState<Stage>(1);
  const [error, setError] = useState<string | null>(null);

  // Stage 1 — structured analysis (never a raw blank terminal)
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [aSteps, setASteps] = useState<string[]>([]);
  const analysisDone = analysis !== null;

  // Stage 2 — voice
  const [brandVoice, setBrandVoice] = useState("");
  const editedByUser = useRef(false);
  const [memoryNote, setMemoryNote] = useState("");

  // Stage 3
  const [tick, setTick] = useState(0);
  const [ghost, setGhost] = useState<GhostResult | null>(null);

  const isYoutube = !!youtube.trim();
  const source = youtube.trim() || topic.trim();

  // Watchdog: if analyze hangs, fall through with a usable summary.
  useEffect(() => {
    if (analysisDone) return;
    const t = setTimeout(() => {
      setAnalysis((prev) => prev ?? {
        isVideo: isYoutube,
        title: topic.trim() || "Video-bron",
        channel: "",
        transcriptFound: null,
        topics: [],
        angle: angle.trim(),
        summary: "",
        note: "Analyse duurde te lang. Je kunt door, de ghost-writer hergebruikt wat er al is.",
      });
    }, 240000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisDone]);

  // ── Stage 1: analyze ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isYoutube) {
        setAnalysis({
          isVideo: false,
          title: topic.trim(),
          channel: "",
          transcriptFound: null,
          topics: [],
          angle: angle.trim(),
          summary: "",
          note: angle.trim() ? undefined : "Geen invalshoek opgegeven, de ghost-writer kiest er een.",
        });
        return;
      }
      try {
        const videoId = extractVideoId(youtube.trim());
        if (!videoId) throw new Error("Geen geldig YouTube video-id in de URL");
        // Async + poll: de edge function antwoordt direct (202) en werkt door;
        // voortgang komt live uit blog_cms_youtube_sources.pipeline_steps.
        const r = await analyzeVideoAsync(youtube.trim(), videoId, (s) => { if (!cancelled) setASteps(s); });
        if (cancelled) return;
        setAnalysis({
          isVideo: true,
          title: r.title || "Onbekende video",
          channel: r.channelName,
          transcriptFound: r.keyTopics.length > 0 || !!r.contextSummary,
          topics: r.keyTopics,
          angle: (r.articleOpportunities[0] ?? angle.trim() ?? "").toString(),
          summary: r.contextSummary,
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Analyse mislukt");
          setAnalysis({
            isVideo: true,
            title: "Video-bron",
            channel: "",
            transcriptFound: false,
            topics: [],
            angle: angle.trim(),
            summary: "",
            note: "Analyse mislukt, je kunt door; de ghost-writer haalt het transcript zelf op.",
          });
        }
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Stage 2: voice proposal (always proposes) ──
  const signal: VoiceSignal = useMemo(() => ({
    topics: analysis?.topics?.length ? analysis.topics : (topic.trim() ? [topic.trim()] : []),
    angle: analysis?.angle || angle.trim() || topic.trim(),
    summary: analysis?.summary || "",
    category: category || "general",
    title: analysis?.title || topic.trim(),
  }), [analysis, angle, topic, category]);

  const proposal = useVoiceProposal(signal);

  // Sync textarea from the chosen voice unless Hans has edited it.
  useEffect(() => {
    if (editedByUser.current) return;
    const base = proposal.context;
    setBrandVoice(base + (memoryNote ? `\n\n[Editorial memory] ${memoryNote}` : ""));
  }, [proposal.context, memoryNote]);

  const enterVoice = useCallback(() => {
    setStage(2);
    setError(null);
    // Fire n8n editorial-memory enrichment in the background (best-effort).
    (async () => {
      try {
        const res = await fetch(`${N8N}/webhook/blog-init`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: category || "general", raw_idea_or_data: source, proposed_angle: signal.angle }),
        });
        if (!res.ok) return;
        const d = await res.json();
        if (d?.has_memory && d?.brand_voice_context) setMemoryNote(String(d.brand_voice_context).trim());
      } catch { /* enrichment optional */ }
    })();
  }, [category, source, signal.angle]);

  const switchVoice = useCallback((id: string) => {
    editedByUser.current = false;
    proposal.setChosenId(id);
  }, [proposal]);

  // ── Stage 3: ghost-write — uses the CHOSEN voice's DNA ──
  const startGhostWrite = useCallback(async (voiceText: string, tpl: VoiceTemplate | null) => {
    setStage(3);
    setError(null);
    setTick(0);
    const ticker = setInterval(() => setTick((t) => Math.min(t + 1, GHOST_TICKER.length - 1)), 9000);
    try {
      let dnaSuffix = "";
      if (tpl) {
        const parts: string[] = [];
        if (tpl.content_rules?.trim()) parts.push(`Content rules: ${tpl.content_rules.trim()}`);
        if (tpl.opening_examples?.length) parts.push(`Opening examples: ${tpl.opening_examples.join(" | ")}`);
        if (tpl.closing_examples?.length) parts.push(`Closing examples: ${tpl.closing_examples.join(" | ")}`);
        if (tpl.preferred_terms?.length) parts.push(`Preferred terms: ${tpl.preferred_terms.join(", ")}`);
        if (tpl.banned_words?.length) parts.push(`Banned words: ${tpl.banned_words.join(", ")}`);
        if (parts.length) dnaSuffix = `\n\n--- VOICE DNA (${tpl.name} · ${tpl.tone}) ---\n${parts.join("\n")}`;
      }

      // Edge function blog-ghostwrite: multi-provider (Anthropic -> Gemini -> OpenClaw),
      // hergebruikt het transcript uit de analyse, en faalt nooit met een lege non-2xx:
      // fouten komen terug als { ok:false, failed_stage, error, steps }.
      const { data: gw, error: gwErr } = await supabase.functions.invoke("blog-ghostwrite", {
        body: {
          mode: isYoutube ? "youtube" : "topic",
          url: isYoutube ? youtube.trim() : "",
          topic: source,
          angle: signal.angle,
          article_type: "informatief-kort",
          language: "nl",
          voice_context: voiceText + dnaSuffix,
          voice_template_id: tpl?.id ?? null,
          source: "blog-cms-stage-modal",
        },
      });
      if (gwErr) {
        const fe = await describeFunctionError(gwErr);
        throw new Error(fe.steps.length ? `${fe.message} — laatste stap: ${fe.steps[fe.steps.length - 1]}` : fe.message);
      }
      const d = (gw ?? {}) as {
        ok?: boolean; failed_stage?: string; error?: string; steps?: string[]; provider_used?: string;
        post?: { id: string; slug: string; status: string; title?: string; word_count?: number; read_time?: string; editorial_stage?: string };
      };
      if (!d.ok || !d.post) {
        const last = d.steps?.length ? ` — laatste stap: ${d.steps[d.steps.length - 1]}` : "";
        throw new Error(`${d.failed_stage ? `[${d.failed_stage}] ` : ""}${d.error ?? "Ghost-write mislukt"}${last}`);
      }
      setGhost({
        post_id: d.post.id,
        title: d.post.title ?? "Draft opgeslagen",
        word_count: d.post.word_count,
        reading_time: d.post.read_time,
        gaps_count: 0,
        editorial_stage: d.post.editorial_stage ?? d.post.status,
        provider: d.provider_used,
        review_scores: {},
      });
      setStage(4);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ghost-write mislukt");
    } finally {
      clearInterval(ticker);
    }
  }, [category, source, signal.angle, onDone]);

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
          <button className="stage-close" title={stage === 3 ? "Ghost-write loopt, even geduld" : "Sluiten"} onClick={() => stage !== 3 && onClose()}>×</button>
        </div>

        <div className="stage-body">
          <div className="stage-eyebrow">Stage {stage} · {stageLabel}</div>

          {/* ── STAGE 1: minimalist analyze summary ── */}
          {stage === 1 && (
            <>
              {!analysisDone ? (
                <div className="analyze-skeleton">
                  <span className="spinner" />
                  <span>{aSteps.length ? aSteps[aSteps.length - 1] : (isYoutube ? "Video analyseren…" : "Bron voorbereiden…")}</span>
                  {aSteps.length > 1 && <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, opacity: 0.6 }}>stap {aSteps.length}</span>}
                </div>
              ) : (
                <div className="analyze-summary">
                  <div className="as-head">
                    <div className="as-title">{analysis!.title || "—"}</div>
                    <span className="as-done">analyse compleet ✓</span>
                  </div>
                  <div className="as-chips">
                    {analysis!.channel && <span className="as-chip">{analysis!.channel}</span>}
                    {analysis!.isVideo && (
                      <span className={`as-chip ${analysis!.transcriptFound ? "as-chip--ok" : "as-chip--warn"}`}>
                        {analysis!.transcriptFound ? "transcript gevonden" : "geen transcript, titel/kanaal"}
                      </span>
                    )}
                    {!analysis!.isVideo && <span className="as-chip">eigen onderwerp</span>}
                  </div>

                  {analysis!.topics.length > 0 && (
                    <div className="as-block">
                      <div className="as-label">Onderwerpen</div>
                      <div className="as-topics">
                        {analysis!.topics.slice(0, 6).map((t, i) => <span key={i} className="as-topic">{t}</span>)}
                      </div>
                    </div>
                  )}

                  {analysis!.angle && (
                    <div className="as-block">
                      <div className="as-label">Sterkste invalshoek</div>
                      <div className="as-angle">{analysis!.angle}</div>
                    </div>
                  )}

                  {analysis!.summary && (
                    <div className="as-block">
                      <div className="as-label">Samenvatting</div>
                      <p className="as-summary">{analysis!.summary.slice(0, 240)}{analysis!.summary.length > 240 ? "…" : ""}</p>
                    </div>
                  )}

                  {analysis!.note && <p className="as-note">{analysis!.note}</p>}
                </div>
              )}

              <div className="stage-actions">
                <button className="stamp-btn stamp-btn--ghost stamp-btn--sm" onClick={onClose}>Annuleren</button>
                <button className="stamp-btn" disabled={!analysisDone} onClick={enterVoice}>
                  Door naar voice check →
                </button>
              </div>
            </>
          )}

          {/* ── STAGE 2: always-on voice proposal ── */}
          {stage === 2 && (
            <>
              {proposal.loading ? (
                <div className="analyze-skeleton"><span className="spinner" /><span>Stemmen vergelijken…</span></div>
              ) : proposal.empty ? (
                <>
                  <p className="stage-note">Nog geen voice-templates gevonden, geef de ghost-writer 2-3 zinnen richting.</p>
                  <textarea
                    className="stage-voice-input" rows={6} value={brandVoice}
                    onChange={(e) => { editedByUser.current = true; setBrandVoice(e.target.value); }}
                    placeholder="bv. Analytisch maar toegankelijk. Eerste persoon. Data boven meningen. Korte zinnen."
                  />
                </>
              ) : (
                <>
                  <div className="vp-reco">
                    <div className="vp-reco-head">
                      <span className="vp-reco-eyebrow">Voorgestelde stem</span>
                      <span className="vp-reco-name">{proposal.chosen!.tpl.name}</span>
                      {proposal.chosen!.tpl.short_code && <span className="vp-reco-code">{proposal.chosen!.tpl.short_code}</span>}
                    </div>
                    <p className="vp-reco-why">
                      <strong>Waarom:</strong> {proposal.reasoning}
                      <span className={`vp-tier vp-tier--${proposal.reasoningTier}`}>{proposal.reasoningTier === "ai" ? "AI" : "regel"}</span>
                    </p>
                    {proposal.aiBusy && <p className="vp-ai-busy"><span className="spinner" /> AI verfijnt het voorstel…</p>}
                  </div>

                  {proposal.ranked.length > 1 && (
                    <div className="vp-alts">
                      {proposal.ranked.slice(0, 5).map((r) => (
                        <button
                          key={r.tpl.id}
                          className={`vp-chip${r.tpl.id === proposal.chosenId ? " is-active" : ""}`}
                          onClick={() => switchVoice(r.tpl.id)}
                          title={r.reasons.join(" · ")}
                        >
                          {r.tpl.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="as-label vp-ctx-label">Brand-voice context, stuurt de hele draft (pas aan waar nodig)</div>
                  <textarea
                    className="stage-voice-input" rows={6} value={brandVoice}
                    onChange={(e) => { editedByUser.current = true; setBrandVoice(e.target.value); }}
                  />
                </>
              )}

              <div className="stage-actions">
                <button className="stamp-btn stamp-btn--ghost stamp-btn--sm" onClick={() => setStage(1)}>← Terug</button>
                <button className="stamp-btn" onClick={() => startGhostWrite(brandVoice, proposal.chosen?.tpl ?? null)}>
                  Start ghost-writer →
                </button>
              </div>
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
              <p className="stage-note stage-note--dim">Pipeline draait (~20-60s; langer bij verse transcripts). Niet wegklikken.</p>
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
                  {ghost.provider && <> · via {ghost.provider}</>}
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
