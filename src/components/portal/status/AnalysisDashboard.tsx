import { useState, useEffect, useMemo } from "react";
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Loader2, Download, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { WORKFLOWS, type WorkflowDef } from "@/lib/config/workflows";

/* ─── Static data that mirrors the codebase (update when routes change) ─── */

const EDGE_FUNCTION_COUNT = 20; // supabase/functions — counted at build time

const ROUTES = [
  { path: "/", name: "Home", public: true, seo: true },
  { path: "/work", name: "Work / Case Studies", public: true, seo: true },
  { path: "/writing", name: "Blog / Writing", public: true, seo: true },
  { path: "/writing/:slug", name: "Blog Post", public: true, seo: true },
  { path: "/about", name: "About + Contact", public: true, seo: true },
  { path: "/privacy", name: "Privacy Policy", public: true, seo: true },
  { path: "/portal", name: "Admin Portal", public: false, seo: false },
  { path: "/hansai", name: "Command Center", public: false, seo: false },
  { path: "/empire", name: "Empire Dashboard", public: false, seo: false },
  { path: "/wiki", name: "System Wiki", public: false, seo: false },
];

/* ─── Live issues from DB ─── */

interface SystemIssue {
  id: string;
  severity: string;
  area: string;
  issue: string;
  impact: string;
  fix: string;
  is_resolved: boolean;
  sort_order: number;
}

