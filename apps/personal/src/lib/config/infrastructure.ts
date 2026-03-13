// ═══════════════════════════════════════════════════════════
//  Infrastructure data — Single source of truth for Dashboard + Wiki
//  Verified against God Structure v2.0 (2026-03-13)
// ═══════════════════════════════════════════════════════════

export type ServiceStatus = "online" | "offline" | "checking" | "degraded" | "unknown";
export type Priority = "P0" | "P1" | "P2" | "P3";
export type TaskStatus = "done" | "doing" | "todo" | "blocked";
export type Severity = "critical" | "high" | "medium" | "low";

// ─── Infrastructure Layers ───────────────────────────────

export interface InfraLayer {
  id: string;
  label: string;
  tech: string;
  color: string;
  icon: string; // lucide icon name
  services: string[];
  urls: { label: string; url: string }[];
  description: string;
  dependsOn: string[];
}

export const INFRA_LAYERS: InfraLayer[] = [
  {
    id: "edge",
    label: "Edge / CDN",
    tech: "Cloudflare Pages",
    color: "emerald",
    icon: "Globe",
    services: [
      "React 18 + Vite + TypeScript SPA",
      "Auto-deploy from jowikroon/hans-crafted-stories",
      "Cloudflare DNS + SSL",
      "SPA routing via _redirects",
      "Cloudflare Workers (n8n-relay-proxy)",
    ],
    urls: [
      { label: "hansvanleeuwen.com", url: "https://hansvanleeuwen.com" },
      { label: "Cloudflare Dashboard", url: "https://dash.cloudflare.com/7fe1db55d4caa07b7488d8b298fd9f39/pages/view/hansvanleeuwen" },
    ],
    description: "The CDN and edge layer. Cloudflare Pages serves the React SPA with automatic SSL, DNS management, and edge caching. Deploys trigger automatically on push to main branch.",
    dependsOn: [],
  },
  {
    id: "backend",
    label: "Backend",
    tech: "Supabase (eu-central-1)",
    color: "blue",
    icon: "Database",
    services: [
      "PostgreSQL — ~30 tables, 7+ migrations",
      "Auth — Email + Google OAuth (via Lovable SDK)",
      "Edge Functions (7 deployed)",
      "Row Level Security on SaaS tables",
      "pgvector extension for embeddings",
      "PostgREST API gateway",
    ],
    urls: [
      { label: "Supabase Dashboard", url: "https://supabase.com/dashboard/project/pesfakewujjwkyybwaom" },
    ],
    description: "Supabase cloud project provides PostgreSQL database, auth, and serverless Edge Functions. The database is split into SaaS domain (user-facing, full RLS) and infrastructure domain (internal, partial RLS).",
    dependsOn: [],
  },
  {
    id: "automation",
    label: "Automation",
    tech: "n8n (Hostinger VPS + Cloud)",
    color: "purple",
    icon: "Zap",
    services: [
      "Claude Relay v2 (webhook gateway)",
      "Hans Site Update Engine v3 (BJ Fogg + LLM)",
      "Docker Container Health Scanner (5 min)",
      "Service Endpoint Health Checker (5 min)",
      "State Snapshot Logger (15 min)",
      "Change Detector (15 min)",
      "Samantha AI (6 e-commerce workflows — claude-opus-4-5)",
      "Live SEO Audit — Multi-Signal + AI Scorecard",
      "Order Processing Pipeline (WC + Shopify)",
      "Price Monitor (Bol.com + Amazon NL daily digest)",
      "20 total workflows, 18 active",
    ],
    urls: [
      { label: "n8n Hostinger", url: "https://n8n.srv1402218.hstgr.cloud" },
      { label: "n8n Cloud", url: "https://hansvanleeuwen.app.n8n.cloud" },
    ],
    description: "n8n workflow automation runs on VPS1 as the primary orchestrator and on n8n Cloud as secondary. Handles scheduled monitoring, webhook processing, AI routing through BJ Fogg behavioral filter, and Claude Relay gateway.",
    dependsOn: ["compute", "backend"],
  },
  {
    id: "compute",
    label: "Compute",
    tech: "2× Hostinger KVM VPS",
    color: "amber",
    icon: "Server",
    services: [
      "VPS1 (srv1402218) — Capital City — Ubuntu 24.04, 2c / 8GB / 96GB",
      "Docker: n8n, Traefik, AnythingLLM, Qdrant, Ollama, ttyd",
      "VPS2 (srv1411336) — Industrial Zone — Ollama inference",
      "Claude Code CLI v2.1.50 on VPS1",
      "PM2 process manager",
      "tmux session: hansai (persistent)",
    ],
    urls: [],
    description: "Two Hostinger VPS servers in Frankfurt. VPS1 handles orchestration (n8n, Docker services, Claude Code CLI). VPS2 handles heavy AI inference via Ollama. Strict role separation is enforced.",
    dependsOn: [],
  },
  {
    id: "ai",
    label: "AI Models",
    tech: "Multi-provider",
    color: "pink",
    icon: "Brain",
    services: [
      "Claude API (via Edge Functions + CLI)",
      "Ollama (qwen2.5:7b + qwen2.5:14b on VPS2)",
      "AnythingLLM (RAG interface, port 3001)",
      "Qdrant (vector search, ports 6333-6334)",
    ],
    urls: [],
    description: "Multi-provider AI layer. Claude API for primary intelligence, Ollama for local inference (saving $100-300/month vs cloud APIs), AnythingLLM for RAG document Q&A, and Qdrant for vector similarity search.",
    dependsOn: ["compute"],
  },
  {
    id: "monitoring",
    label: "Monitoring",
    tech: "n8n + Python scripts",
    color: "orange",
    icon: "Activity",
    services: [
      "4 n8n monitoring workflows (Docker, endpoints, snapshots, changes)",
      "Host scripts: /opt/n8n-monitoring/ (Python)",
      "File-based logs: snapshots/ + changes.log (JSONL)",
      "Infrastructure health score: 8.5/10",
    ],
    urls: [],
    description: "Monitoring and observability layer. Four n8n workflows run on cron schedules to check Docker containers, service endpoints, capture state snapshots, and detect configuration changes. Logs are file-based (JSONL).",
    dependsOn: ["automation", "compute"],
  },
];

