import { useEffect, type ReactNode } from "react";
import { Link } from "@/components/LocalizedLink";
import { albums, albumPath, type MusicAlbumData } from "@/data/albums";
import { albumBrandPath } from "@/data/albumEditorial";
import { ensureFontCss, FONT_CSS } from "@/lib/fontCss";
import "@/styles/music-albums.css";

/** Shared dark shell for every album and its public brand story. */
export default function AlbumPageTemplate({ album, section = "album", children }: { album: MusicAlbumData; section?: "album" | "brand"; children: ReactNode }) {
  useEffect(() => { ensureFontCss("fonts-albums", FONT_CSS.writing); }, []);
  return <article className={`ma-page ma-theme--${album.theme}`} lang="nl">
    <div className="ma-page__inner">
      <nav className="ma-breadcrumb" aria-label="Broodkruimel"><Link to="/music">Music</Link><span aria-hidden="true">/</span>{section === "brand" ? <><Link to={albumPath(album.slug)}>{album.title}</Link><span aria-hidden="true">/</span><span>Het verhaal</span></> : <span>{album.title}</span>}</nav>
      <nav className="ma-album-nav" aria-label="Albums">{albums.map((item) => <Link key={item.slug} to={section === "brand" ? albumBrandPath(item.slug) : albumPath(item.slug)} aria-current={item.slug === album.slug ? "page" : undefined}>{item.title}<span aria-hidden="true">{item.slug === album.slug ? "●" : "↗"}</span></Link>)}</nav>
      <nav className="ma-chapters" aria-label={`Ontdek ${album.title}`}><Link to={albumPath(album.slug)} aria-current={section === "album" ? "page" : undefined}>Het album</Link><Link to={albumBrandPath(album.slug)} aria-current={section === "brand" ? "page" : undefined}>Het verhaal</Link><a href={section === "brand" ? "#album-process" : "#album-process-preview"}>Het maakproces <span aria-hidden="true">↓</span></a></nav>
      {children}
      <footer className="ma-album-footer"><p>Jowikroon<span>Een eigen wereld. Een gedeeld signaal.</span></p><div className="ma-footer-links"><Link to={section === "brand" ? albumPath(album.slug) : albumBrandPath(album.slug)} className="ma-text-link">{section === "brand" ? "Naar het album" : "Het verhaal"}<span aria-hidden="true">↗</span></Link><Link to="/music" className="ma-text-link">Alle muziek <span aria-hidden="true">↗</span></Link></div></footer>
    </div>
  </article>;
}
