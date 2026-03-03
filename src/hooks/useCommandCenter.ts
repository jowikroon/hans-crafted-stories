/**
 * useCommandCenter — shared state hook for the unified Command Center.
 * Works across all 3 modes: popup, inline, terminal.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { WORKFLOWS, type WorkflowDef } from "@/lib/config/workflows";
import { runIntentPipeline, triggerWorkflow, logUnhandledIntent } from "@/lib/intent/pipeline";
import { extractWorkflowJsonFromMarkdown, createWorkflowInN8n } from "@/lib/n8n/create-workflow";
import {
  getVoicePersonas,
  getVoicePersonaByName,
  saveVoicePersona,
  deleteVoicePersona,
  type VoicePersona,
} from "@/data/voicePersonas";
import {
  CATEGORIES,
  ACTIONS,
  DELIVERY_OPTIONS,
  AI_MODELS,
  SYSTEM_PROMPT,
  getStoredModel,
  MODEL_STORAGE_KEY,
  HISTORY_KEY,
  type HeroAction,
  type CompactAction,
  type DeliveryOption,
  type DeliveryAction,
} from "@/components/command-center/commandCenterData";
import { downloadCSV } from "@/lib/utils/csv";
import { unifiedCategories, buildContextPrefix } from "@/components/ai/contextCategories";

// ── URLs ──────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const CHAT_URL = `${SUPABASE_URL}/functions/v1/hansai-chat`;
const N8N_AGENT_URL = `${SUPABASE_URL}/functions/v1/n8n-agent`;
const GOOGLE_AGENT_URL = `${SUPABASE_URL}/functions/v1/google-agent`;
const CREATE_WORKFLOW_RUN_URL = `${SUPABASE_URL}/functions/v1/create-workflow-run`;

// ── Types ──────────────────────────────────────────────────────
export interface Message {
  role: "user" | "assistant" | "system" | "workflow" | "error";
  content: string;
  timestamp?: number;
}

export type PipelineStage = "idle" | "sending" | "routing" | "processing" | "generating" | "done" | "error";

export type CommandCenterMode = "popup" | "inline" | "terminal";

interface TaskItem {
  id: string;
  type: "task" | "idea";
  text: string;
  timestamp: number;
  done: boolean;
}

const uid = () => crypto.randomUUID();

const SLASH_COMMANDS = [
  { cmd: "/help", desc: "Show all commands" },
  { cmd: "/jarvis", desc: "Talk to JARVIS persona directly" },
  { cmd: "/idea", desc: "Save an idea" },
  { cmd: "/task", desc: "Save a task" },
  { cmd: "/tasks", desc: "Show all tasks & ideas" },
  { cmd: "/run", desc: "Trigger n8n workflow" },
  { cmd: "/workflows", desc: "List available workflows" },
  { cmd: "/clear", desc: "Clear messages" },
  { cmd: "/ai", desc: "Chat with AI" },
  { cmd: "/campaign", desc: "Launch campaign form" },
  { cmd: "/prompt", desc: "Open prompt builder" },
  { cmd: "/autofull", desc: "Toggle full autonomous terminal mode" },
];

// ── Delivery follow-up prompts ────────────────────────────────
const DELIVERY_FOLLOWUPS: Record<DeliveryAction, string> = {
  show_chat: "Results are above. You can refine, export as CSV, or try a different approach. What next?",
  csv_download: "CSV downloaded. Want to run another export or analyze the data further?",
  send_n8n: "Workflow triggered. Want to check the result, run another, or ask about the output?",
  send_slack: "Message sent. Anything else to share or follow up on?",
  show_plan: "Here's the plan. Type 'execute' to run it, or adjust the approach.",
};

const mapNaturalLanguageSlash = (text: string): { cmd: string; arg: string } | null => {
  const lower = text.toLowerCase().trim();
  if (/^(capture |save |add )?idea[:\s]/i.test(lower)) return { cmd: "/idea", arg: text.replace(/^(capture |save |add )?idea[:\s]*/i, "").trim() };
  if (/^(add |create |new )?task[:\s]/i.test(lower)) return { cmd: "/task", arg: text.replace(/^(add |create |new )?task[:\s]*/i, "").trim() };
  if (/^(what |show |list |my )?(tasks|ideas|todo)/i.test(lower)) return { cmd: "/tasks", arg: "" };
  if (/^clear/i.test(lower)) return { cmd: "/clear", arg: "" };
  return null;
};

