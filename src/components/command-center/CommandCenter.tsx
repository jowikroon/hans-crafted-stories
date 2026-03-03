/**
 * Unified Command Center — 1 Component, 3 Modes
 * popup | inline | terminal
 */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Loader2, CheckCircle2, Circle, Bot, ChevronDown, History,
  Command, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCommandCenter, type CommandCenterMode, type PipelineStage } from "@/hooks/useCommandCenter";
import {
  CATEGORIES, ACTIONS, DELIVERY_OPTIONS, AI_MODELS, CATEGORY_SUBS,
} from "@/components/command-center/commandCenterData";
import ContextFilterPills from "@/components/ai/ContextFilterPills";
import { unifiedCategories } from "@/components/ai/contextCategories";
import VoiceEditForm from "@/components/hansai/VoiceEditForm";
import StandardEditForm from "@/components/hansai/StandardEditForm";
import AutoSuggestInput from "@/components/command-center/AutoSuggestInput";
import { hansAICommands } from "@/components/ai/commandSuggestions";

const SLASH_CMD_POOL = ["/help", "/jarvis", "/idea", "/task", "/tasks", "/run", "/workflows", "/clear", "/ai", "/campaign", "/prompt", "/autofull"];

interface CommandCenterProps {
  mode: CommandCenterMode;
  onClose?: () => void;
  onAutoFullChange?: (active: boolean) => void;
}

const pipelineSteps: { key: PipelineStage; label: string; detail: string }[] = [
  { key: "sending", label: "TRANSMIT", detail: "Packaging request…" },
  { key: "routing", label: "INTENT", detail: "Classifying intent & matching workflows…" },
  { key: "processing", label: "ANALYZE", detail: "Running matched workflow or agent…" },
  { key: "generating", label: "SYNTHESIZE", detail: "AI generating response…" },
  { key: "done", label: "COMPLETE", detail: "Ready" },
];

// ── Neo-green color set for /autofull mode ───────────────────
const neoGreen = {
  primary: "#00FF41",
  bg10: "rgba(0,255,65,0.1)",
  bg20: "rgba(0,255,65,0.2)",
  bg5: "rgba(0,255,65,0.05)",
  border: "rgba(0,255,65,0.3)",
  dim: "rgba(0,255,65,0.6)",
};

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

