import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardPeriod } from "@/hooks/useDashboardPeriod";
import PeriodFilter from "@/components/dashboard/PeriodFilter";
import DashboardKpi from "@/components/dashboard/DashboardKpi";
import EmptyWidget from "@/components/dashboard/EmptyWidget";
import DashboardShell from "./DashboardShell";

interface Counts { [k: string]: number }

const nf = (n: number) => n.toLocaleString("nl-NL");
const eur = (n: number) => `€${n.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;

export default function DashboardsMpg() {
  const { period, setPreset, setRange, setCompare } = useDashboardPeriod("mpg");
  const [c, setC] = useState<Counts>({});
  const [profit, setProfit] = useState<{ current: number; previous: number } | null>(null);
  const [workflows, setWorkflows] = useState<{ ok: number; failed: number }>({ ok: 0, failed: 0 });
  const [llmCost, setLlmCost] = useState<{ current: number; previous: number }>({ current: 0, previous: 0 });
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    (async () => {
      setBusy(true);
      const inPeriod = (d?: string | null) => !!d && d.slice(0, 10) >= period.from && d.slice(0, 10) <= period.to;
      const inPrev = (d?: string | null) =>
        !!d && !!period.prevFrom && d.slice(0, 10) >= period.prevFrom && d.slice(0, 10) <= period.prevTo!;

      const [prospects, meetings, offers, services, clients, brands, ws, subs, snaps, runs, llm] = await Promise.all([
        supabase.from("consultancy_prospects").select("id,created_at"),
        supabase.from("consultancy_meetings").select("id,created_at"),
        supabase.from("consultancy_offers").select("id,created_at"),
        supabase.from("consultancy_services").select("id"),
        supabase.from("clients").select("id"),
        supabase.from("brands").select("id"),
        supabase.from("workspaces").select("id"),
        supabase.from("subscriptions").select("id,status"),
        supabase.from("profit_snapshots").select("*").limit(200),
        supabase.from("workflow_runs").select("status,created_at").limit(500),
        supabase.from("ops_llm_runs").select("cost_usd,created_at").limit(1000),
      ]);

      const rows = <T,>(r: { data: T[] | null }) => r.data ?? [];
      setC({
        prospects: rows(prospects).filter((p) => inPeriod((p as { created_at?: string }).created_at)).length,
        prospectsTotal: rows(prospects).length,
        meetings: rows(meetings).filter((m) => inPeriod((m as { created_at?: string }).created_at)).length,
        meetingsTotal: rows(meetings).length,
        offers: rows(offers).filter((o) => inPeriod((o as { created_at?: string }).created_at)).length,
        offersTotal: rows(offers).length,
        services: rows(services).length,
        clients: rows(clients).length,
        brands: rows(brands).length,
        workspaces: rows(ws).length,
        subs: rows(subs).filter((s) => (s as { status?: string }).status === "active").length,
      });

      const snapRows = rows(snaps) as Record<string, unknown>[];
      if (snapRows.length) {
        const dateOf = (r: Record<string, unknown>) => String(r.snapshot_date ?? r.date ?? r.created_at ?? "");
        const valOf = (r: Record<string, unknown>) => Number(r.profit ?? r.net_profit ?? r.revenue ?? 0);
        setProfit({
          current: snapRows.filter((r) => inPeriod(dateOf(r))).reduce((a, r) => a + valOf(r), 0),
          previous: snapRows.filter((r) => inPrev(dateOf(r))).reduce((a, r) => a + valOf(r), 0),
        });
      } else setProfit(null);

      const runRows = rows(runs) as { status?: string; created_at?: string }[];
      const inWin = runRows.filter((r) => inPeriod(r.created_at));
      setWorkflows({
        ok: inWin.filter((r) => (r.status ?? "").toLowerCase() === "success").length,
        failed: inWin.filter((r) => ["error", "failed"].includes((r.status ?? "").toLowerCase())).length,
      });

      const llmRows = rows(llm) as { cost_usd?: number; created_at?: string }[];
      setLlmCost({
        current: llmRows.filter((r) => inPeriod(r.created_at)).reduce((a, r) => a + Number(r.cost_usd ?? 0), 0),
        previous: llmRows.filter((r) => inPrev(r.created_at)).reduce((a, r) => a + Number(r.cost_usd ?? 0), 0),
      });

      setBusy(false);
    })();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [period.from, period.to, period.compare]);

  const funnel = [
    { label: "Prospects", inPeriod: c.prospects ?? 0, total: c.prospectsTotal ?? 0 },
    { label: "Gesprekken", inPeriod: c.meetings ?? 0, total: c.meetingsTotal ?? 0 },
    { label: "Offertes", inPeriod: c.offers ?? 0, total: c.offersTotal ?? 0 },
  ];

  return (
    <DashboardShell domain="marketplacegrowth.nl" title="Advisory & roadmap">
      <PeriodFilter period={period} onPreset={setPreset} onRange={setRange} onCompare={setCompare} />

      <h2 className="mb-2 mt-2 text-[11px] font-semibold uppercase tracking-[0.09em] text-[#7E7A6F]">Pijplijn</h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {funnel.map((f) => (
          <div key={f.label} className="rounded-xl border border-[#E5DFCE] bg-white/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7E7A6F]">{f.label}</p>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums text-[#15140F]">{nf(f.inPeriod)}</p>
            <p className="mt-1 text-xs text-[#7E7A6F]">nieuw in periode · {nf(f.total)} totaal</p>
          </div>
        ))}
      </div>

      <h2 className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.09em] text-[#7E7A6F]">Portefeuille</h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Klanten", c.clients], ["Merken", c.brands], ["Workspaces", c.workspaces],
          ["Actieve abonnementen", c.subs], ["Diensten", c.services],
        ].map(([l, v]) => (
          <div key={String(l)} className="rounded-xl border border-[#E5DFCE] bg-white/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7E7A6F]">{l as string}</p>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums text-[#15140F]">{nf((v as number) ?? 0)}</p>
            <p className="mt-1 text-xs text-[#7E7A6F]">momentopname</p>
          </div>
        ))}
      </div>

      <h2 className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.09em] text-[#7E7A6F]">Marge & automatisering</h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {profit ? (
          <DashboardKpi label="Marge in periode" value={eur(profit.current)} current={profit.current} previous={profit.previous} />
        ) : (
          <EmptyWidget title="Marge" pipeline="compute-profit-snapshots → profit_snapshots"
            detail="De job draait maar levert 0 rijen; eerst uitzoeken waarom de bron leeg is." />
        )}
        <div className="rounded-xl border border-[#E5DFCE] bg-white/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7E7A6F]">Workflow-runs</p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums text-[#15140F]">{nf(workflows.ok)}</p>
          <p className="mt-1 text-xs text-[#7E7A6F]">
            geslaagd{workflows.failed > 0 && <span className="text-[#B4483C]"> · {workflows.failed} mislukt</span>}
          </p>
        </div>
        <DashboardKpi label="AI-kosten" value={`$${llmCost.current.toFixed(2)}`}
          current={llmCost.current} previous={llmCost.previous} sub="ops_llm_runs" invert />
      </div>

      <h2 className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.09em] text-[#7E7A6F]">Roadmap & status</h2>
      <EmptyWidget
        title="Roadmap uit de Second Brain Vault"
        pipeline="vault-sync (classifier-gated) → Supabase"
        detail="De site kan de lokale vault niet lezen; de syncjob die wiki/domains/MPG.md en de roadmap-artefacten wegschrijft moet nog gebouwd worden."
      />

      {busy && <p className="mt-6 text-[11px] text-[#7E7A6F]">Laden…</p>}
    </DashboardShell>
  );
}
