/**
 * SongStory.tsx, the narrative band on /music/:slug.
 *
 * Song pages used to open straight into metadata. This section answers the
 * question a listener actually arrives with: what is this song, and why does
 * it exist. It borrows the NEON plate language (near black field, restrained
 * violet, the signal line) without touching the surrounding music-v2 system.
 */

import { Link } from "@/components/LocalizedLink";
import { albumPath, getAlbum } from "@/data/albums";
import { getSongNarrative } from "@/data/songNarrative";
import "@/styles/song-story.css";

const STUDIO_STATUS: Record<string, string> = {
  planned: "Rebuild planned",
  "in-progress": "Rebuild in progress",
  rebuilt: "Rebuilt in Ableton Live",
};

function ArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export default function SongStory({ slug, sectionId, title }: { slug: string; sectionId: string; title: string }) {
  const narrative = getSongNarrative(slug);
  if (!narrative) return null;
  const album = narrative.albumSlug ? getAlbum(narrative.albumSlug) : undefined;

  return (
    <section className="songstory" id={sectionId} aria-labelledby={`${sectionId}-heading`} data-world={narrative.world}>
      <div className="songstory__grid">
        <figure className="songstory__art">
          <span className="songstory__art-blur" style={{ backgroundImage: `url(${narrative.art.thumbnail})` }} aria-hidden="true" />
          <img
            src={narrative.art.src}
            width={1200}
            height={1200}
            alt={narrative.art.alt}
            loading="lazy"
            decoding="async"
          />
          <figcaption>{narrative.art.caption}</figcaption>
        </figure>

        <div className="songstory__body">
          <p className="songstory__eyebrow">{narrative.eyebrow}</p>
          <h2 id={`${sectionId}-heading`} className="songstory__heading">{narrative.heading}</h2>
          {narrative.paragraphs.map((text, index) => (
            <p key={index} className="songstory__p">{text}</p>
          ))}

          <blockquote className="songstory__quote">
            <img className="songstory__pulse" src={narrative.pulse} width={300} height={120} alt="" loading="lazy" decoding="async" />
            <p>{narrative.pullQuote}</p>
            <cite>{title}</cite>
          </blockquote>

          <p className="songstory__place">{narrative.place}</p>
        </div>
      </div>

      <div className="songstory__rail">
        <div className="songstory__cues">
          <h3 className="songstory__sub">What to listen for</h3>
          <ol>
            {narrative.cues.map((cue) => (
              <li key={cue.at}>
                <span className="songstory__cue-at">{cue.at}</span>
                <span className="songstory__cue-text">{cue.text}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="songstory__craft">
          <h3 className="songstory__sub">How it is built</h3>
          <p>{narrative.craft}</p>
          {album ? (
            <Link className="songstory__album" to={albumPath(album.slug)}>
              <span className="songstory__album-k">Part of the album</span>
              <span className="songstory__album-t">
                {album.subtitle ? `${album.title}: ${album.subtitle}` : album.title}
                <ArrowRight />
              </span>
            </Link>
          ) : (
            <p className="songstory__standalone">A standalone recording, outside the album sequence.</p>
          )}
        </div>
      </div>

      <div className="songstory__studio">
        <div className="songstory__studio-head">
          <h3 className="songstory__sub">Instruments and studio</h3>
          <p className="songstory__daw" data-status={narrative.studio.status}>
            <span className="songstory__daw-dot" aria-hidden="true" />
            <span className="songstory__daw-name">Ableton Live</span>
            <span className="songstory__daw-state">{STUDIO_STATUS[narrative.studio.status] ?? STUDIO_STATUS.planned}</span>
          </p>
        </div>

        <p className="songstory__studio-note">{narrative.studio.note}</p>

        {narrative.studio.instruments.length > 0 ? (
          <dl className="songstory__instruments">
            {narrative.studio.instruments.map((item) => (
              <div key={item.name}>
                <dt>{item.name}</dt>
                <dd>{item.role}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="songstory__instruments-pending">
            The instrument list for this track is still being written. It gets filled in while the song is rebuilt.
          </p>
        )}
      </div>
    </section>
  );
}
