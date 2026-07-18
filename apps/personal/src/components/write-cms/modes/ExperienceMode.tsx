import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Ervaringen mode v2 — experience bank (hvl_experience_bank) with a
 * BJ Fogg behaviour layer (B = MAP). Every Fogg axis gets exactly one
 * clear on-page element:
 *
 *  - Motivation: Bank Pulse (gate-dekking %) + 4/4 completeness celebration.
 *  - Ability:    Quick Capture ("één zin is genoeg", ⌘↵) + granular
 *                completeness dots 0–4 — half af is oké.
 *  - Prompt:     gate-honger nudge with one-tap prefill + the Zeigarnik
 *                "onvolledig" filter that pulls you back to open loops.
 *
 * Doctrine: these are Hans's real, lived experiences. The gate-filler in
 * the Auto pipeline reads this table to fill [HANS:] gates with genuine
 * stories — never invented. Deliberately NO AI writing help in story
 * fields; tag suggestions are deterministic keyword extraction.
 *
 * Left: story list + capture + filters. Right: editable form. Writes
 * straight to Supabase. Delete is a soft-delete via archived_at.
 * Mobile (≤720px): one-panel flow with a sticky save-bar.
 */

interface ExperienceRow {
  id: string;
  client: string;
  theme: string;
  gate_type: string;
  situation: string;
  metrics: string;
  lesson: string;
  tags: string[];
  category: string;
  client_masked: string;
  metrics_general: string;
  metrics_masked: string;
}

type Draft = Omit<ExperienceRow, "id"> & { id?: string };

const GATE_TYPES = ["ervaring", "analyse", "nuance", "conclusie", "context", "algemeen"] as const;
const CATEGORIES = ["professional", "technical", "general"] as const;

const EMPTY: Draft = {
  client: "", theme: "", gate_type: "ervaring", situation: "",
  metrics: "", lesson: "", tags: [], category: "professional",
  client_masked: "", metrics_general: "", metrics_masked: "",
};

const SELECT = "id, client, theme, gate_type, situation, metrics, lesson, tags, category, client_masked, metrics_general, metrics_masked";

const norm = (r: Record<string, unknown>): ExperienceRow => ({
  id: String(r.id),
  client: (r.client as string) ?? "",
  theme: (r.theme as string) ?? "",
  gate_type: (r.gate_type as string) ?? "algemeen",
  situation: (r.situation as string) ?? "",
  metrics: (r.metrics as string) ?? "",
  lesson: (r.lesson as string) ?? "",
  tags: (r.tags as string[]) ?? [],
  category: (r.category as string) ?? "professional",
  client_masked: (r.client_masked as string) ?? "",
  metrics_general: (r.metrics_general as string) ?? "",
  metrics_masked: (r.metrics_masked as string) ?? "",
});

const snippet = (s: string, n = 80) => (s.length > n ? `${s.slice(0, n)}…` : s);

/** Fogg ability axis: completeness is granular — a half-finished story counts. */
const completeness = (r: Pick<Draft, "situation" | "metrics" | "lesson" | "tags">): number =>
  [r.situation.trim(), r.metrics.trim(), r.lesson.trim()].filter(Boolean).length +
  (r.tags.length > 0 ? 1 : 0);

/** Deterministic keyword extraction for tag suggestions — no AI, nothing invented. */
const STOPWORDS = new Set([
  "aan", "alle", "alleen", "als", "bij", "daar", "dan", "dat", "deze", "die", "dit", "door", "dus",
  "een", "en", "er", "geen", "haar", "heb", "hebben", "heeft", "het", "hier", "hij", "hoe", "ik",
  "in", "is", "je", "kan", "kon", "maar", "meer", "met", "mijn", "naar", "niet", "nog", "nu", "om",
  "onder", "ons", "ook", "op", "over", "te", "toen", "tot", "uit", "van", "veel", "voor", "waar",
  "want", "was", "wat", "we", "weer", "wel", "werd", "werden", "wij", "worden", "wordt", "zijn",
  "zich", "zo", "zou", "and", "are", "been", "for", "from", "had", "has", "have", "that", "the",
  "this", "was", "were", "with", "you",
]);

