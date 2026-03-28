import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigate, Link, useSearchParams } from "react-router-dom";
import {
  Network, Crown, Sparkles, Activity, Layers, ListChecks, Shield, BarChart3,
  Database, Server, BookOpen, RefreshCw, CheckCircle2, AlertTriangle, XCircle,
  Wifi, WifiOff, Loader2, Zap, Globe, Brain,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { WORKFLOWS } from "@/lib/config/workflows";
import {
  INFRA_LAYERS, CONNECTED_SERVICES, ROADMAP, getRoadmapStats,
  getSecurityScore, SECURITY_ISSUES, PERFORMANCE_ISSUES, getTextColor,
} from "@/lib/config/infrastructure";

import NetworkTopology from "@/components/dashboard/NetworkTopology";
import SecurityPanel from "@/components/dashboard/SecurityPanel";
import DatabaseOverview from "@/components/dashboard/DatabaseOverview";
import ServicesGrid from "@/components/dashboard/ServicesGrid";
import RoadmapPanel from "@/components/dashboard/RoadmapPanel";

/* ═══ Types ═══ */
type SvcStatus = "online" | "offline" | "checking";
type Tab = "overview" | "architecture" | "health" | "database" | "services" | "roadmap";
const VALID_TABS: Tab[] = ["overview", "architecture", "health", "database", "services", "roadmap"];

interface SystemIssue { id: string; severity: string; area: string; issue: string; impact: string; fix: string; is_resolved: boolean; sort_order: number; }

/* ═══ Hooks ═══ */

function useSupabaseHealth() {
  const [checks, setChecks] = useState<{ label: string; sublabel: string; status: SvcStatus; latency?: number; icon: typeof Server }[]>([
    { label: "Database", sublabel: "PostgreSQL via PostgREST", status: "checking", icon: Database },
    { label: "Auth", sublabel: "Supabase Auth", status: "checking", icon: Shield },
    { label: "Functions", sublabel: "Deno Edge runtime", status: "checking", icon: Zap },
    { label: "API", sublabel: "REST gateway", status: "checking", icon: Globe },
  ]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);

  const run = useCallback(async () => {
    setChecking(true);
    setChecks(p => p.map(c => ({ ...c, status: "checking" as SvcStatus })));
    const url = import.meta.env.VITE_SUPABASE_URL || "";
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
    const probe = async (fn: () => Promise<{ ok: boolean }>): Promise<{ status: SvcStatus; latency: number }> => {
      const t = Date.now();
      try { const r = await fn(); return { status: r.ok ? "online" : "offline", latency: Date.now() - t }; }
      catch { return { status: "offline", latency: Date.now() - t }; }
    };
    const results = await Promise.all([
      probe(async () => { const { error } = await supabase.from("portal_tools").select("id").limit(1); return { ok: !error }; }),
      probe(async () => { const { error } = await supabase.auth.getSession(); return { ok: !error }; }),
      probe(async () => { if (!url) return { ok: false }; const r = await fetch(`${url}/functions/v1/site-audit`, { method: "OPTIONS" }); return { ok: r.ok || r.status === 204 }; }),
      probe(async () => { if (!url) return { ok: false }; const r = await fetch(`${url}/rest/v1/`, { headers: { apikey: key } }); return { ok: r.ok }; }),
    ]);
    setChecks(p => p.map((c, i) => ({ ...c, ...results[i] })));
    setLastChecked(new Date());
    setChecking(false);
  }, []);

  useEffect(() => { run(); }, [run]);
  return { checks, lastChecked, checking, run };
}

function useEmpireSpine() {
  const labels = ["Shield", "Portal", "Brain", "Muscle", "Senses", "Memory", "Immune"];
  const icons = [Shield, Globe, Brain, Server, Zap, Database, Activity];
  const [layers, setLayers] = useState(labels.map((l, i) => ({ label: l, icon: icons[i], status: "checking" as SvcStatus, latency: undefined as number | undefined })));
  const [checking, setChecking] = useState(false);

  const run = useCallback(async () => {
    setChecking(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const url = import.meta.env.VITE_SUPABASE_URL;
      if (!url) { setLayers(p => p.map(l => ({ ...l, status: "offline" as SvcStatus }))); return; }
      const res = await fetch(`${url}/functions/v1/empire-health`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${s?.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      });
      const d = await res.json();
      if (d.services) setLayers(p => p.map(l => {
        const svc = d.services[l.label.toLowerCase()];
        return svc ? { ...l, status: (svc.ok ? "online" : "offline") as SvcStatus, latency: svc.latency } : { ...l, status: "offline" as SvcStatus };
      }));
    } catch { setLayers(p => p.map(l => ({ ...l, status: "offline" as SvcStatus }))); }
    finally { setChecking(false); }
  }, []);

  useEffect(() => { run(); }, [run]);
  return { layers, checking, run };
}

function useSystemIssues() {
  const [issues, setIssues] = useState<SystemIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch_ = useCallback(async () => {
    try {
      const { data, error } = await (supabase.from("system_issues" as unknown).select("*").order("sort_order", { ascending: true }) as unknown);
      if (!error && data) setIssues(data as SystemIssue[]);
    } catch { /* empty */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch_(); }, [fetch_]);
  const toggle = async (id: string, cur: boolean) => {
    await (supabase.from("system_issues" as unknown).update({ is_resolved: !cur } as unknown).eq("id", id) as unknown);
    setIssues(p => p.map(i => i.id === id ? { ...i, is_resolved: !cur } : i));
  };
  return { issues, loading, toggle, refetch: fetch_ };
}

/* ═══ Small Components ═══ */

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 sm:p-4">
      <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-1.5 sm:mb-2">{label}</p>
      <p className={cn("text-xl sm:text-2xl font-bold leading-none font-mono", getTextColor(color))}>{value}</p>
      <p className="mt-1 sm:mt-1.5 text-[10px] text-zinc-500 truncate">{sub}</p>
    </div>
  );
}