function useSystemIssues() {
  const [issues, setIssues] = useState<SystemIssue[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIssues = async () => {
    try {
      const { data, error } = await (supabase
        .from("system_issues" as any)
        .select("*")
        .order("sort_order", { ascending: true }) as any);
      if (!error && data) setIssues(data as SystemIssue[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIssues(); }, []);

  const toggleResolved = async (id: string, current: boolean) => {
    await (supabase.from("system_issues" as any).update({ is_resolved: !current } as any).eq("id", id) as any);
    setIssues(prev => prev.map(i => i.id === id ? { ...i, is_resolved: !current } : i));
  };

  const deleteIssue = async (id: string) => {
    await (supabase.from("system_issues" as any).delete().eq("id", id) as any);
    setIssues(prev => prev.filter(i => i.id !== id));
  };

  return { issues, loading, toggleResolved, deleteIssue, refetch: fetchIssues };
}

/* ─── Derived from WORKFLOWS config ─── */

type Category = WorkflowDef["category"];

const categoryClasses: Record<Category, string> = {
  seo: "bg-emerald-500/15 text-emerald-400",
  data: "bg-blue-500/15 text-blue-400",
  infra: "bg-violet-500/15 text-violet-400",
  marketing: "bg-amber-500/15 text-amber-400",
  ai: "bg-pink-500/15 text-pink-400",
};

const severityClasses: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400",
  high: "bg-orange-500/15 text-orange-400",
  medium: "bg-yellow-500/15 text-yellow-400",
  low: "bg-muted text-muted-foreground",
};

const severityDotClasses: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-muted-foreground",
};

/* ─── Live intent data from DB ─── */

interface IntentRow {
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

function useIntentData() {
  const [rows, setRows] = useState<IntentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Fetch last 50 intents (both resolved and unresolved) for analysis
        const { data, error } = await (supabase
          .from("unhandled_intents" as any)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50) as any);
        if (!error && data) setRows(data as IntentRow[]);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { rows, loading };
}

/* ─── Helper ─── */

function computeIssueDistribution(issues: SystemIssue[]) {
  return issues.reduce<Record<string, number>>((acc, i) => {
    acc[i.severity] = (acc[i.severity] || 0) + 1;
    return acc;
  }, {});
}

/* ─── Sub-panels ─── */

const OverviewPanel = ({ intents, intentsLoading, issues, issuesLoading }: { intents: IntentRow[]; intentsLoading: boolean; issues: SystemIssue[]; issuesLoading: boolean }) => {
  const resolvedCount = intents.filter((i) => i.resolved).length;
  const unresolvedCount = intents.filter((i) => !i.resolved).length;
  const withScore = intents.filter((i) => i.fast_route_score != null && i.fast_route_score > 0);
  const avgScore = withScore.length > 0
    ? withScore.reduce((a, i) => a + (i.fast_route_score || 0), 0) / withScore.length
    : 0;
  const issueDistribution = computeIssueDistribution(issues);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Workflows", value: String(WORKFLOWS.length), sub: "active in registry", cls: "text-amber-400" },
          { label: "Edge Functions", value: String(EDGE_FUNCTION_COUNT), sub: "deployed", cls: "text-violet-400" },
          { label: "Intents Tracked", value: intentsLoading ? "…" : String(intents.length), sub: `${resolvedCount} resolved · ${unresolvedCount} open`, cls: "text-emerald-400" },
          { label: "Avg Route Score", value: intentsLoading ? "…" : `${(avgScore * 100).toFixed(0)}%`, sub: `${withScore.length} scored intents`, cls: "text-blue-400" },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-border/60">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-2">{kpi.label}</p>
              <p className={`text-2xl font-bold leading-none ${kpi.cls}`}>{kpi.value}</p>
              <p className="mt-1 text-[10px] text-muted-foreground/50">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Summary */}
      <Card className="border-border/60">
        <CardContent className="p-5 space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400 mb-3">System Summary</h3>
          <p className="text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Stack:</strong> Vite + React + TypeScript + shadcn/ui → Cloudflare Pages. Supabase (auth, DB, {EDGE_FUNCTION_COUNT} edge functions). n8n (Hostinger VPS) for workflow automation. Intent pipeline: fastRoute (keyword) → LLM classify → AI chat fallback.</p>
          <p className="text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Pages:</strong> {ROUTES.length} routes — {ROUTES.filter(r => r.public).length} public (SEO-indexed), {ROUTES.filter(r => !r.public).length} private (noindex). Bilingual (EN/NL). Supabase-backed CMS for content, case studies, blog posts.</p>
          <p className="text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Workflows:</strong> {WORKFLOWS.length} registered — {WORKFLOWS.map(w => w.category).filter((v, i, a) => a.indexOf(v) === i).join(", ")} categories. Total {WORKFLOWS.reduce((a, w) => a + w.keywords.length, 0)} keywords mapped.</p>
          <p className="text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Command Center:</strong> Terminal-style interface at /hansai with slash commands, AI chat (streaming), intent classification, n8n workflow triggers, campaign builder, prompt builder, hierarchy-based context filtering (3-layer BJ Fogg model).</p>
        </CardContent>
      </Card>

      {/* Issue Distribution */}
      <Card className="border-border/60">
        <CardContent className="p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400 mb-3">Issue Distribution</h3>
          {issuesLoading ? (
            <span className="text-xs text-muted-foreground">Loading…</span>
          ) : (
            <div className="flex flex-wrap gap-4">
              {(Object.entries(issueDistribution) as [string, number][]).map(([sev, count]) => (
                <div key={sev} className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-sm ${severityDotClasses[sev] || "bg-muted-foreground"}`} />
                  <span className="text-xs text-muted-foreground">{sev}: <strong className="text-foreground">{count}</strong></span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const TestResultsPanel = ({ intents, loading }: { intents: IntentRow[]; loading: boolean }) => {
  const workflowMap = useMemo(() => {
    const map = new Map<string, WorkflowDef>();
    WORKFLOWS.forEach(w => map.set(w.name, w));
    return map;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
        <span className="ml-2 text-xs text-muted-foreground">Loading intent data…</span>
      </div>
    );
  }

  const resolvedCount = intents.filter(i => i.resolved).length;

  const exportCSV = () => {
    const headers = ["#", "User Input", "Source", "Route Score", "LLM Intent", "Resolved Workflow", "Status", "Created At"];
    const csvRows = [headers.join(",")];
    intents.forEach((intent, i) => {
      const row = [
        i + 1,
        `"${(intent.user_input || "").replace(/"/g, '""')}"`,
        intent.source,
        ((intent.fast_route_score ?? 0) * 100).toFixed(0) + "%",
        intent.llm_intent || "",
        intent.resolved_workflow || "",
        intent.resolved ? "resolved" : "open",
        intent.created_at,
      ];
      csvRows.push(row.join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `intent-results-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          {intents.length} intent routing attempts · {resolvedCount} resolved · Live data from database
        </p>
        <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 text-xs">
          <Download size={13} /> Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/60 bg-secondary/40">
              {["#", "User Input", "Source", "Route Score", "LLM Intent", "Status"].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {intents.map((intent, i) => {
              const wf = intent.resolved_workflow ? workflowMap.get(intent.resolved_workflow) : null;
              const cat = wf?.category as Category | undefined;
              const score = intent.fast_route_score ?? 0;
              return (
                <tr key={intent.id} className={`border-b border-border/30 ${i % 2 === 0 ? "" : "bg-secondary/20"}`}>
                  <td className="px-3 py-1.5 font-semibold text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-1.5 text-foreground/80 max-w-[320px] truncate">{intent.user_input}</td>
                  <td className="px-3 py-1.5">
                    <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-secondary text-muted-foreground">
                      {intent.source}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-10 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full ${score >= 0.85 ? "bg-emerald-400" : score >= 0.5 ? "bg-amber-400" : "bg-red-400"}`}
                          style={{ width: `${score * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{(score * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    {intent.resolved_workflow ? (
                      <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${cat ? categoryClasses[cat] : "bg-muted text-muted-foreground"}`}>
                        {intent.resolved_workflow}
                      </span>
                    ) : intent.llm_intent && intent.llm_intent !== "unknown" ? (
                      <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground">{intent.llm_intent}</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/40">unmatched</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    {intent.resolved ? (
                      <CheckCircle size={14} className="text-emerald-400" />
                    ) : (
                      <XCircle size={14} className="text-red-400" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const IssuesPanel = ({ issues, loading, toggleResolved, deleteIssue }: { issues: SystemIssue[]; loading: boolean; toggleResolved: (id: string, current: boolean) => void; deleteIssue: (id: string) => void }) => {
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const issueDistribution = computeIssueDistribution(issues);
  const summary = Object.entries(issueDistribution).map(([s, c]) => `${c} ${s}`).join(" · ");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
        <span className="ml-2 text-xs text-muted-foreground">Loading issues…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-muted-foreground">{issues.length} issues · {summary}</p>
      <div className="space-y-2">
        {issues.map((issue) => (
          <Card
            key={issue.id}
            className={`cursor-pointer border-border/60 transition-colors ${issue.is_resolved ? "opacity-50" : ""} ${expandedIssue === issue.id ? "border-border" : "hover:border-border/80"}`}
            onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
          >
            <CardContent className="p-3.5">
              <div className="flex items-center gap-2.5">
                <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${severityClasses[issue.severity]}`}>
                  {issue.severity}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">[{issue.area}]</span>
                <span className={`flex-1 text-xs text-foreground/80 ${issue.is_resolved ? "line-through" : ""}`}>{issue.issue}</span>
                <button
                  className="p-1 rounded hover:bg-secondary transition-colors"
                  title={issue.is_resolved ? "Mark open" : "Mark resolved"}
                  onClick={(e) => { e.stopPropagation(); toggleResolved(issue.id, issue.is_resolved); }}
                >
                  <Check size={13} className={issue.is_resolved ? "text-emerald-400" : "text-muted-foreground/40"} />
                </button>
                <button
                  className="p-1 rounded hover:bg-destructive/20 transition-colors"
                  title="Delete issue"
                  onClick={(e) => { e.stopPropagation(); deleteIssue(issue.id); }}
                >
                  <Trash2 size={13} className="text-muted-foreground/40 hover:text-destructive" />
                </button>
                {expandedIssue === issue.id ? <ChevronUp size={14} className="text-muted-foreground/40" /> : <ChevronDown size={14} className="text-muted-foreground/40" />}
              </div>
              {expandedIssue === issue.id && (
                <div className="mt-3 space-y-1.5 border-t border-border/40 pt-3">
                  <p className="text-xs"><span className="text-[10px] uppercase text-muted-foreground/60">Impact: </span><span className="text-muted-foreground">{issue.impact}</span></p>
                  <p className="text-xs"><span className="text-[10px] uppercase text-muted-foreground/60">Fix: </span><span className="text-emerald-400">{issue.fix}</span></p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const ArchitecturePanel = () => (
  <div className="space-y-6">
    {/* Routes */}
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400 mb-3">Routes ({ROUTES.length})</h3>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {ROUTES.map((p) => (
          <Card key={p.path} className="border-border/60">
            <CardContent className="flex items-center justify-between p-3">
              <div>
                <span className="text-xs font-semibold text-emerald-400">{p.path}</span>
                <span className="ml-2 text-xs text-muted-foreground">{p.name}</span>
              </div>
              <div className="flex gap-1.5">
                {p.public ? (
                  <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-500/15 text-emerald-400">public</span>
                ) : (
                  <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold bg-red-500/15 text-red-400">auth</span>
                )}
                {p.seo && <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold bg-blue-500/15 text-blue-400">SEO</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>

    {/* Workflows — live from WORKFLOWS config */}
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400 mb-3">Workflow Registry ({WORKFLOWS.length})</h3>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {WORKFLOWS.map((w) => (
          <Card key={w.name} className="border-border/60">
            <CardContent className="flex items-center justify-between p-3">
              <div>
                <span className="text-xs font-semibold text-foreground">{w.label}</span>
                <span className="ml-2 text-[10px] text-muted-foreground/50">{w.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground/50">{w.keywords.length} kw</span>
                <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${categoryClasses[w.category]}`}>{w.category}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>

    {/* Tech Stack */}
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400 mb-3">Tech Stack</h3>
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 text-xs text-muted-foreground md:grid-cols-3">
            <div><strong className="text-foreground">Frontend:</strong> Vite, React 18, TypeScript, shadcn/ui, Framer Motion, Tailwind</div>
            <div><strong className="text-foreground">Backend:</strong> Supabase (Postgres, Auth, {EDGE_FUNCTION_COUNT} Edge Functions), n8n (Hostinger VPS)</div>
            <div><strong className="text-foreground">Deploy:</strong> Cloudflare Pages, GitHub Actions, Cloudflare Functions</div>
            <div><strong className="text-foreground">AI:</strong> Lovable AI Gateway (Gemini 2.5 Flash), planned Ollama/Qwen local</div>
            <div><strong className="text-foreground">Infra:</strong> 2× Hostinger VPS, Docker, Traefik, Cloudflare DNS</div>
            <div><strong className="text-foreground">Languages:</strong> EN + NL (bilingual), all pages translatable</div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

/* ─── Main export ─── */

const AnalysisDashboard = ({ subFilter }: { subFilter: string }) => {
  const { rows: intents, loading: intentsLoading } = useIntentData();
  const { issues, loading: issuesLoading, toggleResolved, deleteIssue } = useSystemIssues();
  const normalized = subFilter.toLowerCase().replace(/\s+/g, "-");

  switch (normalized) {
    case "overview": return <OverviewPanel intents={intents} intentsLoading={intentsLoading} issues={issues} issuesLoading={issuesLoading} />;
    case "test-results": return <TestResultsPanel intents={intents} loading={intentsLoading} />;
    case "issues": return <IssuesPanel issues={issues} loading={issuesLoading} toggleResolved={toggleResolved} deleteIssue={deleteIssue} />;
    case "architecture": return <ArchitecturePanel />;
    default: return <OverviewPanel intents={intents} intentsLoading={intentsLoading} issues={issues} issuesLoading={issuesLoading} />;
  }
};

export default AnalysisDashboard;
