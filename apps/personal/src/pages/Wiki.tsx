import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import {
  ShieldAlert, BookOpen, Network, Layers, Database, Zap, Server, Brain, Activity,
  Shield, AlertTriangle, ArrowLeft, ChevronRight, ExternalLink, Lock,
  Gauge, GitBranch, Eye, Target,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import {
  INFRA_LAYERS, CONNECTED_SERVICES, DATABASE_TABLES, SECURITY_ISSUES,
  PERFORMANCE_ISSUES, ROADMAP, DATA_FLOWS, DEPLOY_PIPELINES,
  getRoadmapStats, getSecurityScore, getSeverityColor,
  getTextColor, getLayerBorderBg,
} from "@/lib/config/infrastructure";

const THEME_KEY = "site_theme";

const Wiki = () => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  useEffect(() => {
    const prev = localStorage.getItem(THEME_KEY) || "light";
    document.documentElement.classList.add("dark");
    localStorage.setItem(THEME_KEY, "dark");
    return () => { document.documentElement.classList.toggle("dark", prev === "dark"); localStorage.setItem(THEME_KEY, prev); };
  }, []);

  useEffect(() => {
    document.title = "Wiki — System Documentation";
    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robots) { robots = document.createElement("meta"); robots.name = "robots"; document.head.appendChild(robots); }
    robots.content = "noindex, nofollow";
    return () => { if (robots) robots.content = "index, follow"; };
  }, []);

  if (loading || adminLoading) {
    return (
      <section className="section-container flex min-h-[60vh] items-center justify-center pt-28" aria-live="polite">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">Loading documentation…</p>
        </div>
      </section>
    );
  }

  if (!user || !isAdmin) {
    return (
      <section className="section-container flex min-h-[60vh] flex-col items-center justify-center pt-28" aria-labelledby="access-denied-heading">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <ShieldAlert size={48} className="mx-auto mb-4 text-muted-foreground" aria-hidden />
          <h1 id="access-denied-heading" className="mb-2 font-display text-2xl font-semibold text-foreground">Access denied</h1>
          <p className="mb-6 text-sm text-muted-foreground">Admin access required to view system documentation.</p>
          <Link to="/portal" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"><ArrowLeft size={14} aria-hidden /> Back to Portal</Link>
        </motion.div>
      </section>
    );
  }

  const stats = getRoadmapStats(ROADMAP);
  const { grade, score } = getSecurityScore();
  const rlsOff = DATABASE_TABLES.filter(t => t.rls === "off").length;

  return (
    <section className="section-container max-w-4xl mx-auto px-5 pb-28 pt-20 sm:px-8 sm:pb-20 sm:pt-28 lg:px-12" aria-label="System Documentation">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>

        {/* Header */}
        <header className="mb-10">
          <Link to="/god-structure" className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground" aria-label="Return to Dashboard">
            <ArrowLeft size={14} aria-hidden /> Back to Dashboard
          </Link>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <BookOpen size={24} className="text-emerald-500" aria-hidden />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">System Documentation</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-xl">
                Technical reference for the hansvanleeuwen.com ecosystem. Architecture, services, data flows, security posture, and operational procedures.
              </p>
              <div className="flex items-center gap-3 mt-3 text-[11px]">
                <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-emerald-400 font-medium">v2.0</span>
                <span className="text-muted-foreground">Last verified: 2026-03-08</span>
                <Link to="/god-structure" className="text-emerald-400 hover:underline inline-flex items-center gap-1"><Network size={10} /> Live Dashboard</Link>
              </div>
            </div>
          </div>
        </header>

        {/* Executive Summary */}
        <div className="mb-8 rounded-xl border border-border bg-card/50 p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Target size={15} className="text-emerald-500" /> Executive Summary</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            A 6-layer AI-powered platform spanning two domains: <strong className="text-foreground">hansvanleeuwen.com</strong> (personal site and AI command center) and <strong className="text-foreground">marketplacegrowth.nl</strong> (commercial SaaS). The stack includes Cloudflare Pages for edge delivery, Supabase for backend services, n8n for workflow automation across two instances, two Hostinger VPS servers for compute, and a multi-provider AI layer with Claude, Ollama, AnythingLLM, and Qdrant.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
            <div className="rounded-lg border border-border p-2"><p className="text-lg font-bold font-mono text-foreground">{grade}</p><p className="text-[10px] text-muted-foreground">Security Grade ({score}/100)</p></div>
            <div className="rounded-lg border border-border p-2"><p className="text-lg font-bold font-mono text-foreground">{stats.progress}%</p><p className="text-[10px] text-muted-foreground">Roadmap Complete</p></div>
            <div className="rounded-lg border border-border p-2"><p className="text-lg font-bold font-mono text-foreground">{CONNECTED_SERVICES.length}</p><p className="text-[10px] text-muted-foreground">Connected Services</p></div>
            <div className="rounded-lg border border-border p-2"><p className="text-lg font-bold font-mono text-foreground">{DATABASE_TABLES.length}</p><p className="text-[10px] text-muted-foreground">Database Tables</p></div>
          </div>
        </div>

        {/* Sections */}
        <nav aria-label="Documentation sections" className="space-y-2">
          <Accordion type="multiple" defaultValue={["architecture"]} className="space-y-2">

            {/* Architecture Overview */}
            <AccordionItem value="architecture" className="rounded-xl border border-border bg-card/50 px-4">
              <AccordionTrigger className="py-4 text-left text-sm font-semibold text-foreground hover:no-underline [&[data-state=open]]:pb-2">
                <span className="flex items-center gap-2"><Layers size={16} className="shrink-0 text-emerald-500" /> Architecture Overview</span>
              </AccordionTrigger>
              <AccordionContent className="pb-5 pt-0 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The ecosystem is organized into {INFRA_LAYERS.length} layers, each with a clear responsibility. Data flows downward from Edge to AI, with the Automation layer orchestrating cross-layer communication.
                </p>
                {INFRA_LAYERS.map((layer, i) => {
                  const lc = getLayerBorderBg(layer.color);
                  return (
                  <div key={layer.id} className={cn("rounded-lg border p-4 space-y-2", lc.border, lc.bg)}>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-semibold", lc.text)}>{i + 1}. {layer.label}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{layer.tech}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{layer.description}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {layer.services.map((s, j) => (
                        <span key={j} className="rounded bg-background/50 border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{s}</span>
                      ))}
                    </div>
                    {layer.dependsOn.length > 0 && (
                      <p className="text-[10px] text-muted-foreground/60 pt-1">Dependencies: {layer.dependsOn.map(d => INFRA_LAYERS.find(l => l.id === d)?.label).join(", ")}</p>
                    )}
                  </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>

            {/* Data Flows */}
            <AccordionItem value="dataflows" className="rounded-xl border border-border bg-card/50 px-4">
              <AccordionTrigger className="py-4 text-left text-sm font-semibold text-foreground hover:no-underline [&[data-state=open]]:pb-2">
                <span className="flex items-center gap-2"><GitBranch size={16} className="shrink-0 text-cyan-500" /> Data Flows & Pipelines</span>
              </AccordionTrigger>
              <AccordionContent className="pb-5 pt-0 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">How data moves between layers. Each connection uses a specific protocol and authentication method.</p>
                <div className="space-y-2">
                  {DATA_FLOWS.map((f, i) => {
                    const from = INFRA_LAYERS.find(l => l.id === f.from);
                    const to = INFRA_LAYERS.find(l => l.id === f.to);
                    return (
                      <div key={i} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                        <span className={cn("font-medium", getTextColor(from?.color || "zinc"))}>{from?.label}</span>
                        <ChevronRight size={10} className="text-muted-foreground shrink-0" />
                        <span className={cn("font-medium", getTextColor(to?.color || "zinc"))}>{to?.label}</span>
                        <span className="ml-auto text-muted-foreground">{f.label}</span>
                        <span className="rounded bg-background border border-border px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">{f.protocol}</span>
                      </div>
                    );
                  })}
                </div>

                <h3 className="text-xs font-semibold text-foreground pt-2">Content Builder Pipeline</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The SaaS content generation flow: content_projects → product_inputs → cb-normalize (clean) → cb-generate (AI) → generated_listings → cb-validate (check rules) → cb-repair (fix) → export_jobs → cb-export (deliver).
                </p>

                <h3 className="text-xs font-semibold text-foreground pt-2">Deployment Pipelines</h3>
                {DEPLOY_PIPELINES.map(p => (
                  <div key={p.name} className="rounded-lg border border-border p-3 text-xs space-y-1">
                    <div className="flex items-center gap-2"><span className="font-medium text-foreground">{p.name}</span><span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-400">LIVE</span></div>
                    <p className="text-muted-foreground">{p.repo} → {p.platform} → {p.trigger}</p>
                    <code className="block text-[10px] text-muted-foreground/70 font-mono">{p.buildCmd}</code>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            {/* Database */}
            <AccordionItem value="database" className="rounded-xl border border-border bg-card/50 px-4">
              <AccordionTrigger className="py-4 text-left text-sm font-semibold text-foreground hover:no-underline [&[data-state=open]]:pb-2">
                <span className="flex items-center gap-2"><Database size={16} className="shrink-0 text-blue-500" /> Database Schema ({DATABASE_TABLES.length} tables)</span>
              </AccordionTrigger>
              <AccordionContent className="pb-5 pt-0 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Supabase PostgreSQL project <code className="text-xs bg-background px-1 rounded">pesfakewujjwkyybwaom</code> in eu-central-1. Split into SaaS domain (user-facing, full RLS) and Infrastructure domain (internal, {rlsOff} tables lack RLS).
                </p>
                <Link to="/god-structure?tab=database" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline mb-2"><Database size={10} /> Interactive table browser on Dashboard</Link>
                {(["saas", "infra", "other"] as const).map(domain => {
                  const tables = DATABASE_TABLES.filter(t => t.domain === domain);
                  if (tables.length === 0) return null;
                  const label = domain === "saas" ? "SaaS Domain (user-facing)" : domain === "infra" ? "Infrastructure Domain (internal)" : "Other";
                  return (
                    <div key={domain}>
                      <h3 className="text-xs font-semibold text-foreground mb-2">{label}</h3>
                      <div className="space-y-1">
                        {tables.map(t => (
                          <div key={t.name} className={cn("flex items-center gap-3 rounded-lg border px-3 py-1.5 text-[11px]", t.rls === "off" ? "border-red-500/15 bg-red-500/[0.02]" : "border-border")}>
                            <code className="font-mono font-medium text-foreground/90 w-[180px] shrink-0">{t.name}</code>
                            <span className="text-muted-foreground flex-1 truncate">{t.purpose}</span>
                            <span className={cn("rounded border px-1 py-0.5 text-[8px] font-bold uppercase",
                              t.rls === "on" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                              t.rls === "off" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                              "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            )}>{t.rls}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>

            {/* Security */}
            <AccordionItem value="security" className="rounded-xl border border-border bg-card/50 px-4">
              <AccordionTrigger className="py-4 text-left text-sm font-semibold text-foreground hover:no-underline [&[data-state=open]]:pb-2">
                <span className="flex items-center gap-2"><Lock size={16} className="shrink-0 text-red-500" /> Security Assessment ({SECURITY_ISSUES.length} issues)</span>
              </AccordionTrigger>
              <AccordionContent className="pb-5 pt-0 space-y-3">
                <p className="text-sm text-muted-foreground">Current security grade: <strong className={cn("font-mono", score >= 60 ? "text-amber-400" : "text-red-400")}>{grade} ({score}/100)</strong></p>
                {SECURITY_ISSUES.map(issue => (
                  <div key={issue.id} className="rounded-lg border border-border p-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase", getSeverityColor(issue.severity))}>{issue.severity}</span>
                      <span className="text-[10px] text-muted-foreground">[{issue.area}]</span>
                    </div>
                    <p className="text-xs font-medium text-foreground">{issue.issue}</p>
                    <p className="text-[11px] text-muted-foreground">{issue.impact}</p>
                    <p className="text-[11px] text-emerald-400/70">Fix: {issue.fix} <span className="text-muted-foreground">({issue.effort})</span></p>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            {/* Performance */}
            <AccordionItem value="performance" className="rounded-xl border border-border bg-card/50 px-4">
              <AccordionTrigger className="py-4 text-left text-sm font-semibold text-foreground hover:no-underline [&[data-state=open]]:pb-2">
                <span className="flex items-center gap-2"><Gauge size={16} className="shrink-0 text-amber-500" /> Performance Bottlenecks ({PERFORMANCE_ISSUES.length})</span>
              </AccordionTrigger>
              <AccordionContent className="pb-5 pt-0 space-y-3">
                {PERFORMANCE_ISSUES.map(issue => (
                  <div key={issue.id} className="rounded-lg border border-border p-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase", getSeverityColor(issue.severity))}>{issue.severity}</span>
                      <span className="text-[10px] text-muted-foreground">[{issue.area}]</span>
                    </div>
                    <p className="text-xs font-medium text-foreground">{issue.issue}</p>
                    <p className="text-[11px] text-muted-foreground">{issue.impact}</p>
                    <p className="text-[11px] text-emerald-400/70">Fix: {issue.fix}</p>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            {/* Connected Services */}
            <AccordionItem value="services" className="rounded-xl border border-border bg-card/50 px-4">
              <AccordionTrigger className="py-4 text-left text-sm font-semibold text-foreground hover:no-underline [&[data-state=open]]:pb-2">
                <span className="flex items-center gap-2"><Eye size={16} className="shrink-0 text-purple-500" /> Service Inventory ({CONNECTED_SERVICES.length})</span>
              </AccordionTrigger>
              <AccordionContent className="pb-5 pt-0 space-y-2">
                {CONNECTED_SERVICES.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-[11px]">
                    <span className="font-medium text-foreground w-[120px] shrink-0">{s.name}</span>
                    <span className="text-muted-foreground font-mono text-[10px] truncate flex-1">{s.identifier}</span>
                    <span className="text-muted-foreground w-[160px] shrink-0 truncate">{s.role}</span>
                    {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground"><ExternalLink size={10} /></a>}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            {/* Locked Decisions */}
            <AccordionItem value="decisions" className="rounded-xl border border-border bg-card/50 px-4">
              <AccordionTrigger className="py-4 text-left text-sm font-semibold text-foreground hover:no-underline [&[data-state=open]]:pb-2">
                <span className="flex items-center gap-2"><Shield size={16} className="shrink-0 text-orange-500" /> Locked Decisions</span>
              </AccordionTrigger>
              <AccordionContent className="pb-5 pt-0">
                <ol className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                  {[
                    "Separate repos. marketplacegrowth is standalone. hans-crafted-stories is for hansvanleeuwen.com. No monorepo.",
                    "npm only. No bun. No yarn. Compatibility across all deploy targets.",
                    "Vercel for marketplacegrowth, Cloudflare Pages for hansvanleeuwen. Separate deploy pipelines.",
                    "Single Supabase project (cloud) for both sites. Separate schemas later if needed.",
                    "VPS1 = orchestration, VPS2 = inference. Do not mix compute roles.",
                    "One builder per request. BJ Fogg filter → single AI builder. No chaining.",
                    "MCP server tokens use mcp-server-api audience, not public-api.",
                    "VPS hostnames (srv1402218.hstgr.cloud) for SSL, not custom domains (avoids Cloudflare proxy interference).",
                    "Every table has RLS. No exceptions. n8n writes via service_role key, never anon.",
                    "Edge Functions handle all AI calls. Frontend never talks to Claude/Gemini directly.",
                  ].map((d, i) => (
                    <li key={i} className="flex gap-2"><span className="text-orange-400 font-mono font-bold shrink-0">{i + 1}.</span><span>{d}</span></li>
                  ))}
                </ol>
              </AccordionContent>
            </AccordionItem>

            {/* Roadmap */}
            <AccordionItem value="roadmap" className="rounded-xl border border-border bg-card/50 px-4">
              <AccordionTrigger className="py-4 text-left text-sm font-semibold text-foreground hover:no-underline [&[data-state=open]]:pb-2">
                <span className="flex items-center gap-2"><Activity size={16} className="shrink-0 text-emerald-500" /> Roadmap ({stats.progress}% complete)</span>
              </AccordionTrigger>
              <AccordionContent className="pb-5 pt-0 space-y-3">
                <p className="text-sm text-muted-foreground">{stats.done}/{stats.total} tasks done · {stats.doing} in progress · {stats.todo} to do · {stats.blocked} blocked</p>
                <Link to="/god-structure?tab=roadmap" className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:underline"><Network size={12} /> View interactive roadmap on Dashboard</Link>
                <div className="space-y-1.5 pt-2">
                  {ROADMAP.filter(i => i.status !== "done").slice(0, 15).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      <span>{item.status === "doing" ? "🔧" : item.status === "blocked" ? "⛔" : "📋"}</span>
                      <span className={cn("rounded border px-1 py-0.5 text-[8px] font-bold uppercase",
                        item.priority === "P0" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        item.priority === "P1" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                      )}>{item.priority}</span>
                      <span className="text-muted-foreground">{item.task}</span>
                      {item.effort && <span className="ml-auto text-muted-foreground/60 font-mono text-[9px]">{item.effort}</span>}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </nav>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Hans van Leeuwen · System Documentation v2.0</span>
          <Link to="/god-structure" className="text-emerald-400/70 hover:text-emerald-400 transition-colors inline-flex items-center gap-1"><Network size={10} /> Dashboard</Link>
        </div>
      </motion.div>
    </section>
  );
};

export default Wiki;
