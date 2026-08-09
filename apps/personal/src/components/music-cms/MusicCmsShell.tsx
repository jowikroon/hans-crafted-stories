import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import "../write-cms/write-cms.css";
import { ensureFontCss, FONT_CSS } from "@/lib/fontCss";
import "./music-cms.css";
import { VOICE_TEMPLATES } from "./voiceTemplates";
import { listSongs } from "./lib/songStore";
import SongsMode from "./modes/SongsMode";
import SongwriterMode from "./modes/SongwriterMode";
import VoicesMode from "./modes/VoicesMode";
import ProductionMode from "./modes/ProductionMode";

type CmsMode = "songs" | "write" | "voices" | "productie";

const ICONS: Record<CmsMode, JSX.Element> = {
  songs: (
    <svg viewBox="0 0 16 16" fill="none"><path d="M6 12.5V3l7-1.5V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="4" cy="12.5" r="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="11" cy="11" r="2" stroke="currentColor" strokeWidth="1.5" /></svg>
  ),
  write: (
    <svg viewBox="0 0 16 16" fill="none"><path d="M2 14h12M11 3l2 2-7 7H4v-2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  voices: (
    <svg viewBox="0 0 16 16" fill="none"><rect x="6" y="1.5" width="4" height="8" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M3.5 7a4.5 4.5 0 0 0 9 0M8 11.5V14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
  ),
  productie: (
    <svg viewBox="0 0 16 16" fill="none"><path d="M2 8h2l1.5-4 2.5 8 2-6 1.5 2H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
};

/**
 * Music CMS shell — zusje van WriteCmsShell (/write). Zelfde Command Center
 * stramien: persistent left mode-rail + actieve mode, mode via ?mode= zodat
 * deep links werken. Songwriter opent via /music-cms/:id.
 *
 * Zelfde auth-model als /write: de route rendert, maar schrijven loopt via
 * Supabase RLS; zonder sessie tonen we de Google sign-in van de app.
 */
export default function MusicCmsShell({ songId }: { songId?: string }) {
  useEffect(() => { ensureFontCss("fonts-write-cms", FONT_CSS.writeCms); }, []);
  const [params, setParams] = useSearchParams();
  const { user, loading, signInWithGoogle } = useAuth();
  const raw = params.get("mode");
  const mode: CmsMode = songId ? "write" : raw === "write" || raw === "voices" || raw === "productie" ? raw : "songs";

  const [songCount, setSongCount] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const songs = await listSongs();
        if (!cancelled) setSongCount(songs.length);
      } catch {
        /* count is decoratief */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const setMode = (m: CmsMode) => {
    const next = new URLSearchParams(params);
    // Songs is de default landing mode en bezit de schone (param-loze) URL.
    if (m === "songs") next.delete("mode");
    else next.set("mode", m);
    setParams(next, { replace: false });
  };

  const RAIL: { id: CmsMode; label: string; count: string }[] = [
    { id: "songs", label: "Songs", count: songCount != null ? String(songCount) : "–" },
    { id: "write", label: "Schrijven", count: "werkblad" },
    { id: "voices", label: "Voices", count: `${VOICE_TEMPLATES.length} tpl` },
    { id: "productie", label: "Productie", count: "catalogus" },
  ];

  const gated = !loading && !user;

  return (
    <div className="write-cms music-cms" data-theme="light">
      <div className="cc-frame">
        <nav className="modes mc-modes" aria-label="Music CMS modes">
          {RAIL.map((r) => {
            const active = mode === r.id;
            return (
              <button
                key={r.id}
                type="button"
                className="mode mc-mode"
                data-active={active || undefined}
                aria-current={active ? "page" : undefined}
                onClick={() => setMode(r.id)}
              >
                {active && (
                  <motion.span
                    layoutId="mc-mode-active"
                    className="mc-mode__pill"
                    aria-hidden="true"
                    transition={{ type: "spring", stiffness: 520, damping: 38, mass: 0.8 }}
                  />
                )}
                <span className="mode-l">{ICONS[r.id]}{r.label}</span>
                <span className="mode-c">{r.count}</span>
              </button>
            );
          })}
        </nav>
        <div className="cc-stage">
          {gated ? (
            <main className="main mc-gate">
              <div>
                <h1 className="manage-h">Music CMS<em>.</em></h1>
                <p>
                  Dit is het songwriter Command Center. Log in met het admin-account om songs op te slaan
                  in Supabase — zonder login blijven wijzigingen lokaal.
                </p>
                <button className="stamp-btn" onClick={signInWithGoogle}>Log in met Google</button>
              </div>
            </main>
          ) : (
            <>
              {mode === "songs" && <SongsMode />}
              {mode === "write" && <SongwriterMode songId={songId} />}
              {mode === "voices" && <VoicesMode />}
              {mode === "productie" && <ProductionMode />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
