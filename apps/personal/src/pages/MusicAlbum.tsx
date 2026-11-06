import { useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "@/components/LocalizedLink";
import MusicExperience, { PlaySongButton, SongPageButton, SongPlayerSlot, useMusicExperience } from "@/components/music/MusicExperience";
import { albumPath, albumTitle, albumSeoTitle, albumJsonLd, getAlbum, type MusicAlbumData } from "@/data/albums";
import { albumBrandPath, albumEditorial } from "@/data/albumEditorial";
import { songs } from "@/data/music";
import { useAlbumPrivateDetails } from "@/hooks/useAlbumPrivateDetails";
import { useSEO } from "@/hooks/useSEO";
import AlbumPageTemplate from "@/components/music/AlbumPageTemplate";
import AlbumEditorialSections, { AlbumJourney } from "@/components/music/AlbumEditorialSections";
import AlbumWorld, { AlbumCompanion, AlbumSignal } from "@/components/music/AlbumWorld";
import AlbumOwnerPanel from "@/components/music/AlbumOwnerPanel";
import AlbumSleeve from "@/components/music/AlbumSleeve";
import IetsMooisPreviews from "@/components/music/IetsMooisPreviews";
import NotFound from "@/pages/NotFound";

function AlbumContent({ album }: { album: MusicAlbumData }) {
  const privateAccess = useAlbumPrivateDetails(album.slug);
  const { isOwner, details } = privateAccess;
  const { openSong } = useMusicExperience();
  const [sleeveOpen, setSleeveOpen] = useState(false);
  const story = albumEditorial[album.slug];
  const isIetsMoois = album.slug === "iets-moois";
  const publicTracks = album.publicTracks.flatMap(({ position, songSlug }) => {
    const song = songs.find((item) => item.slug === songSlug);
    return song ? [{ position, song }] : [];
  });

  // Public metadata never depends on the authorized owner's private response.
  useSEO({
    title: albumSeoTitle(album), description: album.description,
    url: `https://hansvanleeuwen.com${albumPath(album.slug)}`, lang: "nl", type: "music.album",
    image: `https://hansvanleeuwen.com${album.cover}`, imageAlt: `Albumcover ${albumTitle(album)}, Jowikroon`,
    jsonLd: albumJsonLd(album),
  });

  const showPrivateTracks = isOwner && details !== null;
  const hasListening = isIetsMoois || publicTracks.length > 0;
  const positions = showPrivateTracks
    ? Array.from({ length: album.trackCount }, (_, index) => index + 1)
    : publicTracks.map(({ position }) => position);

  const listening = isIetsMoois
    ? <IetsMooisPreviews totalTracks={album.trackCount} ownerTracks={showPrivateTracks ? details.tracks : undefined} />
    : <section className={`ma-track-section${publicTracks.length ? "" : " ma-track-section--awaiting"}`} id="album-tracks" aria-labelledby="ma-tracks-title">
    <div className="ma-section-heading"><div><p className="ma-eyebrow">{publicTracks.length ? "Luister alvast" : "De muziek"}</p><h2 id="ma-tracks-title">{publicTracks.length ? "Het begint met luisteren." : "De muziek krijgt haar moment."}</h2></div>{publicTracks.length > 0 && <span className="ma-section-heading__count">{publicTracks.length} uitgebrachte singles</span>}</div>
    {positions.length > 0 ? <ol className="ma-tracklist">
      {positions.map((position) => {
        const released = publicTracks.find((track) => track.position === position);
        const privateTrack = showPrivateTracks ? details?.tracks.find((track) => track.position === position) : undefined;
        if (released) {
          const { song } = released;
          const placement = `album-${song.slug}`;
          return <li className="ma-track ma-track--released" key={position}>
            <span className="ma-track__number">{String(position).padStart(2, "0")}</span>
            <PlaySongButton slug={song.slug} placement={placement} className="ma-track__play" iconOnly />
            <div className="ma-track__copy"><button type="button" aria-haspopup="dialog" onClick={(event) => openSong(song.slug, event.currentTarget)}>{song.title}</button><span>Uitgebracht · Jowikroon</span></div>
            <span className="ma-track__duration">{song.duration}</span><SongPageButton slug={song.slug} className="ma-track__link" /><SongPlayerSlot placement={placement} />
          </li>;
        }
        if (!privateTrack) return null;
        return <li key={position} className="ma-track ma-track--unreleased ma-track--owner"><span className="ma-track__number">{String(position).padStart(2, "0")}</span><span className="ma-track__locked" aria-hidden="true">·</span><div className="ma-track__copy"><strong>{privateTrack.title}</strong>{privateTrack.note && <span>{privateTrack.note}</span>}</div><span className="ma-track__coming">Alleen voor jou</span></li>;
      })}
    </ol> : <div className="ma-arrival">{story.listeningNote && <p className="ma-arrival__invitation">{story.listeningNote}</p>}<p>IETS MOOIS is in wording. De eerste releases krijgen hier hun plek. Luister intussen naar de uitgebrachte muziek van Jowikroon.</p><Link to="/music" className="ma-button ma-button--light">Luister naar Jowikroon <span aria-hidden="true">↗</span></Link></div>}
    {publicTracks.length > 0 && <p className="ma-track-note">Een eerste kennismaking met NEON. De overige nummers verschijnen wanneer ze klaar zijn om te delen.</p>}
  </section>;

  return <AlbumPageTemplate album={album}>
    <header className="ma-album-hero ma-album-hero--editorial">
      <div className="ma-album-hero__title"><p className="ma-eyebrow">Jowikroon <span aria-hidden="true">/</span> {album.theme === "warm" ? "Het tweede album" : "Het eerste album"}</p><h1 aria-label={album.title}>{album.theme === "warm" ? <><span>IETS </span><span>MOOIS</span></> : album.title}</h1>{album.subtitle && <p className="ma-album-hero__subtitle" lang="en">{album.subtitle}</p>}</div>
      <figure className="ma-album-hero__art"><AlbumSleeve album={album} open={sleeveOpen} onToggle={() => setSleeveOpen((current) => !current)} onAlbumPage /><figcaption><span>{album.theme === "warm" ? "Een eigen taal. Een eigen wereld." : "The Signal Between"}</span><span>Draai de hoes om ↻</span></figcaption></figure>
      <div className="ma-album-hero__copy">
        <AlbumSignal /><p className="ma-album-hero__description">{story.intro}</p>
        <p className="ma-release-status"><span className="ma-release-status__dot" aria-hidden="true" />Album in wording<span className="ma-release-status__year">VERWACHT {album.releaseYear}</span></p>
        <div className="ma-hero-actions"><a href={hasListening ? "#album-tracks" : "#album-spoor"} className="ma-button ma-button--light">{isIetsMoois ? "Luister de eerste vier" : publicTracks.length ? "Luister de eerste releases" : "Volg het spoor"}<span aria-hidden="true">↓</span></a>{story.trail ? <a href="#album-tracks" className="ma-hero-story">De muziek <span aria-hidden="true">↓</span></a> : <Link to={albumBrandPath(album.slug)} className="ma-hero-story">Het verhaal <span aria-hidden="true">↗</span></Link>}</div>
      </div>
    </header>
    {story.trail && <nav className="ma-album-index" aria-label="Op deze albumpagina"><span className="ma-eyebrow">Neem de tijd</span><a href="#album-story">De belofte</a><a href="#album-spoor">Het spoor</a><a href="#album-world">De beelden</a><a href="#album-tracks">De muziek <span aria-hidden="true">↓</span></a></nav>}
    {hasListening && listening}
    <AlbumEditorialSections album={album} />
    {story.trail && <AlbumJourney album={album} />}
    <AlbumWorld key={album.slug} album={album} />
    {!story.trail && <AlbumJourney album={album} />}
    {!hasListening && listening}
    <AlbumCompanion album={album} />
    <AlbumOwnerPanel access={privateAccess} />
  </AlbumPageTemplate>;
}

export default function MusicAlbum() {
  const { albumSlug } = useParams<{ albumSlug: string }>();
  const album = getAlbum(albumSlug ?? "");
  return album ? <MusicExperience key={album.slug}><AlbumContent album={album} /></MusicExperience> : <NotFound />;
}
