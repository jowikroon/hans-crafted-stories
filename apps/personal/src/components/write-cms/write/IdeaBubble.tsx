// IdeaBubble — Phase C floating bottom-right card with rolling writing prompts.
//
// Behaviour modelled on the prototype's idea-bubble (write-src.html lines
// 1355-1430): bubble appears, user can click "Add" to insert the idea into the
// editor, click X to dismiss for a minute, or wait — bubble cycles to next idea
// after ~14s.
//
// We keep the cycling timer pure — the actual insert is the parent's job. Parent
// passes onInsert(idea) which decides whether to push the idea HTML into EN or
// NL editor. For Phase C we just emit the plain-text idea to the parent.
//
// The set of ideas is intentionally small and operator-flavoured (matches Hans's
// voice). Move to Supabase-driven prompts in Phase E.

import { useEffect, useRef, useState } from "react";

const IDEAS: { what: string; html: string }[] = [
  { what: "Open with the operator pain — not the product", html: "<p><em>Operator pain hook (4–8 words):</em> </p>" },
  { what: "Drop one named number — invoice, cohort, SKU count", html: "<p><strong>One named number:</strong> </p>" },
  { what: "Close with the next move, not a recap", html: "<p><em>Next move:</em> </p>" },
  { what: "Cut filler verbs — “make”, “do”, “provide”", html: "" },
  { what: "Tighten the first sentence to under 12 words", html: "" },
];

interface Props {
  /** Inserted HTML or plain idea text from the active bubble. */
  onInsert: (snippet: { what: string; html: string }) => void;
  /** Disable cycling entirely (e.g. when modal open). */
  paused?: boolean;
  /** Initial delay before the first bubble shows. */
  initialDelayMs?: number;
  /** Cycle interval between bubbles. */
  cycleMs?: number;
  /** Dismiss cooldown after user closes. */
  dismissCooldownMs?: number;
}

export default function IdeaBubble({
  onInsert,
  paused = false,
  initialDelayMs = 13_000,
  cycleMs = 14_000,
  dismissCooldownMs = 60_000,
}: Props) {
  const [idx, setIdx] = useState(0);
  const [on, setOn] = useState(false);
  const [applied, setApplied] = useState(false);
  const dismissUntil = useRef(0);

  useEffect(() => {
    if (paused) return;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      if (Date.now() < dismissUntil.current) {
        setTimeout(tick, 12_000);
        return;
      }
      setApplied(false);
      setOn(true);
    };
    const t1 = setTimeout(tick, initialDelayMs);
    return () => { cancelled = true; clearTimeout(t1); };
  }, [paused, initialDelayMs]);

  // After bubble has been shown a while, auto-rotate to next idea on next cycle.
  useEffect(() => {
    if (!on) return;
    const t = setTimeout(() => {
      setOn(false);
      setIdx((n) => (n + 1) % IDEAS.length);
      // schedule the next bubble after the cycleMs interval
      setTimeout(() => { if (Date.now() > dismissUntil.current) setOn(true); }, cycleMs);
    }, 8_000);
    return () => clearTimeout(t);
  }, [on, cycleMs]);

  const idea = IDEAS[idx];

  const close = () => {
    setOn(false);
    dismissUntil.current = Date.now() + dismissCooldownMs;
  };

  const add = () => {
    onInsert(idea);
    setApplied(true);
    setTimeout(close, 1_100);
  };

  if (paused) return null;

  return (
    <div className={`idea-bubble${on ? " on" : ""}${applied ? " applied" : ""}`} aria-live="polite">
      <div className="head">
        <span className="lab">
          <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <circle cx="8" cy="8" r="3" />
          </svg>
          Idea
        </span>
        <button className="close" onClick={close} aria-label="Dismiss for 1 minute">×</button>
      </div>
      <div className="what">{idea.what}</div>
      <button className="add-btn" onClick={add}>
        <span>Add to draft</span>
        <span className="arrow" aria-hidden>→</span>
      </button>
    </div>
  );
}
