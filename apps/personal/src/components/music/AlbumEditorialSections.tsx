import { Link } from "@/components/LocalizedLink";
import { type MusicAlbumData } from "@/data/albums";
import { albumBrandPath, albumEditorial } from "@/data/albumEditorial";
import { AlbumSignal } from "./AlbumWorld";
import AlbumStoryTrail from "./AlbumStoryTrail";

export function AlbumJourney({ album }: { album: MusicAlbumData }) {
  const story = albumEditorial[album.slug];
  if (story.trail) return <AlbumStoryTrail steps={story.trail} />;
  return <section className="ma-journey" id="album-journey" aria-labelledby="ma-journey-title">
    <div className="ma-section-heading"><div><p className="ma-eyebrow">Onder de woorden</p><h2 id="ma-journey-title">{album.theme === "warm" ? "Wat je meeneemt." : "Een nacht in beweging."}</h2></div><p className="ma-section-heading__aside">Drie bewegingen door het verhaal.</p></div>
    <ol className="ma-journey__grid">{story.journey.map((step, index) => <li key={step.title}><span className="ma-journey__number" aria-hidden="true">0{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
  </section>;
}

export default function AlbumEditorialSections({ album }: { album: MusicAlbumData }) {
  const story = albumEditorial[album.slug];
  return <section className="ma-manifesto" id="album-story" aria-labelledby="ma-manifesto-title">
    <div className="ma-manifesto__meta"><span className="ma-eyebrow">De belofte</span><AlbumSignal /></div>
    <div><h2 id="ma-manifesto-title" lang={album.theme === "neon" ? "en" : "nl"}>{story.signature.map((line, index) => <span key={line}>{index > 0 && " "}{line}</span>)}</h2><div className="ma-manifesto__bottom"><p>{story.essence}</p><Link to={albumBrandPath(album.slug)} className="ma-text-link">Het verhaal achter {album.title} <span aria-hidden="true">↗</span></Link></div></div>
  </section>;
}
