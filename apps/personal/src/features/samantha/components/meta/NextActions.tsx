// Phase 2 — Contextual Next-Action Buttons
import { cn } from "@/lib/utils";
import { Copy, ClipboardCheck, RefreshCw, ListChecks, Wand2, HeartPulse } from "lucide-react";
import { useState } from "react";
import type { ToolResult } from "@/features/samantha/types";

export interface NextAction {
  id: string; label: string; icon: typeof Copy;
  command?: string; handler?: string;
  variant: "primary" | "secondary" | "ghost";
}

export function getNextActions(opts: {
  toolResult?: ToolResult; responseContent?: string; isError?: boolean;
}): NextAction[] {
  const { toolResult, responseContent, isError } = opts;
  if (isError) return [
    { id: "retry", label: "Try again", icon: RefreshCw, handler: "retry", variant: "primary" },
    { id: "health", label: "Check health", icon: HeartPulse, command: "/health", variant: "secondary" },
  ];
  if (toolResult?.type === "health") {
    const hasFailures = toolResult.services.some(s => !s.ok);
    const actions: NextAction[] = [{ id: "recheck", label: "Re-check", icon: RefreshCw, command: "/health", variant: "secondary" }];
    if (hasFailures) actions.unshift({ id: "task-failures", label: "Create task for failures", icon: ListChecks, command: `/task Fix failing services: ${toolResult.services.filter(s => !s.ok).map(s => s.name).join(", ")}`, variant: "primary" });
    return actions;
  }
  if (responseContent && /seo|audit|meta.?tag|heading|core web vital/i.test(responseContent)) {
    return [
      { id: "fix-top", label: "Fix top issue", icon: Wand2, handler: "fix-top-seo", variant: "primary" },
      { id: "task-seo", label: "Save as tasks", icon: ListChecks, handler: "create-task", variant: "secondary" },
    ];
  }
  if (responseContent && responseContent.length > 500) {
    return [
      { id: "copy", label: "Copy", icon: Copy, handler: "copy-response", variant: "primary" },
      { id: "save-task", label: "Save as task", icon: ListChecks, handler: "create-task", variant: "secondary" },
      { id: "more-variants", label: "Generate variants", icon: Wand2, command: "Give me 2 alternative versions of the above", variant: "ghost" },
    ];
  }
  if (responseContent && responseContent.length > 80) {
    return [{ id: "copy", label: "Copy", icon: Copy, handler: "copy-response", variant: "ghost" }];
  }
  return [];
}

export function NextActionsBar({ actions, onCommand, onHandler, className }: {
  actions: NextAction[]; onCommand: (cmd: string) => void; onHandler: (handler: string) => void; className?: string;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  if (actions.length === 0) return null;
  const handleClick = (a: NextAction) => {
    if (a.handler === "copy-response") { setCopiedId(a.id); onHandler(a.handler); setTimeout(() => setCopiedId(null), 2000); return; }
    if (a.command) onCommand(a.command); else if (a.handler) onHandler(a.handler);
  };
  const vs = { primary: "border-white/10 bg-white/[0.06] text-white/60 hover:text-white/80 hover:bg-white/10", secondary: "border-white/[0.06] bg-transparent text-white/40 hover:text-white/60 hover:bg-white/[0.04]", ghost: "border-transparent bg-transparent text-white/30 hover:text-white/50" };
  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap pt-2", className)}>
      {actions.map(a => { const Icon = copiedId === a.id ? ClipboardCheck : a.icon; return (
        <button key={a.id} onClick={() => handleClick(a)} className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-all", vs[a.variant])}>
          <Icon size={10} />{copiedId === a.id ? "Copied" : a.label}
        </button>
      ); })}
    </div>
  );
}
