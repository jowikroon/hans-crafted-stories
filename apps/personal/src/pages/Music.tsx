/**
 * Music.tsx — /music index (songs grid + featured release).
 *
 * Pixel-port of the claude.ai/design prototype project/Music.html, rendered
 * with the .music-v2 scoped stylesheet. The prototype's imperative music.js
 * behaviours are reimplemented here with React state:
 *   - deterministic waveform bars (same seeded RNG as music.js)
 *   - lazy inline Spotify embed on play (one open at a time)
 *   - genre filter pills + newest/oldest sort
 *   - IntersectionObserver reveal (SSR-guarded)
 *
 * Copy is English (matches the prototype). The site is bilingual via useLang,
 * but Music v1 hardcodes English strings — add NL fields to src/data/music.ts
 * and branch on `lang` when localizing.
 *
 * Navbar + Footer are provided by App.tsx around the router; this page only
 * renders the inner content. Default export, wired at /music.
 */

import { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { useLang } from "@/hooks/useLang";
import { songs, featuredRelease, GENRE_FILTERS, type GenreTag, type Song } from "@/data/music";
import "@/styles/music-v2.css";

type SortOrder = "newest" | "oldest";

/* ── deterministic waveform bars (ported from music.js fillWave) ──
   Seeds a tiny LCG from the song title so the bars are stable across
   renders and SSR/CSR — no Math.random, no hydration mismatch. */
function waveBars(key: string, n: number): number[] {
  let seed = 0;
  for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) >>> 0;
  const rng = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const out: number[] = [];
  for (let b = 0; b < n; b++) out.push(4 + Math.round(Math.pow(rng(), 0.7) * 26));
  return out;
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface SongCardProps {
  song: Song;
  index: number;
  isPlaying: boolean;
  onToggle: (slug: string) => void;
}

function SongCard({ song, index, isPlaying, onToggle }: SongCardProps) {
  const bars = useMemo(() => waveBars(song.title, 52), [song.title]);
  return (
    <article
      className={`song rv${isPlaying ? " playing" : ""}`}
      style={{ "--d": `${Math.min(index, 5) * 45}ms` } as React.CSSProperties}
    >
      <div className="song__cover">
        <div className="cover-fallback">
          <span>{song.title}</span>
        </div>
        <img src={song.cover} alt={`Cover art — ${song.title}`} loading="lazy" decoding="async" />
        <span className="cover-scrim" />
        <button
          type="button"
          className="song__play"
          aria-label={isPlaying ? `Pause ${song.title}` : `Play ${song.title}`}
          aria-pressed={isPlaying}
          onClick={() => onToggle(song.slug)}
        >
          <svg className="ic-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          <svg className="ic-pause" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
        </button>
      </div>
      <div className="song__main">
        <div className="song__meta">
          <span className="song__date">{formatDate(song.date)}</span>
          <span className="dot" />
          <span className="tag">{song.genre}</span>
          <span className="dot" />
          <span className="song__dur">{song.duration}</span>
        </div>
        <Link className="song__title" to={`/music/${song.slug}`}>
          {song.title}
        </Link>
        <div className="wave" aria-hidden="true">
          {bars.map((h, i) => (
            <i key={i} style={{ height: `${h}px`, "--bi": i } as React.CSSProperties} />
          ))}
        </div>
      </div>
      {/* Inline Spotify player — rendered only after the user presses play (lazy). */}
      <div className="song__player">
        {isPlaying && (
          <iframe
            title={`Spotify — ${song.title}`}
            src={song.embed}
            height={song.embedHeight}
            frameBorder={0}
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />
        )}
      </div>
    </article>
  );
}

export default function Music() {
  const { lang } = useLang();
  const isNl = lang === "nl";
  const [filter, setFilter] = useState<"all" | GenreTag>("all");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [playingSlug, setPlayingSlug] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useSEO({
    title: "Music — Songs & Production Notes | Hans van Leeuwen",
    description:
      "Original songs by Hans van Leeuwen — listen on Spotify and read the production notes behind each track: how it was made, the gear, and the lyrics.",
    url: "https://hansvanleeuwen.com/music",
    type: "music.playlist",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://hansvanleeuwen.com/" },
            { "@type": "ListItem", position: 2, name: "Music", item: "https://hansvanleeuwen.com/music" },
          ],
        },
        {
          "@type": "MusicGroup",
          name: "Hans van Leeuwen",
          url: "https://hansvanleeuwen.com/music",
          genre: ["Lo-fi", "Electronic", "Ambient"],
        },
      ],
    },
  });

  const filtered = useMemo(() => {
    let list = songs;
    if (filter !== "all") list = list.filter((s) => s.tags.includes(filter));
    list = [...list].sort((a, b) =>
      sort === "newest"
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return list;
  }, [filter, sort]);

  // Stop playback if the playing song is filtered out.
  useEffect(() => {
    if (playingSlug && !filtered.some((s) => s.slug === playingSlug)) setPlayingSlug(null);
  }, [filtered, playingSlug]);

  // Scroll reveal — SSR-guarded.
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = listRef.current;
    if (!root) return;
    root.closest(".music-v2")?.classList.add("js");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 },
    );
    root.querySelectorAll(".song.rv").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [filtered]);

  const togglePlay = (slug: string) => setPlayingSlug((cur) => (cur === slug ? null : slug));
  const count = filtered.length;

  return (
    <div className="music-v2">
      <div className="wrap">
        {/* Breadcrumb */}
        <nav className="crumb idx" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight />
          <span className="here" aria-current="page">{isNl ? "Muziek" : "Music"}</span>
        </nav>

        {/* Masthead */}
        <section className="masthead">
          <span className="eyebrow">{isNl ? "Geluid · Studio-notities" : "Sound · Studio notes"}</span>
          <h1 className="title">{isNl ? "Muziek" : "Music"}</h1>
          <p className="lede">
            {isNl ? (
              <>
                Nummers die ik maak als ik even wegloop van de spreadsheets. Bij elk hoort het volledige{" "}
                <strong>productieverhaal</strong> — hoe het begon, de gear, de fouten en de lyrics. Druk hieronder
                op play, of open een track om de notities te lezen.
              </>
            ) : (
              <>
                Songs I make when I step away from the spreadsheets. Each one comes with the full{" "}
                <strong>production story</strong> — how it started, the gear, the mistakes, and the lyrics. Press play
                below, or open a track to read the notes.
              </>
            )}
          </p>
        </section>

        {/* Featured release — eager album embed (above the fold, as in the prototype). */}
        <section className="release" aria-label="Latest release">
          <div className="release__body">
            <span className="release__kicker">
              <span className="pulse" />
              {featuredRelease.kicker}
            </span>
            <h2 className="release__title">{featuredRelease.title}</h2>
            <p className="release__sub">{featuredRelease.sub}</p>
            <div className="release__meta">
              {featuredRelease.chips.map((c) => (
                <span key={c} className="release__chip">{c}</span>
              ))}
            </div>
          </div>
          <div className="release__player">
            <iframe
              title="Spotify — Nightline EP"
              style={{ borderRadius: 14 }}
              src={featuredRelease.embed}
              width="100%"
              height={featuredRelease.embedHeight}
              frameBorder={0}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </div>
        </section>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="filters" role="group" aria-label="Filter by genre">
            {GENRE_FILTERS.map((f) => (
              <button
                key={f.tag}
                type="button"
                className={`pill ${filter === f.tag ? "on" : ""}`}
                aria-pressed={filter === f.tag}
                onClick={() => setFilter(f.tag)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="toolbar__right">
            <span className="count" aria-live="polite">
              {count} {isNl ? (count === 1 ? "track" : "tracks") : (count === 1 ? "track" : "tracks")}
            </span>
            <div className="sort">
              <label htmlFor="sortSel">{isNl ? "Sorteer" : "Sort"}</label>
              <select id="sortSel" value={sort} onChange={(e) => setSort(e.target.value as SortOrder)}>
                <option value="newest">{isNl ? "Nieuwste" : "Newest"}</option>
                <option value="oldest">{isNl ? "Oudste" : "Oldest"}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Songs grid */}
        <div className="music-list" ref={listRef}>
          {filtered.length === 0 ? (
            <p className="empty">{isNl ? "Nog geen tracks in dit genre." : "No tracks in that genre yet."}</p>
          ) : (
            filtered.map((song, i) => (
              <SongCard
                key={song.slug}
                song={song}
                index={i}
                isPlaying={playingSlug === song.slug}
                onToggle={togglePlay}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

