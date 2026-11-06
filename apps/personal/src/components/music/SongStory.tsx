import { Link } from "@/components/LocalizedLink";
import { albumPath, publicAlbumForSong } from "@/data/albums";
import { getSongNarrative } from "@/data/songNarrative";

export interface SongStoryProps {
  slug: string;
  sectionId: string;
  title: string;
}

/** A single shared narrative section for the page and the music dialog. */
export default function SongStory({ slug, sectionId, title }: SongStoryProps) {
  const story = getSongNarrative(slug);
  if (!story) return null;

  // This gate names an actual public album association. Other songs may echo
  // the NEON world without claiming a confirmed tracklist position.
  const publicAlbum = publicAlbumForSong(slug);

  return (
    <section className="songstory" id={sectionId} aria-labelledby={`${sectionId}-heading`} data-world={story.world}>
      <div className="songstory__intro">
        <div className="songstory__opening">
          <p className="songstory__eyebrow">{story.eyebrow} <span aria-hidden="true">/</span> An interpretation</p>
          <h2 id={`${sectionId}-heading`} className="songstory__heading">{story.heading}</h2>
          <p className="songstory__subline">{story.subline}</p>
          <p className="songstory__emotion">{story.emotion}</p>
          <div className="songstory__triptych" aria-label={`Three perspectives on ${title}`}>
            {(["i", "you", "it"] as const).map((perspective) => (
              <div className="songstory__perspective" key={perspective}>
                <h3>{perspective === "i" ? "I" : perspective === "you" ? "You" : "It"}</h3>
                <p>{story.triptych[perspective]}</p>
              </div>
            ))}
          </div>
        </div>
        <figure className="songstory__figure">
          <img
            src={story.art.src}
            srcSet={`${story.art.thumbnail} 320w, ${story.art.src} 1200w`}
            sizes="(max-width: 720px) 88vw, 360px"
            alt={story.art.alt}
            width={1200}
            height={1200}
            loading="lazy"
            decoding="async"
          />
          <figcaption>Visual interpretation for {title}</figcaption>
        </figure>
      </div>

      <div className="songstory__continuation">
        <div className="songstory__prose">
          {story.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {publicAlbum && (
            <Link className="songstory__album-link" to={albumPath(publicAlbum.slug)}>
              Explore the NEON album <span aria-hidden="true">↗</span>
            </Link>
          )}
        </div>
        <div className="songstory__listen">
          <div className="songstory__listen-head">
            <img src={story.art.pulse} alt="" aria-hidden="true" width={210} height={28} loading="lazy" />
            <h3>Listen for yourself</h3>
          </div>
          <ol>{story.listening.map((cue) => <li key={cue}>{cue}</li>)}</ol>
          <p className="songstory__source-note">These are listening invitations, not verified audio or studio measurements.</p>
        </div>
      </div>
    </section>
  );
}