const CommandCenter = ({ mode, onClose, onAutoFullChange }: CommandCenterProps) => {
  const cc = useCommandCenter(mode);
  const isTerminal = mode === "terminal";
  const isAutoFull = cc.autoFullMode && isTerminal;
  const isPopupAutoFull = cc.autoFullMode && mode === "popup";

  useEffect(() => {
    onAutoFullChange?.(cc.autoFullMode);
  }, [cc.autoFullMode, onAutoFullChange]);
  const modelPickerRef = useRef<HTMLDivElement>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAllPrompts, setShowAllPrompts] = useState(false);

  // Reset prompt limit when category or sub-item changes
  useEffect(() => setShowAllPrompts(false), [cc.selectedSubItem, cc.activeCat]);

  // ── Auto-suggest pool ──────────────────────────────────────
  const terminalSuggestions = useMemo(() => {
    const pool = [...SLASH_CMD_POOL];
    // Add prompts from active sub-item
    if (cc.selectedSubItem && hansAICommands[cc.selectedSubItem]) {
      pool.push(...hansAICommands[cc.selectedSubItem].map((c) => c.text));
    }
    // Add active category sub prompts from CATEGORY_SUBS
    if (cc.activeCat && CATEGORY_SUBS[cc.activeCat]) {
      CATEGORY_SUBS[cc.activeCat].forEach((sub) => pool.push(...sub.prompts));
    }
    // Add recent user messages
    const recent = cc.messages.filter((m) => m.role === "user").slice(-10).map((m) => m.content);
    pool.push(...recent);
    return [...new Set(pool)];
  }, [cc.selectedSubItem, cc.activeCat, cc.messages]);

  // ── Elapsed timer for pipeline ──────────────────────────────
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (cc.pipelineStage === "idle") { setElapsed(0); return; }
    const start = cc.pipelineStartTime || Date.now();
    const interval = setInterval(() => setElapsed(((Date.now() - start) / 1000)), 100);
    return () => clearInterval(interval);
  }, [cc.pipelineStage, cc.pipelineStartTime]);

  // ── Color helpers for autoFull ──────────────────────────────
  const accent = isAutoFull ? neoGreen.primary : isTerminal ? "#10B981" : undefined;
  const accentDim = isAutoFull ? neoGreen.dim : isTerminal ? "rgba(16,185,129,0.6)" : undefined;
  const accentBg10 = isAutoFull ? neoGreen.bg10 : isTerminal ? "rgba(16,185,129,0.1)" : undefined;
  const accentBg5 = isAutoFull ? neoGreen.bg5 : isTerminal ? "rgba(16,185,129,0.05)" : undefined;

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
      className={isTerminal ? "flex flex-col min-h-screen relative" : "flex h-full flex-col"}
      style={isTerminal ? { fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace", fontSize: 12, background: isAutoFull ? "#050A05" : "#07070B", color: isAutoFull ? neoGreen.dim : "#A0A4AA" } : undefined}
    >
      {/* CRT scanline overlay for autofull */}
      {isAutoFull && (
        <div className="pointer-events-none absolute inset-0 z-[50]" style={{
          background: "repeating-linear-gradient(0deg, rgba(0,255,65,0.03) 0px, rgba(0,255,65,0.03) 1px, transparent 1px, transparent 3px)",
          mixBlendMode: "overlay",
        }} />
      )}

      {/* Pipeline bar — enlarged with segmented progress */}
      {cc.pipelineStage !== "idle" && (() => {
        const activeIdx = pipelineSteps.findIndex(s => s.key === cc.pipelineStage);
        const pipeAccent = isAutoFull ? neoGreen.primary : isTerminal ? "#34D399" : "#f97316";
        const pipeAccentDim = isAutoFull ? neoGreen.dim : isTerminal ? "rgba(52,211,153,0.5)" : "rgba(249,115,22,0.5)";
        return (
          <div className={`relative flex flex-col gap-1.5 px-4 py-3.5 font-mono overflow-hidden ${isTerminal ? "" : "border-b border-orange-500/20"}`}
            style={{
              minHeight: 56,
              ...(isTerminal ? { borderBottom: `1px solid ${isAutoFull ? neoGreen.border : "#12121E"}`, background: isAutoFull ? "#0A0F0A" : "#0C0C14" } : {}),
            }}>
            {/* Pulsing gradient bottom edge */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, transparent, ${pipeAccent}, transparent)` }}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="flex items-center gap-2">
              {pipelineSteps.map((step, i) => {
                const isActive = step.key === cc.pipelineStage;
                const isDone = activeIdx > i;
                return (
                  <div key={step.key} className="flex items-center gap-2">
                    <motion.div
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest transition-all ${
                        isActive ? (isTerminal ? "" : "bg-orange-500/20 text-orange-400")
                        : isDone ? (isTerminal ? "" : "bg-orange-500/10 text-orange-300")
                        : "text-muted-foreground/30"
                      }`}
                      animate={isActive ? { scale: [1, 1.08, 1] } : isDone ? { scale: 1 } : {}}
                      transition={isActive ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
                      style={{
                        color: isActive ? pipeAccent : isDone ? pipeAccentDim : undefined,
                        ...(isActive ? { boxShadow: `0 0 12px ${pipeAccent}40` } : {}),
                      }}
                    >
                      {isActive ? <Loader2 size={11} className="animate-spin" /> : isDone ? (
                        <motion.span initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
                          <CheckCircle2 size={11} />
                        </motion.span>
                      ) : <Circle size={11} />}
                      <span className="hidden sm:inline">{step.label}</span>
                    </motion.div>
                    {i < pipelineSteps.length - 1 && <span className="font-mono text-[9px] tracking-[3px] text-muted-foreground/20">···</span>}
                  </div>
                );
              })}
              {/* Timer */}
              <span className="ml-auto text-[11px] font-mono tabular-nums" style={{ color: pipeAccentDim }}>
                {elapsed.toFixed(1)}s
              </span>
            </div>
            {/* Detail text */}
            {pipelineSteps.map(step => step.key === cc.pipelineStage && (
              <p key={step.key} className="text-[10px] tracking-wide" style={{ color: pipeAccentDim }}>
                {step.detail}
              </p>
            ))}
            {/* Segmented progress bar */}
            <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden" style={{ background: `${pipeAccent}10` }}>
              {pipelineSteps.map((step, i) => {
                const isDone = activeIdx > i;
                const isActive = activeIdx === i;
                return (
                  <motion.div
                    key={step.key}
                    className="flex-1 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{
                      scaleX: isDone ? 1 : isActive ? 0.6 : 0,
                      opacity: isDone || isActive ? 1 : 0.15,
                    }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    style={{
                      background: isDone ? pipeAccent : isActive ? `${pipeAccent}90` : `${pipeAccent}20`,
                      transformOrigin: "left",
                      ...(isActive ? { boxShadow: `0 0 8px ${pipeAccent}60` } : {}),
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Header */}
      <div className={`flex items-center justify-between gap-3 px-4 py-2 ${isTerminal ? "" : "border-b border-border"}`}
        style={isTerminal ? { background: isAutoFull ? "linear-gradient(180deg, #0A0F0A 0%, #070B07 100%)" : "linear-gradient(180deg, #0C0C14 0%, #09090F 100%)", borderBottom: `1px solid ${isAutoFull ? neoGreen.border : "#12121E"}` } : undefined}>
        <div className="flex items-center gap-2.5">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${isTerminal ? "" : "bg-orange-500/10"}`}
            style={isTerminal ? { background: accentBg10 } : undefined}>
            <Command size={14} style={isTerminal ? { color: accent } : undefined} className={isTerminal ? "" : "text-orange-400"} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold" style={isTerminal ? { color: isAutoFull ? neoGreen.primary : "#E8E8F0" } : undefined}>Command Center</h3>
              {isAutoFull && (
                <span className="animate-pulse rounded px-1.5 py-0.5 text-[8px] font-black tracking-widest"
                  style={{ background: neoGreen.bg20, color: neoGreen.primary, border: `1px solid ${neoGreen.border}` }}>
                  AUTOFULL
                </span>
              )}
            </div>
            <p className="text-[9px] text-muted-foreground">Intent · Workflows · AI</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Context filter dropdown */}
          {!isTerminal && (
            <ContextFilterPills categories={unifiedCategories} selectedCategory={cc.selectedCategory} selectedSub={cc.selectedSub}
              onSelect={(catId, subId) => { cc.setSelectedCategory(catId); cc.setSelectedSub(subId); }} accentColor="orange" />
          )}
          <div className="relative" ref={modelPickerRef}>
            <button onClick={() => setShowModelPicker(!showModelPicker)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-medium transition-all ${isTerminal ? "" : "border-border bg-secondary/30 text-foreground hover:border-primary/40"}`}
              style={isTerminal ? { border: `1px solid ${isAutoFull ? neoGreen.border : "#1A1A28"}`, background: isAutoFull ? "#0A0F0A" : "#0C0C14", color: isAutoFull ? neoGreen.dim : "#A0A4AA" } : undefined}>
              <Bot size={12} style={isTerminal ? { color: isAutoFull ? neoGreen.primary : "rgba(16,185,129,0.8)" } : undefined} className={isTerminal ? "" : "text-orange-400/80"} />
              <span>{currentModel.label}</span>
              <ChevronDown size={10} className={`transition-transform ${showModelPicker ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showModelPicker && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className={`absolute right-0 top-full z-[200] mt-1.5 w-56 max-h-80 overflow-y-auto rounded-xl border p-1.5 shadow-xl ${isTerminal ? "" : "border-border bg-card"}`}
                  style={isTerminal ? { border: `1px solid ${isAutoFull ? neoGreen.border : "#1A1A28"}`, background: isAutoFull ? "#0A0F0A" : "#0C0C14" } : undefined}>
                  {(["gemini", "openai", "image", "ollama"] as const).map(group => {
                    const groupModels = AI_MODELS.filter(m => m.group === group);
                    const groupLabel = group === "gemini" ? "GOOGLE GEMINI" : group === "openai" ? "OPENAI" : group === "image" ? "IMAGE GEN" : "LOCAL / VPS";
                    return (
                      <div key={group}>
                        <p className="px-2.5 pt-2 pb-1 text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">{groupLabel}</p>
                        {groupModels.map(m => (
                          <button key={m.id} onClick={() => { cc.setSelectedModel(m.id); setShowModelPicker(false); }}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[11px] transition-all ${
                              cc.selectedModel === m.id
                                ? (isAutoFull ? "" : isTerminal ? "text-emerald-400" : "bg-orange-500/15 text-orange-400")
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                            style={cc.selectedModel === m.id && isAutoFull ? { color: neoGreen.primary, background: neoGreen.bg10 } : undefined}
                          >
                            <span>{m.label}</span>
                            {group === "image"
                              ? <span className="text-[10px]">📷</span>
                              : group === "ollama"
                              ? <span className="text-[10px]">🖥️</span>
                              : <span className="rounded bg-secondary px-1.5 py-0.5 text-[8px] font-bold">{m.tag}</span>
                            }
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => setShowHistory(!showHistory)}
            className={`rounded-lg p-1.5 transition-all ${showHistory ? (isAutoFull ? "" : isTerminal ? "text-emerald-400" : "bg-orange-500/10 text-orange-400") : "text-muted-foreground/40 hover:text-foreground"}`}
            style={showHistory && isAutoFull ? { color: neoGreen.primary } : undefined}>
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
        style={isTerminal ? { background: isAutoFull ? "#060A06" : "#08080E", borderBottom: cc.activeCat ? "none" : `1px solid ${isAutoFull ? neoGreen.border : "#12121E"}`, scrollbarWidth: "none" } : { scrollbarWidth: "none" }}>
        {Object.entries(CATEGORIES).map(([key, v]) => {
          const active = cc.activeCat === key;
          const tabColor = isAutoFull ? neoGreen.primary : v.color;
          return (
            <button key={key} onClick={() => {
              if (cc.phase === "delivery" || cc.phase === "exec") return;
              cc.setActiveCat(active ? null : key);
              cc.setPickedAction(null);
              cc.setPhase("browse");
            }}
              className="whitespace-nowrap rounded-t-md px-2.5 py-1.5 text-[10px] font-medium transition-all"
              style={{
                color: active ? tabColor : isTerminal ? (isAutoFull ? "rgba(0,255,65,0.25)" : "#3A3A4A") : undefined,
                borderBottom: active ? `2px solid ${tabColor}` : "2px solid transparent",
                background: active ? `${tabColor}12` : undefined,
                fontWeight: active ? 600 : 400,
                opacity: (cc.phase === "delivery" || cc.phase === "exec") && !active ? 0.3 : 1,
              }}
              onMouseEnter={(e) => { if (!active) (e.target as HTMLElement).style.color = tabColor; }}
              onMouseLeave={(e) => { if (!active) (e.target as HTMLElement).style.color = isTerminal ? (isAutoFull ? "rgba(0,255,65,0.25)" : "#3A3A4A") : ""; }}
            >
              {v.icon} {v.label}
            </button>
          );
        })}
      </nav>

      {/* Sub-menu pills + prompt chips per category (BJ Fogg: staggered, 3-max) */}
      {cc.activeCat && CATEGORY_SUBS[cc.activeCat] && cc.phase === "browse" && (() => {
        const subs = CATEGORY_SUBS[cc.activeCat!];
        const catColor = isAutoFull ? neoGreen.primary : CATEGORIES[cc.activeCat!]?.color || "#ff6600";
        const activeSub = cc.selectedSubItem ? subs.find(s => s.id === cc.selectedSubItem) : null;
        const allPrompts = activeSub
          ? activeSub.prompts
          : subs.flatMap(s => s.prompts).slice(0, 6);

        const pillContainer = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
        const pillItem = { hidden: { opacity: 0, x: -6 }, show: { opacity: 1, x: 0, transition: { duration: 0.2 } } };
        const chipContainer = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
        const chipItem = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

        return (
          <div
            className={`px-4 py-2 ${isTerminal ? "" : "border-b border-border bg-secondary/10"}`}
            style={isTerminal ? { background: isAutoFull ? "#060A06" : "#08080E", borderBottom: `1px solid ${isAutoFull ? neoGreen.border : "#12121E"}` } : undefined}
          >
            {/* Sub-item pills — staggered entrance */}
            <motion.div
              className="flex gap-1.5 overflow-x-auto pb-1.5"
              style={{ scrollbarWidth: "none" }}
              variants={pillContainer}
              initial="hidden"
              animate="show"
              key={cc.activeCat}
            >
              {subs.map(sub => {
                const isActive = cc.selectedSubItem === sub.id;
                return (
                  <motion.button
                    key={sub.id}
                    variants={pillItem}
                    onClick={() => cc.setSelectedSubItem(isActive ? null : sub.id)}
                    className="whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-medium transition-all flex items-center gap-1.5"
                    style={{
                      background: isActive ? `${catColor}20` : "transparent",
                      color: isActive ? catColor : isTerminal ? (isAutoFull ? "rgba(0,255,65,0.4)" : "#555") : undefined,
                      border: `1px solid ${isActive ? `${catColor}50` : isTerminal ? (isAutoFull ? "rgba(0,255,65,0.15)" : "#1A1A28") : "transparent"}`,
                    }}
                    onMouseEnter={(e) => { if (!isActive) (e.target as HTMLElement).style.color = catColor; }}
                    onMouseLeave={(e) => { if (!isActive) (e.target as HTMLElement).style.color = isTerminal ? (isAutoFull ? "rgba(0,255,65,0.4)" : "#555") : ""; }}
                  >
                    {isActive && <span className="h-1.5 w-1.5 rounded-full" style={{ background: catColor }} />}
                    {sub.label}
                  </motion.button>
                );
              })}
              {!cc.selectedSubItem && (
                <motion.span variants={pillItem} className="self-center text-[9px] italic text-muted-foreground/40 pl-1">
                  Pick a focus ↑
                </motion.span>
              )}
            </motion.div>
            {/* Prompt chips — staggered typewriter reveal, 3-max default */}
            <AnimatePresence mode="wait">
              <motion.div
                className="flex flex-wrap gap-1.5 pt-1"
                variants={chipContainer}
                initial="hidden"
                animate="show"
                exit="hidden"
                key={`${cc.activeCat}-${cc.selectedSubItem || "all"}`}
              >
                {allPrompts.slice(0, showAllPrompts ? allPrompts.length : 3).map((prompt, i) => (
                  <motion.button
                    key={prompt}
                    variants={chipItem}
                    onClick={() => cc.processInput(prompt)}
                    className="rounded-full px-2.5 py-1 text-[10px] transition-all hover:scale-[1.03]"
                    style={{
                      background: isTerminal ? (isAutoFull ? "rgba(0,255,65,0.06)" : "rgba(255,255,255,0.03)") : undefined,
                      border: `1px solid ${isTerminal ? (isAutoFull ? "rgba(0,255,65,0.15)" : "#1A1A28") : "hsl(var(--border))"}`,
                      color: isTerminal ? (isAutoFull ? "rgba(0,255,65,0.5)" : "#777") : undefined,
                    }}
                    whileHover={{ borderColor: `${catColor}60`, color: catColor }}
                  >
                    {prompt}
                  </motion.button>
                ))}
                {allPrompts.length > 3 && !showAllPrompts && (
                  <motion.button
                    variants={chipItem}
                    onClick={() => setShowAllPrompts(true)}
                    className="rounded-full px-2.5 py-1 text-[9px] font-medium transition-all"
                    style={{
                      color: `${catColor}90`,
                      border: `1px dashed ${catColor}30`,
                    }}
                    whileHover={{ borderColor: `${catColor}60` }}
                  >
                    +{allPrompts.length - 3} more
                  </motion.button>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        );
      })()}


      {/* Main content area */}
      <div ref={cc.scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
        {/* History panel */}
        <AnimatePresence>
          {showHistory && cc.chatHistory.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className={`mb-3 overflow-hidden rounded-lg border p-2 ${isTerminal ? "" : "border-border bg-card"}`}
              style={isTerminal ? { border: `1px solid ${isAutoFull ? neoGreen.border : "#1A1A28"}`, background: isAutoFull ? "#0A0F0A" : "#0C0C14" } : undefined}>
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
              style={isTerminal ? { border: `1px solid ${isAutoFull ? neoGreen.border : "#1A1A28"}`, background: isAutoFull ? "#0A0F0A" : "#0C0C14" } : undefined}>
              {[...ACTIONS[cc.activeCat].hero, ...ACTIONS[cc.activeCat].compact].slice(0, 5).map((a) => (
                <motion.button key={a.id} onClick={() => cc.pickAction(a)}
                  whileTap={{ scale: 0.97, backgroundColor: isTerminal ? (isAutoFull ? "rgba(0,255,65,0.12)" : "rgba(16,185,129,0.12)") : "rgba(249,115,22,0.12)" }}
                  transition={{ duration: 0.15 }}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[11px] text-muted-foreground transition-all hover:bg-secondary hover:text-foreground">
                  <span className="font-medium" style={isTerminal ? { color: isAutoFull ? neoGreen.primary : "#E8E8F0" } : undefined}>{a.label}</span>
                  <span className="truncate text-[10px] opacity-50">{a.sub}</span>
                </motion.button>
              ))}
              {ACTIONS[cc.activeCat].history.length > 0 && (
                <>
                  <div className="my-2 flex items-center gap-2" style={{ color: isAutoFull ? neoGreen.border : undefined }}>
                    <div className={`h-px flex-1 bg-current ${isAutoFull ? "" : isTerminal ? "text-emerald-500/30" : "text-orange-500/30"}`} />
                    <span className={`text-[8px] font-bold uppercase tracking-widest ${isAutoFull ? "" : isTerminal ? "text-emerald-500/30" : "text-orange-500/30"}`}>Last Run — Verified</span>
                    <div className={`h-px flex-1 bg-current ${isAutoFull ? "" : isTerminal ? "text-emerald-500/30" : "text-orange-500/30"}`} />
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
              style={isTerminal ? { border: `1px solid ${isAutoFull ? neoGreen.border : "#1A1A28"}`, background: isAutoFull ? "#0A0F0A" : "#0C0C14" } : undefined}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: isAutoFull ? neoGreen.dim : isTerminal ? "rgba(16,185,129,0.6)" : "rgba(249,115,22,0.6)" }}>
                Deliver: {cc.pickedAction.label}
              </p>
              <div className="space-y-1.5">
                {(DELIVERY_OPTIONS[cc.pickedAction.deliveryType] || DELIVERY_OPTIONS.data).map((d, i) => (
                  <button key={i} onClick={() => cc.pickDelivery(d)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                      d.best ? (isAutoFull ? "" : isTerminal ? "border-emerald-500/30" : "border-orange-500/30 bg-orange-500/5") : "border-border"
                    } hover:border-primary/40`}
                    style={d.best && isAutoFull ? { borderColor: neoGreen.border, background: neoGreen.bg5 } : undefined}>
                    <span className="text-lg">{d.icon}</span>
                    <div>
                      <p className="text-xs font-medium">{d.label}</p>
                      <p className="text-[10px] text-muted-foreground">{d.note}</p>
                    </div>
                    {d.best && <span
                      className={`ml-auto rounded px-1.5 py-0.5 text-[8px] font-bold ${isAutoFull ? "" : isTerminal ? "bg-emerald-500/20 text-emerald-400" : "bg-orange-500/20 text-orange-400"}`}
                      style={isAutoFull ? { background: neoGreen.bg20, color: neoGreen.primary } : undefined}>BEST</span>}
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
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-border p-4"
            style={isAutoFull ? { borderColor: neoGreen.border } : undefined}>
            <Loader2 size={14}
              className={`animate-spin ${isAutoFull ? "" : isTerminal ? "text-emerald-400" : "text-orange-400"}`}
              style={isAutoFull ? { color: neoGreen.primary } : undefined} />
            <span className="text-xs text-muted-foreground">Executing…</span>
          </div>
        )}

        {/* Messages */}
        {cc.messages.map((msg, i) => (
          <div key={i} className={`mb-2 ${msg.role === "user" ? "flex justify-end" : ""}`}>
            <div className={`rounded-lg px-3 py-2 text-xs leading-relaxed max-w-[85%] ${
              msg.role === "user" ? (isAutoFull ? "" : isTerminal ? "bg-emerald-500/10 text-emerald-200" : "bg-primary/10 text-foreground")
              : msg.role === "error" ? "bg-destructive/10 text-destructive"
              : msg.role === "workflow" ? (isAutoFull ? "" : isTerminal ? "bg-emerald-500/5 text-emerald-300" : "bg-orange-500/5 text-orange-300")
              : msg.role === "system" ? "text-muted-foreground"
              : "text-foreground"
            }`}
              style={isAutoFull ? (
                msg.role === "user" ? { background: neoGreen.bg10, color: neoGreen.primary } :
                msg.role === "workflow" ? { background: neoGreen.bg5, color: neoGreen.dim } :
                undefined
              ) : undefined}
            >
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
            <Loader2 size={12} className={`animate-spin ${isAutoFull ? "" : isTerminal ? "text-emerald-400" : "text-orange-400"}`}
              style={isAutoFull ? { color: neoGreen.primary } : undefined} />
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
      <div className="shrink-0 px-4 pb-3 pt-2" style={isTerminal ? { background: isAutoFull ? "#050A05" : "#07070B" } : undefined}>
        <div className="mx-auto flex max-w-3xl items-center gap-2"
          style={isAutoFull ? { borderBottom: `1px solid ${neoGreen.border}`, paddingBottom: 4 } : undefined}>
          {isTerminal && <span className="text-[10px] font-mono" style={{ color: isAutoFull ? neoGreen.primary : "rgba(16,185,129,0.6)" }}>$</span>}
          <AutoSuggestInput
            ref={cc.inputRef as React.RefObject<HTMLInputElement>}
            value={cc.input}
            onChange={(e) => cc.setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onAcceptSuggestion={(full) => cc.setInput(full)}
            suggestions={terminalSuggestions}
            ghostColor={isAutoFull ? neoGreen.dim : isTerminal ? "rgb(52,211,153)" : "hsl(var(--primary))"}
            placeholder={isTerminal ? "Type a command or ask anything…" : "Ask anything or type / for commands…"}
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/40"
            style={isTerminal ? { color: isAutoFull ? neoGreen.dim : "#A0A4AA" } : undefined}
            disabled={cc.loading}
          />
          <button onClick={() => cc.processInput(cc.input)} disabled={cc.loading || !cc.input.trim()}
            className={`rounded-lg p-2 transition-all ${cc.input.trim() ? (isAutoFull ? "" : isTerminal ? "text-emerald-400" : "bg-primary/20 text-primary hover:bg-primary/30") : "text-muted-foreground/20"}`}
            style={cc.input.trim() && isAutoFull ? { color: neoGreen.primary } : undefined}>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