const latencyColor = (ms: number) => ms < 200 ? "hsl(160,60%,45%)" : ms < 500 ? "hsl(38,92%,50%)" : "hsl(0,72%,51%)";

function LatencyChart({ data }: { data: { name: string; ms: number }[] }) {
  if (data.length === 0) return null;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-3">Response Latency</p>
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 8, fill: "#52525b" }} tickLine={false} axisLine={false} unit="ms" width={40} />
          <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [`${v}ms`, "Latency"]} />
          <Bar dataKey="ms" radius={[4, 4, 0, 0]} maxBarSize={28}>{data.map((e, i) => <Cell key={i} fill={latencyColor(e.ms)} fillOpacity={0.8} />)}</Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SpineRow({ layers, checking, onRefresh }: { layers: { label: string; icon: typeof Server; status: SvcStatus; latency?: number }[]; checking: boolean; onRefresh: () => void }) {
  const on = layers.filter(l => l.status === "online").length;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-400/70">7-Layer Spine</h3><span className="text-[10px] text-zinc-500 font-mono">{checking ? "scanning…" : `${on}/${layers.length}`}</span></div>
        <button onClick={onRefresh} disabled={checking} className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/30 disabled:opacity-30 transition-all"><RefreshCw size={11} className={checking ? "animate-spin" : ""} /></button>
      </div>
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
        {layers.map(l => { const I = l.icon; return (
          <div key={l.label} className={cn("flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3", l.status === "online" ? "border-emerald-500/20 bg-emerald-500/[0.04]" : l.status === "offline" ? "border-red-500/20 bg-red-500/[0.04]" : "border-zinc-800 bg-zinc-900/40")}>
            <I size={16} className={l.status === "online" ? "text-emerald-400" : l.status === "offline" ? "text-red-400" : "text-zinc-600"} strokeWidth={1.5} />
            <span className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider text-zinc-400">{l.label}</span>
            <div className="flex items-center gap-1">{l.status === "online" ? <Wifi size={8} className="text-emerald-400" /> : l.status === "offline" ? <WifiOff size={8} className="text-red-400" /> : <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-500" />}{l.latency != null && l.status === "online" && <span className="text-[8px] font-mono text-emerald-400/50">{l.latency}ms</span>}</div>
          </div>
        ); })}
      </div>
    </div>
  );
}

