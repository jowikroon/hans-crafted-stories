import { useState, useEffect, useRef } from "react";
import ManagePhaseTwoConfirm from "./ManagePhaseTwoConfirm";
import type { BlogInitWorkflow } from "./useBlogInitWorkflow";
import { useYoutubeAnalyze, extractVideoId } from "./useYoutubeAnalyze";

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

  const [ytPreview, setYtPreview] = useState<YtPreview | null>(null);
  const [ytPreviewLoading, setYtPreviewLoading] = useState(false);
  const autoFilledAngle = useRef(false);

  const busy = phase === "verifying" || phase === "resuming";
  const hasValidYtUrl = !!youtube.trim() && !!extractVideoId(youtube);

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

        {/* Ghost-write button */}
        <button
          className="stamp-btn stamp-btn--sm source-bar-cta"
          onClick={() => startPhase1(category)}
          disabled={busy || !!init || ytAnalyze.phase === "analyzing"}
        >
          {phase === "verifying" && !init ? (
            <><SpinIcon /> Consulting memory…</>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M5.5 3.5l7 4.5-7 4.5V3.5z" fill="currentColor"/>
              </svg>
              Ghost-write
            </>
          )}
        </button>
      </div>

      {/* oEmbed preview — shown when URL is valid + not yet analyzed */}
      {ytPreview && ytAnalyze.phase === "idle" && !busy && !init && (
        <div className="yt-preview">
          <img src={ytPreview.thumbnail} alt="" />
          <div className="yt-preview-meta">
            <div className="yt-preview-title">{ytPreview.title}</div>
            <div className="yt-preview-channel">{ytPreview.channel}</div>
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
