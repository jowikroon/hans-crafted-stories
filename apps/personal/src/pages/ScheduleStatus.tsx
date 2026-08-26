// ScheduleStatus — /status route (admin-only, via profielmenu of directe URL).
// status.claude.com-stijl overzicht van alle Cowork scheduled runs:
// per schedule een stoplicht (green/yellow/red/grey), een run-historiek-strip,
// en per run een downloadbare resultaatfile uit de private bucket
// `schedule-artifacts`. Data: public.schedule_registry + public.schedule_runs
// (RLS: authenticated read; writes uitsluitend service-role via de
// vault-probe-command-board watchdog, Deel C2 — migration schedule_status_page_v1).
// Access: admin only, zelfde gate als /write. Anoniem/member → /portal.
import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, Download, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";

// schedule_registry/schedule_runs zijn (nog) niet in de gegenereerde
// Database-types opgenomen; query ze via een untyped cast en typ de
// resultaten hieronder handmatig. Geen nieuwe TS-errors introduceren.
const db = supabase as unknown as SupabaseClient;

type RunStatus = "green" | "yellow" | "red" | "grey";

interface RegistryRow {
  task_id: string;
  name: string;
  description: string | null;
  cadence: string | null;
  scope: string | null;
  enabled: boolean;
  sort_order: number;
}

interface RunRow {
  id: string;
  task_id: string;
  run_started_at: string;
  run_finished_at: string | null;
  status: RunStatus;
  summary: string | null;
  artifact_path: string | null;
  artifact_name: string | null;
}

const STATUS_META: Record<RunStatus, { dot: string; label: string }> = {
  green: { dot: "bg-emerald-500", label: "Operational" },
  yellow: { dot: "bg-amber-400", label: "Degraded" },
  red: { dot: "bg-red-500", label: "Failed" },
  grey: { dot: "bg-zinc-300", label: "Unknown" },
};

