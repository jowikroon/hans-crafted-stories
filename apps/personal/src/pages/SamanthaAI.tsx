// ═══════════════════════════════════════════════════════════════
//  SAMANTHA — Unified AI Cockpit v3
//  AI Operating Layer: Command Center strip, Action Queue,
//  system state visibility, multi-step task awareness
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigate, Link, useSearchParams } from "react-router-dom";
import {
  Send, Loader2, ChevronDown, Network, BookOpen,
  HeartPulse, ScrollText, Lightbulb, ListChecks, GitBranch,
  Wifi, WifiOff, PanelRightOpen, PanelRightClose,
  RefreshCw, StopCircle, Zap, Brain, CheckCircle2, XCircle,
  Clock, Activity,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { triggerWorkflow } from "@/lib/intent/pipeline";
import { fastRoute } from "@/lib/intent/router";
import { WORKFLOWS } from "@/lib/config/workflows";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

import type { Message, Stage, Emotion, ToolResult, TaskRecord, PanelId, ServiceHealthEntry } from "@/features/samantha/types";
import { SLASH_COMMANDS } from "@/features/samantha/types";
import { AI_MODELS, MODEL_KEY, HISTORY_KEY, TASKS_KEY } from "@/features/samantha/lib/models";
import { sendToModel, callAgent, fetchHealthStatus, buildSystemPrompt } from "@/features/samantha/lib/providers";
import MarkdownContent from "@/features/samantha/components/chat/MarkdownContent";
import ToolResultRenderer from "@/features/samantha/components/tools/ToolResultRenderer";

function uid() { return Math.random().toString(36).slice(2, 10); }

// ═══ Types for the operating layer ═══

interface Operation {
  id: string;
  label: string;
  type: "health" | "workflow" | "chat" | "agent" | "task";
  status: "running" | "success" | "error";
  startedAt: number;
  completedAt?: number;
}

// ═══ Samantha Dot ═══

function SamanthaDot({ emotion, size = 8 }: { emotion: Emotion; size?: number }) {
  const colors: Record<Emotion, string> = { calm: "bg-white/60", thinking: "bg-white/80", working: "bg-amber-400", speaking: "bg-violet-400", error: "bg-red-400", success: "bg-emerald-400" };
  return <span className={cn("inline-block rounded-full", colors[emotion], (emotion === "thinking" || emotion === "working") && "animate-pulse")} style={{ width: size, height: size }} />;
}

// ═══ Command Center Strip ═══

function CommandStrip({
  emotion, healthCache, model, stage, taskCount, ops, isMobile,
  onAction,
}: {
  emotion: Emotion; healthCache: ServiceHealthEntry[] | null; model: string;
  stage: Stage; taskCount: number; ops: Operation[]; isMobile: boolean;
  onAction: (action: string) => void;
}) {
  const healthOnline = healthCache?.filter(s => s.ok).length ?? 0;
  const healthTotal = healthCache?.length ?? 0;
  const runningOps = ops.filter(o => o.status === "running");
  const lastFailed = [...ops].reverse().find(o => o.status === "error");

  // System status line — now shows *what's* running
  const statusText = useMemo(() => {
    if (stage === "thinking") return "Thinking…";
    if (stage === "executing" || stage === "routing") {
      if (runningOps.length === 1) return runningOps[0].label;
      if (runningOps.length > 1) return `${runningOps.length} running`;
      return "Executing…";
    }
    if (lastFailed && Date.now() - (lastFailed.completedAt || 0) < 30_000) return `Failed: ${lastFailed.label}`;
    if (healthCache && healthOnline < healthTotal) return `${healthTotal - healthOnline} service${healthTotal - healthOnline > 1 ? "s" : ""} down`;
    return "Idle";
  }, [stage, runningOps, lastFailed, healthCache, healthOnline, healthTotal]);

  const isActive = stage !== "idle" || runningOps.length > 0;

  const actions: { key: string; label: string; icon: typeof HeartPulse }[] = [
    { key: "health", label: "Health", icon: HeartPulse },
    { key: "workflows", label: "Flows", icon: GitBranch },
    { key: "operations", label: "Ops", icon: Activity },
    { key: "tasks", label: "Tasks", icon: ListChecks },
    { key: "audit", label: "Audit", icon: ScrollText },
    { key: "model", label: "Model", icon: Brain },
  ];

  return (
    <div className={cn(
      "shrink-0 flex items-center gap-2 px-4 sm:px-6 py-1.5 border-b overflow-x-auto scrollbar-none transition-colors duration-500",
      isActive ? "border-amber-500/10 bg-amber-500/[0.02]" : "border-white/[0.06] bg-white/[0.015]"
    )}>
      {/* System state — clickable to open operations */}
      <button onClick={() => onAction("operations")} className="flex items-center gap-2 shrink-0 hover:text-white/50 transition-colors">
        <SamanthaDot emotion={emotion} size={6} />
        <span className={cn(
          "text-[10px] font-medium whitespace-nowrap truncate max-w-[120px]",
          lastFailed && Date.now() - (lastFailed.completedAt || 0) < 30_000 ? "text-red-400/60" :
          isActive ? "text-amber-400/60" : "text-white/35"
        )}>{statusText}</span>
      </button>

      <span className="w-px h-3 bg-white/10 shrink-0" />

      {/* Health summary */}
      {healthCache && (
        <button onClick={() => onAction("health")} className="flex items-center gap-1 text-[10px] shrink-0 hover:text-white/60 transition-colors">
          <span className={cn("h-1.5 w-1.5 rounded-full", healthOnline === healthTotal ? "bg-emerald-400" : "bg-amber-400")} />
          <span className="text-white/30 font-mono">{healthOnline}/{healthTotal}</span>
        </button>
      )}

      {/* Task count */}
      {taskCount > 0 && (
        <button onClick={() => onAction("tasks")} className="flex items-center gap-1 text-[10px] text-white/30 shrink-0 hover:text-white/50 transition-colors">
          <ListChecks size={9} /><span className="font-mono">{taskCount}</span>
        </button>
      )}

      {/* Model tag */}
      <span className="text-[9px] text-white/20 font-mono truncate max-w-[80px] shrink-0 hidden sm:block">{model}</span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Quick actions */}
      <div className="flex items-center gap-1 shrink-0">
        {actions.map(a => {
          const Icon = a.icon;
          return (
            <button key={a.key} onClick={() => onAction(a.key)} className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[9px] text-white/25 hover:text-white/50 hover:bg-white/5 transition-all" title={a.label}>
              <Icon size={10} />
              {!isMobile && <span>{a.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══ Action Queue (above input) ═══

function ActionQueue({ ops, onRetry }: { ops: Operation[]; onRetry?: (op: Operation) => void }) {
  const visible = ops.filter(o => {
    if (o.status === "running") return true;
    // Show completed/failed ops for 15 seconds
    return o.completedAt && Date.now() - o.completedAt < 15_000;
  }).slice(0, 4);

  if (visible.length === 0) return null;

  return (
    <div className="shrink-0 border-t border-white/[0.06] bg-white/[0.015] py-1.5">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
        <Activity size={9} className="text-white/20 shrink-0" />
        {visible.map(op => (
          <motion.div
            key={op.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] shrink-0",
              op.status === "running" ? "border-amber-500/20 bg-amber-500/5 text-amber-400/80" :
              op.status === "success" ? "border-emerald-500/15 bg-emerald-500/5 text-emerald-400/60" :
              "border-red-500/15 bg-red-500/5 text-red-400/60"
            )}
          >
            {op.status === "running" ? <Loader2 size={8} className="animate-spin" /> :
             op.status === "success" ? <CheckCircle2 size={8} /> :
             <XCircle size={8} />}
            <span className="truncate max-w-[100px]">{op.label}</span>
            {op.status === "running" ? (
              <ElapsedTimer startedAt={op.startedAt} />
            ) : op.completedAt ? (
              <span className="text-[8px] text-white/20 font-mono">{((op.completedAt - op.startedAt) / 1000).toFixed(1)}s</span>
            ) : null}
            {op.status === "error" && onRetry && (
              <button
                onClick={() => onRetry(op)}
                className="ml-0.5 rounded px-1 py-px text-[8px] text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                title="Retry"
              >
                <RefreshCw size={7} />
              </button>
            )}
          </motion.div>
        ))}
      </div>
      </div>
    </div>
  );
}

function ElapsedTimer({ startedAt }: { startedAt: number }) {
  const [, setTick] = useState(0);
  useEffect(() => { const i = setInterval(() => setTick(t => t + 1), 500); return () => clearInterval(i); }, []);
  return <span className="text-[8px] text-white/30 font-mono">{((Date.now() - startedAt) / 1000).toFixed(0)}s</span>;
}

// ═══ Inline Health Bar (compact, below command strip) ═══

function InlineHealthBar({ cache, onExpand }: { cache: ServiceHealthEntry[] | null; onExpand: () => void }) {
  if (!cache || cache.length === 0) return null;
  const online = cache.filter(s => s.ok).length;
  const allGood = online === cache.length;
  const down = cache.filter(s => !s.ok);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="shrink-0 border-b border-white/[0.04]"
    >
      <button
        onClick={onExpand}
        className="w-full flex items-center gap-2 px-4 sm:px-6 py-1 hover:bg-white/[0.02] transition-colors min-w-0"
      >
        {/* Service dots */}
        <div className="flex items-center gap-0.5 shrink-0">
          {cache.map(s => (
            <span
              key={s.name}
              className={cn("h-1 w-1 rounded-full", s.ok ? "bg-emerald-400/60" : "bg-red-400")}
              title={`${s.name}: ${s.ok ? "online" : "down"}`}
            />
          ))}
        </div>
        <span className={cn(
          "text-[9px] font-medium truncate",
          allGood ? "text-emerald-400/40" : "text-red-400/70"
        )}>
          {allGood ? "All systems operational" : `${down.length} down: ${down.map(s => s.name).join(", ")}`}
        </span>
        {!allGood && (
          <span className="ml-auto text-[8px] text-white/20 shrink-0">Details →</span>
        )}
      </button>
    </motion.div>
  );
}

// ═══ Quick Actions (above input) ═══

function QuickActionBar({ onAction, hasInput, isIdle }: { onAction: (cmd: string) => void; hasInput: boolean; isIdle: boolean }) {
  if (hasInput || !isIdle) return null;

  const actions = [
    { key: "/health", label: "Check Health", icon: HeartPulse, color: "text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/10" },
    { key: "/workflows", label: "Run Workflow", icon: Zap, color: "text-purple-400/60 hover:text-purple-400 hover:bg-purple-500/10 border-purple-500/10" },
    { key: "/task ", label: "New Task", icon: ListChecks, color: "text-blue-400/60 hover:text-blue-400 hover:bg-blue-500/10 border-blue-500/10" },
    { key: "/audit", label: "Audit", icon: ScrollText, color: "text-amber-400/60 hover:text-amber-400 hover:bg-amber-500/10 border-amber-500/10" },
  ];

  return (
    <div className="shrink-0 pb-1.5">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {actions.map(a => {
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              onClick={() => onAction(a.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-all shrink-0",
                a.color
              )}
            >
              <Icon size={10} />
              {a.label}
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
}

// ═══ Health Panel (with cache) ═══

function HealthPanel({ cache, setCache }: { cache: ServiceHealthEntry[] | null; setCache: (s: ServiceHealthEntry[]) => void }) {
  const [loading, setLoading] = useState(!cache);
  const services = cache || [];
  const refresh = useCallback(async () => { setLoading(true); const s = await fetchHealthStatus(); setCache(s); setLoading(false); }, [setCache]);
  useEffect(() => { if (!cache) refresh(); }, [cache, refresh]);
  const online = services.filter(s => s.ok).length;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">System Health</h3>
        <button onClick={refresh} disabled={loading} className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors disabled:opacity-30"><RefreshCw size={12} className={loading ? "animate-spin" : ""} /></button>
      </div>
      {loading && !cache ? (
        <div className="flex items-center justify-center py-8"><Loader2 size={16} className="animate-spin text-white/30" /></div>
      ) : (
        <>
          <div className="text-center py-2">
            <p className={cn("text-2xl font-bold font-mono", online === services.length ? "text-emerald-400" : online > 0 ? "text-amber-400" : "text-red-400")}>{online}/{services.length}</p>
            <p className="text-[10px] text-white/30 mt-1">services online</p>
          </div>
          <div className="space-y-1.5">
            {services.map(s => (
              <div key={s.name} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-xs", s.ok ? "border-emerald-500/15 bg-emerald-500/5" : "border-red-500/15 bg-red-500/5")}>
                {s.ok ? <Wifi size={10} className="text-emerald-400" /> : <WifiOff size={10} className="text-red-400" />}
                <span className="text-white/70 flex-1">{s.name}</span>
                {s.latency != null && s.ok && <span className="text-[9px] text-white/30 font-mono">{s.latency}ms</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ═══ Workflows Panel ═══

function WorkflowsPanel({ onTrigger }: { onTrigger: (name: string) => void }) {
  const catColor: Record<string, string> = { seo: "bg-emerald-500/15 text-emerald-400", data: "bg-blue-500/15 text-blue-400", infra: "bg-violet-500/15 text-violet-400", marketing: "bg-amber-500/15 text-amber-400", ai: "bg-pink-500/15 text-pink-400" };
  return (
    <div className="p-4 space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Workflows</h3>
      <div className="space-y-1.5">
        {WORKFLOWS.map(w => (
          <button key={w.name} onClick={() => onTrigger(w.name)} className="w-full flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left hover:bg-white/[0.06] hover:border-white/15 transition-all group">
            <Zap size={12} className="text-purple-400/70 group-hover:text-purple-400 transition-colors shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white/70 group-hover:text-white/90 transition-colors">{w.label}</p>
              <p className="text-[10px] text-white/30 truncate">{w.description}</p>
            </div>
            <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium shrink-0", catColor[w.category] || "bg-white/10 text-white/40")}>{w.category}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══ Audit Panel — Recent Activity ═══

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AuditPanel() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from("samantha_memory")
        .select("id,key,value,source,created_at")
        .eq("category", "audit")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setEvents(data);
    } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    const channel = supabase.channel("audit-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "samantha_memory", filter: "category=eq.audit" },
        (payload) => { setEvents(prev => [payload.new as any, ...prev].slice(0, 20)); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Recent Activity</h3>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" title="Live feed" />
        </div>
        <button onClick={fetchEvents} disabled={loading} className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors disabled:opacity-30"><RefreshCw size={12} className={loading ? "animate-spin" : ""} /></button>
      </div>
      {loading && events.length === 0 ? (
        <div className="flex items-center justify-center py-8"><Loader2 size={16} className="animate-spin text-white/30" /></div>
      ) : events.length === 0 ? (
        <div className="text-center py-6">
          <ScrollText size={20} className="text-white/10 mx-auto mb-2" />
          <p className="text-[11px] text-white/30">No events yet.</p>
          <p className="text-[10px] text-white/20 mt-1">Run <code className="text-white/40 bg-white/5 px-1 rounded">/health</code> to generate the first entry.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((e: any) => {
            let parsed: any = {};
            try { parsed = JSON.parse(e.value); } catch {}
            const isHealth = e.source === "empire-health";
            const isHealthy = parsed.online === parsed.total;
            const downCount = parsed.down?.length || 0;

            return (
              <div key={e.id} className={cn(
                "rounded-xl border px-3 py-2.5 transition-colors",
                isHealth
                  ? isHealthy ? "border-emerald-500/10 bg-emerald-500/[0.02]" : "border-red-500/10 bg-red-500/[0.02]"
                  : "border-white/[0.06] bg-white/[0.02]"
              )}>
                <div className="flex items-start gap-2.5">
                  {/* Event icon */}
                  <div className={cn(
                    "mt-0.5 h-5 w-5 rounded-md flex items-center justify-center shrink-0",
                    isHealth
                      ? isHealthy ? "bg-emerald-500/10" : "bg-red-500/10"
                      : "bg-white/5"
                  )}>
                    {isHealth
                      ? (isHealthy ? <CheckCircle2 size={10} className="text-emerald-400/70" /> : <XCircle size={10} className="text-red-400/70" />)
                      : <Activity size={10} className="text-white/30" />
                    }
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-white/50">{e.source || "system"}</span>
                      <span className="text-[9px] text-white/20 ml-auto shrink-0">{relativeTime(e.created_at)}</span>
                    </div>
                    <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">
                      {isHealth && parsed.online != null ? (
                        <>
                          <span className={isHealthy ? "text-emerald-400/60" : "text-white/50"}>{parsed.online}/{parsed.total} services online</span>
                          {downCount > 0 && <span className="text-red-400/60"> · {parsed.down.join(", ")} down</span>}
                        </>
                      ) : (
                        e.key
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══ Operations History Panel ═══

function OperationsPanel({ ops, onRetry }: { ops: Operation[]; onRetry?: (op: Operation) => void }) {
  const sorted = [...ops].sort((a, b) => b.startedAt - a.startedAt);
  const running = sorted.filter(o => o.status === "running");
  const completed = sorted.filter(o => o.status !== "running");

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Operations</h3>

      {sorted.length === 0 && (
        <div className="text-center py-8">
          <Activity size={20} className="text-white/15 mx-auto mb-2" />
          <p className="text-[11px] text-white/30">No operations yet.</p>
          <p className="text-[10px] text-white/20 mt-1">Run a workflow or health check to see activity here.</p>
        </div>
      )}

      {running.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[9px] uppercase tracking-wider text-amber-400/50 font-medium">Active</p>
          {running.map(op => (
            <div key={op.id} className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs">
              <Loader2 size={11} className="animate-spin text-amber-400 shrink-0" />
              <span className="text-white/70 flex-1 truncate">{op.label}</span>
              <ElapsedTimer startedAt={op.startedAt} />
            </div>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[9px] uppercase tracking-wider text-white/25 font-medium">History</p>
          {completed.map(op => (
            <div key={op.id} className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
              op.status === "success" ? "border-emerald-500/10 bg-emerald-500/[0.03]" : "border-red-500/10 bg-red-500/[0.03]"
            )}>
              {op.status === "success" ? <CheckCircle2 size={11} className="text-emerald-400/60 shrink-0" /> : <XCircle size={11} className="text-red-400/60 shrink-0" />}
              <div className="flex-1 min-w-0">
                <span className="text-white/60 truncate block">{op.label}</span>
                <span className="text-[9px] text-white/25 font-mono">
                  {op.completedAt ? `${((op.completedAt - op.startedAt) / 1000).toFixed(1)}s · ${new Date(op.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}
                </span>
              </div>
              <span className={cn("text-[9px] font-medium shrink-0 rounded px-1.5 py-0.5",
                op.type === "workflow" ? "bg-purple-500/10 text-purple-400/60" :
                op.type === "health" ? "bg-emerald-500/10 text-emerald-400/60" :
                op.type === "agent" ? "bg-blue-500/10 text-blue-400/60" :
                "bg-white/5 text-white/30"
              )}>{op.type}</span>
              {op.status === "error" && onRetry && (
                <button onClick={() => onRetry(op)} className="rounded px-1.5 py-0.5 text-[9px] text-red-400/60 hover:text-red-300 hover:bg-red-500/10 transition-colors" title="Retry">
                  <RefreshCw size={9} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══ Context Panel ═══

function ContextPanel({ panel, setPanel, onTriggerWorkflow, healthCache, setHealthCache, ops, onRetryOp }: {
  panel: PanelId; setPanel: (p: PanelId) => void;
  onTriggerWorkflow: (name: string) => void;
  healthCache: ServiceHealthEntry[] | null; setHealthCache: (s: ServiceHealthEntry[]) => void;
  ops: Operation[]; onRetryOp?: (op: Operation) => void;
}) {
  const runningCount = ops.filter(o => o.status === "running").length;
  const tabs: { id: "health" | "workflows" | "operations" | "audit"; label: string; icon: typeof HeartPulse; badge?: number }[] = [
    { id: "health", label: "Health", icon: HeartPulse },
    { id: "workflows", label: "Workflows", icon: GitBranch },
    { id: "operations", label: "Ops", icon: Activity, badge: runningCount || undefined },
    { id: "audit", label: "Activity", icon: ScrollText },
  ];
  const active = panel || "health";

  return (
    <div className="h-full flex flex-col bg-black/40 backdrop-blur-xl">
      <div className="flex border-b border-white/10 px-2 py-1.5 gap-1 shrink-0">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setPanel(t.id)} className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-medium transition-all", active === t.id ? "bg-white/10 text-white/80" : "text-white/30 hover:text-white/50 hover:bg-white/5")}>
              <Icon size={11} />{t.label}
              {t.badge && t.badge > 0 && (
                <span className="h-3.5 min-w-[14px] rounded-full bg-amber-500/30 text-amber-400 text-[8px] font-bold flex items-center justify-center px-1">{t.badge}</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto">
        {active === "health" && <HealthPanel cache={healthCache} setCache={setHealthCache} />}
        {active === "workflows" && <WorkflowsPanel onTrigger={onTriggerWorkflow} />}
        {active === "operations" && <OperationsPanel ops={ops} onRetry={onRetryOp} />}
        {active === "audit" && <AuditPanel />}
      </div>
    </div>
  );
}

// ═══ Slash Command Picker ═══

function SlashPicker({ query, onSelect, onClose }: { query: string; onSelect: (cmd: string, arg: string) => void; onClose: () => void }) {
  const parts = query.split(" ");
  const cmdPart = parts[0].toLowerCase().replace("/", "");
  const argPart = parts.slice(1).join(" ");
  const filtered = SLASH_COMMANDS.filter(c => c.cmd.slice(1).includes(cmdPart) || c.label.toLowerCase().includes(cmdPart));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-white/15 bg-black/90 backdrop-blur-xl shadow-2xl overflow-hidden z-50">
      <div className="p-1 max-h-[240px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-[11px] text-white/30 px-3 py-2">No matching commands</p>
        ) : (
          filtered.map(c => (
            <button key={c.cmd} onClick={() => { onSelect(c.handler, argPart); onClose(); }} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-white/10 transition-colors group">
              <span className="text-xs font-mono text-purple-400/80">{c.cmd}</span>
              <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors flex-1">{c.description}</span>
            </button>
          ))
        )}
      </div>
    </motion.div>
  );
}

// ═══ MAIN COMPONENT ═══

export default function SamanthaAI() {
  const { user, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [selectedModel, setSelectedModel] = useState(() => { try { return localStorage.getItem(MODEL_KEY) || AI_MODELS[0].id; } catch { return AI_MODELS[0].id; } });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskRecord[]>(() => { try { const s = localStorage.getItem(TASKS_KEY); return s ? JSON.parse(s) : []; } catch { return []; } });
  const [healthCache, setHealthCache] = useState<ServiceHealthEntry[] | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);

  // ─── Operation tracking helpers ────────────────────
  const startOp = useCallback((label: string, type: Operation["type"]): string => {
    const id = uid();
    setOperations(prev => [{ id, label, type, status: "running", startedAt: Date.now() }, ...prev].slice(0, 20));
    return id;
  }, []);
  const endOp = useCallback((id: string, status: "success" | "error") => {
    setOperations(prev => prev.map(o => o.id === id ? { ...o, status, completedAt: Date.now() } : o));
  }, []);

  // Auto-prune completed ops older than 5 minutes (keeps history in panel)
  useEffect(() => {
    const timer = setInterval(() => {
      setOperations(prev => prev.filter(o => o.status === "running" || (o.completedAt && Date.now() - o.completedAt < 300_000)));
    }, 15_000);
    return () => clearInterval(timer);
  }, []);

  // ─── Task Supabase sync ────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from("samantha_memory")
          .select("key,value,category")
          .in("category", ["task", "idea"])
          .order("created_at", { ascending: false })
          .limit(100);
        if (data && data.length > 0) {
          const dbTasks: TaskRecord[] = data.map(d => { try { return JSON.parse(d.value); } catch { return null; } }).filter(Boolean);
          if (dbTasks.length > 0) {
            setTasks(prev => {
              const ids = new Set(dbTasks.map(t => t.id));
              return [...dbTasks, ...prev.filter(t => !ids.has(t.id))];
            });
          }
        }
      } catch {}
    })();
  }, []);

  const persistTask = useCallback(async (t: TaskRecord) => {
    try {
      await supabase.from("samantha_memory").upsert({
        key: `task_${t.id}`, value: JSON.stringify(t), category: t.type, source: "samantha", user_id: "00000000-0000-0000-0000-000000000001",
      }, { onConflict: "key" });
    } catch {}
  }, []);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const panel = (searchParams.get("panel") as PanelId) || null;
  const hasMessages = messages.length > 0;
  const cur = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];

  // ─── Health context + auto-refresh ──────────────────
  const [healthContext, setHealthContext] = useState("");
  const refreshHealth = useCallback(async () => {
    try {
      const services = await fetchHealthStatus();
      setHealthCache(services);
      const on = services.filter(s => s.ok).length;
      setHealthContext(`${on}/${services.length} services online. ${services.filter(s => !s.ok).map(s => `${s.name} is DOWN`).join(", ") || "All healthy."}`);
    } catch {}
  }, []);
  useEffect(() => { refreshHealth(); }, [refreshHealth]);
  // Auto-refresh every 60 seconds (only when tab is visible)
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refreshHealth();
    }, 60_000);
    return () => clearInterval(timer);
  }, [refreshHealth]);

  const systemPrompt = useMemo(() => {
    const taskCtx = tasks.filter(t => !t.done).length > 0
      ? tasks.filter(t => !t.done).map((t, i) => `${i + 1}. [${t.type}] ${t.text}`).join("\n")
      : undefined;
    return buildSystemPrompt(healthContext, taskCtx);
  }, [healthContext, tasks]);

  // ─── Persistence ───────────────────────────────────
  const conversationId = useRef<string>(() => {
    try { return localStorage.getItem("samantha_conv_id") || uid() + uid(); } catch { return uid() + uid(); }
  });
  useEffect(() => { try { localStorage.setItem(MODEL_KEY, selectedModel); } catch {} }, [selectedModel]);
  useEffect(() => { try { const s = localStorage.getItem(HISTORY_KEY); if (s) { const p = JSON.parse(s); if (Array.isArray(p)) setMessages(p.map((m: any) => ({ ...m, streaming: false }))); } } catch {} }, []);
  useEffect(() => {
    if (messages.length > 0) {
      const saveable = messages.filter(m => !m.streaming).slice(-60);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(saveable)); } catch {}
      // Persist to Supabase (debounced, fire-and-forget)
      const timer = setTimeout(async () => {
        try {
          const convId = typeof conversationId.current === "function" ? conversationId.current() : conversationId.current;
          localStorage.setItem("samantha_conv_id", convId);
          await supabase.from("samantha_conversations").upsert({
            id: convId,
            messages: JSON.stringify(saveable.slice(-40)),
            model: selectedModel,
            updated_at: new Date().toISOString(),
            user_id: "00000000-0000-0000-0000-000000000001",
          }, { onConflict: "id" });
        } catch {} // Silent fail — localStorage is the primary store
      }, 3000); // 3-second debounce
      return () => clearTimeout(timer);
    }
  }, [messages, selectedModel]);
  useEffect(() => { try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); } catch {} }, [tasks]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, stage]);
  useEffect(() => { document.title = "Samantha — AI Cockpit"; }, []);

  const emotion: Emotion = useMemo(() => {
    if (stage === "thinking") return "thinking";
    if (stage === "executing" || stage === "routing") return "working";
    // Show success/error briefly after last operation
    const lastOp = operations.find(o => o.status !== "running" && o.completedAt && Date.now() - o.completedAt < 3000);
    if (lastOp?.status === "error") return "error";
    if (lastOp?.status === "success") return "success";
    return "calm";
  }, [stage, operations]);

  useEffect(() => {
    if (!pickerOpen) return;
    const h = (e: MouseEvent) => { if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [pickerOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); inputRef.current?.focus(); }
      if (e.key === "m" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setPickerOpen(v => !v); }
      if (e.key === "Escape") {
        if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; setStage("idle"); }
        setPickerOpen(false); setSlashOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (authLoading) return <div className="flex min-h-dvh items-center justify-center bg-[#0a0a0c]"><Loader2 size={20} className="animate-spin text-white/40" /></div>;
  if (!user) return <Navigate to="/portal" replace />;

  // ─── Helpers ───────────────────────────────────────
  const append = (msg: Omit<Message, "id" | "timestamp">): Message => {
    const m: Message = { ...msg, id: uid(), timestamp: Date.now() };
    setMessages(prev => [...prev, m]);
    return m;
  };
  const updateMessage = (id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };
  const setPanel = useCallback((p: PanelId) => {
    if (p) setSearchParams({ panel: p }); else setSearchParams({});
    if (isMobile && p) setPanelOpen(true);
  }, [isMobile, setSearchParams]);

  // ─── Command Strip action handler ──────────────────
  const handleStripAction = useCallback((action: string) => {
    switch (action) {
      case "health": handleSendRef.current("/health"); break;
      case "workflows": setPanel("workflows"); break;
      case "operations": setPanel("operations"); break;
      case "tasks": handleSendRef.current("/tasks"); break;
      case "audit": setPanel("audit"); break;
      case "model": setPickerOpen(true); break;
    }
  }, [setPanel]);

  // ─── Slash commands (with operation tracking) ──────
  const handleSlashCommand = async (handler: string, arg: string) => {
    switch (handler) {
      case "health": {
        setStage("executing");
        const opId = startOp("Health Check", "health");
        const toolMsg = append({ role: "tool", content: "", toolName: "Health Check", toolStatus: "running" });
        try {
          const services = await fetchHealthStatus();
          setHealthCache(services);
          const on = services.filter(s => s.ok).length;
          updateMessage(toolMsg.id, { toolStatus: "success", toolResult: { type: "health", services } });
          append({ role: "samantha", content: `**Health check complete:** ${on}/${services.length} services online.`, model: "System" });
          setPanel("health");
          endOp(opId, "success");
        } catch { updateMessage(toolMsg.id, { toolStatus: "error" }); endOp(opId, "error"); append({ role: "samantha", content: "Health check failed.", model: "System" }); }
        setStage("idle"); return;
      }
      case "workflows": {
        append({ role: "tool", content: "", toolResult: { type: "workflows_list", workflows: WORKFLOWS.map(w => ({ name: w.name, label: w.label, category: w.category, description: w.description })) }, toolStatus: "success", toolName: "Workflows" });
        setPanel("workflows"); return;
      }
      case "run": {
        if (!arg) { append({ role: "samantha", content: "Usage: `/run <workflow-name>`\n\nAvailable: " + WORKFLOWS.map(w => `\`${w.name}\``).join(", "), model: "System" }); return; }
        const wf = WORKFLOWS.find(w => w.name === arg || w.label.toLowerCase() === arg.toLowerCase());
        if (!wf) { append({ role: "samantha", content: `Workflow "${arg}" not found. Try \`/workflows\`.`, model: "System" }); return; }
        setStage("executing");
        const opId = startOp(wf.label, "workflow");
        const toolMsg = append({ role: "tool", content: "", toolName: wf.label, toolStatus: "running" });
        try {
          const res = await triggerWorkflow(wf, "samantha", { message: arg });
          updateMessage(toolMsg.id, { toolStatus: res.ok ? "success" : "error", toolResult: { type: "workflow", workflowName: wf.label, status: res.ok ? "success" : "error", message: res.ok ? "Completed" : (res.error || "Failed") } });
          append({ role: "samantha", content: res.ok ? `✅ **${wf.label}** completed.` : `❌ **${wf.label}** failed: ${res.error}`, model: wf.label });
          endOp(opId, res.ok ? "success" : "error");
        } catch (e: any) { updateMessage(toolMsg.id, { toolStatus: "error" }); endOp(opId, "error"); }
        setStage("idle"); return;
      }
      case "task": {
        if (!arg) { append({ role: "samantha", content: "Usage: `/task <description>`", model: "System" }); return; }
        const t: TaskRecord = { id: uid(), text: arg, type: "task", created_at: Date.now() };
        setTasks(prev => [...prev, t]);
        persistTask(t);
        append({ role: "tool", content: "", toolResult: { type: "task", task: t }, toolStatus: "success", toolName: "Task" });
        return;
      }
      case "idea": {
        if (!arg) { append({ role: "samantha", content: "Usage: `/idea <description>`", model: "System" }); return; }
        const t: TaskRecord = { id: uid(), text: arg, type: "idea", created_at: Date.now() };
        setTasks(prev => [...prev, t]);
        persistTask(t);
        append({ role: "tool", content: "", toolResult: { type: "idea", idea: t }, toolStatus: "success", toolName: "Idea" });
        return;
      }
      case "done": {
        if (!arg) { append({ role: "samantha", content: "Usage: `/done <task number>` — use `/tasks` to see numbers.", model: "System" }); return; }
        const idx = parseInt(arg, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= tasks.length) { append({ role: "samantha", content: `Invalid task number. You have ${tasks.length} tasks.`, model: "System" }); return; }
        const updated = { ...tasks[idx], done: !tasks[idx].done };
        setTasks(prev => prev.map((t, i) => i === idx ? updated : t));
        persistTask(updated);
        append({ role: "samantha", content: updated.done ? `✅ Marked done: "${updated.text}"` : `↩️ Reopened: "${updated.text}"`, model: "System" });
        return;
      }
      case "tasks": {
        if (tasks.length === 0) { append({ role: "samantha", content: "No tasks or ideas yet. Use `/task` or `/idea` to add some.", model: "System" }); return; }
        const taskList = tasks.map((t, i) => `${i + 1}. ${t.type === "task" ? "📋" : "💡"} ${t.done ? "~~" : ""}${t.text}${t.done ? "~~" : ""}`).join("\n");
        append({ role: "samantha", content: `**Your tasks & ideas** (${tasks.length}):\n\n${taskList}\n\nUse \`/done <number>\` to mark complete.`, model: "System" });
        return;
      }
      case "audit": { setPanel("audit"); append({ role: "samantha", content: "Opening audit trail →", model: "System" }); return; }
      case "model": {
        if (!arg) { setPickerOpen(true); return; }
        const found = AI_MODELS.find(m => m.id === arg || m.label.toLowerCase().includes(arg.toLowerCase()));
        if (found) { setSelectedModel(found.id); append({ role: "samantha", content: `Switched to **${found.label}** (${found.provider})`, model: "System" }); }
        else { append({ role: "samantha", content: `Model "${arg}" not found.`, model: "System" }); }
        return;
      }
      case "clear": { setMessages([]); setOperations([]); return; }
    }
  };

  const handleAbort = () => {
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    if (streamingId) { updateMessage(streamingId, { streaming: false, content: messages.find(m => m.id === streamingId)?.content + "\n\n*(cancelled)*" }); setStreamingId(null); }
    setStage("idle");
  };

  // ─── Send (with operation tracking) ────────────────
  const handleSend = async (override?: string) => {
    const text = (override || input).trim();
    if (!text || stage !== "idle") return;
    setInput("");
    setSlashOpen(false);

    if (text.startsWith("/")) {
      const parts = text.split(" ");
      const cmd = parts[0].toLowerCase();
      const arg = parts.slice(1).join(" ").trim();
      const match = SLASH_COMMANDS.find(c => c.cmd === cmd);
      if (match) { append({ role: "user", content: text }); await handleSlashCommand(match.handler, arg); return; }
    }

    append({ role: "user", content: text });

    if (/\b(health|status|services?\s+(up|down|check|online))\b/i.test(text.toLowerCase())) {
      await handleSlashCommand("health", ""); return;
    }

    if (cur.kind === "agent") {
      setStage("executing");
      const opId = startOp(cur.label, "agent");
      const toolMsg = append({ role: "tool", content: "", toolName: cur.label, toolStatus: "running" });
      try {
        const result = await callAgent(cur.id, text);
        updateMessage(toolMsg.id, { toolStatus: "success", toolResult: result.healthData ? { type: "health", services: result.healthData } : undefined });
        append({ role: "samantha", content: result.text, model: cur.label });
        if (result.healthData) setPanel("health");
        endOp(opId, "success");
      } catch (e: any) {
        updateMessage(toolMsg.id, { toolStatus: "error" });
        append({ role: "samantha", content: `Something went wrong: ${e?.message}`, model: cur.label });
        endOp(opId, "error");
      }
      setStage("idle"); return;
    }

    // ─── Smart routing: fast keyword match → workflow, otherwise → chat ────
    // Skip the slow LLM intent classifier. The fastRoute handles all keyword
    // matches. Conversational messages go straight to chat without the 1-3s
    // round-trip to the intent-router edge function.
    setStage("routing");
    const route = fastRoute(text);

    if (route.confidence >= 0.85 && route.workflow) {
      // High-confidence workflow match
      setStage("executing");
      const wf = route.workflow;
      const opId = startOp(wf.label, "workflow");
      const toolMsg = append({ role: "tool", content: "", toolName: wf.label, toolStatus: "running" });
      try {
        const res = await triggerWorkflow(wf, "samantha", { message: text });
        updateMessage(toolMsg.id, { toolStatus: res.ok ? "success" : "error", toolResult: { type: "workflow", workflowName: wf.label, status: res.ok ? "success" : "error", message: res.ok ? "Done" : (res.error || "Failed") } });
        append({ role: "samantha", content: res.ok ? `Done — ${typeof res.data === "string" ? res.data : JSON.stringify(res.data).slice(0, 300)}` : `${wf.label} failed: ${res.error}`, model: wf.label });
        endOp(opId, res.ok ? "success" : "error");
      } catch (e: any) { updateMessage(toolMsg.id, { toolStatus: "error" }); endOp(opId, "error"); }
      setStage("idle"); return;
    }

    if (route.confidence >= 0.5 && route.alternatives && route.alternatives.length > 0) {
      // Medium-confidence — offer alternatives
      append({ role: "samantha", content: `I found a few options:\n\n${route.alternatives.map(w => `• **${w.label}** — ${w.description}`).join("\n")}\n\nWhich one?`, model: "System" });
      setStage("idle"); return;
    }

    // Chat — go directly to the AI model (skip LLM intent classification)
    setStage("thinking");
    const opId = startOp("Chat", "chat");
    const streamMsg = append({ role: "samantha", content: "", streaming: true, model: cur.label });
    setStreamingId(streamMsg.id);
    abortRef.current = new AbortController();
    try {
      const history = messages.filter(m => m.role === "user" || m.role === "samantha").slice(-20).map(m => ({ role: m.role === "samantha" ? "assistant" : "user", content: m.content }));
      history.push({ role: "user", content: text });
      const reply = await sendToModel(cur.id, history, systemPrompt, (chunk) => { updateMessage(streamMsg.id, { content: chunk }); }, abortRef.current?.signal);
      updateMessage(streamMsg.id, { content: reply, streaming: false });
      endOp(opId, "success");
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        updateMessage(streamMsg.id, { content: `⚠️ ${e?.message || "Unknown error"}`, streaming: false });
        endOp(opId, "error");
      } else {
        endOp(opId, "error");
      }
    }
    abortRef.current = null;
    setStreamingId(null);
    setStage("idle");
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    setSlashOpen(val.startsWith("/") && val.length > 0 && val.length < 20 && !val.includes("\n"));
  };

  const handleSendRef = useRef(handleSend);
  handleSendRef.current = handleSend;

  const handlePanelWorkflowTrigger = useCallback((name: string) => {
    handleSendRef.current(`/run ${name}`);
  }, []);

  const handleRetryOp = useCallback((op: Operation) => {
    // Re-run based on operation type
    if (op.type === "health") {
      handleSendRef.current("/health");
    } else if (op.type === "workflow") {
      // label matches workflow label — find and re-trigger
      const wf = WORKFLOWS.find(w => w.label === op.label);
      if (wf) handleSendRef.current(`/run ${wf.name}`);
    }
  }, []);

  const handleQuickAction = useCallback((cmd: string) => {
    // Commands that need user input: set as input value so user can complete
    if (cmd.endsWith(" ")) {
      setInput(cmd);
      inputRef.current?.focus();
      return;
    }
    // Complete commands: send immediately
    handleSendRef.current(cmd);
  }, []);

  // ─── Chat content ──────────────────────────────────

  const pendingTaskCount = tasks.filter(t => !t.done).length;

  const chatContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-1.5 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <SamanthaDot emotion={emotion} size={10} />
          <h1 className="text-sm font-semibold text-white/80">Samantha</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Model selector — relative container for dropdown anchor */}
          <div className="relative" ref={pickerRef}>
            <button onClick={() => setPickerOpen(!pickerOpen)} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-medium text-white/50 hover:text-white/70 hover:border-white/15 transition-all">
              <span className="truncate max-w-[100px]">{cur.label}</span>
              <ChevronDown size={10} />
            </button>
            <AnimatePresence>
              {pickerOpen && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute top-full right-0 mt-1 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-white/15 bg-black/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                  <div className="p-2 max-h-[320px] overflow-y-auto">
                    {["cloud", "local", "agent"].map(kind => {
                      const models = AI_MODELS.filter(m => m.kind === kind);
                      return (
                        <div key={kind} className="mb-2">
                          <p className="text-[9px] uppercase tracking-wider text-white/20 px-2 py-1">{kind === "cloud" ? "Cloud Models" : kind === "local" ? "Local / VPS" : "Agents"}</p>
                          {models.map(m => (
                            <button key={m.id} onClick={() => { setSelectedModel(m.id); setPickerOpen(false); }} className={cn("w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors", m.id === selectedModel ? "bg-white/10" : "hover:bg-white/5")}>
                              <span className="text-xs font-medium text-white/70">{m.label}</span>
                              <span className="text-[9px] text-white/30 ml-auto">{m.tag}</span>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Link to="/god-structure" className="hidden sm:flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] text-white/30 hover:text-white/50 transition-colors"><Network size={10} /> Dashboard</Link>
          <Link to="/wiki" className="hidden sm:flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] text-white/30 hover:text-white/50 transition-colors"><BookOpen size={10} /> Wiki</Link>
          <button onClick={() => { if (isMobile) { setPanelOpen(!panelOpen); if (!panel) setSearchParams({ panel: "health" }); } else setSearchParams(panel ? {} : { panel: "health" }); }} className="flex items-center justify-center rounded-md p-1.5 text-white/30 hover:text-white/50 hover:bg-white/5 transition-all">
            {panel || panelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
          </button>
        </div>
      </div>

      {/* Command Center Strip */}
      <CommandStrip
        emotion={emotion} healthCache={healthCache} model={cur.tag}
        stage={stage} taskCount={pendingTaskCount} ops={operations} isMobile={isMobile}
        onAction={handleStripAction}
      />

      {/* Inline health bar — compact status indicator */}
      <InlineHealthBar cache={healthCache} onExpand={() => setPanel("health")} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-3 min-h-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-3">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full gap-5 py-8">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-rose-400/15 to-amber-400/15 flex items-center justify-center">
              <SamanthaDot emotion={emotion} size={10} />
            </div>
            <div className="text-center max-w-sm">
              <h2 className="text-base font-semibold text-white/80 mb-1">Samantha</h2>
              <p className="text-[11px] text-white/35 leading-relaxed">AI operating layer. Talk naturally or use commands.</p>
              {healthCache && (
                <p className="text-[10px] text-white/25 mt-1 font-mono">
                  {healthCache.filter(s => s.ok).length}/{healthCache.length} systems online · {cur.label}
                </p>
              )}
              {pendingTaskCount > 0 && (
                <p className="text-[10px] text-amber-400/40 mt-0.5">{pendingTaskCount} pending task{pendingTaskCount > 1 ? "s" : ""}</p>
              )}
            </div>

            {/* Command examples — grouped */}
            <div className="w-full max-w-md space-y-2">
              <p className="text-[9px] uppercase tracking-wider text-white/20 text-center">Try these</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { cmd: "/health", desc: "Check all services", icon: HeartPulse, color: "text-emerald-400/50" },
                  { cmd: "/run autoseo", desc: "Trigger AutoSEO Brain", icon: Zap, color: "text-purple-400/50" },
                  { cmd: "/task Review Q1 feeds", desc: "Save a task", icon: ListChecks, color: "text-blue-400/50" },
                  { cmd: "/audit", desc: "View recent activity", icon: ScrollText, color: "text-amber-400/50" },
                ].map(ex => {
                  const Icon = ex.icon;
                  return (
                    <button
                      key={ex.cmd}
                      onClick={() => handleSend(ex.cmd)}
                      className="flex items-start gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-left hover:bg-white/[0.05] hover:border-white/10 transition-all group"
                    >
                      <Icon size={12} className={cn("mt-0.5 shrink-0 group-hover:opacity-100 transition-opacity", ex.color)} />
                      <div className="min-w-0">
                        <p className="text-[11px] font-mono text-white/50 group-hover:text-white/70 transition-colors">{ex.cmd}</p>
                        <p className="text-[9px] text-white/25 truncate">{ex.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {/* Chat suggestions */}
              <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                {cur.suggestions.slice(0, 3).map((s, i) => (
                  <button key={i} onClick={() => handleSend(s)} className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[10px] text-white/35 hover:text-white/60 hover:bg-white/5 hover:border-white/10 transition-all">{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "user" ? (
              <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-tr-sm bg-white/10 px-4 py-2.5">
                <p className="text-sm text-white/80 whitespace-pre-wrap">{msg.content}</p>
              </div>
            ) : msg.role === "tool" ? (
              <div className="max-w-[85%] sm:max-w-[70%]">
                <ToolResultRenderer result={msg.toolResult} status={msg.toolStatus} />
              </div>
            ) : msg.role === "samantha" ? (
              <div className="max-w-[85%] sm:max-w-[70%] space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <SamanthaDot emotion={msg.streaming ? "thinking" : "calm"} />
                  <span className="text-[10px] text-white/30">{msg.model || cur.label}</span>
                </div>
                <MarkdownContent content={msg.content || (msg.streaming ? "…" : "")} className="text-white/70" />
                {msg.streaming && <span className="inline-block w-1.5 h-4 bg-white/40 animate-pulse rounded-sm" />}
              </div>
            ) : (
              <div className="text-[11px] text-white/30 italic">{msg.content}</div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
        </div>
      </div>

      {/* Action Queue — above input */}
      <AnimatePresence>
        <ActionQueue ops={operations} onRetry={handleRetryOp} />
      </AnimatePresence>

      {/* Quick command buttons — visible when idle and input empty */}
      <QuickActionBar onAction={handleQuickAction} hasInput={input.length > 0} isIdle={stage === "idle"} />

      {/* Input */}
      <div className="shrink-0 border-t border-white/10 bg-black/40 backdrop-blur-xl py-2">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative">
        <AnimatePresence>
          {slashOpen && <SlashPicker query={input} onSelect={handleSlashCommand} onClose={() => setSlashOpen(false)} />}
        </AnimatePresence>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } if (e.key === "Escape") { setSlashOpen(false); } }}
            placeholder={stage !== "idle" ? "Thinking..." : "Message Samantha... (/ for commands)"}
            disabled={stage !== "idle"}
            rows={1}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white/80 placeholder:text-white/25 outline-none focus:border-white/20 focus:bg-white/[0.07] transition-all disabled:opacity-40 resize-none max-h-32 min-h-[38px]"
            style={{ height: input.split("\n").length > 1 ? `${Math.min(input.split("\n").length * 24 + 14, 128)}px` : "38px" }}
          />
          {stage !== "idle" ? (
            <button onClick={handleAbort} className="flex items-center justify-center h-[38px] w-[38px] rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all shrink-0">
              <StopCircle size={15} />
            </button>
          ) : (
            <button onClick={() => handleSend()} disabled={!input.trim()} className="flex items-center justify-center h-[38px] w-[38px] rounded-xl bg-white/10 text-white/60 hover:bg-white/15 hover:text-white/80 transition-all disabled:opacity-30 shrink-0">
              <Send size={15} />
            </button>
          )}
        </div>
        </div>
      </div>
    </div>
  );

  // ─── Layout ────────────────────────────────────────

  return (
    <div className="h-dvh bg-[#0a0a0c] text-white/80 relative overflow-hidden">
      {/* Immersive background — subtle depth layer */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 80% 60% at 20% 10%, rgba(244,63,94,0.03) 0%, transparent 60%), radial-gradient(ellipse 70% 50% at 80% 90%, rgba(139,92,246,0.025) 0%, transparent 60%)"
        }} />
      </div>
      {isMobile ? (
        <>
          {chatContent}
          <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
            <SheetContent side="right" className="w-[85vw] p-0 bg-[#0a0a0c] border-white/10">
              <SheetTitle className="sr-only">System Panel</SheetTitle>
              <ContextPanel panel={panel} setPanel={setPanel} onTriggerWorkflow={handlePanelWorkflowTrigger} healthCache={healthCache} setHealthCache={setHealthCache} ops={operations} onRetryOp={handleRetryOp} />
            </SheetContent>
          </Sheet>
        </>
      ) : panel ? (
        <ResizablePanelGroup direction="horizontal" autoSaveId="samantha-layout">
          <ResizablePanel defaultSize={65} minSize={40}>
            {chatContent}
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-white/5 hover:bg-white/10 transition-colors" />
          <ResizablePanel defaultSize={35} minSize={20} collapsible>
            <ContextPanel panel={panel} setPanel={setPanel} onTriggerWorkflow={handlePanelWorkflowTrigger} healthCache={healthCache} setHealthCache={setHealthCache} ops={operations} onRetryOp={handleRetryOp} />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        chatContent
      )}
    </div>
  );
}
