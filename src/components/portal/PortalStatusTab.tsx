import { useState, useEffect } from "react";
import { Activity, Database, Server, Zap, Globe, Shield, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import InfoTooltip from "./InfoTooltip";

type Status = "online" | "offline" | "checking";

interface Resource {
  icon: typeof Server;
  label: string;
  status: Status;
  latency?: number;
  endpoint?: string;
  lastError?: string;
}

const StatusIcon = ({ status, size = 10 }: { status: Status; size?: number }) => {
  if (status === "checking") return <span className={`inline-block h-${size/4} w-${size/4} rounded-full bg-muted-foreground/30 animate-pulse`} style={{ width: size, height: size }} />;
  if (status === "online") return <Wifi size={size} className="text-primary/70" />;
  return <WifiOff size={size} className="text-destructive/60" />;
};

const PortalStatusTab = () => {
  const [resources, setResources] = useState<Resource[]>([
    { icon: Database, label: "Database", status: "checking", endpoint: "/rest/v1/portal_tools" },
    { icon: Shield, label: "Auth", status: "checking", endpoint: "/auth/v1/session" },
    { icon: Zap, label: "Functions", status: "checking", endpoint: "/functions/v1/site-audit" },
    { icon: Globe, label: "Storage", status: "checking", endpoint: "/storage/v1/bucket" },
    { icon: Server, label: "API", status: "checking", endpoint: "/rest/v1/" },
  ]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkAll = async () => {
    setResources((prev) => prev.map((r) => ({ ...r, status: "checking" as Status, lastError: undefined })));

    const results = await Promise.all([
      (async () => {
        const start = Date.now();
        try {
          const { error } = await supabase.from("portal_tools").select("id").limit(1);
          return { status: error ? "offline" : "online", latency: Date.now() - start, lastError: error?.message } as const;
        } catch (e: any) { return { status: "offline" as const, latency: 0, lastError: e?.message || "Connection failed" }; }
      })(),
      (async () => {
        const start = Date.now();
        try {
          const { error } = await supabase.auth.getSession();
          return { status: error ? "offline" : "online", latency: Date.now() - start, lastError: error?.message } as const;
        } catch (e: any) { return { status: "offline" as const, latency: 0, lastError: e?.message || "Connection failed" }; }
      })(),
      (async () => {
        const start = Date.now();
        try {
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/site-audit`, { method: "OPTIONS" });
          return { status: res.ok || res.status === 204 || res.status === 200 ? "online" : "offline", latency: Date.now() - start, lastError: res.ok ? undefined : `HTTP ${res.status}` } as const;
        } catch (e: any) { return { status: "offline" as const, latency: 0, lastError: e?.message || "Connection failed" }; }
      })(),
      (async () => {
        const start = Date.now();
        try {
          const { error } = await supabase.storage.from("bucket").list("", { limit: 1 });
          return { status: error ? "offline" : "online", latency: Date.now() - start, lastError: error?.message } as const;
        } catch (e: any) { return { status: "offline" as const, latency: 0, lastError: e?.message || "Connection failed" }; }
      })(),
      (async () => {
        const start = Date.now();
        try {
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
            headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          });
          return { status: res.ok ? "online" : "offline", latency: Date.now() - start, lastError: res.ok ? undefined : `HTTP ${res.status}` } as const;
        } catch (e: any) { return { status: "offline" as const, latency: 0, lastError: e?.message || "Connection failed" }; }
      })(),
    ]);

    setResources((prev) =>
      prev.map((r, i) => ({ ...r, status: results[i].status, latency: results[i].latency, lastError: results[i].lastError }))
    );
    setLastChecked(new Date());
  };

  useEffect(() => { checkAll(); }, []);

  const onlineCount = resources.filter((r) => r.status === "online").length;
  const allOnline = onlineCount === resources.length;
  const checking = resources.some((r) => r.status === "checking");

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-8">
        {/* Compact header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-secondary/40">
              <Activity size={16} className="text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium text-foreground tracking-tight">
                  {checking ? "Checking…" : allOnline ? "All systems go" : `${onlineCount}/${resources.length} up`}
                </p>
                <InfoTooltip text="Real-time health check of all backend services" />
              </div>
              {lastChecked && (
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  {lastChecked.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={checkAll}
            disabled={checking}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/50 text-muted-foreground/50 transition-all hover:border-border hover:text-foreground disabled:opacity-30"
          >
            <RefreshCw size={12} className={checking ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Grid of service tiles */}
        <div className="grid grid-cols-5 gap-3">
          {resources.map((r) => {
            const Icon = r.icon;
            const isOnline = r.status === "online";
            const isChecking = r.status === "checking";
            return (
              <Tooltip key={r.label}>
                <TooltipTrigger asChild>
                  <div
                    className={`group relative flex flex-col items-center gap-3 rounded-2xl border px-3 py-5 transition-all duration-500 cursor-default ${
                      isOnline
                        ? "border-primary/10 bg-primary/[0.03]"
                        : isChecking
                          ? "border-border/40 bg-secondary/20"
                          : "border-destructive/10 bg-destructive/[0.02]"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-500 ${
                        isOnline
                          ? "bg-primary/[0.08] text-primary/60"
                          : isChecking
                            ? "bg-muted/50 text-muted-foreground/40"
                            : "bg-destructive/[0.06] text-destructive/50"
                      }`}
                    >
                      <Icon size={20} strokeWidth={1.5} />
                    </div>
                    <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/70">
                      {r.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <StatusIcon status={r.status} size={10} />
                      {r.latency !== undefined && isOnline && (
                        <span className="text-[10px] tabular-nums text-muted-foreground/40">{r.latency}ms</span>
                      )}
                    </div>
                    {isOnline && (
                      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[220px] space-y-1 text-xs">
                  <p className="font-medium">{r.label}</p>
                  {r.endpoint && (
                    <p className="text-muted-foreground/70 font-mono text-[10px] truncate">{r.endpoint}</p>
                  )}
                  <p className={isOnline ? "text-primary/70" : "text-destructive/70"}>
                    {isChecking ? "Checking…" : isOnline ? `Online · ${r.latency}ms` : "Offline"}
                  </p>
                  {r.lastError && (
                    <p className="text-destructive/60 text-[10px] break-words">Error: {r.lastError}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Minimal overall bar */}
        <div className="flex items-center gap-2 rounded-full border border-border/30 bg-secondary/20 px-4 py-2">
          <div className="flex gap-1">
            {resources.map((r) => (
              <span
                key={r.label}
                className={`inline-block h-1.5 w-5 rounded-full transition-all duration-700 ${
                  r.status === "online"
                    ? "bg-primary/30"
                    : r.status === "checking"
                      ? "bg-muted-foreground/15 animate-pulse"
                      : "bg-destructive/25"
                }`}
              />
            ))}
          </div>
          <span className="ml-auto text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">
            {onlineCount}/{resources.length}
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default PortalStatusTab;
