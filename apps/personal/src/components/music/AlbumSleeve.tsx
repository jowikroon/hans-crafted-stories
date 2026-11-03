import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "@/components/LocalizedLink";
import { albumPath, albumTitle, type MusicAlbumData } from "@/data/albums";
import { songs } from "@/data/music";
import { useMusicExperience } from "./MusicExperience";

// A slow opening, then a tighter rhythm. Delays include the 440 ms cover turn.
const TRACK_REVEAL_DELAYS = [650, 1100, 1450, 1690, 1870, 2010, 2120, 2210, 2290];

function TurnIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M19 8a8 8 0 1 0 1 8M19 3v5h-5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

interface AlbumSleeveProps {
  album: MusicAlbumData;
  open: boolean;
  onToggle: () => void;
  onAlbumPage?: boolean;
}

/** Both faces use a public projection. Unreleased titles never enter this DOM. */
export default function AlbumSleeve({ album, open, onToggle, onAlbumPage = false }: AlbumSleeveProps) {
  const { openSong } = useMusicExperience();
  const front = useRef<HTMLButtonElement>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  const previousOpen = useRef(open);
  const [instantReveal, setInstantReveal] = useState(false);
  const title = albumTitle(album);
  const backId = `album-back-${album.slug}`;

  useEffect(() => {
    if (previousOpen.current === open) return;
    previousOpen.current = open;
    // Follow the visible face, but don't steal focus when another sleeve opens.
    if (open) backButton.current?.focus({ preventScroll: true });
    else if (backButton.current?.closest("article")?.contains(document.activeElement)) front.current?.focus({ preventScroll: true });
  }, [open]);

  return (
    <article className={`ma-album-card ma-theme--${album.theme}`} data-open={open} data-instant={instantReveal} aria-label={title}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) { event.preventDefault(); onToggle(); }
        if (event.key === "Tab" && open) setInstantReveal(true);
      }}>
      <div className="ma-sleeve">
        <button ref={front} type="button" className="ma-sleeve__front"
          onClick={(event) => { setInstantReveal(event.detail === 0); onToggle(); }}
          aria-label={`Draai ${title} om: bekijk de achterkant`} aria-expanded={open} aria-controls={backId}
          aria-hidden={open} tabIndex={open ? -1 : 0}>
          <img src={album.cover} width={1254} height={1254} alt={`Albumcover ${title}, Jowikroon`} {...{ fetchpriority: album.theme === "neon" || onAlbumPage ? "high" : "auto" }} />
          <span className="ma-sleeve__hint" aria-hidden="true"><span>Draai om</span><TurnIcon /></span>
        </button>
        <div className="ma-sleeve__back" id={backId} aria-hidden={!open}>
          <img className="ma-sleeve__back-image" src={album.backCover} width={1254} height={1254} alt="" loading="eager" />
          <button ref={backButton} type="button" className="ma-sleeve__return" onClick={onToggle} tabIndex={open ? 0 : -1} aria-label={`Draai ${title} terug naar de cover`}><TurnIcon /></button>
          <div className="ma-sleeve__back-overlay">
            <div className="ma-sleeve__back-heading">
              <p className="ma-sleeve__edition"><span>Jowikroon</span><span>COMING {album.releaseYear}</span></p>
              <h3>{album.title}</h3>
              {album.subtitle && <p className="ma-sleeve__subtitle">{album.subtitle}</p>}
            </div>
            <ol className="ma-sleeve__tracklist" aria-label={`Tracklist ${title}`}>
              {Array.from({ length: album.trackCount }, (_, index) => {
                const position = index + 1;
                const release = album.publicTracks.find((track) => track.position === position);
                const song = release ? songs.find((item) => item.slug === release.songSlug) : undefined;
                const delay = TRACK_REVEAL_DELAYS[index] ?? 2290 + (index - 8) * 60;
                return <li key={position} className={`ma-sleeve__track-row${song ? " ma-sleeve__track-row--released" : " ma-sleeve__track-row--unreleased"}`} style={{ "--ma-reveal-delay": `${delay}ms` } as CSSProperties}>
                  {song ? <Link to={`/music/${song.slug}`} className="ma-sleeve__track" tabIndex={open ? 0 : -1} aria-haspopup="dialog" aria-label={`Open songpagina van ${song.title}`} onClick={(event) => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); openSong(song.slug, event.currentTarget); } }}>
                    <span className="ma-sleeve__index">{String(position).padStart(2, "0")}</span><span className="ma-sleeve__track-title">{song.title}</span><span className="ma-sleeve__play" aria-hidden="true">↗</span>
                  </Link> : <div className="ma-sleeve__unreleased" aria-label={`Nummer ${position}: coming ${album.releaseYear}`}>
                    <span className="ma-sleeve__index" aria-hidden="true">{String(position).padStart(2, "0")}</span><span className={`ma-blur-mark${position % 2 === 0 ? " ma-blur-mark--short" : ""}`} aria-hidden="true" />
                  </div>}
                </li>;
              })}
            </ol>
            {onAlbumPage
              ? <a href="#album-tracks" className="ma-sleeve__cta" tabIndex={open ? 0 : -1}><span>{album.publicTracks.length ? "Luister de releases" : "Bekijk de tracklist"}</span><span aria-hidden="true">↓</span></a>
              : <Link to={albumPath(album.slug)} className="ma-sleeve__cta" tabIndex={open ? 0 : -1} aria-label={`Ontdek het album ${title}`}><span>Ontdek het album</span><span aria-hidden="true">↗</span></Link>}
          </div>
        </div>
      </div>
    </article>
  );
}
