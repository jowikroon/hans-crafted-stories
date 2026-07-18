import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Voice mode — full inline two-pane editor (list + form), folded into the
 * Command Center stramien (replaces the Phase-1 read-only list).
 *
 * Left: template list + "New voice". Right: every editable field of
 * hvl_voice_templates that drives drafting & review — tone, perspective,
 * audience, writing style, banned words, required elements, content rules,
 * opening/closing examples, category + default toggle.
 *
 * Writes straight to Supabase (hvl_voice_templates). Delete is a soft-delete
 * via archived_at (matches the table's soft-delete contract).
 */

interface VoiceRow {
  id: string;
  name: string;
  category: string;
  is_default: boolean;
  tone: string;
  perspective: string;
  target_audience: string;
  writing_style: string;
  content_rules: string;
  banned_words: string[];
  required_elements: string[];
  opening_examples: string[];
  closing_examples: string[];
}

type Draft = Omit<VoiceRow, "id"> & { id?: string };

const CATEGORIES = ["tech", "professional", "personal", "marketplace", "ai"] as const;

const EMPTY: Draft = {
  name: "", category: "tech", is_default: false,
  tone: "", perspective: "", target_audience: "", writing_style: "",
  content_rules: "", banned_words: [], required_elements: [],
  opening_examples: [], closing_examples: [],
};

const SELECT =
  "id, name, category, is_default, tone, perspective, target_audience, writing_style, content_rules, banned_words, required_elements, opening_examples, closing_examples";

const norm = (r: Record<string, unknown>): VoiceRow => ({
  id: String(r.id),
  name: (r.name as string) ?? "",
  category: (r.category as string) ?? "general",
  is_default: Boolean(r.is_default),
  tone: (r.tone as string) ?? "",
  perspective: (r.perspective as string) ?? "",
  target_audience: (r.target_audience as string) ?? "",
  writing_style: (r.writing_style as string) ?? "",
  content_rules: (r.content_rules as string) ?? "",
  banned_words: (r.banned_words as string[]) ?? [],
  required_elements: (r.required_elements as string[]) ?? [],
  opening_examples: (r.opening_examples as string[]) ?? [],
  closing_examples: (r.closing_examples as string[]) ?? [],
});

export default function VoiceMode() {
  const [rows, setRows] = useState<VoiceRow[]>([]);
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
      .from("hvl_voice_templates")
      .select(SELECT)
      .is("archived_at", null)
      .order("is_default", { ascending: false })
      .order("name");
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

  const select = (r: VoiceRow) => {
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
    if (!draft || !draft.name.trim()) { flash("Naam is verplicht"); return; }
    setSaving(true);
    try {
      const payload = {
        name: draft.name.trim(), category: draft.category, is_default: draft.is_default,
        tone: draft.tone, perspective: draft.perspective, target_audience: draft.target_audience,
        writing_style: draft.writing_style, content_rules: draft.content_rules,
        banned_words: draft.banned_words, required_elements: draft.required_elements,
        opening_examples: draft.opening_examples, closing_examples: draft.closing_examples,
      };
      if (draft.is_default) {
        // single default: clear others first
        await supabase.from("hvl_voice_templates").update({ is_default: false }).neq("id", draft.id ?? "00000000-0000-0000-0000-000000000000");
      }
      let savedId = draft.id;
      if (draft.id) {
        await supabase.from("hvl_voice_templates").update(payload).eq("id", draft.id);
      } else {
        const { data } = await supabase.from("hvl_voice_templates").insert(payload).select("id").single();
        savedId = (data as { id: string } | null)?.id;
      }
      const list = await reload();
      const target = list.find((v) => v.id === savedId) ?? list[0] ?? null;
      setActiveId(target?.id ?? null);
      setDraft(target ? { ...target } : null);
      setDirty(false);
      flash("Voice opgeslagen");
    } catch {
      flash("Opslaan mislukt");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!draft?.id) return;
    if (!window.confirm(`"${draft.name}" verwijderen, kan niet ongedaan.`)) return;
    await supabase.from("hvl_voice_templates").update({ archived_at: new Date().toISOString() }).eq("id", draft.id);
    const list = await reload();
    setActiveId(list[0]?.id ?? null);
    setDraft(list[0] ? { ...list[0] } : null);
    setDirty(false);
    flash("Voice verwijderd");
  };

  const makeDefault = async () => {
    if (!draft?.id) return;
    await supabase.from("hvl_voice_templates").update({ is_default: false }).neq("id", draft.id);
    await supabase.from("hvl_voice_templates").update({ is_default: true }).eq("id", draft.id);
    const list = await reload();
    setDraft(list.find((v) => v.id === draft.id) ?? null);
    flash(`"${draft.name}" is nu de default stem`);
  };

  const defaultName = useMemo(() => rows.find((r) => r.is_default)?.name ?? "no default", [rows]);

  return (
    <div className="shell shell--single">
      <main className="main">
        <h1 className="manage-h">Voice<em>.</em></h1>
        <p className="voice-stat">
          {loading ? "Loading templates…" : `${rows.length} template${rows.length === 1 ? "" : "s"} · `}
          {!loading && <strong>{defaultName}</strong>} {!loading && "als default"}
        </p>

        <div className="voice-grid">
          {/* list */}
          <aside className="voice-list">
            <button type="button" className="voice-new" onClick={createNew}>
              <span>+ New voice</span><span className="kbd">⌘N</span>
            </button>
            {rows.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`voice-row ${activeId === r.id ? "active" : ""}`}
                onClick={() => select(r)}
              >
                <span className="vr-head">
                  <span className="vr-name">{r.name || "Untitled"}</span>
                  {r.is_default && <span className="vr-tag">default</span>}
                </span>
                <span className="vr-meta">
                  {(r.category || "general")} · {r.banned_words.length} banned · {r.required_elements.length} required
                </span>
              </button>
            ))}
            {!loading && rows.length === 0 && <p className="voice-empty">Nog geen stemmen. Maak er één →</p>}
          </aside>

          {/* editor */}
          {draft && (
            <section className="voice-editor">
              <div className="ve-top">
                <div className="ve-titleblock">
                  <span className="ve-eyebrow">{draft.id ? "Editing voice" : "New voice"}</span>
                  <input
                    className="ve-name"
                    value={draft.name}
                    placeholder="Voice name (e.g. Technical Deep Dive)"
                    onChange={(e) => set("name", e.target.value)}
                  />
                </div>
                <div className="ve-actions">
                  {draft.id && !draft.is_default && (
                    <button className="stamp-btn stamp-btn--ghost stamp-btn--sm" onClick={makeDefault}>Make default</button>
                  )}
                  {draft.id && (
                    <button className="stamp-btn stamp-btn--ghost stamp-btn--sm ve-danger" onClick={remove}>Delete</button>
                  )}
                  <button className="stamp-btn stamp-btn--sm" disabled={!dirty || saving} onClick={save}>
                    {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
                  </button>
                </div>
              </div>

              <div className="ve-form">
                <VField label="Category" help="Welk soort schrijven deze stem dient.">
                  <div className="ve-chips">
                    {CATEGORIES.map((c) => (
                      <button key={c} type="button" className={`ve-chip ${draft.category === c ? "on" : ""}`} onClick={() => set("category", c)}>{c}</button>
                    ))}
                  </div>
                </VField>

                <VField label="Default voice" help="Gebruikt als een artikel geen voice gekozen heeft.">
                  <label className="ve-toggle">
                    <input type="checkbox" checked={draft.is_default} onChange={(e) => set("is_default", e.target.checked)} />
                    <span className="sw" /><span>{draft.is_default ? "Default" : "Not default"}</span>
                  </label>
                </VField>

                <VField full label="Tone" help="Korte komma-gescheiden persoonlijkheid.">
                  <textarea rows={2} value={draft.tone} placeholder="calm, opinionated, no-nonsense" onChange={(e) => set("tone", e.target.value)} />
                </VField>
                <VField label="Perspective" help="Waar de schrijver staat t.o.v. de lezer.">
                  <textarea rows={2} value={draft.perspective} placeholder="first-person operator, technical equals" onChange={(e) => set("perspective", e.target.value)} />
                </VField>
                <VField label="Target audience" help="Voor wie je schrijft, specifiek.">
                  <textarea rows={2} value={draft.target_audience} placeholder="senior engineers running real workloads" onChange={(e) => set("target_audience", e.target.value)} />
                </VField>
                <VField full label="Writing style" help="Zinsritme, structuur, wat wel/niet.">
                  <textarea rows={5} value={draft.writing_style} onChange={(e) => set("writing_style", e.target.value)} />
                </VField>

                <VField full label="Banned words" help="Inline-marks lichten rood op in de draft.">
                  <TagInput kind="banned" values={draft.banned_words} onChange={(v) => set("banned_words", v)} placeholder="Typ een woord, Enter of komma" lower />
                </VField>
                <VField full label="Required elements" help="Elk artikel in deze stem moet deze bevatten.">
                  <TagInput kind="req" values={draft.required_elements} onChange={(v) => set("required_elements", v)} placeholder="Typ een element, Enter" />
                </VField>

                <VField full label="Content rules" help="Vrije regelset. Gaat verbatim in de agent-review prompt.">
                  <textarea rows={8} value={draft.content_rules} onChange={(e) => set("content_rules", e.target.value)} />
                </VField>

                <VField full label="Opening examples" help="2–4 voorbeeld-openers. Few-shot anchors.">
                  <ExampleList values={draft.opening_examples} onChange={(v) => set("opening_examples", v)} placeholder="Een opening die als jou klinkt…" addLabel="+ opener" />
                </VField>
                <VField full label="Closing examples" help="2–4 voorbeeld-slotzinnen.">
                  <ExampleList values={draft.closing_examples} onChange={(v) => set("closing_examples", v)} placeholder="Een slot dat landt zoals het jouwe…" addLabel="+ slotzin" />
                </VField>
              </div>
            </section>
          )}
        </div>
      </main>

      {toast && <div className="voice-toast">{toast}</div>}
    </div>
  );
}

