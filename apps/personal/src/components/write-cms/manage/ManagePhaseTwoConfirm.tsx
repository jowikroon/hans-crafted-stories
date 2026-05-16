import { useState } from "react";
import type { InitResponse } from "./useBlogInitWorkflow";

interface Props {
  init: InitResponse;
  onCancel: () => void;
  onConfirm: (updatedBrandVoice: string) => void;
  phase: "verifying" | "resuming";
}

export default function ManagePhaseTwoConfirm({ init, onCancel, onConfirm, phase }: Props) {
  const [voice, setVoice] = useState(init.brand_voice);

  return (
    <div className="phase2-confirm">
      <div className="phase2-header">
        <span className="phase2-chip">Phase 2 · Verify</span>
        <span className="phase2-hint">Edit brand voice if needed, then confirm to dispatch the ghost writer.</span>
      </div>
      <div className="phase2-grid">
        <div className="phase2-col">
          <div className="phase2-label">Brand voice</div>
          <textarea
            className="phase2-textarea"
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
          />
        </div>
        <div className="phase2-col">
          <div className="phase2-label">Recent coverage (last 5)</div>
          <div className="phase2-recent">
            {init.recent_posts || "— no prior posts in this category —"}
          </div>
        </div>
      </div>
      <div className="phase2-actions">
        <button className="stamp-btn stamp-btn--ghost stamp-btn--sm" onClick={onCancel} disabled={phase === "resuming"}>
          Cancel
        </button>
        <button
          className="stamp-btn stamp-btn--sm"
          onClick={() => onConfirm(voice)}
          disabled={phase === "resuming"}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {phase === "resuming" ? "Dispatching…" : "Confirm & dispatch"}
        </button>
      </div>
    </div>
  );
}
