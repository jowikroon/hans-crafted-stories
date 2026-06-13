// TipsCard — Phase C right-rail writing tips with apply/dismiss + banned-word
// highlighting summary. Consumes parseContentTips() + countBannedWords() from
// useVoiceTemplate.
//
// Each tip can be:
//   - Dismissed (local state — re-appears on reload, no persistence in this phase)
//   - "Applied" (visual confirmation; no editor mutation yet — that comes in
//     Phase E once we have a transformer chain). Apply marks the tip with a
//     "applied" style; persistence is out of scope for Phase C.
//
// The banned-word summary renders inline at the top of the card with one chip
// per offending word + count. Clicking a chip emits onJumpToWord(word) so
// WriteMode can scroll the editor to the first occurrence (Phase D).

import { useMemo, useState } from "react";

interface BannedHit { word: string; count: number }

interface Props {
  tips: string[];
  bannedHits: BannedHit[];
  onApply?: (tip: string) => void;
  onJumpToWord?: (word: string) => void;
}

export default function TipsCard({ tips, bannedHits, onApply, onJumpToWord }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [applied, setApplied] = useState<Set<string>>(new Set());

  const visible = useMemo(() => tips.filter((t) => !dismissed.has(t)), [tips, dismissed]);

  if (visible.length === 0 && bannedHits.length === 0) return null;

  return (
    <div className="card tip-card">
      <div className="card-head">
        Tips
        <span>{visible.length + bannedHits.length}</span>
      </div>

      {bannedHits.length > 0 && (
        <div className="tip-banned">
          {bannedHits.map(({ word, count }) => (
            <button
              key={word}
              className="tip-banned-chip"
              onClick={() => onJumpToWord?.(word)}
              title={`${count} occurrence${count === 1 ? "" : "s"} in current draft`}
            >
              <span className="tip-banned-strike">{word}</span>
              <span className="tip-banned-count">×{count}</span>
            </button>
          ))}
        </div>
      )}

      {visible.length > 0 && (
        <ul className="tip-list">
          {visible.map((tip) => {
            const isApplied = applied.has(tip);
            return (
              <li key={tip} className={`tip-item${isApplied ? " tip-item--applied" : ""}`}>
                <span className="tip-dot" aria-hidden />
                <span className="tip-text">{tip}</span>
                <span className="tip-actions">
                  <button
                    className="tip-apply"
                    onClick={() => {
                      setApplied((s) => new Set(s).add(tip));
                      onApply?.(tip);
                    }}
                    disabled={isApplied}
                  >
                    {isApplied ? "Applied" : "Apply"}
                  </button>
                  <button
                    className="tip-dismiss"
                    onClick={() => setDismissed((s) => new Set(s).add(tip))}
                  >
                    Dismiss
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
