// Phase 2 — Response Metadata & Confidence Labeling
import { cn } from "@/lib/utils";
import { Database, Globe, Cpu, Zap } from "lucide-react";

export type DataSource = "live-data" | "general-knowledge" | "system" | "cached" | "mixed";
export type ConfidenceLevel = "high" | "moderate" | "low";

export interface ResponseMeta {
  model: string;
  provider: string;
  source: DataSource;
  confidence: ConfidenceLevel;
  basis?: string;
  toolName?: string;
  latency?: number;
}

export function inferResponseMeta(opts: {
  modelId: string; modelLabel: string; provider: string;
  isToolResult?: boolean; toolName?: string; isWorkflow?: boolean; workflowName?: string; latency?: number;
}): ResponseMeta {
  if (opts.isToolResult || opts.isWorkflow) {
    return { model: opts.modelLabel, provider: opts.provider, source: "live-data", confidence: "high", basis: opts.toolName || opts.workflowName || "system operation", toolName: opts.toolName || opts.workflowName, latency: opts.latency };
  }
  if (opts.modelId.startsWith("agent/")) {
    const agentBasis: Record<string, string> = { "agent/health": "infrastructure probe", "agent/google": "Google Workspace API", "agent/seo-audit": "site crawler" };
    return { model: opts.modelLabel, provider: "Edge Function", source: "live-data", confidence: "high", basis: agentBasis[opts.modelId] || "agent operation", latency: opts.latency };
  }
  if (opts.modelId.startsWith("ollama/") || opts.modelId === "anythingllm") {
    return { model: opts.modelLabel, provider: opts.provider, source: opts.modelId === "anythingllm" ? "mixed" : "general-knowledge", confidence: "moderate", basis: opts.modelId === "anythingllm" ? "your uploaded documents" : "local model inference", latency: opts.latency };
  }
  return { model: opts.modelLabel, provider: opts.provider, source: "general-knowledge", confidence: "moderate", basis: "training data", latency: opts.latency };
}

const sourceIcon: Record<DataSource, typeof Database> = { "live-data": Database, "general-knowledge": Globe, system: Cpu, cached: Database, mixed: Globe };
const confDot: Record<ConfidenceLevel, string> = { high: "bg-emerald-400", moderate: "bg-white/40", low: "bg-amber-400" };
const confColor: Record<ConfidenceLevel, string> = { high: "text-emerald-400/40", moderate: "text-white/30", low: "text-amber-400/40" };

export function ResponseFooter({ meta, className }: { meta: ResponseMeta; className?: string }) {
  const Icon = sourceIcon[meta.source];
  return (
    <div className={cn("flex items-center gap-2 flex-wrap pt-1.5 mt-1", className)}>
      <span className="text-[9px] text-white/20 font-mono">{meta.model}</span>
      <span className="text-white/10">·</span>
      <span className={cn("flex items-center gap-1 text-[9px]", meta.source === "live-data" ? "text-emerald-400/50" : "text-white/30")}><Icon size={8} />{meta.basis || meta.source}</span>
      <span className="text-white/10">·</span>
      <span className={cn("flex items-center gap-1 text-[9px]", confColor[meta.confidence])}><span className={cn("inline-block w-1 h-1 rounded-full", confDot[meta.confidence])} />{meta.confidence} confidence</span>
      {meta.latency != null && meta.latency > 0 && (<><span className="text-white/10">·</span><span className="text-[9px] text-white/15 font-mono flex items-center gap-0.5"><Zap size={7} />{meta.latency < 1000 ? `${meta.latency}ms` : `${(meta.latency / 1000).toFixed(1)}s`}</span></>)}
    </div>
  );
}
