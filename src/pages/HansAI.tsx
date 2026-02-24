import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigate } from "react-router-dom";
import {
  Terminal, Send, Plus, Trash2, Bot, Code, Search as SearchIcon, Pen, Crown,
  Loader2, Sparkles, Maximize2, Minimize2, ExternalLink, X, MessageSquare
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import ReactMarkdown from "react-markdown";

// ── Types ──────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  name: string;
  category: Category;
  model: string;
  messages: Message[];
  createdAt: number;
}

type Category = "empire" | "seo" | "creative" | "code" | "general" | "claude";

// ── Constants ──────────────────────────────────────────────────────
const CATEGORIES: { id: Category; label: string; icon: typeof Bot; color: string; description: string }[] = [
  { id: "empire", label: "Empire Ops", icon: Crown, color: "text-emerald-400", description: "Infrastructure & workflow management" },
  { id: "seo", label: "SEO Strategy", icon: SearchIcon, color: "text-blue-400", description: "Keywords, audits & marketplace optimization" },
  { id: "code", label: "Code Assistant", icon: Code, color: "text-purple-400", description: "Full-stack dev & DevOps help" },
  { id: "creative", label: "Creative Writer", icon: Pen, color: "text-amber-400", description: "Blog posts, copy & brand content" },
  { id: "general", label: "General AI", icon: Bot, color: "text-cyan-400", description: "General-purpose assistant" },
  { id: "claude", label: "Claude (n8n)", icon: Terminal, color: "text-orange-400", description: "Send to Claude via webhook" },
];

const MODELS = [
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", badge: "Fast" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", badge: "Balanced" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", badge: "Best" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini", badge: "Smart" },
  { id: "openai/gpt-5", label: "GPT-5", badge: "Premium" },
];

