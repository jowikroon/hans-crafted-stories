import { useState } from "react";
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const testResults = [
  { id: "P01", prompt: "optimize my product titles for SEO", expected: "autoseo", result: "autoseo", confidence: 0.95, status: "pass" },
  { id: "P02", prompt: "rewrite product titles", expected: "product-titles", result: "product-titles", confidence: 0.95, status: "pass" },
  { id: "P03", prompt: "improve ranking for brake pads", expected: "autoseo (fuzzy)", result: "autoseo", confidence: 0.17, status: "pass" },
  { id: "P04", prompt: "run autoseo", expected: "autoseo", result: "autoseo", confidence: 0.90, status: "pass" },
  { id: "P05", prompt: "product title optimizer", expected: "product-titles", result: "product-titles", confidence: 0.90, status: "pass" },
  { id: "P06", prompt: "optimize product feed", expected: "product-feed", result: "product-feed", confidence: 0.95, status: "pass" },
  { id: "P07", prompt: "sync channable feeds", expected: "product-feed", result: "product-feed", confidence: 0.86, status: "pass" },
  { id: "P08", prompt: "export products to google shopping", expected: "product-feed", result: "product-feed", confidence: 0.72, status: "pass" },
  { id: "P09", prompt: "update product catalog", expected: "product-feed", result: "product-feed", confidence: 0.57, status: "pass" },
  { id: "P10", prompt: "scrape competitor prices", expected: "scraper", result: "scraper", confidence: 0.63, status: "pass" },
  { id: "P11", prompt: "get competitor data from bol.com", expected: "scraper", result: "scraper", confidence: 0.55, status: "pass" },
  { id: "P12", prompt: "monitor competitor pricing", expected: "scraper", result: "scraper", confidence: 0.55, status: "pass" },
  { id: "P13", prompt: "create a marketing campaign", expected: "campaign", result: "campaign", confidence: 0.71, status: "pass" },
  { id: "P14", prompt: "launch google ads campaign", expected: "campaign", result: "campaign", confidence: 0.90, status: "pass" },
  { id: "P15", prompt: "generate ad copy for brake pads", expected: "campaign", result: "campaign", confidence: 0.43, status: "pass" },
  { id: "P16", prompt: "check system health", expected: "health-check", result: "health-check", confidence: 0.86, status: "pass" },
  { id: "P17", prompt: "are all services up", expected: "health-check", result: "health-check", confidence: 0.71, status: "pass" },
  { id: "P18", prompt: "hello, what can you do?", expected: "miss (AI chat)", result: "miss", confidence: 0.0, status: "pass" },
  { id: "P19", prompt: "what is my best selling product?", expected: "miss (AI chat)", result: "miss", confidence: 0.08, status: "pass" },
  { id: "P20", prompt: "check my gmail", expected: "google", result: "google", confidence: 0.63, status: "pass" },
];

const architecture = {
  pages: [
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
  ],
  workflows: [
    { name: "autoseo", label: "AutoSEO Brain", category: "seo", keywords: 12 },
    { name: "product-titles", label: "Product Title Optimizer", category: "seo", keywords: 7 },
    { name: "health-check", label: "Health Check", category: "infra", keywords: 7 },
    { name: "product-feed", label: "Product Feed Optimizer", category: "data", keywords: 7 },
    { name: "campaign", label: "Campaign Generator", category: "marketing", keywords: 7 },
    { name: "scraper", label: "Web Scraper", category: "data", keywords: 11 },
    { name: "monday-orchestrator", label: "Monday.com Orchestrator", category: "ai", keywords: 6 },
    { name: "google", label: "Google (Gmail/Sheets/Drive)", category: "ai", keywords: 8 },
  ],
  edgeFunctions: 20,
  i18n: ["en", "nl"],
};

