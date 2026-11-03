import { useParams } from "react-router-dom";
import { Link } from "@/components/LocalizedLink";
import { getAlbum, albumPath, albumTitle, type MusicAlbumData } from "@/data/albums";
import { albumEditorial, albumBrandPath, albumBrandTitle, albumBrandDescription, albumBrandJsonLd } from "@/data/albumEditorial";
import AlbumPageTemplate from "@/components/music/AlbumPageTemplate";
import { AlbumProcess } from "@/components/music/AlbumEditorialSections";
import { useSEO } from "@/hooks/useSEO";
import NotFound from "@/pages/NotFound";

function BrandContent({ album }: { album: MusicAlbumData }) {
  const story = albumEditorial[album.slug];
  useSEO({ title: albumBrandTitle(album), description: albumBrandDescription(album), url: `https://hansvanleeuwen.com${albumBrandPath(album.slug)}`, lang: "nl", image: `https://hansvanleeuwen.com${album.backCover}`, imageAlt: `De wereld van ${albumTitle(album)}, Jowikroon`, jsonLd: albumBrandJsonLd(album) });
  return <AlbumPageTemplate album={album} section="brand">
    <header className="ma-brand-hero"><div><p className="ma-eyebrow">De wereld van {album.title}</p><h1>{story.heading}</h1><p className="ma-brand-lead">{story.lead}</p><a href="#album-origin" className="ma-text-link">Lees verder <span aria-hidden="true">↓</span></a></div><figure><img src={album.backCover} width={1254} height={1254} alt={album.theme === "neon" ? "Jowikroon in de schaduw, een kleine paarse vonk bij zijn hand" : "Jowikroon kijkt naar beneden met zijn bril in de hand, tegen een diep groene achtergrond"} {...{ fetchpriority: "high" }} /><figcaption>{story.imageCaption}</figcaption></figure></header>
    <section className="ma-origin" id="album-origin" aria-labelledby="ma-origin-title"><div><p className="ma-eyebrow">De oorsprong</p><h2 id="ma-origin-title">Eén belofte.<br />Een eigen stem.</h2></div><div>{story.paragraphs.map((p) => <p key={p}>{p}</p>)}</div></section>
    <section className="ma-brand-feelings" aria-labelledby="ma-feelings-title"><div className="ma-section-heading"><div><p className="ma-eyebrow">Wat het beeld vertelt</p><h2 id="ma-feelings-title">Een wereld die je kunt voelen.</h2></div></div><div className="ma-feelings-grid">{story.feelings.map((feeling, index) => <article key={feeling.title}><span className={`ma-feeling-light ma-feeling-light--${index + 1}`} aria-hidden="true" /><h3>{feeling.title}</h3><p>{feeling.text}</p></article>)}</div></section>
    <AlbumProcess album={album} />
    <section className="ma-brand-closing" aria-label="Terug naar de muziek"><p>{story.closing}</p><Link className="ma-button" to={albumPath(album.slug)}>Ontdek {album.title} <span aria-hidden="true">↗</span></Link></section>
  </AlbumPageTemplate>;
}

export default function MusicAlbumBrand() {
  const { albumSlug } = useParams<{ albumSlug: string }>();
  const album = getAlbum(albumSlug);
  return album && albumEditorial[album.slug] ? <BrandContent key={album.slug} album={album} /> : <NotFound />;
}
