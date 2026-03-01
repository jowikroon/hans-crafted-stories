import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Play, MessageSquare, PenTool, Megaphone } from "lucide-react";
import CommandSidebar from "@/components/hansai/CommandSidebar";
import { HierarchyControls, hierarchyStorage } from "@/components/command-center/HierarchyControls";
import { HierarchyErrorBoundary, defaultHierarchyFallback } from "@/components/command-center/HierarchyErrorBoundary";
import StatusStrip from "@/components/command-center/StatusStrip";
import QuickActionCard from "@/components/command-center/QuickActionCard";
import RecentActivityRow from "@/components/command-center/RecentActivityRow";
import StatusDrawer from "@/components/command-center/StatusDrawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { WORKFLOWS, type WorkflowDef } from "@/lib/config/workflows";
import { runIntentPipeline, logUnhandledIntent } from "@/lib/intent/pipeline";
import type { HierarchyContext } from "@/lib/intent/types";

// ── Config ─────────────────────────────────────────────────────────
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hansai-chat`;

const SLASH_COMMANDS = [
  { cmd: "/help", desc: "Show all commands" },
  { cmd: "/idea", desc: "Save an idea" },
  { cmd: "/task", desc: "Save a task" },
  { cmd: "/tasks", desc: "Show all tasks & ideas" },
  { cmd: "/prompt", desc: "Open prompt builder (seo/campaign/product/email)" },
  { cmd: "/campaign", desc: "Launch campaign form" },
  { cmd: "/run", desc: "Trigger n8n workflow" },
  { cmd: "/workflows", desc: "List available workflows" },
  { cmd: "/clear", desc: "Clear terminal" },
  { cmd: "/ai", desc: "Chat with AI" },
];

// ── Types ──────────────────────────────────────────────────────────
interface TerminalLine {
  id: string;
  type: "user" | "system" | "ai" | "workflow" | "saved" | "error" | "form";
  content: string;
  timestamp: number;
  formType?: "campaign" | "prompt";
}

interface TaskItem {
  id: string;
  type: "task" | "idea";
  text: string;
  timestamp: number;
  done: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────
const uid = () => crypto.randomUUID();
const ts = () => Date.now();
const fmtTime = (t: number) => {
  const d = new Date(t);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const spinnerFrames = ["|", "/", "—", "\\"];

// ── Natural language → slash command mapping (tasks/ideas/clear only) ─
const mapNaturalLanguageSlash = (text: string): { cmd: string; arg: string } | null => {
  const lower = text.toLowerCase().trim();
  if (/^(capture |save |add )?idea[:\s]/i.test(lower)) {
    return { cmd: "/idea", arg: text.replace(/^(capture |save |add )?idea[:\s]*/i, "").trim() };
  }
  if (/^(add |create |new )?task[:\s]/i.test(lower)) {
    return { cmd: "/task", arg: text.replace(/^(add |create |new )?task[:\s]*/i, "").trim() };
  }
  if (/^(what |show |list |my )?(tasks|ideas|todo)/i.test(lower)) {
    return { cmd: "/tasks", arg: "" };
  }
  if (/^(write|create|generate|build) .*(seo|prompt|ad copy|email|product desc)/i.test(lower)) {
    return { cmd: "/prompt", arg: "" };
  }
  if (/^clear/i.test(lower)) return { cmd: "/clear", arg: "" };
  return null;
};


// ── Component ──────────────────────────────────────────────────────
const HansAI = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  const [lines, setLines] = useState<TerminalLine[]>([
    { id: uid(), type: "system", content: "HansAI Command Center v1.0", timestamp: ts() },
    { id: uid(), type: "system", content: "Type /help to see all commands.", timestamp: ts() },
    { id: uid(), type: "system", content: "Ready.", timestamp: ts() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [suggestions, setSuggestions] = useState<typeof SLASH_COMMANDS>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [showForm, setShowForm] = useState<"campaign" | "prompt" | null>(null);
  const [spinnerIdx, setSpinnerIdx] = useState(0);
  const [clearFlash, setClearFlash] = useState(false);
  const [pendingClarification, setPendingClarification] = useState<WorkflowDef[] | null>(null);
  const [commandHistory, setCommandHistory] = useState<{ text: string; timestamp: number; type: "slash" | "ai" | "workflow" }[]>([]);
  const [statusDrawerOpen, setStatusDrawerOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [hierarchyOpen, setHierarchyOpen] = useState(false);
  const [terminalExpanded, setTerminalExpanded] = useState(false);

  // AI conversation history (not displayed, for context)
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);

  // Command Center hierarchy (Laag 1–3); persisted to localStorage with debounce
  const [hierarchyContext, setHierarchyContext] = useState<HierarchyContext>(() => hierarchyStorage.load());
  const [hierarchyLastValue, setHierarchyLastValue] = useState<HierarchyContext | null>(null);
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const spinnerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load hierarchy from localStorage on mount (bulletproof: invalid → defaults)
  useEffect(() => {
    setHierarchyContext((prev) => {
      const loaded = hierarchyStorage.load();
      return loaded ?? prev;
    });
  }, []);

  // Persist hierarchy to localStorage with 150ms debounce
  useEffect(() => {
    if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    persistTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(hierarchyStorage.key, JSON.stringify(hierarchyContext));
      } catch {
        // quota or disabled localStorage
      }
      persistTimeoutRef.current = null;
    }, 150);
    return () => {
      if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    };
  }, [hierarchyContext]);

  const handleHierarchyChange = useCallback((next: HierarchyContext) => {
    setHierarchyContext((prev) => {
      setHierarchyLastValue(prev);
      return next;
    });
  }, []);

  const handleHierarchyUndo = useCallback(() => {
    if (hierarchyLastValue) {
      setHierarchyContext(hierarchyLastValue);
      setHierarchyLastValue(null);
    }
  }, [hierarchyLastValue]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [lines, loading]);

  // Focus input on mount + SEO noindex
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
    document.title = "HansAI — Command Center";
    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robots) { robots = document.createElement("meta"); robots.name = "robots"; document.head.appendChild(robots); }
    robots.content = "noindex, nofollow";
    return () => { if (robots) robots.content = "index, follow"; };
  }, []);

  // Spinner animation
  useEffect(() => {
    if (loading) {
      spinnerInterval.current = setInterval(() => setSpinnerIdx((i) => (i + 1) % 4), 100);
    } else {
      if (spinnerInterval.current) clearInterval(spinnerInterval.current);
    }
    return () => { if (spinnerInterval.current) clearInterval(spinnerInterval.current); };
  }, [loading]);

  const addLine = useCallback((type: TerminalLine["type"], content: string, formType?: "campaign" | "prompt") => {
    setLines((prev) => [...prev, { id: uid(), type, content, timestamp: ts(), formType }]);
  }, []);

  const updateLastAiLine = useCallback((content: string) => {
    setLines((prev) => {
      const last = prev[prev.length - 1];
      if (last?.type === "ai") {
        return [...prev.slice(0, -1), { ...last, content }];
      }
      return [...prev, { id: uid(), type: "ai", content, timestamp: ts() }];
    });
  }, []);

  // ── Command handlers ────────────────────────────────────────────
  const handleHelp = () => {
    const helpText = SLASH_COMMANDS.map((c) => `  ${c.cmd.padEnd(16)} ${c.desc}`).join("\n");
    addLine("system", `Available commands:\n${helpText}`);
  };

  const handleIdea = (text: string) => {
    if (!text) { addLine("error", "Usage: /idea [your idea]"); return; }
    setTasks((prev) => [...prev, { id: uid(), type: "idea", text, timestamp: ts(), done: false }]);
    addLine("saved", `Idea saved: ${text}`);
  };

  const handleTask = (text: string) => {
    if (!text) { addLine("error", "Usage: /task [your task]"); return; }
    setTasks((prev) => [...prev, { id: uid(), type: "task", text, timestamp: ts(), done: false }]);
    addLine("saved", `Task saved: ${text}`);
  };

  const handleTasks = () => {
    if (tasks.length === 0) { addLine("system", "No tasks or ideas yet. Use /task or /idea to add some."); return; }
    const list = tasks
      .map((t) => `  ${t.done ? "☑" : "☐"} [${t.type}] ${t.done ? `~~${t.text}~~` : t.text}`)
      .join("\n");
    addLine("system", `Tasks & Ideas (${tasks.length}):\n${list}\n\n  Click items in the list to toggle them.`);
  };

  const handleWorkflows = () => {
    const list = WORKFLOWS.map((w) => `  ● ${w.name.padEnd(18)} ${w.label}`).join("\n");
    addLine("system", `Available n8n workflows:\n${list}\n\n  Use /run [name] to trigger.`);
  };

  const handleRunWorkflow = async (wf: WorkflowDef) => {
    addLine("workflow", `Running ${wf.label}...`);
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      // Proxy through Supabase edge function to avoid CORS issues with direct n8n calls
      const TRIGGER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-webhook`;
      const res = await fetch(TRIGGER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          webhook_url: wf.webhook,
          payload: { source: "command_center", timestamp: new Date().toISOString() },
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json() as { success: boolean; data?: unknown; error?: string };
      if (!json.success) throw new Error(json.error || "Workflow returned failure");

      addLine("workflow", `✓ ${wf.label} completed`);
      if (json.data && typeof json.data === "object") {
        addLine("system", "```json\n" + JSON.stringify(json.data, null, 2) + "\n```");
      } else if (json.data) {
        addLine("system", String(json.data));
      }
    } catch (err) {
      addLine("error", `✗ Error running ${wf.label} — ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async (name: string) => {
    const wf = WORKFLOWS.find((w) => w.name === name || w.label.toLowerCase().includes(name.toLowerCase()));
    if (!wf) {
      addLine("error", `Unknown workflow: "${name}". Use /workflows to see available ones.`);
      return;
    }
    await handleRunWorkflow(wf);
  };

  const handleClear = () => {
    setClearFlash(true);
    setTimeout(() => {
      setLines([{ id: uid(), type: "system", content: "Terminal cleared. Ready.", timestamp: ts() }]);
      setClearFlash(false);
    }, 150);
  };

  // ── AI streaming ────────────────────────────────────────────────
  const handleAI = async (text: string) => {
    if (!text) { addLine("error", "Usage: /ai [message]"); return; }

    addLine("user", text);
    const newAiMessages = [...aiMessages, { role: "user" as const, content: text }];
    setAiMessages(newAiMessages);
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const body: { messages: typeof newAiMessages; router_context?: HierarchyContext } = { messages: newAiMessages };
      if (hierarchyContext) body.router_context = hierarchyContext;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        addLine("error", err.error || "AI request failed");
        setLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullResponse = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              updateLastAiLine(fullResponse);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Final flush
      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw || !raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { fullResponse += content; updateLastAiLine(fullResponse); }
          } catch { /* ignore */ }
        }
      }

      setAiMessages([...newAiMessages, { role: "assistant", content: fullResponse }]);
    } catch (e) {
      console.error(e);
      addLine("error", "Connection error");
    } finally {
      setLoading(false);
    }
  };

  // ── Campaign form submit ────────────────────────────────────────
  const handleCampaignSubmit = async (data: Record<string, string>) => {
    setShowForm(null);
    addLine("workflow", `Launching campaign: ${data.product} → ${data.goal}...`);
    setLoading(true);

    try {
      const wf = WORKFLOWS.find((w) => w.name === "campaign");
      if (!wf) throw new Error("Campaign workflow not configured");

      const res = await fetch(wf.webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, source: "command_center" }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      addLine("workflow", `✓ Campaign launched for "${data.product}"`);
    } catch (err) {
      addLine("error", `✗ Campaign error — ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Prompt builder submit ───────────────────────────────────────
  const handlePromptSubmit = async (data: Record<string, string>) => {
    setShowForm(null);
    const prompt = `Write a ${data.type} for "${data.subject}" in a ${data.tone} tone. Be specific and actionable.`;
    await handleAI(prompt);
  };

  const handleClarificationSelect = async (wf: WorkflowDef) => {
    setPendingClarification(null);
    addLine("user", `→ ${wf.label}`);
    await handleRunWorkflow(wf);
  };

  const handleClarificationSomethingElse = async (originalInput: string) => {
    setPendingClarification(null);
    addLine("system", "I've logged this request. I'll learn from it over time.");
    await logUnhandledIntent(originalInput, 0, "command_center");
    await handleAI(originalInput);
  };

  // ── Main command router ─────────────────────────────────────────
  const processInput = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    const cmdType: "slash" | "ai" | "workflow" = trimmed.startsWith("/run") ? "workflow" : trimmed.startsWith("/") ? "slash" : "ai";
    setCommandHistory((prev) => [...prev, { text: trimmed, timestamp: Date.now(), type: cmdType }]);

    // 1. Slash commands
    if (trimmed.startsWith("/")) {
      const [cmd, ...rest] = trimmed.split(" ");
      const arg = rest.join(" ").trim();

      switch (cmd.toLowerCase()) {
        case "/help": handleHelp(); break;
        case "/idea": handleIdea(arg); break;
        case "/task": handleTask(arg); break;
        case "/tasks": handleTasks(); break;
        case "/workflows": handleWorkflows(); break;
        case "/run": await handleRun(arg); break;
        case "/clear": handleClear(); break;
        case "/ai": await handleAI(arg); break;
        case "/campaign": setShowForm("campaign"); addLine("system", "Opening campaign builder..."); break;
        case "/prompt": setShowForm("prompt"); addLine("system", "Opening prompt builder..."); break;
        default: addLine("error", `Unknown command: ${cmd}. Type /help for available commands.`);
      }
      return;
    }

    // 2. Simple slash-like natural language (tasks, ideas, clear, prompt)
    const mapped = mapNaturalLanguageSlash(trimmed);
    if (mapped) {
      switch (mapped.cmd) {
        case "/idea": handleIdea(mapped.arg); break;
        case "/task": handleTask(mapped.arg); break;
        case "/tasks": handleTasks(); break;
        case "/clear": handleClear(); break;
        case "/prompt": setShowForm("prompt"); addLine("system", "Opening prompt builder..."); break;
        default: break;
      }
      return;
    }

    // 3-5. Shared intent pipeline (fast route → LLM classify → log unhandled)
    setLoading(true);
    addLine("system", "Classifying intent...");
    const pipelineResult = await runIntentPipeline(trimmed, "command_center");
    setLoading(false);

    switch (pipelineResult.outcome.type) {
      case "workflow_match":
        await handleRunWorkflow(pipelineResult.outcome.workflow);
        return;

      case "clarify":
        if (pipelineResult.outcome.message) addLine("system", pipelineResult.outcome.message);
        else addLine("system", "Did you mean one of these workflows?");
        setPendingClarification(pipelineResult.outcome.workflows);
        return;

      case "unhandled":
        addLine("system", "I've logged this request. I'll learn from it over time.");
        break;

      case "chat_fallback":
      default:
        break;
    }

    // Fallback: general AI chat
    await handleAI(trimmed);
  };

  const handleSubmit = () => {
    if (loading) return;
    const val = input;
    setInput("");
    setSuggestions([]);
    // Show as user command line
    if (val.trim().startsWith("/")) {
      addLine("user", val.trim());
    }
    processInput(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedSuggestion((i) => Math.min(i + 1, suggestions.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedSuggestion((i) => Math.max(i - 1, 0)); return; }
      if (e.key === "Tab" || e.key === "Enter") {
        if (suggestions[selectedSuggestion]) {
          e.preventDefault();
          setInput(suggestions[selectedSuggestion].cmd + " ");
          setSuggestions([]);
          return;
        }
      }
      if (e.key === "Escape") { setSuggestions([]); return; }
    }
    if (e.key === "Escape" && hierarchyLastValue) {
      handleHierarchyUndo();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    if (val.startsWith("/") && val.length > 0) {
      const matching = SLASH_COMMANDS.filter((c) => c.cmd.startsWith(val.split(" ")[0]));
      setSuggestions(matching.length > 0 && val.split(" ").length === 1 ? matching : []);
      setSelectedSuggestion(0);
    } else {
      setSuggestions([]);
    }
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  // ── Guards ──────────────────────────────────────────────────────
  if (authLoading || adminLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "#0a0a0a" }}>
        <div className="h-5 w-5 animate-spin rounded-full" style={{ border: "2px solid #1e1e1e", borderTopColor: "#00ff88" }} />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────
  const focusTerminal = (prefill?: string) => {
    if (prefill) setInput(prefill);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="relative flex h-screen flex-col overflow-hidden pt-[88px] bg-background" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-5 px-4 py-5 sm:px-6">

          {/* ── Status Strip ─────────────────────────────────── */}
          <StatusStrip onOpenDrawer={() => setStatusDrawerOpen(true)} />

          {/* ── Quick Actions (2×2) ──────────────────────────── */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <QuickActionCard icon={Play} label="Run Workflow" description="Trigger an n8n workflow" onClick={() => focusTerminal("/run ")} />
            <QuickActionCard icon={MessageSquare} label="AI Chat" description="Ask anything" onClick={() => focusTerminal("/ai ")} />
            <QuickActionCard icon={PenTool} label="Write Prompt" description="SEO, ads, email copy" onClick={() => { setShowForm("prompt"); addLine("system", "Opening prompt builder..."); }} />
            <QuickActionCard icon={Megaphone} label="Campaign" description="Launch a campaign" onClick={() => { setShowForm("campaign"); addLine("system", "Opening campaign builder..."); }} />
          </div>

          {/* ── Hierarchy Controls (collapsible) ─────────────── */}
          <Collapsible open={hierarchyOpen} onOpenChange={setHierarchyOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border border-border/30 bg-card/30 px-4 py-2.5 text-left transition-colors hover:bg-card/50">
              <span className="text-xs font-medium text-muted-foreground">
                Context: <span className="text-foreground">{hierarchyContext.primaryGoal.replace(/_/g, " ")}</span>
              </span>
              <ChevronDown size={14} className={`text-muted-foreground/50 transition-transform ${hierarchyOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <HierarchyErrorBoundary
                fallbackContext={defaultHierarchyFallback}
                onReset={() => setHierarchyContext(defaultHierarchyFallback)}
              >
                <HierarchyControls
                  value={hierarchyContext}
                  onChange={handleHierarchyChange}
                  lastValue={hierarchyLastValue}
                  onUndo={handleHierarchyUndo}
                />
              </HierarchyErrorBoundary>
            </CollapsibleContent>
          </Collapsible>

          {/* ── Terminal (compact, expandable) ────────────────── */}
          <div className={`rounded-xl border border-border/30 bg-card/20 transition-all ${terminalExpanded ? "min-h-[70vh]" : "max-h-[40vh]"} flex flex-col overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-border/20 px-4 py-2">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">Terminal</span>
              <button
                onClick={() => setTerminalExpanded((v) => !v)}
                className="text-[10px] font-medium text-primary/60 transition-colors hover:text-primary"
              >
                {terminalExpanded ? "Minimize" : "Expand"}
              </button>
            </div>

            {/* Terminal output */}
            <div
              ref={scrollRef}
              className={`flex-1 overflow-y-auto px-4 py-3 transition-all duration-150 ${clearFlash ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
            >
              <div className="space-y-1">
                {lines.map((line) => (
                  <TerminalLineComponent key={line.id} line={line} tasks={tasks} onToggleTask={toggleTask} />
                ))}

                {loading && (
                  <div className="flex items-center gap-2 py-1 text-xs text-primary/60">
                    <span className="w-3 text-center">{spinnerFrames[spinnerIdx]}</span>
                    <span>Processing...</span>
                  </div>
                )}

                {pendingClarification && (
                  <div className="my-2 flex flex-wrap gap-2">
                    {pendingClarification.map((wf) => (
                      <button
                        key={wf.name}
                        onClick={() => handleClarificationSelect(wf)}
                        className="rounded-md border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:border-primary/50 hover:bg-primary/10"
                      >
                        {wf.label}
                      </button>
                    ))}
                    <button
                      onClick={() => handleClarificationSomethingElse(commandHistory[commandHistory.length - 1]?.text || "")}
                      className="rounded-md border border-border/30 px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-border hover:bg-card/50"
                    >
                      Something else
                    </button>
                  </div>
                )}

                {showForm === "campaign" && (
                  <CampaignForm onSubmit={handleCampaignSubmit} onCancel={() => setShowForm(null)} />
                )}
                {showForm === "prompt" && (
                  <PromptForm onSubmit={handlePromptSubmit} onCancel={() => setShowForm(null)} />
                )}
              </div>
            </div>

            {/* Input bar */}
            <div className="shrink-0 border-t border-border/20 px-4 py-2.5">
              {suggestions.length > 0 && (
                <div className="mb-1.5 rounded-lg border border-border/30 bg-card/60 p-1">
                  {suggestions.map((s, i) => (
                    <button
                      key={s.cmd}
                      onClick={() => { setInput(s.cmd + " "); setSuggestions([]); inputRef.current?.focus(); }}
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-left text-xs transition-colors ${
                        i === selectedSuggestion ? "bg-primary/10 text-primary" : "text-muted-foreground"
                      }`}
                    >
                      <span className="font-semibold text-primary">{s.cmd}</span>
                      <span>{s.desc}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-card/40 px-3 py-2">
                <span className="hidden text-xs text-primary/40 sm:inline">$</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a command or message..."
                  disabled={loading}
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/30"
                  style={{ fontFamily: "inherit" }}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || loading}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary transition-all disabled:opacity-20"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* ── Recent Activity ───────────────────────────────── */}
          <RecentActivityRow
            commands={commandHistory}
            onReplay={(cmd) => { setInput(cmd); inputRef.current?.focus(); }}
            onViewAll={() => setHistoryDrawerOpen(true)}
          />
        </div>
      </div>

      {/* ── Drawers ──────────────────────────────────────────── */}
      <StatusDrawer open={statusDrawerOpen} onOpenChange={setStatusDrawerOpen} />

      <Sheet open={historyDrawerOpen} onOpenChange={setHistoryDrawerOpen}>
        <SheetContent side="right" className="w-[min(100vw-2rem,360px)] overflow-y-auto border-l border-border bg-background p-0">
          <SheetHeader className="border-b border-border px-6 py-4">
            <SheetTitle className="text-sm font-medium">Command History</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <CommandSidebar
              commandHistory={commandHistory}
              onReplayCommand={(cmd) => {
                setInput(cmd);
                setHistoryDrawerOpen(false);
                inputRef.current?.focus();
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

// ── Terminal Line Renderer ────────────────────────────────────────
const TerminalLineComponent = ({
  line,
  tasks,
  onToggleTask,
}: {
  line: TerminalLine;
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
}) => {
  const prefixMap: Record<string, { prefix: string; color: string }> = {
    user: { prefix: "hans@hq:~$ ", color: "#00ff88" },
    system: { prefix: "> ", color: "#888" },
    ai: { prefix: "> ", color: "#e0e0e0" },
    workflow: { prefix: "⚙ n8n: ", color: "#ffaa00" },
    saved: { prefix: "✓ saved: ", color: "#00ff88" },
    error: { prefix: "✗ ", color: "#ff4444" },
    form: { prefix: "", color: "#888" },
  };

  const { prefix, color } = prefixMap[line.type] || prefixMap.system;

  // Task list with toggleable items
  if (line.type === "system" && line.content.startsWith("Tasks & Ideas")) {
    return (
      <div className="py-1">
        <div className="flex items-start gap-0">
          <span className="shrink-0 text-xs" style={{ color: "#888" }}>{">"} </span>
          <div className="flex-1">
            <div className="text-xs" style={{ color: "#888" }}>Tasks & Ideas ({tasks.length}):</div>
            <div className="mt-1 space-y-0.5">
              {tasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onToggleTask(t.id)}
                  className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left text-xs transition-colors hover:bg-white/5"
                  style={{ color: t.done ? "#444" : "#ccc", textDecoration: t.done ? "line-through" : "none" }}
                >
                  <span>{t.done ? "☑" : "☐"}</span>
                  <span className="opacity-50">[{t.type}]</span>
                  <span>{t.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <TimeStamp timestamp={line.timestamp} />
      </div>
    );
  }

  // Code block detection
  const hasCode = line.content.includes("```");

  return (
    <div className="group flex items-start gap-0 py-0.5">
      <div className="flex-1 text-xs leading-relaxed" style={{ color }}>
        <span style={{ color: line.type === "user" ? "#00ff88" : color, opacity: line.type === "user" ? 0.7 : 1 }}>
          {prefix}
        </span>
        {hasCode ? <CodeRenderer content={line.content} /> : (
          <span className="whitespace-pre-wrap">{line.content}</span>
        )}
      </div>
      <TimeStamp timestamp={line.timestamp} />
    </div>
  );
};

const TimeStamp = ({ timestamp }: { timestamp: number }) => (
  <span className="ml-2 shrink-0 text-[10px] opacity-0 transition-opacity group-hover:opacity-40" style={{ color: "#666" }}>
    {fmtTime(timestamp)}
  </span>
);

// ── Code block renderer ───────────────────────────────────────────
const CodeRenderer = ({ content }: { content: string }) => {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const lines = part.slice(3, -3).split("\n");
          const lang = lines[0]?.trim() || "";
          const code = (lang ? lines.slice(1) : lines).join("\n");
          return (
            <div key={i} className="my-2 overflow-x-auto rounded-md border text-xs" style={{ background: "rgba(0,0,0,0.4)", borderColor: "#1e1e1e" }}>
              {lang && <div className="border-b px-3 py-1 text-[10px] uppercase tracking-wider" style={{ borderColor: "#1e1e1e", color: "#00ff88", opacity: 0.5 }}>{lang}</div>}
              <pre className="p-3 leading-relaxed" style={{ color: "#b0e0b0" }}>{code}</pre>
            </div>
          );
        }
        return <span key={i} className="whitespace-pre-wrap">{part}</span>;
      })}
    </>
  );
};

// ── Campaign Form ─────────────────────────────────────────────────
const CampaignForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: Record<string, string>) => void;
  onCancel: () => void;
}) => {
  const [product, setProduct] = useState("");
  const [market, setMarket] = useState("Netherlands");
  const [budget, setBudget] = useState("50");
  const [goal, setGoal] = useState("Traffic");

  return (
    <div className="my-3 rounded-lg border p-4" style={{ background: "#111111", borderColor: "#00ff8830" }}>
      <div className="mb-3 text-xs font-semibold" style={{ color: "#00ff88" }}>⚙ Campaign Builder</div>
      <div className="space-y-2">
        <FormField label="Product / Category" value={product} onChange={setProduct} placeholder="e.g. Car parts — brake pads" />
        <FormField label="Target Market" value={market} onChange={setMarket} />
        <FormField label="Budget / day (€)" value={budget} onChange={setBudget} type="number" />
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-wider" style={{ color: "#666" }}>Goal</label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full rounded border bg-transparent px-2 py-1.5 text-xs outline-none"
            style={{ borderColor: "#1e1e1e", color: "#e0e0e0" }}
          >
            <option value="Traffic">Traffic</option>
            <option value="Leads">Leads</option>
            <option value="Sales">Sales</option>
          </select>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={() => onSubmit({ product, market, budget, goal })} disabled={!product} className="rounded px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-30" style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88" }}>
            Launch Campaign
          </button>
          <button onClick={onCancel} className="rounded px-3 py-1.5 text-xs transition-all" style={{ color: "#666" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ── Prompt Builder Form ───────────────────────────────────────────
const PromptForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: Record<string, string>) => void;
  onCancel: () => void;
}) => {
  const [type, setType] = useState("SEO");
  const [subject, setSubject] = useState("");
  const [tone, setTone] = useState("Professional");

  return (
    <div className="my-3 rounded-lg border p-4" style={{ background: "#111111", borderColor: "#00ff8830" }}>
      <div className="mb-3 text-xs font-semibold" style={{ color: "#00ff88" }}>✦ Prompt Builder</div>
      <div className="space-y-2">
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-wider" style={{ color: "#666" }}>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded border bg-transparent px-2 py-1.5 text-xs outline-none" style={{ borderColor: "#1e1e1e", color: "#e0e0e0" }}>
            <option value="SEO">SEO Content</option>
            <option value="Product Description">Product Description</option>
            <option value="Ad Copy">Ad Copy</option>
            <option value="Email">Email</option>
          </select>
        </div>
        <FormField label="Subject / Keyword" value={subject} onChange={setSubject} placeholder="e.g. brake pads OEM quality" />
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-wider" style={{ color: "#666" }}>Tone</label>
          <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full rounded border bg-transparent px-2 py-1.5 text-xs outline-none" style={{ borderColor: "#1e1e1e", color: "#e0e0e0" }}>
            <option value="Professional">Professional</option>
            <option value="Casual">Casual</option>
            <option value="Technical">Technical</option>
          </select>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={() => onSubmit({ type, subject, tone })} disabled={!subject} className="rounded px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-30" style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88" }}>
            Generate
          </button>
          <button onClick={onCancel} className="rounded px-3 py-1.5 text-xs transition-all" style={{ color: "#666" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ── Shared form field ─────────────────────────────────────────────
const FormField = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <div>
    <label className="mb-1 block text-[10px] uppercase tracking-wider" style={{ color: "#666" }}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded border bg-transparent px-2 py-1.5 text-xs outline-none placeholder:opacity-30"
      style={{ borderColor: "#1e1e1e", color: "#e0e0e0" }}
    />
  </div>
);

export default HansAI;
