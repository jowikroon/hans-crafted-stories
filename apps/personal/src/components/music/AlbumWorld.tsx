import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "@/components/LocalizedLink";
import { albums, albumPath, type MusicAlbumData } from "@/data/albums";
import { albumEditorial } from "@/data/albumEditorial";

/** A quiet campaign wave, never an audio visualizer or a playback indicator. */
export function AlbumSignal({ className = "" }: { className?: string }) {
  return <svg className={`ma-signal ${className}`} viewBox="0 0 104 28" fill="none" aria-hidden="true"><path d="M2 14C19-2 32-2 51 14s32 16 51 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}

/** Three optional ways into the image, with native buttons and keyboard tabs. */
export default function AlbumWorld({ album }: { album: MusicAlbumData }) {
  const story = albumEditorial[album.slug];
  const id = useId();
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const [selected, setSelected] = useState(0);
  const showFront = story.feelings[selected].image === "front";

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = story.feelings.length - 1;
    const next = event.key === "ArrowRight" ? (index + 1) % (last + 1)
      : event.key === "ArrowLeft" ? (index + last) % (last + 1)
      : event.key === "Home" ? 0 : event.key === "End" ? last : undefined;
    if (next === undefined) return;
    event.preventDefault();
    setSelected(next);
    buttons.current[next]?.focus();
  }

  return <section className="ma-world" id="album-world" aria-labelledby={`${id}-heading`}>
    <div className="ma-section-heading"><div><p className="ma-eyebrow">De wereld van {album.title}</p><h2 id={`${id}-heading`}>{story.worldHeading}</h2></div><span className="ma-world__invitation">Kijk nog eens.</span></div>
    <div className="ma-world__layout">
      <figure className="ma-world__portrait"><img src={showFront ? album.cover : album.backCover} width={1254} height={1254} alt={showFront ? story.frontImageAlt : story.imageAlt} loading="lazy" decoding="async" /><figcaption>{story.imageCaption}</figcaption></figure>
      <div className="ma-world__reading">
        <div className="ma-world__tabs" role="tablist" aria-label={`Drie ingangen in de wereld van ${album.title}`}>
          {story.feelings.map((feeling, index) => <button type="button" role="tab" key={feeling.label} id={`${id}-tab-${index}`} aria-selected={selected === index} aria-controls={`${id}-panel-${index}`} tabIndex={selected === index ? 0 : -1} ref={(element) => { buttons.current[index] = element; }} onClick={() => setSelected(index)} onKeyDown={(event) => onKeyDown(event, index)}><span aria-hidden="true">0{index + 1}</span>{feeling.label}</button>)}
        </div>
        {story.feelings.map((feeling, index) => <div key={feeling.label} role="tabpanel" id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`} hidden={selected !== index} tabIndex={0} className="ma-world__panel">
          <div className={`ma-world__motif ma-world__motif--${index + 1}`} aria-hidden="true"><span /><span /><AlbumSignal /></div>
          <h3>{feeling.title}</h3><p>{feeling.text}</p>
        </div>)}
        <p className="ma-world__aside">Een beeld geeft iets mee. De betekenis mag open blijven.</p>
      </div>
    </div>
  </section>;
}

export function AlbumCompanion({ album }: { album: MusicAlbumData }) {
  const other = albums.find((item) => item.slug !== album.slug);
  if (!other) return null;
  return <section className="ma-companion" aria-labelledby="ma-companion-title">
    <div className="ma-companion__intro"><p className="ma-eyebrow">Jowikroon / Twee albums</p><h2 id="ma-companion-title">Een eigen wereld.<br />Een gedeeld signaal.</h2><AlbumSignal /></div>
    <Link to={albumPath(other.slug)} className={`ma-companion__link ma-theme--${other.theme}`}>
      <img src={other.cover} width={1254} height={1254} alt={`Albumcover ${other.title}`} loading="lazy" decoding="async" />
      <div><span className="ma-eyebrow">Ontdek ook</span><h3>{other.title}</h3>{other.subtitle && <span className="ma-companion__subtitle">{other.subtitle}</span>}<p>{albumEditorial[album.slug].companion}</p><span className="ma-companion__action">Ontdek het album <span aria-hidden="true">↗</span></span></div>
    </Link>
  </section>;
}