// ─── Connected Services ──────────────────────────────────

export interface ConnectedService {
  name: string;
  identifier: string;
  role: string;
  layer: string;
  status: ServiceStatus;
  url?: string;
}

export const CONNECTED_SERVICES: ConnectedService[] = [
  { name: "Cloudflare Pages", identifier: "hansvanleeuwen", role: "Frontend hosting", layer: "edge", status: "online", url: "https://hansvanleeuwen.com" },
  { name: "Vercel", identifier: "prj_jpiL4aZ58kd1tCwGJ9kbZSWSb9lW", role: "SaaS frontend (marketplacegrowth.nl)", layer: "edge", status: "online", url: "https://marketplacegrowth.nl" },
  { name: "GitHub", identifier: "jowikroon/hans-crafted-stories", role: "Source code", layer: "edge", status: "online", url: "https://github.com/jowikroon/hans-crafted-stories" },
  { name: "GitHub", identifier: "jowikroon/marketplacegrowth", role: "SaaS source code", layer: "edge", status: "online", url: "https://github.com/jowikroon/marketplacegrowth" },
  { name: "Supabase", identifier: "pesfakewujjwkyybwaom", role: "Database + Auth + Edge Functions", layer: "backend", status: "online", url: "https://supabase.com/dashboard/project/pesfakewujjwkyybwaom" },
  { name: "VPS1 (Capital)", identifier: "srv1402218 / 187.124.1.75", role: "n8n + Docker + Claude Code", layer: "compute", status: "online" },
  { name: "VPS2 (Industrial)", identifier: "srv1411336 / 187.124.2.66", role: "Ollama AI inference", layer: "compute", status: "online" },
  { name: "n8n Hostinger", identifier: "n8n.srv1402218.hstgr.cloud", role: "Primary workflow automation", layer: "automation", status: "online", url: "https://n8n.srv1402218.hstgr.cloud" },
  { name: "n8n Cloud", identifier: "hansvanleeuwen.app.n8n.cloud", role: "Secondary n8n (AI workflows)", layer: "automation", status: "online", url: "https://hansvanleeuwen.app.n8n.cloud" },
  { name: "Ollama", identifier: "187.124.2.66:11434", role: "Local LLM (qwen2.5:7b + 14b)", layer: "ai", status: "online" },
  { name: "AnythingLLM", identifier: "VPS1:3001", role: "RAG document interface", layer: "ai", status: "online" },
  { name: "Qdrant", identifier: "VPS1:6333-6334", role: "Vector database", layer: "ai", status: "online" },
  { name: "Cloudflare Workers", identifier: "n8n-relay-proxy", role: "Edge API gateway", layer: "edge", status: "online" },
  { name: "Google Sheets", identifier: "1XhFg...KLY", role: "Magento 2 product export", layer: "backend", status: "online" },
  { name: "Channable", identifier: "Feed management", role: "SEO rules + product feeds", layer: "backend", status: "online" },
];

