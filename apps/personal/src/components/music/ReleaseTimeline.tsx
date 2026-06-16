/**
 * ReleaseTimeline.tsx — "Music Studio" release timeline, folded into /music.
 *
 * React port of the prototype's music-studio.js engine. A chronological
 * timeline (oldest release at the top, newest at the bottom) built from a
 * canonical BASE_RELEASES list merged with releases the visitor adds. User
 * additions persist in localStorage (per the design — browser-local, no
 * backend). Styled by the scoped .music-neon stylesheet.
 *
 * SSR-safe: localStorage and IntersectionObserver are only touched in effects
 * (client-only), and the first render uses BASE_RELEASES so prerender works.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ReleaseType = "Single" | "EP" | "Album";

interface Release {
  id: string;
  date: string;       // YYYY-MM-DD
  title: string;
  type: ReleaseType;
  genre: string;
  cover?: string;
  dur?: string;
  tracks?: number;
  video?: boolean;
  note?: string;
  user?: boolean;
}

const LS_KEY = "hvl_music_releases_v1";

/* Canonical catalogue — mirrors the live catalogue's release history. */
const BASE_RELEASES: Release[] = [
  { id: "new-level", date: "2025-09-01", title: "New Level (Main Menu)", type: "Single", genre: "Electronic", note: "Where it started — a menu-screen loop that refused to stay background music." },
  { id: "beat-between", date: "2025-10-01", title: "Beat Between Our Years × Layer Cake Universe", type: "Single", genre: "Mashup" },
  { id: "hanging-on", date: "2025-11-01", title: "Hanging On (Remastered)", type: "Single", genre: "Electronic" },
  { id: "teacher-leave", date: "2025-12-01", title: "Teacher Leave (Remastered x2)", type: "Single", genre: "Electronic" },
  { id: "beat-drop", date: "2026-01-01", title: "Beat Drop", type: "Single", genre: "Electronic", video: true, note: "The first official single — out on Spotify as Jowikroon." },
];

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDate(d: string): string {
  const p = d.split("-").map((x) => parseInt(x, 10));
  if (!p[0]) return d;
  if (p[1] && p[2]) return `${MON[p[1] - 1]} ${p[2]}, ${p[0]}`;
  if (p[1]) return `${MON[p[1] - 1]} ${p[0]}`;
  return `${p[0]}`;
}
function yearOf(d: string): number { return parseInt(d.split("-")[0], 10) || 0; }

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
);

