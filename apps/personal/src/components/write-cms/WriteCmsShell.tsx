import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import "./write-cms.css";
import WriteMode from "./modes/WriteMode";
import ManageMode from "./modes/ManageMode";
import AnalyticsMode from "./modes/AnalyticsMode";
import VoiceMode from "./modes/VoiceMode";

type CmsMode = "write" | "manage" | "voice" | "analytics";

const ICONS: Record<CmsMode, JSX.Element> = {
  write: (
    <svg viewBox="0 0 16 16" fill="none"><path d="M2 14h12M11 3l2 2-7 7H4v-2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  manage: (
    <svg viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" stroke="currentColor" strokeWidth="1.6" /><rect x="9" y="2" width="5" height="5" stroke="currentColor" strokeWidth="1.6" /><rect x="2" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1.6" /><rect x="9" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1.6" /></svg>
  ),
  voice: (
    <svg viewBox="0 0 16 16" fill="none"><rect x="6" y="1.5" width="4" height="8" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M3.5 7a4.5 4.5 0 0 0 9 0M8 11.5V14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
  ),
  analytics: (
    <svg viewBox="0 0 16 16" fill="none"><path d="M2 13V3M2 13h12M5 11V8M8 11V5M11 11V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
  ),
};

/**
 * Command Center shell: the global Navbar is the header. This renders the
 * persistent left mode-rail and the active mode. Mode is driven by ?mode=
 * so the "Command Center" nav item and deep links resolve correctly.
 */
export default function WriteCmsShell({ postId }: { postId?: string }) {
  const [params, setParams] = useSearchParams();
  const raw = params.get("mode");
  const mode: CmsMode = postId
    ? "write"
    : raw === "manage" || raw === "voice" || raw === "analytics"
    ? raw
    : "write";

  const [counts, setCounts] = useState({ drafts: 0, articles: 0, voice: 0 });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ data: posts }, { count: voice }] = await Promise.all([
          supabase.from("blog_posts").select("status, published"),
          supabase.from("hvl_voice_templates").select("id", { count: "exact", head: true }),
        ]);
        if (cancelled) return;
        const articles = posts?.length ?? 0;
        const drafts = (posts ?? []).filter(
          (p: { status: string; published: boolean }) => !(p.published || p.status === "published"),
        ).length;
        setCounts({ drafts, articles, voice: voice ?? 0 });
      } catch {
        /* counts are decorative; ignore failures */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = (m: CmsMode) => {
    const next = new URLSearchParams(params);
    if (m === "write") next.delete("mode");
    else next.set("mode", m);
    setParams(next, { replace: false });
  };

  const RAIL: { id: CmsMode; label: string; count: string }[] = [
    { id: "write", label: "Write", count: counts.drafts ? `${counts.drafts} open` : "open" },
    { id: "manage", label: "Manage", count: counts.articles ? String(counts.articles) : "–" },
    { id: "voice", label: "Voice", count: counts.voice ? `${counts.voice} tpl` : "tpl" },
    { id: "analytics", label: "Analytics", count: "7d" },
  ];

  return (
    <div className="write-cms" data-theme="light">
      <div className="cc-frame">
        <nav className="modes" aria-label="Command Center modes">
          {RAIL.map((r) => (
            <button
              key={r.id}
              type="button"
              className="mode"
              aria-current={mode === r.id ? "page" : undefined}
              onClick={() => setMode(r.id)}
            >
              <span className="mode-l">{ICONS[r.id]}{r.label}</span>
              <span className="mode-c">{r.count}</span>
            </button>
          ))}
        </nav>
        <div className="cc-stage">
          {mode === "write" && <WriteMode postId={postId} />}
          {mode === "manage" && <ManageMode />}
          {mode === "voice" && <VoiceMode />}
          {mode === "analytics" && <AnalyticsMode />}
        </div>
      </div>
    </div>
  );
}
