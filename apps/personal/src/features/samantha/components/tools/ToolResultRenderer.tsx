import { motion } from "framer-motion";
import {
  Loader2, CheckCircle2, XCircle, Wifi, WifiOff, Zap, Lightbulb,
  ListChecks, ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolResult, ToolExecStatus } from "../types";

// ─── Status badge (reused in all cards) ──────────────

function StatusBadge({ status }: { status: ToolExecStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-medium",
      status === "running" ? "text-white/50" : status === "success" ? "text-emerald-400" : "text-red-400"
    )}>
      {status === "running" ? <Loader2 size={11} className="animate-spin" /> :
       status === "success" ? <CheckCircle2 size={11} /> :
       <XCircle size={11} />}
      {status === "running" ? "Running…" : status === "success" ? "Complete" : "Failed"}
    </span>
  );
}

// ─── Health card ─────────────────────────────────────

function HealthCard({ result }: { result: Extract<ToolResult, { type: "health" }> }) {
  const online = result.services.filter(s => s.ok).length;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-white/60">
        <span className="font-semibold text-emerald-400">{online}/{result.services.length}</span> services online
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {result.services.map(s => (
          <div key={s.name} className={cn("flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px]",
            s.ok ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"
          )}>
            {s.ok ? <Wifi size={10} className="text-emerald-400 shrink-0" /> : <WifiOff size={10} className="text-red-400 shrink-0" />}
            <span className="text-white/70 truncate">{s.name}</span>
            {s.latency != null && s.ok && <span className="ml-auto text-[9px] text-white/30 font-mono">{s.latency}ms</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Workflow card ────────────────────────────────────

function WorkflowCard({ result }: { result: Extract<ToolResult, { type: "workflow" }> }) {
  return (
    <div className="flex items-center gap-3">
      <Zap size={14} className={result.status === "success" ? "text-emerald-400" : result.status === "error" ? "text-red-400" : "text-amber-400"} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white/80">{result.workflowName}</p>
        <p className="text-[10px] text-white/40 truncate">{result.message}</p>
      </div>
      <StatusBadge status={result.status} />
    </div>
  );
}

// ─── Audit card ──────────────────────────────────────

function AuditCard({ result }: { result: Extract<ToolResult, { type: "audit" }> }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-white/40 uppercase tracking-wider">{result.entries.length} recent changes</p>
      {result.entries.slice(0, 5).map(e => (
        <div key={e.id} className="flex items-center gap-2 text-[11px]">
          <ScrollText size={10} className="text-cyan-400/60 shrink-0" />
          <span className="text-white/50">[{e.source}]</span>
          <span className="text-white/70 truncate">{e.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Task / Idea card ────────────────────────────────

function TaskCard({ result }: { result: Extract<ToolResult, { type: "task" | "idea" }> }) {
  const isIdea = result.type === "idea";
  const Icon = isIdea ? Lightbulb : ListChecks;
  return (
    <div className="flex items-center gap-3">
      <Icon size={14} className={isIdea ? "text-amber-400" : "text-blue-400"} />
      <div className="flex-1">
        <p className="text-xs font-medium text-white/80">{isIdea ? "Idea saved" : "Task created"}</p>
        <p className="text-[10px] text-white/50">{(result as unknown).task?.text || (result as unknown).idea?.text}</p>
      </div>
    </div>
  );
}

// ─── Workflows list card ─────────────────────────────

function WorkflowsListCard({ result }: { result: Extract<ToolResult, { type: "workflows_list" }> }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-white/40 uppercase tracking-wider">{result.workflows.length} available workflows</p>
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {result.workflows.map(w => (
          <div key={w.name} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px]">
            <Zap size={10} className="text-purple-400 shrink-0" />
            <span className="text-white/70 font-medium">{w.label}</span>
            <span className="ml-auto text-[9px] text-white/30 rounded bg-white/5 px-1.5 py-0.5">{w.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Generic card ────────────────────────────────────

function GenericCard({ result }: { result: Extract<ToolResult, { type: "generic" }> }) {
  return (
    <div>
      <p className="text-xs font-medium text-white/70 mb-1">{result.title}</p>
      <p className="text-[11px] text-white/50">{result.content}</p>
    </div>
  );
}

// ─── Registry (Open-Closed pattern) ──────────────────

const RENDERERS: Record<string, React.ComponentType<{ result: unknown }>> = {
  health: HealthCard,
  workflow: WorkflowCard,
  audit: AuditCard,
  task: TaskCard,
  idea: TaskCard,
  workflows_list: WorkflowsListCard,
  generic: GenericCard,
};

// ─── Exported component ──────────────────────────────

export default function ToolResultRenderer({ result, status }: { result?: ToolResult; status?: ToolExecStatus }) {
  if (!result && status) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-sm"
      >
        <StatusBadge status={status} />
      </motion.div>
    );
  }

  if (!result) return null;

  const Renderer = RENDERERS[result.type];
  if (!Renderer) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-sm"
    >
      <Renderer result={result} />
    </motion.div>
  );
}
