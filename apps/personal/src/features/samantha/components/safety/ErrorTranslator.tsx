// Phase 1 — Error Translation Layer
// Converts raw HTTP/API errors into structured Issue → Cause → Impact → Fix

import { cn } from "@/lib/utils";
import { ShieldAlert, ArrowRight, RefreshCw, LogIn } from "lucide-react";

export interface TranslatedError {
  issue: string;
  cause: string;
  impact: string;
  fix: string;
  fixAction?: { label: string; handler: string };
  severity: "warning" | "error" | "critical";
}

export function translateError(
  rawError: string,
  context?: { statusCode?: number; source?: string; workflow?: string }
): TranslatedError {
  const code = context?.statusCode;
  const src = context?.source || "system";
  const wf = context?.workflow;

  if (code === 401 || /unauthorized|invalid jwt|auth.*fail/i.test(rawError)) {
    return { issue: "Authentication failed", cause: "Your session has expired or login credentials are invalid.", impact: `${src === "empire-health" ? "Health monitoring" : "This operation"} is unavailable until you re-authenticate.`, fix: "Sign out and sign back in to refresh your session.", fixAction: { label: "Sign in again", handler: "reauth" }, severity: "error" };
  }
  if (code === 429 || /rate.?limit|too many requests|quota/i.test(rawError)) {
    return { issue: "Rate limit reached", cause: "Too many requests sent in a short period.", impact: "Responses will fail until the cooldown period ends (usually 30–60 seconds).", fix: "Wait a moment, then try again. If this persists, switch to a different model.", fixAction: { label: "Switch model", handler: "switch-model" }, severity: "warning" };
  }
  if (code && code >= 500) {
    return { issue: `Server error (${code})`, cause: `The ${src === "hansai-chat" ? "AI backend" : src === "n8n" ? "automation server" : "backend service"} encountered an internal error.`, impact: wf ? `The "${wf}" workflow did not complete. No data was modified.` : "This request could not be processed.", fix: "Try again in a few minutes. If it persists, check the health dashboard.", fixAction: { label: "Check health", handler: "health" }, severity: "error" };
  }
  if (/network|timeout|abort|fetch.*fail|econnrefused/i.test(rawError)) {
    return { issue: "Connection failed", cause: "Could not reach the backend service.", impact: "This request was not sent. No changes were made.", fix: "Check your internet connection, then try again. Run /health to check service status.", fixAction: { label: "Run health check", handler: "health" }, severity: "error" };
  }
  if (/column.*does not exist|42703|schema|migration/i.test(rawError)) {
    return { issue: "Database schema mismatch", cause: "The database structure doesn't match what the application expects.", impact: "Data cannot be read or written for this feature until the schema is updated.", fix: "This requires a database migration. Flag this for the next maintenance session.", severity: "critical" };
  }
  if (/workflow.*not found|webhook.*404|n8n/i.test(rawError)) {
    return { issue: wf ? `Workflow "${wf}" unreachable` : "Workflow unavailable", cause: "The n8n automation server didn't respond to the webhook.", impact: "The automation could not run. No data was modified.", fix: "Check if the workflow is active in n8n, or try /workflows to see available options.", fixAction: { label: "List workflows", handler: "workflows" }, severity: "error" };
  }
  return { issue: "Something went wrong", cause: rawError.length > 200 ? rawError.slice(0, 200) + "…" : rawError, impact: wf ? `The "${wf}" operation did not complete.` : "This request could not be processed.", fix: "Try again, or check the health dashboard for service status.", fixAction: { label: "Check health", handler: "health" }, severity: "warning" };
}

interface ErrorCardProps { error: TranslatedError; onAction?: (handler: string) => void; }

export function ErrorCard({ error, onAction }: ErrorCardProps) {
  const s = { warning: { border: "border-amber-500/20", bg: "bg-amber-500/[0.04]", icon: "text-amber-400", badge: "bg-amber-500/10 text-amber-400" }, error: { border: "border-red-500/20", bg: "bg-red-500/[0.04]", icon: "text-red-400", badge: "bg-red-500/10 text-red-400" }, critical: { border: "border-red-600/30", bg: "bg-red-600/[0.06]", icon: "text-red-500", badge: "bg-red-600/15 text-red-400" } }[error.severity];
  return (
    <div className={cn("rounded-xl border p-4 space-y-3", s.border, s.bg)}>
      <div className="flex items-center gap-2">
        <ShieldAlert size={14} className={s.icon} />
        <span className="text-sm font-semibold text-white/80">{error.issue}</span>
        <span className={cn("ml-auto text-[9px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider", s.badge)}>{error.severity}</span>
      </div>
      <div className="space-y-2.5 pl-[22px]">
        <div><p className="text-[10px] uppercase tracking-wider text-white/25 mb-0.5">Cause</p><p className="text-[11px] text-white/50 leading-relaxed">{error.cause}</p></div>
        <div className="flex items-center gap-1 text-white/15"><ArrowRight size={8} /></div>
        <div><p className="text-[10px] uppercase tracking-wider text-white/25 mb-0.5">Impact</p><p className="text-[11px] text-white/50 leading-relaxed">{error.impact}</p></div>
        <div className="flex items-center gap-1 text-white/15"><ArrowRight size={8} /></div>
        <div><p className="text-[10px] uppercase tracking-wider text-emerald-400/40 mb-0.5">Fix</p><p className="text-[11px] text-white/60 leading-relaxed font-medium">{error.fix}</p></div>
      </div>
      {error.fixAction && onAction && (
        <div className="pl-[22px] pt-1">
          <button onClick={() => onAction(error.fixAction!.handler)} className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all", error.severity === "warning" ? "border-amber-500/20 text-amber-400 hover:bg-amber-500/10" : "border-red-500/20 text-red-400 hover:bg-red-500/10")}>
            {error.fixAction.handler === "reauth" ? <LogIn size={11} /> : <RefreshCw size={11} />}
            {error.fixAction.label}
          </button>
        </div>
      )}
    </div>
  );
}
