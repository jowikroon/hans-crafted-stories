import { useCallback, useEffect, useMemo, useState } from "react";
import {
  archiveRelease,
  isLocalFallback,
  listReleases,
  newRelease,
  saveRelease,
  setVisible,
  type MusicRelease,
  type ReleaseType,
} from "../lib/releaseStore";

type FilterTab = "all" | "visible" | "hidden";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDate(d: string): string {
  const p = d.split("-").map((x) => parseInt(x, 10));
  if (!p[0]) return d;
  if (p[1] && p[2]) return `${MON[p[1] - 1]} ${p[2]}, ${p[0]}`;
  if (p[1]) return `${MON[p[1] - 1]} ${p[0]}`;
  return `${p[0]}`;
}

export default function ReleasesMode() {
  const [releases, setReleases] = useState<MusicRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<MusicRelease | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchReleases = useCallback(async () => {
    try {
      setReleases(await listReleases());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kon releases niet laden");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  const counts = useMemo(() => {
    const c = { all: releases.length, visible: 0, hidden: 0 };
    for (const r of releases) r.visible ? c.visible++ : c.hidden++;
    return c;
  }, [releases]);

  const filtered = useMemo(() => {
    return releases.filter((r) => {
      if (filter === "visible" && !r.visible) return false;
      if (filter === "hidden" && r.visible) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.genre.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [releases, filter, search]);

  const toggleVisible = async (e: React.MouseEvent, r: MusicRelease) => {
    e.stopPropagation();
    // optimistic
    setReleases((list) => list.map((x) => (x.id === r.id ? { ...x, visible: !x.visible } : x)));
    try {
      await setVisible(r.id, !r.visible);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Toggle mislukt");
      fetchReleases();
    }
  };

  const remove = async (e: React.MouseEvent, r: MusicRelease) => {
    e.stopPropagation();
    if (!window.confirm(`"${r.title || "(zonder titel)"}" van de timeline verwijderen?`)) return;
    await archiveRelease(r.id);
    fetchReleases();
  };

  const startNew = () => setEditing(newRelease());

  const commit = async () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      setError("Titel is verplicht");
      return;
    }
    setSaving(true);
    try {
      await saveRelease(editing);
      setEditing(null);
      setError(null);
      await fetchReleases();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="main manage-main">
      <h1 className="manage-h">Releases<em>.</em></h1>
      <div className="manage-stats">
        <strong>{counts.all}</strong> releases
        <span className="sep">·</span>
        <strong>{counts.visible}</strong> zichtbaar
        <span className="sep">·</span>
        <strong>{counts.hidden}</strong> verborgen
        {loading && (
          <>
            <span className="sep">·</span>
            <span style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 11 }}>loading…</span>
          </>
        )}
      </div>

      <p className="mc-rail-note" style={{ maxWidth: 620 }}>
        Dit is de discografie-timeline op <code>/music</code>. Verborgen releases verdwijnen van de publieke
        pagina — gebruik dat voor nummers die nog niet officieel uit zijn. <code>slug</code> koppelt aan de
        detailpagina <code>/music/&lt;slug&gt;</code>.
      </p>

      {isLocalFallback() && (
        <div className="mc-notice">
          De tabel <code>music_releases</code> bestaat nog niet in Supabase — releases worden lokaal (in deze
          browser) bewaard. Draai <code>supabase/migrations-draft/music_releases.sql</code> om ze centraal op te
          slaan.
        </div>
      )}
      {error && <div className="mc-notice mc-notice--error">{error}</div>}

      <div className="alt-actions">
        <button className="alt-action" onClick={startNew}>Nieuwe release →</button>
        <span className="alt-action-meta">oudste bovenaan · verborgen = niet op de publieke timeline</span>
      </div>

      <div className="posts-wrap" style={{ marginTop: "var(--s-5)" }}>
        <div className="posts-toolbar">
          <div className="filter-tabs">
            <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>
              Alle <span style={{ opacity: 0.5, marginLeft: 4 }}>{counts.all}</span>
            </button>
            <button className={filter === "visible" ? "on" : ""} onClick={() => setFilter("visible")}>
              Zichtbaar <span style={{ opacity: 0.5, marginLeft: 4 }}>{counts.visible}</span>
            </button>
            <button className={filter === "hidden" ? "on" : ""} onClick={() => setFilter("hidden")}>
              Verborgen <span style={{ opacity: 0.5, marginLeft: 4 }}>{counts.hidden}</span>
            </button>
          </div>
          <span className="search-mini">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input type="text" placeholder="Filter releases…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </span>
          <div className="grow" />
        </div>
        <table className="posts-table">
          <thead>
            <tr>
              <th>Titel</th>
              <th className="num">Datum</th>
              <th>Type</th>
              <th>Genre</th>
              <th>Zichtbaar</th>
              <th className="num" aria-label="acties" />
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: "48px 0",
                    color: "var(--ink-3)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Geen releases — voeg er een toe
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr
                key={r.id}
                onClick={() => setEditing(r)}
                style={{ cursor: "pointer", opacity: r.visible ? 1 : 0.55 }}
              >
                <td className="title">
                  {r.title || "(zonder titel)"}
                  <small>{r.note ? r.note.slice(0, 64) : r.slug ? `/music/${r.slug}` : "—"}</small>
                </td>
                <td className="num" style={{ color: "var(--ink-2)" }}>{fmtDate(r.release_date)}</td>
                <td className="cat">{r.type}</td>
                <td className="cat">{r.genre || "—"}</td>
                <td>
                  <button
                    type="button"
                    className={`mc-switch${r.visible ? " on" : ""}`}
                    role="switch"
                    aria-checked={r.visible}
                    aria-label={r.visible ? "Zichtbaar — klik om te verbergen" : "Verborgen — klik om te tonen"}
                    onClick={(e) => toggleVisible(e, r)}
                  >
                    <span className="mc-switch__dot" />
                    <span className="mc-switch__txt">{r.visible ? "Zichtbaar" : "Verborgen"}</span>
                  </button>
                </td>
                <td className="num">
                  <button className="mc-row-del" onClick={(e) => remove(e, r)} aria-label="Verwijder release">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <ReleaseEditor
          value={editing}
          saving={saving}
          onChange={setEditing}
          onCancel={() => { setEditing(null); setError(null); }}
          onSave={commit}
        />
      )}
    </main>
  );
}

