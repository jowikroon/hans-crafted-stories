import { useState, useEffect } from "react";
import { Activity, Database, Server, Zap, Globe, Shield, RefreshCw, Plug, Unplug, MessageSquareWarning, Check, X, CalendarCheck2, ExternalLink, ListTodo, History, Copy, Bot, Code } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import InfoTooltip from "./InfoTooltip";
import { WORKFLOWS } from "@/lib/config/workflows";
import TrackingScriptsManager from "./TrackingScriptsManager";

/** Monday.com board URL — open in dashboard. Set via VITE_MONDAY_BOARD_URL or use default. */
const MONDAY_BOARD_URL = import.meta.env.VITE_MONDAY_BOARD_URL || "https://hansvl3s-team-company.monday.com/boards/5092430975";

interface ConnectorStatus {
  id: string;
  label: string;
  connected: boolean;
}

type Status = "online" | "offline" | "checking";

interface Resource {
  icon: typeof Server;
  label: string;
  status: Status;
  latency?: number;
  endpoint?: string;
  lastError?: string;
}

const StatusDot = ({ status, latency }: { status: Status; latency?: number }) => {
  if (status === "checking") return <span className="inline-block h-2.5 w-2.5 rounded-full bg-muted-foreground/30 animate-pulse" />;
  if (status === "offline") return <span className="inline-block h-2.5 w-2.5 rounded-full bg-destructive" />;
  // Online: green < 200ms, orange 200-500ms, red > 500ms
  const color = !latency || latency < 200 ? "bg-emerald-500" : latency < 500 ? "bg-amber-500" : "bg-destructive";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />;
};

interface UnhandledIntent {
  id: string;
  user_input: string;
  source: string;
  fast_route_score: number | null;
  llm_intent: string | null;
  llm_confidence: number | null;
  resolved: boolean;
  resolved_workflow: string | null;
  created_at: string;
}

