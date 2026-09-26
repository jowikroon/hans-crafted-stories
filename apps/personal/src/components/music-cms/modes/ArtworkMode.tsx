import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, Play, Images, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { listArtwork, previewUrls, downloadArtwork, playbackUrl } from "../lib/artworkStore";
import { artworkVersions, changeArtworkCategory, collectionLabel, dimensions, durationLabel, EMPTY_FILTERS, filterArtwork, groupArtwork, type ArtworkAsset, type ArtworkFilters } from "../lib/artworkModel";
import "../artwork.css";

const PAGE_SIZE = 36;
const CATEGORIES = ["Video", "Album", "Song", "Social", "Profile", "Banner", "Brand element", "Studio"];
const FILTER_LABELS: Record<keyof ArtworkFilters, string> = { search: "Zoekterm", category: "Categorie", channel: "Kanaal", album: "Album", song: "Song", collection: "Collectie", edition: "Selectie", media: "Media", role: "Gebruik" };

function VideoPreview({ asset, poster, userId }: { asset: ArtworkAsset; poster?: string; userId?: string }) {
  const [failed, setFailed] = useState(false);
  const video = useQuery({ queryKey: ["music-video", userId, asset.id, asset.playback_path], queryFn: () => playbackUrl(asset), enabled: !!userId, staleTime: 3_000_000, gcTime: 0, retry: 1 });
  if (video.isPending) return <p role="status">Video laden…</p>;
  if (video.isError || failed) return <div role="alert"><p>De videopreview kon niet worden afgespeeld.</p><button onClick={() => { setFailed(false); void video.refetch(); }}>Probeer opnieuw</button></div>;
  return <video controls playsInline preload="metadata" poster={poster} src={video.data} aria-label={asset.title} onError={() => setFailed(true)} />;
}

