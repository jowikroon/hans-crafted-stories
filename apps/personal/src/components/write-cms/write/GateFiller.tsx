import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// ─── Gate-vuller — neon A/B experience chooser (in-editor) ────────────────────
// Scans the EN + NL draft for [HANS: …] gates. For every gate it pulls the two
// most relevant lived stories from hvl_experience_bank (dynamic, ranked on tags +
// theme + gate-type) and shows them as two neon option cards. Hans picks 1 of 2;
// the chosen story replaces that gate's placeholder in the right language field.
//
// Doctrine (same as ExperienceMode): these are Hans's real experiences, never
// invented. This component only surfaces + inserts what already lives in the bank.

interface BankRow {
  id: string;
  client: string;
  client_masked: string;
  theme: string;
  gate_type: string;
  situation: string;
  metrics: string;
  metrics_general: string;
  lesson: string;
  tags: string[];
}

const SELECT =
  "id, client, client_masked, theme, gate_type, situation, metrics, metrics_general, lesson, tags";

const norm = (r: Record<string, unknown>): BankRow => ({
  id: String(r.id),
  client: (r.client as string) ?? "",
  client_masked: (r.client_masked as string) ?? "",
  theme: (r.theme as string) ?? "",
  gate_type: (r.gate_type as string) ?? "algemeen",
  situation: (r.situation as string) ?? "",
  metrics: (r.metrics as string) ?? "",
  metrics_general: (r.metrics_general as string) ?? "",
  lesson: (r.lesson as string) ?? "",
  tags: (r.tags as string[]) ?? [],
});

interface Gate {
  raw: string; // exact placeholder incl. brackets
  label: string; // e.g. "Ervaring 1"
  instruction: string; // the rest of the brief
  gateType: string; // mapped bank gate_type
  lang: "en" | "nl";
}

const GATE_RE = /\[HANS:[\s\S]*?\]/g;

const STOP = new Set([
  "een", "het", "de", "die", "dat", "van", "voor", "met", "wat", "wie", "hoe", "als",
  "jij", "jou", "jouw", "ik", "wij", "aan", "uit", "over", "naar", "eigen",
  "woorden", "zinnen", "concrete", "situatie", "bijvoorbeeld", "hans", "opening",
  "beschrijf", "leg", "waarom", "kort", "eerste", "stap", "vertel", "andere",
]);

function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []).filter((t) => !STOP.has(t));
}

function gateTypeFromLabel(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("ervaring")) return "ervaring";
  if (l.includes("nuance")) return "nuance";
  if (l.includes("conclusie")) return "conclusie";
  if (l.includes("context")) return "context";
  if (l.includes("analyse")) return "analyse";
  return "algemeen";
}

function parseGates(md: string, lang: "en" | "nl"): Gate[] {
  const out: Gate[] = [];
  const matches = md.match(GATE_RE) ?? [];
  for (const raw of matches) {
    const inner = raw.replace(/^\[HANS:\s*/i, "").replace(/\]$/, "").trim();
    const dot = inner.indexOf(".");
    const label = (dot === -1 ? inner : inner.slice(0, dot)).trim();
    const instruction = (dot === -1 ? "" : inner.slice(dot + 1)).trim();
    out.push({ raw, label, instruction, gateType: gateTypeFromLabel(label), lang });
  }
  return out;
}

function scoreRow(row: BankRow, gateTokens: string[], gateType: string): number {
  const rowText = `${row.tags.join(" ")} ${row.theme} ${row.lesson} ${row.situation}`;
  const rowTokens = new Set(tokenize(rowText));
  let overlap = 0;
  for (const t of gateTokens) if (rowTokens.has(t)) overlap += 1;
  const tagTokens = new Set(row.tags.flatMap((t) => tokenize(t)));
  let tagBoost = 0;
  for (const t of gateTokens) if (tagTokens.has(t)) tagBoost += 2;
  const typeBoost = row.gate_type === gateType ? 3 : 0;
  return overlap + tagBoost + typeBoost;
}

/** Build the paragraph inserted when Hans picks a story. Public-safe by default:
 *  uses the generalised metric. Hans still reviews before publish (+ MaskPanel). */
