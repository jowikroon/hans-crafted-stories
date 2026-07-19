import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import "./write-cms.css";
import WriteMode from "./modes/WriteMode";
import ManageMode from "./modes/ManageMode";
import AnalyticsMode from "./modes/AnalyticsMode";
import VoiceMode from "./modes/VoiceMode";
import ExperienceMode from "./modes/ExperienceMode";
import DesignMode from "./modes/DesignMode";

type CmsMode = "write" | "manage" | "voice" | "experience" | "design" | "analytics";

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
  experience: (
    <svg viewBox="0 0 16 16" fill="none"><path d="M3 2.5h7a2 2 0 0 1 2 2V14l-2-1.3L8 14l-2-1.3L4 14V4.5a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M6 6h4M6 8.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
  ),
  design: (
    <svg viewBox="0 0 16 16" fill="none"><path d="M8 1.5a6.5 6.5 0 1 0 0 13c1.2 0 1.8-.7 1.8-1.5 0-.9-.8-1.2-.8-2 0-.9.7-1.5 1.8-1.5H12a2.5 2.5 0 0 0 2.5-2.5C14.5 4 11.6 1.5 8 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><circle cx="5.2" cy="6" r=".9" fill="currentColor" /><circle cx="8" cy="4.6" r=".9" fill="currentColor" /><circle cx="10.8" cy="6" r=".9" fill="currentColor" /></svg>
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
  const navigate = useNavigate();
  // `view=voice` is the original HAN-98 deep-link contract. Keep it as a
  // backwards-compatible alias while `mode` remains the canonical parameter.
  const raw = params.get("mode") ?? params.get("view");
  const validRaw = raw === "write" || raw === "voice" || raw === "experience" || raw === "design" || raw === "analytics" ? raw : null;
  // Vanaf een post-URL (/write/:id) wint een expliciete ?mode= — anders bleef elke
  // mode-klik onzichtbaar in de Write-view hangen (UX-verificatie 2026-07-18).
  const mode: CmsMode = postId ? (validRaw && validRaw !== "write" ? validRaw : "write") : (validRaw ?? "manage");

  const [counts, setCounts] = useState({ drafts: 0, articles: 0, voice: 0, experience: 0 });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ data: posts }, { count: voice }, { count: experience }] = await Promise.all([
          supabase.from("blog_posts").select("status, published"),
          supabase.from("hvl_voice_templates").select("id", { count: "exact", head: true }),
          supabase.from("hvl_experience_bank").select("id", { count: "exact", head: true }).is("archived_at", null),
        ]);
        if (cancelled) return;
        const articles = posts?.length ?? 0;
        const drafts = (posts ?? []).filter(
          (p: { status: string; published: boolean }) => !(p.published || p.status === "published"),
        ).length;
        setCounts({ drafts, articles, voice: voice ?? 0, experience: experience ?? 0 });
      } catch {
        /* counts are decorative; ignore failures */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = (m: CmsMode) => {
    if (postId && m !== "write") {
      // Verlaat de post-route: modes als Manage/Voice horen niet bij een specifieke draft.
      navigate(m === "manage" ? "/write" : `/write?mode=${m}`);
      return;
    }
    const next = new URLSearchParams(params);
    next.delete("view");
    // Manage is the default landing mode, so it owns the clean (param-less) URL.
    if (m === "manage") next.delete("mode");
    else next.set("mode", m);
    setParams(next, { replace: false });
  };

  const RAIL: { id: CmsMode; label: string; count: string }[] = [
    { id: "write", label: "Write", count: counts.drafts ? `${counts.drafts} open` : "open" },
    { id: "manage", label: "Manage", count: counts.articles ? String(counts.articles) : "–" },
    { id: "voice", label: "Voice", count: counts.voice ? `${counts.voice} tpl` : "tpl" },
    { id: "experience", label: "Ervaringen", count: counts.experience ? String(counts.experience) : "bank" },
    { id: "design", label: "Design", count: "site" },
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
          {mode === "experience" && <ExperienceMode />}
          {mode === "design" && <DesignMode />}
          {mode === "analytics" && <AnalyticsMode />}
        </div>
      </div>
    </div>
  );
}