const issues = [
  { severity: "critical", area: "Build", issue: "App.js chunk 1.25MB — needs code splitting", impact: "Slow initial load, poor Core Web Vitals", fix: "Dynamic imports for Portal, HansAI, Empire, Wiki pages" },
  { severity: "critical", area: "SEO", issue: "SPA with client-side rendering only", impact: "Search engines may not index dynamic content", fix: "SSR/prerendering via Cloudflare Pages Functions or static injection" },
  { severity: "high", area: "Router", issue: "3 of 20 e-commerce prompts failed initial routing", impact: "Users hitting AI fallback for valid workflow requests", fix: "Expanded keywords for scraper + autoseo (FIXED in this session)" },
  { severity: "high", area: "Deploy", issue: "Gap between workflow design and deployment", impact: "n8n instances showing empty despite designs existing", fix: "Automated workflow import via n8n API on deploy" },
  { severity: "medium", area: "UX", issue: "No CTA on homepage for backend dashboard", impact: "Visitors can't discover the Command Center", fix: "Add subtle 'Login' or 'Dashboard' entry point" },
  { severity: "medium", area: "Perf", issue: "Logo PNG 1.4MB, profile JPG 716KB unoptimized", impact: "Slow hero section load", fix: "WebP conversion, responsive srcset, lazy loading" },
  { severity: "medium", area: "Intent", issue: "LLM fallback uses Lovable gateway (external dependency)", impact: "Single point of failure for intent classification", fix: "Route through Ollama on VPS2 when deployed" },
  { severity: "low", area: "Test", issue: "Only 51 tests — no integration or E2E coverage", impact: "Regressions in portal/auth/content flows", fix: "Add Playwright E2E for critical paths" },
  { severity: "low", area: "DX", issue: "Both .cjs and .js versions of scripts maintained", impact: "Maintenance overhead", fix: "Consolidate to ESM-only with proper package.json type:module" },
];

type Category = "seo" | "data" | "infra" | "marketing" | "ai";

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

const passRate = testResults.filter((t) => t.status === "pass").length;
const avgConfidence = testResults.filter((t) => t.result !== "miss").reduce((a, t) => a + t.confidence, 0) / testResults.filter((t) => t.result !== "miss").length;

/* ─── Sub-panels ─── */

