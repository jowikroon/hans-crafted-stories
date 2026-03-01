import { useState, useEffect, useCallback } from "react";
import { Database, Shield, Zap, Globe, Server, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Status = "online" | "offline" | "checking";

interface Resource {
  icon: typeof Server;
  label: string;
  status: Status;
  latency?: number;
  endpoint?: string;
  lastError?: string;
}

const INITIAL_RESOURCES: Resource[] = [
  { icon: Database, label: "DB", status: "checking", endpoint: "/rest/v1/portal_tools" },
  { icon: Shield, label: "Auth", status: "checking", endpoint: "/auth/v1/session" },
  { icon: Zap, label: "Functions", status: "checking", endpoint: "/functions/v1/site-audit" },
  { icon: Globe, label: "Storage", status: "checking", endpoint: "/storage/v1/bucket" },
  { icon: Server, label: "API", status: "checking", endpoint: "/rest/v1/" },
];

interface StatusStripProps {
  onOpenDrawer?: () => void;
}

const StatusStrip = ({ onOpenDrawer }: StatusStripProps) => {
  const [resources, setResources] = useState<Resource[]>(INITIAL_RESOURCES);
  const [checking, setChecking] = useState(false);

  const checkAll = useCallback(async () => {
    setChecking(true);
    setResources((prev) => prev.map((r) => ({ ...r, status: "checking" as Status })));

    const results = await Promise.all([
      (async () => {
        const start = Date.now();
        try {
          const { error } = await supabase.from("portal_tools").select("id").limit(1);
          return { status: (error ? "offline" : "online") as Status, latency: Date.now() - start, lastError: error?.message };
        } catch (e: any) { return { status: "offline" as Status, latency: 0, lastError: e?.message }; }
      })(),
      (async () => {
        const start = Date.now();
        try {
          const { error } = await supabase.auth.getSession();
          return { status: (error ? "offline" : "online") as Status, latency: Date.now() - start, lastError: error?.message };
        } catch (e: any) { return { status: "offline" as Status, latency: 0, lastError: e?.message }; }
      })(),
      (async () => {
        const start = Date.now();
        try {
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/site-audit`, { method: "OPTIONS" });
          return { status: (res.ok || res.status === 204 ? "online" : "offline") as Status, latency: Date.now() - start };
        } catch (e: any) { return { status: "offline" as Status, latency: 0, lastError: e?.message }; }
      })(),
      (async () => {
        const start = Date.now();
        try {
          const { error } = await supabase.storage.from("bucket").list("", { limit: 1 });
          return { status: (error ? "offline" : "online") as Status, latency: Date.now() - start, lastError: error?.message };
        } catch (e: any) { return { status: "offline" as Status, latency: 0, lastError: e?.message }; }
      })(),
      (async () => {
        const start = Date.now();
        try {
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
            headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          });
          return { status: (res.ok ? "online" : "offline") as Status, latency: Date.now() - start };
        } catch (e: any) { return { status: "offline" as Status, latency: 0, lastError: e?.message }; }
      })(),
    ]);

    setResources((prev) =>
      prev.map((r, i) => ({ ...r, status: results[i].status, latency: results[i].latency, lastError: results[i].lastError }))
    );
    setChecking(false);
  }, []);

  useEffect(() => { checkAll(); }, [checkAll]);

  const onlineCount = resources.filter((r) => r.status === "online").length;

  const dotColor = (r: Resource) => {
    if (r.status === "checking") return "bg-muted-foreground/30 animate-pulse";
    if (r.status === "offline") return "bg-destructive";
    if (!r.latency || r.latency < 200) return "bg-emerald-500";
    if (r.latency < 500) return "bg-amber-500";
    return "bg-destructive";
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/50 px-4 py-2.5 cursor-pointer transition-colors hover:bg-card/80"
        onClick={onOpenDrawer}
        role="button"
        tabIndex={0}
        aria-label="System status — click for details"
        onKeyDown={(e) => e.key === "Enter" && onOpenDrawer?.()}
      >
        {resources.map((r) => (
          <Tooltip key={r.label}>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <span className={`inline-block h-2 w-2 rounded-full transition-colors ${dotColor(r)}`} />
                <span className="text-[11px] font-medium text-muted-foreground">{r.label}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p className="font-medium">{r.label}</p>
              <p className={r.status === "online" ? "text-emerald-500" : "text-destructive"}>
                {r.status === "checking" ? "Checking…" : r.status === "online" ? `Online · ${r.latency}ms` : "Offline"}
              </p>
              {r.lastError && <p className="text-destructive/70 text-[10px]">{r.lastError}</p>}
            </TooltipContent>
          </Tooltip>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] tabular-nums text-muted-foreground/60">{onlineCount}/{resources.length}</span>
          <button
            onClick={(e) => { e.stopPropagation(); checkAll(); }}
            disabled={checking}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:text-foreground disabled:opacity-30"
            aria-label="Refresh status"
          >
            <RefreshCw size={11} className={checking ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default StatusStrip;