// ─── Database Tables ─────────────────────────────────────

export interface DatabaseTable {
  name: string;
  purpose: string;
  domain: "saas" | "infra" | "other";
  rls: "on" | "off" | "partial" | "permissive";
  rowEstimate: string;
  risk: Severity | "none";
}

export const DATABASE_TABLES: DatabaseTable[] = [
  // SaaS Domain
  { name: "profiles", purpose: "User accounts (linked to auth.users)", domain: "saas", rls: "on", rowEstimate: "Active", risk: "none" },
  { name: "workspaces", purpose: "Multi-tenant workspace containers", domain: "saas", rls: "on", rowEstimate: "Active", risk: "none" },
  { name: "workspace_members", purpose: "User ↔ workspace membership", domain: "saas", rls: "on", rowEstimate: "Active", risk: "none" },
  { name: "brands", purpose: "Client brands per workspace", domain: "saas", rls: "on", rowEstimate: "Active", risk: "none" },
  { name: "content_projects", purpose: "Content generation projects", domain: "saas", rls: "on", rowEstimate: "Active", risk: "none" },
  { name: "product_inputs", purpose: "Raw product data for optimization", domain: "saas", rls: "on", rowEstimate: "Active", risk: "none" },
  { name: "generated_listings", purpose: "AI-generated product listings", domain: "saas", rls: "on", rowEstimate: "Active", risk: "none" },
  { name: "generated_content", purpose: "General AI-generated content", domain: "saas", rls: "on", rowEstimate: "Active", risk: "none" },
  { name: "publications", purpose: "Published content records", domain: "saas", rls: "on", rowEstimate: "Active", risk: "none" },
  { name: "export_jobs", purpose: "Bulk export tracking", domain: "saas", rls: "on", rowEstimate: "Active", risk: "none" },
  { name: "validation_rules", purpose: "Amazon DE/FR marketplace rules", domain: "saas", rls: "on", rowEstimate: "14 seeded", risk: "none" },
  // Infra Domain
  { name: "infrastructure_services", purpose: "Registered services (9 entries)", domain: "infra", rls: "on", rowEstimate: "9", risk: "none" },
  { name: "infrastructure_state", purpose: "CPU/memory/disk snapshots", domain: "infra", rls: "on", rowEstimate: "~0", risk: "none" },
  { name: "infrastructure_change_log", purpose: "Change detection log", domain: "infra", rls: "on", rowEstimate: "~0", risk: "none" },
  { name: "empire_vector_memory", purpose: "pgvector embeddings (384-dim)", domain: "infra", rls: "on", rowEstimate: "Low", risk: "none" },
  { name: "ai_sessions", purpose: "AI session tracking", domain: "infra", rls: "on", rowEstimate: "Low", risk: "none" },
  { name: "ai_lessons_learned", purpose: "AI learning memory", domain: "infra", rls: "on", rowEstimate: "Low", risk: "none" },
  { name: "workflow_history", purpose: "n8n workflow execution log", domain: "infra", rls: "off", rowEstimate: "Low", risk: "low" },
  { name: "sov_projects", purpose: "Sovereign OS project tracking", domain: "infra", rls: "partial", rowEstimate: "Low", risk: "low" },
  { name: "sov_executions", purpose: "Sovereign OS execution log", domain: "infra", rls: "partial", rowEstimate: "Low", risk: "low" },
  // CMS Domain
  { name: "blog_posts", purpose: "CMS blog content (EN + NL + SEO fields)", domain: "other", rls: "on", rowEstimate: "Active", risk: "none" },
  { name: "blog_post_versions", purpose: "Blog post version history (admin-only writes)", domain: "other", rls: "on", rowEstimate: "Low", risk: "none" },
  { name: "case_studies", purpose: "Portfolio case studies (EN + NL)", domain: "other", rls: "on", rowEstimate: "Active", risk: "none" },
  { name: "media_library", purpose: "Uploaded media assets (admin-only writes)", domain: "other", rls: "on", rowEstimate: "Low", risk: "none" },
  // Infra / AI
  { name: "workflow_runs", purpose: "Samantha AI workflow execution log (result_data JSONB)", domain: "infra", rls: "on", rowEstimate: "Active", risk: "none" },
  { name: "system_issues", purpose: "Live infrastructure issues tracker for God Structure", domain: "infra", rls: "on", rowEstimate: "8 seeded", risk: "none" },
  // Other
  { name: "seo_news_digest", purpose: "SEO news (written by n8n service_role)", domain: "other", rls: "on", rowEstimate: "Varies", risk: "none" },
  { name: "user_roles", purpose: "Admin role detection", domain: "other", rls: "partial", rowEstimate: "Low", risk: "low" },
];

