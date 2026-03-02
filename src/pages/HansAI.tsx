import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import CommandSidebar from "@/components/hansai/CommandSidebar";
import { HierarchyControls, hierarchyStorage } from "@/components/command-center/HierarchyControls";
import { HierarchyErrorBoundary, defaultHierarchyFallback } from "@/components/command-center/HierarchyErrorBoundary";
import { WORKFLOWS, type WorkflowDef } from "@/lib/config/workflows";
import { runIntentPipeline, logUnhandledIntent } from "@/lib/intent/pipeline";
import { extractWorkflowJsonFromMarkdown, createWorkflowInN8n } from "@/lib/n8n/create-workflow";
import type { HierarchyContext } from "@/lib/intent/types";
import { getContextSuggestionsList } from "@/data/contextSuggestions";
import {
  getVoicePersonas,
  getVoicePersonaByName,
  saveVoicePersona,
  deleteVoicePersona,
  type VoicePersona,
} from "@/data/voicePersonas";
import VoiceEditForm from "@/components/hansai/VoiceEditForm";
import StandardEditForm from "@/components/hansai/StandardEditForm";

// ── Config ─────────────────────────────────────────────────────────
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hansai-chat`;

type SuggestionItem = { cmd: string; desc: string };

const SLASH_COMMANDS: SuggestionItem[] = [
  { cmd: "/help", desc: "Show all commands" },
  { cmd: "/jarvis", desc: "Talk to JARVIS persona directly" },
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
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [showForm, setShowForm] = useState<"campaign" | "prompt" | "voice_edit" | null>(null);
  const [voiceEditName, setVoiceEditName] = useState<string | null>(null);
  const [activeVoice, setActiveVoice] = useState<VoicePersona | null>(null);
  const [spinnerIdx, setSpinnerIdx] = useState(0);
  const [clearFlash, setClearFlash] = useState(false);
  const [pendingClarification, setPendingClarification] = useState<WorkflowDef[] | null>(null);
  const [contextSuggestionsActive, setContextSuggestionsActive] = useState(false);
  const [commandHistory, setCommandHistory] = useState<{ text: string; timestamp: number; type: "slash" | "ai" | "workflow" }[]>([]);

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
    let helpText = SLASH_COMMANDS.map((c) => `  ${c.cmd.padEnd(16)} ${c.desc}`).join("\n");
    if (isAdmin) {
      helpText += "\n  /voice            Kies of bewerk een persoonlijke AI-stijl (admin)\n  /voice/reset       Terug naar standaard HansAI voice\n  /voice/<naam>/create   Voice aanmaken/bewerken (exact)\n  /voice/<naam>/standard/edit   Standaardvariabelen voor voice (exact)\n  /voice/<naam>/delete   Voice verwijderen (exact)";
    }
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
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl === "undefined") {
        addLine("error", "Supabase URL not set. Add VITE_SUPABASE_URL in Cloudflare Pages → Settings → Environment variables and redeploy.");
        setLoading(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (wf.direct) {
        const res = await fetch(wf.webhook, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ source: "command_center", timestamp: new Date().toISOString() }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (json.services && typeof json.services === "object") {
          const svcEntries = Object.entries(json.services) as [string, { ok: boolean; latency: number; name: string; error?: string }][];
          const total = svcEntries.length;
          const online = svcEntries.filter(([, s]) => s.ok).length;

          const header = `Empire Health — ${online}/${total} services online`;
          const rows = svcEntries.map(([key, s]) => {
            const icon = s.ok ? "●" : "○";
            const status = s.ok ? "OK" : "DOWN";
            const latency = `${s.latency}ms`;
            return `  ${icon} ${s.name.padEnd(24)} ${status.padEnd(6)} ${latency}${s.error ? `  (${s.error})` : ""}`;
          }).join("\n");

          addLine("workflow", `✓ ${header}`);
          addLine("system", `${rows}\n\n  Timestamp: ${json.timestamp || new Date().toISOString()}`);
        } else {
          addLine("workflow", `✓ ${wf.label} completed`);
          addLine("system", "```json\n" + JSON.stringify(json, null, 2) + "\n```");
        }
      } else {
        const TRIGGER_URL = `${supabaseUrl}/functions/v1/trigger-webhook`;
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

        const json = await res.json() as { success: boolean; run_id?: string; data?: unknown; error?: string };
        if (!json.success) throw new Error(json.error || "Workflow returned failure");

        addLine("workflow", `✓ ${wf.label} triggered` + (json.run_id ? ` (run: ${json.run_id.slice(0, 8)}…)` : ""));
        if (json.data && typeof json.data === "object") {
          addLine("system", "```json\n" + JSON.stringify(json.data, null, 2) + "\n```");
        } else if (json.data) {
          addLine("system", String(json.data));
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg === "Failed to fetch") {
        addLine("error", `✗ ${wf.label} — Failed to fetch. Check VITE_SUPABASE_URL is set in Cloudflare Pages env and the site was rebuilt.`);
      } else {
        addLine("error", `✗ Error running ${wf.label} — ${msg}`);
      }
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
  const LAZY_USER_MESSAGE = "De gebruiker wil dat je alles autonom uitvoert. Voer alle voorgestelde stappen uit zonder om bevestiging te vragen. Trigger workflows waar mogelijk. Wees maximaal proactief.";

  const handleAI = async (
    text: string,
    autonomousContext?: string,
    options?: { persona?: string },
  ) => {
    if (!text) { addLine("error", "Usage: /ai [message]"); return; }

    addLine("user", text);
    const newAiMessages = autonomousContext
      ? [...aiMessages, { role: "assistant" as const, content: autonomousContext }, { role: "user" as const, content: LAZY_USER_MESSAGE }]
      : [...aiMessages, { role: "user" as const, content: text }];
    setAiMessages(newAiMessages);
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const body: {
        messages: typeof newAiMessages;
        router_context?: HierarchyContext;
        autonomous?: boolean;
        voice?: { name: string; style: string; standard?: string; promptLanguage?: string };
        persona?: { key: string };
      } = { messages: newAiMessages };
      if (hierarchyContext) body.router_context = hierarchyContext;
      if (autonomousContext) body.autonomous = true;
      if (options?.persona === "jarvis") {
        body.persona = { key: "jarvis" };
      } else if (activeVoice) {
        const isMichelle = activeVoice.name.toLowerCase().trim() === "michelle";
        body.voice = {
          name: activeVoice.name,
          style: activeVoice.style,
          standard: activeVoice.standard ?? "",
          promptLanguage: isMichelle ? "zh" : (activeVoice.promptLanguage ?? ""),
        };
      }
      // #region agent log
      fetch("http://127.0.0.1:7398/ingest/2ef60cb6-c2eb-4367-82fc-59990da34de1",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"29b2c0"},body:JSON.stringify({sessionId:"29b2c0",location:"HansAI.tsx:handleAI_before_fetch",message:"body_built",data:{hasVoice:!!body.voice,hasPersona:!!body.persona,activeVoiceId:activeVoice?.id ?? null},timestamp:Date.now(),hypothesisId:"H3_H4"})}).catch(()=>{});
      // #endregion

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

      // Route through proxy (was: direct n8n call → CORS errors, no auth, no tracking)
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const TRIGGER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-webhook`;

      const res = await fetch(TRIGGER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          webhook_url: wf.webhook,
          payload: { ...data, source: "command_center" },
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as { success: boolean; run_id?: string; error?: string };
      if (!json.success) throw new Error(json.error || "Campaign launch failed");

      addLine("workflow", `✓ Campaign launched for "${data.product}"` + (json.run_id ? ` (run: ${json.run_id.slice(0, 8)}…)` : ""));
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

  const handleLazyExecute = async (aiContent: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token ?? undefined;
    const workflowJson = extractWorkflowJsonFromMarkdown(aiContent);
    if (workflowJson && token) {
      try {
        const result = await createWorkflowInN8n(workflowJson, token);
        if (result.success) addLine("system", `Workflow created in n8n${result.name ? `: ${result.name}` : ""}.`);
        else addLine("error", result.error || "Workflow creation failed.");
      } catch {
        addLine("error", "Workflow creation failed.");
      }
    }
    await handleAI("/ik ben lui jij moet alles doen", aiContent);
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
      const cmdLower = cmd.toLowerCase();

      // Voice commands: only for admin; exact /voice/<name>/create, /voice/<name>/delete, /voice/<name>/standard/edit
      if (isAdmin) {
        const standardEditMatch = cmdLower.match(/^\/voice\/([^/]+)\/standard\/edit$/);
        if (standardEditMatch) {
          const nameSlug = standardEditMatch[1];
          const existing = getVoicePersonaByName(nameSlug);
          const displayName = existing?.name ?? nameSlug.charAt(0).toUpperCase() + nameSlug.slice(1).replace(/-/g, " ");
          // #region agent log
          fetch("http://127.0.0.1:7398/ingest/2ef60cb6-c2eb-4367-82fc-59990da34de1",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"29b2c0"},body:JSON.stringify({sessionId:"29b2c0",location:"HansAI.tsx:standard_edit_branch",message:"standard_edit_matched",data:{nameSlug,displayName},timestamp:Date.now(),hypothesisId:"H1"})}).catch(()=>{});
          // #endregion
          setVoiceStandardEditName(displayName);
          setShowForm("voice_standard_edit");
          addLine("system", `Editing standard (default variables) for voice "${displayName}".`);
          return;
        }

        const createMatch = cmdLower.match(/^\/voice\/([^/]+)\/create$/);
        if (createMatch) {
          const nameSlug = createMatch[1];
          const existing = getVoicePersonaByName(nameSlug);
          const displayName = existing?.name ?? nameSlug.charAt(0).toUpperCase() + nameSlug.slice(1).replace(/-/g, " ");
          setVoiceEditName(displayName);
          setShowForm("voice_edit");
          addLine("system", `Editing voice "${displayName}".`);
          return;
        }

        const deleteMatch = cmdLower.match(/^\/voice\/([^/]+)\/delete$/);
        if (deleteMatch) {
          const nameSlug = deleteMatch[1];
          const persona = getVoicePersonaByName(nameSlug);
          if (persona) {
            deleteVoicePersona(persona.id);
            addLine("system", `Voice "${persona.name}" verwijderd.`);
          } else {
            addLine("error", `Voice "${nameSlug}" niet gevonden.`);
          }
          return;
        }

        if (cmdLower === "/voice/reset") {
          setActiveVoice(null);
          addLine("system", "Voice gereset. Je spreekt nu met de standaard HansAI.");
          return;
        }

        const voiceActivateMatch = cmdLower.match(/^\/voice\/([^/]+)$/);
        if (voiceActivateMatch) {
          const nameSlug = voiceActivateMatch[1];
          const persona = getVoicePersonaByName(nameSlug);
          if (persona) {
            setActiveVoice(persona);
            addLine("system", `Voice "${persona.name}" actief. Je spreekt nu met ${persona.name} AI.`);
          } else {
            addLine("error", `Voice "${nameSlug}" niet gevonden. Gebruik /voice/${nameSlug}/create om deze aan te maken.`);
          }
          return;
        }

        if (cmdLower === "/voice") {
          const personas = getVoicePersonas();
          const list =
            personas.length === 0
              ? "  (geen voices opgeslagen)"
              : personas.map((p) => `  • ${p.name} — /voice/${p.id} om te gebruiken, /voice/${p.id}/create om te bewerken, /voice/${p.id}/delete om te verwijderen`).join("\n");
          addLine(
            "system",
            `Voices (admin): kies een persoonlijke AI-stijl.\n\n/voice/<naam> = wisselen | /voice/reset = standaard HansAI | /voice/<naam>/create = aanmaken/bewerken | /voice/<naam>/standard/edit = standaardvariabelen (exact) | /voice/<naam>/delete = verwijderen (exact).\n\n${list}`
          );
          return;
        }
      }

      switch (cmdLower) {
        case "/help": handleHelp(); break;
        case "/jarvis":
          // #region agent log
          fetch("http://127.0.0.1:7398/ingest/2ef60cb6-c2eb-4367-82fc-59990da34de1",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"29b2c0"},body:JSON.stringify({sessionId:"29b2c0",location:"HansAI.tsx:jarvis_case",message:"jarvis_invoked",data:{argLength:arg.length,trimmedLength:arg.trim().length},timestamp:Date.now(),hypothesisId:"H2"})}).catch(()=>{});
          // #endregion
          if (arg.trim()) {
            await handleAI(arg.trim(), undefined, { persona: "jarvis" });
          } else {
            addLine("error", "Usage: /jarvis [message]");
          }
          break;
        case "/idea": handleIdea(arg); break;
        case "/task": handleTask(arg); break;
        case "/tasks": handleTasks(); break;
        case "/workflows": handleWorkflows(); break;
        case "/run": await handleRun(arg); break;
        case "/clear": handleClear(); break;
        case "/ai": await handleAI(arg); break;
        case "/campaign": setShowForm("campaign"); addLine("system", "Opening campaign builder..."); break;
        case "/prompt": setShowForm("prompt"); addLine("system", "Opening prompt builder..."); break;
        case "/suggestions": {
          if (hierarchyContext.primaryGoal === "general") {
            addLine("system", "Selecteer eerst een categorie (Laag 1) om suggesties te zien.");
          } else {
            setContextSuggestionsActive(true);
            setInput("/");
            setSuggestions(getContextSuggestionsList(hierarchyContext.primaryGoal, isAdmin));
            setSelectedSuggestion(0);
            inputRef.current?.focus();
          }
          break;
        }
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
    setContextSuggestionsActive(false);
    if (val.trim().startsWith("/")) {
      addLine("user", val.trim());
    }
    processInput(val);
  };

  const selectSuggestionItem = (item: SuggestionItem) => {
    if (contextSuggestionsActive) {
      setContextSuggestionsActive(false);
      setSuggestions([]);
      setInput("");
      if (item.cmd === "Ik ben lui jij moet alles doen") {
        const lastAi = [...lines].reverse().find((l) => l.type === "ai");
        if (lastAi) {
          handleLazyExecute(lastAi.content);
        } else {
          handleAI("Ik ben lui jij moet alles doen");
        }
      } else {
        handleAI(item.cmd);
      }
      return;
    }
    if (item.cmd === "/suggestions") {
      setSuggestions([]);
      if (hierarchyContext.primaryGoal === "general") {
        addLine("system", "Selecteer eerst een categorie (Laag 1) om suggesties te zien.");
      } else {
        setContextSuggestionsActive(true);
        setInput("/");
        setSuggestions(getContextSuggestionsList(hierarchyContext.primaryGoal, isAdmin));
        setSelectedSuggestion(0);
      }
      inputRef.current?.focus();
      return;
    }
    setInput(item.cmd + " ");
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedSuggestion((i) => Math.min(i + 1, suggestions.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedSuggestion((i) => Math.max(i - 1, 0)); return; }
      if (e.key === "Tab" || e.key === "Enter") {
        if (suggestions[selectedSuggestion]) {
          e.preventDefault();
          selectSuggestionItem(suggestions[selectedSuggestion]);
          return;
        }
      }
      if (e.key === "Escape") {
        if (contextSuggestionsActive) { setContextSuggestionsActive(false); }
        setSuggestions([]);
        return;
      }
    }
    if (e.key === "Escape" && hierarchyLastValue) {
      handleHierarchyUndo();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    if (contextSuggestionsActive) {
      setSuggestions(getContextSuggestionsList(hierarchyContext.primaryGoal, isAdmin));
      setSelectedSuggestion(0);
      return;
    }
    if (val.startsWith("/") && val.length > 0) {
      const prefix = val.split(" ")[0];
      const isSingleToken = val.split(" ").length === 1;
      let list: SuggestionItem[] = [];
      if (pendingClarification && pendingClarification.length > 0 && isSingleToken) {
        const workflowOpts = pendingClarification.map((wf) => ({ cmd: `/run ${wf.name}`, desc: wf.label }));
        const slashMatches = SLASH_COMMANDS.filter((c) => c.cmd.startsWith(prefix));
        const adminVoice = isAdmin && "/voice".startsWith(prefix) ? [{ cmd: "/voice", desc: "Kies of bewerk een persoonlijke AI-stijl (admin)" }] : [];
        list = [...workflowOpts, ...adminVoice, ...slashMatches].slice(0, 10);
      } else {
        const base = SLASH_COMMANDS.filter((c) => c.cmd.startsWith(prefix));
        const adminVoice = isAdmin && "/voice".startsWith(prefix) ? [{ cmd: "/voice", desc: "Kies of bewerk een persoonlijke AI-stijl (admin)" }] : [];
        list = [...adminVoice, ...base].slice(0, 10);
      }
      if (hierarchyContext.primaryGoal !== "general" && isSingleToken && "/suggestions".startsWith(prefix)) {
        list = [{ cmd: "/suggestions", desc: "Toon 5 suggesties voor deze categorie" }, ...list.filter((s) => s.cmd !== "/suggestions")].slice(0, 10);
      }
      setSuggestions(isSingleToken ? list : []);
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
  return (
    <div className="relative flex h-screen overflow-hidden pt-[88px]" style={{ background: "#0a0a0a", fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
      {/* Main terminal area */}
      <div className="flex flex-1 flex-col overflow-hidden">
      {/* JetBrains Mono font */}
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* ── Compact status bar + hierarchy (Laag 1–3) ──────────── */}
      <div
        className="shrink-0 border-b px-4 py-2"
        style={{ borderColor: "#1e1e1e" }}
      >
        <div className="flex h-8 items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest" style={{ color: "#00ff88", opacity: 0.5 }}>
            Command Center
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#00ff88" }} />
            <span style={{ color: "#00ff88", opacity: 0.5, fontSize: "10px" }}>Online</span>
          </div>
        </div>
        <HierarchyErrorBoundary
          fallbackContext={defaultHierarchyFallback}
          onReset={() => setHierarchyContext(defaultHierarchyFallback)}
        >
          <HierarchyControls
            value={hierarchyContext}
            onChange={handleHierarchyChange}
            lastValue={hierarchyLastValue}
            onUndo={handleHierarchyUndo}
            className="mt-2"
          />
        </HierarchyErrorBoundary>
      </div>

      {/* ── Terminal output ───────────────────────────────────── */}
      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto px-4 py-4 transition-all duration-150 ${clearFlash ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="mx-auto max-w-3xl space-y-1">
          {lines.map((line) => (
            <TerminalLineComponent key={line.id} line={line} tasks={tasks} onToggleTask={toggleTask} onLazyExecute={handleLazyExecute} />
          ))}

          {/* Loading spinner */}
          {loading && (
            <div className="flex items-center gap-2 py-1 text-xs" style={{ color: "#00ff88", opacity: 0.6 }}>
              <span className="w-3 text-center">{spinnerFrames[spinnerIdx]}</span>
              <span>Processing...</span>
            </div>
          )}

          {/* Clarification options */}
          {pendingClarification && (
            <div className="my-2 flex flex-wrap gap-2">
              {pendingClarification.map((wf) => (
                <button
                  key={wf.name}
                  onClick={() => handleClarificationSelect(wf)}
                  className="rounded-md border px-3 py-1.5 text-xs font-medium transition-all hover:border-[#00ff88]/50 hover:bg-[#00ff88]/10"
                  style={{ borderColor: "#1e1e1e", color: "#00ff88", background: "rgba(0,255,136,0.05)" }}
                >
                  {wf.label}
                </button>
              ))}
              <button
                onClick={() => handleClarificationSomethingElse(commandHistory[commandHistory.length - 1]?.text || "")}
                className="rounded-md border px-3 py-1.5 text-xs transition-all hover:border-[#666] hover:bg-white/5"
                style={{ borderColor: "#1e1e1e", color: "#666" }}
              >
                Something else
              </button>
            </div>
          )}

          {/* Inline forms */}
          {showForm === "campaign" && (
            <CampaignForm onSubmit={handleCampaignSubmit} onCancel={() => setShowForm(null)} />
          )}
          {showForm === "prompt" && (
            <PromptForm onSubmit={handlePromptSubmit} onCancel={() => setShowForm(null)} />
          )}
          {showForm === "voice_edit" && voiceEditName && (
            <VoiceEditForm
              personaName={voiceEditName}
              onSave={(name) => {
                addLine("system", `Voice "${name}" opgeslagen.`);
                setShowForm(null);
                setVoiceEditName(null);
              }}
              onCancel={() => {
                setShowForm(null);
                setVoiceEditName(null);
              }}
            />
          )}
          {showForm === "voice_standard_edit" && voiceStandardEditName && (
            <StandardEditForm
              personaName={voiceStandardEditName}
              onSave={(name) => {
                addLine("system", `Standaard voor "${name}" opgeslagen.`);
                setShowForm(null);
                setVoiceStandardEditName(null);
              }}
              onCancel={() => {
                setShowForm(null);
                setVoiceStandardEditName(null);
              }}
            />
          )}
        </div>
      </div>

      {/* ── Input bar ─────────────────────────────────────────── */}
      <div className="shrink-0 px-4 pb-4 pt-2" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <div className="mx-auto max-w-3xl">
          {/* Autocomplete suggestions */}
          {suggestions.length > 0 && (
            <div className="mb-1 rounded-lg border p-1" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
              {contextSuggestionsActive && (
                <div className="mb-1 px-3 py-1 text-[10px] uppercase tracking-wider" style={{ color: "#00ff88", opacity: 0.4 }}>
                  Suggesties
                </div>
              )}
              {suggestions.map((s, i) => (
                <button
                  key={s.cmd}
                  onClick={() => selectSuggestionItem(s)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-left text-xs transition-colors ${
                    i === selectedSuggestion ? "" : ""
                  }`}
                  style={{
                    color: i === selectedSuggestion ? "#00ff88" : "#666",
                    background: i === selectedSuggestion ? "rgba(0,255,136,0.08)" : "transparent",
                  }}
                >
                  <span className="font-semibold" style={{ color: "#00ff88" }}>{s.cmd}</span>
                  {s.cmd !== s.desc && <span>{s.desc}</span>}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
            <span className="hidden text-xs sm:inline" style={{ color: "#00ff88", opacity: 0.5 }}>$</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or message..."
              disabled={loading}
              className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-30"
              style={{ color: "#e0e0e0", fontFamily: "inherit" }}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || loading}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all disabled:opacity-20"
              style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Command Sidebar */}
      <CommandSidebar
        commandHistory={commandHistory}
        onReplayCommand={(cmd) => {
          setInput(cmd);
          inputRef.current?.focus();
        }}
      />
    </div>
  );
};

// ── Terminal Line Renderer ────────────────────────────────────────
const TerminalLineComponent = ({
  line,
  tasks,
  onToggleTask,
  onLazyExecute,
}: {
  line: TerminalLine;
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
  onLazyExecute?: (content: string) => void;
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
  const showLazyButton = line.type === "ai" && hasCode && onLazyExecute;

  return (
    <div className="py-0.5">
      <div className="group flex items-start gap-0">
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
      {showLazyButton && (
        <div className="mt-1.5 pl-4">
          <button
            type="button"
            onClick={() => onLazyExecute(line.content)}
            className="rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all hover:border-[#00ff88]/50 hover:bg-[#00ff88]/10"
            style={{ borderColor: "#1e1e1e", color: "#00ff88", background: "rgba(0,255,136,0.05)" }}
          >
            /ik ben lui jij moet alles doen
          </button>
        </div>
      )}
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
