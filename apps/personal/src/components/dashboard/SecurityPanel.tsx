import { motion } from "framer-motion";
import { ShieldAlert, AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SECURITY_ISSUES, PERFORMANCE_ISSUES, getSecurityScore, getSeverityColor,
} from "@/lib/config/infrastructure";

interface SystemIssue { id: string; severity: string; area: string; issue: string; impact: string; fix: string; is_resolved: boolean; sort_order: number; }

interface Props {
  dbIssues?: SystemIssue[];
  dbLoading?: boolean;
  toggleIssue?: (id: string, cur: boolean) => void;
}

function IssueRow({ severity, area, issue, impact, fix, effort }: {
  severity: string; area: string; issue: string; impact: string; fix: string; effort: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 space-y-2 hover:border-zinc-700 transition-colors">
      <div className="flex items-start gap-2 flex-wrap">
        <span className={cn("shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase", getSeverityColor(severity as unknown))}>{severity}</span>
        <span className="rounded bg-zinc-800/60 px-1.5 py-0.5 text-[9px] text-zinc-500">{area}</span>
        {effort && <span className="ml-auto text-[9px] text-zinc-600 font-mono">{effort}</span>}
      </div>
      <p className="text-xs text-zinc-300 font-medium">{issue}</p>
      <p className="text-[11px] text-zinc-500">{impact}</p>
      <p className="text-[11px] text-emerald-400/70">→ {fix}</p>
    </div>
  );
}

export default function SecurityPanel({ dbIssues = [], dbLoading = false, toggleIssue }: Props) {
  const { score, grade, color, textClass } = getSecurityScore();
  const critical = SECURITY_ISSUES.filter(i => i.severity === "critical").length;
  const high = SECURITY_ISSUES.filter(i => i.severity === "high").length;

  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-2">Security Grade</p>
          <p className={cn("text-3xl font-bold font-mono", textClass)}>{grade}</p>
          <p className="mt-1 text-[10px] text-zinc-600">{score}/100</p>
        </motion.div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-2">Critical</p>
          <p className="text-3xl font-bold font-mono text-red-400">{critical}</p>
          <p className="mt-1 text-[10px] text-zinc-600">fix immediately</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-2">High</p>
          <p className="text-3xl font-bold font-mono text-orange-400">{high}</p>
          <p className="mt-1 text-[10px] text-zinc-600">fix this week</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-2">Performance</p>
          <p className="text-3xl font-bold font-mono text-amber-400">{PERFORMANCE_ISSUES.length}</p>
          <p className="mt-1 text-[10px] text-zinc-600">bottlenecks</p>
        </div>
      </div>

      {/* Live DB Issues */}
      {!dbLoading && dbIssues.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={14} className="text-purple-400" />
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-purple-400/70">Live Issues (Supabase)</h3>
            <span className="text-[10px] text-zinc-500">{dbIssues.filter(i => !i.is_resolved).length} open</span>
          </div>
          <div className="space-y-1.5">
            {dbIssues.map(iss => (
              <div key={iss.id} className={cn("flex items-center gap-3 rounded-lg border px-3 py-2", iss.is_resolved ? "border-zinc-800/50 opacity-40" : "border-zinc-800 hover:border-zinc-700 transition-colors")}>
                <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold uppercase", iss.severity === "critical" ? "bg-red-500/15 text-red-400" : iss.severity === "high" ? "bg-orange-500/15 text-orange-400" : "bg-yellow-500/15 text-yellow-400")}>{iss.severity}</span>
                <span className="text-[10px] text-zinc-500">[{iss.area}]</span>
                <span className={cn("flex-1 text-xs", iss.is_resolved ? "text-zinc-500 line-through" : "text-zinc-300")}>{iss.issue}</span>
                {toggleIssue && (
                  <button onClick={() => toggleIssue(iss.id, iss.is_resolved)} className="p-1 rounded hover:bg-zinc-800 transition-colors">
                    <Check size={12} className={iss.is_resolved ? "text-emerald-400" : "text-zinc-600"} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Static Security Issues */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert size={14} className="text-red-400" />
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-red-400/70">Security Issues ({SECURITY_ISSUES.length})</h3>
        </div>
        <div className="space-y-2">
          {SECURITY_ISSUES.map(issue => (<IssueRow key={issue.id} {...issue} />))}
        </div>
      </div>

      {/* Performance Issues */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-amber-400" />
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-400/70">Performance Bottlenecks ({PERFORMANCE_ISSUES.length})</h3>
        </div>
        <div className="space-y-2">
          {PERFORMANCE_ISSUES.map(issue => (<IssueRow key={issue.id} severity={issue.severity} area={issue.area} issue={issue.issue} impact={issue.impact} fix={issue.fix} effort="" />))}
        </div>
      </div>
    </div>
  );
}
