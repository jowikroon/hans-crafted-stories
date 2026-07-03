import { useState, useEffect, useRef, useCallback, type ReactNode, type CSSProperties } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import coverImg from "@/assets/nhog-cover.jpeg";

/* ═══════════════════════════════════════════════════════════════
   Release Set — Neon House of Glass
   Ingelogde subpagina (top-right menu → Release Set).
   Port van het Claude design-canvas prototype (Release Set.dc.html):
   Turn 1 = release-assets (covers, story, banners, copy, AI-prompts)
   Turn 2 = Release Automator (gesimuleerde 1-klik plaatsing).
   Kanaal-API's zijn gesimuleerd; publicatiecopy komt uit vaste
   fallback-teksten (geen externe AI-call in de browser).
   ═══════════════════════════════════════════════════════════════ */

const N1 = "#00E8FF"; // neon cyaan
const N2 = "#FF3DDB"; // neon magenta
const GB = "24px"; // gloed blur

const FONT_BODY = "'Space Grotesk', sans-serif";
const FONT_DISPLAY = "'Unbounded', sans-serif";

type ChannelStatus = "uit" | "gepland" | "koppelen" | "genereren" | "geplaatst";

interface Channel {
  id: string;
  name: string;
  role: string;
  items: string[];
  when: string;
  enabled: boolean;
  status: ChannelStatus;
  generated?: string;
}

const INITIAL_CHANNELS: Channel[] = [
  { id: "distrokid", name: "DistroKid", role: "Distributie — audio naar alle streamingdiensten", items: ["Audio master (WAV)", "Cover 1a", "Metadata + ISRC"], when: "10.07.2026 · 09:00", enabled: true, status: "gepland" },
  { id: "spotify", name: "Spotify for Artists", role: "Canvas, playlist-pitch & artiestprofiel", items: ["Canvas-loop 9:16", "Playlist-pitch (1e)", "Cover 1a"], when: "10.07.2026 · 10:00", enabled: true, status: "gepland" },
  { id: "instagram", name: "Instagram", role: "Feed-post + story met pre-save link", items: ["Cover 1a", "Story 1c", "Caption 1e"], when: "17.07.2026 · 18:00", enabled: true, status: "gepland" },
  { id: "tiktok", name: "TikTok", role: "Teaser-clip met audio-snippet", items: ["Teaser 15s", "Story-visual 1c", "Ad-copy kort 1e"], when: "18.07.2026 · 12:00", enabled: true, status: "gepland" },
  { id: "youtube", name: "YouTube", role: "Art track + community-post", items: ["Cover 1a", "Audio master", "Beschrijving 1e"], when: "24.07.2026 · 00:00", enabled: true, status: "gepland" },
  { id: "meta", name: "Meta Ads", role: "Betaalde campagne op Instagram & Facebook", items: ["Banner 300×250 (1d)", "Story 1c", "Ad-copy lang 1e"], when: "24.07.2026 · 08:00", enabled: false, status: "uit" },
  { id: "display", name: "Google Display", role: "Bannercampagne op websites", items: ["728×90 (1d)", "300×250 (1d)", "300×600 (1d)"], when: "24.07.2026 · 08:00", enabled: false, status: "uit" },
  { id: "pers", name: "Pers & nieuwsbrief", role: "Persbericht + mailing naar fans", items: ["One-liner 1e", "Cover 1a", "Perskit-link"], when: "22.07.2026 · 09:00", enabled: true, status: "gepland" },
];

const CHANNEL_COPY: Record<string, string> = {
  distrokid: "Neon House of Glass — single, 24.07.2026, Glashuis Records. Master en metadata aangeleverd voor alle streamingdiensten.",
  spotify: "Playlist-pitch: koele synths en glasheldere vocals; voor fans van moderne synth-pop. Canvas-loop gekoppeld.",
  instagram: "Glas breekt. Neon niet. Neon House of Glass — uit 24 juli. Pre-save via de link in bio. #neonhouseofglass #newmusic",
  tiktok: "Dit hoor je straks overal: Neon House of Glass, uit 24 juli. #neonhouseofglass #nieuwemuziek",
  youtube: "Neon House of Glass (Official Audio) — vanaf 24 juli overal te streamen.",
  meta: "Een huis van glas, verlicht door neon. De nieuwe single van ARTIESTNAAM — luister vanaf 24 juli.",
  display: "Neon House of Glass — de nieuwe single. Uit 24.07.2026. Luister nu.",
  pers: 'ARTIESTNAAM kondigt nieuwe single "Neon House of Glass" aan, uit op 24 juli 2026 via Glashuis Records.',
};

