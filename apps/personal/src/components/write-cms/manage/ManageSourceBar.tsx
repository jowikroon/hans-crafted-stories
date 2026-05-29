import { useEffect, useRef, useState } from "react";
import ManagePhaseTwoConfirm from "./ManagePhaseTwoConfirm";
import YouTubePreflightCard from "./YouTubePreflightCard";
import type { BlogInitWorkflow } from "./useBlogInitWorkflow";
import { extractVideoId, useYoutubeAnalyze } from "./useYoutubeAnalyze";

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

  const onPickTopic = (t: string) => {
    setAngle(t);
    autoFilledAngle.current = true;
  };

  return (
    <div className="source-bar">
      {/* ────────── Rich YouTube preflight (Phase B) — shown when there is a YouTube URL */}
      <YouTubePreflightCard
        category={category}
        youtubeUrl={youtube}
        oembed={ytPreview}
        oembedLoading={ytPreviewLoading}
        analyzePhase={ytAnalyze.phase}
        analyzeResult={ytAnalyze.result}
        analyzeError={ytAnalyze.error}
        onAnalyze={() => ytAnalyze.analyze(youtube)}
        onReset={ytAnalyze.reset}
        onPickTopic={onPickTopic}
        workflow={workflow}
      />

      {/* ────────── Plain input row (kept for non-YouTube starts and for editing the angle) */}
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

        {/* Ghost-write button — only when NOT going via the preflight (no YouTube URL).
            When a YouTube URL is present, the Ghost-write CTA lives inside the preflight card. */}
        {!hasValidYtUrl && (
          <button
            className="stamp-btn stamp-btn--sm source-bar-cta"
            onClick={() => startPhase1(category)}
            disabled={busy || !!init}
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
        )}
      </div>

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