const fmtDT = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("nl-NL", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

/** Kleinste strip: laatste N runs als vierkantjes, oudste links (uptime-bar stijl). */
const HistoryStrip = ({ runs }: { runs: RunRow[] }) => {
  const cells = [...runs].reverse().slice(-14);
  return (
    <div className="flex items-center gap-[3px]" aria-hidden>
      {cells.map((r) => (
        <span
          key={r.id}
          title={`${fmtDT(r.run_started_at)} — ${STATUS_META[r.status].label}`}
          className={`h-4 w-1.5 rounded-sm ${STATUS_META[r.status].dot}`}
        />
      ))}
    </div>
  );
};

const RunRowItem = ({ run }: { run: RunRow }) => {
  const [busy, setBusy] = useState(false);
  const meta = STATUS_META[run.status];

  const download = async () => {
    if (!run.artifact_path) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.storage
        .from("schedule-artifacts")
        .createSignedUrl(run.artifact_path, 3600);
      if (error || !data?.signedUrl) throw error ?? new Error("no url");
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.download = run.artifact_name ?? "result";
      a.rel = "noopener";
      a.click();
    } catch {
      // stil falen is hier misleidend — toon het in de rij
      alert("Download niet beschikbaar (signed URL faalde).");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="flex items-start gap-3 border-t border-zinc-100 py-3 first:border-t-0">
      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-medium text-zinc-800">{fmtDT(run.run_started_at)}</span>
          <span className="text-xs uppercase tracking-wide text-zinc-400">{meta.label}</span>
          {run.run_finished_at && (
            <span className="text-xs text-zinc-400">→ {fmtDT(run.run_finished_at)}</span>
          )}
        </div>
        {run.summary && <p className="mt-0.5 text-sm leading-snug text-zinc-500">{run.summary}</p>}
      </div>
      {run.artifact_path && (
        <button
          onClick={download}
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          {run.artifact_name ?? "resultaat"}
        </button>
      )}
    </li>
  );
};

const ScheduleCard = ({ reg, runs }: { reg: RegistryRow; runs: RunRow[] }) => {
  const [open, setOpen] = useState(false);
  const latest = runs[0];
  const status: RunStatus = reg.enabled ? (latest?.status ?? "grey") : "grey";
  const meta = STATUS_META[status];

  return (
    <div className="border-t border-zinc-200 first:border-t-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 py-3.5 text-left"
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown size={15} className="shrink-0 text-zinc-400" />
        ) : (
          <ChevronRight size={15} className="shrink-0 text-zinc-400" />
        )}
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="truncate text-sm font-medium text-zinc-800">{reg.name}</span>
            {reg.cadence && <span className="text-xs text-zinc-400">{reg.cadence}</span>}
            {!reg.enabled && (
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                gepauzeerd
              </span>
            )}
          </div>
        </div>
        <div className="hidden shrink-0 sm:block">
          <HistoryStrip runs={runs} />
        </div>
        <span className="shrink-0 text-xs text-zinc-400">
          {latest ? fmtDT(latest.run_started_at) : "geen runs"}
        </span>
      </button>
      {open && (
        <div className="pb-4 pl-10 pr-1">
          {reg.description && <p className="mb-2 text-xs text-zinc-400">{reg.description}</p>}
          {runs.length === 0 ? (
            <p className="text-sm text-zinc-400">Nog geen geregistreerde runs.</p>
          ) : (
            <ul>
              {runs.map((r) => (
                <RunRowItem key={r.id} run={r} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default function ScheduleStatus() {
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [registry, setRegistry] = useState<RegistryRow[]>([]);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const load = async () => {
    setFetching(true);
    setFetchError(null);
    const [regRes, runRes] = await Promise.all([
      db.from("schedule_registry").select("*").order("sort_order"),
      db
        .from("schedule_runs")
        .select(
          "id,task_id,run_started_at,run_finished_at,status,summary,artifact_path,artifact_name"
        )
        .order("run_started_at", { ascending: false })
        .limit(400),
    ]);
    if (regRes.error || runRes.error) {
      setFetchError(regRes.error?.message ?? runRes.error?.message ?? "onbekende fout");
    } else {
      setRegistry((regRes.data ?? []) as RegistryRow[]);
      setRuns((runRes.data ?? []) as RunRow[]);
    }
    setFetching(false);
  };

  useEffect(() => {
    if (user && isAdmin) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  const runsByTask = useMemo(() => {
    const m = new Map<string, RunRow[]>();
    for (const r of runs) {
      const list = m.get(r.task_id) ?? [];
      list.push(r);
      m.set(r.task_id, list);
    }
    return m;
  }, [runs]);

  const overall = useMemo(() => {
    const latestStatuses = registry
      .filter((r) => r.enabled)
      .map((r) => runsByTask.get(r.task_id)?.[0]?.status)
      .filter(Boolean) as RunStatus[];
    if (latestStatuses.some((s) => s === "red"))
      return { cls: "bg-red-500", text: "Eén of meer schedules falen" };
    if (latestStatuses.some((s) => s === "yellow"))
      return { cls: "bg-amber-400", text: "Sommige schedules zijn degraded" };
    if (latestStatuses.length === 0) return { cls: "bg-zinc-300", text: "Nog geen run-data" };
    return { cls: "bg-emerald-500", text: "Alle schedules operationeel" };
  }, [registry, runsByTask]);

  if (loading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 size={22} className="animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user || !isAdmin) {
    return <Navigate to="/portal" replace />;
  }

  const active = registry.filter((r) => r.enabled);
  const paused = registry.filter((r) => !r.enabled);

  return (
    <div className="min-h-screen bg-white pb-24 pt-24">
      <div className="mx-auto w-full max-w-3xl px-4">
        <header className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Schedule status
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Alle Cowork scheduled runs — gevoed door de watchdog (ma/wo/vr 07:45).
            </p>
          </div>
          <button
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
          >
            <RefreshCw size={13} className={fetching ? "animate-spin" : ""} /> Ververs
          </button>
        </header>

        <div
          className={`mb-8 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white ${overall.cls}`}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-white/90" />
          {overall.text}
        </div>

        {fetchError && (
          <p className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Data laden faalde: {fetchError}
          </p>
        )}

        {fetching && registry.length === 0 ? (
          <div className="flex justify-center py-16">
            <Loader2 size={20} className="animate-spin text-zinc-400" />
          </div>
        ) : (
          <>
            <section className="rounded-xl border border-zinc-200 bg-white px-4 shadow-sm">
              {active.map((reg) => (
                <ScheduleCard key={reg.task_id} reg={reg} runs={runsByTask.get(reg.task_id) ?? []} />
              ))}
            </section>

            {paused.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
                  Gepauzeerd (met besluit)
                </h2>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4">
                  {paused.map((reg) => (
                    <ScheduleCard
                      key={reg.task_id}
                      reg={reg}
                      runs={runsByTask.get(reg.task_id) ?? []}
                    />
                  ))}
                </div>
              </section>
            )}

            <p className="mt-8 text-xs leading-relaxed text-zinc-400">
              Status per run: groen = DONE zonder issues · geel = PARTIAL of DONE met waarschuwing ·
              rood = gefaald of stille faal · grijs = gedraaid maar uitkomst onbekend. Data wordt
              ma/wo/vr ververst door de vault-probe watchdog; "leeftijd is waarheid" — een oude
              timestamp betekent verouderde informatie, geen live storing.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
