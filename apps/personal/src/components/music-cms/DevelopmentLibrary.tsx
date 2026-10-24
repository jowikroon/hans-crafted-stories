import { useMemo, useState } from "react";
import { Copy, ExternalLink, FileCode2, Search, X } from "lucide-react";
import { filterDevelopmentPages, groupDevelopmentPages, libraryIndexPath, pageDate, pageOrigin, safeHostedUrl, type DevelopmentPage } from "./lib/developmentLibrary";

const LABELS: Record<string, string> = {
  "Album and releases": "Album & releases", "Covers and branding": "Covers & branding", "Social and video": "Social & video",
  "Audio and restoration": "Audio & herstel", "Project and story": "Project & verhaal", "Source captures": "Broncaptures",
  "Project overviews": "Projectoverzichten", "Audio and songs": "Audio & songs", "Video and socials": "Video & social", "Story and lyrics": "Verhaal & songteksten",
};
const STATUS_LABELS: Record<string, string> = { "Working material / proposal": "Werkmateriaal / voorstel", "Source capture / template": "Broncapture / template", "Archived material": "Archief", "Reference / existing direction": "Referentie / bestaande richting" };
export default function DevelopmentLibrary({ pages, loading, error, onRetry }: { pages: DevelopmentPage[]; loading?: boolean; error?: string; onRetry?: () => void }) {
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [allCopies, setAllCopies] = useState(false);
  const [limit, setLimit] = useState(6);
  const [notice, setNotice] = useState("");
  const [manualPath, setManualPath] = useState("");
  const indexPath = libraryIndexPath(pages);
  const categories = useMemo(() => [...new Set(pages.map(p => p.category))], [pages]);
  const statuses = useMemo(() => [...new Set(pages.map(p => p.status))], [pages]);
  const filtered = useMemo(() => filterDevelopmentPages(pages, category, search, status).sort((a, b) => sort === "title" ? a.title.localeCompare(b.title, "nl") : sort === "oldest" ? a.source_modified.localeCompare(b.source_modified) : b.source_modified.localeCompare(a.source_modified)), [pages, category, search, status, sort]);
  const displayed = useMemo(() => allCopies ? filtered.map(page => ({ page, copies: [page] })) : groupDevelopmentPages(filtered), [filtered, allCopies]);
  const hasFilters = !!(category || search || status);
  const reset = () => { setCategory(""); setSearch(""); setStatus(""); setLimit(6); };
  async function copyPath(path: string) {
    try { await navigator.clipboard.writeText(path); setNotice("Pad gekopieerd. Plak het in de adresbalk van je browser op deze pc."); setManualPath(""); }
    catch { setNotice("Kopieer dit pad en plak het in de adresbalk op je pc."); setManualPath(path); }
  }
  return <section className="neon-development" aria-labelledby="neon-development-title" id="development">
    <div className="neon-section-heading"><div><h2 id="neon-development-title">Development web pages</h2><p>Verhaal, covers, luisterproeven en eerdere versies bij elkaar.</p></div><button type="button" disabled={!indexPath || loading || !!error} onClick={() => { if (indexPath) void copyPath(indexPath); }}><Copy size={15} /> Kopieer bibliotheekpad</button></div>
    <p className="neon-local-note">De HTML-pagina’s staan op je pc. Kopieer een pad om een pagina te openen. De Beeldbank hieronder is online beschikbaar.</p>
    <div className="neon-development-search"><Search size={17} aria-hidden="true" /><label className="sr-only" htmlFor="neon-page-search">Zoek developmentpagina’s</label><input id="neon-page-search" type="search" value={search} placeholder="Zoek een song, concept of versie…" onChange={e => { setSearch(e.target.value); setLimit(6); }} /></div>
    <nav className="neon-development-filters" aria-label="Development categorieën"><button aria-pressed={!category} onClick={() => { setCategory(""); setLimit(6); }}>Alles <span>{pages.length}</span></button>{categories.map(c => <button key={c} aria-pressed={category === c} onClick={() => { setCategory(c); setLimit(6); }}>{LABELS[c] || c} <span>{pages.filter(p => p.category === c).length}</span></button>)}</nav>
    <div className="neon-library-controls">
      <label className="neon-mobile-category">Categorie<select value={category} onChange={e => { setCategory(e.target.value); setLimit(6); }}><option value="">Alle categorieën</option>{categories.map(c => <option key={c} value={c}>{LABELS[c] || c}</option>)}</select></label>
      <label>Status<select value={status} onChange={e => { setStatus(e.target.value); setLimit(6); }}><option value="">Alle statussen</option>{statuses.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}</select></label>
      <label>Volgorde<select value={sort} onChange={e => { setSort(e.target.value); setLimit(6); }}><option value="newest">Nieuwste eerst</option><option value="oldest">Oudste eerst</option><option value="title">Titel A–Z</option></select></label>
      <label className="neon-copy-toggle"><input type="checkbox" checked={allCopies} onChange={e => { setAllCopies(e.target.checked); setLimit(6); }} /> Alle kopieën apart</label>
      {hasFilters && <button type="button" className="neon-reset" onClick={reset}><X size={14} /> Wis filters</button>}
    </div>
    {notice && <div className="neon-copy-notice"><p role="status">{notice}</p><button type="button" aria-label="Sluit kopieermelding" onClick={() => { setNotice(""); setManualPath(""); }}><X size={16} /></button></div>}
    {manualPath && <input className="neon-manual-path" aria-label="Pad om te kopiëren" value={manualPath} readOnly onFocus={e => e.currentTarget.select()} />}
    {loading && <p role="status">Developmentpagina’s laden…</p>}
    {error && <div role="alert"><p>{error}</p><button onClick={onRetry}>Opnieuw laden</button></div>}
    {!loading && !error && <p className="neon-result-count" role="status">{allCopies ? `${filtered.length} bestanden` : `${displayed.length} pagina’s uit ${filtered.length} bestanden`} · Alleen identieke kopieën worden gegroepeerd.</p>}
    {!loading && !error && !filtered.length && <div className="neon-empty"><p>Geen pagina’s met deze filters.</p><button type="button" onClick={reset}>Bekijk alle pagina’s</button></div>}
    <div className="neon-development-grid">{!loading && !error && displayed.slice(0, limit).map(({ page, copies }) => {
      const hosted = safeHostedUrl(page.hosted_url);
      return <article key={page.id}><div className="neon-page-topline"><FileCode2 size={18} aria-hidden="true" /><span>{LABELS[page.category] || page.category}</span></div><h3>{page.title}</h3><p className="neon-page-meta"><time dateTime={page.source_modified}>{pageDate(page.source_modified)}</time><span>{pageOrigin(page)}</span></p><p className="neon-page-status">{STATUS_LABELS[page.status] || page.status}</p><div className="neon-page-actions">{hosted && <a href={hosted} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Open online</a>}<button type="button" onClick={() => copyPath(page.local_path)}><Copy size={14} /> Kopieer pad</button><span className="neon-pc-badge">Op je pc</span></div><details className="neon-copy-origins"><summary>{copies.length > 1 ? `${copies.length} identieke kopieën` : "Project & herkomst"}</summary>{copies.map(copy => <div key={copy.id}><strong>{pageOrigin(copy)}</strong><p>{copy.project}</p><small>{pageDate(copy.source_modified)}</small>{copies.length > 1 && <button type="button" onClick={() => copyPath(copy.local_path)}>Kopieer pad van deze kopie</button>}</div>)}</details></article>;
    })}</div>
    {displayed.length > limit && !loading && !error && <button className="neon-load-more" onClick={() => setLimit(v => v + 12)}>Meer pagina’s tonen ({displayed.length - limit})</button>}
    <a className="neon-gallery-jump" href="#neon-beeldbank">Naar de Beeldbank</a>
    <p className="neon-library-footnote">Werkmateriaal, archief en inspiratie. Aanwezigheid in deze bibliotheek betekent geen releasegoedkeuring.</p>
  </section>;
}
