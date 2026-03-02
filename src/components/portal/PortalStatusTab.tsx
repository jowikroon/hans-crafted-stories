import { useState, useEffect } from "react";
import { Activity, Database, Server, Zap, Globe, Shield, RefreshCw, Plug, CalendarCheck2, MessageSquareWarning, Code } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WORKFLOWS } from "@/lib/config/workflows";
import StatusSummaryCard from "./status/StatusSummaryCard";
import { type StatusLevel } from "./status/StatusChip";
import HealthDetailDrawer from "./status/HealthDetailDrawer";
import ConnectorDetailDrawer from "./status/ConnectorDetailDrawer";
import MondayDetailDrawer from "./status/MondayDetailDrawer";
import IntentsDetailDrawer from "./status/IntentsDetailDrawer";
import AnalysisDashboard from "./status/AnalysisDashboard";
import TrackingScriptsManager from "./TrackingScriptsManager";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ConnectorStatus { id: string; label: string; connected: boolean; }
type Status = "online" | "offline" | "checking";
interface Resource { icon: typeof Server; label: string; status: Status; latency?: number; endpoint?: string; lastError?: string; }
interface UnhandledIntent { id: string; user_input: string; source: string; fast_route_score: number | null; llm_intent: string | null; llm_confidence: number | null; resolved: boolean; resolved_workflow: string | null; created_at: string; }
interface MondayEvent { id: string; event_type: string; message: string; metadata: Record<string, unknown>; monday_item_id: string | null; created_at: string; }

type DrawerType = "health" | "connectors" | "monday" | "intents" | "tracking" | null;

