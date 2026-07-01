import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Ervaringen mode — experience bank CRUD (hvl_experience_bank).
 *
 * These are Hans's real, lived experiences. The gate-filler in the Auto
 * pipeline reads this table to fill [HANS:] gates with genuine stories —
 * never invented, only what's entered here.
 *
 * Left: story list + "Nieuw verhaal". Right: editable form. Writes straight
 * to Supabase. Delete is a soft-delete via archived_at.
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

export default function ExperienceMode() {
  const [rows, setRows] = useState<ExperienceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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
  }, []);

  const select = (r: ExperienceRow) => {
    if (dirty && !window.confirm("Niet-opgeslagen wijzigingen weggooien?")) return;
    setActiveId(r.id); setDraft({ ...r }); setDirty(false);
  };
  const createNew = () => {
    if (dirty && !window.confirm("Niet-opgeslagen wijzigingen weggooien?")) return;
    setActiveId(null); setDraft({ ...EMPTY }); setDirty(true);
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
      const list = await reload();
      const target = list.find((v) => v.id === savedId) ?? list[0] ?? null;
      setActiveId(target?.id ?? null);
      setDraft(target ? { ...target } : null);
      setDirty(false);
      flash("Verhaal opgeslagen");
    } catch {
      flash("Opslaan mislukt");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!draft?.id) return;
    if (!window.confirm("Dit verhaal verwijderen — kan niet ongedaan.")) return;
    await supabase.from("hvl_experience_bank").update({ archived_at: new Date().toISOString() }).eq("id", draft.id);
    const list = await reload();
    setActiveId(list[0]?.id ?? null);
    setDraft(list[0] ? { ...list[0] } : null);
    setDirty(false);
    flash("Verhaal verwijderd");
  };

  return (
    <div className="shell">
      <main className="main">
        <h1 className="manage-h">Ervaringen<em>.</em></h1>
        <p className="voice-stat">
          {loading ? "Laden…" : `${rows.length} verhaal${rows.length === 1 ? "" : "en"} in de bank`}
        </p>
        <p className="exp-help">
          Deze echte verhalen vullen de [HANS:] gates in de Auto-pipeline. Nooit verzonnen — alleen wat jij hier invoert.
        </p>

        <div className="voice-grid">
          {/* list */}
          <aside className="voice-list">
            <button type="button" className="voice-new" onClick={createNew}>
              <span>+ Nieuw verhaal</span><span className="kbd">⌘N</span>
            </button>
            {rows.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`voice-row ${activeId === r.id ? "active" : ""}`}
                onClick={() => select(r)}
              >
                <span className="vr-head">
                  <span className="vr-name">{r.client || r.theme || "Naamloos"}</span>
                  {r.theme && r.client && <span className="vr-tag">{snippet(r.theme, 18)}</span>}
                </span>
                <span className="vr-meta">{snippet(r.situation) || "(geen situatie)"}</span>
              </button>
            ))}
            {!loading && rows.length === 0 && <p className="voice-empty">Nog geen verhalen. Maak er één →</p>}
          </aside>

          {/* editor */}
          {draft && (
            <section className="voice-editor">
              <div className="ve-top">
                <div className="ve-titleblock">
                  <span className="ve-eyebrow">{draft.id ? "Verhaal bewerken" : "Nieuw verhaal"}</span>
                  <input
                    className="ve-name"
                    value={draft.client}
                    placeholder="Klant / opdrachtgever (bv. A.B.S. of intern)"
                    onChange={(e) => set("client", e.target.value)}
                  />
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

                <EField full label="Situatie" help="Wat speelde er. Verplicht — dit is de kern van het verhaal.">
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

                <EField full label="Metrics gemaskeerd" help="Zonder cijfers — het punt blijft overeind.">
                  <textarea rows={2} value={draft.metrics_masked} placeholder="bv. structurele margeverbetering binnen een kwartaal" onChange={(e) => set("metrics_masked", e.target.value)} />
                </EField>

                <EField full label="Les" help="Wat je eruit haalde — de geleerde les.">
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
                </EField>
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
