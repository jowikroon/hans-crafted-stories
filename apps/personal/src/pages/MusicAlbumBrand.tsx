import { useParams } from "react-router-dom";
import { Link } from "@/components/LocalizedLink";
import { getAlbum, albumPath, albumTitle, type MusicAlbumData } from "@/data/albums";
import { albumEditorial, albumBrandPath, albumBrandTitle, albumBrandDescription, albumBrandJsonLd } from "@/data/albumEditorial";
import AlbumPageTemplate from "@/components/music/AlbumPageTemplate";
import { AlbumJourney } from "@/components/music/AlbumEditorialSections";
import AlbumWorld, { AlbumCompanion, AlbumSignal } from "@/components/music/AlbumWorld";
import { useSEO } from "@/hooks/useSEO";
import NotFound from "@/pages/NotFound";
import { useAlbumPrivateDetails } from "@/hooks/useAlbumPrivateDetails";
import AlbumOwnerPanel from "@/components/music/AlbumOwnerPanel";
import AlbumVisualStory from "@/components/music/AlbumVisualStory";
import IetsMooisNarrative from "@/components/music/IetsMooisNarrative";
import NeonNarrative from "@/components/music/NeonNarrative";

function BrandContent({ album }: { album: MusicAlbumData }) {
  const privateAccess = useAlbumPrivateDetails(album.slug);
  const story = albumEditorial[album.slug];
  const hasVisualStory = album.slug === "iets-moois";
  useSEO({ title: albumBrandTitle(album), description: albumBrandDescription(album), url: `https://hansvanleeuwen.com${albumBrandPath(album.slug)}`, lang: "nl", image: `https://hansvanleeuwen.com${album.backCover}`, imageAlt: `De wereld van ${albumTitle(album)}, Jowikroon`, jsonLd: albumBrandJsonLd(album) });
  return <AlbumPageTemplate album={album} section="brand">
    {hasVisualStory ? <AlbumVisualStory>{(openArtwork) => <IetsMooisNarrative onOpenArtwork={openArtwork} />}</AlbumVisualStory> : <>
      {album.slug === "neon-the-signal-between" ? <NeonNarrative /> : <>
      <header className="ma-story-hero"><p className="ma-eyebrow">Het verhaal / {album.title}</p><h1>{story.heading}</h1><div className="ma-story-hero__bottom"><AlbumSignal /><p>{story.lead}</p><a href="#album-origin" className="ma-text-link">Lees het verhaal <span aria-hidden="true">↓</span></a></div></header>
      <section className="ma-origin" id="album-origin" aria-labelledby="ma-origin-title"><div><p className="ma-eyebrow">Een zin om mee te nemen</p><h2 id="ma-origin-title">Eén belofte.<br />Een eigen stem.</h2></div><div>{story.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>
      </>}
      <AlbumWorld key={album.slug} album={album} />
      <AlbumJourney album={album} />
    </>}
    <section className="ma-brand-closing" aria-label={hasVisualStory ? "Verder ontdekken" : "Verder luisteren"}>{!hasVisualStory && <p lang={album.theme === "neon" ? "en" : "nl"}>{story.closing}</p>}<Link className="ma-button ma-button--light" to={`${albumPath(album.slug)}${album.slug === "iets-moois" || album.publicTracks.length ? "#album-tracks" : ""}`}>{album.slug === "iets-moois" ? "Luister naar IETS MOOIS" : album.publicTracks.length ? "Luister naar NEON" : "Naar IETS MOOIS"} <span aria-hidden="true">↗</span></Link></section>
    <AlbumCompanion album={album} />
    <AlbumOwnerPanel access={privateAccess} />
  </AlbumPageTemplate>;
}

export default function MusicAlbumBrand() {
  const { albumSlug } = useParams<{ albumSlug: string }>();
  const album = getAlbum(albumSlug);
  return album && albumEditorial[album.slug] ? <BrandContent key={album.slug} album={album} /> : <NotFound />;
}
