import ManagePhaseTwoConfirm from "./ManagePhaseTwoConfirm";
import type { BlogInitWorkflow } from "./useBlogInitWorkflow";

interface Props {
  workflow: BlogInitWorkflow;
  category?: string;
}

export default function ManageSourceBar({ workflow, category = "general" }: Props) {
  const { topic, youtube, angle, phase, init, error, setTopic, setYoutube, setAngle, startPhase1, confirmPhase2, cancel } = workflow;

  const busy = phase === "verifying" || phase === "resuming";

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

        {/* Action button */}
        <button
          className="stamp-btn stamp-btn--sm source-bar-cta"
          onClick={() => startPhase1(category)}
          disabled={busy || !!init}
        >
          {phase === "verifying" && !init ? (
            <>
              <svg className="source-spin" width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="31.4 31.4" />
              </svg>
              Consulting memory…
            </>
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

      {/* Phase 2 — brand voice confirmation */}
      {init && (
        <ManagePhaseTwoConfirm
          init={init}
          phase={phase as "verifying" | "resuming"}
          onCancel={cancel}
          onConfirm={(voice) => confirmPhase2(voice, category)}
        />
      )}

      {/* Success state */}
      {phase === "done" && (
        <div className="source-notice source-notice--ok">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Ghost writer dispatched — the draft will appear in the posts table when n8n completes.
        </div>
      )}

      {/* Error state */}
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
