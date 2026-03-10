import { useState } from "react";
import { Database, Shield, ShieldOff, ShieldAlert, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { DATABASE_TABLES, type DatabaseTable } from "@/lib/config/infrastructure";

const rlsBadge = (rls: DatabaseTable["rls"]) => {
  const map = {
    on: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    off: "bg-red-500/15 text-red-400 border-red-500/30",
    partial: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    permissive: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  };
  const labels = { on: "RLS ON", off: "RLS OFF", partial: "PARTIAL", permissive: "PERMISSIVE" };
  return (
    <span className={cn("rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase", map[rls])}>
      {labels[rls]}
    </span>
  );
};

const riskDot = (risk: DatabaseTable["risk"]) => {
  if (risk === "none") return null;
  const colors = { critical: "bg-red-400", high: "bg-orange-400", medium: "bg-yellow-400", low: "bg-zinc-500" };
  return <span className={cn("inline-block h-1.5 w-1.5 rounded-full shrink-0", colors[risk])} title={`${risk} risk`} />;
};

export default function DatabaseOverview() {
  const [filter, setFilter] = useState<"all" | "saas" | "infra" | "other">("all");

  const filtered = filter === "all" ? DATABASE_TABLES : DATABASE_TABLES.filter(t => t.domain === filter);
  const rlsOn = DATABASE_TABLES.filter(t => t.rls === "on").length;
  const rlsOff = DATABASE_TABLES.filter(t => t.rls === "off").length;
  const atRisk = DATABASE_TABLES.filter(t => t.risk === "high" || t.risk === "critical").length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-center">
          <p className="text-lg font-bold font-mono text-blue-400">{DATABASE_TABLES.length}</p>
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Tables</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-center">
          <p className="text-lg font-bold font-mono text-emerald-400">{rlsOn}</p>
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider">RLS Protected</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-center">
          <p className="text-lg font-bold font-mono text-red-400">{rlsOff}</p>
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider">RLS Missing</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-center">
          <p className="text-lg font-bold font-mono text-orange-400">{atRisk}</p>
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider">High Risk</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter size={12} className="text-zinc-500" />
        {(["all", "saas", "infra", "other"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-medium transition-all border",
              filter === f
                ? "text-zinc-200 border-zinc-600 bg-zinc-800"
                : "text-zinc-500 border-zinc-800 hover:border-zinc-700"
            )}
          >
            {f === "all" ? `All (${DATABASE_TABLES.length})` : `${f} (${DATABASE_TABLES.filter(t => t.domain === f).length})`}
          </button>
        ))}
      </div>

      {/* Table List */}
      <div className="space-y-1">
        {filtered.map(table => (
          <div
            key={table.name}
            className={cn(
              "flex flex-wrap items-center gap-2 sm:gap-3 rounded-lg border px-3 py-2 text-xs",
              table.rls === "off" ? "border-red-500/10 bg-red-500/[0.02]" : "border-zinc-800"
            )}
          >
            <span className="font-mono font-medium text-zinc-300 shrink-0">{table.name}</span>
            {riskDot(table.risk)}
            {rlsBadge(table.rls)}
            <span className="text-zinc-500 text-[11px] truncate flex-1 min-w-[100px]">{table.purpose}</span>
            <span className="text-[10px] text-zinc-600 font-mono ml-auto">{table.rowEstimate}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
