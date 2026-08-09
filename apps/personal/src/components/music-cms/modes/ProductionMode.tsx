// ProductionMode — het Muziek Productie Dashboard (/music-cms?mode=productie).
// Eén regel per nummer (song_title overkoepelend); uitklappen toont alle versies
// in drie vaste segmenten: Favorieten, Nabewerkt (>100MB = NeuralAnalog), Concepten.
// Favoriet-toggle schrijft direct naar Supabase; review-restpunten zijn hier
// herclusterbaar; songtekst opent in een subtiele modal met copy.
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  FileText,
  Pencil,
  Star,
  X,
} from "lucide-react";
import {
  confirmCluster,
  listLyrics,
  listTracks,
  reassignSong,
  setFavorite,
  setTrackUrl,
  type LyricVersion,
  type Track,
} from "../lib/trackStore";

const NABEWERKT_BYTES = 100 * 1024 * 1024; // >100MB = 100% NeuralAnalog-nabewerkt

type TopFilter = "alle" | "favorieten" | "review";

interface SongGroup {
  title: string;
  tracks: Track[];
  favorites: Track[];
  processed: Track[];
  concepts: Track[];
  firstSeen: string | null;
  latestSeen: string | null;
  reviewCount: number;
  suno: string | null;
  soundcloud: string | null;
  spotify: string | null;
  neuralanalog: string | null;
}

const fmtDur = (s: number | null): string => {
  if (s == null) return "—";
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return `${m}m${String(r).padStart(2, "0")}`;
};

const fmtMb = (b: number | null): string => (b == null ? "—" : `${(b / 1048576).toFixed(1)} MB`);

const fmtDate = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }) : "—";

const bySizeDesc = (a: Track, b: Track): number => (b.file_size_bytes ?? 0) - (a.file_size_bytes ?? 0);

function groupSongs(tracks: Track[]): SongGroup[] {
  const map = new Map<string, Track[]>();
  for (const t of tracks) {
    const arr = map.get(t.song_title);
    if (arr) arr.push(t);
    else map.set(t.song_title, [t]);
  }
  const groups: SongGroup[] = [];
  for (const [title, list] of map) {
    const favorites = list.filter((t) => t.favorite).sort(bySizeDesc);
    const processed = list
      .filter((t) => !t.favorite && (t.file_size_bytes ?? 0) > NABEWERKT_BYTES)
      .sort(bySizeDesc);
    const concepts = list
      .filter((t) => !t.favorite && (t.file_size_bytes ?? 0) <= NABEWERKT_BYTES)
      .sort((a, b) => (b.first_seen_at ?? "").localeCompare(a.first_seen_at ?? ""));
    const seen = list.map((t) => t.first_seen_at).filter((d): d is string => d != null).sort();
    const firstUrl = (f: (t: Track) => string | null): string | null => {
      for (const t of list) {
        const v = f(t);
        if (v) return v;
      }
      return null;
    };
    groups.push({
      title,
      tracks: list,
      favorites,
      processed,
      concepts,
      firstSeen: seen[0] ?? null,
      latestSeen: seen[seen.length - 1] ?? null,
      reviewCount: list.filter((t) => t.cluster_confidence === "review").length,
      suno: firstUrl((t) => t.suno_url),
      soundcloud: firstUrl((t) => t.soundcloud_url),
      spotify: firstUrl((t) => t.spotify_url),
      neuralanalog: firstUrl((t) => t.neuralanalog_url),
    });
  }
  return groups.sort((a, b) => {
    const fa = a.favorites.length > 0 ? 1 : 0;
    const fb = b.favorites.length > 0 ? 1 : 0;
    if (fa !== fb) return fb - fa;
    return (b.latestSeen ?? "").localeCompare(a.latestSeen ?? "");
  });
}

