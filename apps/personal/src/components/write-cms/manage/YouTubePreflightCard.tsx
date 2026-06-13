// YouTubePreflightCard — Phase B Manage rich preflight surface.
//
// Sits ABOVE ManageSourceBar's plain input row. Behaviour:
//   - User pastes a YouTube URL.
//   - oEmbed kicks in after 600ms (handled in ManageSourceBar to keep existing wiring).
//   - User clicks "Analyze" -> useYoutubeAnalyze fires the n8n blog-youtube-analyze webhook.
//   - When analysed: card shows thumbnail, channel chip, duration chip (if returned),
//     language chip (if returned), voice template fit chip (read from useVoiceTemplate),
//     cost+time estimate row, topic chips, and article opportunities list.
//   - Topic chips fill the angle/topic input via callbacks.
//   - Ghost-write button kicks startPhase1.
//
// Scoped under .write-cms via CSS class names prefixed with `preflight-`.
// All design tokens come from write-cms.css (no new tokens, no inline colors).
import { useEffect, useState } from "react";
import { useVoiceTemplate, type VoiceTemplate } from "../hooks/useVoiceTemplate";
import type { BlogInitWorkflow } from "./useBlogInitWorkflow";
import type { YouTubeAnalysisResult, YouTubeAnalyzePhase } from "./useYoutubeAnalyze";

interface OEmbed {
  title: string;
  channel: string;
  thumbnail: string;
}

interface Props {
  category: string;
  youtubeUrl: string;
  oembed: OEmbed | null;
  oembedLoading: boolean;
  analyzePhase: YouTubeAnalyzePhase;
  analyzeResult: YouTubeAnalysisResult | null;
  analyzeError: string | null;
  onAnalyze: () => void;
  onReset: () => void;
  onPickTopic: (topic: string) => void;
  workflow: BlogInitWorkflow;
}

const Spin = () => (
  <svg className="preflight-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="31.4 31.4" />
  </svg>
);

