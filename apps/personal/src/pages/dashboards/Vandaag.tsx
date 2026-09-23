import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "./DashboardShell";

/**
 * /dashboards — de domeinoverstijgende "Vandaag"-lijst (master prompt v4).
 *
 * Eén vraag beantwoorden: wat is vandaag de duurste onbenutte actie.
 * Volgorde is waarde (tier), niet meetbaarheid; tiebreak deterministisch.
 * Domeinen zijn een filter, geen navigatielaag. Max 3 kaarten boven de vouw.
 * Kaarten sluiten zichzelf via de evaluator — hier alleen snoozen/afwijzen.
 */

interface ActionRow {
  signal_id: string;
  rule_key: string;
  domain: "ccp" | "mpg" | "hvl" | "system";
  tier: "direct" | "protect" | "growth" | "hygiene";
  action_title: string;
  evidence_line: string;
  evidence_last: Record<string, unknown>;
  medium_level: "A" | "B" | "C" | "none";
  medium_target: { url?: string; label?: string; copy_id?: string; fallback?: boolean; artefact_type?: string };
  artefact: Record<string, unknown> | null;
  status: "open" | "sticky" | "frozen" | "snoozed";
  sticky: boolean;
  seen_count: number;
  first_seen: string;
  last_eval_at: string | null;
}

const TIER_ORDER: Record<ActionRow["tier"], number> = { direct: 0, protect: 1, growth: 2, hygiene: 3 };
const TIER_LABEL: Record<ActionRow["tier"], { txt: string; cls: string }> = {
  direct:  { txt: "€€ direct geld",   cls: "bg-[#EAF2E6] text-[#4A6B3A]" },
  protect: { txt: "€ beschermt geld", cls: "bg-[#FAF3E0] text-[#8A6D1B]" },
  growth:  { txt: "groei",            cls: "bg-[#E9EFF6] text-[#3B5B7E]" },
  hygiene: { txt: "hygiëne",          cls: "bg-[#F2EFE4] text-[#7E7A6F]" },
};
const DOMAIN_LABEL: Record<string, string> = { ccp: "CCP", mpg: "MPG", hvl: "HVL", system: "Systeem" };
const FILTERS = ["alles", "ccp", "mpg", "hvl"] as const;

const SNOOZES = [
  { label: "1 week", days: 7 },
  { label: "1 maand", days: 30 },
  { label: "voorgoed", days: null as number | null },
];

