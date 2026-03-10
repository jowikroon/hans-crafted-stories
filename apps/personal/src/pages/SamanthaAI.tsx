// ═══════════════════════════════════════════════════════════════
//  SAMANTHA — Unified AI Cockpit
//  The single AI interface for the entire ecosystem.
//  Absorbs: Empire (infra), HansAI (slash cmds), Portal AI (routing)
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigate, Link, useSearchParams } from "react-router-dom";
import {
  Send, Mic, MicOff, Loader2, Volume2, VolumeX,
  ChevronDown, Bot, Cpu, Globe, Brain, Wrench, Zap, Server, Terminal,
  CheckCircle2, XCircle, Copy, Check, Network, BookOpen,
  HeartPulse, ScrollText, Lightbulb, ListChecks, Trash2, GitBranch,
  Wifi, WifiOff, PanelRightOpen, PanelRightClose, X, MessageCircle,
  RefreshCw, ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { runIntentPipeline, triggerWorkflow } from "@/lib/intent/pipeline";
import { WORKFLOWS, type WorkflowDef } from "@/lib/config/workflows";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Command, CommandInput, CommandList, CommandItem, CommandGroup, CommandEmpty } from "@/components/ui/command";

// Feature imports
import type { Message, Stage, Emotion, ToolResult, TaskRecord, PanelId, ServiceHealthEntry, ToolExecStatus } from "@/features/samantha/types";
import { SLASH_COMMANDS } from "@/features/samantha/types";
import { AI_MODELS, MODEL_KEY, HISTORY_KEY, VOICE_KEY, TASKS_KEY } from "@/features/samantha/lib/models";
import { sendToModel, callAgent, fetchHealthStatus, buildSystemPrompt, streamSSE, getAuthToken } from "@/features/samantha/lib/providers";
import MarkdownContent from "@/features/samantha/components/chat/MarkdownContent";
import ToolResultRenderer from "@/features/samantha/components/tools/ToolResultRenderer";

// ═══ Helpers ═══

function uid() { return Math.random().toString(36).slice(2, 10); }

// ═══ Samantha Dot (emotional indicator) ═══

function SamanthaDot({ emotion, size = 8 }: { emotion: Emotion; size?: number }) {
  const colors: Record<Emotion, string> = {
    calm: "bg-white/60", thinking: "bg-white/80", working: "bg-amber-400",
    speaking: "bg-violet-400", error: "bg-red-400", success: "bg-emerald-400",
  };
  const pulse = emotion === "thinking" || emotion === "working";
  return <span className={cn("inline-block rounded-full", colors[emotion], pulse && "animate-pulse")} style={{ width: size, height: size }} />;
}

// ═══ Health Panel ═══