// ─── Roadmap ─────────────────────────────────────────────

export interface RoadmapItem {
  task: string;
  status: TaskStatus;
  priority: Priority;
  category: string;
  effort?: string;
  description?: string;
}

export const ROADMAP: RoadmapItem[] = [
  // Done
  { task: "Domains live (hansvanleeuwen.com + marketplacegrowth.nl)", status: "done", priority: "P0", category: "infra" },
  { task: "Cloudflare Pages deploy pipeline", status: "done", priority: "P0", category: "infra" },
  { task: "Supabase schema — 7 migrations", status: "done", priority: "P0", category: "backend" },
  { task: "Edge Functions deployed (7)", status: "done", priority: "P0", category: "backend" },
  { task: "Auth — email + Google OAuth", status: "done", priority: "P0", category: "auth" },
  { task: "4 VPS monitoring workflows active", status: "done", priority: "P0", category: "monitoring" },
  { task: "Separate repos (marketplacegrowth standalone)", status: "done", priority: "P0", category: "infra" },
  { task: "blog_post_versions + media_library RLS hardened (admin-only writes)", status: "done", priority: "P0", category: "security" },
  { task: "seo_news_digest RLS — restricted to authenticated writes (was anon-permissive)", status: "done", priority: "P0", category: "security" },
  { task: "Ollama deployed on VPS2 (qwen2.5:7b + 14b)", status: "done", priority: "P1", category: "ai" },
  { task: "God Structure dashboard", status: "done", priority: "P1", category: "frontend" },
  { task: "9 infra services registered in Supabase", status: "done", priority: "P1", category: "monitoring" },
  { task: "Hans Site Update Engine v3 (BJ Fogg routing)", status: "done", priority: "P1", category: "automation" },
  { task: "Samantha AI — 6 e-commerce AI workflows (claude-opus-4-5, write-back to workflow_runs)", status: "done", priority: "P1", category: "automation" },
  { task: "Live SEO Audit workflow (fetch HTML + PageSpeed + 3 Claude auditors + scorecard)", status: "done", priority: "P1", category: "seo" },
  { task: "n8n write-back: runId + result_data threading to workflow_runs for all 6 write workflows", status: "done", priority: "P1", category: "automation" },
  { task: "CMS editor: og_title, og_description, primary_keyword fields wired to DB", status: "done", priority: "P1", category: "frontend" },
  { task: "system_issues table — live DB-backed issues tracker for God Structure", status: "done", priority: "P1", category: "backend" },
  // In progress
  { task: "Wire marketplacegrowth.nl frontend to Supabase backend", status: "doing", priority: "P1", category: "frontend", effort: "4 hr" },
  { task: "AutoSEO Brain v2 (connectcarparts.nl)", status: "doing", priority: "P1", category: "seo", effort: "ongoing" },
  // P0 — Security (immediate)
  { task: "Rotate exposed GitHub PAT + Cloudflare token", status: "todo", priority: "P0", category: "security", effort: "10 min", description: "Both tokens were exposed in a previous session. Must be revoked and regenerated immediately." },
  { task: "Set LLM API key in Edge Function secrets", status: "todo", priority: "P0", category: "backend", effort: "2 min", description: "generate-content and cb-generate read GEMINI_API_KEY from secrets. Neither is set — all AI generation fails silently." },
  { task: "Enable RLS on 6 legacy infra tables", status: "done", priority: "P0", category: "security" },
  { task: "Enable leaked password protection", status: "todo", priority: "P0", category: "security", effort: "2 min", description: "Supabase HaveIBeenPwned check is off. Enable in Auth → Security." },
  // P1 — Core
  { task: "Fix RLS auth.uid() → (select auth.uid()) — 30 policies", status: "done", priority: "P1", category: "performance" },
  { task: "Add missing FK indexes (6 tables)", status: "done", priority: "P1", category: "performance" },
  { task: "Replace Lovable OAuth → direct Supabase Google OAuth", status: "todo", priority: "P1", category: "auth", effort: "1 hr", description: "Google OAuth currently routes through @lovable.dev/cloud-auth-js — a third-party proxy. Replace with direct Supabase provider." },
  { task: "Verify Supabase Site URL = marketplacegrowth.nl", status: "todo", priority: "P1", category: "auth", effort: "2 min" },
  { task: "Fix n8n reverse proxy 502", status: "blocked", priority: "P1", category: "infra", effort: "1 hr", description: "n8n.hansvanleeuwen.com returns 502. Traefik routing misconfiguration." },
  // P2 — Polish
  { task: "Route-level code splitting (React.lazy)", status: "todo", priority: "P2", category: "frontend", effort: "2 hr", description: "Entire app ships as single 930KB JS chunk. React.lazy() would cut initial load to ~200KB." },
  { task: "GitHub Actions CI (typecheck + build)", status: "todo", priority: "P2", category: "infra", effort: "30 min" },
  { task: "Wire Content Builder → Edge Functions", status: "todo", priority: "P2", category: "frontend", effort: "4 hr" },
  { task: "Deploy JSON Workflow Improver", status: "blocked", priority: "P2", category: "automation", effort: "1 hr", description: "Blocked until Ollama qwen2.5 models are confirmed running." },
  { task: "Merge duplicate workspace SELECT RLS policies", status: "todo", priority: "P2", category: "performance", effort: "15 min" },
  // P3 — Growth
  { task: "Move infra tables to separate schema", status: "todo", priority: "P3", category: "infra", effort: "1 hr" },
  { task: "Connect monitoring → Supabase (replace file logs)", status: "todo", priority: "P3", category: "monitoring", effort: "2 hr" },
  { task: "Clean up 15 inactive n8n workflows", status: "todo", priority: "P3", category: "automation", effort: "30 min" },
  { task: "Add Edge Function error monitoring", status: "todo", priority: "P3", category: "monitoring", effort: "1 hr" },
  { task: "Fix self-hosted Supabase (504 timeout)", status: "todo", priority: "P3", category: "infra", effort: "1 hr" },
];

