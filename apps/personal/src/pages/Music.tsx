/**
 * Music.tsx, /music "After Hours" neon page.
 *
 * Pixel-port of the claude.ai/design prototype project/Music - Neon.html,
 * rendered with the scoped .music-neon stylesheet. Dark, near-black canvas
 * with one acid-neon accent, an ambient cursor-lit grid, numbered track rows
 * with lazy inline Spotify/SoundCloud playback, a live Amersfoort clock, and
 *, folded in at the bottom, the Music Studio release timeline.
 *
 * Data comes from the live src/data/music.ts (real catalogue: Beat Drop +
 * SoundCloud concepts). The permanent site Navbar renders above this in its
 * dark variant (App.tsx isDarkPage); the global light Footer is hidden there,
 * so this page renders its own neon footer.
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { songs, featuredRelease, previousRelease, type Song } from "@/data/music";
import ReleaseTimeline from "@/components/music/ReleaseTimeline";
import "@/styles/music-neon.css";

/* deterministic waveform bars, stable across SSR/CSR (no Math.random) */
function waveBars(key: string, n: number): number[] {
  let seed = 0;
  for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) >>> 0;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const h = 6 + Math.round(Math.abs(Math.sin(i * 0.7) + Math.sin(i * 1.9) * 0.6) * 22) + ((seed >>= 1, seed) % 8);
    out.push(Math.max(5, Math.min(30, h)));
  }
  return out;
}

const PlayIcon = () => (
  <svg className="ic-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
);
const PauseIcon = () => (
  <svg className="ic-pause" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
);
const RhythmIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 12h3l2 6 4-14 2 8h5" />
  </svg>
);
const RadarIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><path d="M12 12l6.4-6.4" /><circle cx="12" cy="12" r="0.6" fill="currentColor" />
  </svg>
);
const ArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
);