function SvcRow({ checks, checking, onRefresh, lastChecked }: { checks: { label: string; sublabel: string; status: SvcStatus; latency?: number; icon: typeof Server }[]; checking: boolean; onRefresh: () => void; lastChecked: Date | null }) {
  const on = checks.filter(c => c.status === "online").length;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-400/70">Supabase Services</h3><span className="text-[10px] text-zinc-500 font-mono">{checking ? "checking…" : `${on}/${checks.length}`}</span>{lastChecked && <span className="text-[9px] text-zinc-600 hidden sm:inline">{lastChecked.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}</div>
        <button onClick={onRefresh} disabled={checking} className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 text-zinc-500 hover:text-blue-400 hover:border-blue-500/30 disabled:opacity-30 transition-all"><RefreshCw size={11} className={checking ? "animate-spin" : ""} /></button>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {checks.map(c => { const I = c.icon; return (
          <div key={c.label} className={cn("flex items-center gap-3 rounded-lg border px-3 py-2.5", c.status === "online" ? "border-emerald-500/15 bg-emerald-500/[0.03]" : c.status === "offline" ? "border-red-500/15 bg-red-500/[0.03]" : "border-zinc-800")}>
            <I size={14} className={c.status === "online" ? "text-emerald-400" : c.status === "offline" ? "text-red-400" : "text-zinc-600"} />
            <div className="flex-1 min-w-0"><p className="text-xs font-medium text-zinc-300">{c.label}</p><p className="text-[10px] text-zinc-600 truncate">{c.sublabel}</p></div>
            <div className="flex flex-col items-end gap-0.5">{c.status === "online" ? <Wifi size={10} className="text-emerald-400" /> : c.status === "offline" ? <WifiOff size={10} className="text-red-400" /> : <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-500" />}{c.latency != null && c.status === "online" && <span className="text-[9px] font-mono text-zinc-500">{c.latency}ms</span>}</div>
          </div>
        ); })}
      </div>
    </div>
  );
}

/* ═══ Tab Config ═══ */
const TABS: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "architecture", label: "Architecture", icon: Layers },
  { id: "health", label: "Health & Security", icon: Shield },
  { id: "database", label: "Database", icon: Database },
  { id: "services", label: "Services", icon: Server },
  { id: "roadmap", label: "Roadmap", icon: ListChecks },
];

