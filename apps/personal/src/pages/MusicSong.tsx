/**
 * MusicSong.tsx — /music/:slug song detail.
 *
 * Pixel-port of the claude.ai/design prototype project/song-template.html,
 * rendered with the .music-v2 scoped stylesheet. Looks the song up by slug
 * from src/data/music.ts; renders a graceful fallback when not found.
 *
 * The catalogue includes verified public recordings. Production equipment and
 * lyrics are shown only when supported by artist-approved metadata.
 *
 * Copy is English (matches the prototype). Default export, wired at
 * /music/:slug. Navbar + Footer come from App.tsx.
 */

import { useEffect, useId, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { Link } from "@/components/LocalizedLink";
import { useSEO } from "@/hooks/useSEO";
import { getSongBySlug, songs, type ProseBlock } from "@/data/music";
import { albumPath, publicAlbumForSong } from "@/data/albums";
import { songPageHead, songPageJsonLd } from "@/data/songPageSeo";
import "@/styles/music-v2.css";
import "@/styles/hanging-on.css";
import { SongProductionProcessView } from "@/components/SongProductionProcessView";
import { SongStoryView } from "@/components/music/SongStoryView";
import { ensureFontCss, FONT_CSS } from "@/lib/fontCss";

/** Turn a YouTube watch/Shorts/youtu.be URL into an embeddable /embed/<id> URL. */
function youtubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:shorts\/|watch\?v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0&playsinline=1` : null;
}


function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

/** Renders one prose block. <strong> in `text` is author-trusted markup. */
function ProseNode({ block, idPrefix = "" }: { block: ProseBlock; idPrefix?: string }) {
  if (block.type === "h2") return <h2 id={block.id ? `${idPrefix}${block.id}` : undefined}>{block.text}</h2>;
  if (block.type === "callout") {
    return (
      <div className="callout">
        {block.kicker && <div className="callout__k">{block.kicker}</div>}
        <p dangerouslySetInnerHTML={{ __html: block.text }} />
      </div>
    );
  }
  if (block.type === "pull") return <p className="pull">{block.text}</p>;
  const cls = block.type === "lead" ? "lead" : undefined;
  return <p className={cls} dangerouslySetInnerHTML={{ __html: block.text }} />;
}

/**
 * Sticky in-page section menu for the song detail (Notes / Gear / Lyrics).
 * Scroll-spy via IntersectionObserver, smooth-scroll on click, and a
 * spring-glided active pill (framer layoutId). Lifted to the site's animated
 * menu standard. (2026-07-05)
 */
function SongSectionNav({ items, rootRef }: { items: { id: string; label: string }[]; rootRef: RefObject<HTMLDivElement> }) {
  const navId = useId();
  const [active, setActive] = useState(items[0]?.id ?? "");
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const els = items
      .map((it) => root.querySelector<HTMLElement>(`[id="${it.id}"]`))
      .filter((el): el is HTMLElement => !!el);
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (vis[0]) setActive((vis[0].target as HTMLElement).id);
      },
      { root: root.closest(".mx-modal-scroll"), rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.6, 1] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items, rootRef]);

  const go = (id: string) => {
    setActive(id);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rootRef.current?.querySelector<HTMLElement>(`[id="${id}"]`)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  };

  return (
    <nav className="songnav" aria-label="Song sections">
      {items.map((it) => {
        const on = active === it.id;
        return (
          <button
            key={it.id}
            type="button"
            className={`songnav__item${on ? " is-active" : ""}`}
            aria-current={on ? "true" : undefined}
            aria-controls={it.id}
            onClick={() => go(it.id)}
          >
            {on && (
              <motion.span
                layoutId={`${navId}-songnav-active`}
                className="songnav__pill"
                aria-hidden="true"
                transition={{ type: "spring", stiffness: 480, damping: 34, mass: 0.7 }}
              />
            )}
            <span className="songnav__label">{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default function MusicSong({ songSlug, inDialog = false, player, onOpenSong }: { songSlug?: string; inDialog?: boolean; player?: ReactNode; onOpenSong?: (slug: string, trigger?: HTMLElement) => void }) {
  const params = useParams<{ slug: string }>();
  const slug = songSlug ?? params.slug;
  const Page = inDialog ? "div" : "main";
  const Heading = inDialog ? "h2" : "h1";
  const rootRef = useRef<HTMLDivElement>(null);
  const [failedCoverSlug, setFailedCoverSlug] = useState<string | null>(null);
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const idPrefix = inDialog ? `dialog-${instanceId}-` : "";
  const sectionIds = {
    story: `${idPrefix}song-story`,
    notes: `${idPrefix}song-notes`,
    process: `${idPrefix}song-process`,
    gear: `${idPrefix}song-gear`,
    lyrics: `${idPrefix}song-lyrics`,
  };
  useEffect(() => { ensureFontCss("fonts-neon", FONT_CSS.writing); }, []);
  const resolved = getSongBySlug(slug);
  // Only tracks verified public are included in music.ts.
  const song = resolved;
  const publicAlbum = song ? publicAlbumForSong(song.slug) : undefined;
  const neonRecording = Boolean(publicAlbum || song?.detail.category.includes("NEON recording"));

  // Official NEON songs recommend their actual released sibling, never a
  // random adjacent entry from the general public SoundCloud catalogue.
  const more = useMemo(() => {
    if (!song) return [];
    if (publicAlbum) return publicAlbum.publicTracks
      .filter(({ songSlug: publicSlug }) => publicSlug !== song.slug)
      .map(({ songSlug: publicSlug }) => getSongBySlug(publicSlug))
      .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));
    const idx = songs.findIndex((s) => s.slug === song.slug);
    return [songs[(idx + 1) % songs.length], songs[(idx + 2) % songs.length]].filter(
      (s) => s.slug !== song.slug,
    );
  }, [song, publicAlbum]);

  const head = song ? songPageHead(song) : null;

  useSEO({
    enabled: !inDialog,
    title: head?.title ?? "Song not found | Hans van Leeuwen",
    description: head?.description ?? "This track could not be found.",
    image: head?.image,
    imageAlt: head?.ogImageAlt,
    url: head?.canonical ?? "https://hansvanleeuwen.com/music",
    type: "music.song",
    noindex: !song,
    jsonLd: song ? songPageJsonLd(song) : undefined,
  });

  if (!song) {
    return (
      <div className="music-v2 song-studio-page" ref={rootRef}>
        <Page className="songpage">
          <div className="wrap">
            <nav className="crumb" aria-label="Breadcrumb" style={{ paddingTop: 40 }}>
              <Link to="/">Home</Link>
              <ChevronRight />
              <Link to="/music">Music</Link>
              <ChevronRight />
              <span className="here" aria-current="page">Not found</span>
            </nav>
            <header className="songhead" style={{ display: "block" }}>
              <Heading className="songtitle">Track not found</Heading>
              <p className="songhead__by" style={{ marginTop: 16 }}>
                That track doesn’t exist (yet). <Link to="/music" style={{ color: "var(--accent)" }}>Back to Music</Link>.
              </p>
            </header>
          </div>
        </Page>
      </div>
    );
  }

  const d = song.detail;

  return (
    <div className={`music-v2 song-studio-page${neonRecording ? " song-studio-page--neon" : ""}`} ref={rootRef}>
      <Page className="songpage">
        <div className="wrap">
          {/* Breadcrumb */}
          <nav className="crumb" aria-label="Breadcrumb" hidden={inDialog}>
            <Link to="/">Home</Link>
            <ChevronRight />
            <Link to="/music">Music</Link>
            <ChevronRight />
            {publicAlbum && <><Link to={albumPath(publicAlbum.slug)}>NEON</Link><ChevronRight /></>}
            <span className="here" aria-current="page">{song.title}</span>
          </nav>

          {/* Song header */}
          <header className="songhead">
            <div className="songhead__art">
              <div className="cover-fallback" role={failedCoverSlug === song.slug ? "img" : undefined} aria-label={failedCoverSlug === song.slug ? `Artwork for ${song.title} could not be loaded` : undefined} aria-hidden={failedCoverSlug === song.slug ? undefined : true}>
                <span style={{ fontSize: 22 }}>{song.title}</span>
              </div>
              {failedCoverSlug !== song.slug && <img src={song.cover} alt={song.coverAlt ?? `Cover artwork for ${song.title} by Jowikroon`} width={640} height={640} decoding="async" fetchPriority="high" onError={() => setFailedCoverSlug(song.slug)} />}
            </div>
            <div className="songhead__info">
              <div className="songhead__cat">
                {d.category}
                {song.concept && <span className="songhead__concept">SoundCloud recording</span>}
              </div>
              <Heading className="songtitle">{song.title}</Heading>
              <p className="songhead__by">
                By <strong>{song.artist}</strong>, the artist alias of Hans van Leeuwen
              </p>
              <div className="songhead__facts">
                {d.facts.map((f) => (
                  <div className="songfact" key={f.label}>
                    <span className="songfact__k">{f.label}</span>
                    <span className="songfact__v">{f.value}</span>
                  </div>
                ))}
              </div>
              {neonRecording && <Link className="songhead__album-link" to={albumPath("neon-the-signal-between")}>{publicAlbum ? "Part of the NEON story" : "Explore the world of NEON"}<span aria-hidden="true">↗</span></Link>}
            </div>
          </header>

          {/* Spotify player (eager — leads the page like the prototype) */}
          <div className="songplay">
            {player ?? <iframe
              title={`${song.provider === "soundcloud" ? "SoundCloud" : "Spotify"}: ${song.title}`}
              style={{ borderRadius: 14 }}
              src={song.embed}
              width="100%"
              height={song.embedHeight}
              frameBorder={0}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />}
          </div>

          {/* Official video — self-hosted only when videoFile is an absolute URL that
              actually serves the mp4 (e.g. an R2 public URL). The relative "/media/..."
              Cloudflare-Pages path does not resolve on Vercel, so in that case we fall
              through to an inline YouTube embed (playable on-page), then a link card. */}
          {song.videoFile && /^https?:\/\//.test(song.videoFile) ? (
            <figure
              className="songvideo"
              style={{ margin: "20px auto", maxWidth: 300, width: "100%" }}
            >
              <video
                controls
                playsInline
                preload="metadata"
                poster={song.cover}
                style={{ width: "100%", aspectRatio: "9 / 16", borderRadius: 14, background: "#000", display: "block" }}
              >
                <source src={song.videoFile} type="video/mp4" />
                {song.videoUrl ? (
                  <a href={song.videoUrl} target="_blank" rel="noopener noreferrer">Watch on YouTube</a>
                ) : null}
              </video>
              {song.videoUrl && (
                <figcaption style={{ marginTop: 8, textAlign: "center", fontSize: 12 }}>
                  <a className="songvideo__yt" href={song.videoUrl} target="_blank" rel="noopener noreferrer">
                    Also on YouTube
                  </a>
                </figcaption>
              )}
            </figure>
          ) : youtubeEmbedUrl(song.videoUrl) ? (
            <figure className="songvideo" style={{ margin: "20px auto", maxWidth: 300, width: "100%" }}>
              <div style={{ position: "relative", width: "100%", aspectRatio: "9 / 16", borderRadius: 14, overflow: "hidden", background: "#000" }}>
                <iframe
                  src={youtubeEmbedUrl(song.videoUrl)!}
                  title={`Official ${song.title} video`}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                />
              </div>
              {song.videoUrl && (
                <figcaption style={{ marginTop: 8, textAlign: "center", fontSize: 12 }}>
                  <a className="songvideo__yt" href={song.videoUrl} target="_blank" rel="noopener noreferrer">Open on YouTube</a>
                </figcaption>
              )}
            </figure>
          ) : song.videoUrl ? (
            <a
              className="songvideo-card"
              href={song.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Watch the official ${song.title} video on YouTube`}
              style={{ position: "relative", display: "block", margin: "20px auto", maxWidth: 300, width: "100%", aspectRatio: "9 / 16", borderRadius: 14, overflow: "hidden" }}
            >
              <img src={song.cover} alt="" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.7)" }} />
              <span style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#fff", textShadow: "0 1px 8px rgba(0,0,0,.6)" }}>
                <span style={{ width: 56, height: 56, borderRadius: "50%", background: "#FF0000", display: "grid", placeItems: "center" }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".02em" }}>Watch on YouTube</span>
              </span>
            </a>
          ) : null}

          {/* Listen-on platforms — only the ones this track actually has */}
          <div className="platforms" aria-label="Listen on">
            {song.links?.spotify && (
              <a className="platform" href={song.links.spotify} target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="#1DB954"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4.59 14.43a.62.62 0 0 1-.86.21c-2.35-1.44-5.3-1.76-8.79-.96a.62.62 0 1 1-.28-1.21c3.81-.87 7.08-.5 9.72 1.11.29.18.39.57.21.85zm1.22-2.72a.78.78 0 0 1-1.07.26c-2.69-1.65-6.79-2.13-9.97-1.17a.78.78 0 1 1-.45-1.49c3.64-1.1 8.16-.56 11.25 1.33.36.22.48.7.24 1.07zm.11-2.84C14.8 8.99 9.4 8.8 6.3 9.74a.93.93 0 1 1-.54-1.78c3.56-1.08 9.52-.87 13.27 1.35a.93.93 0 1 1-.95 1.6z" /></svg>
                <span className="pf-name">Spotify</span>
              </a>
            )}
            {song.links?.soundcloud && (
              <a className="platform" href={song.links.soundcloud} target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="#FF5500"><path d="M1.2 14.3c-.1 0-.2.1-.2.2l-.2 1.3.2 1.2c0 .1.1.2.2.2s.2-.1.2-.2l.2-1.2-.2-1.3c0-.1-.1-.2-.2-.2zm1.5-.7c-.1 0-.2.1-.2.2l-.3 2 .3 1.9c0 .1.1.2.2.2.1 0 .2-.1.2-.2l.3-1.9-.3-2c0-.1-.1-.2-.2-.2zm1.6-.5c-.1 0-.2.1-.2.2l-.3 2.5.3 2.3c0 .1.1.2.2.2.2 0 .2-.1.2-.2l.3-2.3-.3-2.5c0-.1-.1-.2-.2-.2zm1.7-.3c-.2 0-.3.1-.3.3l-.2 2.7.2 2.4c0 .2.1.3.3.3.1 0 .3-.1.3-.3l.3-2.4-.3-2.7c0-.2-.2-.3-.3-.3zm9.4-2.3c-.4 0-.8.1-1.1.2C13.9 8 12.2 6.7 10.2 6.7c-.5 0-1 .1-1.4.3-.2.1-.2.2-.2.3v10c0 .2.1.3.3.3h7.7c1.6 0 2.8-1.3 2.8-2.8 0-1.6-1.3-2.9-2.8-2.9z" /></svg>
                <span className="pf-name">SoundCloud</span>
              </a>
            )}
            {song.links?.youtube && (
              <a className="platform" href={song.links.youtube} target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="#FF0000"><path d="M23 12s0-3.2-.4-4.7c-.2-.9-.9-1.6-1.8-1.8C19.3 5 12 5 12 5s-7.3 0-8.8.4c-.9.2-1.6.9-1.8 1.8C1 8.8 1 12 1 12s0 3.2.4 4.7c.2.9.9 1.6 1.8 1.8 1.5.5 8.8.5 8.8.5s7.3 0 8.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.6.4-4.8.4-4.8zM9.8 15V9l5.2 3-5.2 3z" /></svg>
                <span className="pf-name">YouTube</span>
              </a>
            )}
          </div>

          <SongSectionNav
            key={song.slug}
            rootRef={rootRef}
            items={[
              { id: sectionIds.story, label: "The story" },
              { id: sectionIds.notes, label: "Release notes" },
              { id: sectionIds.process, label: "Inside the recording" },
              ...(d.gear && d.gear.length ? [{ id: sectionIds.gear, label: "Sounds" }] : []),
              ...(d.lyrics.length ? [{ id: sectionIds.lyrics, label: "Lyrics" }] : []),
            ]}
          />

          {/* One poetic reading, with its own art, separate from sourced facts. */}
          <SongStoryView slug={song.slug} sectionId={sectionIds.story} title={song.title} />

          {/* Production notes + aside */}
          <div className="songbody" id={sectionIds.notes}>
            <article className="prose">
              {d.prose.map((block, i) => (
                <ProseNode key={i} block={block} idPrefix={idPrefix} />
              ))}
            </article>

            <aside className="songaside">
              <div className="specs">
                <div className="specs__h">{song.provider === "spotify" ? "The release" : "The recording"}</div>
                <dl style={{ margin: 0 }}>
                  {d.session.map((s) => (
                    <div className="specrow" key={s.label}>
                      <dt>{s.label}</dt>
                      <dd>{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              {d.gear.length > 0 && (
                <div className="gearlist" id={sectionIds.gear}>
                  <div className="specs__h">Sounds &amp; instruments</div>
                  <ul>
                    {d.gear.map((g) => (
                      <li key={g.name}>
                        <span>
                          <strong>{g.name}</strong>: {g.note}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>

          <SongProductionProcessView song={song} sectionId={sectionIds.process} />

          {d.lyrics.length > 0 && (
            <section className="lyrics" aria-label="Lyrics" id={sectionIds.lyrics}>
              <h2 className="lyrics__h">Lyrics</h2>
              <div className="lyrics__cols">
                {d.lyrics.map((v) => (
                  <div className="lyrics__v" key={v.tag}>
                    <div className="lyrics__tag">{v.tag}</div>
                    <p>
                      {v.lines.map((line, i) => (
                        <span key={i}>
                          {line}
                          {i < v.lines.length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                  </div>
                ))}
              </div>
              {d.lyricsNote && <p className="lyrics__note">{d.lyricsNote}</p>}
            </section>
          )}

          {/* Share */}
          <div className="share" style={{ maxWidth: 1040 }}>
            <span className="share__label">Share</span>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://hansvanleeuwen.com/music/${song.slug}`)}`} aria-label="Share on LinkedIn" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 18.34V10.4H5.67v7.94h2.67zM7 9.24a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1zm11.34 9.1v-4.36c0-2.33-1.25-3.42-2.92-3.42a2.52 2.52 0 0 0-2.28 1.25v-1.07h-2.67v7.6h2.67v-4.2c0-1.11.21-2.18 1.58-2.18 1.35 0 1.37 1.26 1.37 2.25v4.13h2.92z" /></svg>
            </a>
            <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://hansvanleeuwen.com/music/${song.slug}`)}&text=${encodeURIComponent(`${song.title} by Jowikroon`)}`} aria-label="Share on X" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.6 8.7L23 22h-6.8l-5.3-7-6.1 7H1.7l8.2-9.4L1 2h7l4.8 6.4L18.9 2zm-2.4 18h1.7L7.6 3.8H5.8L16.5 20z" /></svg>
            </a>
            <a href={`https://hansvanleeuwen.com/music/${song.slug}`} aria-label={`Permanent link to ${song.title}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
            </a>
          </div>

          {/* More public recordings, or the two official NEON singles in context. */}
          {(more.length > 0 || publicAlbum) && (
            <section className="more">
              <h2 className="more__h">{publicAlbum ? "Continue through NEON" : "Other public recordings"}</h2>
              <div className="more__grid">
                {more.map((m) => (
                  <Link key={m.slug} to={`/music/${m.slug}`} className="ncard" onClick={onOpenSong ? (event) => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onOpenSong(m.slug, event.currentTarget); } } : undefined}>
                    <div className="ncard__m">
                      <span className="tag">{m.genre}</span>
                      <span className="dot" />
                      <span>{m.duration}</span>
                    </div>
                    <div className="ncard__t">{m.title}</div>
                  </Link>
                ))}
                {publicAlbum && <Link to={albumPath(publicAlbum.slug)} className="ncard"><div className="ncard__m"><span className="tag">Album in progress</span></div><div className="ncard__t">NEON: The Signal Between</div></Link>}
              </div>
            </section>
          )}
        </div>
      </Page>
    </div>
  );
}