function fmtDate(iso: string): string {
  if (!iso || iso === "-") return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function TrackRow({ song, index, playing, onToggle }: { song: Song; index: number; playing: boolean; onToggle: (slug: string) => void }) {
  const bars = waveBars(song.title, 34);
  return (
    <article className={`mn-track${playing ? " playing" : ""}`}>
      <span className="mn-track__idx">{String(index + 1).padStart(2, "0")}</span>
      <div className="mn-track__cover">
        {song.cover && <img src={song.cover} alt={`Cover, ${song.title}`} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}
        <button className="mn-track__play" type="button" aria-label={playing ? `Pause ${song.title}` : `Play ${song.title}`} aria-pressed={playing} onClick={() => onToggle(song.slug)}>
          <span className="ico">{playing ? <PauseIcon /> : <PlayIcon />}</span>
        </button>
      </div>
      <div className="mn-track__main">
        <Link className="mn-track__title" to={`/music/${song.slug}`}>{song.title}</Link>
        <div className="mn-track__meta">
          <span className="tag">{song.genre}</span>
          {song.concept && <span className="concept">Concept</span>}
          <span className="d" />
          <span>{fmtDate(song.date)}</span>
        </div>
      </div>
      <div className="mn-wave" aria-hidden="true">
        {bars.map((h, i) => <i key={i} style={{ height: `${h}px`, "--bi": i } as React.CSSProperties} />)}
      </div>
      <span className="mn-track__dur">{song.duration}</span>
      <Link className="mn-track__open" to={`/music/${song.slug}`}>Notes <ArrowRight /></Link>
      {playing && (
        <div className="mn-track__embed">
          <iframe
            title={`Player, ${song.title}`}
            src={song.embed}
            height={song.embedHeight}
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />
        </div>
      )}
    </article>
  );
}

const Music = () => {
  const { user } = useAuth();
  // SoundCloud tracks are gated: only visible when logged in. Public visitors
  // see Spotify releases only.
  const visibleSongs = songs.filter((sg) => sg.provider !== "soundcloud" || !!user);

  // Hero genre menu, a real, animated filter over the track list. "All" plus
  // the genres actually present in the visible catalogue. Clicking a chip
  // filters the tracks and glides the neon highlight (framer layoutId).
  const [genre, setGenre] = useState<string>("All");
  const genres = ["All", ...Array.from(new Set(visibleSongs.map((sg) => sg.genre)))];
  const shownSongs = genre === "All" ? visibleSongs : visibleSongs.filter((sg) => sg.genre === genre);

  useSEO({
    title: "Music: After Hours | Hans van Leeuwen",
    description: "Tracks recorded after midnight, a tape machine, soft synths, and whatever the night left behind. Press play, and read the notes for every song.",
    imageAlt: "Hans van Leeuwen music: original songs and production notes (Lo-fi, Electronic, Ambient)",
    url: "https://hansvanleeuwen.com/music",
    type: "music.playlist",
    hreflang: [
      { lang: "en", href: "https://hansvanleeuwen.com/music" },
      { lang: "nl", href: "https://hansvanleeuwen.com/music" },
      { lang: "x-default", href: "https://hansvanleeuwen.com/music" },
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://hansvanleeuwen.com/" },
          { "@type": "ListItem", position: 2, name: "Music", item: "https://hansvanleeuwen.com/music" },
        ] },
        { "@type": "MusicGroup", "@id": "https://hansvanleeuwen.com/music#artist", name: "Hans van Leeuwen", alternateName: "Jowikroon", url: "https://hansvanleeuwen.com/music", genre: ["Lo-fi", "Electronic", "Ambient"] },
        {
          "@type": "ItemList",
          name: "Original songs by Hans van Leeuwen",
          numberOfItems: songs.length,
          itemListElement: songs.map((sg, i) => {
            const [mm, ss] = (sg.duration || "0:00").split(":").map((v) => Number(v) || 0);
            const iso = `PT${mm}M${ss}S`;
            return {
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "MusicRecording",
                "@id": `https://hansvanleeuwen.com/music/${sg.slug}#recording`,
                name: sg.title,
                url: `https://hansvanleeuwen.com/music/${sg.slug}`,
                image: sg.cover,
                genre: sg.genre,
                duration: iso,
                datePublished: sg.date,
                byArtist: { "@id": "https://hansvanleeuwen.com/music#artist" },
                associatedMedia: { "@type": "MediaObject", contentUrl: sg.listenUrl },
              },
            };
          }),
        },
      ],
    },
  });

  const [playingSlug, setPlayingSlug] = useState<string | null>(null);
  const toggle = (slug: string) => setPlayingSlug((cur) => (cur === slug ? null : slug));

  const clockRef = useRef<HTMLSpanElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  /* live Amersfoort clock */
  useEffect(() => {
    const tick = () => {
      if (!clockRef.current) return;
      const t = new Date();
      clockRef.current.innerHTML = `Amersfoort <b>${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}</b>`;
    };
    tick();
    const id = window.setInterval(tick, 20000);
    return () => window.clearInterval(id);
  }, []);

  /* scroll reveal */
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    const els = rootRef.current?.querySelectorAll<HTMLElement>(".mn-rv");
    if (!els) return;
    if (reduce || !("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("in")); return; }
    const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach((el, i) => { el.style.setProperty("--d", `${(i % 4) * 70}ms`); io.observe(el); });
    return () => io.disconnect();
  }, []);

  /* neon cursor + ambient grid lighting (fine pointers, motion-ok only) */
  useEffect(() => {
    const fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    const docEl = document.documentElement;
    if (!fine || reduce) { docEl.style.setProperty("--mn-mx", "50vw"); docEl.style.setProperty("--mn-my", "32vh"); return; }

    document.body.classList.add("mn-neon-cursor");
    const mk = (cls: string) => { const d = document.createElement("div"); d.className = `mn-cursor ${cls}`; document.body.appendChild(d); return d; };
    const glow = mk("mn-cursor-glow"), ring = mk("mn-cursor-ring"), dot = mk("mn-cursor-dot");
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, gx = mx, gy = my, raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      docEl.style.setProperty("--mn-mx", `${mx}px`);
      docEl.style.setProperty("--mn-my", `${my}px`);
      dot.style.transform = `translate(${mx}px,${my}px)`;
    };
    const frame = () => {
      rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2; gx += (mx - gx) * 0.085; gy += (my - gy) * 0.085;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      glow.style.transform = `translate(${gx}px,${gy}px)`;
      raf = requestAnimationFrame(frame);
    };
    const hot = "a, button, .mn-track, .mn-cue, .mn-chip, input, select, [data-cursor]";
    const over = (e: Event) => { if ((e.target as Element).closest?.(hot)) document.body.classList.add("mn-cursor-hot"); };
    const out = (e: Event) => { const re = (e as MouseEvent).relatedTarget as Element | null; if ((e.target as Element).closest?.(hot) && !re?.closest?.(hot)) document.body.classList.remove("mn-cursor-hot"); };
    const down = () => document.body.classList.add("mn-cursor-down");
    const up = () => document.body.classList.remove("mn-cursor-down");

    addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", over);
    document.addEventListener("mouseout", out);
    document.addEventListener("mousedown", down);
    document.addEventListener("mouseup", up);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mouseout", out);
      document.removeEventListener("mousedown", down);
      document.removeEventListener("mouseup", up);
      document.body.classList.remove("mn-neon-cursor", "mn-cursor-hot", "mn-cursor-down");
      [glow, ring, dot].forEach((el) => el.remove());
    };
  }, []);

  return (
    <div className="music-neon" ref={rootRef}>
      {/* ambient field */}
      <div className="mn-field" aria-hidden="true">
        <div className="mn-field__grid" />
        <div className="mn-field__glow" />
        <div className="mn-field__vign" />
      </div>

      {/* hero */}
      <section className="mn-wrap mn-hero">
        <span className="mn-kicker"><span className="mn-live" />Now playing <span className="mn-sep">/</span> made after midnight</span>
        <h1 className="mn-hero__title">Songs for the hours <span className="lit">nobody&apos;s</span> <em>awake</em> for.</h1>
        <p className="mn-hero__lede">No singles chasing a playlist. Just a handful of <b>tracks</b>, a tape machine, and whatever the night left behind. Press play, and if you want to stay a while, every song keeps the notes: the gear, the mistakes, the lyrics.</p>
        <div className="mn-hero__cues" role="tablist" aria-label="Filter tracks by genre">
          {genres.map((g) => {
            const active = genre === g;
            return (
              <button
                key={g}
                type="button"
                role="tab"
                aria-selected={active}
                className={`mn-cue mn-cue--btn${active ? " is-active" : ""}`}
                onClick={() => {
                  setGenre(g);
                  document.getElementById("songs")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {active && (
                  <motion.span
                    layoutId="mn-cue-active"
                    className="mn-cue__pill"
                    aria-hidden="true"
                    transition={{ type: "spring", stiffness: 480, damping: 34, mass: 0.7 }}
                  />
                )}
                <span className="mn-cue__label">{g}</span>
              </button>
            );
          })}
        </div>
        {/* live clock lives in the page (the permanent header is shared) */}
        <span ref={clockRef} className="mn-clock" style={{ display: "none" }} />
      </section>

      {/* featured release */}
      <section className="mn-wrap mn-rv" aria-label="Latest release">
        <p className="mn-slabel"><span className="n">01</span> Latest release</p>
        <div className="mn-release">
          <div className="mn-release__body">
            <span className="mn-release__kicker"><span className="mn-live" />{featuredRelease.kicker}</span>
            <h2 className="mn-release__title">{featuredRelease.title}</h2>
            <p className="mn-release__sub">{featuredRelease.sub}</p>
            <div className="mn-release__meta">{featuredRelease.chips.map((c) => <span key={c} className="mn-chip">{c}</span>)}</div>
            <div className="mn-release__cta-row">
              <Link to="/music/neon-house-of-glass" className="mn-release__cta" data-cursor aria-label={`Open the ${featuredRelease.title} track page`}>
                <RhythmIcon /> Rhythm
              </Link>
            </div>
          </div>
          <div className="mn-release__player">
            <iframe title={`Spotify, ${featuredRelease.title}`} src={featuredRelease.embed} width="100%" height={featuredRelease.embedHeight} frameBorder={0} loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />
          </div>
        </div>
        <div className="mn-release" style={{ marginTop: "clamp(20px,3vh,32px)" }}>
          <div className="mn-release__body">
            <span className="mn-release__kicker">{previousRelease.kicker}</span>
            <h2 className="mn-release__title">{previousRelease.title}</h2>
            <p className="mn-release__sub">{previousRelease.sub}</p>
            <div className="mn-release__meta">{previousRelease.chips.map((c) => <span key={c} className="mn-chip">{c}</span>)}</div>
            <div className="mn-release__cta-row">
              <Link to="/music/beat-drop" className="mn-release__cta" data-cursor aria-label={`Open the ${previousRelease.title} track page`}>
                <RhythmIcon /> Rhythm
              </Link>
            </div>
          </div>
          <div className="mn-release__player">
            <iframe title={`Spotify, ${previousRelease.title}`} src={previousRelease.embed} width="100%" height={previousRelease.embedHeight} frameBorder={0} loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />
          </div>
        </div>
      </section>

      {/* tracks */}
      <section className="mn-wrap mn-rv" id="songs" aria-label="Tracks">
        <p className="mn-slabel" style={{ marginTop: "clamp(54px,8vh,90px)" }}><span className="n">02</span> The tracks</p>
        <div className="mn-tracks">
          {shownSongs.map((song, i) => (
            <TrackRow key={song.slug} song={song} index={i} playing={playingSlug === song.slug} onToggle={toggle} />
          ))}
          {shownSongs.length === 0 && (
            <p className="mn-tracks__empty">No tracks in <b>{genre}</b> yet, <button type="button" className="mn-tracks__reset" onClick={() => setGenre("All")}>show all</button>.</p>
          )}
        </div>
      </section>

      {/* artist radar */}
      <section className="mn-wrap mn-rv" aria-label="Artist Radar">
        <p className="mn-slabel" style={{ marginTop: "clamp(54px,8vh,90px)" }}><span className="n">03</span> Artist Radar</p>
        <div className="mn-release">
          <div className="mn-release__body">
            <span className="mn-release__kicker"><span className="mn-live" />Gratis alert-service</span>
            <h2 className="mn-release__title">Mis nooit meer een show van je favoriete artiest</h2>
            <p className="mn-release__sub">Kies je artiesten, je krijgt een mail bij geruchten, aankondigingen en zodra tickets in Nederland of België in de verkoop gaan.</p>
            <div className="mn-release__meta">
              <span className="mn-chip">Geruchten</span>
              <span className="mn-chip">Aankondigingen</span>
              <span className="mn-chip">Ticketverkoop NL/BE</span>
            </div>
            <div className="mn-release__cta-row">
              <Link to="/muziek/artist-radar" className="mn-release__cta" data-cursor aria-label="Open the Artist Radar and put artists on your radar">
                <RadarIcon /> Zet artiesten op je radar
              </Link>
            </div>
          </div>
          <div className="mn-release__player mn-radar-visual" aria-hidden="true">
            <div className="mn-radar-rings">
              <div className="mn-radar-sweep" />
              <span className="mn-radar-dot" style={{ left: "62%", top: "30%" }} />
              <span className="mn-radar-dot" style={{ left: "34%", top: "58%", animationDelay: ".9s" }} />
              <span className="mn-radar-dot" style={{ left: "70%", top: "68%", animationDelay: "1.7s" }} />
            </div>
          </div>
        </div>
      </section>

      {/* release timeline studio (folded into the page) */}
      <section className="mn-wrap mn-rv" aria-label="Release timeline">
        <ReleaseTimeline />
      </section>

      {/* outro */}
      <section className="mn-wrap mn-outro mn-rv">
        <p className="mn-outro__line">That&apos;s the record so far. <em>No encore</em>, just press play again, or follow along for whatever the next late night turns into.</p>
        <a href={featuredRelease.embed.includes("album/") ? "https://open.spotify.com/album/7gHaf9f1kcQaOtg9sMzPlo" : "#"} className="mn-outro__cta" target="_blank" rel="noopener noreferrer" data-cursor>
          Follow on Spotify <ArrowRight />
        </a>
      </section>

      {/* page-local neon footer (global light footer is hidden on dark pages) */}
      <footer className="mn-footer">
        <div className="mn-footer__inner">
          <div>
            <div className="mn-footer__brand">Hans van Leeuwen</div>
            <p className="mn-footer__note">E-commerce manager by day. Making songs by night. Notes, gear and lyrics for every track.</p>
          </div>
          <nav className="mn-footer__links" aria-label="Footer">
            <Link to="/writing">Writing</Link>
            <Link to="/music">Music</Link>
            <Link to="/muziek/artist-radar">Artist Radar</Link>
            <Link to="/about">About</Link>
            <a href="https://open.spotify.com/album/7gHaf9f1kcQaOtg9sMzPlo" target="_blank" rel="noopener noreferrer">Spotify</a>
          </nav>
        </div>
        <div className="mn-footer__copy">
          <span>© 2026 Hans van Leeuwen · Amersfoort, NL</span>
          <span>All tracks self-produced</span>
        </div>
      </footer>
    </div>
  );
};

export default Music;