function ActionCard({ row, onTransition }: { row: ActionRow; onTransition: (id: string, status: string, until: string | null) => Promise<void> }) {
  const [openDetail, setOpenDetail] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const t = TIER_LABEL[row.tier];
  const frozen = row.status === "frozen";
  const target = row.medium_target ?? {};

  const copyId = async () => {
    if (target.copy_id) try { await navigator.clipboard.writeText(target.copy_id); } catch { /* stil */ }
  };

  return (
    <div className={`rounded-xl border bg-white/60 p-4 ${frozen ? "border-[#D8CFA8] opacity-80" : "border-[#E5DFCE]"}`}>
      {/* actie als kop, bewijs als één regel — die volgorde is een ontwerpbeslissing */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-snug text-[#15140F]">{row.action_title}</h3>
          <button onClick={() => setOpenDetail((v) => !v)}
            className="mt-1 text-left text-[13px] text-[#7E7A6F] underline-offset-2 hover:underline">
            {row.evidence_line} {openDetail ? "▴" : "▾"}
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${t.cls}`}>{t.txt}</span>
          <span className="rounded bg-[#F2EFE4] px-1.5 py-0.5 text-[11px] text-[#7E7A6F]">{DOMAIN_LABEL[row.domain]}</span>
          {row.sticky && row.seen_count > 1 && (
            <span className="rounded bg-[#F2EFE4] px-1.5 py-0.5 text-[11px] tabular-nums text-[#7E7A6F]">×{row.seen_count}</span>
          )}
          {frozen && (
            <span className="rounded bg-[#FBF1EF] px-1.5 py-0.5 text-[11px] text-[#B4483C]">bron onbereikbaar</span>
          )}
        </div>
      </div>

      {openDetail && (
        <dl className="mt-3 grid gap-x-6 gap-y-1 rounded-lg bg-[#FBF8F0] p-3 text-[12px] sm:grid-cols-2">
          {Object.entries(row.evidence_last ?? {}).slice(0, 8).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-[#7E7A6F]">{k}</dt>
              <dd className="truncate text-right font-mono text-[#15140F]">
                {typeof v === "object" ? JSON.stringify(v).slice(0, 48) : String(v).slice(0, 48)}
              </dd>
            </div>
          ))}
          <div className="flex justify-between gap-3 sm:col-span-2">
            <dt className="text-[#7E7A6F]">laatste evaluatie</dt>
            <dd className="text-right text-[#15140F]">{row.last_eval_at ? new Date(row.last_eval_at).toLocaleString("nl-NL") : "—"}</dd>
          </div>
        </dl>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* medium-knop: alleen volwaardige knopvorm als de knop zijn belofte waarmaakt */}
        {row.medium_level === "B" && target.url && !target.fallback && (
          <a href={target.url} target="_blank" rel="noreferrer"
            className="rounded-full bg-[#15140F] px-4 py-2 text-[13px] font-medium text-[#FBF8F0]">
            Open {target.label ?? "doelsysteem"} ↗
          </a>
        )}
        {row.medium_level === "B" && target.url && target.fallback && (
          <a href={target.url} target="_blank" rel="noreferrer" onClick={copyId}
            className="text-[13px] text-[#3B5B7E] underline underline-offset-2">
            Open {target.label ?? "lijst"} · id gekopieerd ({target.copy_id})
          </a>
        )}
        {row.medium_level === "C" && (
          row.artefact ? (
            <details className="w-full sm:w-auto">
              <summary className="cursor-pointer rounded-full bg-[#15140F] px-4 py-2 text-[13px] font-medium text-[#FBF8F0] [&::-webkit-details-marker]:hidden">
                Toon concept
              </summary>
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-[#FBF8F0] p-3 text-[12px] text-[#15140F]">
                {typeof row.artefact === "string" ? row.artefact : JSON.stringify(row.artefact, null, 2)}
              </pre>
            </details>
          ) : (
            <span className="rounded-full border border-dashed border-[#C9C2AE] px-4 py-2 text-[13px] text-[#7E7A6F]">
              concept volgt{target.url && <> · <a className="underline" href={target.url}>{target.label}</a></>}
            </span>
          )
        )}

        <div className="relative ml-auto">
          <button onClick={() => setSnoozeOpen((v) => !v)} disabled={busy}
            className="rounded-full px-3 py-2 text-[13px] text-[#7E7A6F] hover:bg-[#F2EFE4]">
            {busy ? "…" : "afwijzen ▾"}
          </button>
          {snoozeOpen && (
            <div className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-[#E5DFCE] bg-white p-1 shadow-lg">
              {SNOOZES.map((s) => (
                <button key={s.label}
                  onClick={async () => {
                    setBusy(true); setSnoozeOpen(false);
                    const until = s.days ? new Date(Date.now() + s.days * 864e5).toISOString() : null;
                    await onTransition(row.signal_id, s.days ? "snoozed" : "dismissed", until);
                    setBusy(false);
                  }}
                  className="block w-full rounded px-2 py-1.5 text-left text-[13px] text-[#15140F] hover:bg-[#F2EFE4]">
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Vandaag() {
  const [rows, setRows] = useState<ActionRow[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("alles");
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setBusy(true);
    const { data, error } = await supabase
      .from("dashboard_actions")
      .select("*")
      .in("status", ["open", "sticky", "frozen"]);
    if (error) setErr(error.message);
    else setRows((data ?? []) as ActionRow[]);
    setBusy(false);
  };
  useEffect(() => { load(); }, []);

  const transition = async (id: string, status: string, until: string | null) => {
    const { error } = await supabase.rpc("dashboard_action_transition", {
      p_signal_id: id, p_new_status: status, p_snooze_until: until,
    });
    if (!error) setRows((rs) => rs.filter((r) => r.signal_id !== id));
  };

  const sorted = useMemo(() => {
    const f = rows.filter((r) => filter === "alles" || r.domain === filter || r.domain === "system");
    return f.sort((a, b) =>
      TIER_ORDER[a.tier] - TIER_ORDER[b.tier] ||
      a.first_seen.localeCompare(b.first_seen) ||
      a.signal_id.localeCompare(b.signal_id));
  }, [rows, filter]);

  const visible = showAll ? sorted : sorted.slice(0, 3);

  return (
    <DashboardShell domain="alle domeinen" title="Vandaag">
      <p className="mb-4 text-[13px] text-[#7E7A6F]">
        De duurste onbenutte actie eerst. Kaarten sluiten zichzelf zodra de data zegt dat het klaar is —
        ook als je het buitenom fixt.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-[#E5DFCE] bg-white/60 p-0.5">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-[13px] capitalize ${filter === f ? "bg-[#15140F] text-[#FBF8F0]" : "text-[#7E7A6F]"}`}>
              {f === "alles" ? "Alles" : DOMAIN_LABEL[f]}
            </button>
          ))}
        </div>
        <Link to="/dashboards/operatie" className="ml-auto text-[13px] text-[#3B5B7E] underline underline-offset-2">
          CCP-operatie →
        </Link>
      </div>

      {busy && <p className="text-[13px] text-[#7E7A6F]">Register laden…</p>}
      {err && (
        <div className="rounded-xl border border-[#E3C6C1] bg-[#FBF1EF] p-4 text-[13px] text-[#B4483C]">
          Register niet leesbaar: {err}
        </div>
      )}
      {!busy && !err && sorted.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#C9C2AE] bg-white/40 p-8 text-center text-[13px] text-[#7E7A6F]">
          Geen open acties{filter !== "alles" && <> voor {DOMAIN_LABEL[filter]}</>}. De evaluator draait elke
          zes uur; wat hier verschijnt, heeft bewijs in de data.
        </div>
      )}

      <div className="grid gap-3">
        {visible.map((r) => <ActionCard key={r.signal_id} row={r} onTransition={transition} />)}
      </div>

      {sorted.length > 3 && !showAll && (
        <button onClick={() => setShowAll(true)}
          className="mt-3 w-full rounded-xl border border-[#E5DFCE] bg-white/40 py-2.5 text-[13px] text-[#7E7A6F] hover:bg-white/70">
          Toon {sorted.length - 3} meer
        </button>
      )}

      <div className="mt-8 flex flex-wrap gap-4 text-[12px] text-[#7E7A6F]">
        <Link className="underline underline-offset-2" to="/dashboards/ccp">CCP-cijfers</Link>
        <Link className="underline underline-offset-2" to="/dashboards/mpg">MPG-bouwstatus</Link>
        <Link className="underline underline-offset-2" to="/dashboards/hvl">HVL-zichtbaarheid</Link>
      </div>
    </DashboardShell>
  );
}
