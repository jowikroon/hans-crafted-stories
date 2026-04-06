import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Search, History, CheckSquare, BarChart3, Loader2, ExternalLink, ChevronDown } from "lucide-react";
import type { SeoAudit, SeoActionItem, SeoView } from "@/types/seo";

const N8N_WEBHOOK = "https://n8n.srv1402218.hstgr.cloud/webhook/site-audit";

const GRADE_COLORS: Record<string, string> = {
  A: "text-emerald-400",
  B: "text-blue-400",
  C: "text-amber-400",
  D: "text-orange-400",
  F: "text-red-400",
};

function gradeFor(score: number): string {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

function domainFrom(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const NAV_ITEMS: { id: SeoView; label: string; icon: typeof Search }[] = [
  { id: "audit", label: "New Audit", icon: Search },
  { id: "history", label: "History", icon: History },
  { id: "actions", label: "Actions", icon: CheckSquare },
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
];

const SeoCMS = () => {
  const { user, loading: authLoading } = useAuth();
  const [view, setView] = useState<SeoView>("audit");

  // Audit state
  const [auditUrl, setAuditUrl] = useState("https://");
  const [running, setRunning] = useState(false);
  const [pollingId, setPollingId] = useState<string | null>(null);
  const [currentAudit, setCurrentAudit] = useState<SeoAudit | null>(null);

  // Data state
  const [audits, setAudits] = useState<SeoAudit[]>([]);
  const [actions, setActions] = useState<SeoActionItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);

  const loadAudits = useCallback(async () => {
    const { data } = await supabase
      .from("seo_audits")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setAudits(data as unknown as SeoAudit[]);
  }, []);

  const loadActions = useCallback(async () => {
    const { data } = await supabase
      .from("seo_action_items")
      .select("*")
      .in("status", ["open", "in_progress"])
      .order("priority_order", { ascending: true })
      .limit(100);
    if (data) setActions(data as unknown as SeoActionItem[]);
  }, []);

  useEffect(() => {
    async function init() {
      setLoadingData(true);
      await Promise.all([loadAudits(), loadActions()]);
      setLoadingData(false);
    }
    init();
  }, [loadAudits, loadActions]);

  // Poll for audit completion
  useEffect(() => {
    if (!pollingId) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("seo_audits")
        .select("*")
        .eq("id", pollingId)
        .single();
      if (data) {
        const audit = data as unknown as SeoAudit;
        setCurrentAudit(audit);
        if (audit.status === "completed" || audit.status === "failed") {
          setPollingId(null);
          setRunning(false);
          await loadAudits();
          await loadActions();
          if (audit.status === "completed") {
            toast.success(`Audit complete: ${audit.overall_score}/100`);
          } else {
            toast.error("Audit failed: " + (audit.error_message || "Unknown error"));
          }
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pollingId, loadAudits, loadActions]);

  async function runAudit() {
    if (!auditUrl || !auditUrl.startsWith("http")) {
      toast.error("Enter a valid URL starting with http:// or https://");
      return;
    }
    setRunning(true);
    setCurrentAudit(null);
    try {
      const resp = await fetch(N8N_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: auditUrl, send_email: false }),
      });
      const result = await resp.json();
      if (result.audit_id) {
        setPollingId(result.audit_id);
        toast.info("Audit started, polling for results...");
      } else if (result.overall_score !== undefined) {
        // Webhook returned full result (synchronous)
        setRunning(false);
        await loadAudits();
        await loadActions();
        toast.success(`Audit complete: ${result.overall_score}/100`);
      } else {
        setRunning(false);
        toast.error("Unexpected response from audit webhook");
      }
    } catch (err: unknown) {
      setRunning(false);
      const msg = err instanceof Error ? err.message : "Network error";
      toast.error(msg);
    }
  }

  async function markActionDone(id: string) {
    await supabase
      .from("seo_action_items")
      .update({ status: "done", completed_at: new Date().toISOString() })
      .eq("id", id);
    setActions((prev) => prev.filter((a) => a.id !== id));
    toast.success("Action marked as done");
  }

  async function dismissAction(id: string) {
    await supabase
      .from("seo_action_items")
      .update({ status: "dismissed" })
      .eq("id", id);
    setActions((prev) => prev.filter((a) => a.id !== id));
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <p className="text-lg text-white/60">Sign in to access SEO CMS</p>
          <a href="/portal" className="mt-4 inline-block text-teal-400 hover:underline">Go to login</a>
        </div>
      </div>
    );
  }

  // Group audits by domain
  const auditsByDomain: Record<string, SeoAudit[]> = {};
  audits.forEach((a) => {
    const domain = domainFrom(a.url);
    if (!auditsByDomain[domain]) auditsByDomain[domain] = [];
    auditsByDomain[domain].push(a);
  });

  // Dashboard stats
  const completedAudits = audits.filter((a) => a.status === "completed");
  const avgScore = completedAudits.length
    ? Math.round(completedAudits.reduce((s, a) => s + (a.overall_score || 0), 0) / completedAudits.length)
    : 0;
  const openActions = actions.length;
  const criticalActions = actions.filter((a) => a.severity === "critical").length;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Sidebar */}
      <aside className="fixed left-4 top-24 z-40 flex w-56 flex-col gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 backdrop-blur-xl">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-400/80">
          SEO CMS
        </p>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              view === id
                ? "bg-white/[0.08] text-white shadow-sm"
                : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 px-8 pb-20 pt-28">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* ── NEW AUDIT ── */}
          {view === "audit" && (
            <div className="max-w-2xl">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-400">
                New Audit
              </p>
              <h1 className="mb-2 text-3xl font-medium tracking-tight text-white/90">
                Run SEO Audit
              </h1>
              <p className="mb-8 text-sm text-white/40">
                Enter a URL to run a full technical and content SEO analysis.
              </p>

              <div className="flex gap-3">
                <input
                  value={auditUrl}
                  onChange={(e) => setAuditUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !running && runAudit()}
                  placeholder="https://example.com"
                  className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-teal-400/30 focus:outline-none focus:ring-2 focus:ring-teal-400/10"
                />
                <button
                  onClick={runAudit}
                  disabled={running}
                  className="flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-teal-400 disabled:opacity-50"
                >
                  {running ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  {running ? "Running..." : "Run Audit"}
                </button>
              </div>

              {/* Progress / Result */}
              {running && currentAudit && (
                <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Loader2 size={16} className="animate-spin text-teal-400" />
                    <span className="text-sm text-white/60">
                      Status: <span className="text-teal-400">{currentAudit.status}</span>
                    </span>
                  </div>
                  <p className="text-xs text-white/30">Polling every 3 seconds...</p>
                </div>
              )}

              {!running && currentAudit?.status === "completed" && (
                <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white/90">Result</h3>
                    <span className={`text-3xl font-bold ${GRADE_COLORS[gradeFor(currentAudit.overall_score || 0)]}`}>
                      {currentAudit.overall_score}/100
                    </span>
                  </div>
                  {currentAudit.report_html && (
                    <div className="prose prose-invert prose-sm max-h-96 overflow-y-auto rounded-lg bg-white/[0.02] p-4 text-white/70">
                      <pre className="whitespace-pre-wrap text-xs font-sans">{currentAudit.report_html}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── HISTORY ── */}
          {view === "history" && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-400">
                History
              </p>
              <h1 className="mb-8 text-3xl font-medium tracking-tight text-white/90">
                Past Audits
              </h1>

              {loadingData ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-white/[0.04]" />
                  ))}
                </div>
              ) : Object.keys(auditsByDomain).length === 0 ? (
                <p className="text-sm text-white/30">No audits yet. Run one from New Audit.</p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(auditsByDomain).map(([domain, domainAudits]) => (
                    <div key={domain}>
                      <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-white/60">
                        <ExternalLink size={14} />
                        {domain}
                        <span className="text-xs text-white/30">({domainAudits.length} audits)</span>
                      </h2>
                      <div className="space-y-2">
                        {domainAudits.map((audit) => {
                          const score = audit.overall_score || 0;
                          const grade = gradeFor(score);
                          const isExpanded = expandedAudit === audit.id;
                          return (
                            <div key={audit.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
                              <button
                                onClick={() => setExpandedAudit(isExpanded ? null : audit.id)}
                                className="flex w-full items-center gap-4 p-4 text-left"
                              >
                                <div className={`text-xl font-bold tabular-nums ${GRADE_COLORS[grade]}`}>
                                  {audit.status === "completed" ? score : "--"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-white/80 truncate">{audit.url}</p>
                                  <p className="text-xs text-white/30">
                                    {new Date(audit.created_at).toLocaleDateString("nl-NL", {
                                      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                                    })}
                                    {" "}&middot;{" "}{audit.audit_type}
                                    {" "}&middot;{" "}
                                    <span className={audit.status === "completed" ? "text-emerald-400" : audit.status === "failed" ? "text-red-400" : "text-amber-400"}>
                                      {audit.status}
                                    </span>
                                  </p>
                                </div>
                                <ChevronDown size={16} className={`text-white/30 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              </button>
                              {isExpanded && audit.report_html && (
                                <div className="border-t border-white/[0.04] p-4">
                                  <pre className="whitespace-pre-wrap text-xs text-white/60 font-sans max-h-80 overflow-y-auto">
                                    {audit.report_html}
                                  </pre>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ACTIONS ── */}
          {view === "actions" && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-400">
                Actions
              </p>
              <h1 className="mb-2 text-3xl font-medium tracking-tight text-white/90">
                Open Action Items
              </h1>
              <p className="mb-8 text-sm text-white/40">
                {openActions} open items, {criticalActions} critical
              </p>

              {loadingData ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
                  ))}
                </div>
              ) : actions.length === 0 ? (
                <p className="text-sm text-white/30">No open action items. Run an audit to generate them.</p>
              ) : (
                <div className="space-y-2">
                  {actions.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            item.severity === "critical"
                              ? "bg-red-500/10 text-red-400"
                              : item.severity === "high"
                              ? "bg-orange-500/10 text-orange-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}>
                            {item.severity}
                          </span>
                          <span className="text-[10px] text-white/20 uppercase">{item.source_type.replace(/_/g, " ")}</span>
                        </div>
                        <p className="text-sm text-white/80">{item.title}</p>
                        <p className="mt-1 text-xs text-white/30">{domainFrom(item.url)}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => markActionDone(item.id)}
                          className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                          Done
                        </button>
                        <button
                          onClick={() => dismissAction(item.id)}
                          className="rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── DASHBOARD ── */}
          {view === "dashboard" && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-400">
                Dashboard
              </p>
              <h1 className="mb-8 text-3xl font-medium tracking-tight text-white/90">
                SEO Overview
              </h1>

              {/* Stats cards */}
              <div className="mb-8 grid grid-cols-4 gap-4">
                {[
                  { label: "Total Audits", value: completedAudits.length },
                  { label: "Avg Score", value: avgScore },
                  { label: "Open Actions", value: openActions },
                  { label: "Critical", value: criticalActions },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <p className="text-xs text-white/30">{label}</p>
                    <p className="mt-1 text-2xl font-semibold text-white/90">{value}</p>
                  </div>
                ))}
              </div>

              {/* Per-site summary */}
              <h2 className="mb-4 text-sm font-medium text-white/60">Per-site Summary</h2>
              {Object.keys(auditsByDomain).length === 0 ? (
                <p className="text-sm text-white/30">No data yet.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(auditsByDomain).map(([domain, domainAudits]) => {
                    const completed = domainAudits.filter((a) => a.status === "completed");
                    const latest = completed[0];
                    const latestScore = latest?.overall_score || 0;
                    const grade = gradeFor(latestScore);
                    const domainActions = actions.filter((a) => domainFrom(a.url) === domain);
                    return (
                      <div
                        key={domain}
                        className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
                      >
                        <div className={`text-2xl font-bold tabular-nums ${GRADE_COLORS[grade]}`}>
                          {completed.length > 0 ? latestScore : "--"}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white/80">{domain}</p>
                          <p className="text-xs text-white/30">
                            {completed.length} audits &middot; {domainActions.length} open actions
                            {latest && (
                              <> &middot; Last: {new Date(latest.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</>
                            )}
                          </p>
                        </div>
                        {completed.length >= 2 && (() => {
                          const prev = completed[1]?.overall_score || 0;
                          const diff = latestScore - prev;
                          if (diff === 0) return null;
                          return (
                            <span className={`text-xs font-medium ${diff > 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {diff > 0 ? "+" : ""}{diff}
                            </span>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Recent critical issues */}
              {completedAudits.length > 0 && (
                <>
                  <h2 className="mb-4 mt-8 text-sm font-medium text-white/60">Recent Critical Issues</h2>
                  <div className="space-y-2">
                    {completedAudits
                      .flatMap((a) =>
                        (a.critical_issues || []).slice(0, 3).map((issue) => ({
                          issue,
                          domain: domainFrom(a.url),
                          date: a.created_at,
                        }))
                      )
                      .slice(0, 8)
                      .map((item, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg bg-red-500/[0.04] border border-red-500/10 px-4 py-3">
                          <span className="text-xs text-red-400/60">{item.domain}</span>
                          <span className="text-sm text-white/60">{item.issue}</span>
                        </div>
                      ))}
                    {completedAudits.every((a) => !a.critical_issues?.length) && (
                      <p className="text-sm text-white/30">No critical issues found.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default SeoCMS;
