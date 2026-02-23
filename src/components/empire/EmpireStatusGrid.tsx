import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Globe, Brain, Cpu, Radio, Database, HeartPulse, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Status = "online" | "offline" | "checking";

interface Layer {
  icon: typeof Shield;
  label: string;
  sublabel: string;
  status: Status;
  latency?: number;
  lastError?: string;
}

const LAYERS: Layer[] = [
  { icon: Shield, label: "Shield", sublabel: "Cloudflare Zero Trust", status: "checking" },
  { icon: Globe, label: "Portal", sublabel: "hansvanleeuwen.com", status: "checking" },
  { icon: Brain, label: "Brain", sublabel: "n8n Orchestration", status: "checking" },
  { icon: Cpu, label: "Muscle", sublabel: "Claude Code CLI", status: "checking" },
  { icon: Radio, label: "Senses", sublabel: "MCP Gateway", status: "checking" },
  { icon: Database, label: "Memory", sublabel: "Database", status: "checking" },
  { icon: HeartPulse, label: "Immune", sublabel: "AI Doctor", status: "checking" },
];

const statusColor = (s: Status) =>
  s === "online" ? "text-emerald-400" : s === "offline" ? "text-red-400" : "text-muted-foreground/40";

const statusBg = (s: Status) =>
  s === "online"
    ? "border-emerald-500/20 bg-emerald-500/[0.05]"
    : s === "offline"
      ? "border-red-500/20 bg-red-500/[0.05]"
      : "border-border/40 bg-secondary/20";

const EmpireStatusGrid = () => {
  const [layers, setLayers] = useState<Layer[]>(LAYERS);
  const [checking, setChecking] = useState(false);

  const runChecks = async () => {
    setChecking(true);
    setLayers((prev) => prev.map((l) => ({ ...l, status: "checking" as Status })));

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/empire-health`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      const data = await res.json();

      if (data.services) {
        setLayers((prev) =>
          prev.map((l) => {
            const svc = data.services[l.label.toLowerCase()];
            if (!svc) return { ...l, status: "offline" };
            return { ...l, status: svc.ok ? "online" : "offline", latency: svc.latency, lastError: svc.error };
          })
        );
      }
    } catch {
      setLayers((prev) => prev.map((l) => ({ ...l, status: "offline", lastError: "Health check failed" })));
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => { runChecks(); }, []);

  const onlineCount = layers.filter((l) => l.status === "online").length;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/70">
              7-Layer Spine
            </h2>
            <span className="font-mono text-[10px] text-muted-foreground/50">
              {checking ? "scanning…" : `${onlineCount}/${layers.length} online`}
            </span>
          </div>
          <button
            onClick={runChecks}
            disabled={checking}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border/50 text-muted-foreground/50 transition-all hover:border-emerald-500/30 hover:text-emerald-400 disabled:opacity-30"
          >
            <RefreshCw size={12} className={checking ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
          {layers.map((layer, i) => {
            const Icon = layer.icon;
            return (
              <Tooltip key={layer.label}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`group relative flex flex-col items-center gap-2 rounded-xl border px-3 py-4 transition-all cursor-default ${statusBg(layer.status)}`}
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/40 ${statusColor(layer.status)}`}>
                      <Icon size={18} strokeWidth={1.5} />
                    </div>
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-foreground/80">
                      {layer.label}
                    </span>
                    <div className="flex items-center gap-1">
                      {layer.status === "online" ? (
                        <Wifi size={8} className="text-emerald-400" />
                      ) : layer.status === "offline" ? (
                        <WifiOff size={8} className="text-red-400" />
                      ) : (
                        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-muted-foreground/30" />
                      )}
                      {layer.latency !== undefined && layer.status === "online" && (
                        <span className="font-mono text-[9px] text-emerald-400/60">{layer.latency}ms</span>
                      )}
                    </div>
                    {layer.status === "online" && (
                      <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
                    )}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="space-y-1 text-xs bg-card border-border">
                  <p className="font-medium">{layer.sublabel}</p>
                  <p className={layer.status === "online" ? "text-emerald-400" : "text-red-400"}>
                    {layer.status === "checking" ? "Checking…" : layer.status === "online" ? `Online · ${layer.latency}ms` : "Offline"}
                  </p>
                  {layer.lastError && <p className="text-red-400/70 text-[10px]">{layer.lastError}</p>}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default EmpireStatusGrid;