function HealthPanel() {
  const [services, setServices] = useState<ServiceHealthEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => { setLoading(true); const s = await fetchHealthStatus(); setServices(s); setLoading(false); }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const online = services.filter(s => s.ok).length;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">System Health</h3>
        <button onClick={refresh} disabled={loading} className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors disabled:opacity-30"><RefreshCw size={12} className={loading ? "animate-spin" : ""} /></button>
      </div>
      {loading ? (
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

// ═══ Audit Panel ═══

function AuditPanel() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from("empire_events").select("*").order("created_at", { ascending: false }).limit(20);
        if (data) setEvents(data);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Audit Trail</h3>
      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 size={16} className="animate-spin text-white/30" /></div>
      ) : events.length === 0 ? (
        <p className="text-xs text-white/30 text-center py-4">No events yet</p>
      ) : (
        <div className="space-y-1">
          {events.map((e: any) => (
            <div key={e.id} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
              <div className="flex items-center gap-2">
                <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", e.event_type === "error" ? "bg-red-400" : e.event_type === "action" ? "bg-amber-400" : "bg-cyan-400")} />
                <span className="text-[10px] text-white/40 font-mono">{e.source}</span>
                <span className="text-[10px] text-white/20 ml-auto">{new Date(e.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <p className="text-[11px] text-white/50 mt-1">{e.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══ Context Panel Wrapper ═══

function ContextPanel({ panel, onTriggerWorkflow }: { panel: PanelId; onTriggerWorkflow: (name: string) => void }) {
  const tabs: { id: PanelId; label: string; icon: typeof HeartPulse }[] = [
    { id: "health", label: "Health", icon: HeartPulse },
    { id: "workflows", label: "Workflows", icon: GitBranch },
    { id: "audit", label: "Audit", icon: ScrollText },
  ];

  // If no panel set, show health by default
  const active = panel || "health";

  return (
    <div className="h-full flex flex-col bg-black/40 backdrop-blur-xl">
      {/* Panel tabs */}
      <div className="flex border-b border-white/10 px-2 py-1.5 gap-1 shrink-0">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-medium transition-all", active === t.id ? "bg-white/10 text-white/80" : "text-white/30 hover:text-white/50")}>
              <Icon size={11} />{t.label}
            </button>
          );
        })}
      </div>
      {/* Panel content */}
      <div className="flex-1 overflow-y-auto">
        {active === "health" && <HealthPanel />}
        {active === "workflows" && <WorkflowsPanel onTrigger={onTriggerWorkflow} />}
        {active === "audit" && <AuditPanel />}
      </div>
    </div>
  );
}

// ═══ Slash Command Picker ═══

function SlashPicker({ query, onSelect, onClose }: { query: string; onSelect: (cmd: string, arg: string) => void; onClose: () => void }) {
  const q = query.toLowerCase().replace("/", "");
  const filtered = SLASH_COMMANDS.filter(c => c.cmd.slice(1).includes(q) || c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-white/15 bg-black/90 backdrop-blur-xl shadow-2xl overflow-hidden z-50">
      <div className="p-1 max-h-[240px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-[11px] text-white/30 px-3 py-2">No matching commands</p>
        ) : (
          filtered.map(c => (
            <button key={c.cmd} onClick={() => { onSelect(c.handler, ""); onClose(); }} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-white/10 transition-colors group">
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

  // ─── State ─────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [emotion, setEmotion] = useState<Emotion>("calm");
  const [selectedModel, setSelectedModel] = useState(() => { try { return localStorage.getItem(MODEL_KEY) || AI_MODELS[0].id; } catch { return AI_MODELS[0].id; } });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskRecord[]>(() => { try { const s = localStorage.getItem(TASKS_KEY); return s ? JSON.parse(s) : []; } catch { return []; } });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const panel = (searchParams.get("panel") as PanelId) || null;
  const hasMessages = messages.length > 0;
  const cur = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];

  // ─── Health context ────────────────────────────────
  const [healthContext, setHealthContext] = useState("");
  useEffect(() => {
    (async () => {
      try {
        const services = await fetchHealthStatus();
        const on = services.filter(s => s.ok).length;
        setHealthContext(`${on}/${services.length} services online. ${services.filter(s => !s.ok).map(s => `${s.name} is DOWN`).join(", ") || "All healthy."}`);
      } catch {}
    })();
  }, []);

  const systemPrompt = useMemo(() => buildSystemPrompt(healthContext), [healthContext]);

  // ─── Persistence ───────────────────────────────────
  useEffect(() => { try { localStorage.setItem(MODEL_KEY, selectedModel); } catch {} }, [selectedModel]);
  useEffect(() => { try { const s = localStorage.getItem(HISTORY_KEY); if (s) { const p = JSON.parse(s); if (Array.isArray(p)) setMessages(p.map((m: any) => ({ ...m, streaming: false }))); } } catch {} }, []);
  useEffect(() => { if (messages.length > 0) try { localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.filter(m => !m.streaming).slice(-60))); } catch {} }, [messages]);
  useEffect(() => { try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); } catch {} }, [tasks]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, stage]);

  // ─── SEO + Title ───────────────────────────────────
  useEffect(() => { document.title = "Samantha — AI Cockpit"; const m = document.querySelector('meta[name="robots"]') as HTMLMetaElement || (() => { const el = document.createElement("meta"); el.name = "robots"; document.head.appendChild(el); return el; })(); m.content = "noindex, nofollow"; return () => { m.content = "index, follow"; }; }, []);

  // ─── Emotion tracking ──────────────────────────────
  useEffect(() => {
    if (stage === "thinking") setEmotion("thinking");
    else if (stage === "executing" || stage === "routing") setEmotion("working");
    else setEmotion("calm");
  }, [stage]);

  // ─── Keyboard shortcuts ────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); inputRef.current?.focus(); }
      if (e.key === "m" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setPickerOpen(v => !v); }
      if (e.key === "Escape") { setPickerOpen(false); setSlashOpen(false); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ─── Auth gate ─────────────────────────────────────
  if (authLoading) return <div className="flex min-h-dvh items-center justify-center bg-[#0a0a0c]"><Loader2 size={20} className="animate-spin text-white/40" /></div>;
  if (!user) return <Navigate to="/portal" replace />;

  // ─── Message helpers ───────────────────────────────
  const append = (msg: Omit<Message, "id" | "timestamp">): Message => {
    const m: Message = { ...msg, id: uid(), timestamp: Date.now() };
    setMessages(prev => [...prev, m]);
    return m;
  };

  const updateMessage = (id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  // ─── Slash command handlers ────────────────────────
  const handleSlashCommand = async (handler: string, arg: string) => {
    switch (handler) {
      case "health": {
        setStage("executing");
        const toolMsg = append({ role: "tool", content: "", toolName: "Health Check", toolStatus: "running" });
        try {
          const services = await fetchHealthStatus();
          const on = services.filter(s => s.ok).length;
          const result: ToolResult = { type: "health", services };
          updateMessage(toolMsg.id, { toolStatus: "success", toolResult: result });
          append({ role: "samantha", content: `**Health check complete:** ${on}/${services.length} services online.`, model: "System" });
          // Open health panel
          setSearchParams({ panel: "health" });
          if (isMobile) setPanelOpen(true);
        } catch { updateMessage(toolMsg.id, { toolStatus: "error" }); append({ role: "samantha", content: "Health check failed. Backend may be unreachable.", model: "System" }); }
        setStage("idle");
        return;
      }
      case "workflows": {
        const result: ToolResult = { type: "workflows_list", workflows: WORKFLOWS.map(w => ({ name: w.name, label: w.label, category: w.category, description: w.description })) };
        append({ role: "tool", content: "", toolResult: result, toolStatus: "success", toolName: "Workflows" });
        setSearchParams({ panel: "workflows" });
        if (isMobile) setPanelOpen(true);
        return;
      }
      case "run": {
        if (!arg) { append({ role: "samantha", content: "Usage: `/run <workflow-name>`\n\nAvailable: " + WORKFLOWS.map(w => `\`${w.name}\``).join(", "), model: "System" }); return; }
        const wf = WORKFLOWS.find(w => w.name === arg || w.label.toLowerCase() === arg.toLowerCase());
        if (!wf) { append({ role: "samantha", content: `Workflow "${arg}" not found. Try \`/workflows\` to see available ones.`, model: "System" }); return; }
        setStage("executing");
        const toolMsg = append({ role: "tool", content: "", toolName: wf.label, toolStatus: "running" });
        try {
          const res = await triggerWorkflow(wf, "samantha", { message: arg });
          const result: ToolResult = { type: "workflow", workflowName: wf.label, status: res.ok ? "success" : "error", message: res.ok ? "Workflow completed" : (res.error || "Failed") };
          updateMessage(toolMsg.id, { toolStatus: res.ok ? "success" : "error", toolResult: result });
          append({ role: "samantha", content: res.ok ? `✅ **${wf.label}** completed successfully.` : `❌ **${wf.label}** failed: ${res.error}`, model: wf.label });
        } catch (e: any) { updateMessage(toolMsg.id, { toolStatus: "error" }); append({ role: "samantha", content: `Error: ${e?.message}`, model: "System" }); }
        setStage("idle");
        return;
      }
      case "task": {
        if (!arg) { append({ role: "samantha", content: "Usage: `/task <description>`", model: "System" }); return; }
        const t: TaskRecord = { id: uid(), text: arg, type: "task", created_at: Date.now() };
        setTasks(prev => [...prev, t]);
        const result: ToolResult = { type: "task", task: t };
        append({ role: "tool", content: "", toolResult: result, toolStatus: "success", toolName: "Task" });
        append({ role: "samantha", content: `📋 Task saved: "${arg}"`, model: "System" });
        return;
      }
      case "idea": {
        if (!arg) { append({ role: "samantha", content: "Usage: `/idea <description>`", model: "System" }); return; }
        const t: TaskRecord = { id: uid(), text: arg, type: "idea", created_at: Date.now() };
        setTasks(prev => [...prev, t]);
        const result: ToolResult = { type: "idea", idea: t };
        append({ role: "tool", content: "", toolResult: result, toolStatus: "success", toolName: "Idea" });
        append({ role: "samantha", content: `💡 Idea captured: "${arg}"`, model: "System" });
        return;
      }
      case "audit": {
        setSearchParams({ panel: "audit" });
        if (isMobile) setPanelOpen(true);
        append({ role: "samantha", content: "Opening the audit trail panel →", model: "System" });
        return;
      }
      case "model": {
        if (!arg) { setPickerOpen(true); return; }
        const found = AI_MODELS.find(m => m.id === arg || m.label.toLowerCase().includes(arg.toLowerCase()));
        if (found) { setSelectedModel(found.id); append({ role: "samantha", content: `Switched to **${found.label}** (${found.provider})`, model: "System" }); }
        else { append({ role: "samantha", content: `Model "${arg}" not found. Use \`/model\` to open the picker.`, model: "System" }); }
        return;
      }
      case "clear": {
        setMessages([]);
        return;
      }
    }
  };

  // ─── Send handler ──────────────────────────────────
  const handleSend = async (override?: string) => {
    const text = (override || input).trim();
    if (!text || stage !== "idle") return;
    setInput("");
    setSlashOpen(false);

    // Slash command detection
    if (text.startsWith("/")) {
      const parts = text.split(" ");
      const cmd = parts[0].toLowerCase();
      const arg = parts.slice(1).join(" ").trim();
      const match = SLASH_COMMANDS.find(c => c.cmd === cmd);
      if (match) {
        append({ role: "user", content: text });
        await handleSlashCommand(match.handler, arg);
        return;
      }
    }

    append({ role: "user", content: text });

    // Natural language health/workflow detection
    const lower = text.toLowerCase();
    if (/\b(health|status|services?\s+(up|down|check|online))\b/i.test(lower)) {
      await handleSlashCommand("health", "");
      return;
    }

    // Agent model — direct call
    if (cur.kind === "agent") {
      setStage("executing");
      const toolMsg = append({ role: "tool", content: "", toolName: cur.label, toolStatus: "running" });
      try {
        const result = await callAgent(cur.id, text);
        updateMessage(toolMsg.id, { toolStatus: "success", toolResult: result.healthData ? { type: "health", services: result.healthData } : undefined });
        append({ role: "samantha", content: result.text, model: cur.label });
        if (result.healthData) { setSearchParams({ panel: "health" }); if (isMobile) setPanelOpen(true); }
      } catch (e: any) {
        updateMessage(toolMsg.id, { toolStatus: "error" });
        append({ role: "samantha", content: `Something went wrong: ${e?.message}`, model: cur.label });
      }
      setStage("idle");
      return;
    }

    // Intent pipeline
    setStage("routing");
    const result = await runIntentPipeline(text, "samantha");

    if (result.outcome.type === "workflow_match") {
      setStage("executing");
      const wf = result.outcome.workflow;
      const toolMsg = append({ role: "tool", content: "", toolName: wf.label, toolStatus: "running" });
      try {
        const res = await triggerWorkflow(wf, "samantha", { message: text });
        updateMessage(toolMsg.id, { toolStatus: res.ok ? "success" : "error", toolResult: { type: "workflow", workflowName: wf.label, status: res.ok ? "success" : "error", message: res.ok ? "Done" : (res.error || "Failed") } });
        append({ role: "samantha", content: res.ok ? `Done — ${typeof res.data === "string" ? res.data : JSON.stringify(res.data).slice(0, 300)}` : `${wf.label} failed: ${res.error}`, model: wf.label });
      } catch (e: any) { updateMessage(toolMsg.id, { toolStatus: "error" }); append({ role: "samantha", content: `Error: ${e?.message}`, model: "System" }); }
      setStage("idle");
      return;
    }

    if (result.outcome.type === "clarify") {
      append({ role: "samantha", content: `I found a few options:\n\n${result.outcome.workflows.map(w => `• **${w.label}** — ${w.description}`).join("\n")}\n\nWhich one should I run?`, model: "System" });
      setStage("idle");
      return;
    }

    // Chat fallback — send to AI model
    setStage("thinking");
    const streamMsg = append({ role: "samantha", content: "", streaming: true, model: cur.label });
    setStreamingId(streamMsg.id);
    try {
      const history = messages.filter(m => m.role === "user" || m.role === "samantha").slice(-20).map(m => ({ role: m.role === "samantha" ? "assistant" : "user", content: m.content }));
      history.push({ role: "user", content: text });
      const reply = await sendToModel(cur.id, history, systemPrompt, (chunk) => { updateMessage(streamMsg.id, { content: chunk }); });
      updateMessage(streamMsg.id, { content: reply, streaming: false });
    } catch (e: any) {
      updateMessage(streamMsg.id, { content: `⚠️ ${e?.message || "Unknown error"}`, streaming: false });
      setEmotion("error");
      setTimeout(() => setEmotion("calm"), 3000);
    }
    setStreamingId(null);
    setStage("idle");
  };

  // ─── Input change with slash detection ─────────────
  const handleInputChange = (val: string) => {
    setInput(val);
    setSlashOpen(val.startsWith("/") && val.length > 0 && val.length < 20);
  };

  // ─── Trigger workflow from panel ───────────────────
  const handlePanelWorkflowTrigger = (name: string) => {
    setInput(`/run ${name}`);
    setTimeout(() => handleSend(`/run ${name}`), 50);
  };

  // ─── Render ────────────────────────────────────────

  const chatContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <SamanthaDot emotion={emotion} size={10} />
          <h1 className="text-sm font-semibold text-white/80">Samantha</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Model picker */}
          <button onClick={() => setPickerOpen(!pickerOpen)} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-medium text-white/50 hover:text-white/70 hover:border-white/15 transition-all">
            <span className="truncate max-w-[100px]">{cur.label}</span>
            <ChevronDown size={10} />
          </button>
          {/* Links */}
          <Link to="/god-structure" className="hidden sm:flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] text-white/30 hover:text-white/50 transition-colors"><Network size={10} /> Dashboard</Link>
          <Link to="/wiki" className="hidden sm:flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] text-white/30 hover:text-white/50 transition-colors"><BookOpen size={10} /> Wiki</Link>
          {/* Panel toggle */}
          <button onClick={() => { if (isMobile) setPanelOpen(!panelOpen); else setSearchParams(panel ? {} : { panel: "health" }); }} className="flex items-center justify-center rounded-md p-1.5 text-white/30 hover:text-white/50 hover:bg-white/5 transition-all">
            {panel || panelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
          </button>
        </div>
      </div>

      {/* Model picker dropdown */}
      <AnimatePresence>
        {pickerOpen && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute top-14 right-4 z-50 w-72 rounded-xl border border-white/15 bg-black/95 backdrop-blur-xl shadow-2xl overflow-hidden">
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 min-h-0">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-12">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-rose-400/20 to-amber-400/20 flex items-center justify-center">
                <SamanthaDot emotion={emotion} size={12} />
              </div>
            </div>
            <div className="text-center max-w-sm">
              <h2 className="text-lg font-semibold text-white/80 mb-2">Hey there</h2>
              <p className="text-xs text-white/40 leading-relaxed">I'm Samantha — your AI companion and system cockpit. Chat, run workflows, check health, manage tasks. Type <code className="text-white/50 bg-white/10 px-1 rounded">/</code> for commands.</p>
            </div>
            {/* Suggestion chips */}
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {cur.suggestions.slice(0, 4).map((s, i) => (
                <button key={i} onClick={() => handleSend(s)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/50 hover:text-white/70 hover:bg-white/10 hover:border-white/15 transition-all">{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "user" ? (
              <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-tr-sm bg-white/10 px-4 py-2.5">
                <p className="text-sm text-white/80">{msg.content}</p>
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

      {/* Input area */}
      <div className="shrink-0 border-t border-white/10 bg-black/40 backdrop-blur-xl px-4 sm:px-6 py-3 relative">
        <AnimatePresence>
          {slashOpen && <SlashPicker query={input} onSelect={handleSlashCommand} onClose={() => setSlashOpen(false)} />}
        </AnimatePresence>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } if (e.key === "Escape") { setSlashOpen(false); } }}
            placeholder={stage !== "idle" ? "Thinking..." : "Message Samantha... (/ for commands)"}
            disabled={stage !== "idle"}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder:text-white/25 outline-none focus:border-white/20 focus:bg-white/[0.07] transition-all disabled:opacity-40"
          />
          <button onClick={() => handleSend()} disabled={stage !== "idle" || !input.trim()} className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 text-white/60 hover:bg-white/15 hover:text-white/80 transition-all disabled:opacity-30 disabled:hover:bg-white/10">
            {stage !== "idle" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Layout (responsive: sidebar desktop, drawer mobile) ──

  return (
    <div className="h-dvh bg-[#0a0a0c] text-white/80 relative overflow-hidden">
      {isMobile ? (
        <>
          {chatContent}
          <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
            <SheetContent side="right" className="w-[85vw] p-0 bg-[#0a0a0c] border-white/10">
              <ContextPanel panel={panel} onTriggerWorkflow={handlePanelWorkflowTrigger} />
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
            <ContextPanel panel={panel} onTriggerWorkflow={handlePanelWorkflowTrigger} />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        chatContent
      )}
    </div>
  );
}