const PortalStatusTab = ({ subFilter }: { subFilter?: string }) => {
  const [resources, setResources] = useState<Resource[]>([
    { icon: Database, label: "Database", status: "checking", endpoint: "/rest/v1/portal_tools" },
    { icon: Shield, label: "Auth", status: "checking", endpoint: "/auth/v1/session" },
    { icon: Zap, label: "Functions", status: "checking", endpoint: "/functions/v1/site-audit" },
    { icon: Globe, label: "Storage", status: "checking", endpoint: "/storage/v1/bucket" },
    { icon: Server, label: "API", status: "checking", endpoint: "/rest/v1/" },
  ]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [connectorsLoading, setConnectorsLoading] = useState(true);
  const [unhandledIntents, setUnhandledIntents] = useState<UnhandledIntent[]>([]);
  const [intentsLoading, setIntentsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [mondayEvents, setMondayEvents] = useState<Array<{ id: string; event_type: string; message: string; metadata: Record<string, unknown>; monday_item_id: string | null; created_at: string }>>([]);
  const [mondayLoading, setMondayLoading] = useState(true);
  const [mondaySubmenu, setMondaySubmenu] = useState<"todo" | "done">("todo");
  const [mondayApprovingId, setMondayApprovingId] = useState<string | null>(null);
  const [triggerAgentUrlCopied, setTriggerAgentUrlCopied] = useState(false);

  const mondayTriggerAgentUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/monday-trigger-agent`;

  const copyTriggerAgentUrl = async () => {
    try {
      await navigator.clipboard.writeText(mondayTriggerAgentUrl);
      setTriggerAgentUrlCopied(true);
      setTimeout(() => setTriggerAgentUrlCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

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

  const checkConnectors = async () => {
    setConnectorsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("connector-status");
      if (!error && data?.data) {
        setConnectors(data.data);
      }
    } catch (e) {
      console.error("Failed to check connectors:", e);
    } finally {
      setConnectorsLoading(false);
    }
  };

  useEffect(() => { checkConnectors(); }, []);

  const fetchUnhandledIntents = async () => {
    setIntentsLoading(true);
    try {
      const { data, error } = await (supabase
        .from("unhandled_intents" as any)
        .select("*")
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(25) as any);
      if (!error && data) {
        setUnhandledIntents(data as UnhandledIntent[]);
      }
    } catch (e) {
      console.error("Failed to fetch unhandled intents:", e);
    } finally {
      setIntentsLoading(false);
    }
  };

  const resolveIntent = async (intentId: string, workflowName: string) => {
    setResolvingId(intentId);
    try {
      await (supabase
        .from("unhandled_intents" as any)
        .update({ resolved: true, resolved_workflow: workflowName }) as any)
        .eq("id", intentId);
      setUnhandledIntents((prev) => prev.filter((i) => i.id !== intentId));
    } catch (e) {
      console.error("Failed to resolve intent:", e);
    } finally {
      setResolvingId(null);
    }
  };

  const dismissIntent = async (intentId: string) => {
    setResolvingId(intentId);
    try {
      await (supabase
        .from("unhandled_intents" as any)
        .update({ resolved: true, resolved_workflow: "dismissed" }) as any)
        .eq("id", intentId);
      setUnhandledIntents((prev) => prev.filter((i) => i.id !== intentId));
    } catch (e) {
      console.error("Failed to dismiss intent:", e);
    } finally {
      setResolvingId(null);
    }
  };

  useEffect(() => { fetchUnhandledIntents(); }, []);

  const fetchMondayEvents = async () => {
    setMondayLoading(true);
    try {
      const { data, error } = await (supabase
        .from("empire_events")
        .select("id, event_type, message, metadata, monday_item_id, created_at")
        .in("source", ["monday", "monday-trigger-agent"])
        .order("created_at", { ascending: false })
        .limit(15) as any);
      if (!error && data) {
        setMondayEvents(data as typeof mondayEvents);
      }
    } catch (e) {
      console.error("Failed to fetch Monday events:", e);
    } finally {
      setMondayLoading(false);
    }
  };

  useEffect(() => { fetchMondayEvents(); }, []);

  const approveMondayItem = async (eventId: string, workflowName: string, itemId: string, itemName: string, boardId: string) => {
    const wf = WORKFLOWS.find((w) => w.name === workflowName);
    if (!wf) return;
    setMondayApprovingId(eventId);
    try {
      const payload = {
        source: "portal-approved",
        monday_item_id: itemId,
        monday_board_id: boardId,
        item_name: itemName,
        workflow: wf.name,
        approved_at: new Date().toISOString(),
      };
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData?.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ webhook_url: wf.webhook, payload }),
      });
      if (!res.ok) throw new Error("Webhook failed");
      const evt = mondayEvents.find((e) => e.id === eventId);
      const newMetadata = { ...(evt?.metadata || {}), resolved_workflow: workflowName };
      await supabase.from("empire_events").update({ event_type: "monday_approved", metadata: newMetadata }).eq("id", eventId);
      setMondayEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, event_type: "monday_approved", metadata: newMetadata } : e))
      );
    } catch (e) {
      console.error("Approve Monday item failed:", e);
    } finally {
      setMondayApprovingId(null);
    }
  };

  const mondayTodo = mondayEvents.filter((e) => e.event_type === "monday_unhandled");
  const mondayDone = mondayEvents.filter((e) => e.event_type === "monday_dispatched" || e.event_type === "monday_approved").slice(0, 5);

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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
                      <StatusDot status={r.status} latency={r.latency} />
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
            {resources.map((r) => {
              const dotColor = r.status === "checking"
                ? "bg-muted-foreground/15 animate-pulse"
                : r.status === "offline"
                  ? "bg-destructive/60"
                  : !r.latency || r.latency < 200
                    ? "bg-emerald-500/50"
                    : r.latency < 500
                      ? "bg-amber-500/50"
                      : "bg-destructive/50";
              return (
                <span
                  key={r.label}
                  className={`inline-block h-1.5 w-5 rounded-full transition-all duration-700 ${dotColor}`}
                />
              );
            })}
          </div>
          <span className="ml-auto text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">
            {onlineCount}/{resources.length}
          </span>
        </div>

        {/* Connectors Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-secondary/40">
              <Plug size={16} className="text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium text-foreground tracking-tight">Connectors</p>
                <InfoTooltip text="External API integrations linked to this project" />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                {connectorsLoading ? "Checking…" : `${connectors.filter(c => c.connected).length}/${connectors.length} linked`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {connectors.map((c) => (
              <div
                key={c.id}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-4 transition-all duration-500 ${
                  c.connected
                    ? "border-primary/10 bg-primary/[0.03]"
                    : "border-border/40 bg-secondary/20"
                }`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                  c.connected ? "bg-primary/[0.08] text-primary/60" : "bg-muted/50 text-muted-foreground/30"
                }`}>
                  {c.connected ? <Plug size={16} strokeWidth={1.5} /> : <Unplug size={16} strokeWidth={1.5} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{c.label}</p>
                  <p className={`text-[10px] font-medium ${c.connected ? "text-primary/70" : "text-muted-foreground/40"}`}>
                    {c.connected ? "Connected" : "Not linked"}
                  </p>
                </div>
              </div>
            ))}
            {connectorsLoading && connectors.length === 0 && (
              <div className="col-span-full flex items-center justify-center py-4 text-xs text-muted-foreground/40">
                Checking connectors…
              </div>
            )}
          </div>
        </div>

        {/* Monday.com Webhook Events */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-secondary/40">
                <CalendarCheck2 size={16} className="text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <a
                    href={MONDAY_BOARD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-foreground tracking-tight underline decoration-primary/40 underline-offset-2 transition-colors hover:text-primary hover:decoration-primary"
                  >
                    Monday.com
                  </a>
                  <InfoTooltip text="Recent webhook events from Monday.com. To do: approve items to run a workflow. Done: last 5 dispatched or approved." />
                </div>
                <nav className="mt-1 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  <button
                    type="button"
                    onClick={() => setMondaySubmenu("todo")}
                    className={`transition-colors hover:text-foreground/80 ${mondaySubmenu === "todo" ? "text-foreground font-medium" : ""}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      <ListTodo size={10} />
                      To do ({mondayTodo.length})
                    </span>
                  </button>
                  <span className="text-muted-foreground/30">|</span>
                  <button
                    type="button"
                    onClick={() => setMondaySubmenu("done")}
                    className={`transition-colors hover:text-foreground/80 ${mondaySubmenu === "done" ? "text-foreground font-medium" : ""}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      <History size={10} />
                      Done (last 5)
                    </span>
                  </button>
                </nav>
              </div>
            </div>
            <button
              onClick={fetchMondayEvents}
              disabled={mondayLoading}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border/50 text-muted-foreground/50 transition-all hover:border-border hover:text-foreground disabled:opacity-30"
            >
              <RefreshCw size={12} className={mondayLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Monday Trigger Agent — webhook URL for Monday.com Integrations */}
          <div className="rounded-xl border border-primary/10 bg-primary/[0.02] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary/60">
                <Bot size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground">Trigger Agent webhook</p>
                <p className="text-[10px] text-muted-foreground/70">
                  Use this URL in Monday.com → Integrations → Webhooks. Each trigger is classified by AI and routed to a workflow.
                </p>
              </div>
              <button
                type="button"
                onClick={copyTriggerAgentUrl}
                className="flex shrink-0 items-center gap-1.5 rounded-md border border-border/40 bg-secondary/30 px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
              >
                {triggerAgentUrlCopied ? <Check size={12} /> : <Copy size={12} />}
                {triggerAgentUrlCopied ? "Copied" : "Copy URL"}
              </button>
            </div>
            <p className="mt-2 truncate font-mono text-[10px] text-muted-foreground/60" title={mondayTriggerAgentUrl}>
              {mondayTriggerAgentUrl}
            </p>
          </div>

          {mondayLoading ? (
            <div className="flex items-center justify-center rounded-2xl border border-border/30 bg-secondary/10 py-8 text-xs text-muted-foreground/40">
              Loading…
            </div>
          ) : mondaySubmenu === "todo" ? (
            mondayTodo.length === 0 ? (
              <div className="flex items-center justify-center rounded-2xl border border-border/30 bg-secondary/10 py-8 text-xs text-muted-foreground/40">
                No new requests — unhandled Monday items will appear here for you to approve and send to a workflow
              </div>
            ) : (
              <div className="space-y-2">
                {mondayTodo.map((evt) => {
                  const boardId = String((evt.metadata as Record<string, unknown>)?.boardId ?? "");
                  const itemLink = evt.monday_item_id
                    ? `https://monday.com/boards/${boardId}/pulses/${evt.monday_item_id}`
                    : MONDAY_BOARD_URL;
                  return (
                    <div
                      key={evt.id}
                      className="group flex items-start gap-3 rounded-xl border border-amber-500/10 bg-amber-500/[0.02] px-4 py-3 transition-all"
                    >
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-500/60">
                        <MessageSquareWarning size={12} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground/90 break-words">{evt.message}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground/50">
                          <span>{new Date(evt.created_at).toLocaleString()}</span>
                          {evt.monday_item_id && (
                            <a
                              href={itemLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-primary/50 hover:text-primary/80"
                            >
                              <ExternalLink size={8} />
                              Item #{evt.monday_item_id}
                            </a>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                          {WORKFLOWS.filter((w) => w.name !== "monday-orchestrator").map((wf) => (
                            <button
                              key={wf.name}
                              onClick={() =>
                                approveMondayItem(
                                  evt.id,
                                  wf.name,
                                  evt.monday_item_id || "",
                                  (evt.metadata as Record<string, unknown>)?.item_name as string || evt.message,
                                  boardId
                                )
                              }
                              disabled={mondayApprovingId === evt.id}
                              className="flex items-center gap-1 rounded-md border border-border/40 bg-secondary/20 px-2 py-1 text-[10px] font-medium text-muted-foreground/70 transition-all hover:border-primary/30 hover:text-primary/80 disabled:opacity-30"
                            >
                              <Check size={10} />
                              {wf.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : mondayDone.length === 0 ? (
            <div className="flex items-center justify-center rounded-2xl border border-border/30 bg-secondary/10 py-8 text-xs text-muted-foreground/40">
              No completed Monday items yet — dispatched or approved items will appear here
            </div>
          ) : (
            <div className="space-y-2">
              {mondayDone.map((evt) => {
                const isApproved = evt.event_type === "monday_approved";
                const workflow = (evt.metadata as Record<string, unknown>)?.workflow as string | undefined ?? (evt.metadata as Record<string, unknown>)?.resolved_workflow as string | undefined;
                const confidence = (evt.metadata as Record<string, unknown>)?.confidence as number | undefined;
                const boardId = String((evt.metadata as Record<string, unknown>)?.boardId ?? "");
                const itemLink = evt.monday_item_id
                  ? `https://monday.com/boards/${boardId}/pulses/${evt.monday_item_id}`
                  : MONDAY_BOARD_URL;
                return (
                  <div
                    key={evt.id}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-all ${
                      isApproved ? "border-primary/10 bg-primary/[0.02]" : "border-primary/10 bg-primary/[0.02]"
                    }`}
                  >
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary/60">
                      {isApproved ? <Check size={12} /> : <Zap size={12} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground/90 break-words">{evt.message}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground/50">
                        {workflow && (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary/70">{workflow}</span>
                        )}
                        {confidence != null && (
                          <span>{(confidence * 100).toFixed(0)}% match</span>
                        )}
                        <span>{new Date(evt.created_at).toLocaleString()}</span>
                        {evt.monday_item_id && (
                          <a
                            href={itemLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-primary/50 hover:text-primary/80"
                          >
                            <ExternalLink size={8} />
                            Item #{evt.monday_item_id}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Unhandled Intents Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-secondary/40">
                <MessageSquareWarning size={16} className="text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium text-foreground tracking-tight">Unhandled Intents</p>
                  <InfoTooltip text="User inputs that couldn't be matched to a workflow. Assign them to learn over time." />
                </div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  {intentsLoading ? "Loading…" : `${unhandledIntents.length} unresolved`}
                </p>
              </div>
            </div>
            <button
              onClick={fetchUnhandledIntents}
              disabled={intentsLoading}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border/50 text-muted-foreground/50 transition-all hover:border-border hover:text-foreground disabled:opacity-30"
            >
              <RefreshCw size={12} className={intentsLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {unhandledIntents.length === 0 && !intentsLoading ? (
            <div className="flex items-center justify-center rounded-2xl border border-border/30 bg-secondary/10 py-8 text-xs text-muted-foreground/40">
              No unhandled intents — all clear
            </div>
          ) : (
            <div className="space-y-2">
              {unhandledIntents.map((intent) => (
                <div
                  key={intent.id}
                  className="group flex items-start gap-3 rounded-xl border border-border/30 bg-secondary/10 px-4 py-3 transition-all hover:border-border/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground/90 break-words">
                      "{intent.user_input}"
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground/50">
                      <span className="uppercase tracking-wider">{intent.source}</span>
                      {intent.fast_route_score != null && (
                        <span>Score: {(intent.fast_route_score * 100).toFixed(0)}%</span>
                      )}
                      {intent.llm_intent && intent.llm_intent !== "unknown" && (
                        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-500/70">
                          LLM: {intent.llm_intent} ({((intent.llm_confidence ?? 0) * 100).toFixed(0)}%)
                        </span>
                      )}
                      <span>{new Date(intent.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* Assign to workflow */}
                    <div className="mt-2 flex flex-wrap gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                      {WORKFLOWS.map((wf) => (
                        <button
                          key={wf.name}
                          onClick={() => resolveIntent(intent.id, wf.name)}
                          disabled={resolvingId === intent.id}
                          className="flex items-center gap-1 rounded-md border border-border/40 bg-secondary/20 px-2 py-1 text-[10px] font-medium text-muted-foreground/70 transition-all hover:border-primary/30 hover:text-primary/80 disabled:opacity-30"
                        >
                          <Check size={10} />
                          {wf.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => dismissIntent(intent.id)}
                    disabled={resolvingId === intent.id}
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/30 transition-all hover:bg-destructive/10 hover:text-destructive/60 disabled:opacity-30"
                    title="Dismiss"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Tracking Scripts Section */}
        <TrackingScriptsManager />
      </div>
    </TooltipProvider>
  );
};

export default PortalStatusTab;
