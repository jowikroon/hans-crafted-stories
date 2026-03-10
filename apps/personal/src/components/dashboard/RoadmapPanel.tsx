import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROADMAP, getRoadmapStats, getPriorityColor, getPhaseClasses, type RoadmapItem, type TaskStatus } from "@/lib/config/infrastructure";

interface SystemIssue { id: string; severity: string; area: string; issue: string; impact: string; fix: string; is_resolved: boolean; sort_order: number; }
interface Props { dbIssues?: SystemIssue[]; dbLoading?: boolean; toggleIssue?: (id: string, cur: boolean) => void; }

const statusEmoji: Record<TaskStatus, string> = { done: "✅", doing: "🔧", todo: "📋", blocked: "⛔" };

export default function RoadmapPanel({ dbIssues = [], dbLoading = false, toggleIssue }: Props) {
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const stats = getRoadmapStats(ROADMAP);
  const filtered = filter === "all" ? ROADMAP : ROADMAP.filter(i => i.status === filter);

  const phases = [
    { label: "Security", timeline: "Now", color: "red", count: ROADMAP.filter(i => i.priority === "P0" && i.status !== "done").length },
    { label: "Core", timeline: "Week 1-2", color: "amber", count: ROADMAP.filter(i => i.priority === "P1" && i.status !== "done").length },
    { label: "Polish", timeline: "Week 3-4", color: "blue", count: ROADMAP.filter(i => i.priority === "P2" && i.status !== "done").length },
    { label: "Growth", timeline: "Month 2+", color: "emerald", count: ROADMAP.filter(i => i.priority === "P3" && i.status !== "done").length },
  ];

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <div><p className="text-sm font-semibold text-zinc-200">Overall Progress</p><p className="text-[11px] text-zinc-500">{stats.done} of {stats.total} tasks completed</p></div>
          <span className="text-2xl font-bold font-mono text-emerald-400">{stats.progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${stats.progress}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
        </div>
        <div className="flex gap-3 sm:gap-4 mt-3 text-[10px] text-zinc-500 flex-wrap">
          <span>✅ {stats.done} done</span><span>🔧 {stats.doing} doing</span><span>📋 {stats.todo} to do</span><span>⛔ {stats.blocked} blocked</span>
        </div>
      </div>

      {/* Phases */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {phases.map(p => {
          const pc = getPhaseClasses(p.color);
          return (
            <div key={p.label} className={cn("rounded-lg border p-3", pc.border, pc.bg)}>
              <p className={cn("text-[10px] font-semibold uppercase tracking-wider", pc.text)}>{p.label}</p>
              <p className="text-[9px] text-zinc-500 mt-0.5">{p.timeline}</p>
              <p className={cn("text-lg font-bold font-mono mt-1", pc.text)}>{p.count}</p>
              <p className="text-[9px] text-zinc-600">remaining</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-1 flex-wrap">
        {([["all", `All (${stats.total})`, "text-zinc-300"], ["done", `✅ ${stats.done}`, "text-emerald-400"], ["doing", `🔧 ${stats.doing}`, "text-amber-400"], ["todo", `📋 ${stats.todo}`, "text-blue-400"], ["blocked", `⛔ ${stats.blocked}`, "text-red-400"]] as const).map(([k, l, cl]) => (
          <button key={k} onClick={() => setFilter(k)} className={cn("rounded-full px-3 py-1 text-[10px] font-medium transition-all border", filter === k ? `${cl} border-current/30 bg-current/10` : "text-zinc-500 border-zinc-800 hover:border-zinc-700")}>{l}</button>
        ))}
      </div>

      {/* Tasks */}
      <div className="space-y-1.5">
        {filtered.map((item, i) => (
          <div key={i}>
            <div className={cn("flex items-center gap-2 sm:gap-3 rounded-lg border px-3 py-2 transition-colors", item.status === "done" ? "border-zinc-800/50 opacity-50" : "border-zinc-800 hover:border-zinc-700", item.description && "cursor-pointer")} onClick={() => item.description && setExpandedTask(expandedTask === i ? null : i)}>
              <span className="text-sm shrink-0">{statusEmoji[item.status]}</span>
              <span className={cn("rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase shrink-0", getPriorityColor(item.priority))}>{item.priority}</span>
              <span className={cn("flex-1 text-xs min-w-0", item.status === "done" ? "text-zinc-500 line-through" : "text-zinc-300")}>{item.task}</span>
              <span className="rounded bg-zinc-800/60 px-1.5 py-0.5 text-[9px] text-zinc-600 hidden sm:inline">{item.category}</span>
              {item.effort && <span className="text-[9px] text-zinc-600 font-mono hidden sm:inline">{item.effort}</span>}
              {item.description && <ChevronDown size={10} className={cn("text-zinc-600 transition-transform shrink-0", expandedTask === i && "rotate-180")} />}
            </div>
            {expandedTask === i && item.description && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="overflow-hidden ml-6 sm:ml-10 mr-3">
                <p className="text-[11px] text-zinc-500 leading-relaxed py-2 border-l-2 border-zinc-800 pl-3">{item.description}</p>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Live DB Issues */}
      {!dbLoading && dbIssues.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-purple-400/70">Live Issues (system_issues table)</h3>
          {dbIssues.map(iss => (
            <div key={iss.id} className={cn("flex items-center gap-2 sm:gap-3 rounded-lg border px-3 py-2", iss.is_resolved ? "border-zinc-800/50 opacity-40" : "border-zinc-800")}>
              <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold uppercase shrink-0", iss.severity === "critical" ? "bg-red-500/15 text-red-400" : iss.severity === "high" ? "bg-orange-500/15 text-orange-400" : "bg-yellow-500/15 text-yellow-400")}>{iss.severity}</span>
              <span className="text-[10px] text-zinc-500 hidden sm:inline">[{iss.area}]</span>
              <span className={cn("flex-1 text-xs min-w-0", iss.is_resolved ? "text-zinc-500 line-through" : "text-zinc-300")}>{iss.issue}</span>
              {toggleIssue && (
                <button onClick={() => toggleIssue(iss.id, iss.is_resolved)} className="p-1 rounded hover:bg-zinc-800 transition-colors shrink-0">
                  <Check size={12} className={iss.is_resolved ? "text-emerald-400" : "text-zinc-600"} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
