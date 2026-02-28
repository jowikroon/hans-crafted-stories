import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Sparkles, Shuffle, ChevronDown, History, X, CheckCircle2, Circle, Clock, Cpu, Bot, Zap, Wrench, Search, BarChart3, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ContextFilterPills from "@/components/ai/ContextFilterPills";
import { unifiedCategories, buildContextPrefix } from "@/components/ai/contextCategories";
import CommandSuggestionList from "@/components/ai/CommandSuggestionList";
import { incrementUsage } from "@/components/ai/commandSuggestions";
import IntentButton from "./IntentButton";
import type { LucideIcon } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

interface Suggestion {
  icon: LucideIcon;
  text: string;
}

/* ─── Pipeline stages (TVA vintage style) ─── */
type PipelineStage = "idle" | "sending" | "processing" | "generating" | "done" | "error";

const pipelineSteps: { key: PipelineStage; label: string; icon: LucideIcon }[] = [
  { key: "sending", label: "TRANSMIT", icon: Send },
  { key: "processing", label: "ANALYZE", icon: Cpu },
  { key: "generating", label: "SYNTHESIZE", icon: Bot },
  { key: "done", label: "COMPLETE", icon: CheckCircle2 },
];

const UNIFIED_SYSTEM_PROMPT = `You are the Sovereign AI Command Center — a unified expert system for Hans van Leeuwen's complete digital infrastructure and marketing operations.

INFRASTRUCTURE: You manage n8n workflows, Cloudflare Workers, VPS servers (primary srv1402218 + industrial srv1411336), Docker MCP Gateway, Supabase, SSL/DNS, and Claude Code CLI sessions.

MARKETING & SEO: You optimize product feeds (Channable, Google Shopping), run SEO audits, manage Google Ads campaigns, analyze GA4/Search Console data, create content, and manage e-commerce operations.

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

/* ─── Available AI models ─── */
const aiModels = [
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", tag: "Fast" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", tag: "Balanced" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", tag: "Powerful" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini", tag: "Smart" },
  { id: "openai/gpt-5", label: "GPT-5", tag: "Premium" },
];

const HISTORY_KEY = "portal_chat_history_unified";

const UnifiedChatPanel = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>("idle");
  const [selectedModel, setSelectedModel] = useState(aiModels[0].id);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ messages: Message[]; timestamp: number; preview: string }[]>([]);
  const [activeSuggestions, setActiveSuggestions] = useState<Suggestion[]>(suggestionPool.slice(0, 3));

  // Context filter state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load history
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setChatHistory(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 200);
  }, []);

  const randomizeSuggestions = () => {
    const shuffled = [...suggestionPool].sort(() => Math.random() - 0.5);
    setActiveSuggestions(shuffled.slice(0, 3));
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
    setShowHistory(false);
  };

  const sendMessage = async (text?: string) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput("");

    // Build context prefix
    const contextPrefix = buildContextPrefix(unifiedCategories, selectedCategory, selectedSub);
    const systemWithContext = contextPrefix
      ? `${UNIFIED_SYSTEM_PROMPT}\n\n${contextPrefix}`
      : UNIFIED_SYSTEM_PROMPT;

    const newMessages: Message[] = [...messages, { role: "user", content: userMsg, timestamp: Date.now() }];
    setMessages(newMessages);
    setLoading(true);
    setPipelineStage("sending");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      setPipelineStage("processing");

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ system: systemWithContext, messages: newMessages, model: selectedModel }),
      });

      setPipelineStage("generating");

      const data = await res.json();
      const finalMessages: Message[] = [...newMessages, { role: "assistant", content: data.reply || "No response.", timestamp: Date.now() }];
      setMessages(finalMessages);
      saveToHistory(finalMessages);
      setPipelineStage("done");
      setTimeout(() => setPipelineStage("idle"), 2000);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Connection error.", timestamp: Date.now() }]);
      setPipelineStage("error");
      setTimeout(() => setPipelineStage("idle"), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const renderContent = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);
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
      }
      return <span key={i}>{part}</span>;
    });
  };

  const currentModel = aiModels.find(m => m.id === selectedModel) || aiModels[0];

  const [showCommands, setShowCommands] = useState(false);

  // Show command list whenever a sub is selected
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
            <p className="text-[9px] text-muted-foreground">Unified AI · Infrastructure + Marketing</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Model Picker */}
          <div className="relative">
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground"
            >
              <Bot size={10} />
              <span className="hidden sm:inline">{currentModel.label}</span>
              <span className="rounded bg-primary/10 px-1 py-0.5 text-[8px] font-bold text-primary">{currentModel.tag}</span>
              <ChevronDown size={8} />
            </button>

            <AnimatePresence>
              {showModelPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-border bg-card p-1 shadow-xl"
                >
                  {aiModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => { setSelectedModel(model.id); setShowModelPicker(false); }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] transition-all ${
                        selectedModel === model.id ? "bg-orange-500/10 text-orange-400 font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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

          {/* History */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`rounded-lg p-1.5 transition-all ${showHistory ? "bg-orange-500/10 text-orange-400" : "text-muted-foreground/40 hover:text-foreground"}`}
            title="Chat history"
          >
            <History size={12} />
          </button>
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

      {/* Smart Command Suggestions (Layer 3) */}
      <AnimatePresence>
        {showCommands && selectedSub && messages.length === 0 && (
          <CommandSuggestionList
            subId={selectedSub}
            context="empire"
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 && !selectedSub ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Sparkles size={24} className="mb-3 text-muted-foreground/20" />
            <p className="mb-4 max-w-xs text-[11px] text-muted-foreground">Unified AI · Infrastructure + Marketing</p>

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
            {messages.map((msg, i) => (
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
            ))}
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

      {/* Input with Intent Button */}
      <div className="border-t border-border p-2.5">
        <div className="flex items-end gap-2">
          <IntentButton
            currentInput={input}
            currentContext={selectedCategory}
          />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything — infra, SEO, workflows, campaigns..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-secondary/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-orange-500/30 focus:outline-none"
          />
          <Button size="icon" onClick={() => sendMessage()} disabled={!input.trim() || loading} className="h-8 w-8 shrink-0 rounded-xl">
            <Send size={12} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedChatPanel;