function VField({ label, help, full, children }: { label: string; help: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`ve-field ${full ? "full" : ""}`}>
      <span className="ve-label">{label}</span>
      <span className="ve-help">{help}</span>
      <div className="ve-input">{children}</div>
    </div>
  );
}

function TagInput({ values, onChange, placeholder, kind, lower }: { values: string[]; onChange: (v: string[]) => void; placeholder: string; kind: "banned" | "req"; lower?: boolean }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = lower ? input.trim().toLowerCase() : input.trim();
    if (!v) return;
    onChange([...values, v]); setInput("");
  };
  return (
    <div className="tag-input">
      {values.map((t, i) => (
        <span key={i} className={`tag ${kind === "req" ? "req" : ""}`}>
          {t}<span className="x" onClick={() => onChange(values.filter((_, j) => j !== i))}>×</span>
        </span>
      ))}
      <input
        value={input}
        placeholder={placeholder}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || (kind === "banned" && e.key === ",")) { e.preventDefault(); add(); } }}
        onBlur={add}
      />
    </div>
  );
}

function ExampleList({ values, onChange, placeholder, addLabel }: { values: string[]; onChange: (v: string[]) => void; placeholder: string; addLabel: string }) {
  return (
    <div className="ex-list">
      {values.map((t, i) => (
        <div key={i} className="ex-row">
          <input value={t} placeholder={placeholder} onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))} />
          <button type="button" className="ex-del" onClick={() => onChange(values.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      <button type="button" className="ex-add" onClick={() => onChange([...values, ""])}>{addLabel}</button>
    </div>
  );
}
