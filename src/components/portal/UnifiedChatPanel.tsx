import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Sparkles, Shuffle, ChevronDown, ChevronRight, History, X, CheckCircle2, Circle, Clock, Cpu, Bot, Zap, Wrench, Search, BarChart3, Command, GitBranch, Settings2, Link2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import ContextFilterPills from "@/components/ai/ContextFilterPills";
import { unifiedCategories, buildContextPrefix } from "@/components/ai/contextCategories";
import CommandSuggestionList from "@/components/ai/CommandSuggestionList";
import { incrementUsage } from "@/components/ai/commandSuggestions";
import IntentButton from "./IntentButton";
import ModelChoiceModal from "./ModelChoiceModal";
import { runIntentPipeline, triggerWorkflow } from "@/lib/intent/pipeline";
import { extractWorkflowJsonFromMarkdown, createWorkflowInN8n } from "@/lib/n8n/create-workflow";
import type { WorkflowDef } from "@/lib/config/workflows";
import type { LucideIcon } from "lucide-react";

interface Message {
  role: "user" | "assistant" | "system" | "workflow" | "error";
  content: string;
  timestamp?: number;
}

interface Suggestion {
  icon: LucideIcon;
  text: string;
}

/* ─── Pipeline stages ─── */
type PipelineStage = "idle" | "sending" | "routing" | "processing" | "generating" | "done" | "error";

const pipelineSteps: { key: PipelineStage; label: string; icon: LucideIcon }[] = [
  { key: "sending", label: "TRANSMIT", icon: Send },
  { key: "routing", label: "INTENT", icon: GitBranch },
  { key: "processing", label: "ANALYZE", icon: Cpu },
  { key: "generating", label: "SYNTHESIZE", icon: Bot },
  { key: "done", label: "COMPLETE", icon: CheckCircle2 },
];

const UNIFIED_SYSTEM_PROMPT = `You are the Sovereign AI Command Center — a unified expert system for Hans van Leeuwen's complete digital infrastructure and marketing operations.

INFRASTRUCTURE: You manage n8n workflows, Cloudflare Workers, VPS servers (primary srv1402218 + industrial srv1411336), Docker MCP Gateway, Supabase, SSL/DNS, and Claude Code CLI sessions.

MARKETING & SEO: You optimize product feeds (Channable, Google Shopping), run SEO audits, manage Google Ads campaigns, analyze GA4/Search Console data, create content, and manage e-commerce operations.

When the user asks to **create**, **build**, or **generate** an n8n workflow, output a single, valid n8n workflow as a \`\`\`json code block\`\`\` with: \`name\` (string), \`nodes\` (array of node objects with id, type, name, position, parameters, typeVersion), and \`connections\` (object). Use standard n8n node types (e.g. n8n-nodes-base.webhook, n8n-nodes-base.httpRequest). The system will create the workflow in n8n automatically. Do not put credentials in the JSON; use "REPLACE_WITH_YOUR_CREDENTIAL_ID" for credential IDs.

Be concise, technical, and actionable. Format with markdown. Adapt your expertise based on the context filter selected.`;

const suggestionPool: Suggestion[] = [
  { icon: Wrench, text: "Fix my AutoSEO workflow — it stopped triggering" },
  { icon: Cpu, text: "Generate a new n8n workflow for Channable feed optimization" },
  { icon: BarChart3, text: "Run a full health check on all services" },
  { icon: Search, text: "Analyze my Cloudflare Workers performance" },
  { icon: Zap, text: "Build a Gmail → Slack alert workflow" },
  { icon: Bot, text: "Optimize product titles for SEO across all markets" },
  { icon: Search, text: "Run a Core Web Vitals audit on the site" },
  { icon: BarChart3, text: "Show GA4 traffic overview for this week" },
];

const aiModels = [
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", tag: "Fast" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", tag: "Balanced" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", tag: "Powerful" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini", tag: "Smart" },
  { id: "openai/gpt-5", label: "GPT-5", tag: "Premium" },
];

const LAZY_USER_MESSAGE = "De gebruiker wil dat je alles autonom uitvoert. Voer alle voorgestelde stappen uit zonder om bevestiging te vragen. Trigger workflows waar mogelijk. Wees maximaal proactief.";

