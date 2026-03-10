import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONNECTED_SERVICES, DEPLOY_PIPELINES, INFRA_LAYERS } from "@/lib/config/infrastructure";

const layerColorDot: Record<string, string> = {
  edge: "bg-emerald-400",
  backend: "bg-blue-400",
  automation: "bg-purple-400",
  compute: "bg-amber-400",
  ai: "bg-pink-400",
  monitoring: "bg-orange-400",
};

export default function ServicesGrid() {
  const groupedByLayer = INFRA_LAYERS.reduce((acc, layer) => {
    acc[layer.id] = CONNECTED_SERVICES.filter(s => s.layer === layer.id);
    return acc;
  }, {} as Record<string, typeof CONNECTED_SERVICES>);

  return (
    <div className="space-y-6">
      {/* Deploy Pipelines */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-400/70 mb-3">
          Deployment Pipelines
        </h3>
        <div className="space-y-2">
          {DEPLOY_PIPELINES.map(p => (
            <div key={p.name} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-sm font-semibold text-zinc-200">{p.name}</span>
                </div>
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  <ExternalLink size={12} />
                </a>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-zinc-500">
                <span>Platform: <span className="text-zinc-400">{p.platform}</span></span>
                <span>Trigger: <span className="text-zinc-400">{p.trigger}</span></span>
                <span>Repo: <span className="text-zinc-400 font-mono">{p.repo}</span></span>
                <span>Output: <span className="text-zinc-400 font-mono">{p.outputDir}</span></span>
              </div>
              <div className="mt-2 rounded bg-zinc-800/60 px-2 py-1 font-mono text-[10px] text-zinc-500">{p.buildCmd}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Services by Layer */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-400/70 mb-3">
          Connected Services ({CONNECTED_SERVICES.length})
        </h3>
        {Object.entries(groupedByLayer).map(([layerId, services]) => {
          if (services.length === 0) return null;
          const layer = INFRA_LAYERS.find(l => l.id === layerId);
          return (
            <div key={layerId} className="mb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={cn("h-1.5 w-1.5 rounded-full", layerColorDot[layerId] || "bg-zinc-500")} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{layer?.label || layerId}</span>
              </div>
              <div className="space-y-1">
                {services.map((s, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-lg border border-zinc-800 px-3 py-2 text-xs hover:border-zinc-700 transition-colors">
                    <span className="font-medium text-zinc-300 shrink-0">{s.name}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-zinc-500 truncate flex-1 min-w-[120px]">{s.role}</span>
                    <span className="text-zinc-600 font-mono text-[10px] truncate hidden sm:inline max-w-[200px]">{s.identifier}</span>
                    {s.url && (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-zinc-400 transition-colors shrink-0">
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
