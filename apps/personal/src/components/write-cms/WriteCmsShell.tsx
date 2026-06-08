import { useState, useEffect } from "react";
import "./write-cms.css";
import WriteMode from "./modes/WriteMode";
import ManageMode from "./modes/ManageMode";
import AnalyticsMode from "./modes/AnalyticsMode";
import logoMark from "@/assets/logo-mark.png";

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
      {/* ── Header — site-style, two-tier ── */}
      <header className="topbar">
        <div className="topbar-main">
          <a className="brand" href="/" aria-label="Hans van Leeuwen — naar site">
            <img className="brand-mark" src={logoMark} alt="" width={24} height={24} />
            <span>Hans van Leeuwen</span>
          </a>
          <nav className="sitenav" aria-label="Site">
            <a href="/">Home</a>
            <a href="/work">Werk</a>
            <a href="/writing">Artikelen</a>
            <a href="/about">Over Hans</a>
          </nav>
          <div className="topbar-end">
            <button className="icon-btn" aria-label="Zoeken" title="Zoeken">
              <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
            </button>
            <button className="icon-btn" aria-label="Thema" title="Thema">
              <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
            </button>
            <div className="lang-toggle">
              <button className="active">NL</button>
              <button>EN</button>
            </div>
            <button className="profile-chip">
              <span className="avatar">H</span>
              <span>Hans</span>
            </button>
          </div>
        </div>
        <nav className="subbar" aria-label="Modes">
          {MODES.map((m) => (
            <button
              key={m.id}
              className="submode"
              aria-current={mode === m.id ? "page" : undefined}
              onClick={() => setMode(m.id)}
            >
              {m.icon}
              <span>{m.label}</span>
              <span className="count">{m.count}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* ── Shell grid ── */}
      <div className="shell">
        {/* Active mode — renders its own .main (and optionally .rail) */}
        {mode === "write" && <WriteMode postId={postId} />}
        {mode === "manage" && <ManageMode />}
        {mode === "analytics" && <AnalyticsMode />}
      </div>
    </div>
  );
}
