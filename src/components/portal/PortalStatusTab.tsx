import { useState, useEffect } from "react";
import { Activity, Database, Server, Zap, Globe, Shield, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Status = "online" | "offline" | "checking";

interface Resource {
  icon: typeof Server;
  label: string;
  description: string;
  status: Status;
  latency?: number;
}

const StatusDot = ({ status }: { status: Status }) => {
  const cls =
    status === "online"
      ? "bg-green-500"
      : status === "offline"
        ? "bg-destructive"
        : "bg-muted-foreground animate-pulse";
  return <span className={`inline-block h-2 w-2 rounded-full ${cls}`} />;
};

const PortalStatusTab = () => {
  const [resources, setResources] = useState<Resource[]>([
    { icon: Database, label: "Database", description: "Primary data store", status: "checking" },
    { icon: Shield, label: "Authentication", description: "User auth service", status: "checking" },
    { icon: Zap, label: "Edge Functions", description: "Backend functions runtime", status: "checking" },
    { icon: Globe, label: "Storage", description: "File storage bucket", status: "checking" },
    { icon: Server, label: "API Gateway", description: "REST & Realtime API", status: "checking" },
  ]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkAll = async () => {
    const checks = [...resources].map((r) => ({ ...r, status: "checking" as Status }));
    setResources(checks);

    const results = await Promise.all([
      // Database
      (async () => {
        const start = Date.now();
        try {
          const { error } = await supabase.from("portal_tools").select("id").limit(1);
          return { status: error ? "offline" : "online", latency: Date.now() - start } as const;
        } catch {
          return { status: "offline" as const, latency: 0 };
        }
      })(),
      // Auth
      (async () => {
        const start = Date.now();
        try {
          const { error } = await supabase.auth.getSession();
          return { status: error ? "offline" : "online", latency: Date.now() - start } as const;
        } catch {
          return { status: "offline" as const, latency: 0 };
        }
      })(),
      // Edge Functions
      (async () => {
        const start = Date.now();
        try {
          // Simple health-check ping
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/site-audit`, {
            method: "OPTIONS",
          });
          return { status: res.ok || res.status === 204 || res.status === 200 ? "online" : "offline", latency: Date.now() - start } as const;
        } catch {
          return { status: "offline" as const, latency: 0 };
        }
      })(),
      // Storage
      (async () => {
        const start = Date.now();
        try {
          const { error } = await supabase.storage.from("bucket").list("", { limit: 1 });
          return { status: error ? "offline" : "online", latency: Date.now() - start } as const;
        } catch {
          return { status: "offline" as const, latency: 0 };
        }
      })(),
      // API Gateway
      (async () => {
        const start = Date.now();
        try {
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          });
          return { status: res.ok ? "online" : "offline", latency: Date.now() - start } as const;
        } catch {
          return { status: "offline" as const, latency: 0 };
        }
      })(),
    ]);

    setResources((prev) =>
      prev.map((r, i) => ({
        ...r,
        status: results[i].status,
        latency: results[i].latency,
      }))
    );
    setLastChecked(new Date());
  };

  useEffect(() => {
    checkAll();
  }, []);

  const onlineCount = resources.filter((r) => r.status === "online").length;
  const allOnline = onlineCount === resources.length;
  const checking = resources.some((r) => r.status === "checking");

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-medium text-foreground">System Status</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {checking
              ? "Checking services..."
              : allOnline
                ? "All systems operational"
                : `${onlineCount}/${resources.length} services online`}
          </p>
        </div>
        <button
          onClick={checkAll}
          disabled={checking}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
        >
          <Activity size={12} className={checking ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Overall indicator */}
      <div className={`flex items-center gap-3 rounded-xl border p-4 ${allOnline && !checking ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
        {checking ? (
          <Clock size={20} className="text-muted-foreground animate-pulse" />
        ) : allOnline ? (
          <CheckCircle size={20} className="text-green-500" />
        ) : (
          <XCircle size={20} className="text-destructive" />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {checking ? "Running checks..." : allOnline ? "All Systems Operational" : "Some services degraded"}
          </p>
          {lastChecked && (
            <p className="text-xs text-muted-foreground">
              Last checked {lastChecked.toLocaleTimeString()}
            </p>
          )}
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
          {onlineCount}/{resources.length}
        </span>
      </div>

      {/* Resource list */}
      <div className="space-y-2">
        {resources.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.label}
              className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.description}</p>
              </div>
              {r.latency !== undefined && r.status === "online" && (
                <span className="text-xs text-muted-foreground">{r.latency}ms</span>
              )}
              <StatusDot status={r.status} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PortalStatusTab;