// ─── Data Flows ──────────────────────────────────────────

export interface DataFlow {
  from: string;
  to: string;
  label: string;
  protocol: string;
}

export const DATA_FLOWS: DataFlow[] = [
  { from: "edge", to: "backend", label: "Supabase JS Client (anon key)", protocol: "HTTPS" },
  { from: "backend", to: "ai", label: "Edge Functions → Claude/Gemini API", protocol: "HTTPS" },
  { from: "automation", to: "backend", label: "Webhook → Supabase REST (service_role)", protocol: "HTTPS" },
  { from: "automation", to: "compute", label: "SSH + Docker API", protocol: "SSH" },
  { from: "edge", to: "automation", label: "n8n webhook triggers", protocol: "HTTPS" },
  { from: "compute", to: "ai", label: "Ollama API (internal)", protocol: "HTTP" },
  { from: "monitoring", to: "compute", label: "Docker inspect + health scripts", protocol: "Local" },
  { from: "monitoring", to: "automation", label: "n8n cron schedules", protocol: "Internal" },
];

// ─── Security Issues ─────────────────────────────────────

export interface SecurityIssue {
  id: string;
  severity: Severity;
  area: string;
  issue: string;
  impact: string;
  fix: string;
  effort: string;
}

export const SECURITY_ISSUES: SecurityIssue[] = [
  { id: "sec-1", severity: "critical", area: "Credentials", issue: "GitHub PAT + Cloudflare API token exposed in session history", impact: "Unauthorized repo access and DNS/Worker control", fix: "Revoke tokens, generate new ones, update all configs", effort: "10 min" },
  { id: "sec-2", severity: "critical", area: "Database", issue: "6 infrastructure tables have no RLS policies", impact: "Anyone with anon key can query infra topology, AI sessions, system state", fix: "Enable RLS with admin-only policies or move to infra schema", effort: "30 min" },
  { id: "sec-3", severity: "critical", area: "Edge Functions", issue: "No LLM API key set in Supabase secrets", impact: "All AI content generation silently fails", fix: "Add GEMINI_API_KEY or ANTHROPIC_API_KEY to Edge Function secrets", effort: "2 min" },
  { id: "sec-4", severity: "high", area: "Auth", issue: "Leaked password protection disabled", impact: "Users can register with passwords from known breaches", fix: "Enable HaveIBeenPwned check in Supabase Auth → Security", effort: "2 min" },
  { id: "sec-5", severity: "medium", area: "Auth", issue: "Google OAuth via third-party @lovable.dev proxy", impact: "Dependency on external service for auth flow", fix: "Replace with direct Supabase Google OAuth provider", effort: "1 hr" },
];

