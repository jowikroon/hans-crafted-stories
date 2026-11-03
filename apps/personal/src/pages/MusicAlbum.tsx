import { useState } from "react";
import { useParams } from "react-router-dom";
import MusicExperience, { PlaySongButton, SongPageButton, SongPlayerSlot, useMusicExperience } from "@/components/music/MusicExperience";
import { albumPath, albumTitle, albumSeoTitle, albumJsonLd, getAlbum, type MusicAlbumData } from "@/data/albums";
import { songs } from "@/data/music";
import { useAlbumPrivateDetails } from "@/hooks/useAlbumPrivateDetails";
import { useSEO } from "@/hooks/useSEO";
import AlbumPageTemplate from "@/components/music/AlbumPageTemplate";
import AlbumEditorialSections from "@/components/music/AlbumEditorialSections";
import { albumEditorial } from "@/data/albumEditorial";
import NotFound from "@/pages/NotFound";
import AlbumSleeve from "@/components/music/AlbumSleeve";
import "@/styles/music-albums.css";

function AlbumContent({ album }: { album: MusicAlbumData }) {
  const { isOwner, loading, error, details } = useAlbumPrivateDetails(album.slug);
  const { openSong } = useMusicExperience();
  const [sleeveOpen, setSleeveOpen] = useState(false);
  const canonical = `https://hansvanleeuwen.com${albumPath(album.slug)}`;
  const albumName = albumTitle(album);
  const publicTracks = album.publicTracks.flatMap(({ position, songSlug }) => {
    const song = songs.find((item) => item.slug === songSlug);
    return song ? [{ position, song }] : [];
  });

  // This metadata is deliberately independent of the private owner response.
  useSEO({
    title: albumSeoTitle(album),
    description: album.description,
    url: canonical,
    lang: "nl",
    type: "music.album",
    image: `https://hansvanleeuwen.com${album.cover}`,
    imageAlt: `Albumcover ${albumName}, Jowikroon`,
    jsonLd: albumJsonLd(album),
  });

  return (
    <AlbumPageTemplate album={album}>
        <header className="ma-album-hero">
          <figure className="ma-album-hero__art"><AlbumSleeve album={album} open={sleeveOpen} onToggle={() => setSleeveOpen((current) => !current)} onAlbumPage /><figcaption>JOWIKROON / {album.releaseYear} · Klik op de hoes om ’m om te draaien.</figcaption></figure>
          <div className="ma-album-hero__copy">
            <p className="ma-eyebrow">Jowikroon / {album.theme === "neon" ? "Electronic" : "Nederlandstalig"}</p>
            <h1>{album.title}</h1>
            {album.subtitle && <p className="ma-album-hero__subtitle">{album.subtitle}</p>}
            <div className="ma-signal-rule" aria-hidden="true" />
            <p className="ma-album-hero__description">{albumEditorial[album.slug].intro}</p>
            <p className="ma-coming">COMING {album.releaseYear}</p>
            {publicTracks.length > 0 && <p className="ma-available">{publicTracks.length} releases kun je nu luisteren.</p>}
            <a href="#album-tracks" className="ma-button">{publicTracks.length ? "Luister de eerste releases" : "Bekijk de tracklist"}<span aria-hidden="true">↓</span></a>
          </div>
        </header>

        <section className="ma-track-section" id="album-tracks" aria-labelledby="ma-tracks-title">
          <div className="ma-section-heading"><div><p className="ma-eyebrow">Het album</p><h2 id="ma-tracks-title">{album.theme === "neon" ? "Het signaal krijgt vorm." : "Er groeit iets moois."}</h2></div><span className="ma-section-heading__count">{String(album.trackCount).padStart(2, "0")} tracks in wording</span></div>
          <ol className="ma-tracklist">
            {Array.from({ length: album.trackCount }, (_, index) => {
              const position = index + 1;
              const released = publicTracks.find((track) => track.position === position);
              const privateTrack = isOwner && details ? details.tracks.find((track) => track.position === position) : undefined;
              if (released) {
                const { song } = released;
                const placement = `album-${song.slug}`;
                return (
                  <li className="ma-track ma-track--released" key={position}>
                    <span className="ma-track__number">{String(position).padStart(2, "0")}</span>
                    <PlaySongButton slug={song.slug} placement={placement} className="ma-track__play" iconOnly />
                    <div className="ma-track__copy"><button type="button" aria-haspopup="dialog" onClick={(event) => openSong(song.slug, event.currentTarget)}>{song.title}</button><span>Uitgebracht · Jowikroon</span></div>
                    <span className="ma-track__duration">{song.duration}</span>
                    <SongPageButton slug={song.slug} className="ma-track__link" />
                    <SongPlayerSlot placement={placement} />
                  </li>
                );
              }
              return (
                <li key={position} className={`ma-track ma-track--unreleased${privateTrack ? " ma-track--owner" : ""}`}>
                  <span className="ma-track__number">{String(position).padStart(2, "0")}</span>
                  <span className="ma-track__locked" aria-hidden="true">·</span>
                  <div className="ma-track__copy">{privateTrack ? <><strong>{privateTrack.title}</strong>{privateTrack.note && <span>{privateTrack.note}</span>}</> : <span className="ma-blur-mark" aria-hidden="true" />}</div>
                  <span className="ma-track__coming">{privateTrack ? "Alleen voor jou" : `COMING ${album.releaseYear}`}</span>
                </li>
              );
            })}
          </ol>
          <p className="ma-track-note">{album.theme === "neon" ? "Beat Drop en Neon House of Glass zijn beschikbaar. De overige nummers verschijnen hier wanneer ze klaar zijn om te delen." : "De nummers blijven nog even achter de schermen. Hier verschijnt straks de muziek."}</p>
        </section>

        <AlbumEditorialSections album={album} />

        {isOwner && (
          <section className="ma-private" aria-labelledby="ma-private-title">
            <div className="ma-section-heading"><div><p className="ma-eyebrow">Jouw albumruimte · privé</p><h2 id="ma-private-title">Het verhaal achter de plaat.</h2></div><span className="ma-owner-label">Alleen voor jou</span></div>
            <div aria-live="polite">{loading ? <p>Je privédetails worden geladen…</p> : !details || error ? <p>Privédetails nog niet gekoppeld.</p> : <><p className="ma-private__story">{details.story}</p><details className="ma-guide"><summary>Open de brandguide <span aria-hidden="true">+</span></summary><div className="ma-guide__content">{details.brandGuide}</div></details></>}</div>
          </section>
        )}

    </AlbumPageTemplate>
  );
}

export default function MusicAlbum() {
  const { albumSlug } = useParams<{ albumSlug: string }>();
  const album = getAlbum(albumSlug ?? "");
  return album ? <MusicExperience key={album.slug}><AlbumContent album={album} /></MusicExperience> : <NotFound />;
}
