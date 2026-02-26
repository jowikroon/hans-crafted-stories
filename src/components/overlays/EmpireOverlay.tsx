import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Terminal, X, Crown, Wrench, Cpu, HeartPulse } from "lucide-react";
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

interface EmpireOverlayProps {
  open: boolean;
  onClose: () => void;
}

const EmpireOverlay = ({ open, onClose }: EmpireOverlayProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [showCommands, setShowCommands] = useState(false); // Added state for command list visibility
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

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
    if (e.key === "Enter") { e.preventDefault(); sendMessage(); }
    if (e.key === "Escape" && !showCommands) onClose();
  };

  const handleCommandDismiss = () => {
    setShowCommands(false);
    setSelectedSub(null);
  };

  const handleCommandSelect = (text: string) => {
    setShowCommands(false);
    sendMessage(text);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] bg-background/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-2xl mx-4 flex flex-col rounded-xl border border-violet-500/20 bg-[hsl(220,20%,8%)] shadow-2xl shadow-violet-500/5 overflow-hidden"
            style={{ maxHeight: "70vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-violet-500/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
                  <Crown size={14} className="text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-violet-300">Empire Commander</h3>
                  <p className="text-[10px] text-violet-400/40">Infrastructure · Diagnostics · Workflows</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href="/empire" className="rounded-md px-2 py-1 text-[10px] font-medium text-violet-400/40 transition-colors hover:bg-violet-500/10 hover:text-violet-300">
                  Full Dashboard →
                </a>
                <button onClick={onClose} className="rounded-md p-1.5 text-violet-400/30 transition-colors hover:bg-violet-500/10 hover:text-violet-300">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Context Filter Pills + Command List */}
            <div className="relative">
              <ContextFilterPills
                categories={empireCategories}
                selectedCategory={selectedCategory}
                selectedSub={selectedSub}
                onSelect={(cat, sub) => { setSelectedCategory(cat); setSelectedSub(sub); }}
                accentColor="violet"
              />
              <AnimatePresence>
                {showCommands && selectedSub && (
                  <CommandSuggestionList
                    subId={selectedSub}
                    context="empire"
                    onSelect={handleCommandSelect}
                    onDismiss={handleCommandDismiss}
                    accentColor="violet"
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 min-h-[200px]">
              {messages.length === 0 ? (
                // ... keep existing code (empty state)
                <div className="flex h-full flex-col items-center justify-center text-center py-8">
                  <div className="mb-3 h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center">
                    <Terminal size={18} className="text-violet-500/30" />
                  </div>
                  <p className="mb-5 text-xs text-violet-400/40 max-w-xs">Fix workflows, run diagnostics, or build new automations.</p>
                  <div className="flex flex-col gap-1.5 w-full max-w-md">
                    {SUGGESTIONS.map((s, i) => {
                      const Icon = s.icon;
                      return (
                        <button key={i} onClick={() => sendMessage(s.text)} className="flex items-center gap-2.5 rounded-lg border border-violet-500/10 px-3 py-2 text-left text-xs text-violet-400/50 transition-all hover:border-violet-500/25 hover:text-violet-300 hover:bg-violet-500/5">
                          <Icon size={12} className="shrink-0" />
                          <span className="line-clamp-1">{s.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // ... keep existing code (messages)
                <div className="space-y-3">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && (
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
                          <Terminal size={10} className="text-violet-400" />
                        </div>
                      )}
                      <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                        msg.role === "user" ? "bg-violet-500/15 text-violet-100" : "border border-violet-500/10 bg-violet-500/[0.03] text-violet-200/80"
                      }`}>
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-2">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
                        <Loader2 size={10} className="animate-spin text-violet-400" />
                      </div>
                      <div className="rounded-lg border border-violet-500/10 bg-violet-500/[0.03] px-3 py-2">
                        <div className="flex gap-1">
                          {[0, 150, 300].map((d) => (
                            <span key={d} className="h-1 w-1 animate-bounce rounded-full bg-violet-400/40" style={{ animationDelay: `${d}ms` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-violet-500/10 px-4 py-3">
              <div className="flex items-center gap-2 rounded-lg border border-violet-500/15 bg-black/30 px-3 py-2">
                <span className="text-[10px] text-violet-500/30 font-mono">▸</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Empire Commander..."
                  className="flex-1 bg-transparent text-xs text-violet-200 placeholder:text-violet-500/25 outline-none"
                />
                <button onClick={() => sendMessage()} disabled={!input.trim() || loading} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-600 text-white transition-all hover:bg-violet-500 disabled:opacity-30">
                  <Send size={10} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmpireOverlay;
