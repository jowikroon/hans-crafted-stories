import { Link } from "@/components/LocalizedLink";
import { type MusicAlbumData } from "@/data/albums";
import { albumBrandPath, albumEditorial } from "@/data/albumEditorial";

export function AlbumProcess({ album, preview = false }: { album: MusicAlbumData; preview?: boolean }) {
  const story = albumEditorial[album.slug];
  return <section className="ma-process" id={preview ? "album-process-preview" : "album-process"} aria-labelledby="ma-process-title">
    <div className="ma-section-heading"><div><p className="ma-eyebrow">In wording / Het maakproces</p><h2 id="ma-process-title">Van gevoel naar een plaat.</h2></div><span className="ma-section-heading__count">Waar ik aan werk</span></div>
    <ol className="ma-process-grid">{story.process.map((step, index) => <li key={step.title}><span className="ma-process-number">0{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
  </section>;
}

export default function AlbumEditorialSections({ album }: { album: MusicAlbumData }) {
  const story = albumEditorial[album.slug];
  return <>
    <section className="ma-essence" aria-labelledby="ma-essence-title"><div><p className="ma-eyebrow">Achter de muziek</p><h2 id="ma-essence-title">{story.heading}</h2></div><div><p className="ma-essence-copy">{story.essence}</p><Link to={albumBrandPath(album.slug)} className="ma-text-link">Ontdek het verhaal en de beelden <span aria-hidden="true">↗</span></Link></div></section>
    <AlbumProcess album={album} preview />
  </>;
}