const OverviewPanel = () => (
  <div className="space-y-6">
    {/* KPI Grid */}
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {[
        { label: "Test Pass Rate", value: `${passRate}/20`, sub: "e-commerce prompts", cls: "text-emerald-400" },
        { label: "Avg Confidence", value: `${(avgConfidence * 100).toFixed(0)}%`, sub: "matched workflows", cls: "text-blue-400" },
        { label: "Workflows", value: "8", sub: "active in registry", cls: "text-amber-400" },
        { label: "Edge Functions", value: "20", sub: "deployed", cls: "text-violet-400" },
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
        <p className="text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Stack:</strong> Vite + React + TypeScript + shadcn/ui → Cloudflare Pages. Supabase (auth, DB, 20 edge functions). n8n (Hostinger VPS) for workflow automation. Intent pipeline: fastRoute (keyword) → LLM classify → AI chat fallback.</p>
        <p className="text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Pages:</strong> 10 routes — 6 public (SEO-indexed), 4 private (noindex). Bilingual (EN/NL). Supabase-backed CMS for content, case studies, blog posts.</p>
        <p className="text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Command Center:</strong> Terminal-style interface at /hansai with slash commands, AI chat (streaming), intent classification, n8n workflow triggers, campaign builder, prompt builder, hierarchy-based context filtering (3-layer BJ Fogg model).</p>
        <p className="text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Changes this session:</strong> Expanded scraper keywords (prices, monitor, watch, track) and autoseo keywords (rank, improve, boost, keywords). Added 6 new workflow examples. Created 36-test e-commerce prompt suite. All 51 tests pass. Build compiles cleanly.</p>
      </CardContent>
    </Card>

    {/* Issue Distribution */}
    <Card className="border-border/60">
      <CardContent className="p-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400 mb-3">Issue Distribution</h3>
        <div className="flex flex-wrap gap-4">
          {(Object.entries({ critical: 2, high: 2, medium: 3, low: 2 }) as [string, number][]).map(([sev, count]) => (
            <div key={sev} className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-sm ${severityDotClasses[sev]}`} />
              <span className="text-xs text-muted-foreground">{sev}: <strong className="text-foreground">{count}</strong></span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

const TestResultsPanel = () => (
  <div className="space-y-4">
    <p className="text-[11px] text-muted-foreground">20 e-commerce prompts tested against fastRoute intent router · All {passRate} passing</p>
    <div className="overflow-x-auto rounded-lg border border-border/60">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/60 bg-secondary/40">
            {["ID", "Prompt", "Expected", "Matched", "Conf.", ""].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {testResults.map((t, i) => {
            const wf = architecture.workflows.find((w) => w.name === t.result);
            const cat = wf?.category as Category | undefined;
            return (
              <tr key={t.id} className={`border-b border-border/30 ${i % 2 === 0 ? "" : "bg-secondary/20"}`}>
                <td className="px-3 py-1.5 font-semibold text-muted-foreground">{t.id}</td>
                <td className="px-3 py-1.5 text-foreground/80 max-w-[320px]">{t.prompt}</td>
                <td className="px-3 py-1.5 text-muted-foreground">{t.expected}</td>
                <td className="px-3 py-1.5">
                  <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${t.result === "miss" ? "bg-muted text-muted-foreground" : cat ? categoryClasses[cat] : "bg-muted text-muted-foreground"}`}>
                    {t.result}
                  </span>
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-10 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full rounded-full ${t.confidence >= 0.85 ? "bg-emerald-400" : t.confidence >= 0.5 ? "bg-amber-400" : "bg-red-400"}`}
                        style={{ width: `${t.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{(t.confidence * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td className="px-3 py-1.5">
                  {t.status === "pass" ? <CheckCircle size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-red-400" />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

const IssuesPanel = () => {
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  return (
    <div className="space-y-4">
      <p className="text-[11px] text-muted-foreground">9 issues identified · 2 critical · 2 high · 3 medium · 2 low</p>
      <div className="space-y-2">
        {issues.map((issue, i) => (
          <Card
            key={i}
            className={`cursor-pointer border-border/60 transition-colors ${expandedIssue === i ? "border-border" : "hover:border-border/80"}`}
            onClick={() => setExpandedIssue(expandedIssue === i ? null : i)}
          >
            <CardContent className="p-3.5">
              <div className="flex items-center gap-2.5">
                <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${severityClasses[issue.severity]}`}>
                  {issue.severity}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">[{issue.area}]</span>
                <span className="flex-1 text-xs text-foreground/80">{issue.issue}</span>
                {expandedIssue === i ? <ChevronUp size={14} className="text-muted-foreground/40" /> : <ChevronDown size={14} className="text-muted-foreground/40" />}
              </div>
              {expandedIssue === i && (
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
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400 mb-3">Routes ({architecture.pages.length})</h3>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {architecture.pages.map((p) => (
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

    {/* Workflows */}
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400 mb-3">Workflow Registry ({architecture.workflows.length})</h3>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {architecture.workflows.map((w) => (
          <Card key={w.name} className="border-border/60">
            <CardContent className="flex items-center justify-between p-3">
              <div>
                <span className="text-xs font-semibold text-foreground">{w.label}</span>
                <span className="ml-2 text-[10px] text-muted-foreground/50">{w.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground/50">{w.keywords} kw</span>
                <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${categoryClasses[w.category as Category]}`}>{w.category}</span>
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
            <div><strong className="text-foreground">Backend:</strong> Supabase (Postgres, Auth, Edge Functions), n8n (Hostinger VPS)</div>
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
  const normalized = subFilter.toLowerCase().replace(/\s+/g, "-");
  switch (normalized) {
    case "overview": return <OverviewPanel />;
    case "test-results": return <TestResultsPanel />;
    case "issues": return <IssuesPanel />;
    case "architecture": return <ArchitecturePanel />;
    default: return <OverviewPanel />;
  }
};

export default AnalysisDashboard;
