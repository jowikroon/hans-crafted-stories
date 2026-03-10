import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Database, Zap, Server, Brain, Activity,
  ChevronDown, ExternalLink, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  INFRA_LAYERS, DATA_FLOWS, getLayerColor, getTextColor,
  type InfraLayer,
} from "@/lib/config/infrastructure";
import { WORKFLOWS } from "@/lib/config/workflows";
import ArchitectureDiagram from "./ArchitectureDiagram";

const ICON_MAP: Record<string, typeof Globe> = { Globe, Database, Zap, Server, Brain, Activity };
const catColor: Record<string, string> = { seo: "bg-emerald-500/15 text-emerald-400", data: "bg-blue-500/15 text-blue-400", infra: "bg-violet-500/15 text-violet-400", marketing: "bg-amber-500/15 text-amber-400", ai: "bg-pink-500/15 text-pink-400" };

function FlowLine({ from, to, label, protocol }: { from: string; to: string; label: string; protocol: string }) {
  const fromLayer = INFRA_LAYERS.find(l => l.id === from);
  const toLayer = INFRA_LAYERS.find(l => l.id === to);
  if (!fromLayer || !toLayer) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/30 px-3 py-2 text-[11px]">
      <span className={cn("font-medium shrink-0", getTextColor(fromLayer.color))}>{fromLayer.label}</span>
      <ArrowRight size={10} className="text-zinc-600 shrink-0" />
      <span className={cn("font-medium shrink-0", getTextColor(toLayer.color))}>{toLayer.label}</span>
      <span className="ml-auto text-zinc-500 truncate">{label}</span>
      <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[9px] font-mono text-zinc-500 shrink-0">{protocol}</span>
    </div>
  );
}

function LayerCard({ layer, idx }: { layer: InfraLayer; idx: number }) {
  const [open, setOpen] = useState(false);
  const Icon = ICON_MAP[layer.icon] || Server;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }} className={cn("rounded-xl border transition-all cursor-pointer group", getLayerColor(layer.color))} onClick={() => setOpen(!open)}>
      <div className="flex items-center justify-between px-3 sm:px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-current/10"><Icon size={16} /></div>
          <div>
            <p className="text-sm font-semibold">{layer.label}</p>
            <p className="text-[10px] opacity-60 font-mono">{layer.tech}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] opacity-40 hidden sm:inline">{layer.services.length} services</span>
          <ChevronDown size={14} className={cn("transition-transform opacity-40", open && "rotate-180")} />
        </div>
      </div>
      <AnimatePresence>{open && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
          <div className="border-t border-current/10 px-3 sm:px-4 py-3 space-y-3">
            <p className="text-[11px] opacity-70 leading-relaxed">{layer.description}</p>
            <div className="space-y-1.5">
              {layer.services.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] opacity-70"><span className="mt-1 h-1 w-1 rounded-full bg-current shrink-0" /><span>{s}</span></div>
              ))}
            </div>
            {layer.urls.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {layer.urls.map(u => (
                  <a key={u.url} href={u.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 rounded-md border border-current/20 bg-current/5 px-2 py-1 text-[10px] font-medium opacity-80 hover:opacity-100 transition-opacity">
                    <ExternalLink size={9} /> {u.label}
                  </a>
                ))}
              </div>
            )}
            {layer.dependsOn.length > 0 && (<p className="text-[10px] opacity-40 pt-1">Depends on: {layer.dependsOn.map(d => INFRA_LAYERS.find(l => l.id === d)?.label).join(", ")}</p>)}
          </div>
        </motion.div>
      )}</AnimatePresence>
    </motion.div>
  );
}

export default function NetworkTopology() {
  const [showFlows, setShowFlows] = useState(false);
  const [showWorkflows, setShowWorkflows] = useState(false);

  return (
    <div className="space-y-6">
      {/* SVG Diagram */}
      <ArchitectureDiagram />

      {/* Layer Stack */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">Architecture Layers</h3>
          <span className="text-[10px] text-zinc-600">{INFRA_LAYERS.length} layers · click to expand</span>
        </div>
        <div className="space-y-2">
          {INFRA_LAYERS.map((layer, i) => (<LayerCard key={layer.id} layer={layer} idx={i} />))}
        </div>
      </div>

      {/* Data Flows */}
      <div>
        <button onClick={() => setShowFlows(!showFlows)} className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-400/70 hover:text-cyan-400 transition-colors">
          <ChevronDown size={12} className={cn("transition-transform", showFlows && "rotate-180")} />Data Flows ({DATA_FLOWS.length})
        </button>
        <AnimatePresence>{showFlows && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-1.5">
            {DATA_FLOWS.map((flow, i) => (<FlowLine key={i} {...flow} />))}
          </motion.div>
        )}</AnimatePresence>
      </div>

      {/* Workflow Registry */}
      <div>
        <button onClick={() => setShowWorkflows(!showWorkflows)} className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-purple-400/70 hover:text-purple-400 transition-colors">
          <ChevronDown size={12} className={cn("transition-transform", showWorkflows && "rotate-180")} />Workflow Registry ({WORKFLOWS.length})
        </button>
        <AnimatePresence>{showWorkflows && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
              {WORKFLOWS.map(w => (
                <div key={w.name} className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2 hover:border-zinc-700 transition-colors">
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-zinc-300">{w.label}</span>
                    <span className="ml-2 text-[10px] text-zinc-600 font-mono">{w.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] text-zinc-600">{w.keywords.length} kw</span>
                    <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold uppercase", catColor[w.category] || "bg-zinc-500/15 text-zinc-400")}>{w.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}</AnimatePresence>
      </div>
    </div>
  );
}
