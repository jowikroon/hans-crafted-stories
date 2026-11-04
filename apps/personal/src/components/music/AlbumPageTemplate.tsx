import { useContext, useEffect, useRef, type ReactNode } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { Link } from "@/components/LocalizedLink";
import { albums, albumPath, type MusicAlbumData } from "@/data/albums";
import { albumBrandPath } from "@/data/albumEditorial";
import { ensureFontCss, FONT_CSS } from "@/lib/fontCss";
import { AlbumNavigationTypeContext } from "./albumNavigation";
import "@/styles/music-albums.css";
import "@/styles/music-album-world.css";

/** Shared fan-facing shell. Artwork retains its own typography. */
export default function AlbumPageTemplate({ album, section = "album", children }: { album: MusicAlbumData; section?: "album" | "brand"; children: ReactNode }) {
  const { pathname, hash } = useLocation();
  const routeNavigationType = useNavigationType();
  const navigationType = useContext(AlbumNavigationTypeContext) ?? routeNavigationType;
  const previousPath = useRef<string>();
  useEffect(() => { ensureFontCss("fonts-albums", FONT_CSS.writing); }, []);
  useEffect(() => {
    // Native anchors already scroll. A song dialog can clear the hash while
    // changing its query string; it must keep this album's reading position.
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    const target = hash && document.getElementById(hash.slice(1));
    if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
    else if (navigationType !== "POP") window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash, navigationType]);
  return <article className={`ma-page ma-page--editorial ma-theme--${album.theme}`} lang="nl">
    <div className="ma-page__inner">
      <nav className="ma-breadcrumb" aria-label="Broodkruimel"><Link to="/music">Muziek</Link><span aria-hidden="true">/</span>{section === "brand" ? <><Link to={albumPath(album.slug)}>{album.title}</Link><span aria-hidden="true">/</span><span>Het verhaal</span></> : <span>{album.title}</span>}</nav>
      <div className="ma-page-nav">
        <nav className="ma-album-nav" aria-label="Albums">{albums.map((item) => <Link key={item.slug} to={section === "brand" ? albumBrandPath(item.slug) : albumPath(item.slug)} aria-current={item.slug === album.slug ? "page" : undefined}>{item.title}<span aria-hidden="true">{item.slug === album.slug ? "●" : "↗"}</span></Link>)}</nav>
        <nav className="ma-chapters" aria-label={`Ontdek ${album.title}`}><Link to={albumPath(album.slug)} aria-current={section === "album" ? "page" : undefined}>Het album</Link><Link to={albumBrandPath(album.slug)} aria-current={section === "brand" ? "page" : undefined}>Het verhaal</Link><a href="#album-world">De beelden <span aria-hidden="true">↓</span></a></nav>
      </div>
      {children}
      <footer className="ma-album-footer"><p>JOWIKROON<span>Er blijft altijd iets te ontdekken.</span></p><div className="ma-footer-links"><Link to={section === "brand" ? albumPath(album.slug) : albumBrandPath(album.slug)} className="ma-text-link">{section === "brand" ? "Naar het album" : "Het verhaal"}<span aria-hidden="true">↗</span></Link><Link to="/music" className="ma-text-link">Alle muziek <span aria-hidden="true">↗</span></Link></div></footer>
    </div>
  </article>;
}