const suggestTags = (d: Pick<Draft, "theme" | "situation" | "lesson" | "tags">): string[] => {
  const text = `${d.theme} ${d.situation} ${d.lesson}`.toLowerCase();
  const words = text
    .split(/[^a-z0-9à-ÿ]+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
  const freq = new Map<string, number>();
  words.forEach((w) => freq.set(w, (freq.get(w) ?? 0) + 1));
  const existing = new Set(d.tags.map((t) => t.toLowerCase()));
  return Array.from(freq.entries())
    .filter(([w]) => !existing.has(w))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 4)
    .map(([w]) => w);
};

function Dots({ n, sm }: { n: number; sm?: boolean }) {
  return (
    <span
      className={`exp-dots ${sm ? "exp-dots--sm" : ""}`}
      role="img"
      aria-label={`${n} van 4 velden ingevuld`}
    >
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={`exp-dot ${i < n ? "on" : ""}`} />
      ))}
    </span>
  );
}

export default function ExperienceMode() {
  const [rows, setRows] = useState<ExperienceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // v2 behaviour layer state
  const [query, setQuery] = useState("");
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);
  const [capture, setCapture] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [mView, setMView] = useState<"list" | "editor">("list");

  const flash = (m: string) => { setToast(m); window.setTimeout(() => setToast(null), 2400); };

  const reload = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("hvl_experience_bank")
      .select(SELECT)
      .is("archived_at", null)
      .order("created_at", { ascending: false });
    const list = (data ?? []).map(norm);
    setRows(list);
    setLoading(false);
    return list;
  };

  useEffect(() => {
    reload().then((l) => {
      if (l.length) { setActiveId(l[0].id); setDraft({ ...l[0] }); }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Bank Pulse: gate-dekking (motivatie) ---------- */
  const gateCounts = useMemo(() => {
    const m = new Map<string, number>();
    GATE_TYPES.forEach((g) => m.set(g, 0));
    rows.forEach((r) => m.set(r.gate_type, (m.get(r.gate_type) ?? 0) + 1));
    return m;
  }, [rows]);
  const covered = GATE_TYPES.filter((g) => (gateCounts.get(g) ?? 0) > 0).length;
  const pulsePct = Math.round((covered / GATE_TYPES.length) * 100);
  const hungryGate = GATE_TYPES.find((g) => (gateCounts.get(g) ?? 0) === 0) ?? null;

  /* ---------- Zeigarnik-filter + zoeken (prompt) ---------- */
  const incompleteCount = useMemo(() => rows.filter((r) => completeness(r) < 4).length, [rows]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (onlyIncomplete && completeness(r) >= 4) return false;
      if (!q) return true;
      return [r.client, r.theme, r.situation, r.lesson, r.gate_type, r.tags.join(" ")]
        .join(" ").toLowerCase().includes(q);
    });
  }, [rows, query, onlyIncomplete]);

  const tagSuggestions = useMemo(() => (draft ? suggestTags(draft) : []), [draft]);
  const draftC = draft ? completeness(draft) : 0;

  const select = (r: ExperienceRow) => {
    if (dirty && !window.confirm("Niet-opgeslagen wijzigingen weggooien?")) return;
    setActiveId(r.id); setDraft({ ...r }); setDirty(false); setMView("editor");
  };
  const createNew = (gate?: string) => {
    if (dirty && !window.confirm("Niet-opgeslagen wijzigingen weggooien?")) return;
    setActiveId(null);
    setDraft({ ...EMPTY, gate_type: gate ?? EMPTY.gate_type });
    setDirty(true); setMView("editor");
  };
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => (d ? { ...d, [k]: v } : d)); setDirty(true);
  };

  const save = async () => {
    if (!draft || !draft.situation.trim()) { flash("Situatie is verplicht"); return; }
    setSaving(true);
    try {
      const payload = {
        client: draft.client.trim(),
        theme: draft.theme.trim(),
        gate_type: draft.gate_type,
        situation: draft.situation.trim(),
        metrics: draft.metrics,
        lesson: draft.lesson,
        tags: draft.tags,
        category: draft.category,
        client_masked: draft.client_masked.trim() || null,
        metrics_general: draft.metrics_general.trim() || null,
        metrics_masked: draft.metrics_masked.trim() || null,
      };
      let savedId = draft.id;
      if (draft.id) {
        await supabase.from("hvl_experience_bank").update(payload).eq("id", draft.id);
      } else {
        const { data } = await supabase.from("hvl_experience_bank").insert(payload).select("id").single();
        savedId = (data as { id: string } | null)?.id;
      }
      const c = completeness(draft);
      const list = await reload();
      const target = list.find((v) => v.id === savedId) ?? list[0] ?? null;
      setActiveId(target?.id ?? null);
      setDraft(target ? { ...target } : null);
      setDirty(false);
      flash(c === 4 ? "4/4, verhaal compleet ✓" : "Verhaal opgeslagen");
    } catch {
      flash("Opslaan mislukt");
    } finally {
      setSaving(false);
    }
  };

  /* Quick Capture — één zin is genoeg; afmaken kan altijd later. */
  const quickCapture = async () => {
    const text = capture.trim();
    if (!text || capturing) return;
    setCapturing(true);
    try {
      await supabase.from("hvl_experience_bank").insert({
        client: "", theme: "", gate_type: hungryGate ?? "ervaring",
        situation: text, metrics: "", lesson: "", tags: [],
        category: "professional",
        client_masked: null, metrics_general: null, metrics_masked: null,
      });
      setCapture("");
      const list = await reload();
      if (list[0]) { setActiveId(list[0].id); if (!dirty) setDraft({ ...list[0] }); }
      flash("Gevangen als 1/4, afmaken kan later");
    } catch {
      flash("Vangen mislukt");
    } finally {
      setCapturing(false);
    }
  };

  const remove = async () => {
    if (!draft?.id) return;
    if (!window.confirm("Dit verhaal verwijderen, kan niet ongedaan.")) return;
    await supabase.from("hvl_experience_bank").update({ archived_at: new Date().toISOString() }).eq("id", draft.id);
    const list = await reload();
    setActiveId(list[0]?.id ?? null);
    setDraft(list[0] ? { ...list[0] } : null);
    setDirty(false); setMView("list");
    flash("Verhaal verwijderd");
  };

  /* Keyboard: ⌘N nieuw verhaal, ⌘↵ opslaan (Quick Capture regelt z'n eigen ↵). */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key.toLowerCase() === "n") { e.preventDefault(); createNew(); }
      if (e.key === "Enter") {
        const el = document.activeElement;
        if (el instanceof HTMLElement && el.id === "exp-capture-input") return;
        if (dirty && draft) { e.preventDefault(); void save(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="shell shell--single">
      <main className="main">
        <h1 className="manage-h">Ervaringen<em>.</em></h1>
        <p className="voice-stat">
          {loading
            ? "Laden…"
            : <>{rows.length} verhaal{rows.length === 1 ? "" : "en"} in de bank{incompleteCount > 0 && <> · <strong>{incompleteCount} onvolledig</strong></>}</>}
        </p>
        <p className="exp-help">
          Deze echte verhalen vullen de [HANS:] gates in de Auto-pipeline. Nooit verzonnen, alleen wat jij hier invoert.
        </p>

        {/* Bank Pulse, motivatie: dekking van de zes gate-types */}
        <div className="exp-pulse" role="group" aria-label="Bank Pulse: gate-dekking">
          <span className="exp-pulse-pct">{pulsePct}%</span>
          <div className="exp-pulse-meta">
            <span className="exp-pulse-label">gate-dekking · {covered}/{GATE_TYPES.length} gates</span>
            <div className="exp-pulse-bar"><span style={{ width: `${pulsePct}%` }} /></div>
          </div>
          <div className="exp-pulse-gates">
            {GATE_TYPES.map((g) => {
              const c = gateCounts.get(g) ?? 0;
              return (
                <button
                  key={g}
                  type="button"
                  className={`exp-gate-chip ${c === 0 ? "hungry" : ""}`}
                  title={c === 0 ? `Nog geen verhaal voor '${g}', tik om er één te starten` : `${c} verhaal${c === 1 ? "" : "en"} · nieuw verhaal voor '${g}'`}
                  onClick={() => createNew(g)}
                >
                  {g} · {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gate-honger nudge, prompt met one-tap prefill */}
        {!loading && hungryGate && (
          <div className="exp-nudge">
            <span className="exp-nudge-txt">
              De <strong>‘{hungryGate}’</strong>-gate heeft honger, nog geen verhaal dat hem kan vullen.
            </span>
            <button type="button" className="exp-nudge-btn" onClick={() => createNew(hungryGate)}>
              + Verhaal voor ‘{hungryGate}’
            </button>
          </div>
        )}

        <div className={`voice-grid exp-grid ${mView === "editor" ? "m-editor" : "m-list"}`}>
          {/* list */}
          <aside className="voice-list">
            {/* Quick Capture, ability: één zin is genoeg */}
            <div className="exp-capture">
              <input
                id="exp-capture-input"
                value={capture}
                placeholder="Eén zin is genoeg, vang &#39;m nu…"
                aria-label="Quick capture: sla een verhaal op met één zin"
                onChange={(e) => setCapture(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void quickCapture(); } }}
              />
              <button
                type="button"
                className="exp-capture-go"
                disabled={!capture.trim() || capturing}
                onClick={() => void quickCapture()}
              >
                {capturing ? "…" : "Vang"}<span className="kbd">⌘↵</span>
              </button>
            </div>

            <button type="button" className="voice-new" onClick={() => createNew()}>
              <span>+ Nieuw verhaal</span><span className="kbd">⌘N</span>
            </button>

            {/* Zoek + Zeigarnik "onvolledig"-filter */}
            <div className="exp-tools">
              <input
                type="search"
                className="exp-search"
                value={query}
                placeholder="Zoek in de bank…"
                aria-label="Zoek in verhalen"
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="button"
                className={`exp-filter ${onlyIncomplete ? "on" : ""}`}
                aria-pressed={onlyIncomplete}
                title="Toon alleen onvolledige verhalen (minder dan 4/4)"
                onClick={() => setOnlyIncomplete((v) => !v)}
              >
                Onvolledig{incompleteCount > 0 ? ` · ${incompleteCount}` : ""}
              </button>
            </div>

            {visible.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`voice-row ${activeId === r.id ? "active" : ""}`}
                onClick={() => select(r)}
              >
                <span className="vr-head">
                  <span className="vr-name">{r.client || r.theme || "Naamloos"}</span>
                  <Dots n={completeness(r)} sm />
                </span>
                <span className="vr-meta">
                  <span className="exp-row-gate">{r.gate_type}</span>
                  {snippet(r.situation, 64) || "(geen situatie)"}
                </span>
              </button>
            ))}
            {!loading && rows.length === 0 && <p className="voice-empty">Nog geen verhalen. Vang er één hierboven →</p>}
            {!loading && rows.length > 0 && visible.length === 0 && (
              <p className="voice-empty">Niets gevonden{onlyIncomplete ? ", alles is compleet ✓" : ""}.</p>
            )}
          </aside>

          {/* editor */}
          {draft && (
            <section className="voice-editor">
              <div className="ve-top">
                <div className="ve-titleblock">
                  <button type="button" className="exp-back" onClick={() => setMView("list")}>← Terug naar de bank</button>
                  <span className="ve-eyebrow">{draft.id ? "Verhaal bewerken" : "Nieuw verhaal"}</span>
                  <input
                    className="ve-name"
                    value={draft.client}
                    placeholder="Klant / opdrachtgever (bv. A.B.S. of intern)"
                    onChange={(e) => set("client", e.target.value)}
                  />
                  <div className="exp-complete" aria-live="polite">
                    <Dots n={draftC} />
                    <span className="exp-complete-l">{draftC}/4 velden, half af is oké</span>
                    {draftC === 4 && <span className="exp-complete-badge">Compleet ✓</span>}
                  </div>
                </div>
                <div className="ve-actions">
                  {draft.id && (
                    <button className="stamp-btn stamp-btn--ghost stamp-btn--sm ve-danger" onClick={remove}>Verwijderen</button>
                  )}
                  <button className="stamp-btn stamp-btn--sm" disabled={!dirty || saving} onClick={save}>
                    {saving ? "Opslaan…" : dirty ? "Opslaan" : "Opgeslagen"}
                  </button>
                </div>
              </div>

              <div className="ve-form">
                <EField label="Thema" help="Waar gaat dit verhaal over.">
                  <input value={draft.theme} placeholder="bv. Buy Box prijsoorlog" onChange={(e) => set("theme", e.target.value)} />
                </EField>

                <EField label="Gate type" help="Welk soort [HANS:] gate dit verhaal kan vullen.">
                  <select value={draft.gate_type} onChange={(e) => set("gate_type", e.target.value)}>
                    {GATE_TYPES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </EField>

                <EField full label="Situatie" help="Wat speelde er. Verplicht, dit is de kern van het verhaal.">
                  <textarea rows={5} value={draft.situation} placeholder="Beschrijf concreet wat er gebeurde…" onChange={(e) => set("situation", e.target.value)} />
                </EField>

                <EField full label="Metrics" help="Harde cijfers: omzet, marge, %, tijd.">
                  <textarea rows={3} value={draft.metrics} placeholder="bv. marge van 28% naar 34% in 6 weken" onChange={(e) => set("metrics", e.target.value)} />
                </EField>

                <EField label="Klant gemaskeerd" help={'Publieke variant van de klantnaam (bv. "een Europees consumentenmerk").'}>
                  <input value={draft.client_masked} placeholder="bv. een Nederlandse retailer" onChange={(e) => set("client_masked", e.target.value)} />
                </EField>

                <EField full label="Metrics algemeen" help="Afgerond/gegeneraliseerd maar nog kwantitatief.">
                  <textarea rows={2} value={draft.metrics_general} placeholder="bv. marge enkele procentpunten omhoog in weken" onChange={(e) => set("metrics_general", e.target.value)} />
                </EField>

                <EField full label="Metrics gemaskeerd" help="Zonder cijfers, het punt blijft overeind.">
                  <textarea rows={2} value={draft.metrics_masked} placeholder="bv. structurele margeverbetering binnen een kwartaal" onChange={(e) => set("metrics_masked", e.target.value)} />
                </EField>

                <EField full label="Les" help="Wat je eruit haalde, de geleerde les.">
                  <textarea rows={3} value={draft.lesson} placeholder="bv. niet de prijs maar de levertijd won de Buy Box" onChange={(e) => set("lesson", e.target.value)} />
                </EField>

                <EField label="Category" help="Soort verhaal.">
                  <select value={draft.category} onChange={(e) => set("category", e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </EField>

                <EField label="Tags" help="Komma-gescheiden. Helpt de gate-filler matchen.">
                  <input
                    value={draft.tags.join(", ")}
                    placeholder="amazon, buy box, pricing"
                    onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
                  />
                  {tagSuggestions.length > 0 && (
                    <div className="exp-tag-suggest" aria-label="Tag-suggesties, deterministische keyword-extractie, geen AI">
                      <span className="exp-tag-suggest-l">Suggesties</span>
                      {tagSuggestions.map((t) => (
                        <button key={t} type="button" className="exp-tag-chip" onClick={() => set("tags", [...draft.tags, t])}>
                          + {t}
                        </button>
                      ))}
                    </div>
                  )}
                </EField>
              </div>

              {/* Mobiel: sticky save-bar */}
              <div className="exp-savebar">
                <Dots n={draftC} />
                <span className="exp-savebar-state">{saving ? "Opslaan…" : dirty ? "Niet opgeslagen" : "Opgeslagen ✓"}</span>
                <button className="stamp-btn stamp-btn--sm" disabled={!dirty || saving} onClick={save}>
                  {saving ? "Opslaan…" : "Opslaan"}
                </button>
              </div>
            </section>
          )}
        </div>
      </main>

      {toast && <div className="voice-toast">{toast}</div>}
    </div>
  );
}

function EField({ label, help, full, children }: { label: string; help: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`ve-field ${full ? "full" : ""}`}>
      <span className="ve-label">{label}</span>
      <span className="ve-help">{help}</span>
      <div className="ve-input">{children}</div>
    </div>
  );
}