const Check = ({ size = 10 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Bolt = () => (
  <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    <path d="M9 1L2 9h4l-1 6 7-8H8l1-6z" />
  </svg>
);

const Coin = () => (
  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
    <path d="M8 5v6M6 7h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const Clock = () => (
  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
    <path d="M8 5v3l2 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

/** Estimate cost + time of ghost-write based on transcript length + voice template. */
function estimateGhostWrite(
  transcriptLength: number,
  voiceTemplate: VoiceTemplate | null,
): { cost: string; seconds: number } {
  // Rough heuristic: transcript ~4 chars/token, generation ~3x transcript tokens, claude sonnet ~$3/Mtok input + $15/Mtok output.
  const inputTokens = Math.max(800, transcriptLength / 4);
  const outputTokens = Math.max(1500, inputTokens * 1.5);
  const dollars = (inputTokens * 3 + outputTokens * 15) / 1_000_000;
  const cost = dollars < 0.1 ? "<$0.10" : `~$${dollars.toFixed(2)}`;
  // Time: ~22s base + 1s per 1000 output tokens; voice template with content_rules adds ~5s review.
  const seconds = Math.round(22 + outputTokens / 1000 + (voiceTemplate?.content_rules ? 5 : 0));
  return { cost, seconds };
}

function fmtSeconds(s: number): string {
  if (s < 60) return `~${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem === 0 ? `~${m}m` : `~${m}m ${rem}s`;
}

/** Compute voice-template fit signal. */
function voiceFit(template: VoiceTemplate | null, category: string): { label: string; tone: "ok" | "warn" | "none" } {
  if (!category || category === "general") return { label: "select category for voice", tone: "warn" };
  if (!template) return { label: `no voice template for "${category}"`, tone: "warn" };
  return { label: `voice: ${template.name}`, tone: "ok" };
}

export default function YouTubePreflightCard({
  category,
  youtubeUrl,
  oembed,
  oembedLoading,
  analyzePhase,
  analyzeResult,
  analyzeError,
  onAnalyze,
  onReset,
  onPickTopic,
  workflow,
}: Props) {
  const { template: voiceTemplate, loading: voiceLoading } = useVoiceTemplate(category);
  const [now, setNow] = useState(Date.now());

  // tick during analyzing for the elapsed-time indicator
  useEffect(() => {
    if (analyzePhase !== "analyzing") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [analyzePhase]);

  const hasYt = !!youtubeUrl.trim();
  const isAnalyzing = analyzePhase === "analyzing";
  const isAnalyzed = analyzePhase === "analyzed" && !!analyzeResult;
  const isError = analyzePhase === "error";

  // Card visible whenever there's a YouTube URL or active workflow OR an analysis result.
  if (!hasYt && analyzePhase === "idle") return null;

  const transcriptLength = analyzeResult?.contextSummary?.length ?? 0;
  const estimate = estimateGhostWrite(transcriptLength, voiceTemplate);
  const fit = voiceFit(voiceTemplate, category);

  // Workflow blocks Analyze button.
  const wfBusy = workflow.phase === "verifying" || workflow.phase === "resuming" || !!workflow.init;
  const canAnalyze = hasYt && analyzePhase === "idle" && !wfBusy;
  const canGhost = isAnalyzed && !wfBusy;

  const startedAt = isAnalyzing ? Math.floor((now - now) / 1000) : 0; // placeholder; not strictly needed

  return (
    <div className="preflight-card" data-phase={analyzePhase} aria-live="polite">
      <header className="preflight-head">
        <span className="preflight-eyebrow">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z" />
          </svg>
          YouTube preflight
        </span>
        {isAnalyzed && (
          <button className="preflight-reset" onClick={onReset} aria-label="Reset analysis">Reset</button>
        )}
      </header>

      {/* Body: thumbnail + meta + chip rail */}
      <div className="preflight-body">
        <div className="preflight-thumb-wrap">
          {(analyzeResult?.thumbnailUrl || oembed?.thumbnail) ? (
            <img className="preflight-thumb" src={analyzeResult?.thumbnailUrl || oembed!.thumbnail} alt="" />
          ) : (
            <div className="preflight-thumb preflight-thumb--empty">
              {oembedLoading ? <Spin /> : <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)" }}>thumb</span>}
            </div>
          )}
        </div>

        <div className="preflight-meta">
          <div className="preflight-title">
            {analyzeResult?.title || oembed?.title || "—"}
          </div>
          <div className="preflight-channel">
            {analyzeResult?.channelName || oembed?.channel || "—"}
          </div>

          <div className="preflight-chips">
            {/* Voice fit chip */}
            <span
              className={`preflight-chip preflight-chip--${fit.tone}`}
              title={voiceTemplate?.tone ? `tone: ${voiceTemplate.tone}` : undefined}
            >
              {fit.tone === "ok" ? <Check size={9} /> : null}
              {voiceLoading ? "voice…" : fit.label}
            </span>

            {/* Language chip — derived from analyzeResult if backend returns it */}
            {analyzeResult?.contextSummary && (
              <span className="preflight-chip">EN+NL output</span>
            )}

            {/* Topic count chip */}
            {analyzeResult && analyzeResult.keyTopics.length > 0 && (
              <span className="preflight-chip">
                {analyzeResult.keyTopics.length} topic{analyzeResult.keyTopics.length === 1 ? "" : "s"}
              </span>
            )}

            {/* Opportunities chip */}
            {analyzeResult && analyzeResult.articleOpportunities.length > 0 && (
              <span className="preflight-chip">
                {analyzeResult.articleOpportunities.length} angle{analyzeResult.articleOpportunities.length === 1 ? "" : "s"}
              </span>
            )}

            {/* Cost + time estimate */}
            <span className="preflight-chip preflight-chip--est" title="Estimated ghost-write cost">
              <Coin /> {estimate.cost}
            </span>
            <span className="preflight-chip preflight-chip--est" title="Estimated ghost-write time">
              <Clock /> {fmtSeconds(estimate.seconds)}
            </span>
          </div>
        </div>
      </div>

      {/* Status strip */}
      {isAnalyzing && (
        <div className="preflight-status preflight-status--running">
          <Spin />
          <span>Fetching transcript + extracting topics…</span>
        </div>
      )}

      {isError && analyzeError && (
        <div className="preflight-status preflight-status--err">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M8 2v8M8 13v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {analyzeError}
          <button className="preflight-reset" onClick={onReset}>Dismiss</button>
        </div>
      )}

      {/* Topic + opportunity chips (analysed state) */}
      {isAnalyzed && analyzeResult && (
        <>
          {analyzeResult.keyTopics.length > 0 && (
            <div className="preflight-row">
              <span className="preflight-row-label">Topics</span>
              <div className="preflight-row-chips">
                {analyzeResult.keyTopics.map((t) => (
                  <button
                    key={t}
                    className="preflight-pick"
                    onClick={() => onPickTopic(t)}
                    title="Use as angle"
                  >
                    {t}
                    <Bolt />
                  </button>
                ))}
              </div>
            </div>
          )}

          {analyzeResult.articleOpportunities.length > 0 && (
            <div className="preflight-row">
              <span className="preflight-row-label">Angles</span>
              <ul className="preflight-opps">
                {analyzeResult.articleOpportunities.slice(0, 6).map((opp) => (
                  <li key={opp}>
                    <button
                      className="preflight-opp"
                      onClick={() => onPickTopic(opp)}
                      title="Use as angle"
                    >
                      {opp}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <footer className="preflight-actions">
        {analyzePhase === "idle" && (
          <button
            className="stamp-btn stamp-btn--ghost stamp-btn--sm"
            onClick={onAnalyze}
            disabled={!canAnalyze}
            title={canAnalyze ? "Run YouTube transcript + topic extraction" : "Paste a YouTube URL first"}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5v3l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Analyze
          </button>
        )}

        {isAnalyzed && (
          <button
            className="stamp-btn stamp-btn--sm"
            onClick={() => workflow.startPhase1(category)}
            disabled={!canGhost}
            title={canGhost ? "Run Phase 1 → Phase 2 ghost-write pipeline" : "Workflow busy"}
          >
            {workflow.phase === "verifying" && !workflow.init ? (
              <>
                <Spin />
                Consulting memory…
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M5.5 3.5l7 4.5-7 4.5V3.5z" fill="currentColor" />
                </svg>
                Ghost-write
              </>
            )}
          </button>
        )}
      </footer>
    </div>
  );
}
