import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSong, isLocalFallback, newSong, saveSong, type Song } from "../lib/songStore";
import { VOICE_TEMPLATES, buildSongPrompt, getTemplate } from "../voiceTemplates";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

/**
 * Songwriter-werkblad: titel + thema + persoonlijke context, een selecteerbaar
 * artist voice template (8 stuks incl. Master Prompt), de gegenereerde
 * copy-paste prompt en de lyrics/deep-analysis editor met draft/published status.
 */
export default function SongwriterMode({ songId }: { songId?: string }) {
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(Boolean(songId));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [copied, setCopied] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const navigate = useNavigate();
  const copyTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!songId) {
        setSong(newSong());
        setLoading(false);
        return;
      }
      try {
        const found = await getSong(songId);
        if (!cancelled) setSong(found ?? newSong());
      } catch {
        if (!cancelled) setSong(newSong());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [songId]);

  const patch = useCallback((p: Partial<Song>) => {
    setSong((s) => (s ? { ...s, ...p } : s));
    setSaveState("dirty");
  }, []);

  const persist = useCallback(
    async (next?: Partial<Song>) => {
      if (!song) return;
      const row = { ...song, ...next };
      setSaveState("saving");
      try {
        const saved = await saveSong(row);
        setSong(saved);
        setSaveState("saved");
        if (!songId) navigate(`/music-cms/${saved.id}`, { replace: true });
      } catch {
        setSaveState("error");
      }
    },
    [song, songId, navigate],
  );

  const tpl = getTemplate(song?.template_id);
  const prompt = song && song.template_id ? buildSongPrompt(song.template_id, {
    title: song.title,
    theme: song.theme,
    sourceNotes: song.source_notes,
  }) : "";

  const copyPrompt = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (loading || !song) {
    return (
      <main className="main" style={{ display: "grid", placeItems: "center", minHeight: 400 }}>
        <span style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 12 }}>Laden…</span>
      </main>
    );
  }

  const isPublished = song.status === "published";

  return (
    <div className="shell">
      <main className="main">
        <section className="hero">
          <div className="hero-titleblock">
            <div className="eyebrow">
              <span className={`stage-pill ${isPublished ? "live" : ""}`}>{isPublished ? "published" : "draft"}</span>
              {tpl && (
                <>
                  <span className="sep">·</span>
                  <span>{tpl.artist} — {tpl.name}</span>
                </>
              )}
              {isLocalFallback() && (
                <>
                  <span className="sep">·</span>
                  <span>lokale draft (tabel ontbreekt)</span>
                </>
              )}
            </div>
            <h1 className="h-wordmark">Songwriter<em>.</em></h1>
            <input
              className="title-input"
              type="text"
              placeholder="Werktitel van het nummer"
              value={song.title}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </div>
          <div className="hero-actions">
            <button className="stamp-btn stamp-btn--ghost stamp-btn--sm" onClick={() => navigate("/music-cms")}>Songs</button>
            <button className="stamp-btn stamp-btn--ghost stamp-btn--sm" onClick={() => persist()}>
              {saveState === "saving" ? "Opslaan…" : saveState === "saved" ? "Opgeslagen ✓" : saveState === "error" ? "Opslaan mislukt — retry" : "Opslaan"}
            </button>
            <button
              className="stamp-btn"
              onClick={() => persist({ status: isPublished ? "draft" : "published" })}
            >
              {isPublished ? "Terug naar draft" : "Publish"}
            </button>
          </div>
        </section>

        {/* ── Werkblad: thema + persoonlijke context ── */}
        <div className="mc-worksheet">
          <label className="mc-label" htmlFor="mc-theme">Thema / opdracht</label>
          <textarea
            id="mc-theme"
            className="mc-textarea"
            rows={2}
            placeholder="Waar gaat het nummer over? (bv. de Amazon DE-lancering als odyssee)"
            value={song.theme}
            onChange={(e) => patch({ theme: e.target.value })}
          />
          <label className="mc-label" htmlFor="mc-notes">Persoonlijke context (vault / builds / chats)</label>
          <textarea
            id="mc-notes"
            className="mc-textarea"
            rows={4}
            placeholder="Plak hier de relevante feiten: technical builds, Hans vault-fragmenten, chatgeschiedenis…"
            value={song.source_notes}
            onChange={(e) => patch({ source_notes: e.target.value })}
          />
        </div>

        {/* ── Voice template picker ── */}
        <h2 className="mc-section-h">Voice template</h2>
        <div className="tpl-grid">
          {VOICE_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tpl-card${song.template_id === t.id ? " on" : ""}`}
              onClick={() => patch({ template_id: t.id })}
            >
              <span className="tpl-artist">{t.artist}</span>
              <span className="tpl-name">{t.name}</span>
              <span className="tpl-tagline">{t.tagline}</span>
            </button>
          ))}
        </div>

        {/* ── Lyrics editor ── */}
        <h2 className="mc-section-h">
          Lyrics
          <button className="mc-toggle" onClick={() => setShowAnalysis((v) => !v)}>
            {showAnalysis ? "verberg deep analysis" : "toon deep analysis"}
          </button>
        </h2>
        <div className="paper mc-paper">
          <textarea
            className="mc-lyrics"
            rows={18}
            placeholder={"[Couplet 1]\n…\n\n[Refrein]\n…"}
            value={song.lyrics}
            onChange={(e) => patch({ lyrics: e.target.value })}
          />
        </div>
        {showAnalysis && (
          <>
            <label className="mc-label" htmlFor="mc-analysis" style={{ marginTop: "var(--s-4)" }}>
              Deep analysis (het &lt;deep_analysis&gt; blok uit de AI-output)
            </label>
            <textarea
              id="mc-analysis"
              className="mc-textarea"
              rows={8}
              placeholder="Plak hier de deep_analysis van de gegenereerde versie ter referentie."
              value={song.deep_analysis}
              onChange={(e) => patch({ deep_analysis: e.target.value })}
            />
          </>
        )}
      </main>

      <aside className="rail">
        <h2 className="rail-h">Prompt<em>.</em></h2>
        <div className="card">
          <div className="card-head">
            Master Prompt
            <span>{tpl ? tpl.name : "kies template"}</span>
          </div>
          {tpl ? (
            <>
              <p className="mc-rail-note">{tpl.analysisInstruction}</p>
              <button className="stamp-btn stamp-btn--sm" style={{ width: "100%" }} onClick={copyPrompt}>
                {copied ? "Gekopieerd ✓" : "Kopieer volledige prompt"}
              </button>
              <pre className="mc-pre">{prompt}</pre>
            </>
          ) : (
            <p className="mc-rail-note">
              Selecteer een van de 8 voice templates om de volledige, copy-paste-klare prompt te genereren
              (Master Prompt + methodologie + jouw werkblad).
            </p>
          )}
        </div>
        {tpl && tpl.id !== "master_prompt" && (
          <div className="card">
            <div className="card-head">Methodologie<span>{tpl.artist}</span></div>
            <pre className="mc-pre mc-pre--method">{tpl.methodology}</pre>
          </div>
        )}
        <div className="card">
          <div className="card-head">Protocol<span>4 fasen</span></div>
          <ol className="mc-phases">
            <li>Extrapolatie van variabelen</li>
            <li>Sjabloon selectie</li>
            <li>Tree of Thoughts (deep research)</li>
            <li>Definitieve synthese</li>
          </ol>
        </div>
      </aside>
    </div>
  );
}
