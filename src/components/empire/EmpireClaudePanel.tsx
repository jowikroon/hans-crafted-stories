import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Terminal, Loader2, Sparkles, Cpu, Wrench, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ContextFilterPills from "@/components/ai/ContextFilterPills";
import CommandSuggestionList from "@/components/ai/CommandSuggestionList";
import { empireCategories, buildContextPrefix } from "@/components/ai/contextCategories";

const SYSTEM_PROMPT = `You are the Sovereign AI Empire Commander — an expert system operator for Hans van Leeuwen's AI infrastructure.

You manage:
- n8n workflows (AutoSEO, Product Title Optimizer, Channable feeds)
- Cloudflare Workers & Zero Trust
- Two Hostinger VPS servers (primary: srv1402218, industrial: srv1411336)
- Docker MCP Gateway & custom MCP servers
- Supabase database & edge functions
- Claude Code CLI sessions

When asked to fix, build, or troubleshoot:
1. Diagnose the issue precisely
2. Provide exact commands or workflow JSON
3. Explain what each step does
4. Reference infrastructure endpoints when relevant

Be concise, technical, and actionable. Format with markdown.`;

const SUGGESTIONS = [
  { icon: Wrench, text: "Fix my AutoSEO workflow — it stopped triggering" },
  { icon: Cpu, text: "Generate a new n8n workflow for Channable feed optimization" },
  { icon: HeartPulse, text: "Run a full health check on all services" },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface EmpireClaudePanelProps {
  open: boolean;
  onClose: () => void;
}

const EmpireClaudePanel = ({ open, onClose }: EmpireClaudePanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [showCommands, setShowCommands] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (open) setTimeout(() => textareaRef.current?.focus(), 300); }, [open]);

  useEffect(() => {
    if (selectedSub) setShowCommands(true);
    else setShowCommands(false);
  }, [selectedSub]);

  const sendMessage = async (text?: string) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput("");
    setShowCommands(false);

    const contextPrefix = buildContextPrefix(empireCategories, selectedCategory, selectedSub);
    const systemWithContext = contextPrefix + SYSTEM_PROMPT;

    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ system: systemWithContext, messages: newMessages }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply || "No response." }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Connection error." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleCommandDismiss = () => {
    setShowCommands(false);
    setSelectedSub(null);
  };

  const handleCommandSelect = (text: string) => {
    setShowCommands(false);
    sendMessage(text);
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
            {lang && <div className="rounded-t-md bg-black/40 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-400/60">{lang}</div>}
            <pre className={`overflow-x-auto rounded-b-md bg-black/30 p-3 font-mono text-xs leading-relaxed text-emerald-300/80 ${!lang ? "rounded-t-md" : ""}`}>{code}</pre>
          </div>
        );
      } else if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={i} className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs text-emerald-400">{part.slice(1, -1)}</code>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="claude-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            key="claude-panel"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-3 z-50 flex flex-col overflow-hidden rounded-xl border border-emerald-500/20 bg-[hsl(220,20%,8%)] shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[85vh] sm:max-h-[800px] sm:w-full sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-emerald-500/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Terminal size={16} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-emerald-300">Empire Commander</h3>
                  <p className="text-[10px] text-emerald-400/40">Ask Claude · Manage Infrastructure</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-md p-1.5 text-emerald-400/40 transition-colors hover:bg-emerald-500/10 hover:text-emerald-300">
                <X size={16} />
              </button>
            </div>

            {/* Context Filter Pills + Command List */}
            <div className="relative">
              <ContextFilterPills
                categories={empireCategories}
                selectedCategory={selectedCategory}
                selectedSub={selectedSub}
                onSelect={(cat, sub) => { setSelectedCategory(cat); setSelectedSub(sub); }}
                accentColor="emerald"
              />
              <AnimatePresence>
                {showCommands && selectedSub && (
                  <CommandSuggestionList
                    subId={selectedSub}
                    context="empire"
                    onSelect={handleCommandSelect}
                    onDismiss={handleCommandDismiss}
                    accentColor="emerald"
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Sparkles size={32} className="mb-4 text-emerald-500/20" />
                  <h4 className="mb-1 text-lg font-medium text-emerald-300/80">Empire Commander</h4>
                  <p className="mb-6 max-w-sm text-xs text-emerald-400/40">Fix workflows, run diagnostics, or build new automations.</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {SUGGESTIONS.map((s, i) => {
                      const Icon = s.icon;
                      return (
                        <button key={i} onClick={() => sendMessage(s.text)} className="flex items-center gap-2 rounded-lg border border-emerald-500/15 px-3 py-2 text-left text-xs text-emerald-400/60 transition-all hover:border-emerald-500/30 hover:text-emerald-300">
                          <Icon size={12} className="shrink-0" />
                          <span className="line-clamp-1">{s.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && (
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                          <Terminal size={12} className="text-emerald-400" />
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user" ? "bg-emerald-500/20 text-emerald-100" : "border border-emerald-500/10 bg-emerald-500/[0.05] text-emerald-200/80"
                      }`}>
                        {renderContent(msg.content)}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-2.5">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                        <Loader2 size={12} className="animate-spin text-emerald-400" />
                      </div>
                      <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.05] px-3.5 py-2.5">
                        <div className="flex gap-1">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400/40" style={{ animationDelay: "0ms" }} />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400/40" style={{ animationDelay: "150ms" }} />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400/40" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-emerald-500/10 p-3">
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Claude, fix my AutoSEO workflow..."
                  rows={1}
                  className="flex-1 resize-none rounded-lg border border-emerald-500/15 bg-black/30 px-3 py-2.5 text-sm text-emerald-200 placeholder:text-emerald-500/30 focus:border-emerald-500/30 focus:outline-none"
                />
                <Button size="icon" onClick={() => sendMessage()} disabled={!input.trim() || loading} className="h-10 w-10 shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white">
                  <Send size={14} />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EmpireClaudePanel;
