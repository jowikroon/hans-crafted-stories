import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Zap, Wrench, Bug, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { extractWorkflowJsonFromMarkdown, createWorkflowInN8n } from "@/lib/n8n/create-workflow";

const SYSTEM_PROMPT = `You are an expert n8n workflow automation engineer and AI agent. You specialize in:
1. **Building Workflows** – Designing complete n8n workflow JSON from scratch.
2. **Fixing Workflows** – Diagnosing and correcting broken workflows.
3. **Troubleshooting** – Debugging execution errors, credential issues, API failures.

You have deep expertise in all n8n nodes, triggers, expressions, integrations, error handling, and self-hosted vs cloud differences.

When the user asks to **create**, **build**, or **generate** a workflow, you MUST output a single, valid n8n workflow as a \`\`\`json code block\`\`\` with this structure:
- \`name\`: string (workflow name, max 128 chars)
- \`nodes\`: array of nodes (each with id, type, name, position [x,y], parameters, typeVersion as needed)
- \`connections\`: object mapping node outputs to inputs (e.g. { "Node1": { "main": [[{ "node": "Node2", "type": "main", "index": 0 }]] } })

Use standard n8n node types (e.g. n8n-nodes-base.webhook, n8n-nodes-base.httpRequest). The system will create this workflow in n8n automatically from your JSON. Do not include credentials in the JSON; use placeholder text like "REPLACE_WITH_YOUR_CREDENTIAL_ID" for credential IDs.

When fixing or troubleshooting, explain the root cause clearly and format any code in markdown code blocks. Be concise but thorough. Think step by step.`;

const SUGGESTIONS = [
  { icon: Zap, text: "Build a Gmail → Slack alert workflow" },
  { icon: Wrench, text: "Fix 'Cannot read property of undefined' in Code node" },
  { icon: Bug, text: "Troubleshoot: my Schedule trigger isn't firing" },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface N8nAgentModalProps {
  open: boolean;
  onClose: () => void;
}

const N8nAgentModal = ({ open, onClose }: N8nAgentModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"build" | "fix" | "troubleshoot" | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [open]);

  const sendMessage = async (text?: string) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput("");

    const lower = userMsg.toLowerCase();
    if (!mode) {
      if (lower.match(/build|create|make|generate/)) setMode("build");
      else if (lower.match(/fix|error|broken|wrong/)) setMode("fix");
      else if (lower.match(/troubleshoot|debug|not working|failing/)) setMode("troubleshoot");
    }

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
        body: JSON.stringify({ system: SYSTEM_PROMPT, messages: newMessages }),
      });
      const data = await res.json();
      const reply = data.reply || "Sorry, I couldn't generate a response.";
      const nextMessages: Message[] = [...newMessages, { role: "assistant", content: reply }];

      // If the AI returned a workflow JSON in a code block, create it in n8n
      const workflowJson = extractWorkflowJsonFromMarkdown(reply);
      if (workflowJson && token) {
        const createResult = await createWorkflowInN8n(workflowJson, token);
        if (createResult.success && createResult.url) {
          nextMessages.push({
            role: "assistant",
            content: `✓ **Workflow created in n8n:** [${createResult.name || "Open workflow"}](${createResult.url})`,
          });
        } else if (!createResult.success && createResult.error) {
          nextMessages.push({
            role: "assistant",
            content: `Could not create workflow in n8n: ${createResult.error}`,
          });
        }
      }

      setMessages(nextMessages);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const modeConfig = {
    build: { label: "Build", color: "text-green-500", bg: "bg-green-500/10" },
    fix: { label: "Fix", color: "text-red-400", bg: "bg-red-400/10" },
    troubleshoot: { label: "Debug", color: "text-purple-400", bg: "bg-purple-400/10" },
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
            {lang && (
              <div className="rounded-t-md bg-secondary px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {lang}
              </div>
            )}
            <pre className={`overflow-x-auto rounded-b-md bg-secondary/50 p-3 font-mono text-xs leading-relaxed text-foreground ${!lang ? "rounded-t-md" : ""}`}>
              {code}
            </pre>
          </div>
        );
      } else if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={i} className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-primary">
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="agent-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="agent-panel"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-3 z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[85vh] sm:max-h-[800px] sm:w-full sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles size={16} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">n8n Workflow Agent</h3>
                  <p className="text-[10px] text-muted-foreground">Build · Fix · Troubleshoot</p>
                </div>
                {mode && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${modeConfig[mode].bg} ${modeConfig[mode].color}`}>
                    {modeConfig[mode].label}
                  </span>
                )}
              </div>
              <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Sparkles size={32} className="mb-4 text-muted-foreground/30" />
                  <h4 className="mb-1 font-display text-lg font-medium text-foreground">What can I help you build?</h4>
                  <p className="mb-6 max-w-sm text-xs text-muted-foreground">
                    I can design complete n8n workflows, fix broken ones, or debug issues.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {SUGGESTIONS.map((s, i) => {
                      const Icon = s.icon;
                      return (
                        <button
                          key={i}
                          onClick={() => sendMessage(s.text)}
                          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-left text-xs text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground"
                        >
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
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Sparkles size={12} className="text-primary" />
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-foreground text-background"
                          : "border border-border bg-secondary/30 text-foreground"
                      }`}>
                        {renderContent(msg.content)}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-2.5">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Loader2 size={12} className="animate-spin text-primary" />
                      </div>
                      <div className="rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5">
                        <div className="flex gap-1">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "0ms" }} />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "150ms" }} />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border p-3">
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe what you want to build, fix, or debug..."
                  rows={1}
                  className="flex-1 resize-none rounded-lg border border-border bg-secondary/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/30 focus:outline-none"
                />
                <Button
                  size="icon"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="h-10 w-10 shrink-0"
                >
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

export default N8nAgentModal;