const STATUS_META: Record<ChannelStatus, [string, string]> = {
  uit: ["Uit", "#5A6070"],
  gepland: ["Gepland", "#FFB347"],
  koppelen: ["Koppelen met API…", N1],
  genereren: ["Copy genereren…", N2],
  geplaatst: ["Live", "#7BE87B"],
};

const STORAGE_KEY = "nhog_automator_v1";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ─── Responsief schalen van fixed-size artboards ─── */
const ScaledBoard = ({ designW, designH, children }: { designW: number; designH: number; children: ReactNode }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / designW));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [designW]);

  return (
    <div ref={wrapRef} style={{ width: "100%", maxWidth: designW }}>
      <div style={{ height: designH * scale, overflow: "hidden" }}>
        <div style={{ width: designW, height: designH, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

/* ─── Sectielabel (1a/1b/…) ─── */
const Tag = ({ id, label }: { id: string; label: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <a href={`#${id}`} style={{ textDecoration: "none", background: "#14161E", color: "#9BE8F5", border: "1px solid #232634", borderRadius: 6, padding: "3px 9px", fontSize: 12, fontWeight: 700 }}>{id}</a>
    <span style={{ color: "#8A8FA0", fontSize: 13 }}>{label}</span>
  </div>
);

const sectionTitle: CSSProperties = { color: "#5A6070", fontSize: 14, letterSpacing: "0.2em", textTransform: "uppercase" };
const copyBlockLabel: CSSProperties = { color: N1, fontSize: 12, letterSpacing: "0.24em", textTransform: "uppercase" };
const promptLabel: CSSProperties = { color: N2, fontSize: 12, letterSpacing: "0.24em", textTransform: "uppercase", fontFamily: FONT_BODY };
const promptBox: CSSProperties = { fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", fontSize: 14, lineHeight: 1.7, color: "#C9CEDC", background: "#07080C", border: "1px solid #191C26", padding: 18, borderRadius: 8 };

const ReleaseSet = () => {
  const { user, loading } = useAuth();

  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);
  const [publishing, setPublishing] = useState(false);
  const [autoCountdown, setAutoCountdown] = useState(0);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(true);
  const channelsRef = useRef(channels);
  channelsRef.current = channels;

  /* Google Fonts voor deze pagina (Unbounded + Space Grotesk) */
  useEffect(() => {
    const id = "nhog-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;800;900&family=Space+Grotesk:wght@400;500;700&display=swap";
    document.head.appendChild(link);
  }, []);

  /* Restore uit localStorage */
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as { channels?: { id: string; enabled: boolean; status: ChannelStatus; generated?: string }[] } | null;
      if (!d?.channels) return;
      setChannels((prev) =>
        prev.map((c) => {
          const s = d.channels!.find((x) => x.id === c.id);
          if (!s) return c;
          const status: ChannelStatus = s.status === "koppelen" || s.status === "genereren" ? "gepland" : s.status;
          return { ...c, enabled: s.enabled, status, generated: s.generated };
        })
      );
    } catch { /* noop */ }
  }, []);

  /* Save naar localStorage */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now(), channels: channels.map((c) => ({ id: c.id, enabled: c.enabled, status: c.status, generated: c.generated || "" })) }));
    } catch { /* noop */ }
  }, [channels]);

  const setStatus = useCallback((i: number, status: ChannelStatus) => {
    setChannels((st) => st.map((c, j) => (j === i ? { ...c, status } : c)));
  }, []);

  const cancelAuto = useCallback(() => {
    if (autoTimer.current) clearInterval(autoTimer.current);
    autoTimer.current = null;
    setAutoCountdown(0);
  }, []);

  const publishAll = useCallback(async () => {
    if (publishing) return;
    cancelAuto();
    setPublishing(true);
    /* 1 klik dekt álles: zet alle kanalen aan */
    setChannels((st) => st.map((c) => (c.enabled ? c : { ...c, enabled: true, status: "gepland" as ChannelStatus })));
    await sleep(50);
    const idxs = channelsRef.current.map((c, i) => (c.enabled && c.status !== "geplaatst" ? i : -1)).filter((i) => i >= 0);
    for (const i of idxs) {
      if (!mounted.current) return;
      setStatus(i, "koppelen");
      await sleep(450);
      setStatus(i, "genereren");
      await sleep(350);
    }
    for (const i of idxs) {
      if (!mounted.current) return;
      const c = channelsRef.current[i];
      const t = CHANNEL_COPY[c.id] || "Neon House of Glass — uit 24.07.2026.";
      setChannels((st) => st.map((ch, j) => (j === i ? { ...ch, generated: t, status: "geplaatst" as ChannelStatus } : ch)));
      await sleep(300);
    }
    if (mounted.current) setPublishing(false);
  }, [publishing, cancelAuto, setStatus]);

  const publishRef = useRef(publishAll);
  publishRef.current = publishAll;

  /* Auto-start (BJ Fogg prompt): countdown → publiceren, tenzij alles al live */
  useEffect(() => {
    mounted.current = true;
    const t = setTimeout(() => {
      const on = channelsRef.current.filter((c) => c.enabled);
      const done = on.filter((c) => c.status === "geplaatst").length;
      if (on.length && done === on.length) return;
      setAutoCountdown(5);
      autoTimer.current = setInterval(() => {
        setAutoCountdown((n) => {
          if (n <= 1) {
            if (autoTimer.current) clearInterval(autoTimer.current);
            autoTimer.current = null;
            void publishRef.current();
            return 0;
          }
          return n - 1;
        });
      }, 1000);
    }, 800);
    return () => {
      mounted.current = false;
      clearTimeout(t);
      if (autoTimer.current) clearInterval(autoTimer.current);
    };
  }, []);

  const resetAll = () => {
    cancelAuto();
    setPublishing(false);
    setChannels((st) => st.map((c) => ({ ...c, generated: "", status: c.enabled ? ("gepland" as ChannelStatus) : ("uit" as ChannelStatus) })));
  };

  const toggle = (i: number) => {
    if (publishing) return;
    setChannels((st) => st.map((ch, j) => (j === i ? { ...ch, enabled: !ch.enabled, status: !ch.enabled ? ("gepland" as ChannelStatus) : ("uit" as ChannelStatus) } : ch)));
  };

  if (loading) return <div className="min-h-screen" style={{ background: "#07080C" }} />;
  if (!user) return <Navigate to="/portal" replace />;

  const on = channels.filter((c) => c.enabled);
  const done = on.filter((c) => c.status === "geplaatst").length;
  const allDone = on.length > 0 && done === on.length;
  const progressPct = on.length ? Math.round((done / on.length) * 100) : 0;
  const publishLabel = publishing ? "Achtergrondproces bezig…" : allDone ? "Alles staat live" : "Plaats release — 1 klik";

  return (
    <div style={{ minHeight: "100vh", background: "#07080C", fontFamily: FONT_BODY }}>
      <Navbar />
      <div style={{ paddingTop: 96 }}>
        {/* ═══ Hero ═══ */}
        <section style={{ display: "flex", flexDirection: "column", gap: 8, padding: "48px 48px 0" }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 28, color: "#F4F7FF", textTransform: "uppercase" }}>
            Neon House <span style={{ color: N1, textShadow: `0 0 ${GB} ${N1}` }}>of Glass</span>
          </div>
          <div style={{ color: "#8A8FA0", fontSize: 14 }}>ARTIESTNAAM · single · uit 24.07.2026 · Glashuis Records — release set &amp; automator</div>
        </section>

        {/* ═══ Turn 2 — Distributie & automatisering ═══ */}
        <section style={{ display: "flex", flexDirection: "column", gap: 28, padding: 48 }}>
          <div style={sectionTitle}>Distributie &amp; automatisering</div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 48, alignItems: "flex-start" }}>
            <div id="2a" style={{ display: "flex", flexDirection: "column", gap: 12, flex: "1 1 720px", minWidth: 0 }}>
              <Tag id="2a" label="Release Automator — automatische plaatsing per kanaal (prototype, koppelingen gesimuleerd)" />

              <div style={{ width: "100%", maxWidth: 1360, background: "#0C0E15", border: "1px solid #191C26", borderRadius: 14, overflow: "hidden" }}>
                {/* header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24, padding: "24px 28px", borderBottom: "1px solid #191C26", background: "linear-gradient(180deg, #10131C 0%, #0C0E15 100%)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <img src={coverImg} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: "1px solid #232634" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 20, color: "#F4F7FF", textTransform: "uppercase" }}>Neon House <span style={{ color: N1 }}>of Glass</span></div>
                      <div style={{ color: "#8A8FA0", fontSize: 14 }}>ARTIESTNAAM · single · uit 24.07.2026 · Glashuis Records</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <button onClick={resetAll} style={{ padding: "12px 20px", background: "transparent", border: "1px solid #232634", borderRadius: 999, color: "#8A8FA0", fontFamily: FONT_BODY, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Reset</button>
                      <button onClick={() => void publishAll()} style={{ padding: "16px 32px", background: "rgba(255,61,219,0.1)", border: `2px solid ${N2}`, borderRadius: 999, color: N2, fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, letterSpacing: "0.04em", cursor: "pointer", boxShadow: "0 0 22px rgba(255,61,219,0.45)", whiteSpace: "nowrap", textShadow: "0 0 12px rgba(255,61,219,0.5)" }}>{publishLabel}</button>
                    </div>
                    <div style={{ color: "#6C7284", fontSize: 12.5 }}>1 klik · ±30 sec · copy wordt op de achtergrond gekoppeld per kanaal</div>
                  </div>
                </div>

                {/* progress */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 28px", borderBottom: "1px solid #191C26" }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 999, background: "#191C26", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progressPct}%`, background: `linear-gradient(90deg, ${N1}, ${N2})`, boxShadow: `0 0 12px ${N1}`, transition: "width .4s ease" }} />
                  </div>
                  <div style={{ color: "#C9CEDC", fontSize: 13, whiteSpace: "nowrap" }}>{done} van {on.length} kanalen geplaatst</div>
                </div>

                {autoCountdown > 0 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 28px", background: "rgba(0,232,255,0.05)", borderBottom: "1px solid #191C26" }}>
                    <div style={{ color: N1, fontSize: 14, fontWeight: 700 }}>Automatische plaatsing start over {autoCountdown} s — geen klik nodig</div>
                    <button onClick={cancelAuto} style={{ padding: "8px 18px", background: "transparent", border: "1px solid #232634", borderRadius: 999, color: "#8A8FA0", fontFamily: FONT_BODY, fontSize: 13, cursor: "pointer" }}>Annuleer</button>
                  </div>
                )}

                {allDone && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 28px", background: "rgba(123,232,123,0.06)", borderBottom: "1px solid #191C26" }}>
                    <div style={{ color: "#7BE87B", fontSize: 14, fontWeight: 700, textShadow: "0 0 14px rgba(123,232,123,0.6)" }}>Live op {on.length} kanalen — sterk werk!</div>
                    <div style={{ color: "#8A8FA0", fontSize: 13 }}>Volgende kleine stap: <span style={{ color: "#9BE8F5" }}>deel de story óók even op je persoonlijke account</span></div>
                  </div>
                )}

                {/* column headers */}
                <div style={{ display: "grid", gridTemplateColumns: "56px 280px 1fr 180px 150px", gap: 16, alignItems: "center", padding: "12px 28px", color: "#5A6070", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                  <div>Auto</div><div>Kanaal</div><div>Content</div><div>Plaatsing</div><div>Status</div>
                </div>

                {/* rows */}
                {channels.map((ch, i) => {
                  const [statusLabel, statusColor] = STATUS_META[ch.status] || STATUS_META.gepland;
                  return (
                    <div key={ch.id} style={{ display: "grid", gridTemplateColumns: "56px 280px 1fr 180px 150px", gap: 16, alignItems: "center", padding: "16px 28px", borderTop: "1px solid #191C26", opacity: ch.enabled ? 1 : 0.45 }}>
                      <div onClick={() => toggle(i)} style={{ width: 44, height: 24, borderRadius: 999, background: ch.enabled ? "#0E7C8C" : "#232634", position: "relative", cursor: "pointer", transition: "background .2s" }}>
                        <div style={{ position: "absolute", top: 2, left: ch.enabled ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#F4F7FF", transition: "left .2s" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <div style={{ color: "#F4F7FF", fontSize: 15, fontWeight: 700 }}>{ch.name}</div>
                        <div style={{ color: "#6C7284", fontSize: 12.5, lineHeight: 1.4 }}>{ch.role}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {ch.items.map((it) => (
                            <span key={it} style={{ padding: "4px 10px", background: "#10131C", border: "1px solid #232634", borderRadius: 999, color: "#C9CEDC", fontSize: 12, whiteSpace: "nowrap" }}>{it}</span>
                          ))}
                        </div>
                        {!!ch.generated && (
                          <div style={{ color: "#9BE8F5", fontSize: 12.5, lineHeight: 1.5, fontStyle: "italic", maxWidth: 620 }}>“{ch.generated}”</div>
                        )}
                      </div>
                      <div style={{ color: "#C9CEDC", fontSize: 13.5 }}>{ch.when}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, boxShadow: `0 0 10px ${statusColor}`, flexShrink: 0 }} />
                        <span style={{ color: statusColor, fontSize: 13, fontWeight: 500 }}>{statusLabel}</span>
                      </div>
                    </div>
                  );
                })}

                <div style={{ padding: "14px 28px", borderTop: "1px solid #191C26", color: "#5A6070", fontSize: 12 }}>
                  Prototype: de kanaal-API's (DistroKid, Spotify, Meta, Google, TikTok, YouTube) bieden geen publieke publicatie-koppeling vanuit de browser en zijn gesimuleerd; status en teksten blijven lokaal bewaard. Content: <a href="#1a" style={{ color: "#9BE8F5" }}>1a</a> <a href="#1c" style={{ color: "#9BE8F5" }}>1c</a> <a href="#1d" style={{ color: "#9BE8F5" }}>1d</a> <a href="#1e" style={{ color: "#9BE8F5" }}>1e</a>
                </div>
              </div>
            </div>

            {/* 2b — BJ Fogg */}
            <div id="2b" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Tag id="2b" label="Toegepaste gedragsprincipes — BJ Fogg" />
              <div style={{ width: 440, maxWidth: "100%", background: "#0C0E15", border: "1px solid #191C26", borderRadius: 14, padding: 28, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 20, color: "#DDE3F2", fontSize: 14, lineHeight: 1.6 }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 16, color: "#F4F7FF", textTransform: "uppercase" }}>Gedrag = <span style={{ color: N1 }}>M</span> × <span style={{ color: "#FFB347" }}>A</span> × <span style={{ color: N2 }}>P</span></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ color: N2, fontSize: 12, letterSpacing: "0.24em", textTransform: "uppercase" }}>Prompt</div>
                  <div>Eén onmiskenbare actieknop; alle andere acties zijn visueel secundair. De knop zegt precies wat er gebeurt.</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ color: "#FFB347", fontSize: 12, letterSpacing: "0.24em", textTransform: "uppercase" }}>Ability</div>
                  <div>Nul configuratie: kanalen en content zijn vooraf gekoppeld, defaults staan aan. De hele actie kost 1 klik en ±30 seconden — onder de "simplicity threshold".</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ color: N1, fontSize: 12, letterSpacing: "0.24em", textTransform: "uppercase" }}>Motivatie</div>
                  <div>De uitkomst is vooraf concreet (wat, waar, wanneer per kanaal) en de voortgang is live zichtbaar per stap — geen black box.</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ color: "#7BE87B", fontSize: 12, letterSpacing: "0.24em", textTransform: "uppercase" }}>Celebration ("Shine")</div>
                  <div>Direct een succesmoment na afronden, gevolgd door één kleine vervolgstap — zo groeit een publicatiegewoonte (Tiny Habits).</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Turn 1 — Release set ═══ */}
        <section style={{ display: "flex", flexDirection: "column", gap: 28, padding: 48 }}>
          <div style={sectionTitle}>Neon House of Glass · release set</div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 48, alignItems: "flex-start" }}>
            {/* 1a Cover A */}
            <div id="1a" style={{ display: "flex", flexDirection: "column", gap: 12, flex: "1 1 480px", minWidth: 0 }}>
              <Tag id="1a" label="Cover art A — 1080×1080" />
              <ScaledBoard designW={1080} designH={1080}>
                <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", background: "#05060A", border: "1px solid #191C26" }}>
                  <img src={coverImg} alt="Neon House of Glass cover" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(5,6,10,0.3) 0%, rgba(5,6,10,0) 26%, rgba(5,6,10,0) 52%, rgba(5,6,10,0.88) 100%)" }} />
                  <div style={{ position: "absolute", left: 90, right: 90, top: 90, display: "flex", justifyContent: "space-between", color: "#FFFFFF", textShadow: "0 2px 18px rgba(15,0,25,0.55)", fontSize: 26, letterSpacing: "0.32em", textTransform: "uppercase" }}>
                    <span>Nieuwe single</span><span>24.07.2026</span>
                  </div>
                  <div style={{ position: "absolute", left: 90, right: 90, bottom: 200, fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 104, lineHeight: 1.05, color: "#F4F7FF", textTransform: "uppercase" }}>
                    <div><span style={{ color: N1, textShadow: `0 0 ${GB} ${N1}` }}>Neon</span> House</div>
                    <div style={{ fontWeight: 400, fontSize: 62, letterSpacing: "0.2em", marginTop: 12, color: "#DDE3F2" }}>of glass</div>
                  </div>
                  <div style={{ position: "absolute", left: 90, right: 90, bottom: 90, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 32, color: "#F4F7FF", letterSpacing: "0.08em" }}>ARTIESTNAAM</span>
                    <span style={{ color: N2, fontSize: 24, letterSpacing: "0.28em", textTransform: "uppercase", textShadow: `0 0 ${GB} ${N2}` }}>Glashuis Records</span>
                  </div>
                </div>
              </ScaledBoard>
            </div>

            {/* 1b Cover B */}
            <div id="1b" style={{ display: "flex", flexDirection: "column", gap: 12, flex: "1 1 480px", minWidth: 0 }}>
              <Tag id="1b" label="Cover art B — 1080×1080, minimaal glas" />
              <ScaledBoard designW={1080} designH={1080}>
                <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", background: "linear-gradient(180deg, #0A0C12 0%, #07080C 100%)", border: "1px solid #191C26", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 48 }}>
                  <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.015) 60px, rgba(255,255,255,0.06) 120px)" }} />
                  <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 2, background: N1, boxShadow: `0 0 ${GB} ${N1}, 0 0 60px ${N1}` }} />
                  <div style={{ position: "relative", textAlign: "center", transform: "translateY(-140px)" }}>
                    <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 44, letterSpacing: "0.55em", textTransform: "uppercase", color: "#F4F7FF", marginLeft: "0.55em" }}>Neon House</div>
                  </div>
                  <div style={{ position: "relative", textAlign: "center", transform: "translateY(96px)" }}>
                    <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 44, letterSpacing: "0.55em", textTransform: "uppercase", color: "#F4F7FF", marginLeft: "0.55em" }}>of Glass</div>
                    <div style={{ marginTop: 36, color: "#6C7284", fontSize: 22, letterSpacing: "0.3em", textTransform: "uppercase" }}>Artiestnaam · 24.07.2026</div>
                  </div>
                </div>
              </ScaledBoard>
            </div>

            {/* 1c Story */}
            <div id="1c" style={{ display: "flex", flexDirection: "column", gap: 12, flex: "1 1 380px", minWidth: 0 }}>
              <Tag id="1c" label="Instagram story — 1080×1920" />
              <ScaledBoard designW={1080} designH={1920}>
                <div style={{ width: 1080, height: 1920, position: "relative", overflow: "hidden", background: "#05060A", border: "1px solid #191C26", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 52, paddingBottom: 110, boxSizing: "border-box" }}>
                  <img src={coverImg} alt="" style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1080, objectFit: "cover" }} />
                  <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1080, background: "linear-gradient(180deg, rgba(5,6,10,0) 40%, #05060A 100%)" }} />
                  <div style={{ position: "relative", color: "#C9CEDC", fontSize: 30, letterSpacing: "0.4em", textTransform: "uppercase", marginLeft: "0.4em" }}>Nieuwe single</div>
                  <div style={{ position: "relative", fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 120, lineHeight: 1.05, textAlign: "center", color: "#F4F7FF", textTransform: "uppercase" }}>
                    <div style={{ color: N1, textShadow: `0 0 ${GB} ${N1}` }}>Neon</div>
                    <div>House</div>
                    <div style={{ fontWeight: 400, fontSize: 68, letterSpacing: "0.2em" }}>of glass</div>
                  </div>
                  <div style={{ position: "relative", fontSize: 40, color: "#DDE3F2", letterSpacing: "0.12em" }}>UIT 24.07.2026</div>
                  <div style={{ position: "relative", padding: "30px 72px", border: `2px solid ${N2}`, borderRadius: 999, color: N2, fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 36, letterSpacing: "0.14em", boxShadow: `0 0 ${GB} ${N2}, inset 0 0 24px rgba(255,61,219,0.25)`, textShadow: `0 0 ${GB} ${N2}` }}>PRE-SAVE NU</div>
                  <div style={{ position: "relative", color: "#6C7284", fontSize: 26, letterSpacing: "0.24em" }}>↑ SWIPE / LINK IN BIO</div>
                </div>
              </ScaledBoard>
            </div>

            {/* 1d Banners */}
            <div id="1d" style={{ display: "flex", flexDirection: "column", gap: 12, flex: "1 1 728px", minWidth: 0 }}>
              <Tag id="1d" label="Display-banners — 728×90 · 300×250 · 300×600" />
              <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "flex-start" }}>
                <ScaledBoard designW={728} designH={90}>
                  <div style={{ width: 728, height: 90, background: "#05060A", border: "1px solid #191C26", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px 0 114px", boxSizing: "border-box", position: "relative", overflow: "hidden" }}>
                    <img src={coverImg} alt="" style={{ position: "absolute", left: 0, top: 0, width: 90, height: 90, objectFit: "cover" }} />
                    <div style={{ position: "relative", display: "flex", alignItems: "baseline", gap: 14 }}>
                      <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 20, color: "#F4F7FF", textTransform: "uppercase", whiteSpace: "nowrap" }}>Neon House <span style={{ color: N1, textShadow: `0 0 14px ${N1}` }}>of Glass</span></span>
                      <span style={{ color: "#8A8FA0", fontSize: 14, letterSpacing: "0.14em", whiteSpace: "nowrap", flexShrink: 0 }}>UIT 24.07</span>
                    </div>
                    <div style={{ position: "relative", padding: "10px 22px", border: `1px solid ${N2}`, borderRadius: 999, color: N2, fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", boxShadow: "0 0 14px rgba(255,61,219,0.5)", whiteSpace: "nowrap", flexShrink: 0 }}>LUISTER NU</div>
                  </div>
                </ScaledBoard>
                <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ width: 300, height: 250, background: "#05060A", border: "1px solid #191C26", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, boxSizing: "border-box" }}>
                    <img src={coverImg} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(5,6,10,0.35) 0%, rgba(5,6,10,0.78) 100%)" }} />
                    <div style={{ position: "relative", fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 26, lineHeight: 1.1, textAlign: "center", color: "#F4F7FF", textTransform: "uppercase" }}>Neon House<br /><span style={{ fontWeight: 400, fontSize: 18, letterSpacing: "0.2em" }}>of glass</span></div>
                    <div style={{ position: "relative", color: "#C9CEDC", fontSize: 13, letterSpacing: "0.2em" }}>UIT 24.07.2026</div>
                    <div style={{ position: "relative", padding: "9px 20px", border: `1px solid ${N2}`, borderRadius: 999, color: N2, fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", boxShadow: "0 0 12px rgba(255,61,219,0.5)" }}>PRE-SAVE</div>
                  </div>
                  <div style={{ width: 300, height: 600, background: "#05060A", border: "1px solid #191C26", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 28, paddingBottom: 40, boxSizing: "border-box" }}>
                    <img src={coverImg} alt="" style={{ position: "absolute", left: 0, top: 0, width: 300, height: 300, objectFit: "cover" }} />
                    <div style={{ position: "absolute", left: 0, top: 0, width: 300, height: 300, background: "linear-gradient(180deg, rgba(5,6,10,0) 45%, #05060A 100%)" }} />
                    <div style={{ position: "relative", color: "#C9CEDC", fontSize: 13, letterSpacing: "0.3em", textTransform: "uppercase" }}>Nieuwe single</div>
                    <div style={{ position: "relative", fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 34, lineHeight: 1.1, textAlign: "center", color: "#F4F7FF", textTransform: "uppercase" }}><span style={{ color: N1, textShadow: `0 0 16px ${N1}` }}>Neon</span><br />House<br /><span style={{ fontWeight: 400, fontSize: 22, letterSpacing: "0.18em" }}>of glass</span></div>
                    <div style={{ position: "relative", color: "#DDE3F2", fontSize: 16, letterSpacing: "0.12em" }}>UIT 24.07.2026</div>
                    <div style={{ position: "relative", padding: "12px 28px", border: `1px solid ${N2}`, borderRadius: 999, color: N2, fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", boxShadow: "0 0 14px rgba(255,61,219,0.5)" }}>PRE-SAVE NU</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 1e Copy */}
            <div id="1e" style={{ display: "flex", flexDirection: "column", gap: 12, flex: "1 1 480px", minWidth: 0 }}>
              <Tag id="1e" label="Promotie-copy (NL)" />
              <div style={{ width: "100%", maxWidth: 680, background: "#0C0E15", border: "1px solid #191C26", padding: 40, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 28, color: "#DDE3F2", fontSize: 16, lineHeight: 1.6 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={copyBlockLabel}>Instagram-caption</div>
                  <div>Glas breekt. Neon niet. 🔊 'Neon House of Glass' — de nieuwe single van ARTIESTNAAM — is uit op 24 juli. Pre-save via de link in bio en hoor hem als eerste.</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={copyBlockLabel}>Ad-copy kort</div>
                  <div>Neon House of Glass — de nieuwe single van ARTIESTNAAM. Uit 24 juli. Luister nu.</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={copyBlockLabel}>Ad-copy lang</div>
                  <div>Een huis van glas, verlicht door neon. ARTIESTNAAM bouwt met 'Neon House of Glass' een track die tegelijk breekbaar en verblindend is: koele synths, glasheldere vocals en een drop die alles laat trillen. Vanaf 24 juli overal te streamen.</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={copyBlockLabel}>Persbericht one-liner</div>
                  <div>ARTIESTNAAM kondigt nieuwe single 'Neon House of Glass' aan, uit op 24 juli 2026 via Glashuis Records.</div>
                </div>
              </div>
            </div>

            {/* 1f AI prompts */}
            <div id="1f" style={{ display: "flex", flexDirection: "column", gap: 12, flex: "1 1 480px", minWidth: 0 }}>
              <Tag id="1f" label="AI image-prompts (Engels — werkt het best in image-tools)" />
              <div style={{ width: "100%", maxWidth: 680, background: "#0C0E15", border: "1px solid #191C26", padding: 40, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 28 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={promptLabel}>Prompt 1 — cover-achtergrond</div>
                  <div style={promptBox}>a translucent glass house at night, glowing neon cyan and magenta light refracting through frosted glass walls, dark void background, volumetric fog, cinematic lighting, ultra detailed, photorealistic 3D render, square format --ar 1:1 --style raw</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={promptLabel}>Prompt 2 — story-achtergrond</div>
                  <div style={promptBox}>extreme close-up of shattered glass shards suspended mid-air, neon cyan and magenta rim lighting on every edge, pitch black background, shallow depth of field, macro photography, vertical composition --ar 9:16 --style raw</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={promptLabel}>Prompt 3 — banner-textuur</div>
                  <div style={promptBox}>abstract texture of rippled architectural glass, thin neon light strips glowing behind it, cyan and magenta gradient bokeh, dark moody atmosphere, wide panoramic crop, high detail 3D render --ar 8:1</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReleaseSet;
