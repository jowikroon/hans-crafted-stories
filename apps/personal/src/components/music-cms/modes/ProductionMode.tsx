// ProductionMode — het Muziek Productie Dashboard (/music-cms?mode=productie).
// Eén regel per nummer (song_title overkoepelend); uitklappen toont alle versies
// in drie vaste segmenten: Favorieten, Nabewerkt (>100MB = NeuralAnalog), Concepten.
//
// Herzien 2026-08-10 na code-audit. Opgelost:
//  - falende DB-writes waren onzichtbaar + rollback gebruikte een stale waarde
//  - `javascript:`-URL's konden persistent worden opgeslagen en gerenderd
//  - interactieve elementen genest in een <button> (ongeldige HTML, breekt a11y)
//  - lyrics-modal zonder dialog-semantiek (geen ESC, geen focus-restore)
//  - alles hertekende bij elke toetsaanslag (nu memo-componenten + deferred search)
//  - lyrics-race + DB-fout die als "geen songtekst" werd getoond
//  - groeperen op exacte string (nu genormaliseerde sleutel)
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowDown, ArrowUp, Check, Copy, Download, FileText, HelpCircle, Star, X } from "lucide-react";
import PlatformLinks from "./PlatformLinks";
import ColumnPicker from "./ColumnPicker";
import { COLUMNS, COLUMN_BY_ID, sortTracks } from "../lib/trackColumns";
import { DEFAULT_PREFS, loadPrefs, savePrefs, type DashboardPrefs, type SortDir } from "../lib/dashboardPrefs";
import {
  confirmCluster,
  listLyrics,
  listTracks,
  reassignSong,
  safeHttpUrl,
  setFavorite,
  setTrackStatus,
  setTrackUrl,
  type LyricVersion,
  type Track,
  type TrackUrlField,
} from "../lib/trackStore";

const NABEWERKT_BYTES = 100 * 1024 * 1024; // >100MB = 100% NeuralAnalog-nabewerkt

type TopFilter = "alle" | "favorieten" | "uitzoeken";