export function useCommandCenter(mode: CommandCenterMode) {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  // ── Messages ────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>(
    mode === "terminal"
      ? [
          { role: "system", content: "HansAI Command Center v2.0", timestamp: Date.now() },
          { role: "system", content: "Type /help to see all commands.", timestamp: Date.now() },
        ]
      : [],
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>("idle");

  // ── Pipeline start time (for elapsed timer) ─────────────────
  const [pipelineStartTime, setPipelineStartTime] = useState<number | null>(null);

  // Track pipeline start
  useEffect(() => {
    if (pipelineStage !== "idle" && pipelineStage !== "done" && pipelineStage !== "error" && !pipelineStartTime) {
      setPipelineStartTime(Date.now());
    } else if (pipelineStage === "idle") {
      setPipelineStartTime(null);
    }
  }, [pipelineStage]);

  // ── AutoFull mode ───────────────────────────────────────────
  const [autoFullMode, setAutoFullMode] = useState(false);

  // ── V3 Category/Action/Delivery state ───────────────────────
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [pickedAction, setPickedAction] = useState<(HeroAction | CompactAction) | null>(null);
  const [phase, setPhase] = useState<"browse" | "delivery" | "exec" | "done">("browse");

  // ── AI model ────────────────────────────────────────────────
  const [selectedModel, setSelectedModel] = useState(getStoredModel);
  useEffect(() => { try { localStorage.setItem(MODEL_STORAGE_KEY, selectedModel); } catch {} }, [selectedModel]);

  // ── Chat history ────────────────────────────────────────────
  const [chatHistory, setChatHistory] = useState<{ messages: Message[]; timestamp: number; preview: string }[]>([]);
  useEffect(() => { try { const s = localStorage.getItem(HISTORY_KEY); if (s) setChatHistory(JSON.parse(s)); } catch {} }, []);

  // ── Tasks/Ideas ─────────────────────────────────────────────
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  // ── Voice personas ──────────────────────────────────────────
  const [activeVoice, setActiveVoice] = useState<VoicePersona | null>(null);
  const [showForm, setShowForm] = useState<"campaign" | "prompt" | "voice_edit" | "voice_standard_edit" | null>(null);
  const [voiceEditName, setVoiceEditName] = useState<string | null>(null);
  const [voiceStandardEditName, setVoiceStandardEditName] = useState<string | null>(null);

  // ── Clarification ───────────────────────────────────────────
  const [pendingClarification, setPendingClarification] = useState<{ workflows: WorkflowDef[]; originalInput: string } | null>(null);

  // ── Context filter (inline/popup) ───────────────────────────
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  // ── Refs ─────────────────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // ── AI conversation memory (terminal streaming) ─────────────
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // ── Helpers ─────────────────────────────────────────────────
  const appendMessage = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, { ...msg, timestamp: msg.timestamp ?? Date.now() }]);
  }, []);

  const saveToHistory = useCallback((msgs: Message[]) => {
    if (msgs.length < 2) return;
    const entry = { messages: msgs, timestamp: Date.now(), preview: msgs.find(m => m.role === "user")?.content.slice(0, 60) || "Chat" };
    const updated = [entry, ...chatHistory].slice(0, 20);
    setChatHistory(updated);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch {}
  }, [chatHistory]);

  // ── Execute workflow ────────────────────────────────────────
  const executeWorkflow = useCallback(async (wf: WorkflowDef, userMessage?: string) => {
    appendMessage({ role: "workflow", content: `Running **${wf.label}**…` });
    setLoading(true);
    setPipelineStage("processing");

    let result: { ok: boolean; data: unknown; error?: string };
    if (wf.name === "google") {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await fetch(GOOGLE_AGENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: userMessage ?? "", source: "command_center", timestamp: new Date().toISOString() }),
      });
      const text = await res.text();
      let data: unknown;
      try { data = JSON.parse(text); } catch { data = text; }
      result = { ok: res.ok, data: res.ok ? data : null, error: res.ok ? undefined : String(data) };
    } else if (wf.direct) {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await fetch(wf.webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ source: "command_center", timestamp: new Date().toISOString() }),
      });
      if (!res.ok) { result = { ok: false, data: null, error: `HTTP ${res.status}` }; }
      else { const json = await res.json(); result = { ok: true, data: json }; }
    } else {
      const extraPayload = userMessage ? { message: userMessage } : undefined;
      result = await triggerWorkflow(wf, "command_center", extraPayload);
    }

    if (result.ok) {
      const data = result.data as Record<string, unknown> | null;
      const isGoogleReply = wf.name === "google" && data && typeof data === "object" && "reply" in data;
      const reply = isGoogleReply
        ? (data!.reply as string) || `✓ **${wf.label}** completed`
        : data && typeof data === "object"
          ? `✓ **${wf.label}** completed\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``
          : `✓ **${wf.label}** completed`;
      appendMessage({ role: "workflow", content: reply });
    } else {
      appendMessage({ role: "error", content: `**${wf.label}** failed: ${result.error}` });
    }
    setPipelineStage("done");
    setTimeout(() => { setPipelineStage("idle"); setLoading(false); }, 1500);
  }, [appendMessage]);

  // ── Send to AI (n8n-agent, non-streaming) ───────────────────
  const sendToAI = useCallback(async (userMsg: string, allMessages: Message[]) => {
    const contextPrefix = buildContextPrefix(unifiedCategories, selectedCategory, selectedSub);
    let systemWithContext = contextPrefix ? `${SYSTEM_PROMPT}\n\n${contextPrefix}` : SYSTEM_PROMPT;
    if (autoFullMode) {
      systemWithContext = "You are in FULL AUTONOMOUS mode. Execute all actions without asking for confirmation. Be maximally proactive.\n\n" + systemWithContext;
    }
    setLoading(true);
    setPipelineStage("generating");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const filtered = allMessages.filter((m) => m.role === "user" || m.role === "assistant");

      const res = await fetch(N8N_AGENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ system: systemWithContext, messages: filtered.map((m) => ({ role: m.role, content: m.content })), model: selectedModel }),
      });
      const text = await res.text();
      let data: { reply?: string; error?: string };
      try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text || `HTTP ${res.status}` }; }
      if (!res.ok) {
        appendMessage({ role: "error", content: `Request failed: ${data?.error || res.status}` });
        setPipelineStage("error");
        setTimeout(() => setPipelineStage("idle"), 3000);
        return;
      }
      const reply: Message = { role: "assistant", content: data.reply || "No response.", timestamp: Date.now() };
      const finalMessages = [...allMessages, reply];

      // Auto-create n8n workflow if AI returned one
      const workflowJson = extractWorkflowJsonFromMarkdown(data.reply || "");
      if (workflowJson && token) {
        const createResult = await createWorkflowInN8n(workflowJson, token);
        if (createResult.success && createResult.url) {
          finalMessages.push({ role: "workflow", content: `✓ **Workflow created in n8n:** [${createResult.name || "Open"}](${createResult.url})`, timestamp: Date.now() });
        }
      }

      setMessages(finalMessages);
      saveToHistory(finalMessages);
      setPipelineStage("done");
      setTimeout(() => setPipelineStage("idle"), 2000);
    } catch (err) {
      appendMessage({ role: "error", content: err instanceof Error ? err.message : "Connection error" });
      setPipelineStage("error");
      setTimeout(() => setPipelineStage("idle"), 3000);
    } finally {
      setLoading(false);
    }
  }, [appendMessage, saveToHistory, selectedModel, selectedCategory, selectedSub, autoFullMode]);

  // ── AI streaming (terminal mode via hansai-chat) ────────────
  const streamAI = useCallback(async (text: string, options?: { persona?: string }) => {
    if (!text) return;
    appendMessage({ role: "user", content: text });
    const newAiMsgs = [...aiMessages, { role: "user" as const, content: text }];
    setAiMessages(newAiMsgs);
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const body: Record<string, unknown> = { messages: newAiMsgs };
      if (options?.persona === "jarvis") body.persona = { key: "jarvis" };
      else if (activeVoice) body.voice = { name: activeVoice.name, style: activeVoice.style, standard: activeVoice.standard ?? "" };
      if (autoFullMode) body.autoFull = true;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify(body),
      });
      if (!resp.ok) { appendMessage({ role: "error", content: "AI request failed" }); setLoading(false); return; }
      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const content = JSON.parse(jsonStr)?.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") return [...prev.slice(0, -1), { ...last, content: fullResponse }];
                return [...prev, { role: "assistant", content: fullResponse, timestamp: Date.now() }];
              });
            }
          } catch { break; }
        }
      }
      setAiMessages([...newAiMsgs, { role: "assistant", content: fullResponse }]);
    } catch { appendMessage({ role: "error", content: "Connection error" }); }
    finally { setLoading(false); }
  }, [appendMessage, aiMessages, activeVoice, autoFullMode]);

  // ── V3 Action/Delivery handlers ─────────────────────────────
  const pickAction = useCallback((action: HeroAction | CompactAction) => {
    appendMessage({ role: "system", content: `→ ${action.cmd}` });
    setPickedAction(action);
    setPhase("delivery");
  }, [appendMessage]);

  /** Map a category to the best-matching n8n workflow */
  const matchWorkflowForAction = useCallback((action: HeroAction | CompactAction): WorkflowDef | undefined => {
    const cmd = action.cmd.toLowerCase();
    for (const wf of WORKFLOWS) {
      if (wf.keywords.some((kw) => cmd.includes(kw))) return wf;
    }
    const cat = activeCat || "";
    const catMap: Record<string, string> = {
      pricing: "autoseo", seo: "autoseo", product: "product-titles",
      automate: "n8n-agent", infra: "health-check", comms: "google",
    };
    if (catMap[cat]) return WORKFLOWS.find((w) => w.name === catMap[cat]);
    return undefined;
  }, [activeCat]);

  const pickDelivery = useCallback(async (d: DeliveryOption) => {
    if (!pickedAction) return;
    setPhase("exec");
    setActiveCat(null);

    const action = d.action;
    const cmd = pickedAction.cmd;
    const label = pickedAction.label;

    try {
      switch (action) {
        case "show_chat": {
          const userMsg: Message = { role: "user", content: cmd, timestamp: Date.now() };
          const newMsgs = [...messages, userMsg];
          setMessages(newMsgs);
          if (mode === "terminal") {
            await streamAI(cmd);
          } else {
            await sendToAI(cmd, newMsgs);
          }
          break;
        }

        case "csv_download": {
          appendMessage({ role: "workflow", content: `Generating data for **${label}**…` });
          setLoading(true);
          setPipelineStage("generating");

          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token;
          const res = await fetch(N8N_AGENT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
            body: JSON.stringify({ system: SYSTEM_PROMPT, messages: [{ role: "user", content: `${cmd}\n\nReturn the results as a markdown table or JSON array.` }], model: selectedModel }),
          });
          const data = await res.json().catch(() => ({}));
          const content = data.reply || data.error || "No data returned.";

          appendMessage({ role: "assistant", content });
          const filename = `${label.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.csv`;
          downloadCSV(content, filename);
          appendMessage({ role: "workflow", content: `✓ CSV downloaded: **${filename}**` });

          setLoading(false);
          setPipelineStage("done");
          setTimeout(() => setPipelineStage("idle"), 2000);
          break;
        }

        case "send_n8n": {
          const wf = matchWorkflowForAction(pickedAction);
          if (wf) {
            await executeWorkflow(wf, cmd);
          } else {
            appendMessage({ role: "system", content: "No matching n8n workflow found — routing to AI." });
            const userMsg: Message = { role: "user", content: cmd, timestamp: Date.now() };
            const newMsgs = [...messages, userMsg];
            setMessages(newMsgs);
            mode === "terminal" ? await streamAI(cmd) : await sendToAI(cmd, newMsgs);
          }
          break;
        }

        case "send_slack": {
          appendMessage({ role: "workflow", content: `Sending to Slack: **${label}**…` });
          setLoading(true);
          try {
            appendMessage({
              role: "system",
              content: "⚠️ Slack connector is available but no Slack edge function is wired yet. To enable this, connect Slack via the connector settings and a posting function will be created.",
            });
          } finally {
            setLoading(false);
          }
          break;
        }

        case "show_plan": {
          const planCmd = `Explain what this command will do step-by-step, without executing it:\n\n${cmd}`;
          const userMsg: Message = { role: "user", content: planCmd, timestamp: Date.now() };
          const newMsgs = [...messages, userMsg];
          setMessages(newMsgs);
          mode === "terminal" ? await streamAI(planCmd) : await sendToAI(planCmd, newMsgs);
          break;
        }
      }
    } catch (err) {
      appendMessage({ role: "error", content: `Delivery failed: ${err instanceof Error ? err.message : "Unknown error"}` });
    }

    // Append follow-up prompt and stay at "done" — no auto-reset
    const followUp = DELIVERY_FOLLOWUPS[action];
    if (followUp) {
      appendMessage({ role: "system", content: followUp });
    }
    setPhase("done");
    // Don't auto-reset to browse — wait for next user input
  }, [appendMessage, pickedAction, messages, mode, streamAI, sendToAI, executeWorkflow, matchWorkflowForAction, selectedModel]);

  const rerunHistory = useCallback((h: { cmd: string; out: string }) => {
    appendMessage({ role: "system", content: `Re-running: ${h.cmd}` });
    setPickedAction({ id: "re", label: h.cmd, deliveryType: "data", tools: [], sub: h.out, cmd: h.cmd } as HeroAction);
    setPhase("delivery");
  }, [appendMessage]);

  // ── Main input processor ────────────────────────────────────
  const processInput = useCallback(async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || loading) return;
    setInput("");
    setPendingClarification(null);

    // Reset phase from "done" when user types new input
    if (phase === "done") {
      setPhase("browse");
      setPickedAction(null);
    }

    // 1. V3 category matching (e.g. /pricing, /seo)
    for (const key of Object.keys(CATEGORIES)) {
      if (trimmed.toLowerCase().startsWith(`/${key}`)) {
        setActiveCat(key);
        const acts = [...(ACTIONS[key]?.hero || []), ...(ACTIONS[key]?.compact || [])];
        let best = acts[0], score = 0;
        for (const a of acts) {
          const s = a.label.toLowerCase().split(" ").filter(w => trimmed.toLowerCase().includes(w)).length;
          if (s > score) { score = s; best = a; }
        }
        if (best && score > 0) { pickAction(best); }
        else { setPhase("browse"); }
        return;
      }
    }

    // 2. Slash commands
    if (trimmed.startsWith("/")) {
      const [cmd, ...rest] = trimmed.split(" ");
      const arg = rest.join(" ").trim();
      const cmdLower = cmd.toLowerCase();

      // Voice commands (admin only)
      if (isAdmin) {
        const stdEdit = cmdLower.match(/^\/voice\/([^/]+)\/standard\/edit$/);
        if (stdEdit) {
          const existing = getVoicePersonaByName(stdEdit[1]);
          setVoiceStandardEditName(existing?.name ?? stdEdit[1]);
          setShowForm("voice_standard_edit");
          appendMessage({ role: "system", content: `Editing standard for voice "${stdEdit[1]}".` });
          return;
        }
        const create = cmdLower.match(/^\/voice\/([^/]+)\/create$/);
        if (create) { setVoiceEditName(create[1]); setShowForm("voice_edit"); appendMessage({ role: "system", content: `Editing voice "${create[1]}".` }); return; }
        const del = cmdLower.match(/^\/voice\/([^/]+)\/delete$/);
        if (del) { const p = getVoicePersonaByName(del[1]); if (p) { deleteVoicePersona(p.id); appendMessage({ role: "system", content: `Voice "${p.name}" deleted.` }); } else { appendMessage({ role: "error", content: `Voice "${del[1]}" not found.` }); } return; }
        if (cmdLower === "/voice/reset") { setActiveVoice(null); appendMessage({ role: "system", content: "Voice reset to default." }); return; }
        const activate = cmdLower.match(/^\/voice\/([^/]+)$/);
        if (activate) { const p = getVoicePersonaByName(activate[1]); if (p) { setActiveVoice(p); appendMessage({ role: "system", content: `Voice "${p.name}" active.` }); } return; }
        if (cmdLower === "/voice") {
          const personas = getVoicePersonas();
          appendMessage({ role: "system", content: `Voices:\n${personas.length === 0 ? "  (none)" : personas.map(p => `  • ${p.name}`).join("\n")}` });
          return;
        }
      }

      switch (cmdLower) {
        case "/help": appendMessage({ role: "system", content: `Available commands:\n${SLASH_COMMANDS.map(c => `  ${c.cmd.padEnd(16)} ${c.desc}`).join("\n")}` }); return;
        case "/jarvis": if (arg) { mode === "terminal" ? await streamAI(arg, { persona: "jarvis" }) : await sendToAI(arg, [...messages, { role: "user", content: arg }]); } else { appendMessage({ role: "error", content: "Usage: /jarvis [message]" }); } return;
        case "/idea": if (arg) { setTasks(prev => [...prev, { id: uid(), type: "idea", text: arg, timestamp: Date.now(), done: false }]); appendMessage({ role: "system", content: `Idea saved: ${arg}` }); } return;
        case "/task": if (arg) { setTasks(prev => [...prev, { id: uid(), type: "task", text: arg, timestamp: Date.now(), done: false }]); appendMessage({ role: "system", content: `Task saved: ${arg}` }); } return;
        case "/tasks": appendMessage({ role: "system", content: tasks.length === 0 ? "No tasks yet." : tasks.map(t => `  ${t.done ? "☑" : "☐"} [${t.type}] ${t.text}`).join("\n") }); return;
        case "/workflows": appendMessage({ role: "system", content: `Available workflows:\n${WORKFLOWS.map(w => `  ● ${w.name.padEnd(18)} ${w.label}`).join("\n")}` }); return;
        case "/run": {
          const wf = WORKFLOWS.find(w => w.name === arg || w.label.toLowerCase().includes(arg.toLowerCase()));
          if (wf) await executeWorkflow(wf);
          else appendMessage({ role: "error", content: `Unknown workflow: "${arg}"` });
          return;
        }
        case "/clear": setMessages(mode === "terminal" ? [{ role: "system", content: "Terminal cleared.", timestamp: Date.now() }] : []); return;
        case "/ai": if (arg) { mode === "terminal" ? await streamAI(arg) : await sendToAI(arg, [...messages, { role: "user", content: arg }]); } return;
        case "/campaign": setShowForm("campaign"); appendMessage({ role: "system", content: "Opening campaign builder..." }); return;
        case "/prompt": setShowForm("prompt"); appendMessage({ role: "system", content: "Opening prompt builder..." }); return;
        case "/autofull": {
          const newVal = !autoFullMode;
          setAutoFullMode(newVal);
          appendMessage({
            role: "system",
            content: newVal
              ? "⚡ AUTOFULL MODE ACTIVATED — Full autonomous terminal. All actions execute without confirmation. Neo-green override engaged."
              : "AUTOFULL MODE DEACTIVATED — Returning to standard mode.",
          });
          return;
        }
        default: appendMessage({ role: "error", content: `Unknown command: ${cmd}. Type /help.` }); return;
      }
    }

    // 3. Natural language slash mapping
    const mapped = mapNaturalLanguageSlash(trimmed);
    if (mapped) {
      switch (mapped.cmd) {
        case "/idea": if (mapped.arg) { setTasks(prev => [...prev, { id: uid(), type: "idea", text: mapped.arg, timestamp: Date.now(), done: false }]); appendMessage({ role: "system", content: `Idea saved: ${mapped.arg}` }); } return;
        case "/task": if (mapped.arg) { setTasks(prev => [...prev, { id: uid(), type: "task", text: mapped.arg, timestamp: Date.now(), done: false }]); appendMessage({ role: "system", content: `Task saved: ${mapped.arg}` }); } return;
        case "/tasks": appendMessage({ role: "system", content: tasks.length === 0 ? "No tasks yet." : tasks.map(t => `  ${t.done ? "☑" : "☐"} [${t.type}] ${t.text}`).join("\n") }); return;
        case "/clear": setMessages([]); return;
      }
    }

    // 4. Intent pipeline
    if (mode !== "terminal") {
      const userMsgObj: Message = { role: "user", content: trimmed, timestamp: Date.now() };
      const newMessages = [...messages, userMsgObj];
      setMessages(newMessages);
      setLoading(true);
      setPipelineStage("routing");

      const result = await runIntentPipeline(trimmed, "command_center");
      switch (result.outcome.type) {
        case "workflow_match": setLoading(false); await executeWorkflow(result.outcome.workflow, trimmed); return;
        case "clarify": appendMessage({ role: "system", content: result.outcome.message || "Did you mean one of these?" }); setPendingClarification({ workflows: result.outcome.workflows, originalInput: trimmed }); setLoading(false); setPipelineStage("idle"); return;
        case "unhandled": appendMessage({ role: "system", content: "I've logged this request." }); await sendToAI(trimmed, newMessages); return;
        default: await sendToAI(trimmed, newMessages); return;
      }
    } else {
      appendMessage({ role: "user", content: trimmed });
      setLoading(true);
      const result = await runIntentPipeline(trimmed, "command_center");
      setLoading(false);
      switch (result.outcome.type) {
        case "workflow_match": await executeWorkflow(result.outcome.workflow, trimmed); return;
        case "clarify": appendMessage({ role: "system", content: result.outcome.message || "Did you mean one of these?" }); setPendingClarification({ workflows: result.outcome.workflows, originalInput: trimmed }); return;
        case "unhandled": appendMessage({ role: "system", content: "Logged. Let me answer:" }); await streamAI(trimmed); return;
        default: await streamAI(trimmed); return;
      }
    }
  }, [loading, mode, messages, tasks, isAdmin, activeVoice, appendMessage, pickAction, executeWorkflow, sendToAI, streamAI, saveToHistory, selectedCategory, selectedSub, autoFullMode, phase]);

  // ── Clarification handlers ──────────────────────────────────
  const handleClarificationSelect = useCallback(async (wf: WorkflowDef) => {
    const original = pendingClarification?.originalInput;
    setPendingClarification(null);
    appendMessage({ role: "user", content: `→ ${wf.label}` });
    await executeWorkflow(wf, wf.name === "google" ? original : undefined);
  }, [pendingClarification, appendMessage, executeWorkflow]);

  const handleClarificationDismiss = useCallback(async () => {
    const original = pendingClarification?.originalInput || "";
    setPendingClarification(null);
    if (original) {
      appendMessage({ role: "system", content: "Continuing as a general question…" });
      mode === "terminal" ? await streamAI(original) : await sendToAI(original, messages);
    }
  }, [pendingClarification, appendMessage, mode, streamAI, sendToAI, messages]);

  return {
    // State
    messages, setMessages, input, setInput, loading, pipelineStage,
    activeCat, setActiveCat, pickedAction, setPickedAction, phase, setPhase,
    selectedModel, setSelectedModel, chatHistory, setChatHistory,
    tasks, setTasks, activeVoice, setActiveVoice,
    showForm, setShowForm, voiceEditName, setVoiceEditName,
    voiceStandardEditName, setVoiceStandardEditName,
    pendingClarification, setPendingClarification,
    selectedCategory, setSelectedCategory, selectedSub, setSelectedSub,
    autoFullMode, pipelineStartTime,
    // Refs
    scrollRef, inputRef,
    // Auth
    user, isAdmin,
    // Actions
    processInput, appendMessage, pickAction, pickDelivery, rerunHistory,
    executeWorkflow, handleClarificationSelect, handleClarificationDismiss,
    saveToHistory,
  };
}