const WEBHOOK_URL = "https://n8n.hansvanleeuwen.com/webhook/claude-chat";
const TERMINAL_URL = "https://terminal.hansvanleeuwen.com";
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hansai-chat`;

// ── Helpers ─────────────────────────────────────────────────────────
const createSession = (category: Category): ChatSession => ({
  id: crypto.randomUUID(),
  name: `New ${CATEGORIES.find(c => c.id === category)?.label || "Chat"}`,
  category,
  model: MODELS[0].id,
  messages: [],
  createdAt: Date.now(),
});

// ── Component ──────────────────────────────────────────────────────
const HansAI = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem("hansai-sessions");
      return saved ? JSON.parse(saved) : [createSession("general")];
    } catch { return [createSession("general")]; }
  });
  const [activeId, setActiveId] = useState<string>(sessions[0]?.id || "");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalMax, setTerminalMax] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = sessions.find(s => s.id === activeId);

  // Persist sessions
  useEffect(() => {
    localStorage.setItem("hansai-sessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, loading]);

  useEffect(() => {
    document.title = "Hans AI — Command Center";
    const el = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (el) el.content = "noindex, nofollow";
  }, []);

  const updateSession = useCallback((id: string, updates: Partial<ChatSession>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const addSession = (category: Category) => {
    const s = createSession(category);
    setSessions(prev => [...prev, s]);
    setActiveId(s.id);
  };

  const deleteSession = (id: string) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      if (next.length === 0) {
        const fresh = createSession("general");
        setActiveId(fresh.id);
        return [fresh];
      }
      if (activeId === id) setActiveId(next[0].id);
      return next;
    });
  };

  // ── Streaming send ──────────────────────────────────────────────
  const sendMessage = async (text?: string) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading || !activeSession) return;
    setInput("");

    const newMessages: Message[] = [...activeSession.messages, { role: "user", content: userMsg }];
    updateSession(activeId, { messages: newMessages });

    // Auto-name on first message
    if (activeSession.messages.length === 0) {
      updateSession(activeId, { name: userMsg.slice(0, 40) + (userMsg.length > 40 ? "…" : "") });
    }

    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const body: Record<string, unknown> = {
        messages: newMessages,
        category: activeSession.category,
        model: activeSession.model,
      };

      if (activeSession.category === "claude") {
        body.webhook_url = WEBHOOK_URL;
      }

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
        updateSession(activeId, { messages: [...newMessages, { role: "assistant", content: `Error: ${err.error}` }] });
        setLoading(false);
        return;
      }

      // Non-streaming (webhook/claude mode)
      if (activeSession.category === "claude") {
        const data = await resp.json();
        updateSession(activeId, { messages: [...newMessages, { role: "assistant", content: data.reply || "No response." }] });
        setLoading(false);
        return;
      }

      // Streaming SSE
      if (!resp.body) throw new Error("No response body");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";

      const flush = (content: string) => {
        assistantSoFar += content;
        // Use functional update to always get latest state
        setSessions(prev => prev.map(s => {
          if (s.id !== activeId) return s;
          const msgs = [...newMessages];
          const lastIdx = msgs.length;
          if (msgs[lastIdx - 1]?.role === "assistant") {
            msgs[lastIdx - 1] = { role: "assistant", content: assistantSoFar };
          } else {
            msgs.push({ role: "assistant", content: assistantSoFar });
          }
          return { ...s, messages: msgs };
        }));
      };

      let done = false;
      while (!done) {
        const { done: readerDone, value } = await reader.read();
        if (readerDone) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) flush(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) flush(content);
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      console.error(e);
      updateSession(activeId, { messages: [...newMessages, { role: "assistant", content: "Connection error." }] });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Guard ────────────────────────────────────────────────────────
  if (authLoading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(220,20%,6%)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-400" />
      </div>
    );
  }
  if (!user || !isAdmin) return <Navigate to="/portal" replace />;

  const catInfo = CATEGORIES.find(c => c.id === activeSession?.category) || CATEGORIES[4];
  const CatIcon = catInfo.icon;

  return (
    <div className="min-h-screen bg-[hsl(220,20%,6%)] text-[hsl(160,20%,85%)]">
      <style>{`
        .hansai-page { --background: 220 20% 6%; --foreground: 160 20% 85%; --card: 220 18% 10%; --card-foreground: 160 20% 85%; --border: 220 15% 16%; --secondary: 220 15% 12%; --muted: 220 12% 18%; --muted-foreground: 160 10% 45%; }
      `}</style>

      <div className="hansai-page flex h-screen pt-[72px]">
        {/* ── Sidebar ─────────────────────────────────────────── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex h-full flex-col border-r border-[hsl(220,15%,16%)] bg-[hsl(220,18%,8%)] overflow-hidden"
            >
              {/* New chat buttons */}
              <div className="p-3 border-b border-[hsl(220,15%,16%)]">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400/50">New Chat</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => addSession(cat.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-[hsl(220,15%,16%)] px-2 py-1.5 text-[11px] text-[hsl(160,10%,45%)] transition-all hover:border-emerald-500/30 hover:text-emerald-300"
                      >
                        <Icon size={12} className={cat.color} />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Session list */}
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {[...sessions].reverse().map(s => {
                  const sCat = CATEGORIES.find(c => c.id === s.category);
                  const SIcon = sCat?.icon || Bot;
                  const isActive = s.id === activeId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveId(s.id)}
                      className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-all ${
                        isActive
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                          : "text-[hsl(160,10%,50%)] hover:bg-[hsl(220,15%,12%)] border border-transparent"
                      }`}
                    >
                      <SIcon size={13} className={sCat?.color || "text-cyan-400"} />
                      <span className="flex-1 truncate">{s.name}</span>
                      <span className="text-[10px] text-[hsl(160,10%,30%)]">{s.messages.length}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                        className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-red-400/50 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={11} />
                      </button>
                    </button>
                  );
                })}
              </div>

              {/* Terminal shortcut */}
              <div className="border-t border-[hsl(220,15%,16%)] p-3">
                <button
                  onClick={() => setTerminalOpen(true)}
                  className="flex w-full items-center gap-2 rounded-lg border border-emerald-500/15 px-3 py-2 text-xs text-emerald-400/60 transition-all hover:border-emerald-500/30 hover:text-emerald-300"
                >
                  <Terminal size={13} />
                  <span>Claude Terminal</span>
                  <ExternalLink size={10} className="ml-auto" />
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Main chat area ──────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center gap-3 border-b border-[hsl(220,15%,16%)] bg-[hsl(220,18%,8%)] px-4 py-2.5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-md p-1.5 text-[hsl(160,10%,45%)] transition-colors hover:bg-[hsl(220,15%,12%)] hover:text-emerald-300"
            >
              <MessageSquare size={16} />
            </button>

            <div className="flex items-center gap-2">
              <CatIcon size={15} className={catInfo.color} />
              <span className="text-sm font-medium text-emerald-300">{catInfo.label}</span>
              <span className="text-[10px] text-[hsl(160,10%,35%)]">— {catInfo.description}</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Model selector (not for claude webhook) */}
              {activeSession?.category !== "claude" && (
                <select
                  value={activeSession?.model || MODELS[0].id}
                  onChange={(e) => activeSession && updateSession(activeSession.id, { model: e.target.value })}
                  className="rounded-md border border-[hsl(220,15%,16%)] bg-[hsl(220,18%,10%)] px-2 py-1 text-xs text-emerald-300 outline-none focus:border-emerald-500/30"
                >
                  {MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.label} ({m.badge})</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {activeSession?.messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Sparkles size={36} className="mb-4 text-emerald-500/15" />
                <h2 className="mb-1 font-mono text-lg font-bold text-emerald-300/70">Hans AI</h2>
                <p className="mb-6 max-w-md text-xs text-[hsl(160,10%,40%)]">
                  {catInfo.description}. Select a model and start chatting.
                </p>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-4">
                {activeSession?.messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10`}>
                        <CatIcon size={13} className={catInfo.color} />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-emerald-500/15 text-emerald-100"
                        : "border border-[hsl(220,15%,16%)] bg-[hsl(220,18%,10%)] text-[hsl(160,15%,80%)]"
                    }`}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm prose-invert max-w-none prose-headings:text-emerald-300 prose-code:text-emerald-400 prose-pre:bg-black/30 prose-pre:border prose-pre:border-[hsl(220,15%,16%)] prose-a:text-emerald-400">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                      <Loader2 size={13} className="animate-spin text-emerald-400" />
                    </div>
                    <div className="rounded-xl border border-[hsl(220,15%,16%)] bg-[hsl(220,18%,10%)] px-4 py-3">
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
          <div className="border-t border-[hsl(220,15%,16%)] bg-[hsl(220,18%,8%)] p-3">
            <div className="mx-auto flex max-w-3xl gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${catInfo.label}...`}
                rows={1}
                className="flex-1 resize-none rounded-lg border border-[hsl(220,15%,16%)] bg-[hsl(220,18%,10%)] px-3 py-2.5 text-sm text-emerald-200 placeholder:text-[hsl(160,10%,30%)] focus:border-emerald-500/30 focus:outline-none"
              />
              <Button
                size="icon"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="h-10 w-10 shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Send size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Terminal overlay ────────────────────────────────────── */}
      <AnimatePresence>
        {terminalOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className={`fixed z-50 overflow-hidden rounded-xl border border-emerald-500/20 bg-[hsl(220,20%,6%)] shadow-2xl ${
              terminalMax ? "inset-3" : "bottom-6 right-6 h-[500px] w-[600px] max-w-[calc(100vw-3rem)]"
            }`}
          >
            <div className="flex items-center justify-between border-b border-emerald-500/10 bg-[hsl(220,18%,10%)] px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                </div>
                <span className="ml-2 font-mono text-[11px] text-emerald-400/60">claude@srv1402218</span>
              </div>
              <div className="flex items-center gap-1">
                <a href={TERMINAL_URL} target="_blank" rel="noopener noreferrer" className="rounded p-1 text-emerald-400/40 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors">
                  <ExternalLink size={13} />
                </a>
                <button onClick={() => setTerminalMax(!terminalMax)} className="rounded p-1 text-emerald-400/40 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors">
                  {terminalMax ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
                <button onClick={() => { setTerminalOpen(false); setTerminalMax(false); }} className="rounded p-1 text-emerald-400/40 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors">
                  <X size={13} />
                </button>
              </div>
            </div>
            <iframe src={TERMINAL_URL} className="h-[calc(100%-36px)] w-full border-0 bg-black" allow="clipboard-read; clipboard-write" title="Claude Terminal" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HansAI;