const ReleaseTimeline = () => {
  const [userReleases, setUserReleases] = useState<Release[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({ title: "", type: "Single" as ReleaseType, date: "", genre: "" });
  const [errField, setErrField] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number>(0);

  /* hydrate user releases from localStorage (client only) */
  useEffect(() => {
    try { const raw = localStorage.getItem(LS_KEY); if (raw) setUserReleases(JSON.parse(raw)); } catch { /* ignore */ }
  }, []);

  const persist = useCallback((list: Release[]) => {
    setUserReleases(list);
    try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  }, []);

  const merged = useMemo(() => {
    return [...BASE_RELEASES, ...userReleases].slice().sort((a, b) => {
      if (a.date === b.date) return (a.type === "Single" ? 0 : 1) - (b.type === "Single" ? 0 : 1);
      return a.date < b.date ? -1 : 1;
    });
  }, [userReleases]);

  const stats = useMemo(() => ({
    total: merged.length,
    since: merged.length ? yearOf(merged[0].date) : "—",
    singles: merged.filter((r) => r.type === "Single").length,
    albums: merged.filter((r) => r.type !== "Single").length,
  }), [merged]);

  const flash = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2600);
  };

  const save = () => {
    if (!form.title.trim()) { setErrField("title"); return; }
    if (!form.date.trim()) { setErrField("date"); return; }
    setErrField(null);
    const rec: Release = { id: `u${Date.now()}`, date: form.date, title: form.title.trim(), type: form.type, genre: form.genre.trim() || "—", user: true };
    persist([...userReleases, rec]);
    setForm({ title: "", type: "Single", date: "", genre: "" });
    setComposerOpen(false);
    flash(`“${rec.title}” added to the timeline`);
  };

  const remove = (id: string) => { persist(userReleases.filter((r) => r.id !== id)); flash("Release removed"); };

  /* scroll reveal + spine fill */
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    const items = rootRef.current?.querySelectorAll<HTMLElement>(".mn-tl__item,.mn-tl__year,.mn-tl__tail");
    let io: IntersectionObserver | null = null;
    if (items && !reduce && "IntersectionObserver" in window) {
      io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io?.unobserve(en.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      items.forEach((el) => io!.observe(el));
    } else { items?.forEach((el) => el.classList.add("in")); }

    const onScroll = () => {
      const spine = rootRef.current?.querySelector<HTMLElement>(".mn-tl__spine");
      const fill = fillRef.current;
      if (!spine || !fill) return;
      const r = spine.getBoundingClientRect();
      const done = Math.max(0, Math.min(r.height, window.innerHeight * 0.55 - r.top));
      fill.style.height = `${done}px`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { io?.disconnect(); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, [merged]);

  let lastYear: number | null = null;

  return (
    <div className="mn-studio">
      <span className="mn-studio__eyebrow">Music Studio · Release timeline</span>
      <h2 className="mn-studio__title">The discography, in order</h2>
      <p className="mn-studio__sub">Every <strong>single, EP and album</strong> on one growing timeline — anchored to the first release and stretching down with each new one. Add a release and watch the page get longer.</p>

      <div className="mn-studio__stats">
        <div className="mn-studio__stat"><span className="mn-studio__stat-n">{stats.total}</span><span className="mn-studio__stat-l">Releases</span></div>
        <div className="mn-studio__stat"><span className="mn-studio__stat-n">{stats.since}</span><span className="mn-studio__stat-l">Making music since</span></div>
        <div className="mn-studio__stat"><span className="mn-studio__stat-n">{stats.singles}</span><span className="mn-studio__stat-l">Singles</span></div>
        <div className="mn-studio__stat"><span className="mn-studio__stat-n">{stats.albums}</span><span className="mn-studio__stat-l">EPs &amp; albums</span></div>
      </div>

      <div className="mn-studio__actions">
        <button className="mn-sbtn mn-sbtn--primary" type="button" onClick={() => setComposerOpen((o) => !o)}>
          <PlusIcon /> Add a release
        </button>
      </div>

      {/* composer */}
      <div className={`mn-composer${composerOpen ? " open" : ""}`}>
        <div className="mn-composer__inner">
          <div className="mn-composer__h">Add a release</div>
          <div className="mn-composer__s">It slots into the timeline at the right moment in time and is saved on this device.</div>
          <div className="mn-composer__grid">
            <div className="mn-field"><label className="mn-field__l" htmlFor="cTitle">Title</label>
              <input id="cTitle" type="text" placeholder="e.g. Northern Lights" autoComplete="off" value={form.title} style={errField === "title" ? { borderColor: "#c0492f" } : undefined} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="mn-field"><label className="mn-field__l" htmlFor="cType">Type</label>
              <select id="cType" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ReleaseType })}><option>Single</option><option>EP</option><option>Album</option></select></div>
          </div>
          <div className="mn-composer__row">
            <div className="mn-field"><label className="mn-field__l" htmlFor="cDate">Release date</label>
              <input id="cDate" type="date" value={form.date} style={errField === "date" ? { borderColor: "#c0492f" } : undefined} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div className="mn-field"><label className="mn-field__l" htmlFor="cGenre">Genre</label>
              <input id="cGenre" type="text" placeholder="e.g. Ambient" autoComplete="off" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} /></div>
          </div>
          <div className="mn-composer__foot">
            <button className="mn-composer__cancel" type="button" onClick={() => setComposerOpen(false)}>Cancel</button>
            <button className="mn-sbtn mn-sbtn--primary" type="button" onClick={save}>Add to timeline</button>
          </div>
        </div>
      </div>

      {/* timeline */}
      <div className="mn-tl" ref={rootRef}>
        <div className="mn-tl__spine"><div className="mn-tl__fill" ref={fillRef} /></div>
        <div className="mn-tl__origin">
          <div className="mn-tl__origin-dot" />
          <div className="mn-tl__origin-k">The beginning</div>
          <div className="mn-tl__origin-t">First release — {merged.length ? fmtDate(merged[0].date) : ""}</div>
        </div>
        {merged.map((r, i) => {
          const y = yearOf(r.date);
          const showYear = y !== lastYear;
          lastYear = y;
          const side = i % 2 === 0 ? "left" : "right";
          const latest = i === merged.length - 1 ? " is-latest" : "";
          const sub = [r.dur, r.tracks ? `${r.tracks} tracks` : "", r.video ? "Music video" : ""].filter(Boolean).join(" · ");
          return (
            <div key={r.id}>
              {showYear && <div className="mn-tl__year"><span>{y}</span></div>}
              <div className={`mn-tl__item ${side}${latest}`} data-id={r.id}>
                <span className="mn-tl__node" />
                <div className={`mn-rel${r.user ? " is-user" : ""}`}>
                  <div className="mn-rel__cover">
                    <span className="mn-rel__type">{r.type}</span>
                    <div className="fb">{r.title}</div>
                    {r.cover && <img src={r.cover} alt={`${r.title} cover`} onError={(e) => { (e.currentTarget as HTMLImageElement).remove(); }} />}
                  </div>
                  <div className="mn-rel__body">
                    <div className="mn-rel__meta">
                      <span className="mn-rel__date">{fmtDate(r.date)}</span>
                      <span className="dot" /><span className="mn-rel__genre">{r.genre}</span>
                      {sub && <><span className="dot" /><span>{sub}</span></>}
                    </div>
                    <div className="mn-rel__title">{r.title}{r.type === "EP" ? " — EP" : ""}</div>
                    {r.note && <div className="mn-rel__note">{r.note}</div>}
                    {(i === 0 || r.type !== "Single" || r.user) && (
                      <div className="mn-rel__badges">
                        {i === 0 && <span className="mn-rel__chip mn-rel__chip--first">★ First release</span>}
                        {r.type !== "Single" && <span className="mn-rel__chip">{r.type}</span>}
                        {r.user && <span className="mn-rel__chip">Added by you</span>}
                      </div>
                    )}
                  </div>
                  {r.user && <button className="mn-rel__del" type="button" aria-label={`Remove ${r.title}`} onClick={() => remove(r.id)}><XIcon /></button>}
                </div>
              </div>
            </div>
          );
        })}
        <div className="mn-tl__tail">
          <div className="mn-tl__tail-dot" />
          <div className="mn-tl__tail-t">…and counting</div>
          <div className="mn-tl__tail-s">Every new single, EP or album lands here and the story grows.</div>
        </div>
      </div>

      <div className={`mn-toast${toast ? " show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </div>
  );
};

export default ReleaseTimeline;