const PortalStatusTab = ({ subFilter }: { subFilter?: string }) => {
  const [openDrawer, setOpenDrawer] = useState<DrawerType>(null);
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
  const [mondayEvents, setMondayEvents] = useState<MondayEvent[]>([]);
  const [mondayLoading, setMondayLoading] = useState(true);
  const [mondayApprovingId, setMondayApprovingId] = useState<string | null>(null);

  const checkAll = async () => {
    setResources((prev) => prev.map((r) => ({ ...r, status: "checking" as Status, lastError: undefined })));
    const results = await Promise.all([
      (async () => { const start = Date.now(); try { const { error } = await supabase.from("portal_tools").select("id").limit(1); return { status: error ? "offline" : "online", latency: Date.now() - start, lastError: error?.message } as const; } catch (e: any) { return { status: "offline" as const, latency: 0, lastError: e?.message }; } })(),
      (async () => { const start = Date.now(); try { const { error } = await supabase.auth.getSession(); return { status: error ? "offline" : "online", latency: Date.now() - start, lastError: error?.message } as const; } catch (e: any) { return { status: "offline" as const, latency: 0, lastError: e?.message }; } })(),
      (async () => { const start = Date.now(); try { const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/site-audit`, { method: "OPTIONS" }); return { status: res.ok || res.status === 204 ? "online" : "offline", latency: Date.now() - start, lastError: res.ok ? undefined : `HTTP ${res.status}` } as const; } catch (e: any) { return { status: "offline" as const, latency: 0, lastError: e?.message }; } })(),
      (async () => { const start = Date.now(); try { const { error } = await supabase.storage.from("bucket").list("", { limit: 1 }); return { status: error ? "offline" : "online", latency: Date.now() - start, lastError: error?.message } as const; } catch (e: any) { return { status: "offline" as const, latency: 0, lastError: e?.message }; } })(),
      (async () => { const start = Date.now(); try { const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }); return { status: res.ok ? "online" : "offline", latency: Date.now() - start, lastError: res.ok ? undefined : `HTTP ${res.status}` } as const; } catch (e: any) { return { status: "offline" as const, latency: 0, lastError: e?.message }; } })(),
    ]);
    setResources((prev) => prev.map((r, i) => ({ ...r, status: results[i].status, latency: results[i].latency, lastError: results[i].lastError })));
    setLastChecked(new Date());
  };

  const checkConnectors = async () => {
    setConnectorsLoading(true);
    try { const { data, error } = await supabase.functions.invoke("connector-status"); if (!error && data?.data) setConnectors(data.data); } catch {} finally { setConnectorsLoading(false); }
  };

  const fetchUnhandledIntents = async () => {
    setIntentsLoading(true);
    try { const { data, error } = await (supabase.from("unhandled_intents" as any).select("*").eq("resolved", false).order("created_at", { ascending: false }).limit(25) as any); if (!error && data) setUnhandledIntents(data as UnhandledIntent[]); } catch {} finally { setIntentsLoading(false); }
  };

  const resolveIntent = async (intentId: string, workflowName: string) => {
    setResolvingId(intentId);
    try { await (supabase.from("unhandled_intents" as any).update({ resolved: true, resolved_workflow: workflowName }) as any).eq("id", intentId); setUnhandledIntents((prev) => prev.filter((i) => i.id !== intentId)); } catch {} finally { setResolvingId(null); }
  };

  const dismissIntent = async (intentId: string) => {
    setResolvingId(intentId);
    try { await (supabase.from("unhandled_intents" as any).update({ resolved: true, resolved_workflow: "dismissed" }) as any).eq("id", intentId); setUnhandledIntents((prev) => prev.filter((i) => i.id !== intentId)); } catch {} finally { setResolvingId(null); }
  };

  const fetchMondayEvents = async () => {
    setMondayLoading(true);
    try { const { data, error } = await (supabase.from("empire_events").select("id, event_type, message, metadata, monday_item_id, created_at").in("source", ["monday", "monday-trigger-agent"]).order("created_at", { ascending: false }).limit(15) as any); if (!error && data) setMondayEvents(data as MondayEvent[]); } catch {} finally { setMondayLoading(false); }
  };

  const approveMondayItem = async (eventId: string, workflowName: string, itemId: string, itemName: string, boardId: string) => {
    const wf = WORKFLOWS.find((w) => w.name === workflowName);
    if (!wf) return;
    setMondayApprovingId(eventId);
    try {
      const payload = { source: "portal-approved", monday_item_id: itemId, monday_board_id: boardId, item_name: itemName, workflow: wf.name, approved_at: new Date().toISOString() };
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-webhook`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionData?.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` }, body: JSON.stringify({ webhook_url: wf.webhook, payload }) });
      if (!res.ok) throw new Error("Webhook failed");
      const evt = mondayEvents.find((e) => e.id === eventId);
      const newMetadata = { ...(evt?.metadata || {}), resolved_workflow: workflowName };
      await supabase.from("empire_events").update({ event_type: "monday_approved", metadata: newMetadata }).eq("id", eventId);
      setMondayEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, event_type: "monday_approved", metadata: newMetadata } : e)));
    } catch {} finally { setMondayApprovingId(null); }
  };

  useEffect(() => { checkAll(); checkConnectors(); fetchUnhandledIntents(); fetchMondayEvents(); }, []);

  const onlineCount = resources.filter((r) => r.status === "online").length;
  const checking = resources.some((r) => r.status === "checking");
  const connectedCount = connectors.filter((c) => c.connected).length;
  const mondayTodo = mondayEvents.filter((e) => e.event_type === "monday_unhandled");
  const trackingCount = 0;

  const healthLevel: StatusLevel = checking ? "checking" : onlineCount === resources.length ? "ok" : onlineCount === 0 ? "critical" : "warning";
  const connectorLevel: StatusLevel = connectorsLoading ? "checking" : connectedCount === connectors.length ? "ok" : connectedCount === 0 ? "critical" : "warning";
  const mondayLevel: StatusLevel = mondayLoading ? "checking" : mondayTodo.length === 0 ? "ok" : "warning";
  const intentsLevel: StatusLevel = intentsLoading ? "checking" : unhandledIntents.length === 0 ? "ok" : "warning";

  const cards: { key: DrawerType; icon: any; title: string; summary: string; level: StatusLevel }[] = [
    { key: "health", icon: Activity, title: "System Health", summary: checking ? "Checking…" : `${onlineCount}/${resources.length} online`, level: healthLevel },
    { key: "connectors", icon: Plug, title: "Connectors", summary: connectorsLoading ? "Checking…" : `${connectedCount}/${connectors.length} linked`, level: connectorLevel },
    { key: "monday", icon: CalendarCheck2, title: "Monday.com", summary: mondayLoading ? "Loading…" : `${mondayTodo.length} pending`, level: mondayLevel },
    { key: "intents", icon: MessageSquareWarning, title: "Unhandled Intents", summary: intentsLoading ? "Loading…" : `${unhandledIntents.length} unresolved`, level: intentsLevel },
    { key: "tracking", icon: Code, title: "Tracking Scripts", summary: "Manage scripts", level: "ok" as StatusLevel },
  ];

  const analysisFilters = ["overview", "test results", "issues", "architecture"];
  const isAnalysis = analysisFilters.includes((subFilter || "").toLowerCase());

  if (isAnalysis) {
    return <AnalysisDashboard subFilter={subFilter || "overview"} />;
  }

  // "All" or fallback — show existing status cards
  const filteredCards = cards;

  const overallLevel: StatusLevel = checking ? "checking" : healthLevel === "critical" || connectorLevel === "critical" ? "critical" : healthLevel === "warning" || connectorLevel === "warning" || mondayLevel === "warning" || intentsLevel === "warning" ? "warning" : "ok";

  const refreshAll = () => { checkAll(); checkConnectors(); fetchUnhandledIntents(); fetchMondayEvents(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-secondary/40">
            <Activity size={16} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground tracking-tight">
              {checking ? "Checking…" : overallLevel === "ok" ? "All systems go" : overallLevel === "critical" ? "Issues detected" : "Some items need attention"}
            </p>
            {lastChecked && (
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                Last checked {lastChecked.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={refreshAll}
          disabled={checking}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border/50 text-muted-foreground/50 transition-all hover:border-border hover:text-foreground disabled:opacity-30"
        >
          <RefreshCw size={12} className={checking ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filteredCards.map((card) => (
          <StatusSummaryCard
            key={card.key}
            icon={card.icon}
            title={card.title}
            summary={card.summary}
            level={card.level}
            onClick={() => setOpenDrawer(card.key)}
          />
        ))}
      </div>

      <HealthDetailDrawer open={openDrawer === "health"} onClose={() => setOpenDrawer(null)} resources={resources} />
      <ConnectorDetailDrawer open={openDrawer === "connectors"} onClose={() => setOpenDrawer(null)} connectors={connectors} loading={connectorsLoading} />
      <MondayDetailDrawer open={openDrawer === "monday"} onClose={() => setOpenDrawer(null)} events={mondayEvents} loading={mondayLoading} onRefresh={fetchMondayEvents} onApprove={approveMondayItem} approvingId={mondayApprovingId} />
      <IntentsDetailDrawer open={openDrawer === "intents"} onClose={() => setOpenDrawer(null)} intents={unhandledIntents} loading={intentsLoading} onRefresh={fetchUnhandledIntents} onResolve={resolveIntent} onDismiss={dismissIntent} resolvingId={resolvingId} />

      <Drawer open={openDrawer === "tracking"} onOpenChange={(o) => !o && setOpenDrawer(null)}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="relative">
            <DrawerTitle>Tracking Scripts</DrawerTitle>
            <DrawerDescription>Manage tracking code injections</DrawerDescription>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="absolute right-4 top-4 h-7 w-7"><X size={14} /></Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6">
            <TrackingScriptsManager />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default PortalStatusTab;
