import { useState, useEffect, useRef } from "react";
import ManagePhaseTwoConfirm from "./ManagePhaseTwoConfirm";
import type { BlogInitWorkflow } from "./useBlogInitWorkflow";
import { useYoutubeAnalyze, extractVideoId } from "./useYoutubeAnalyze";
import YouTubeStageModal from "./YouTubeStageModal";
import { usePipelineChoice } from "./usePipelineChoice";

const AUTO_PIPELINE_WEBHOOK =
  "https://n8n.srv1402218.hstgr.cloud/webhook/auto-blog-pipeline";

interface YtPreview { title: string; channel: string; thumbnail: string }

interface Props {
  workflow: BlogInitWorkflow;
  category?: string;
}

const SpinIcon = () => (
  <svg className="source-spin" width="12" height="12" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="31.4 31.4" />
  </svg>
);

export default function ManageSourceBar({ workflow, category = "general" }: Props) {
  const { topic, youtube, angle, phase, init, error, setTopic, setYoutube, setAngle, startPhase1, confirmPhase2, cancel } = workflow;
  const ytAnalyze = useYoutubeAnalyze();
  const { pipeline, setPipeline } = usePipelineChoice();

  const [autoState, setAutoState] = useState<"idle" | "starting" | "started" | "error">("idle");

  const [ytPreview, setYtPreview] = useState<YtPreview | null>(null);
  const [showStageModal, setShowStageModal] = useState(false);
  const [ytPreviewLoading, setYtPreviewLoading] = useState(false);
  const autoFilledAngle = useRef(false);

  const busy = phase === "verifying" || phase === "resuming";
  const hasValidYtUrl = !!youtube.trim() && !!extractVideoId(youtube);

  // Auto pipeline: fire-and-forget POST to the n8n webhook. The pipeline runs
  // async server-side and can take minutes, so we use a short timeout and treat
  // a timeout as "started" rather than blocking the UI.
  const startAutoPipeline = async () => {
    setAutoState("starting");
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);
    try {
      await fetch(AUTO_PIPELINE_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: youtube.trim() || topic.trim(),
          language: "nl",
          category,
          cluster: "autoriteit",
          source_type: youtube.trim() ? "youtube" : "topic",
          proposed_angle: angle.trim(),
          brand_voice_context: "",
        }),
        signal: controller.signal,
      });
      setAutoState("started");
    } catch (e) {
      // AbortError == our timeout == pipeline started async server-side.
      if (e instanceof DOMException && e.name === "AbortError") {
        setAutoState("started");
      } else {
        setAutoState("error");
      }
    } finally {
      window.clearTimeout(timer);
    }
  };

  // oEmbed preflight — fires 600ms after a valid YouTube URL is entered
  useEffect(() => {
    autoFilledAngle.current = false;
    if (!hasValidYtUrl) { setYtPreview(null); return; }
    const timer = setTimeout(async () => {
      setYtPreviewLoading(true);
      try {
        const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(youtube)}&format=json`);
        if (res.ok) {
          const d = await res.json();
          setYtPreview({ title: d.title, channel: d.author_name, thumbnail: d.thumbnail_url });
        } else {
          setYtPreview(null);
        }
      } catch {
        setYtPreview(null);
      } finally {
        setYtPreviewLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [youtube, hasValidYtUrl]);

  // Auto-fill angle with first key topic after successful analysis
  useEffect(() => {
    if (ytAnalyze.phase === "analyzed" && ytAnalyze.result?.keyTopics.length && !angle.trim() && !autoFilledAngle.current) {
      setAngle(ytAnalyze.result.keyTopics[0]);
      autoFilledAngle.current = true;
    }
  }, [ytAnalyze.phase, ytAnalyze.result, angle, setAngle]);

  // Clear analysis when YouTube URL is cleared
  useEffect(() => {
    if (!youtube.trim()) ytAnalyze.reset();
  }, [youtube]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="source-bar">
      <div className="source-bar-row">
        {/* Pipeline picker — Klassiek vs Auto */}
        <label className="source-field">
          <span className="source-label">Pipeline</span>
          <select
            className="source-input"
            value={pipeline}
            onChange={(e) => setPipeline(e.target.value as "classic" | "auto")}
            disabled={busy || !!init}
          >
            <option value="classic">Klassiek</option>
            <option value="auto">Auto (Opus + gates + poort)</option>
          </select>
        </label>

        {/* YouTube URL */}
        <label className="source-field">
          <span className="source-label">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/>
            </svg>
            YouTube URL
            {ytPreviewLoading && <SpinIcon />}
          </span>
          <input
            type="url"
            className="source-input"
            placeholder="https://youtube.com/watch?v=…"
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
            disabled={busy || !!init}
          />
        </label>

        {/* Topic */}
        <label className="source-field source-field--grow">
          <span className="source-label">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            Topic / raw idea
          </span>
          <input
            type="text"
            className="source-input"
            placeholder="e.g. Amazon FBA inventory strategy 2026"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={busy || !!init}
          />
        </label>

        {/* Angle */}
        <label className="source-field">
          <span className="source-label">Proposed angle</span>
          <input
            type="text"
            className="source-input"
            placeholder="Optional differentiation"
            value={angle}
            onChange={(e) => setAngle(e.target.value)}
            disabled={busy || !!init}
          />
        </label>

        {/* Analyze button — only when valid YouTube URL + not yet analyzed */}
        {hasValidYtUrl && ytAnalyze.phase === "idle" && !busy && !init && (
          <button
            className="stamp-btn stamp-btn--ghost stamp-btn--sm source-bar-cta"
            onClick={() => ytAnalyze.analyze(youtube)}
            title="Fetch transcript + extract topics before Ghost-writing"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5v3l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Analyze
          </button>
        )}

        {/* Ghost-write button — opens the 4-stage modal (design contract #14) */}
        <button
          className="stamp-btn stamp-btn--sm source-bar-cta"
          onClick={() => {
            if (pipeline === "auto") {
              if (!topic.trim() && !youtube.trim()) return;
              startAutoPipeline();
              return;
            }
            // classic — unchanged behaviour
            if (!topic.trim() && !youtube.trim()) { startPhase1(category); return; }
            setShowStageModal(true);
          }}
          disabled={busy || !!init || ytAnalyze.phase === "analyzing" || autoState === "starting"}
        >
          {autoState === "starting" ? (
            <><SpinIcon /> Auto-pipeline starten…</>
          ) : phase === "verifying" && !init ? (
            <><SpinIcon /> Consulting memory…</>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M5.5 3.5l7 4.5-7 4.5V3.5z" fill="currentColor"/>
              </svg>
              {pipeline === "auto" ? "Ghost-write (Auto)" : "Ghost-write"}
            </>
          )}
        </button>
      </div>

      {/* Auto-pipeline started */}
      {autoState === "started" && (
        <div className="source-notice source-notice--ok">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Auto-pipeline gestart — draft verschijnt in Manage als 'ie klaar is (dry-run: niets gaat live)
          <button className="source-notice-retry" onClick={() => setAutoState("idle")}>Dismiss</button>
        </div>
      )}

      {/* Auto-pipeline error */}
      {autoState === "error" && (
        <div className="source-notice source-notice--err">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v8M8 13v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Auto-pipeline kon niet starten — probeer opnieuw of val terug op Klassiek.
          <button className="source-notice-retry" onClick={() => setAutoState("idle")}>Dismiss</button>
        </div>
      )}

      {/* oEmbed preview + pre-flight options (design contract B2) */}
      {ytPreview && ytAnalyze.phase === "idle" && !busy && !init && (
        <div className="preflight">
          <div className="yt-preview">
            <img src={ytPreview.thumbnail} alt="" />
            <div className="yt-preview-meta">
              <div className="yt-preview-title">{ytPreview.title}</div>
              <div className="yt-preview-channel">{ytPreview.channel}</div>
            </div>
          </div>
          <div className="preflight-options">
            <div className="preflight-opt">
              <span className="preflight-lab">Talen</span>
              <span className="preflight-chips">
                <span className="lang-chip on">NL</span>
                <span className="lang-chip on">EN</span>
              </span>
            </div>
            <div className="preflight-opt">
              <span className="preflight-lab">Extra's</span>
              <span className="preflight-chips">
                <span className="lang-chip on">LinkedIn</span>
                <span className="lang-chip on">SEO</span>
              </span>
            </div>
            <div className="preflight-est">~90s · ≈14k tokens · ~$0.04 · ⌘⏎ start</div>
          </div>
        </div>
      )}

      {/* Analysis in progress */}
      {ytAnalyze.phase === "analyzing" && (
        <div className="analyze-status">
          <SpinIcon />
          <span style={{ color: "var(--scheduled)" }}>Analyzing transcript + extracting topics…</span>
        </div>
      )}

      {/* Analysis error */}
      {ytAnalyze.phase === "error" && ytAnalyze.error && (
        <div className="source-notice source-notice--err">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v8M8 13v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {ytAnalyze.error}
          <button className="source-notice-retry" onClick={ytAnalyze.reset}>Dismiss</button>
        </div>
      )}

      {/* Analyzed — thumbnail + clickable topic chips */}
      {ytAnalyze.phase === "analyzed" && ytAnalyze.result && (
        <>
          <div className="yt-preview">
            {ytAnalyze.result.thumbnailUrl && (
              <img src={ytAnalyze.result.thumbnailUrl} alt="" />
            )}
            <div className="yt-preview-meta">
              <div className="yt-preview-title">{ytAnalyze.result.title || ytPreview?.title}</div>
              <div className="yt-preview-channel">{ytAnalyze.result.channelName || ytPreview?.channel}</div>
              <div style={{ marginTop: 4, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--live)", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Analyzed — click a topic to use as angle
              </div>
            </div>
            <button
              className="source-notice-retry"
              style={{ marginLeft: "auto", alignSelf: "flex-start" }}
              onClick={ytAnalyze.reset}
            >
              Reset
            </button>
          </div>

          {ytAnalyze.result.contextSummary && (
            <div className="yt-context-summary">
              {ytAnalyze.result.contextSummary}
            </div>
          )}

          {ytAnalyze.result.keyTopics.length > 0 && (
            <div className="topic-chips">
              <span className="topic-chips-label">Topics:</span>
              {ytAnalyze.result.keyTopics.map((t) => (
                <button
                  key={t}
                  className="topic-chip"
                  onClick={() => { setAngle(t); autoFilledAngle.current = true; }}
                  title="Use as angle"
                >
                  {t}
                  <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
                    <path d="M5.5 3.5l7 4.5-7 4.5V3.5z" fill="currentColor"/>
                  </svg>
                </button>
              ))}
            </div>
          )}

          {ytAnalyze.result.articleOpportunities.length > 0 && (
            <div className="topic-chips topic-chips--opps">
              <span className="topic-chips-label">Article ideas:</span>
              {ytAnalyze.result.articleOpportunities.map((o) => (
                <button
                  key={o}
                  className="topic-chip topic-chip--opp"
                  onClick={() => { setAngle(o); autoFilledAngle.current = true; }}
                  title="Use as angle"
                >
                  {o}
                  <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
                    <path d="M5.5 3.5l7 4.5-7 4.5V3.5z" fill="currentColor"/>
                  </svg>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Phase 2 — brand voice confirmation */}
      {init && (
        <ManagePhaseTwoConfirm
          init={init}
          phase={phase as "verifying" | "resuming"}
          onCancel={cancel}
          onConfirm={(voice) => confirmPhase2(voice, category)}
        />
      )}

      {/* Success */}
      {phase === "done" && (
        <div className="source-notice source-notice--ok">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Ghost writer dispatched — the draft will appear in the posts table when n8n completes.
        </div>
      )}

      {/* 4-stage YouTube → Article modal */}
      {showStageModal && (
        <YouTubeStageModal
          youtube={youtube}
          topic={topic}
          angle={angle}
          category={category}
          onClose={() => setShowStageModal(false)}
          onDone={() => workflow.onDispatched?.()}
        />
      )}

      {/* Workflow error */}
      {error && phase === "error" && (
        <div className="source-notice source-notice--err">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v8M8 13v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {error}
          <button className="source-notice-retry" onClick={cancel}>Dismiss</button>
        </div>
      )}
    </div>
  );
}