// ─── Performance Issues ──────────────────────────────────

export interface PerformanceIssue {
  id: string;
  area: string;
  issue: string;
  impact: string;
  fix: string;
  severity: Severity;
}

export const PERFORMANCE_ISSUES: PerformanceIssue[] = [
  { id: "perf-1", area: "Database", issue: "Duplicate SELECT RLS policies on workspaces table", impact: "Both permissive policies fire for every query — unnecessary overhead", fix: "Merge into single policy", severity: "low" },
  { id: "perf-2", area: "Frontend", issue: "930KB single JS bundle", impact: "Slow initial load, poor LCP on mobile", fix: "Route-level code splitting with React.lazy()", severity: "high" },
  { id: "perf-3", area: "Database", issue: "46 unused indexes", impact: "Wasted storage, slower INSERT/UPDATE operations", fix: "Audit and drop indexes with zero scans", severity: "low" },
];

// ─── Deployment Pipelines ────────────────────────────────

export interface DeployPipeline {
  name: string;
  repo: string;
  platform: string;
  trigger: string;
  buildCmd: string;
  outputDir: string;
  url: string;
  status: ServiceStatus;
}

export const DEPLOY_PIPELINES: DeployPipeline[] = [
  { name: "hansvanleeuwen.com", repo: "jowikroon/hans-crafted-stories", platform: "Cloudflare Pages", trigger: "Push to main", buildCmd: "npm install && npm run build", outputDir: "apps/personal/dist", url: "https://hansvanleeuwen.com", status: "online" },
  { name: "marketplacegrowth.nl", repo: "jowikroon/marketplacegrowth", platform: "Vercel", trigger: "Push to main", buildCmd: "vite build", outputDir: "dist", url: "https://marketplacegrowth.nl", status: "online" },
];

// ─── Helper functions ────────────────────────────────────