export default function ProductionMode() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [topFilter, setTopFilter] = useState<TopFilter>("alle");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [procFilter, setProcFilter] = useState<Record<string, string>>({});
  const [lyricsFor, setLyricsFor] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState<LyricVersion[]>([]);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editUrlFor, setEditUrlFor] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [reassignFor, setReassignFor] = useState<string | null>(null);
  const [reassignDraft, setReassignDraft] = useState("");

  const refresh = useCallback(async () => {
    try {
      setTracks(await listTracks());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kon catalogus niet laden");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const groups = useMemo(() => groupSongs(tracks), [tracks]);
  const allTitles = useMemo(() => groups.map((g) => g.title).sort(), [groups]);

  const visible = useMemo(() => {
    return groups.filter((g) => {
      if (topFilter === "favorieten" && g.favorites.length === 0) return false;
      if (topFilter === "review" && g.reviewCount === 0) return false;
      if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [groups, topFilter, search]);

  const stats = useMemo(() => {
    const fav = tracks.filter((t) => t.favorite).length;
    const proc = tracks.filter((t) => (t.file_size_bytes ?? 0) > NABEWERKT_BYTES).length;
    const rev = tracks.filter((t) => t.cluster_confidence === "review").length;
    return { songs: groups.length, versies: tracks.length, fav, proc, rev };
  }, [tracks, groups]);

  const patchTrack = (id: string, patch: Partial<Track>): void =>
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const toggleFavorite = async (t: Track): Promise<void> => {
    patchTrack(t.id, { favorite: !t.favorite }); // optimistisch
    try {
      await setFavorite(t.id, !t.favorite);
    } catch {
      patchTrack(t.id, { favorite: t.favorite }); // rollback
    }
  };

  const openLyrics = async (title: string): Promise<void> => {
    setLyricsFor(title);
    setLyricsLoading(true);
    try {
      setLyrics(await listLyrics(title));
    } catch {
      setLyrics([]);
    } finally {
      setLyricsLoading(false);
    }
  };

  const copyLyric = async (l: LyricVersion): Promise<void> => {
    try {
      await navigator.clipboard.writeText(l.content);
      setCopiedId(l.id);
      window.setTimeout(() => setCopiedId((c) => (c === l.id ? null : c)), 2000);
    } catch {
      /* clipboard geweigerd — geen drama */
    }
  };

  const saveUrl = async (t: Track): Promise<void> => {
    const value = urlDraft.trim() || null;
    setEditUrlFor(null);
    patchTrack(t.id, { neuralanalog_url: value });
    try {
      await setTrackUrl(t.id, "neuralanalog_url", value);
    } catch {
      patchTrack(t.id, { neuralanalog_url: t.neuralanalog_url });
    }
  };

  const doReassign = async (t: Track): Promise<void> => {
    const title = reassignDraft.trim();
    if (!title) return;
    setReassignFor(null);
    patchTrack(t.id, { song_title: title, cluster_confidence: "confirmed" });
    try {
      await reassignSong(t.id, title);
    } catch {
      patchTrack(t.id, { song_title: t.song_title, cluster_confidence: t.cluster_confidence });
    }
  };

  const doConfirm = async (t: Track): Promise<void> => {
    patchTrack(t.id, { cluster_confidence: "confirmed" });
    try {
      await confirmCluster(t.id);
    } catch {
      patchTrack(t.id, { cluster_confidence: t.cluster_confidence });
    }
  };

  const toggleOpen = (title: string): void =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });

  const renderRow = (t: Track): JSX.Element => {
    const isProcessed = (t.file_size_bytes ?? 0) > NABEWERKT_BYTES;
    return (
      <div key={t.id} className="mp-row" data-review={t.cluster_confidence === "review" || undefined}>
        <button
          type="button"
          className="mp-star"
          data-on={t.favorite || undefined}
          title={t.favorite ? "Favoriet uit" : "Favoriet aan"}
          onClick={() => toggleFavorite(t)}
        >
          <Star size={15} fill={t.favorite ? "currentColor" : "none"} />
        </button>
        <div className="mp-row-main">
          <span className="mp-row-name" title={t.file_path}>{t.variant_label}</span>
          <span className="mp-row-meta">
            {fmtDur(t.duration_seconds)} · {t.bpm != null ? `${Math.round(t.bpm)} BPM` : "BPM —"} ·{" "}
            <em data-big={isProcessed || undefined}>{fmtMb(t.file_size_bytes)}</em> · {fmtDate(t.first_seen_at)}
            {isProcessed && <span className="mp-chip mp-chip--na" title="&gt;100MB — NeuralAnalog nabewerkt">nabewerkt</span>}
          </span>
        </div>
        <div className="mp-row-links">
          {t.suno_url && <a className="mp-chip" href={t.suno_url} target="_blank" rel="noreferrer" title="Suno — de start">Suno</a>}
          {t.soundcloud_url && <a className="mp-chip" href={t.soundcloud_url} target="_blank" rel="noreferrer" title="SoundCloud — verwerkte versie">SC</a>}
          {t.spotify_url && <a className="mp-chip" href={t.spotify_url} target="_blank" rel="noreferrer" title="Spotify — uitgebracht">Spotify</a>}
          {t.neuralanalog_url && <a className="mp-chip" href={t.neuralanalog_url} target="_blank" rel="noreferrer" title="NeuralAnalog">NA</a>}
          <button
            type="button"
            className="mp-icon-btn"
            title="NeuralAnalog-link invoeren/aanpassen"
            onClick={() => {
              setEditUrlFor(editUrlFor === t.id ? null : t.id);
              setUrlDraft(t.neuralanalog_url ?? "");
            }}
          >
            <Pencil size={13} />
          </button>
          {t.external_url ? (
            <a className="mp-icon-btn mp-icon-btn--dl" href={t.external_url} target="_blank" rel="noreferrer" title="Download">
              <Download size={14} />
            </a>
          ) : (
            <span className="mp-icon-btn mp-icon-btn--off" title="Alleen lokaal op je PC — nog niet in de cloud">
              <Download size={14} />
            </span>
          )}
          {t.cluster_confidence === "review" && (
            <button
              type="button"
              className="mp-icon-btn mp-icon-btn--warn"
              title="Restpunt: cluster controleren"
              onClick={() => {
                setReassignFor(reassignFor === t.id ? null : t.id);
                setReassignDraft(t.song_title);
              }}
            >
              <AlertTriangle size={14} />
            </button>
          )}
        </div>
        {editUrlFor === t.id && (
          <div className="mp-inline-edit">
            <input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://neuralanalog… (leeg = verwijderen)"
              onKeyDown={(e) => e.key === "Enter" && saveUrl(t)}
            />
            <button type="button" className="mp-mini-btn" onClick={() => saveUrl(t)}><Check size={13} /> Opslaan</button>
          </div>
        )}
        {reassignFor === t.id && (
          <div className="mp-inline-edit">
            <input
              list="mp-song-titles"
              value={reassignDraft}
              onChange={(e) => setReassignDraft(e.target.value)}
              placeholder="Hoort bij song…"
              onKeyDown={(e) => e.key === "Enter" && doReassign(t)}
            />
            <button type="button" className="mp-mini-btn" onClick={() => doReassign(t)}><Check size={13} /> Verplaats</button>
            <button type="button" className="mp-mini-btn mp-mini-btn--ghost" onClick={() => doConfirm(t)}>Klopt zo</button>
          </div>
        )}
      </div>
    );
  };

  const renderSegment = (label: string, list: Track[], songTitle: string, filterable = false): JSX.Element | null => {
    if (list.length === 0) return null;
    const f = (procFilter[songTitle] ?? "").toLowerCase();
    const shown = filterable && f ? list.filter((t) => t.variant_label.toLowerCase().includes(f)) : list;
    return (
      <section className="mp-seg">
        <header className="mp-seg-h">
          <span>{label}</span>
          <span className="mp-seg-c">{shown.length}{shown.length !== list.length ? ` / ${list.length}` : ""}</span>
          {filterable && list.length > 3 && (
            <input
              className="mp-seg-filter"
              value={procFilter[songTitle] ?? ""}
              onChange={(e) => setProcFilter((p) => ({ ...p, [songTitle]: e.target.value }))}
              placeholder="filter…"
            />
          )}
        </header>
        {shown.map(renderRow)}
      </section>
    );
  };

  if (loading) return <main className="main"><p className="mp-dim">Catalogus laden…</p></main>;
  if (error) return <main className="main"><div className="mc-notice mc-notice--error">{error}</div></main>;

  return (
    <main className="main mp-main">
      <header className="mp-head">
        <div>
          <h1 className="manage-h">Productie<em>.</em></h1>
          <p className="mp-dim">
            {stats.songs} nummers · {stats.versies} versies · {stats.fav} favoriet · {stats.proc} nabewerkt ·{" "}
            {stats.rev > 0 ? <strong>{stats.rev} restpunten</strong> : "0 restpunten"}
          </p>
        </div>
        <div className="mp-controls">
          <div className="mp-tabs">
            {(["alle", "favorieten", "review"] as TopFilter[]).map((f) => (
              <button key={f} type="button" data-active={topFilter === f || undefined} onClick={() => setTopFilter(f)}>
                {f === "alle" ? "Alle" : f === "favorieten" ? "Favorieten" : `Restpunten${stats.rev ? ` (${stats.rev})` : ""}`}
              </button>
            ))}
          </div>
          <input className="mp-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Zoek nummer…" />
        </div>
      </header>

      <datalist id="mp-song-titles">
        {allTitles.map((t) => <option key={t} value={t} />)}
      </datalist>

      <div className="mp-list">
        {visible.map((g) => {
          const expanded = open.has(g.title);
          return (
            <article key={g.title} className="mp-song" data-open={expanded || undefined}>
              <button type="button" className="mp-song-row" onClick={() => toggleOpen(g.title)}>
                <span className="mp-song-caret" data-open={expanded || undefined}>▸</span>
                <span className="mp-song-title">
                  {g.title}
                  {g.favorites.length > 0 && <Star size={13} className="mp-song-fav" fill="currentColor" />}
                  {g.reviewCount > 0 && <span className="mp-chip mp-chip--warn">{g.reviewCount} review</span>}
                </span>
                <span className="mp-song-meta">
                  {g.tracks.length} versies · eerste {fmtDate(g.firstSeen)}
                </span>
                <span className="mp-song-actions" onClick={(e) => e.stopPropagation()}>
                  {g.suno && <a className="mp-chip" href={g.suno} target="_blank" rel="noreferrer">Suno</a>}
                  {g.soundcloud && <a className="mp-chip" href={g.soundcloud} target="_blank" rel="noreferrer">SC</a>}
                  {g.spotify && <a className="mp-chip" href={g.spotify} target="_blank" rel="noreferrer">Spotify</a>}
                  {g.neuralanalog && <a className="mp-chip" href={g.neuralanalog} target="_blank" rel="noreferrer">NA</a>}
                  <button type="button" className="mp-icon-btn" title="Songtekst" onClick={() => openLyrics(g.title)}>
                    <FileText size={14} />
                  </button>
                </span>
              </button>
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    className="mp-song-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <div className="mp-song-inner">
                      {renderSegment("Favorieten", g.favorites, g.title)}
                      {renderSegment("Nabewerkt", g.processed, g.title, true)}
                      {renderSegment("Concepten", g.concepts, g.title)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </article>
          );
        })}
        {visible.length === 0 && <p className="mp-dim">Geen nummers voor deze filter.</p>}
      </div>

      <AnimatePresence>
        {lyricsFor && (
          <motion.div
            className="mp-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setLyricsFor(null)}
          >
            <motion.div
              className="mp-modal"
              initial={{ opacity: 0, y: 14, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.99 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <header className="mp-modal-h">
                <h2>{lyricsFor}</h2>
                <button type="button" className="mp-icon-btn" onClick={() => setLyricsFor(null)} title="Sluiten">
                  <X size={16} />
                </button>
              </header>
              {lyricsLoading ? (
                <p className="mp-dim">Songteksten laden…</p>
              ) : lyrics.length === 0 ? (
                <p className="mp-dim">Nog geen songtekst voor dit nummer in de database.</p>
              ) : (
                lyrics.map((l) => (
                  <section key={l.id} className="mp-lyric">
                    <header className="mp-lyric-h">
                      <span>
                        {l.variant_label || `v${l.version}`} · <em>{l.stage}</em> · {fmtDate(l.created_at)}
                      </span>
                      <button type="button" className="mp-mini-btn" onClick={() => copyLyric(l)}>
                        {copiedId === l.id ? <><Check size={13} /> Gekopieerd</> : <><Copy size={13} /> Copy</>}
                      </button>
                    </header>
                    <pre className="mp-lyric-body">{l.content}</pre>
                  </section>
                ))
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