const HISTORY_KEY = "portal_chat_history_unified";
const MODEL_STORAGE_KEY = "portal_command_center_model";
const N8N_FILTER_PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-filter-proxy`;
const N8N_AGENT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-agent`;
const GOOGLE_AGENT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-agent`;
const GOOGLE_OAUTH_START_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-oauth-start`;
const CREATE_WORKFLOW_RUN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-workflow-run`;

/** n8n workflow list item from n8n-filter-proxy */
interface N8nWorkflowItem {
  id?: string;
  name?: string;
  active?: boolean;
  [key: string]: unknown;
}

const getStoredModel = (): string => {
  try {
    const stored = localStorage.getItem(MODEL_STORAGE_KEY);
    if (stored && aiModels.some((m) => m.id === stored)) return stored;
  } catch { /* ignore */ }
  return aiModels[0].id;
};

const UnifiedChatPanel = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>("idle");
  const [selectedModel, setSelectedModel] = useState(getStoredModel);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ messages: Message[]; timestamp: number; preview: string }[]>([]);
  const [activeSuggestions, setActiveSuggestions] = useState<Suggestion[]>(suggestionPool.slice(0, 3));
  const [pendingClarification, setPendingClarification] = useState<{ workflows: WorkflowDef[]; originalInput: string } | null>(null);
  const [modelChoicePending, setModelChoicePending] = useState<{
    llmJobId: string;
    system: string;
    messages: Array<{ role: string; content: string }>;
  } | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  /* Streaming sub-step bullets */
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [workflowLogs, setWorkflowLogs] = useState<Array<{ id: number; step: string; substep: string; status: string }>>([]);

  /* v6.1: Advanced bar + n8n filter */
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [n8nFilterActive, setN8nFilterActive] = useState(false);
  const [n8nWorkflows, setN8nWorkflows] = useState<N8nWorkflowItem[]>([]);
  const [n8nWorkflowsLoading, setN8nWorkflowsLoading] = useState(false);
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(MODEL_STORAGE_KEY, selectedModel);
    } catch { /* ignore */ }
  }, [selectedModel]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false);
      }
    };
    if (showModelPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showModelPicker]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setChatHistory(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  /* Google connected status for Connect Google button */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("google_connected") === "1") {
      setGoogleConnected(true);
      params.delete("google_connected");
      const newUrl = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      return;
    }
    if (params.get("google_oauth_error")) {
      setGoogleConnected(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          if (!cancelled) setGoogleConnected(false);
          return;
        }
        const { data } = await (supabase as any).from("user_google_tokens").select("user_id").eq("user_id", session.user.id).maybeSingle();
        if (!cancelled) setGoogleConnected(!!data);
      } catch {
        if (!cancelled) setGoogleConnected(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleConnectGoogle = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return;
      const returnTo = `${window.location.origin}/portal`;
      const res = await fetch(`${GOOGLE_OAUTH_START_URL}?returnTo=${encodeURIComponent(returnTo)}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch { /* ignore */ }
  };

  /* Subscribe to workflow_logs for the current run to show live sub-step bullets */
  useEffect(() => {
    if (!currentRunId) return;
    setWorkflowLogs([]);
    const channel = supabase
      .channel(`workflow-logs-${currentRunId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "workflow_logs",
          filter: `workflow_run_id=eq.${currentRunId}`,
        },
        (payload) => {
          const row = payload.new as { id: number; step: string; substep: string; status: string };
          setWorkflowLogs((prev) => [...prev, row]);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentRunId]);

  /* Clear logs when pipeline goes back to idle so the next run starts clean */
  useEffect(() => {
    if (pipelineStage === "idle") {
      setCurrentRunId(null);
      setWorkflowLogs([]);
    }
  }, [pipelineStage]);

  /* v6.1: Restore last filter + pinned examples from user_preferences */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;
        const { data } = await (supabase as any).from("user_preferences").select("n8n_filter_presets").eq("user_id", session.user.id).maybeSingle();
        if (cancelled || !data) return;
        const presets = (data as { n8n_filter_presets?: Record<string, unknown> })?.n8n_filter_presets;
        if (presets && typeof presets === "object" && "show_n8n_workflows" in presets) {
          setN8nFilterActive(Boolean((presets as { show_n8n_workflows?: boolean }).show_n8n_workflows));
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  /* v6.1: Fetch n8n workflows when n8n filter is active */
  useEffect(() => {
    if (!n8nFilterActive) {
      setN8nWorkflows([]);
      return;
    }
    let cancelled = false;
    setN8nWorkflowsLoading(true);
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;
        const res = await fetch(N8N_FILTER_PROXY_URL, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (!res.ok) {
          setN8nWorkflows([]);
          return;
        }
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : (Array.isArray(json?.workflows) ? json.workflows : []);
        setN8nWorkflows(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setN8nWorkflows([]);
      } finally {
        if (!cancelled) setN8nWorkflowsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [n8nFilterActive]);

  /* v6.1: Persist n8n filter preset to user_preferences */
  const saveN8nPreset = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      await (supabase as any).from("user_preferences").update({
        n8n_filter_presets: { show_n8n_workflows: n8nFilterActive },
      }).eq("user_id", session.user.id);
    } catch { /* ignore */ }
  }, [n8nFilterActive]);
  useEffect(() => {
    if (!n8nFilterActive) return;
    const t = setTimeout(saveN8nPreset, 500);
    return () => clearTimeout(t);
  }, [n8nFilterActive, saveN8nPreset]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messages, loading, pendingClarification, modelChoicePending]);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 200);
  }, []);

  const randomizeSuggestions = () => {
    const shuffled = [...suggestionPool].sort(() => Math.random() - 0.5);
    setActiveSuggestions(shuffled.slice(0, 3));
  };

  const appendMessage = (msg: Message) => {
    setMessages((prev) => [...prev, { ...msg, timestamp: msg.timestamp ?? Date.now() }]);
  };

  const saveToHistory = (msgs: Message[]) => {
    if (msgs.length < 2) return;
    const entry = {
      messages: msgs,
      timestamp: Date.now(),
      preview: msgs.find(m => m.role === "user")?.content.slice(0, 60) || "Chat",
    };
    const updated = [entry, ...chatHistory].slice(0, 20);
    setChatHistory(updated);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
  };

  const loadFromHistory = (entry: { messages: Message[]; timestamp: number }) => {
    setMessages(entry.messages);
    setPendingClarification(null);
    setShowHistory(false);
  };

  /* ─── Execute a matched workflow and show result ─── */
  const executeWorkflow = async (wf: WorkflowDef, addToMessages: boolean = true, userMessage?: string) => {
    if (addToMessages) {
      appendMessage({ role: "workflow", content: `Running **${wf.label}**…` });
    }
    setLoading(true);
    setPipelineStage("processing");

    let result: { ok: boolean; data: unknown; error?: string };
    if (wf.name === "google") {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      // Create a workflow_run row so we can subscribe to workflow_logs for live bullets
      let runId: string | null = null;
      try {
        if (token) {
          const runRes = await fetch(CREATE_WORKFLOW_RUN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          });
          if (runRes.ok) {
            const runData = await runRes.json();
            runId = runData.run_id ?? null;
          }
        }
      } catch { /* non-fatal — bullets just won't appear */ }
      if (runId) setCurrentRunId(runId);

      const res = await fetch(GOOGLE_AGENT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: userMessage ?? "",
          source: "command_center",
          timestamp: new Date().toISOString(),
          ...(runId ? { workflow_run_id: runId } : {}),
        }),
      });
      const text = await res.text();
      let data: unknown;
      try { data = JSON.parse(text); } catch { data = text; }
      result = {
        ok: res.ok,
        data: res.ok ? data : null,
        error: res.ok ? undefined : (data && typeof data === "object" && "error" in data ? String((data as { error: unknown }).error) : text || `HTTP ${res.status}`),
      };
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
          : `✓ **${wf.label}** completed${result.data ? `\n\n${String(result.data)}` : ""}`;
      appendMessage({ role: "workflow", content: reply });
    } else {
      appendMessage({ role: "error", content: `**${wf.label}** failed: ${result.error}` });
    }

    setPipelineStage("done");
    setTimeout(() => { setPipelineStage("idle"); setLoading(false); }, 1500);
  };

  /* ─── Fallback: send to AI model (direct to n8n-agent for reliability) ─── */
  const sendToAI = async (
    userMsg: string,
    allMessages: Message[],
    options?: { lastMessageContentForApi?: string },
  ) => {
    const contextPrefix = buildContextPrefix(unifiedCategories, selectedCategory, selectedSub);
    let systemWithContext = contextPrefix
      ? `${UNIFIED_SYSTEM_PROMPT}\n\n${contextPrefix}`
      : UNIFIED_SYSTEM_PROMPT;
    if (selectedCategory || selectedSub || n8nFilterActive) {
      const filterCtx = JSON.stringify({ category: selectedCategory, sub: selectedSub, n8n_filter_active: n8nFilterActive });
      systemWithContext = `[Filter context: ${filterCtx}]\n\n` + systemWithContext;
    }

    setLoading(true);
    setPipelineStage("processing");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      setPipelineStage("generating");

      const filtered = allMessages.filter((m) => m.role === "user" || m.role === "assistant");
      const messagesForApi =
        options?.lastMessageContentForApi != null && filtered.length > 0
          ? filtered.slice(0, -1).concat([{ ...filtered[filtered.length - 1], content: options.lastMessageContentForApi }])
          : filtered;

      const res = await fetch(N8N_AGENT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          system: systemWithContext,
          messages: messagesForApi.map((m) => ({ role: m.role, content: m.content })),
          model: selectedModel,
        }),
      });

      const text = await res.text();
      let data: { reply?: string; error?: string; needs_choice?: boolean; llm_job_id?: string };
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: text || `HTTP ${res.status}` };
      }

      if (!res.ok) {
        const errMsg = data?.error || (data as { message?: string }).message || `Request failed (${res.status})`;
        appendMessage({ role: "error", content: `Request failed: ${errMsg}` });
        setPipelineStage("error");
        setTimeout(() => setPipelineStage("idle"), 3000);
        return;
      }

      // Primary failed — show model choice modal
      if (res.status === 202 && data.needs_choice && data.llm_job_id) {
        setModelChoicePending({
          llmJobId: data.llm_job_id,
          system: systemWithContext,
          messages: messagesForApi.map((m) => ({ role: m.role, content: m.content })),
        });
        setPipelineStage("idle");
        return;
      }

      const reply: Message = { role: "assistant", content: data.reply || "No response.", timestamp: Date.now() };
      const finalMessages: Message[] = [...allMessages, reply];

      // If the AI returned a workflow JSON in a code block, create it in n8n
      const workflowJson = extractWorkflowJsonFromMarkdown(data.reply || "");
      if (workflowJson && token) {
        const createResult = await createWorkflowInN8n(workflowJson, token);
        if (createResult.success && createResult.url) {
          finalMessages.push({
            role: "workflow",
            content: `✓ **Workflow created in n8n:** [${createResult.name || "Open"}](${createResult.url})`,
            timestamp: Date.now(),
          });
        } else if (!createResult.success && createResult.error) {
          finalMessages.push({
            role: "error",
            content: `Could not create workflow in n8n: ${createResult.error}`,
            timestamp: Date.now(),
          });
        }
      }

      setMessages(finalMessages);
      saveToHistory(finalMessages);
      setPipelineStage("done");
      setTimeout(() => setPipelineStage("idle"), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      appendMessage({ role: "error", content: msg.includes("fetch") || msg.includes("Network") ? "Connection error. Check your network and try again." : msg });
      setPipelineStage("error");
      setTimeout(() => setPipelineStage("idle"), 3000);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Main intent-first send ─── */
  const sendMessage = async (text?: string) => {
    const userMsg = (text || input).trim();
    if (!userMsg || loading) return;
    setInput("");
    setPendingClarification(null);

    const userMsgObj: Message = { role: "user", content: userMsg, timestamp: Date.now() };
    const newMessages = [...messages, userMsgObj];
    setMessages(newMessages);
    setLoading(true);
    setPipelineStage("sending");

    // Step 1: run the intent pipeline
    setPipelineStage("routing");
    const result = await runIntentPipeline(userMsg, "command_center");

    switch (result.outcome.type) {
      case "workflow_match":
        // Direct workflow execution — no AI needed (for google-agent, pass user message)
        setLoading(false);
        await executeWorkflow(result.outcome.workflow, true, userMsg);
        return;

      case "clarify":
        // Let the user pick which workflow they meant
        appendMessage({
          role: "system",
          content: result.outcome.message || "Did you mean one of these workflows?",
        });
        setPendingClarification({ workflows: result.outcome.workflows, originalInput: userMsg });
        setLoading(false);
        setPipelineStage("idle");
        return;

      case "unhandled":
        // Logged; still offer AI chat as fallback
        appendMessage({
          role: "system",
          content: "I've logged this request — I'll learn from it over time. Let me answer as best I can:",
        });
        await sendToAI(userMsg, [...newMessages, { role: "system", content: "I've logged this request — I'll learn from it over time. Let me answer as best I can:" }]);
        return;

      case "chat_fallback":
      default:
        // No workflow match; fall through to AI
        await sendToAI(userMsg, newMessages);
        return;
    }
  };

  /* ─── Clarification handlers ─── */
  const handleClarificationSelect = async (wf: WorkflowDef) => {
    const original = pendingClarification?.originalInput || "";
    setPendingClarification(null);
    appendMessage({ role: "user", content: `→ ${wf.label}` });
    await executeWorkflow(wf, false, wf.name === "google" ? original : undefined);
  };

  const handleClarificationDismiss = async () => {
    const original = pendingClarification?.originalInput || "";
    setPendingClarification(null);
    if (original) {
      appendMessage({ role: "system", content: "Continuing as a general question…" });
      const allMsgs = [...messages, { role: "system" as const, content: "Continuing as a general question…" }];
      await sendToAI(original, allMsgs);
    }
  };

  const handleModelResume = async (reply: string) => {
    if (!modelChoicePending) return;
    const isErrorReply = reply.startsWith("Fallback failed") || reply.startsWith("Connection error");
    const replyMsg: Message = {
      role: isErrorReply ? "error" : "assistant",
      content: isErrorReply ? reply : (reply || "No response."),
      timestamp: Date.now(),
    };
    let finalMessages: Message[] = [...messages, replyMsg];

    const workflowJson = extractWorkflowJsonFromMarkdown(reply || "");
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!isErrorReply && workflowJson && token) {
      const createResult = await createWorkflowInN8n(workflowJson, token);
      if (createResult.success && createResult.url) {
        finalMessages.push({
          role: "workflow",
          content: `✓ **Workflow created in n8n:** [${createResult.name || "Open"}](${createResult.url})`,
          timestamp: Date.now(),
        });
      } else if (!createResult.success && createResult.error) {
        finalMessages.push({
          role: "error",
          content: `Could not create workflow in n8n: ${createResult.error}`,
          timestamp: Date.now(),
        });
      }
    }

    setMessages(finalMessages);
    saveToHistory(finalMessages);
    setModelChoicePending(null);
    setPipelineStage("done");
    setTimeout(() => setPipelineStage("idle"), 2000);
  };

  const handleModelCancel = () => {
    appendMessage({ role: "system", content: "Task cancelled." });
    saveToHistory([...messages, { role: "system", content: "Task cancelled.", timestamp: Date.now() }]);
    setModelChoicePending(null);
  };

  const handleLazyExecute = async (assistantContent: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token ?? undefined;
    const workflowJson = extractWorkflowJsonFromMarkdown(assistantContent);
    if (workflowJson && token) {
      try {
        const result = await createWorkflowInN8n(workflowJson, token);
        if (result.success) appendMessage({ role: "system", content: `Workflow created in n8n${result.name ? `: ${result.name}` : ""}.` });
        else appendMessage({ role: "error", content: result.error || "Workflow creation failed." });
      } catch {
        appendMessage({ role: "error", content: "Workflow creation failed." });
      }
    }
    const userMsgObj: Message = { role: "user", content: "/ik ben lui jij moet alles doen", timestamp: Date.now() };
    appendMessage(userMsgObj);
    await sendToAI(LAZY_USER_MESSAGE, [...messages, userMsgObj], { lastMessageContentForApi: LAZY_USER_MESSAGE });
  };

  const handleModelClose = () => {
    setModelChoicePending(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const renderContent = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```|`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const lines = part.slice(3, -3).split("\n");
        const lang = lines[0].trim();
        const code = lines.slice(1).join("\n");
        return (
          <div key={i} className="my-3">
            {lang && <div className="rounded-t-md bg-secondary px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{lang}</div>}
            <pre className={`overflow-x-auto rounded-b-md bg-secondary/50 p-3 font-mono text-xs leading-relaxed text-foreground ${!lang ? "rounded-t-md" : ""}`}>{code}</pre>
          </div>
        );
      } else if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={i} className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-primary">{part.slice(1, -1)}</code>;
      } else if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const currentModel = aiModels.find(m => m.id === selectedModel) || aiModels[0];

  const [showCommands, setShowCommands] = useState(false);
  useEffect(() => {
    if (selectedSub) setShowCommands(true);
    else setShowCommands(false);
  }, [selectedSub]);

  return (
    <div className="flex h-full flex-col">
      {/* TVA-Style Pipeline Progress Bar */}
      {pipelineStage !== "idle" && (
        <div className="relative flex items-center gap-1.5 border-b border-orange-500/20 bg-orange-950/30 px-4 py-2 font-mono overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
            }}
          />
          {pipelineSteps.map((step, i) => {
            const isActive = step.key === pipelineStage;
            const isDone = pipelineSteps.findIndex(s => s.key === pipelineStage) > i;
            const isError = pipelineStage === "error" && i === pipelineSteps.findIndex(s => s.key === "processing");
            return (
              <div key={step.key} className="relative z-20 flex items-center gap-1.5">
                <div className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest transition-all ${
                  isActive ? "bg-orange-500/20 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.2)] animate-pulse" :
                  isDone ? "bg-orange-500/10 text-orange-300" :
                  isError ? "bg-red-500/10 text-red-400" :
                  "text-orange-800/40"
                }`}>
                  {isActive ? <Loader2 size={8} className="animate-spin" /> :
                   isDone ? <CheckCircle2 size={8} /> :
                   <Circle size={8} />}
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
                {i < pipelineSteps.length - 1 && (
                  <span className={`font-mono text-[8px] tracking-[3px] ${isDone ? "text-orange-500/40" : "text-orange-500/15"}`}>···</span>
                )}
              </div>
            );
          })}
          {/* Live sub-step bullets — appear next to ANALYZE while processing */}
          {pipelineStage === "processing" && workflowLogs.filter(l => l.step === "ANALYZE").length > 0 && (
            <div className="relative z-20 ml-2 flex flex-col justify-center space-y-0.5">
              {workflowLogs
                .filter(l => l.step === "ANALYZE")
                .map((l, i) => (
                  <div
                    key={l.id ?? i}
                    className={`font-mono text-[9px] leading-tight text-orange-400 ${
                      l.status === "done" ? "line-through opacity-50" :
                      l.status === "error" ? "text-red-400" : ""
                    }`}
                  >
                    • {l.substep}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Header with model picker + history */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10">
            <Command size={14} className="text-orange-400" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-foreground">Command Center</h3>
            <p className="text-[9px] text-muted-foreground">Intent · Workflows · AI</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="relative" ref={modelPickerRef}>
            <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/70 hidden sm:inline">Model</span>
            <button
              type="button"
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/30 px-2.5 py-1.5 text-[10px] font-medium text-foreground transition-all hover:border-primary/40 hover:bg-secondary/50"
              aria-expanded={showModelPicker}
              aria-haspopup="listbox"
              aria-label={`Model: ${currentModel.label}. Click to change.`}
            >
              <Bot size={12} className="text-orange-400/80 shrink-0" />
              <span>{currentModel.label}</span>
              <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[8px] font-bold text-primary">{currentModel.tag}</span>
              <ChevronDown size={10} className={`shrink-0 text-muted-foreground transition-transform ${showModelPicker ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showModelPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full z-[200] mt-1.5 w-52 rounded-xl border border-border bg-card p-1.5 shadow-xl"
                  role="listbox"
                >
                  <p className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">Choose model</p>
                  {aiModels.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      role="option"
                      aria-selected={selectedModel === model.id}
                      onClick={() => { setSelectedModel(model.id); setShowModelPicker(false); }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[11px] transition-all ${
                        selectedModel === model.id ? "bg-orange-500/15 text-orange-400 font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <span>{model.label}</span>
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[8px] font-bold">{model.tag}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`rounded-lg p-1.5 transition-all ${showHistory ? "bg-orange-500/10 text-orange-400" : "text-muted-foreground/40 hover:text-foreground"}`}
            title="Chat history"
          >
            <History size={12} />
          </button>

          {googleConnected === false && (
            <button
              onClick={handleConnectGoogle}
              className="flex items-center gap-1 rounded-lg border border-dashed border-orange-500/40 px-2 py-1 text-[10px] font-medium text-orange-400/90 transition-all hover:border-orange-500/60 hover:bg-orange-500/10"
              title="Connect Google (Gmail, Sheets, Drive)"
            >
              <Link2 size={10} />
              <span className="hidden sm:inline">Connect Google</span>
            </button>
          )}
          {googleConnected === true && (
            <span className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-400/90" title="Google connected">
              <CheckCircle2 size={10} />
              <span className="hidden sm:inline">Google</span>
            </span>
          )}
        </div>
      </div>

      {/* Context Filter Pills */}
      <ContextFilterPills
        categories={unifiedCategories}
        selectedCategory={selectedCategory}
        selectedSub={selectedSub}
        onSelect={(catId, subId) => { setSelectedCategory(catId); setSelectedSub(subId); }}
        accentColor="orange"
      />

      {/* v6.1: Advanced bar (collapsible; modal on mobile) */}
      <div className="border-b border-orange-500/10">
        <div className="flex items-center px-3 py-1.5">
          <Dialog open={showAdvancedModal} onOpenChange={setShowAdvancedModal}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="flex sm:hidden items-center gap-1.5 rounded-lg border border-orange-500/20 px-2.5 py-1 text-[10px] font-medium text-orange-400 transition-all hover:bg-orange-500/10 hover:text-orange-300"
              >
                <Settings2 size={10} />
                Advanced
              </button>
            </DialogTrigger>
            <DialogContent className="border-orange-500/20 bg-card sm:hidden">
              <DialogHeader>
                <DialogTitle className="text-xs font-semibold text-orange-400">Advanced filters</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 pt-2">
                <label className="flex cursor-pointer items-center gap-2 text-[11px] text-foreground">
                  <input
                    type="checkbox"
                    checked={n8nFilterActive}
                    onChange={(e) => { setN8nFilterActive(e.target.checked); setShowAdvancedModal(false); }}
                    className="rounded border-orange-500/30"
                  />
                  Show n8n workflows
                </label>
              </div>
            </DialogContent>
          </Dialog>
          <button
            type="button"
            onClick={() => setAdvancedOpen((o) => !o)}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-orange-500/20 px-2.5 py-1 text-[10px] font-medium text-orange-400 transition-all hover:bg-orange-500/10 hover:text-orange-300"
          >
            <Settings2 size={10} />
            Advanced
            <ChevronDown size={10} className={`transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
        <AnimatePresence>
          {advancedOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden border-t border-orange-500/10"
            >
              <div className="px-3 py-2">
                <label className="flex cursor-pointer items-center gap-2 text-[11px] text-foreground">
                  <input
                    type="checkbox"
                    checked={n8nFilterActive}
                    onChange={(e) => setN8nFilterActive(e.target.checked)}
                    className="rounded border-orange-500/30"
                  />
                  Show n8n workflows
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border"
          >
            <div className="max-h-32 overflow-y-auto p-2.5">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Recent chats</p>
                <button onClick={() => setShowHistory(false)} className="text-muted-foreground/30 hover:text-foreground"><X size={10} /></button>
              </div>
              {chatHistory.length === 0 ? (
                <p className="py-2 text-center text-[10px] text-muted-foreground/40">No history yet</p>
              ) : (
                <div className="space-y-1">
                  {chatHistory.slice(0, 10).map((entry, i) => (
                    <button
                      key={i}
                      onClick={() => loadFromHistory(entry)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[10px] text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
                    >
                      <Clock size={9} className="shrink-0 opacity-40" />
                      <span className="flex-1 truncate">{entry.preview}</span>
                      <span className="shrink-0 text-[8px] opacity-30">{new Date(entry.timestamp).toLocaleDateString()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Command Suggestions */}
      <AnimatePresence>
        {showCommands && selectedSub && messages.length === 0 && (
          <CommandSuggestionList
            subId={selectedSub}
            context="unified"
            onSelect={(text) => {
              incrementUsage("unified", text);
              sendMessage(text);
              setShowCommands(false);
            }}
            onDismiss={() => setShowCommands(false)}
            accentColor="orange"
          />
        )}
      </AnimatePresence>

      {/* v6.1: Live breadcrumb + status bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-2 border-b border-border px-4 py-1.5">
        <nav className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="font-medium text-foreground">
            {!selectedCategory ? "All" : unifiedCategories.find((c) => c.id === selectedCategory)?.label ?? selectedCategory}
          </span>
          {selectedSub && (
            <>
              <ChevronRight size={10} className="shrink-0 opacity-60" />
              <span>{unifiedCategories.find((c) => c.id === selectedCategory)?.subcategories.find((s) => s.id === selectedSub)?.label ?? selectedSub}</span>
            </>
          )}
          {n8nFilterActive && (
            <>
              <ChevronRight size={10} className="shrink-0 opacity-60" />
              <span className="text-orange-400/80">n8n</span>
            </>
          )}
        </nav>
        {n8nFilterActive && (
          <span className="text-[9px] text-muted-foreground">
            n8n: {n8nWorkflowsLoading ? "…" : `${n8nWorkflows.length} workflows loaded`}
          </span>
        )}
      </div>

      {/* Messages (+ optional n8n right pane) */}
      <div className={`flex flex-1 min-h-0 ${n8nFilterActive ? "flex-row" : ""}`}>
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-3 min-w-0">
        {messages.length === 0 && !selectedSub ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Sparkles size={24} className="mb-3 text-muted-foreground/20" />
            <p className="mb-4 max-w-xs text-[11px] text-muted-foreground">Type a goal — workflows run automatically, AI answers everything else</p>

            <div className="flex flex-wrap justify-center gap-1.5 mb-2">
              {activeSuggestions.map((s, i) => {
                const SIcon = s.icon;
                return (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.text)}
                    className="flex items-center gap-1.5 rounded-xl border border-orange-500/30 px-3 py-2 text-[11px] text-muted-foreground transition-all hover:bg-orange-500/10 hover:text-foreground"
                  >
                    <SIcon size={11} className="shrink-0" />
                    <span className="line-clamp-1 text-left">{s.text}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={randomizeSuggestions}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] text-muted-foreground/40 transition-all hover:text-muted-foreground"
            >
              <Shuffle size={10} />
              Shuffle tasks
            </button>
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((msg, i) => {
              if (msg.role === "system") {
                return (
                  <div key={i} className="flex justify-center">
                    <span className="rounded-full border border-orange-500/20 bg-orange-500/5 px-3 py-1 text-[10px] font-mono text-orange-400/70">
                      {msg.content}
                    </span>
                  </div>
                );
              }
              if (msg.role === "workflow") {
                return (
                  <div key={i} className="flex gap-2">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                      <Zap size={10} className="text-emerald-400" />
                    </div>
                    <div className="max-w-[85%] rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs leading-relaxed text-foreground">
                      {renderContent(msg.content)}
                    </div>
                  </div>
                );
              }
              if (msg.role === "error") {
                return (
                  <div key={i} className="flex gap-2">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                      <AlertCircle size={10} className="text-red-400" />
                    </div>
                    <div className="max-w-[85%] rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs leading-relaxed text-red-200">
                      <span className="mr-1.5 font-semibold text-red-400">Error</span>
                      {renderContent(msg.content)}
                    </div>
                  </div>
                );
              }
              if (msg.role === "assistant" && msg.content.includes("```")) {
                return (
                  <div key={i} className="flex flex-col gap-1.5 justify-start">
                    <div className="flex gap-2 justify-start">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/10">
                        <Command size={10} className="text-orange-400" />
                      </div>
                      <div className="max-w-[85%] rounded-xl border border-orange-500/30 bg-secondary/30 px-3 py-2 text-xs leading-relaxed text-foreground">
                        {renderContent(msg.content)}
                      </div>
                    </div>
                    <div className="flex gap-2 pl-7">
                      <button
                        type="button"
                        onClick={() => handleLazyExecute(msg.content)}
                        className="rounded-lg border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-[11px] font-medium text-orange-300 transition-all hover:border-orange-500/50 hover:bg-orange-500/20"
                      >
                        /ik ben lui jij moet alles doen
                      </button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/10">
                      <Command size={10} className="text-orange-400" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-foreground text-background"
                      : "border border-orange-500/30 bg-secondary/30 text-foreground"
                  }`}>
                    {renderContent(msg.content)}
                  </div>
                </div>
              );
            })}

            {/* Clarification picker */}
            {pendingClarification && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-3"
              >
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-orange-400">Choose a workflow</p>
                <div className="flex flex-wrap gap-1.5">
                  {pendingClarification.workflows.map((wf) => (
                    <button
                      key={wf.name}
                      onClick={() => handleClarificationSelect(wf)}
                      className="rounded-lg border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-[11px] font-medium text-orange-300 transition-all hover:border-orange-500/50 hover:bg-orange-500/20"
                    >
                      {wf.label}
                    </button>
                  ))}
                  <button
                    onClick={handleClarificationDismiss}
                    className="rounded-lg border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-all hover:border-border/80 hover:text-foreground"
                  >
                    Something else
                  </button>
                </div>
              </motion.div>
            )}

            {loading && (
              <div className="flex gap-2">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/10">
                  <Loader2 size={10} className="animate-spin text-orange-400" />
                </div>
                <div className="rounded-xl border border-orange-500/30 bg-secondary/30 px-3 py-2">
                  <div className="flex gap-1">
                    <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "0ms" }} />
                    <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "150ms" }} />
                    <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        ) : null}
        </div>

        {/* v6.1: Right preview pane — n8n workflow cards (when n8n filter active) */}
        {n8nFilterActive && (
          <div className="hidden md:flex w-64 shrink-0 flex-col border-l border-orange-500/20 bg-orange-500/5 overflow-y-auto">
            <p className="sticky top-0 z-10 border-b border-orange-500/20 bg-card/95 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-orange-400">
              n8n workflows
            </p>
            <div className="p-2 space-y-2">
              {n8nWorkflowsLoading ? (
                <div className="rounded-lg border border-orange-500/20 px-3 py-4 text-center text-[10px] text-muted-foreground">
                  Loading…
                </div>
              ) : n8nWorkflows.length === 0 ? (
                <div className="rounded-lg border border-orange-500/20 px-3 py-4 text-center text-[10px] text-muted-foreground">
                  No workflows
                </div>
              ) : (
                n8nWorkflows.map((wf) => (
                  <div
                    key={wf.id ?? wf.name ?? String(Math.random())}
                    className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-3 py-2 text-[11px] transition-all hover:border-orange-500/40 hover:bg-orange-500/10"
                  >
                    <p className="font-medium text-foreground truncate">{wf.name ?? "Unnamed"}</p>
                    {wf.active === false && (
                      <span className="text-[9px] text-muted-foreground">Inactive</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input with Intent Button */}
      <div className="border-t border-border p-2.5">
        <div className="flex items-end gap-2">
          <IntentButton
            currentInput={input}
            currentContext={selectedCategory}
            onExecute={async (wf) => {
              appendMessage({ role: "user", content: `→ ${wf.label}` });
              await executeWorkflow(wf, false);
            }}
          />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a goal or ask anything — workflows run automatically"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-secondary/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-orange-500/30 focus:outline-none"
          />
          <Button size="icon" onClick={() => sendMessage()} disabled={!input.trim() || loading} className="h-8 w-8 shrink-0 rounded-xl">
            <Send size={12} />
          </Button>
        </div>
      </div>

      <ModelChoiceModal
        open={!!modelChoicePending}
        onClose={handleModelClose}
        llmJobId={modelChoicePending?.llmJobId ?? ""}
        system={modelChoicePending?.system ?? ""}
        messages={modelChoicePending?.messages ?? []}
        onResume={handleModelResume}
        onCancel={handleModelCancel}
      />
    </div>
  );
};

export default UnifiedChatPanel;