/* ═══ Main Export ═══ */
export default function GodStructure() {
  const { user, loading: aL } = useAuth();
  const { isAdmin, loading: dL } = useAdmin();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as Tab | null;
  const tab: Tab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "overview";

  const setTab = (t: Tab) => { setSearchParams(t === "overview" ? { /* empty */ } : { tab: t }, { replace: true }); };

  const { checks, lastChecked, checking: hC, run: runH } = useSupabaseHealth();
  const { layers: spine, checking: sC, run: runS } = useEmpireSpine();
  const { issues: dbIssues, loading: dbLoading, toggle: toggleIssue } = useSystemIssues();

  useEffect(() => { document.title = "Dashboard — Network Oversight"; const m = document.querySelector('meta[name="robots"]') as HTMLMetaElement || (() => { const el = document.createElement("meta"); el.name = "robots"; document.head.appendChild(el); return el; })(); m.content = "noindex, nofollow"; return () => { m.content = "index, follow"; }; }, []);

  if (aL || dL) return <div className="flex min-h-screen items-center justify-center bg-[#08080c]"><Loader2 size={20} className="animate-spin text-emerald-400" /></div>;
  if (!user || !isAdmin) return <Navigate to="/portal" replace />;

  const onSvc = checks.filter(c => c.status === "online").length;
  const onSp = spine.filter(l => l.status === "online").length;
  const stats = getRoadmapStats(ROADMAP);
  const { grade, color: secColor } = getSecurityScore();
  const health = hC || sC ? "checking" : onSvc === checks.length && onSp >= 5 ? "healthy" : onSvc === 0 ? "critical" : "degraded";
  const openDbIssues = dbIssues.filter(i => !i.is_resolved).length;

  // Latency data for chart
  const allLatency = [
    ...spine.filter(l => l.status === "online" && l.latency != null).map(l => ({ name: l.label, ms: l.latency! })),
    ...checks.filter(c => c.status === "online" && c.latency != null).map(c => ({ name: c.label, ms: c.latency! })),
  ];

  return (
    <div className="min-h-screen bg-[#08080c] text-zinc-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-20 sm:pt-24 pb-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10"><Network size={20} className="text-emerald-400" /></div>
            <div><h1 className="text-base sm:text-lg font-bold tracking-tight text-zinc-100 font-mono">Network Oversight</h1><p className="text-[10px] sm:text-[11px] text-zinc-500">AI Empire Architecture · v2.0 · {new Date().toLocaleDateString("en-GB")}</p></div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/wiki" className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 px-2.5 py-1.5 text-[10px] font-medium text-zinc-500 transition-all hover:border-emerald-500/30 hover:text-emerald-400"><BookOpen size={11} /> Wiki</Link>
            <Link to="/empire" className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 px-2.5 py-1.5 text-[10px] font-medium text-zinc-500 transition-all hover:border-emerald-500/30 hover:text-emerald-400"><Crown size={11} /> Empire</Link>
            <Link to="/samantha" className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/20 px-2.5 py-1.5 text-[10px] font-medium text-rose-400/60 transition-all hover:border-rose-500/30 hover:text-rose-400"><Sparkles size={11} /> Samantha</Link>
            <div className={cn("flex items-center gap-2 rounded-full border px-3 py-1", health === "healthy" ? "border-emerald-500/30 bg-emerald-500/10" : health === "critical" ? "border-red-500/30 bg-red-500/10" : health === "degraded" ? "border-amber-500/30 bg-amber-500/10" : "border-zinc-700")}>
              {health === "checking" ? <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-500" /> : health === "healthy" ? <CheckCircle2 size={12} className="text-emerald-400" /> : health === "critical" ? <XCircle size={12} className="text-red-400" /> : <AlertTriangle size={12} className="text-amber-400" />}
              <span className={cn("text-[11px] font-medium", health === "healthy" ? "text-emerald-400" : health === "critical" ? "text-red-400" : health === "degraded" ? "text-amber-400" : "text-zinc-500")}>{health === "checking" ? "Checking…" : health === "healthy" ? "All Systems Go" : health === "critical" ? "Critical" : "Degraded"}</span>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1 mb-6 sm:mb-8 overflow-x-auto scrollbar-none">
          {TABS.map(t => { const I = t.icon; return (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-medium transition-all whitespace-nowrap", tab === t.id ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300")}><I size={13} />{t.label}</button>
          ); })}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {tab === "overview" && (
              <div className="space-y-6 sm:space-y-8">
                <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-6">
                  <KpiCard label="Services" value={`${onSvc}/${checks.length}`} sub="Supabase endpoints" color="blue" />
                  <KpiCard label="Spine" value={`${onSp}/7`} sub="Empire layers" color="emerald" />
                  <KpiCard label="Security" value={grade} sub={`${SECURITY_ISSUES.length} issues`} color={secColor} />
                  <KpiCard label="Roadmap" value={`${stats.progress}%`} sub={`${stats.done}/${stats.total} done`} color="purple" />
                  <KpiCard label="Workflows" value={String(WORKFLOWS.length)} sub="registered" color="amber" />
                  <KpiCard label="DB Issues" value={dbLoading ? "…" : String(openDbIssues)} sub="live from Supabase" color={openDbIssues > 0 ? "red" : "emerald"} />
                </div>
                <SpineRow layers={spine} checking={sC} onRefresh={runS} />
                <SvcRow checks={checks} checking={hC} onRefresh={runH} lastChecked={lastChecked} />
                <LatencyChart data={allLatency} />
                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 sm:p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-1">Connected Services</p><p className="text-lg sm:text-xl font-bold font-mono text-cyan-400">{CONNECTED_SERVICES.length}</p></div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 sm:p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-1">Deploy Pipelines</p><p className="text-lg sm:text-xl font-bold font-mono text-emerald-400">2</p><p className="text-[10px] text-zinc-600">CF Pages + Vercel</p></div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 sm:p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-1">P0 Open</p><p className={cn("text-lg sm:text-xl font-bold font-mono", stats.p0Open > 0 ? "text-red-400" : "text-emerald-400")}>{stats.p0Open}</p><p className="text-[10px] text-zinc-600">critical priority</p></div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 sm:p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-1">Performance</p><p className="text-lg sm:text-xl font-bold font-mono text-amber-400">{PERFORMANCE_ISSUES.length}</p><p className="text-[10px] text-zinc-600">bottlenecks</p></div>
                </div>
              </div>
            )}
            {tab === "architecture" && <NetworkTopology />}
            {tab === "health" && <SecurityPanel dbIssues={dbIssues} dbLoading={dbLoading} toggleIssue={toggleIssue} />}
            {tab === "database" && <DatabaseOverview />}
            {tab === "services" && <ServicesGrid />}
            {tab === "roadmap" && <RoadmapPanel dbIssues={dbIssues} dbLoading={dbLoading} toggleIssue={toggleIssue} />}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-12 sm:mt-16 pb-8 flex items-center justify-between text-[10px] text-zinc-600 border-t border-zinc-800/50 pt-4">
          <span>Hans van Leeuwen · AI Empire</span>
          <div className="flex items-center gap-3">
            <Link to="/wiki" className="text-zinc-500 hover:text-emerald-400 transition-colors">Full Documentation →</Link>
            <span className="font-mono">v2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
