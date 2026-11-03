import { useEffect, useState } from "react";
import { albums } from "@/data/albums";
import { ensureFontCss, FONT_CSS } from "@/lib/fontCss";
import AlbumSleeve from "@/components/music/AlbumSleeve";
import "@/styles/music-albums.css";

export default function AlbumShowcase() {
  const [openAlbum, setOpenAlbum] = useState<string | null>(null);
  useEffect(() => { ensureFontCss("fonts-albums", FONT_CSS.writing); }, []);
  return (
    <section className="ma-showcase" lang="nl" aria-labelledby="ma-albums-heading">
      <div className="ma-showcase__intro">
        <p className="ma-eyebrow">Jowikroon / Albums</p>
        <h2 id="ma-albums-heading">Twee albums. <span>Eén verlangen naar connectie.</span></h2>
        <p>Pak een hoes. Draai ’m om. Ontdek wat erachter zit.</p>
      </div>
      <div className="ma-album-grid">
        {albums.map((album) => <AlbumSleeve key={album.slug} album={album} open={openAlbum === album.slug} onToggle={() => setOpenAlbum((current) => current === album.slug ? null : album.slug)} />)}
      </div>
    </section>
  );
}
