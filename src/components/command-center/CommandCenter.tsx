/**
 * Unified Command Center — 1 Component, 3 Modes
 * popup | inline | terminal
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Loader2, CheckCircle2, Circle, Bot, ChevronDown, History,
  Command, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCommandCenter, type CommandCenterMode, type PipelineStage } from "@/hooks/useCommandCenter";
import {
  CATEGORIES, ACTIONS, DELIVERY_OPTIONS, AI_MODELS,
} from "@/components/command-center/commandCenterData";
import ContextFilterPills from "@/components/ai/ContextFilterPills";
import { unifiedCategories } from "@/components/ai/contextCategories";
import VoiceEditForm from "@/components/hansai/VoiceEditForm";
import StandardEditForm from "@/components/hansai/StandardEditForm";

interface CommandCenterProps {
  mode: CommandCenterMode;
  onClose?: () => void;
}

const pipelineSteps: { key: PipelineStage; label: string }[] = [
  { key: "sending", label: "TRANSMIT" },
  { key: "routing", label: "INTENT" },
  { key: "processing", label: "ANALYZE" },
  { key: "generating", label: "SYNTHESIZE" },
  { key: "done", label: "COMPLETE" },
];

function renderContent(text: string) {
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const lines = part.slice(3, -3).split("\n");
      const lang = lines[0].trim();
      const code = lines.slice(1).join("\n");
      return (
        <div key={i} className="my-2">
          {lang && <div className="rounded-t-md bg-secondary px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{lang}</div>}
          <pre className={`overflow-x-auto rounded-b-md bg-secondary/50 p-3 font-mono text-xs leading-relaxed ${!lang ? "rounded-t-md" : ""}`}>{code}</pre>
        </div>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-primary">{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    return <span key={i}>{part}</span>;
  });
}

const CommandCenter = ({ mode, onClose }: CommandCenterProps) => {
  const cc = useCommandCenter(mode);
  const isTerminal = mode === "terminal";
  const modelPickerRef = useRef<HTMLDivElement>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setTimeout(() => (cc.inputRef.current as HTMLElement | null)?.focus(), 300);
  }, []);

  useEffect(() => {
    if (!isTerminal) return;
    document.title = "HansAI — Command Center";
    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robots) { robots = document.createElement("meta"); robots.name = "robots"; document.head.appendChild(robots); }
    robots.content = "noindex, nofollow";
    return () => { if (robots) robots.content = "index, follow"; };
  }, [isTerminal]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) setShowModelPicker(false); };
    if (showModelPicker) { document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }
  }, [showModelPicker]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); cc.processInput(cc.input); }
  };

  const currentModel = AI_MODELS.find(m => m.id === cc.selectedModel) || AI_MODELS[0];

  return (
    <div
      className={isTerminal ? "flex flex-col min-h-screen" : "flex h-full flex-col"}
      style={isTerminal ? { fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace", fontSize: 12, background: "#07070B", color: "#A0A4AA" } : undefined}
    >
      {/* Pipeline bar */}
      {cc.pipelineStage !== "idle" && (
        <div className={`relative flex items-center gap-1.5 px-4 py-2 font-mono overflow-hidden ${isTerminal ? "" : "border-b border-orange-500/20"}`}
          style={isTerminal ? { borderBottom: "1px solid #12121E", background: "#0C0C14" } : undefined}>
          {pipelineSteps.map((step, i) => {
            const isActive = step.key === cc.pipelineStage;
            const isDone = pipelineSteps.findIndex(s => s.key === cc.pipelineStage) > i;
            return (
              <div key={step.key} className="flex items-center gap-1.5">
                <div className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest transition-all ${
                  isActive ? (isTerminal ? "text-emerald-400 animate-pulse" : "bg-orange-500/20 text-orange-400 animate-pulse")
                  : isDone ? (isTerminal ? "text-emerald-300" : "bg-orange-500/10 text-orange-300")
                  : "text-muted-foreground/30"
                }`}>
                  {isActive ? <Loader2 size={8} className="animate-spin" /> : isDone ? <CheckCircle2 size={8} /> : <Circle size={8} />}
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
                {i < pipelineSteps.length - 1 && <span className="font-mono text-[8px] tracking-[3px] text-muted-foreground/20">···</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Header */}
      <div className={`flex items-center justify-between gap-3 px-4 py-2 ${isTerminal ? "" : "border-b border-border"}`}
        style={isTerminal ? { background: "linear-gradient(180deg, #0C0C14 0%, #09090F 100%)", borderBottom: "1px solid #12121E" } : undefined}>
        <div className="flex items-center gap-2.5">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${isTerminal ? "" : "bg-orange-500/10"}`}
            style={isTerminal ? { background: "rgba(16,185,129,0.1)" } : undefined}>
            <Command size={14} className={isTerminal ? "text-emerald-400" : "text-orange-400"} />
          </div>
          <div>
            <h3 className="text-xs font-semibold" style={isTerminal ? { color: "#E8E8F0" } : undefined}>Command Center</h3>
            <p className="text-[9px] text-muted-foreground">Intent · Workflows · AI</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="relative" ref={modelPickerRef}>
            <button onClick={() => setShowModelPicker(!showModelPicker)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-medium transition-all ${isTerminal ? "" : "border-border bg-secondary/30 text-foreground hover:border-primary/40"}`}
              style={isTerminal ? { border: "1px solid #1A1A28", background: "#0C0C14", color: "#A0A4AA" } : undefined}>
              <Bot size={12} className={isTerminal ? "text-emerald-400/80" : "text-orange-400/80"} />
              <span>{currentModel.label}</span>
              <ChevronDown size={10} className={`transition-transform ${showModelPicker ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showModelPicker && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className={`absolute right-0 top-full z-[200] mt-1.5 w-52 rounded-xl border p-1.5 shadow-xl ${isTerminal ? "" : "border-border bg-card"}`}
                  style={isTerminal ? { border: "1px solid #1A1A28", background: "#0C0C14" } : undefined}>
                  {AI_MODELS.map(m => (
                    <button key={m.id} onClick={() => { cc.setSelectedModel(m.id); setShowModelPicker(false); }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[11px] transition-all ${
                        cc.selectedModel === m.id ? (isTerminal ? "text-emerald-400" : "bg-orange-500/15 text-orange-400") : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}>
                      <span>{m.label}</span>
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[8px] font-bold">{m.tag}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => setShowHistory(!showHistory)}
            className={`rounded-lg p-1.5 transition-all ${showHistory ? (isTerminal ? "text-emerald-400" : "bg-orange-500/10 text-orange-400") : "text-muted-foreground/40 hover:text-foreground"}`}>
            <History size={12} />
          </button>
          {mode === "popup" && onClose && (
            <>
              <a href="/hansai" className="rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground/50 transition-colors hover:bg-secondary hover:text-foreground">Full Terminal →</a>
              <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground/40 hover:bg-secondary hover:text-foreground"><X size={14} /></button>
            </>
          )}
        </div>
      </div>

      {/* V3 Category tabs */}
      <nav className={`flex gap-0.5 overflow-x-auto px-4 py-1 ${isTerminal ? "" : "border-b border-border bg-secondary/20"}`}
        style={isTerminal ? { background: "#08080E", borderBottom: cc.activeCat ? "none" : "1px solid #12121E", scrollbarWidth: "none" } : { scrollbarWidth: "none" }}>
        {Object.entries(CATEGORIES).map(([key, v]) => {
          const active = cc.activeCat === key;
          return (
            <button key={key} onClick={() => {
              if (cc.phase === "delivery" || cc.phase === "exec") return;
              cc.setActiveCat(active ? null : key);
              cc.setPickedAction(null);
              cc.setPhase("browse");
            }}
              className="whitespace-nowrap rounded-t-md px-2.5 py-1.5 text-[10px] font-medium transition-all"
              style={{
                color: active ? v.color : isTerminal ? "#3A3A4A" : undefined,
                borderBottom: active ? `2px solid ${v.color}` : "2px solid transparent",
                background: active ? `${v.color}12` : undefined,
                fontWeight: active ? 600 : 400,
                opacity: (cc.phase === "delivery" || cc.phase === "exec") && !active ? 0.3 : 1,
              }}
              onMouseEnter={(e) => { if (!active) (e.target as HTMLElement).style.color = v.color; }}
              onMouseLeave={(e) => { if (!active) (e.target as HTMLElement).style.color = isTerminal ? "#3A3A4A" : ""; }}
            >
              {v.icon} {v.label}
            </button>
          );
        })}
      </nav>

      {/* Context filter pills (popup/inline) */}
      {!isTerminal && (
        <ContextFilterPills categories={unifiedCategories} selectedCategory={cc.selectedCategory} selectedSub={cc.selectedSub}
          onSelect={(catId, subId) => { cc.setSelectedCategory(catId); cc.setSelectedSub(subId); }} accentColor="orange" />
      )}

      {/* Main content area */}
      <div ref={cc.scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
        {/* History panel */}
        <AnimatePresence>
          {showHistory && cc.chatHistory.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className={`mb-3 overflow-hidden rounded-lg border p-2 ${isTerminal ? "" : "border-border bg-card"}`}
              style={isTerminal ? { border: "1px solid #1A1A28", background: "#0C0C14" } : undefined}>
              <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">History</p>
              {cc.chatHistory.slice(0, 8).map((h, i) => (
                <button key={i} onClick={() => { cc.setMessages(h.messages); setShowHistory(false); }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground">
                  <span className="truncate">{h.preview}</span>
                  <span className="shrink-0 text-[9px] text-muted-foreground/40">{new Date(h.timestamp).toLocaleDateString()}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* V3 Action drawer */}
        <AnimatePresence>
          {cc.activeCat && ACTIONS[cc.activeCat] && cc.phase === "browse" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className={`mb-3 overflow-hidden rounded-lg border p-3 ${isTerminal ? "" : "border-border bg-card"}`}
              style={isTerminal ? { border: "1px solid #1A1A28", background: "#0C0C14" } : undefined}>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {ACTIONS[cc.activeCat].hero.map((a) => (
                  <button key={a.id} onClick={() => cc.pickAction(a)}
                    className={`rounded-lg border p-3 text-left transition-all hover:scale-[1.01] ${isTerminal ? "" : "border-border hover:border-orange-500/40 bg-secondary/30"}`}
                    style={isTerminal ? { border: "1px solid #1A1A28", background: "#09090F" } : undefined}>
                    <p className="text-xs font-semibold" style={isTerminal ? { color: "#E8E8F0" } : undefined}>{a.label}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground line-clamp-2">{a.sub}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {a.tools.map(t => <span key={t} className="rounded bg-secondary px-1.5 py-0.5 text-[8px] text-muted-foreground">{t}</span>)}
                    </div>
                  </button>
                ))}
              </div>
              {ACTIONS[cc.activeCat].compact.map((a) => (
                <button key={a.id} onClick={() => cc.pickAction(a)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[11px] text-muted-foreground transition-all hover:bg-secondary hover:text-foreground">
                  <span className="font-medium">{a.label}</span>
                  <span className="truncate text-[10px] opacity-50">{a.sub}</span>
                </button>
              ))}
              {ACTIONS[cc.activeCat].history.length > 0 && (
                <>
                  <div className={`my-2 flex items-center gap-2 ${isTerminal ? "text-emerald-500/30" : "text-orange-500/30"}`}>
                    <div className="h-px flex-1 bg-current" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Last Run — Verified</span>
                    <div className="h-px flex-1 bg-current" />
                  </div>
                  {ACTIONS[cc.activeCat].history.map((h, i) => (
                    <button key={i} onClick={() => cc.rerunHistory(h)}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-left text-[10px] text-muted-foreground/50 transition-all hover:text-foreground">
                      <span className="truncate">{h.cmd}</span>
                      <span className="shrink-0 text-[9px]">{h.ago}</span>
                    </button>
                  ))}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delivery picker */}
        <AnimatePresence>
          {cc.phase === "delivery" && cc.pickedAction && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className={`mb-3 rounded-lg border p-3 ${isTerminal ? "" : "border-border bg-card"}`}
              style={isTerminal ? { border: "1px solid #1A1A28", background: "#0C0C14" } : undefined}>
              <p className={`mb-2 text-[10px] font-bold uppercase tracking-wider ${isTerminal ? "text-emerald-400/60" : "text-orange-400/60"}`}>
                Deliver: {cc.pickedAction.label}
              </p>
              <div className="space-y-1.5">
                {(DELIVERY_OPTIONS[cc.pickedAction.deliveryType] || DELIVERY_OPTIONS.data).map((d, i) => (
                  <button key={i} onClick={() => cc.pickDelivery(d)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                      d.best ? (isTerminal ? "border-emerald-500/30" : "border-orange-500/30 bg-orange-500/5") : "border-border"
                    } hover:border-primary/40`}>
                    <span className="text-lg">{d.icon}</span>
                    <div>
                      <p className="text-xs font-medium">{d.label}</p>
                      <p className="text-[10px] text-muted-foreground">{d.note}</p>
                    </div>
                    {d.best && <span className={`ml-auto rounded px-1.5 py-0.5 text-[8px] font-bold ${isTerminal ? "bg-emerald-500/20 text-emerald-400" : "bg-orange-500/20 text-orange-400"}`}>BEST</span>}
                  </button>
                ))}
              </div>
              <button onClick={() => { cc.setPhase("browse"); cc.setPickedAction(null); }}
                className="mt-2 text-[10px] text-muted-foreground hover:text-foreground">← Back</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exec spinner */}
        {cc.phase === "exec" && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-border p-4">
            <Loader2 size={14} className={`animate-spin ${isTerminal ? "text-emerald-400" : "text-orange-400"}`} />
            <span className="text-xs text-muted-foreground">Executing…</span>
          </div>
        )}

        {/* Messages */}
        {cc.messages.map((msg, i) => (
          <div key={i} className={`mb-2 ${msg.role === "user" ? "flex justify-end" : ""}`}>
            <div className={`rounded-lg px-3 py-2 text-xs leading-relaxed max-w-[85%] ${
              msg.role === "user" ? (isTerminal ? "bg-emerald-500/10 text-emerald-200" : "bg-primary/10 text-foreground")
              : msg.role === "error" ? "bg-destructive/10 text-destructive"
              : msg.role === "workflow" ? (isTerminal ? "bg-emerald-500/5 text-emerald-300" : "bg-orange-500/5 text-orange-300")
              : msg.role === "system" ? "text-muted-foreground"
              : "text-foreground"
            }`}>
              {renderContent(msg.content)}
            </div>
          </div>
        ))}

        {/* Clarification */}
        {cc.pendingClarification && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {cc.pendingClarification.workflows.map(wf => (
              <Button key={wf.name} variant="outline" size="sm" className="text-[10px]" onClick={() => cc.handleClarificationSelect(wf)}>{wf.label}</Button>
            ))}
            <Button variant="ghost" size="sm" className="text-[10px]" onClick={cc.handleClarificationDismiss}>Something else</Button>
          </div>
        )}

        {cc.loading && cc.pipelineStage === "idle" && (
          <div className="mb-2 flex items-center gap-2">
            <Loader2 size={12} className={`animate-spin ${isTerminal ? "text-emerald-400" : "text-orange-400"}`} />
            <span className="text-[10px] text-muted-foreground">Thinking…</span>
          </div>
        )}

        {/* Voice forms */}
        {cc.showForm === "voice_edit" && cc.voiceEditName && (
          <VoiceEditForm personaName={cc.voiceEditName}
            onSave={(name) => { cc.appendMessage({ role: "system", content: `Voice "${name}" saved.` }); cc.setShowForm(null); cc.setVoiceEditName(null); }}
            onCancel={() => { cc.setShowForm(null); cc.setVoiceEditName(null); }} />
        )}
        {cc.showForm === "voice_standard_edit" && cc.voiceStandardEditName && (
          <StandardEditForm personaName={cc.voiceStandardEditName}
            onSave={(name) => { cc.appendMessage({ role: "system", content: `Standard for "${name}" saved.` }); cc.setShowForm(null); cc.setVoiceStandardEditName(null); }}
            onCancel={() => { cc.setShowForm(null); cc.setVoiceStandardEditName(null); }} />
        )}
      </div>

      {/* Input bar */}
      <div className="shrink-0 px-4 pb-3 pt-2" style={isTerminal ? { background: "#07070B" } : undefined}>
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          {isTerminal && <span className="text-[10px] font-mono" style={{ color: "rgba(16,185,129,0.6)" }}>$</span>}
          <input
            ref={cc.inputRef as React.RefObject<HTMLInputElement>}
            value={cc.input}
            onChange={(e) => cc.setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isTerminal ? "Type a command or ask anything…" : "Ask anything or type / for commands…"}
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/40"
            style={isTerminal ? { color: "#A0A4AA" } : undefined}
            disabled={cc.loading}
          />
          <button onClick={() => cc.processInput(cc.input)} disabled={cc.loading || !cc.input.trim()}
            className={`rounded-lg p-2 transition-all ${cc.input.trim() ? (isTerminal ? "text-emerald-400" : "bg-primary/20 text-primary hover:bg-primary/30") : "text-muted-foreground/20"}`}>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
