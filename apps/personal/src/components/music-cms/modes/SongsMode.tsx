import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteSong, isLocalFallback, listSongs, newSong, saveSong, type Song } from "../lib/songStore";
import { getTemplate } from "../voiceTemplates";

type FilterTab = "all" | "draft" | "published";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 24) return diffH <= 1 ? "1h" : `${diffH}h`;
  const diffD = Math.floor(diffMs / 86400000);
  if (diffD < 7) return `${diffD}d`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function SongsMode() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchSongs = useCallback(async () => {
    try {
      setSongs(await listSongs());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kon songs niet laden");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  const counts = useMemo(() => {
    const c = { all: songs.length, draft: 0, published: 0 };
    for (const s of songs) {
      if (s.status === "published") c.published++;
      else c.draft++;
    }
    return c;
  }, [songs]);

  const filtered = useMemo(() => {
    return songs.filter((s) => {
      if (filter === "published" && s.status !== "published") return false;
      if (filter === "draft" && s.status === "published") return false;
      if (search) {
        const q = search.toLowerCase();
        const tpl = getTemplate(s.template_id);
        return (
          s.title.toLowerCase().includes(q) ||
          s.theme.toLowerCase().includes(q) ||
          (tpl ? `${tpl.artist} ${tpl.name}`.toLowerCase().includes(q) : false)
        );
      }
      return true;
    });
  }, [songs, filter, search]);

  const startNew = async () => {
    const song = await saveSong(newSong());
    navigate(`/music-cms/${song.id}`);
  };

  const remove = async (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    if (!window.confirm(`"${song.title || "(Zonder titel)"}" verwijderen?`)) return;
    await deleteSong(song.id);
    fetchSongs();
  };

  return (
    <main className="main manage-main">
      <h1 className="manage-h">Songs<em>.</em></h1>
      <div className="manage-stats">
        <strong>{counts.all}</strong> songs
        <span className="sep">·</span>
        <strong>{counts.published}</strong> published
        <span className="sep">·</span>
        <strong>{counts.draft}</strong> drafts
        {loading && (
          <>
            <span className="sep">·</span>
            <span style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 11 }}>loading…</span>
          </>
        )}
      </div>

      {isLocalFallback() && (
        <div className="mc-notice">
          De tabel <code>music_songs</code> bestaat nog niet in Supabase — songs worden lokaal (in deze browser)
          bewaard. Draai <code>supabase/migrations-draft/music_cms.sql</code> om ze centraal op te slaan.
        </div>
      )}
      {error && <div className="mc-notice mc-notice--error">{error}</div>}

      <div className="alt-actions">
        <button className="alt-action" onClick={startNew}>Nieuw nummer →</button>
        <span className="alt-action-meta">songwriter-werkblad · 8 artist voice templates · Master Prompt</span>
      </div>

      <div className="posts-wrap" style={{ marginTop: "var(--s-5)" }}>
        <div className="posts-toolbar">
          <div className="filter-tabs">
            <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>
              All <span style={{ opacity: 0.5, marginLeft: 4 }}>{counts.all}</span>
            </button>
            <button className={filter === "draft" ? "on" : ""} onClick={() => setFilter("draft")}>
              Draft <span style={{ opacity: 0.5, marginLeft: 4 }}>{counts.draft}</span>
            </button>
            <button className={filter === "published" ? "on" : ""} onClick={() => setFilter("published")}>
              Published <span style={{ opacity: 0.5, marginLeft: 4 }}>{counts.published}</span>
            </button>
          </div>
          <span className="search-mini">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input type="text" placeholder="Filter songs…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </span>
          <div className="grow" />
        </div>
        <table className="posts-table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Status</th>
              <th>Voice</th>
              <th className="num">Regels</th>
              <th className="num">Datum</th>
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
                  Nog geen songs — start een nieuw nummer
                </td>
              </tr>
            )}
            {filtered.map((s) => {
              const tpl = getTemplate(s.template_id);
              const lines = s.lyrics ? s.lyrics.split("\n").filter((l) => l.trim()).length : 0;
              return (
                <tr key={s.id} onClick={() => navigate(`/music-cms/${s.id}`)} style={{ cursor: "pointer" }}>
                  <td className="title">
                    {s.title || "(Zonder titel)"}
                    <small>{s.theme ? s.theme.slice(0, 60) : "—"}</small>
                  </td>
                  <td>
                    <span className={`posts-pill ${s.status === "published" ? "live" : "draft"}`}>
                      {s.status === "published" ? "published" : "draft"}
                    </span>
                  </td>
                  <td className="cat">{tpl ? tpl.name : "—"}</td>
                  <td className="num">{lines || "–"}</td>
                  <td className="num" style={{ color: "var(--ink-2)" }}>{formatDate(s.updated_at)}</td>
                  <td className="num">
                    <button className="mc-row-del" onClick={(e) => remove(e, s)} aria-label="Verwijder song">
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
