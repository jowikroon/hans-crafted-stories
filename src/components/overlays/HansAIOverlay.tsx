import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Bot, Zap, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ContextFilterPills from "@/components/ai/ContextFilterPills";
import CommandSuggestionList from "@/components/ai/CommandSuggestionList";
import { hansAICategories, buildContextPrefix } from "@/components/ai/contextCategories";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hansai-chat`;

const SUGGESTIONS = [
  { icon: Zap, text: "Write SEO content for brake pads landing page" },
  { icon: Sparkles, text: "Generate a campaign strategy for Q3" },
  { icon: Bot, text: "Optimize product titles for Channable feed" },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface HansAIOverlayProps {
  open: boolean;
  onClose: () => void;
}

const HansAIOverlay = ({ open, onClose }: HansAIOverlayProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [showCommands, setShowCommands] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, streamedText]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  // Show commands when sub is selected
  useEffect(() => {
    if (selectedSub) setShowCommands(true);
    else setShowCommands(false);
  }, [selectedSub]);

  const sendMessage = async (text?: string) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput("");
    setShowCommands(false);

    const contextPrefix = buildContextPrefix(hansAICategories, selectedCategory, selectedSub);
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    const messagesWithContext = contextPrefix
      ? [{ role: "user" as const, content: contextPrefix + userMsg }, ...newMessages.slice(0, -1).slice(-4)]
      : newMessages;

    setMessages(newMessages);
    setLoading(true);
    setStreamedText("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: contextPrefix ? messagesWithContext : newMessages }),
      });

      if (!resp.ok) throw new Error("Request failed");
      if (!resp.body) throw new Error("No body");

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
          if (!line.startsWith("data: ") || line.trim() === "") continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const content = JSON.parse(json)?.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              setStreamedText(fullResponse);
            }
          } catch { /* skip */ }
        }
      }

      setMessages([...newMessages, { role: "assistant", content: fullResponse }]);
      setStreamedText("");
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Connection error." }]);
      setStreamedText("");
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
            className="w-full max-w-2xl mx-4 flex flex-col rounded-xl border border-emerald-500/20 bg-[hsl(220,20%,8%)] shadow-2xl shadow-emerald-500/5 overflow-hidden"
            style={{ maxHeight: "70vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-emerald-500/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Bot size={14} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-emerald-300">Hans AI</h3>
                  <p className="text-[10px] text-emerald-400/40">Command Center · AI Chat</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href="/hansai" className="rounded-md px-2 py-1 text-[10px] font-medium text-emerald-400/40 transition-colors hover:bg-emerald-500/10 hover:text-emerald-300">
                  Full Terminal →
                </a>
                <button onClick={onClose} className="rounded-md p-1.5 text-emerald-400/30 transition-colors hover:bg-emerald-500/10 hover:text-emerald-300">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Context Filter Pills + Command List wrapper */}
            <div className="relative">
              <ContextFilterPills
                categories={hansAICategories}
                selectedCategory={selectedCategory}
                selectedSub={selectedSub}
                onSelect={(cat, sub) => { setSelectedCategory(cat); setSelectedSub(sub); }}
                accentColor="emerald"
              />
              <AnimatePresence>
                {showCommands && selectedSub && (
                  <CommandSuggestionList
                    subId={selectedSub}
                    context="hansai"
                    onSelect={handleCommandSelect}
                    onDismiss={handleCommandDismiss}
                    accentColor="emerald"
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 min-h-[200px]">
              {messages.length === 0 && !streamedText ? (
                <div className="flex h-full flex-col items-center justify-center text-center py-8">
                  <div className="mb-3 h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Sparkles size={18} className="text-emerald-500/30" />
                  </div>
                  <p className="mb-5 text-xs text-emerald-400/40 max-w-xs">Ask me anything — SEO, campaigns, product feeds, or code.</p>
                  <div className="flex flex-col gap-1.5 w-full max-w-md">
                    {SUGGESTIONS.map((s, i) => {
                      const Icon = s.icon;
                      return (
                        <button key={i} onClick={() => sendMessage(s.text)} className="flex items-center gap-2.5 rounded-lg border border-emerald-500/10 px-3 py-2 text-left text-xs text-emerald-400/50 transition-all hover:border-emerald-500/25 hover:text-emerald-300 hover:bg-emerald-500/5">
                          <Icon size={12} className="shrink-0" />
                          <span className="line-clamp-1">{s.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && (
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                          <Bot size={10} className="text-emerald-400" />
                        </div>
                      )}
                      <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                        msg.role === "user" ? "bg-emerald-500/15 text-emerald-100" : "border border-emerald-500/10 bg-emerald-500/[0.03] text-emerald-200/80"
                      }`}>
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      </div>
                    </div>
                  ))}
                  {streamedText && (
                    <div className="flex gap-2">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                        <Loader2 size={10} className="animate-spin text-emerald-400" />
                      </div>
                      <div className="max-w-[85%] rounded-lg border border-emerald-500/10 bg-emerald-500/[0.03] px-3 py-2 text-xs leading-relaxed text-emerald-200/80">
                        <span className="whitespace-pre-wrap">{streamedText}</span>
                      </div>
                    </div>
                  )}
                  {loading && !streamedText && (
                    <div className="flex gap-2">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                        <Loader2 size={10} className="animate-spin text-emerald-400" />
                      </div>
                      <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/[0.03] px-3 py-2">
                        <div className="flex gap-1">
                          {[0, 150, 300].map((d) => (
                            <span key={d} className="h-1 w-1 animate-bounce rounded-full bg-emerald-400/40" style={{ animationDelay: `${d}ms` }} />
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
            <div className="border-t border-emerald-500/10 px-4 py-3">
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/15 bg-black/30 px-3 py-2">
                <span className="text-[10px] text-emerald-500/30 font-mono">$</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Hans AI..."
                  className="flex-1 bg-transparent text-xs text-emerald-200 placeholder:text-emerald-500/25 outline-none"
                />
                <button onClick={() => sendMessage()} disabled={!input.trim() || loading} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white transition-all hover:bg-emerald-500 disabled:opacity-30">
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

export default HansAIOverlay;