function compose(row: BankRow): string {
  const metric = (row.metrics_general || row.metrics || "").trim();
  const body = (row.situation || row.theme).trim();
  const metricClause = metric ? ` (${metric})` : "";
  const lessonLine = row.lesson.trim() ? `\n\n_${row.lesson.trim()}_` : "";
  return `${body}${metricClause}${lessonLine}`;
}

const snippet = (s: string, n = 150) => (s.length > n ? `${s.slice(0, n)}…` : s);

interface Props {
  contentEN: string;
  contentNL: string;
  onChangeEN: (md: string) => void;
  onChangeNL: (md: string) => void;
}

export default function GateFiller({ contentEN, contentNL, onChangeEN, onChangeNL }: Props) {
  const [rows, setRows] = useState<BankRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from("hvl_experience_bank")
      .select(SELECT)
      .is("archived_at", null)
      .then(({ data }) => {
        setRows(((data ?? []) as Record<string, unknown>[]).map(norm));
        setLoaded(true);
      });
  }, []);

  const gates = useMemo(
    () => [...parseGates(contentEN, "en"), ...parseGates(contentNL, "nl")],
    [contentEN, contentNL],
  );

  // Per gate: the top-2 ranked stories from the bank.
  const optionsByGate = useMemo(() => {
    return gates.map((g) => {
      const gateTokens = tokenize(`${g.label} ${g.instruction}`);
      const ranked = rows
        .map((r) => ({ r, s: scoreRow(r, gateTokens, g.gateType) }))
        .sort((a, b) => b.s - a.s)
        .slice(0, 2)
        .map((x) => x.r);
      return ranked;
    });
  }, [gates, rows]);

  const pick = (gate: Gate, row: BankRow) => {
    // Safety lock: never silently replace content. One click used to overwrite a
    // whole draft; now the editor confirms before touching the (Supabase) source.
    const ok = typeof window === "undefined" || window.confirm(
      `Deze ervaring invoegen op de plek van "${gate.label || "deze gate"}"? ` +
      `Dit vervangt alleen die placeholder in de ${gate.lang.toUpperCase()}-tekst.`
    );
    if (!ok) return;
    const insert = compose(row);
    if (gate.lang === "en") onChangeEN(contentEN.replace(gate.raw, insert));
    else onChangeNL(contentNL.replace(gate.raw, insert));
  };

  if (!loaded || gates.length === 0) return null;

  return (
    <section className="gate-filler" aria-label="Gate-vuller: kies een ervaring per gate">
      <div className="gate-filler-head">
        <span className="gate-filler-title">Gate-vuller</span>
        <span className="gate-filler-sub">
          {gates.length} open {gates.length === 1 ? "gate" : "gates"} · kies 1 van 2 echte ervaringen
        </span>
      </div>

      {gates.map((gate, gi) => {
        const opts = optionsByGate[gi];
        return (
          <div className="gate-block" key={`${gate.lang}-${gi}-${gate.raw.slice(0, 24)}`}>
            <div className="gate-block-head">
              <span className="gate-lang">{gate.lang.toUpperCase()}</span>
              <span className="gate-name">{gate.label || "Gate"}</span>
              {gate.instruction && <span className="gate-brief">{snippet(gate.instruction, 110)}</span>}
            </div>

            {opts.length === 0 ? (
              <div className="gate-empty">Geen verhaal in de bank dat hierbij past. Voeg er een toe in Ervaringen.</div>
            ) : (
              <div className="gate-options">
                {opts.map((row, oi) => (
                  <button
                    type="button"
                    key={row.id}
                    className={`gate-opt gate-opt--${oi === 0 ? "a" : "b"}`}
                    onClick={() => pick(gate, row)}
                    title="Deze ervaring invoegen op deze plek"
                  >
                    <span className="gate-opt-badge">Optie {oi === 0 ? "A" : "B"}</span>
                    <span className="gate-opt-theme">{row.theme || "Ervaring"}</span>
                    <span className="gate-opt-client">{row.client_masked || row.client}</span>
                    <span className="gate-opt-situation">{snippet(row.situation, 160)}</span>
                    {(row.metrics_general || row.metrics) && (
                      <span className="gate-opt-metric">{row.metrics_general || row.metrics}</span>
                    )}
                    <span className="gate-opt-cta">Invoegen →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