export default function ArtworkMode() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ArtworkFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [showFiles, setShowFiles] = useState(false);
  const [filterNotice, setFilterNotice] = useState("");
  const [selected, setSelected] = useState<ArtworkAsset | null>(null);
  const [downloadError, setDownloadError] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const query = useQuery({ queryKey: ["music-artwork", user?.id], queryFn: listArtwork, enabled: !!user, staleTime: 60_000, retry: false, gcTime: 0 });
  const assets = useMemo(() => query.data ?? [], [query.data]);
  const filtered = useMemo(() => filterArtwork(assets, filters), [assets, filters]);
  const displayed = useMemo(() => showFiles ? filtered : groupArtwork(filtered), [filtered, showFiles]);
  const visible = displayed.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const previewAssets = selected ? [...visible, selected] : visible;
  const previewKey = previewAssets.map(a => a.id).sort().join(",");
  const previews = useQuery({ queryKey: ["music-artwork-previews", user?.id, previewKey], queryFn: () => previewUrls(previewAssets), enabled: !!user && previewAssets.length > 0, staleTime: 600_000, refetchInterval: 600_000, gcTime: 0, retry: 1 });
  const options = useMemo(() => ({
    roles: [...new Set(assets.map(a => a.role))].sort(),
    albums: [...new Set(assets.map(a => a.album))].sort(),
    songs: [...new Set(assets.flatMap(a => a.song ? [a.song] : []))].sort(),
    channels: [...new Set(assets.flatMap(a => a.channels))].sort(),
    collections: [...new Set(assets.flatMap(a => a.collections))].sort(),
  }), [assets]);
  const versions = selected ? artworkVersions(assets, selected) : [];
  const update = (key: keyof ArtworkFilters, value: string) => {
    const next = key === "category" ? changeArtworkCategory(assets, filters, value) : { ...filters, [key]: value };
    const cleared = Object.keys(filters).some(k => k !== key && filters[k as keyof ArtworkFilters] && !next[k as keyof ArtworkFilters]);
    setFilterNotice(cleared ? "Eerdere filters pasten niet bij deze categorie en zijn gewist. Je ziet nu alle beelden in deze categorie." : "");
    setFilters(next); setPage(0);
  };
  const reset = () => { setFilters(EMPTY_FILTERS); setFilterNotice(""); setPage(0); };
  const resetWithinCategory = () => { setFilters({ ...EMPTY_FILTERS, category: filters.category }); setFilterNotice(""); setPage(0); };
  useEffect(() => { setSelected(null); setDownloadError(""); }, [user?.id]);
  const download = async () => {
    if (!selected) return;
    setDownloading(true); setDownloadProgress(0); setDownloadError("");
    try { await downloadArtwork(selected, setDownloadProgress); } catch (error) { setDownloadError(error instanceof Error ? error.message : "Download mislukt."); }
    finally { setDownloading(false); }
  };
  const image = (a: ArtworkAsset, large = false) => {
    const url = a.thumbnail_path && previews.data?.[a.thumbnail_path];
    return url ? <img src={url} alt={a.title} loading={large ? "eager" : "lazy"} decoding="async" /> : <div className="ma-image-placeholder"><Images size={32} /><span>{previews.isPending ? "Preview laden…" : a.format}</span></div>;
  };

  return <main className="ma-library">
    <header className="ma-header">
      <div><p className="ma-kicker">JOWIKROON / VISUAL ARCHIVE</p><h1>Het beeld achter<br /><em>de muziek.</em></h1><p className="ma-intro">Van het eerste idee tot de laatste versie. Beelden en films, één verhaal.</p></div>
      <div className="ma-header-side"><span className="ma-private"><ShieldCheck size={15} /> Privé beeldbank</span><strong>{assets.length || "—"}<small>bestanden in het archief</small></strong><svg className="ma-pulse" viewBox="0 0 200 45" aria-hidden="true"><path d="M0 24H38Q45 24 49 20T59 24H75L82 34L90 5L99 39L107 21Q112 13 118 24H200" /></svg></div>
    </header>
    <nav className="ma-tabs" aria-label="Soort beeld"><button aria-pressed={!filters.category} onClick={reset}>Alles <span>{assets.length}</span></button>{CATEGORIES.filter(c => assets.some(a => a.categories.includes(c))).map(c => <button key={c} aria-pressed={filters.category === c} onClick={() => update("category", c)}>{c} <span>{assets.filter(a => a.categories.includes(c)).length}</span></button>)}</nav>
    {filters.category === "Profile" && <p className="ma-filter-help">Profielfoto’s, portretmasters en brede profielheaders. Kies een kanaal voor bijvoorbeeld Instagram, WhatsApp of SoundCloud.</p>}
    {filters.category === "Video" && <p className="ma-filter-help">Campagnefilms, eerdere versies en bronclips. Kies Gebruik om exports of montagefragmenten te bekijken. Huidige collectie is de laatste werkversie, geen publicatiegoedkeuring.</p>}
    <section className="ma-filterbar" aria-label="Beeldbank filters">
      <label className="ma-search"><Search size={17} /><span className="sr-only">Zoek beelden</span><input type="search" placeholder="Zoek een song, beeld of versie…" value={filters.search} onChange={e => update("search", e.target.value)} /></label>
      <label>Media<select value={filters.media} onChange={e => update("media", e.target.value)}><option value="">Alle media</option><option value="image">Afbeeldingen</option><option value="video">Video’s</option></select></label>
      <label>Gebruik<select value={filters.role} onChange={e => update("role", e.target.value)}><option value="">Alle toepassingen</option>{options.roles.map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Album<select value={filters.album} onChange={e => update("album", e.target.value)}><option value="">Alle albums</option>{options.albums.map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Song<select value={filters.song} onChange={e => update("song", e.target.value)}><option value="">Alle songs</option>{options.songs.map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Kanaal<select value={filters.channel} onChange={e => update("channel", e.target.value)}><option value="">Alle kanalen</option>{options.channels.map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Collectie / versie<select value={filters.collection} onChange={e => update("collection", e.target.value)}><option value="">Alle collecties</option>{options.collections.map(v => <option key={v} value={v}>{collectionLabel(v)}</option>)}</select></label>
      <label>Selectie<select value={filters.edition} onChange={e => update("edition", e.target.value)}><option value="">Alle versies</option><option value="current">Huidige collectie</option><option value="archive">Eerdere versies & studies</option></select></label>
    </section>
    <div className="ma-active-filters" aria-label="Actieve filters">{(Object.keys(filters) as (keyof ArtworkFilters)[]).filter(k => k !== "category" && filters[k]).map(k => <button key={k} onClick={() => update(k, "")} aria-label={`Verwijder filter ${FILTER_LABELS[k]}: ${filters[k]}`}>{FILTER_LABELS[k]}: {k === "collection" ? collectionLabel(filters[k]) : k === "edition" ? filters[k] === "current" ? "Huidige collectie" : "Eerdere versies & studies" : filters[k]} <span aria-hidden="true">×</span></button>)}</div>
    {filterNotice && <p className="ma-filter-help" role="status">{filterNotice}</p>}
    <div className="ma-results"><p role="status">{filtered.length} bestanden · {groupArtwork(filtered).length} ontwerpen</p><div className="ma-view-options"><button aria-pressed={!showFiles} onClick={() => { setShowFiles(false); setPage(0); }}>Per ontwerp</button><button aria-pressed={showFiles} onClick={() => { setShowFiles(true); setPage(0); }}>Alle bestanden</button><button onClick={reset}><SlidersHorizontal size={14} /> Wis filters</button></div></div>
    {query.isPending && <p className="ma-message" role="status">Je beeldbank wordt geladen…</p>}
    {query.isError && <div className="ma-message" role="alert"><p>{query.error.message}</p><button onClick={() => query.refetch()}>Opnieuw laden</button></div>}
    {previews.isError && <div className="ma-message" role="alert">Previews konden niet worden geladen. <button onClick={() => previews.refetch()}>Probeer opnieuw</button></div>}
    {!query.isPending && !query.isError && !filtered.length && <div className="ma-message"><Images /><h2>Geen beelden met deze combinatie van filters.</h2><button onClick={resetWithinCategory}>Bekijk alle beelden{filters.category ? ` in ${filters.category}` : ""}</button></div>}
    <div className="ma-grid">{visible.map(a => <button className="ma-card" key={a.id} onClick={() => { setSelected(a); setDownloadError(""); }} aria-label={`${a.title}, ${a.format}, ${a.role}. Bekijk beeld en versies`}>
      <div className="ma-card-image">{image(a)}<span className="ma-format">{a.media_type === "video" && <Play size={12} />} {a.format}{a.media_type === "video" && ` · ${durationLabel(a.duration_seconds)}`}</span>{a.is_current && <span className="ma-current">Huidige collectie</span>}</div>
      <div className="ma-card-copy"><h2>{a.title}</h2><p>{a.role} <span>·</span> {dimensions(a)}</p><small>{artworkVersions(assets, a).length} versies & exports · {collectionLabel(a.collections[0])}</small></div>
    </button>)}</div>
    {displayed.length > PAGE_SIZE && <nav className="ma-pagination" aria-label="Beeldbank pagina’s"><button disabled={page === 0} onClick={() => setPage(p => p - 1)}>Vorige</button><span>Pagina {page + 1} / {Math.ceil(displayed.length / PAGE_SIZE)}</span><button disabled={(page + 1) * PAGE_SIZE >= displayed.length} onClick={() => setPage(p => p + 1)}>Volgende</button></nav>}
    <footer className="ma-footer">Originelen blijven ongewijzigd. Kanaallabels beschrijven het ontwerpdoel, niet een uploadcertificering. Identieke bestanden delen één download; elke herkomst blijft bewaard.</footer>
    <Dialog open={!!selected && !!user} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="ma-dialog">{selected && <>
      <div className={`ma-detail-image${selected.media_type === "video" ? " ma-detail-video" : ""}`}>{selected.media_type === "video" ? <VideoPreview key={selected.id} asset={selected} userId={user?.id} poster={selected.thumbnail_path ? previews.data?.[selected.thumbnail_path] : undefined} /> : image(selected, true)}</div><div className="ma-detail-copy">
        <p className="ma-kicker">{selected.album} / {selected.is_current ? "HUIDIGE COLLECTIE" : "ARCHIEF"}</p><DialogTitle>{selected.title}</DialogTitle><DialogDescription>{selected.role} · {selected.format} · {selected.media_type === "video" ? `${durationLabel(selected.duration_seconds)} · ` : ""} {dimensions(selected)} px · {(selected.bytes / 1048576).toFixed(1)} MB</DialogDescription>
        <div className="ma-tags">{[...selected.categories, ...selected.channels].map(t => <span key={t}>{t}</span>)}</div>
        <button className="ma-download" onClick={download} disabled={downloading}><ArrowDownToLine size={18} />{downloading ? `Download voorbereiden… ${downloadProgress ? `${downloadProgress}%` : ""}` : `Download origineel · ${selected.format}`}</button>
        {selected.media_type === "video" && <p className="ma-filter-help">Geoptimaliseerde afspeelkopie. Download origineel bewaart de oorspronkelijke kwaliteit en audio.</p>}
        {downloadError && <p role="alert">{downloadError}</p>}
        <h3>Versies & exports <span>{versions.length}</span></h3><div className="ma-versions">{versions.map(v => <button key={v.id} aria-pressed={v.id === selected.id} disabled={downloading} onClick={() => { setSelected(v); setDownloadError(""); }}><span>{collectionLabel(v.collections[0])}<small>{v.role} · {v.format} · {dimensions(v)}</small></span><span>{v.id === selected.id ? "●" : "↗"}</span></button>)}</div>
        <details className="ma-origins"><summary>Herkomst ({selected.origins.length})</summary>{selected.origins.map((o, i) => <p key={i}><strong>{collectionLabel(o.collection)}</strong><br />{o.file}</p>)}</details>
      </div></>}</DialogContent></Dialog>
  </main>;
}
