import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Sparkles, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Suggestion {
  icon: LucideIcon;
  text: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface InlineChatPanelProps {
  systemPrompt: string;
  suggestions: Suggestion[];
  title: string;
  subtitle: string;
  icon: LucideIcon;
  placeholder: string;
  accentClass: string; // e.g. "emerald" or "purple"
}

const InlineChatPanel = ({
  systemPrompt,
  suggestions,
  title,
  subtitle,
  icon: Icon,
  placeholder,
  accentClass,
}: InlineChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 200);
  }, []);

  const sendMessage = async (text?: string) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput("");

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
        body: JSON.stringify({ system: systemPrompt, messages: newMessages }),
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

  const accent = accentClass;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent === "emerald" ? "bg-emerald-500/10" : "bg-purple-500/10"}`}>
          <Icon size={14} className={accent === "emerald" ? "text-emerald-400" : "text-purple-400"} />
        </div>
        <div>
          <h3 className="text-xs font-medium text-foreground">{title}</h3>
          <p className="text-[9px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Sparkles size={24} className="mb-3 text-muted-foreground/20" />
            <p className="mb-4 max-w-xs text-[11px] text-muted-foreground">
              {subtitle}
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {suggestions.map((s, i) => {
                const SIcon = s.icon;
                return (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.text)}
                    className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground"
                  >
                    <SIcon size={10} className="shrink-0" />
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
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${accent === "emerald" ? "bg-emerald-500/10" : "bg-purple-500/10"}`}>
                    <Icon size={10} className={accent === "emerald" ? "text-emerald-400" : "text-purple-400"} />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-foreground text-background"
                    : "border border-border bg-secondary/30 text-foreground"
                }`}>
                  {renderContent(msg.content)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${accent === "emerald" ? "bg-emerald-500/10" : "bg-purple-500/10"}`}>
                  <Loader2 size={10} className={`animate-spin ${accent === "emerald" ? "text-emerald-400" : "text-purple-400"}`} />
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2">
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
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-2.5">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="flex-1 resize-none rounded-md border border-border bg-secondary/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary/30 focus:outline-none"
          />
          <Button size="icon" onClick={() => sendMessage()} disabled={!input.trim() || loading} className="h-8 w-8 shrink-0">
            <Send size={12} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InlineChatPanel;