export function getRoadmapStats(items: RoadmapItem[]) {
  const done = items.filter(i => i.status === "done").length;
  const doing = items.filter(i => i.status === "doing").length;
  const todo = items.filter(i => i.status === "todo").length;
  const blocked = items.filter(i => i.status === "blocked").length;
  const total = items.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const p0Open = items.filter(i => i.priority === "P0" && i.status !== "done").length;
  const p1Open = items.filter(i => i.priority === "P1" && i.status !== "done").length;
  return { done, doing, todo, blocked, total, progress, p0Open, p1Open };
}

export function getSecurityScore(): { score: number; grade: string; color: string; textClass: string } {
  const critical = SECURITY_ISSUES.filter(i => i.severity === "critical").length;
  const high = SECURITY_ISSUES.filter(i => i.severity === "high").length;
  const medium = SECURITY_ISSUES.filter(i => i.severity === "medium").length;
  const penalty = critical * 20 + high * 10 + medium * 5;
  const score = Math.max(0, 100 - penalty);
  const grade = score >= 90 ? "A" : score >= 80 ? "B+" : score >= 70 ? "B" : score >= 60 ? "B-" : score >= 50 ? "C" : "D";
  const color = score >= 80 ? "emerald" : score >= 60 ? "amber" : "red";
  const textClass = score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400";
  return { score, grade, color, textClass };
}

export function getTextColor(color: string): string {
  const map: Record<string, string> = {
    emerald: "text-emerald-400", blue: "text-blue-400", purple: "text-purple-400",
    amber: "text-amber-400", pink: "text-pink-400", orange: "text-orange-400",
    red: "text-red-400", cyan: "text-cyan-400", zinc: "text-zinc-400",
  };
  return map[color] || "text-zinc-400";
}

export function getPhaseClasses(color: string): { border: string; bg: string; text: string } {
  const map: Record<string, { border: string; bg: string; text: string }> = {
    red: { border: "border-red-500/30", bg: "bg-red-500/[0.04]", text: "text-red-400" },
    amber: { border: "border-amber-500/30", bg: "bg-amber-500/[0.04]", text: "text-amber-400" },
    blue: { border: "border-blue-500/30", bg: "bg-blue-500/[0.04]", text: "text-blue-400" },
    emerald: { border: "border-emerald-500/30", bg: "bg-emerald-500/[0.04]", text: "text-emerald-400" },
  };
  return map[color] || map.amber;
}

export function getLayerBorderBg(color: string): { border: string; bg: string; text: string } {
  const map: Record<string, { border: string; bg: string; text: string }> = {
    emerald: { border: "border-emerald-500/20", bg: "bg-emerald-500/[0.03]", text: "text-emerald-400" },
    blue: { border: "border-blue-500/20", bg: "bg-blue-500/[0.03]", text: "text-blue-400" },
    purple: { border: "border-purple-500/20", bg: "bg-purple-500/[0.03]", text: "text-purple-400" },
    amber: { border: "border-amber-500/20", bg: "bg-amber-500/[0.03]", text: "text-amber-400" },
    pink: { border: "border-pink-500/20", bg: "bg-pink-500/[0.03]", text: "text-pink-400" },
    orange: { border: "border-orange-500/20", bg: "bg-orange-500/[0.03]", text: "text-orange-400" },
  };
  return map[color] || map.amber;
}

export function getLayerColor(color: string): string {
  const map: Record<string, string> = {
    emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/[0.06]",
    blue: "text-blue-400 border-blue-500/20 bg-blue-500/[0.06]",
    purple: "text-purple-400 border-purple-500/20 bg-purple-500/[0.06]",
    amber: "text-amber-400 border-amber-500/20 bg-amber-500/[0.06]",
    pink: "text-pink-400 border-pink-500/20 bg-pink-500/[0.06]",
    orange: "text-orange-400 border-orange-500/20 bg-orange-500/[0.06]",
  };
  return map[color] || map.amber;
}

export function getPriorityColor(p: Priority): string {
  const map: Record<Priority, string> = {
    P0: "bg-red-500/15 text-red-400 border-red-500/30",
    P1: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    P2: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    P3: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  };
  return map[p];
}

export function getSeverityColor(s: Severity): string {
  const map: Record<Severity, string> = {
    critical: "bg-red-500/15 text-red-400 border-red-500/30",
    high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    low: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  };
  return map[s];
}