function ReleaseEditor({
  value,
  saving,
  onChange,
  onCancel,
  onSave,
}: {
  value: MusicRelease;
  saving: boolean;
  onChange: (r: MusicRelease) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const set = <K extends keyof MusicRelease>(k: K, v: MusicRelease[K]) => onChange({ ...value, [k]: v });

  return (
    <div className="mc-editor-scrim" onClick={onCancel}>
      <div className="mc-editor" role="dialog" aria-modal="true" aria-label="Release bewerken" onClick={(e) => e.stopPropagation()}>
        <div className="mc-editor__head">
          <h2>{value.title.trim() ? value.title : "Nieuwe release"}</h2>
          <button className="mc-editor__x" onClick={onCancel} aria-label="Sluiten">✕</button>
        </div>

        <div className="mc-editor__grid">
          <label className="mc-fld mc-fld--wide">
            <span className="mc-label">Titel</span>
            <input className="mc-input" type="text" value={value.title} placeholder="bv. Northern Lights"
              onChange={(e) => set("title", e.target.value)} />
          </label>

          <label className="mc-fld">
            <span className="mc-label">Release-datum</span>
            <input className="mc-input" type="date" value={value.release_date}
              onChange={(e) => set("release_date", e.target.value)} />
          </label>

          <label className="mc-fld">
            <span className="mc-label">Type</span>
            <select className="mc-input" value={value.type}
              onChange={(e) => set("type", e.target.value as ReleaseType)}>
              <option>Single</option>
              <option>EP</option>
              <option>Album</option>
            </select>
          </label>

          <label className="mc-fld">
            <span className="mc-label">Genre</span>
            <input className="mc-input" type="text" value={value.genre} placeholder="bv. Electronic"
              onChange={(e) => set("genre", e.target.value)} />
          </label>

          <label className="mc-fld">
            <span className="mc-label">Slug <small>(→ /music/…)</small></span>
            <input className="mc-input" type="text" value={value.slug} placeholder="bv. northern-lights"
              onChange={(e) => set("slug", e.target.value.trim())} />
          </label>

          <label className="mc-fld">
            <span className="mc-label">Lengte <small>(optioneel)</small></span>
            <input className="mc-input" type="text" value={value.dur ?? ""} placeholder="bv. 3:42"
              onChange={(e) => set("dur", e.target.value)} />
          </label>

          <label className="mc-fld">
            <span className="mc-label">Tracks <small>(EP/album)</small></span>
            <input className="mc-input" type="number" min={0} value={value.tracks ?? ""} placeholder="—"
              onChange={(e) => set("tracks", e.target.value === "" ? null : Number(e.target.value))} />
          </label>

          <label className="mc-fld mc-fld--wide">
            <span className="mc-label">Cover-URL <small>(optioneel)</small></span>
            <input className="mc-input" type="text" value={value.cover ?? ""} placeholder="https://…"
              onChange={(e) => set("cover", e.target.value)} />
          </label>

          <label className="mc-fld mc-fld--wide">
            <span className="mc-label">Notitie <small>(korte omschrijving onder de titel)</small></span>
            <textarea className="mc-input mc-input--area" rows={2} value={value.note ?? ""}
              placeholder="bv. Where it started…"
              onChange={(e) => set("note", e.target.value)} />
          </label>

          <div className="mc-fld mc-fld--row">
            <button
              type="button"
              className={`mc-switch${value.visible ? " on" : ""}`}
              role="switch"
              aria-checked={value.visible}
              onClick={() => set("visible", !value.visible)}
            >
              <span className="mc-switch__dot" />
              <span className="mc-switch__txt">{value.visible ? "Zichtbaar op /music" : "Verborgen"}</span>
            </button>
            <label className="mc-check">
              <input type="checkbox" checked={value.video} onChange={(e) => set("video", e.target.checked)} />
              Music video
            </label>
          </div>
        </div>

        <div className="mc-editor__foot">
          <button className="stamp-btn stamp-btn--ghost stamp-btn--sm" onClick={onCancel} disabled={saving}>Annuleren</button>
          <button className="stamp-btn stamp-btn--sm" onClick={onSave} disabled={saving}>
            {saving ? "Opslaan…" : "Opslaan"}
          </button>
        </div>
      </div>
    </div>
  );
}
