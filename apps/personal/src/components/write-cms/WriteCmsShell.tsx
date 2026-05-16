import { useState, useEffect } from "react";
import "./write-cms.css";
import WriteMode from "./modes/WriteMode";
import ManageMode from "./modes/ManageMode";
import AnalyticsMode from "./modes/AnalyticsMode";

type CmsMode = "write" | "manage" | "analytics";

const MODES: { id: CmsMode; label: string; count: string; icon: React.ReactNode }[] = [
  {
    id: "write",
    label: "Write",
    count: "open",
    icon: (
      <svg viewBox="0 0 16 16" fill="none">
        <path d="M2 14h12M11 3l2 2-7 7H4v-2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "manage",
    label: "Manage",
    count: "–",
    icon: (
      <svg viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="5" height="5" stroke="currentColor" strokeWidth="1.6"/>
        <rect x="9" y="2" width="5" height="5" stroke="currentColor" strokeWidth="1.6"/>
        <rect x="2" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1.6"/>
        <rect x="9" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1.6"/>
      </svg>
    ),
  },
  {
    id: "analytics",
    label: "Analytics",
    count: "7d",
    icon: (
      <svg viewBox="0 0 16 16" fill="none">
        <path d="M2 13V3M2 13h12M5 11V8M8 11V5M11 11V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function WriteCmsShell({ postId }: { postId?: string }) {
  const [mode, setMode] = useState<CmsMode>(postId ? "write" : "write");

  // When navigating to /write/:id, auto-switch to write mode
  useEffect(() => {
    if (postId) setMode("write");
  }, [postId]);

  return (
    <div className="write-cms" data-theme="light">
      {/* ── Top bar ── */}
      <header className="topbar">
        <div className="brand">
          <span className="mark">H</span>
          Hans
        </div>
        <nav aria-label="Site">
          <a href="/">Site</a>
          <a href="/portal">Portal</a>
          <a href="/write" className="current">Write</a>
        </nav>
        <div className="topbar-end">
          <div className="lang-toggle">
            <button className="active">NL</button>
            <button>EN</button>
          </div>
          <button className="profile-chip">
            <span className="avatar">H</span>
            <span>Hans</span>
          </button>
        </div>
      </header>

      {/* ── Shell grid ── */}
      <div className="shell">
        {/* Left rail — mode buttons */}
        <aside className="modes" aria-label="Modes">
          {MODES.map((m) => (
            <button
              key={m.id}
              className="mode"
              aria-current={mode === m.id ? "page" : undefined}
              onClick={() => setMode(m.id)}
            >
              <span className="mode-l">
                {m.icon}
                <span>{m.label}</span>
              </span>
              <span className="count">{m.count}</span>
            </button>
          ))}
        </aside>

        {/* Active mode — renders its own .main (and optionally .rail) */}
        {mode === "write" && <WriteMode postId={postId} />}
        {mode === "manage" && <ManageMode />}
        {mode === "analytics" && <AnalyticsMode />}
      </div>
    </div>
  );
}
