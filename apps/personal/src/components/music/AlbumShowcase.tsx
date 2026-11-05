import { useEffect, useState } from "react";
import { albums, albumPath } from "@/data/albums";
import { Link } from "@/components/LocalizedLink";
import { ensureFontCss, FONT_CSS } from "@/lib/fontCss";
import AlbumSleeve from "@/components/music/AlbumSleeve";
import "@/styles/music-albums.css";

export default function AlbumShowcase() {
  const [openAlbum, setOpenAlbum] = useState<string | null>(null);
  useEffect(() => { ensureFontCss("fonts-albums", FONT_CSS.writing); }, []);
  return (
    <section id="albums" className="ma-showcase" lang="nl" aria-labelledby="ma-albums-heading">
      <div className="ma-showcase__intro">
        <p className="ma-eyebrow">Jowikroon / Albums</p>
        <h1 id="ma-albums-heading">Twee albums. <span>Eén verlangen naar connectie.</span></h1>
        <p>Pak een hoes. Draai ’m om. Ontdek wat erachter zit.</p>
        <nav className="ma-showcase__paths" aria-label="Direct naar albums en nummers">
          {albums.map((album) => (
            <Link key={album.slug} to={albumPath(album.slug)} className="ma-showcase__path">
              <span>{album.subtitle ? `${album.title}: ${album.subtitle}` : album.title}</span>
              <small>{album.publicTracks.length ? `${album.publicTracks.length} openbare singles` : "In ontwikkeling"}</small>
            </Link>
          ))}
          <a href="#songs" className="ma-showcase__path">
            <span>Alle nummers</span><small>Spotify + SoundCloud ↓</small>
          </a>
        </nav>
      </div>
      <div className="ma-album-grid">
        {albums.map((album) => <AlbumSleeve key={album.slug} album={album} open={openAlbum === album.slug} onToggle={() => setOpenAlbum((current) => current === album.slug ? null : album.slug)} />)}
      </div>
    </section>
  );
}