interface SongGroup {
  key: string;
  title: string;
  tracks: Track[];
  favorites: Track[];
  processed: Track[];
  concepts: Track[];
  unresolved: Track[];
  firstSeen: string | null;
  latestSeen: string | null;
  unresolvedCount: number;
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

/** Genormaliseerde groepssleutel: "Neon Skyline", "neon skyline " en "Neon  Skyline"
 *  horen bij hetzelfde nummer (audit: exacte string-match splitste clusters). */
const groupKey = (s: string): string => s.trim().toLowerCase().replace(/\s+/g, " ");

const bySizeDesc = (a: Track, b: Track): number => (b.file_size_bytes ?? 0) - (a.file_size_bytes ?? 0);

function groupSongs(tracks: Track[]): SongGroup[] {
  const map = new Map<string, Track[]>();
  for (const t of tracks) {
    const k = groupKey(t.song_title);
    const arr = map.get(k);
    if (arr) arr.push(t);
    else map.set(k, [t]);
  }
  const groups: SongGroup[] = [];
  for (const [k, list] of map) {
    const isOpen = (t: Track) => t.status === "uitzoeken";
    const favorites = list.filter((t) => t.favorite);
    const rest = list.filter((t) => !t.favorite);
    const unresolved = rest.filter(isOpen);
    const settled = rest.filter((t) => !isOpen(t));
    const processed = settled.filter((t) => (t.file_size_bytes ?? 0) > NABEWERKT_BYTES);
    const concepts = settled.filter((t) => (t.file_size_bytes ?? 0) <= NABEWERKT_BYTES);
    const seen = list.map((t) => t.first_seen_at).filter((d): d is string => d != null).sort();
    const firstUrl = (f: (t: Track) => string | null): string | null => {
      for (const t of list) {
        const v = safeHttpUrl(f(t));
        if (v) return v;
      }
      return null;
    };
    groups.push({
      key: k,
      title: list[0].song_title,
      tracks: list,
      favorites,
      processed,
      concepts,
      unresolved,
      firstSeen: seen[0] ?? null,
      latestSeen: seen[seen.length - 1] ?? null,
      unresolvedCount: unresolved.length,
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

/* ── Eén versie-regel ─────────────────────────────────────────────────────── */

interface RowProps {
  track: Track;
  titles: string[];
  columns: string[];
  onToggleFavorite: (t: Track) => void;
  onSaveUrl: (t: Track, field: TrackUrlField, value: string | null) => void;
  onReassign: (t: Track, title: string) => void;
  onConfirm: (t: Track) => void;
  onResolve: (t: Track) => void;
}

const TrackRow = memo(function TrackRow({
  track: t,
  titles,
  columns,
  onToggleFavorite,
  onSaveUrl,
  onReassign,
  onConfirm,
  onResolve,
}: RowProps) {
  const [reassign, setReassign] = useState(false);
  const [reassignDraft, setReassignDraft] = useState("");
  const isProcessed = (t.file_size_bytes ?? 0) > NABEWERKT_BYTES;

  const download = safeHttpUrl(t.external_url);

  return (
    <div className="mp-row" data-review={t.status === "uitzoeken" || undefined}>
      <button
        type="button"
        className="mp-star"
        data-on={t.favorite || undefined}
        aria-pressed={t.favorite}
        aria-label={t.favorite ? `Favoriet uit: ${t.variant_label}` : `Favoriet aan: ${t.variant_label}`}
        onClick={() => onToggleFavorite(t)}
      >
        <Star size={15} fill={t.favorite ? "currentColor" : "none"} aria-hidden="true" />
      </button>
      <div className="mp-row-main">
        <span className="mp-row-name" title={t.file_path}>{t.variant_label}</span>
        <span className="mp-row-meta">
          {columns.map((cid) => {
            const col = COLUMN_BY_ID.get(cid);
            if (!col || cid === "name") return null;
            const isSize = cid === "size";
            return (
              <span key={cid} className="mp-cell" data-col={cid}>
                {isSize ? <em data-big={isProcessed || undefined}>{col.render(t)}</em> : col.render(t)}
              </span>
            );
          })}
          {isProcessed && <span className="mp-chip mp-chip--na">nabewerkt</span>}
          {t.status === "uitzoeken" && <span className="mp-chip mp-chip--warn">uitzoeken</span>}
        </span>
      </div>
      <div className="mp-row-links">
        <PlatformLinks
          compact
          urls={{
            spotify_url: t.spotify_url,
            soundcloud_url: t.soundcloud_url,
            suno_url: t.suno_url,
            neuralanalog_url: t.neuralanalog_url,
          }}
          onSave={(field, value) => onSaveUrl(t, field, value)}
        />
        {download ? (
          <a
            className="mp-icon-btn mp-icon-btn--dl"
            href={download}
            target="_blank"
            rel="noreferrer"
            aria-label={`Download ${t.variant_label}`}
            title="Download"
          >
            <Download size={14} aria-hidden="true" />
          </a>
        ) : (
          <button
            type="button"
            className="mp-icon-btn mp-icon-btn--off"
            disabled
            aria-label="Niet beschikbaar — bestand staat alleen lokaal"
            title="Alleen lokaal op je PC — nog niet in de cloud"
          >
            <Download size={14} aria-hidden="true" />
          </button>
        )}
        {t.status === "uitzoeken" && (
          <button
            type="button"
            className="mp-icon-btn mp-icon-btn--warn"
            aria-label="Uitzoeken: hoort dit bij het juiste nummer?"
            title="Uitzoeken: hoort dit bij het juiste nummer?"
            onClick={() => {
              setReassign((v) => !v);
              setReassignDraft(t.song_title);
            }}
          >
            <AlertTriangle size={14} aria-hidden="true" />
          </button>
        )}
        {t.status === "uitzoeken" && (
          <button
            type="button"
            className="mp-icon-btn mp-icon-btn--ok"
            aria-label="Uitgezocht — dit klopt"
            title="Uitgezocht: haal uit Uitzoeken"
            onClick={() => onResolve(t)}
          >
            <Check size={14} aria-hidden="true" />
          </button>
        )}
      </div>
      {reassign && (
        <div className="mp-inline-edit">
          <input
            list="mp-song-titles"
            aria-label="Hoort bij welk nummer"
            value={reassignDraft}
            onChange={(e) => setReassignDraft(e.target.value)}
            placeholder="Hoort bij song…"
            onKeyDown={(e) => {
              if (e.key === "Enter") { onReassign(t, reassignDraft); setReassign(false); }
              if (e.key === "Escape") setReassign(false);
            }}
          />
          <button type="button" className="mp-mini-btn" onClick={() => { onReassign(t, reassignDraft); setReassign(false); }}>
            <Check size={13} aria-hidden="true" /> Verplaats
          </button>
          <button type="button" className="mp-mini-btn mp-mini-btn--ghost" onClick={() => { onConfirm(t); setReassign(false); }}>
            Klopt zo
          </button>
        </div>
      )}
      {titles.length === 0 && null}
    </div>
  );
});

/* ── Eén song-kaart ───────────────────────────────────────────────────────── */

interface CardProps {
  group: SongGroup;
  expanded: boolean;
  titles: string[];
  columns: string[];
  sortBy: string;
  sortDir: SortDir;
  onSort: (columnId: string) => void;
  onToggle: (key: string) => void;
  onOpenLyrics: (title: string, opener: HTMLElement) => void;
  onToggleFavorite: (t: Track) => void;
  onSaveUrl: (t: Track, field: TrackUrlField, value: string | null) => void;
  onSongSaveUrl: (g: SongGroup, field: TrackUrlField, value: string | null) => void;
  onReassign: (t: Track, title: string) => void;
  onConfirm: (t: Track) => void;
  onResolve: (t: Track) => void;
}

const SongCard = memo(function SongCard({
  group: g,
  expanded,
  titles,
  columns,
  sortBy,
  sortDir,
  onSort,
  onToggle,
  onOpenLyrics,
  onToggleFavorite,
  onSaveUrl,
  onSongSaveUrl,
  onReassign,
  onConfirm,
  onResolve,
}: CardProps) {
  // Filter is lokaal: typen in song A hertekent niet meer song B t/m Z.
  const [filter, setFilter] = useState("");
  const bodyId = `mp-body-${g.key.replace(/[^a-z0-9]/g, "-")}`;

  const rowProps = { titles, columns, onToggleFavorite, onSaveUrl, onReassign, onConfirm, onResolve };

  const segment = (label: string, list: Track[], filterable = false, hint?: string) => {
    if (list.length === 0) return null;
    const f = filter.toLowerCase();
    const filtered = filterable && f ? list.filter((t) => t.variant_label.toLowerCase().includes(f)) : list;
    const shown = sortTracks(filtered, sortBy, sortDir);
    return (
      <section className="mp-seg">
        <header className="mp-seg-h">
          <span>{label}</span>
          {hint && <span className="mp-seg-hint">{hint}</span>}
          <span className="mp-seg-c">
            {shown.length}
            {shown.length !== list.length ? ` / ${list.length}` : ""}
          </span>
          {filterable && list.length > 3 && (
            <input
              className="mp-seg-filter"
              aria-label={`Filter binnen ${label}`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="filter…"
            />
          )}
        </header>
        {shown.length === 0 ? (
          <p className="mp-dim">Geen versies die aan het filter voldoen.</p>
        ) : (
          <>
            <div className="mp-colhead" role="row">
              <span className="mp-colhead-spacer" aria-hidden="true" />
              {["name", ...columns.filter((c) => c !== "name")].map((cid) => {
                const col = COLUMN_BY_ID.get(cid);
                if (!col) return null;
                const active = sortBy === cid;
                const nextDir: SortDir = active ? (sortDir === "asc" ? "desc" : "asc") : col.defaultDir;
                return (
                  <button
                    key={cid}
                    type="button"
                    className="mp-colhead-btn"
                    data-col={cid}
                    data-active={active || undefined}
                    aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                    title={`Sorteer op ${col.label} — ${nextDir === "asc" ? col.ascLabel : col.descLabel}`}
                    onClick={() => onSort(cid)}
                  >
                    {col.short}
                    {active && (sortDir === "asc"
                      ? <ArrowUp size={10} aria-hidden="true" />
                      : <ArrowDown size={10} aria-hidden="true" />)}
                  </button>
                );
              })}
            </div>
            {shown.map((t) => <TrackRow key={t.id} track={t} {...rowProps} />)}
          </>
        )}
      </section>
    );
  };

  return (
    <article className="mp-song" data-open={expanded || undefined}>
      <div className="mp-song-row">
        <button
          type="button"
          className="mp-song-toggle"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={() => onToggle(g.key)}
        >
          <span className="mp-song-caret" data-open={expanded || undefined} aria-hidden="true">▸</span>
          <span className="mp-song-title">
            {g.title}
            {g.favorites.length > 0 && <Star size={13} className="mp-song-fav" fill="currentColor" aria-hidden="true" />}
            {g.unresolvedCount > 0 && (
              <span className="mp-chip mp-chip--warn">
                <HelpCircle size={10} aria-hidden="true" /> {g.unresolvedCount} uitzoeken
              </span>
            )}
          </span>
          <span className="mp-song-meta">
            {g.tracks.length} versies · eerste {fmtDate(g.firstSeen)}
          </span>
        </button>
        <div className="mp-song-actions">
          <PlatformLinks
            compact
            urls={{
              spotify_url: g.spotify,
              soundcloud_url: g.soundcloud,
              suno_url: g.suno,
              neuralanalog_url: g.neuralanalog,
            }}
            onSave={(field, value) => onSongSaveUrl(g, field, value)}
          />
          <button
            type="button"
            className="mp-icon-btn"
            aria-label={`Songtekst van ${g.title}`}
            title="Songtekst"
            onClick={(e) => onOpenLyrics(g.title, e.currentTarget)}
          >
            <FileText size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={bodyId}
            className="mp-song-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="mp-song-inner">
              <PlatformLinks
                label="Platforms"
                urls={{
                  spotify_url: g.spotify,
                  soundcloud_url: g.soundcloud,
                  suno_url: g.suno,
                  neuralanalog_url: g.neuralanalog,
                }}
                onSave={(field, value) => onSongSaveUrl(g, field, value)}
              />
              {segment("Favorieten", g.favorites)}
              {segment("Nabewerkt", g.processed, true)}
              {segment("Concepten", g.concepts)}
              {segment("Uitzoeken", g.unresolved, false, "onzeker — titel of audio klopt mogelijk niet")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
});

/* ── Dashboard ────────────────────────────────────────────────────────────── */

export default function ProductionMode() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [prefs, setPrefs] = useState<DashboardPrefs>(DEFAULT_PREFS);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const topFilter = prefs.filter as TopFilter;
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [lyricsFor, setLyricsFor] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState<LyricVersion[]>([]);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const inFlight = useRef<Set<string>>(new Set());
  const lyricsReq = useRef(0);
  const openerRef = useRef<HTMLElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => { refresh(); }, [refresh]);

  // Voorkeuren komen van het account, niet uit de browser.
  useEffect(() => {
    let cancelled = false;
    loadPrefs("music-production")
      .then((p) => { if (!cancelled) setPrefs(p); })
      .catch(() => { /* val terug op defaults */ });
    return () => { cancelled = true; };
  }, []);

  /** Wijzig voorkeuren: direct zichtbaar, daarna opslaan bij het account. */
  const updatePrefs = useCallback((patch: Partial<DashboardPrefs>) => {
    setPrefs((cur) => {
      const next = { ...cur, ...patch };
      setPrefsSaving(true);
      savePrefs("music-production", next)
        .then(() => setWriteError(null))
        .catch((e) => setWriteError(`Voorkeuren niet opgeslagen: ${e instanceof Error ? e.message : "onbekende fout"}`))
        .finally(() => setPrefsSaving(false));
      return next;
    });
  }, []);

  /** Klik op een kolomkop: eerste klik = de logische richting voor dat type,
   *  nogmaals klikken draait om. */
  const onSort = useCallback((columnId: string) => {
    setPrefs((cur) => {
      const col = COLUMN_BY_ID.get(columnId);
      const dir: SortDir = cur.sortBy === columnId
        ? (cur.sortDir === "asc" ? "desc" : "asc")
        : (col?.defaultDir ?? "desc");
      const next = { ...cur, sortBy: columnId, sortDir: dir };
      setPrefsSaving(true);
      savePrefs("music-production", next).catch(() => undefined).finally(() => setPrefsSaving(false));
      return next;
    });
  }, []);

  const groups = useMemo(() => groupSongs(tracks), [tracks]);
  const allTitles = useMemo(
    () => Array.from(new Set(groups.map((g) => g.title))).sort(),
    [groups],
  );

  const visible = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return groups.filter((g) => {
      if (topFilter === "favorieten" && g.favorites.length === 0) return false;
      if (topFilter === "uitzoeken" && g.unresolvedCount === 0) return false;
      if (q) {
        // Zoekt ook in bestandsnamen, niet alleen in de songtitel.
        return (
          g.title.toLowerCase().includes(q) ||
          g.tracks.some((t) => t.variant_label.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [groups, topFilter, deferredSearch]);

  const stats = useMemo(() => {
    const fav = tracks.filter((t) => t.favorite).length;
    const proc = tracks.filter((t) => (t.file_size_bytes ?? 0) > NABEWERKT_BYTES).length;
    const rev = tracks.filter((t) => t.status === "uitzoeken").length;
    return { songs: groups.length, versies: tracks.length, fav, proc, rev };
  }, [tracks, groups]);

  const patchTrack = useCallback((id: string, patch: Partial<Track>): void => {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  /** Eén mutatiepad: optimistisch, met snapshot-rollback, in-flight guard en
   *  een zichtbare foutmelding. Faalt een write, dan weet je dat nu. */
  const mutate = useCallback(
    async (key: string, apply: () => void, rollback: () => void, run: () => Promise<void>, what: string) => {
      if (inFlight.current.has(key)) return;
      inFlight.current.add(key);
      apply();
      try {
        await run();
        setWriteError(null);
      } catch (e) {
        rollback();
        setWriteError(`${what} niet opgeslagen: ${e instanceof Error ? e.message : "onbekende fout"}`);
      } finally {
        inFlight.current.delete(key);
      }
    },
    [],
  );

  const toggleFavorite = useCallback(
    (t: Track) => {
      const prev = t.favorite;
      void mutate(
        `fav:${t.id}`,
        () => patchTrack(t.id, { favorite: !prev }),
        () => patchTrack(t.id, { favorite: prev }),
        () => setFavorite(t.id, !prev),
        "Favoriet",
      );
    },
    [mutate, patchTrack],
  );

  const saveUrl = useCallback(
    (t: Track, field: TrackUrlField, value: string | null) => {
      const prev = (t[field] ?? null) as string | null;
      void mutate(
        `url:${t.id}:${field}`,
        () => patchTrack(t.id, { [field]: value } as Partial<Track>),
        () => patchTrack(t.id, { [field]: prev } as Partial<Track>),
        () => setTrackUrl(t.id, field, value),
        "Link",
      );
    },
    [mutate, patchTrack],
  );

  /** Een platformlink hoort bij het NUMMER, niet bij één bestand: schrijf 'm
   *  daarom naar alle versies van dat nummer in één keer. */
  const saveSongUrl = useCallback(
    (g: SongGroup, field: TrackUrlField, value: string | null) => {
      const ids = g.tracks.map((t) => t.id);
      const prev = new Map(g.tracks.map((t) => [t.id, (t[field] ?? null) as string | null]));
      void mutate(
        `songurl:${g.key}:${field}`,
        () => setTracks((cur) => cur.map((t) => (ids.includes(t.id) ? { ...t, [field]: value } : t))),
        () => setTracks((cur) => cur.map((t) => (prev.has(t.id) ? { ...t, [field]: prev.get(t.id) ?? null } : t))),
        async () => { for (const id of ids) await setTrackUrl(id, field, value); },
        "Platformlink",
      );
    },
    [mutate],
  );

  const doReassign = useCallback(
    (t: Track, draft: string) => {
      const typed = draft.trim();
      if (!typed) return;
      // Snap naar een bestaande titel zodat een typefout geen duplicaat-song maakt.
      const match = allTitles.find((x) => groupKey(x) === groupKey(typed));
      const title = match ?? typed;
      if (!match && !window.confirm(`"${typed}" bestaat nog niet als nummer. Toch nieuw nummer aanmaken?`)) return;
      const prevTitle = t.song_title;
      const prevConf = t.cluster_confidence;
      void mutate(
        `move:${t.id}`,
        () => patchTrack(t.id, { song_title: title, cluster_confidence: "confirmed" }),
        () => patchTrack(t.id, { song_title: prevTitle, cluster_confidence: prevConf }),
        () => reassignSong(t.id, title),
        "Verplaatsing",
      );
    },
    [allTitles, mutate, patchTrack],
  );

  const doConfirm = useCallback(
    (t: Track) => {
      const prev = t.cluster_confidence;
      void mutate(
        `conf:${t.id}`,
        () => patchTrack(t.id, { cluster_confidence: "confirmed" }),
        () => patchTrack(t.id, { cluster_confidence: prev }),
        () => confirmCluster(t.id),
        "Bevestiging",
      );
    },
    [mutate, patchTrack],
  );

  /** "Uitgezocht": haal de versie uit de Uitzoeken-categorie. */
  const doResolve = useCallback(
    (t: Track) => {
      const prev = t.status;
      const target = (t.file_size_bytes ?? 0) > NABEWERKT_BYTES ? "alternative" : "alternative";
      void mutate(
        `status:${t.id}`,
        () => patchTrack(t.id, { status: target, cluster_confidence: "confirmed" }),
        () => patchTrack(t.id, { status: prev }),
        () => setTrackStatus(t.id, target),
        "Status",
      );
    },
    [mutate, patchTrack],
  );

  const toggleOpen = useCallback((key: string): void => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const openLyrics = useCallback(async (title: string, opener: HTMLElement): Promise<void> => {
    const seq = ++lyricsReq.current;
    openerRef.current = opener;
    setLyricsFor(title);
    setLyricsLoading(true);
    setLyricsError(null);
    setLyrics([]);
    try {
      const rows = await listLyrics(title);
      if (seq === lyricsReq.current) setLyrics(rows);
    } catch (e) {
      if (seq === lyricsReq.current) setLyricsError(e instanceof Error ? e.message : "Songteksten laden mislukt");
    } finally {
      if (seq === lyricsReq.current) setLyricsLoading(false);
    }
  }, []);

  // Dialog-gedrag: ESC sluit, focus naar de sluitknop, focus terug bij sluiten,
  // achtergrond niet scrollbaar.
  useEffect(() => {
    if (!lyricsFor) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLyricsFor(null); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      openerRef.current?.focus();
    };
  }, [lyricsFor]);

  const copyLyric = useCallback(async (l: LyricVersion): Promise<void> => {
    try {
      await navigator.clipboard.writeText(l.content);
      setCopiedId(l.id);
      window.setTimeout(() => setCopiedId((c) => (c === l.id ? null : c)), 2000);
    } catch {
      setWriteError("Kopiëren naar klembord geweigerd door de browser.");
    }
  }, []);

  if (loading) return <main className="main"><p className="mp-dim">Catalogus laden…</p></main>;
  if (error) {
    return (
      <main className="main">
        <div className="mc-notice mc-notice--error" role="alert">
          {error}{" "}
          <button type="button" className="mp-mini-btn" onClick={refresh}>Opnieuw proberen</button>
        </div>
      </main>
    );
  }

  return (
    <main className="main mp-main">
      <header className="mp-head">
        <div>
          <h1 className="manage-h">Productie<em>.</em></h1>
          <p className="mp-dim">
            {stats.songs} nummers · {stats.versies} versies · {stats.fav} favoriet · {stats.proc} nabewerkt ·{" "}
            {stats.rev > 0 ? <strong>{stats.rev} uitzoeken</strong> : "0 uitzoeken"}
          </p>
        </div>
        <div className="mp-controls">
          <div className="mp-tabs">
            {(["alle", "favorieten", "uitzoeken"] as TopFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={topFilter === f}
                data-active={topFilter === f || undefined}
                onClick={() => updatePrefs({ filter: f })}
              >
                {f === "alle" ? "Alle" : f === "favorieten" ? "Favorieten" : `Uitzoeken${stats.rev ? ` (${stats.rev})` : ""}`}
              </button>
            ))}
          </div>
          <ColumnPicker
            visible={prefs.columns}
            saving={prefsSaving}
            onChange={(cols) => updatePrefs({ columns: cols })}
          />
          <input
            className="mp-search"
            aria-label="Zoek nummer of bestandsnaam"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek nummer…"
          />
        </div>
      </header>

      {writeError && (
        <div className="mc-notice mc-notice--error" role="alert">
          {writeError}{" "}
          <button type="button" className="mp-mini-btn" onClick={refresh}>Opnieuw laden</button>
        </div>
      )}

      <datalist id="mp-song-titles">
        {allTitles.map((t) => <option key={t} value={t} />)}
      </datalist>

      <div className="mp-list">
        {visible.map((g) => (
          <SongCard
            key={g.key}
            group={g}
            expanded={open.has(g.key)}
            titles={allTitles}
            columns={prefs.columns}
            sortBy={prefs.sortBy}
            sortDir={prefs.sortDir}
            onSort={onSort}
            onToggle={toggleOpen}
            onOpenLyrics={openLyrics}
            onToggleFavorite={toggleFavorite}
            onSaveUrl={saveUrl}
            onSongSaveUrl={saveSongUrl}
            onReassign={doReassign}
            onConfirm={doConfirm}
            onResolve={doResolve}
          />
        ))}
        {visible.length === 0 && (
          <p className="mp-dim">
            {tracks.length === 0
              ? "Nog geen tracks in de catalogus."
              : "Geen nummers die aan deze filter voldoen."}
          </p>
        )}
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
              role="dialog"
              aria-modal="true"
              aria-labelledby="mp-modal-title"
              initial={{ opacity: 0, y: 14, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.99 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <header className="mp-modal-h">
                <h2 id="mp-modal-title">{lyricsFor}</h2>
                <button
                  type="button"
                  className="mp-icon-btn"
                  ref={closeBtnRef}
                  onClick={() => setLyricsFor(null)}
                  aria-label="Songtekst sluiten"
                  title="Sluiten"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </header>
              {lyricsLoading ? (
                <p className="mp-dim">Songteksten laden…</p>
              ) : lyricsError ? (
                <div className="mc-notice mc-notice--error" role="alert">{lyricsError}</div>
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
                        {copiedId === l.id ? (
                          <><Check size={13} aria-hidden="true" /> Gekopieerd</>
                        ) : (
                          <><Copy size={13} aria-hidden="true" /> Copy</>
                        )}
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
