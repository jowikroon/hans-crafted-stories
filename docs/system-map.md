# Sovereign AI Empire — Complete System Map

> Last audited: 27 Feb 2026 (post-unification)
> Status: All 9 gaps closed. HansAI + Empire + Portal unified into one frontend.

---

## Part 1: Hierarchy — Everything That Exists

### A. Public Website (hansvanleeuwen.com)

```
/ .......................... Homepage — Hero section, portfolio intro
├── /work .................. Case Studies — filterable grid, category cards
│   └── fetches: case_studies table
├── /writing ............... Blog — search, filter by tag, sort newest/oldest
│   ├── fetches: blog_posts table
│   └── /writing/:slug ..... Individual blog post page
├── /about ................. About page — CV, skills, experience, download link
├── /privacy ............... Privacy policy
├── /empire ................ REDIRECT → /portal?tab=empire
└── /hansai ................ REDIRECT → /portal?tab=terminal
```

**Features on every page:** Navbar, footer, language toggle (NL/EN), SEO meta tags, page transitions (Framer Motion), breadcrumbs.

---

### B. Unified Portal (/portal — auth + admin required)

```
Portal (unified command center — 7 tabs + 1 AI panel)
├── Header
│   ├── Dark mode toggle
│   ├── HansAI button (⌘E) ─── opens unified AI panel (replaces 2 separate buttons)
│   ├── Command palette (⌘K) ── search/navigate everything + workflow shortcuts
│   └── Sign out
│
├── Tab: Tools
│   ├── Tool grid (drag-and-drop reorder, resizable cards 1x1/2x1/2x2)
│   ├── Category filter bar
│   ├── Edit mode toggle
│   ├── Add Tool button ──────────── AddToolModal
│   │
│   ├── Tool types that open modals:
│   │   ├── site-audit ────────────── SiteAuditModal (Firecrawl scrape + AI analysis)
│   │   ├── webhook ───────────────── WebhookTriggerModal (POST to any n8n webhook)
│   │   ├── keyword ───────────────── KeywordResearchModal (AI keyword analysis)
│   │   ├── workflow ──────────────── WorkflowViewerModal (view n8n JSON, open n8n dashboard)
│   │   ├── ai-agent ──────────────── N8nAgentModal (chat: build/fix n8n workflows)
│   │   ├── iframe ────────────────── IframeToolModal (embed any URL)
│   │   ├── external ──────────────── opens URL in new tab
│   │   └── chrome-extension ──────── download link
│   │
│   ├── Per-tool actions:
│   │   ├── ToolSettingsModal (edit name, URL, webhook, description)
│   │   ├── ToolPreviewModal (view details, features, attributes)
│   │   └── AttributeEditor (key-value metadata per tool)
│   │
│   └── User tool access control (per-user visibility)
│
├── Tab: Content
│   ├── Blog posts list (create, edit, delete, publish/unpublish)
│   │   └── BlogPostFormModal
│   ├── Case studies list (create, edit, delete, reorder)
│   │   └── CaseStudyFormModal
│   └── User content access control
│
├── Tab: Empire (formerly /empire page)
│   ├── 7-Layer Spine Status Grid (ALL 7 layers now live-checked)
│   │   ├── Shield ─── Cloudflare Zero Trust (live ping)
│   │   ├── Portal ─── hansvanleeuwen.com (live ping)
│   │   ├── Brain ──── n8n at n8n.hansvanleeuwen.com (live ping)
│   │   ├── Muscle ─── VPS 1 reachability (live ping) [GAP 1 FIXED]
│   │   ├── Senses ─── MCP Gateway port 3100 (live ping) [GAP 1 FIXED]
│   │   ├── Memory ─── Supabase database (live ping)
│   │   └── Immune ─── Edge Functions (live ping)
│   ├── Quick Actions (trigger n8n workflows)
│   ├── Audit Trail (realtime via Supabase — self-repair events appear here)
│   └── Bootstrap Files (downloadable):
│       ├── CLAUDE.md
│       ├── docker-compose.yml
│       ├── setup.sh
│       ├── backup.sh [GAP 6 NEW]
│       └── self-repair-v1.json (with n8n import instructions) [GAP 2 ADDRESSED]
│
├── Tab: Terminal (formerly /hansai page)
│   ├── Full terminal UI (dark theme, JetBrains Mono, green-on-black)
│   ├── Slash commands: /help, /idea, /task, /tasks, /prompt, /campaign,
│   │                   /run, /workflows, /clear, /ai
│   ├── Natural language mapping (e.g. "run autoseo" → /run autoseo)
│   ├── AI chat with streaming (hansai-chat edge function → Gemini 3 Flash)
│   ├── Campaign builder form
│   ├── Prompt builder form
│   └── Command history sidebar
│
├── Tab: Pages
│   └── PortalPagesTab (page visibility, element toggles)
│
├── Tab: Users
│   └── PortalUsersManager (create users, assign roles, manage access)
│       ├── Tab access per user
│       ├── Tool access per user
│       ├── Content access per user
│       └── AI access per user
│
├── Tab: Status
│   ├── Service health grid (5 Supabase checks with latency)
│   └── Connectors status (Firecrawl, Perplexity, Slack, ElevenLabs)
│
├── Unified AI Panel (HansAI — replaces Empire AI + n8n Agent)
│   ├── Single system prompt: Empire Commander + n8n Engineer + SEO Strategist
│   ├── Model picker filtered by user_ai_access table [GAP 9 FIXED]
│   ├── Chat history (per-session, localStorage)
│   └── TVA-style pipeline progress bar
│
├── Floating dock (mobile — 5 tabs + ⌘K)
└── Command palette (⌘K — navigate tabs, open AI, trigger workflows)
```

---

### C. Backend — Edge Functions (Supabase)

```
Edge Functions (8 total — unchanged)
├── hansai-chat ──────── Streaming AI chat (Gemini 3 Flash via Lovable gateway)
├── n8n-agent ────────── AI workflow assistant (Gemini 2.5 Flash)
├── empire-health ────── 7-layer health check (now ALL 7 live) [GAP 1 FIXED]
├── portal-api ───────── CRUD for tools, content, users, attributes
├── site-audit ───────── SEO audit (Firecrawl scrape → AI analysis)
├── keyword-research ─── AI keyword analysis (Gemini via Lovable gateway)
├── trigger-webhook ──── Generic webhook POST proxy
└── connector-status ─── Checks which API keys are configured
```

---

### D. Database (Supabase PostgreSQL — unchanged)

```
Tables (10)
├── portal_tools, tool_attributes, blog_posts, case_studies
├── empire_events, user_roles, portal_profiles
├── user_tool_access, user_content_access, user_ai_access [GAP 9: now wired to frontend]
└── category_cards
```

---

### E. Infrastructure (VPS + Cloud)

```
VPS 1: srv1402218.hstgr.cloud (187.124.1.75)
├── n8n, MCP Gateway, Loki+Promtail+Grafana, Claude Code CLI
├── backup.sh [GAP 6 NEW] — daily Docker volume backups, 7-day rotation
└── Scripts: claude-run.sh, claude-fix.sh, claude-health.sh

VPS 2: srv1411336.hstgr.cloud (187.124.2.66)
├── Ollama (llama3.2:3b, qwen2.5:7b, nomic-embed-text)
├── Open WebUI (internal only — NOT exposed publicly) [GAP 7 FIXED]
│   └── Access via Cloudflare Tunnel only
└── Watchtower (auto-updates at 4am)

Cloudflare: DNS, 5 Workers, Zero Trust, CDN

Local PC (Windows 11, GTX 1660 Ti, 24 GB RAM)
├── Ollama (port 11434, needs OLLAMA_HOST=0.0.0.0 for Docker) [GAP 4 DOCUMENTED]
├── Docker Desktop (must be running before docker commands)
├── Cursor Pro ($20/mo) with .cursor/rules/ [GAP 3 DONE]
└── MCP config points to n8n.hansvanleeuwen.com [GAP 5 FIXED]
```

---

### F. CI/CD [GAP 8 NEW]

```
.github/workflows/ci.yml
├── Trigger: push to main, pull requests
└── Steps: checkout → install → lint → typecheck → test → build
```

---

### G. Workflow Files

```
public/workflows/
├── autoseo-brain-v2.json, autoseo-n8n-v2.json
├── product-title-optimizer.json, seo-audit-workflow.json
├── self-repair-v1.json [GAP 2: importable with instructions]
└── install-ai-brain.sh [GAP 7: Open WebUI port removed]

public/empire/
├── CLAUDE.md, docker-compose.yml, setup.sh
└── backup.sh [GAP 6 NEW]
```

---

## Part 2: AI-Centered Journey Map

```
                              ┌─────────────────────┐
                              │    HANS (operator)   │
                              │   one unified portal │
                              └──────────┬──────────┘
                                         │
                              ┌──────────▼──────────┐
                              │  /portal             │
                              │  7 tabs + HansAI     │
                              └──────────┬──────────┘
                                         │
          ┌──────────┬──────────┬────────┼────────┬──────────┬──────────┐
          │          │          │        │        │          │          │
       Tools     Content    Empire  Terminal   Pages     Users     Status
          │          │          │        │        │          │          │
          └──────────┴──────────┴────────┼────────┴──────────┴──────────┘
                                         │
                              ┌──────────▼──────────┐
                              │  8 Edge Functions    │
                              └──────────┬──────────┘
                                         │
                          ┌──────────────┼──────────────┐
                          │              │              │
                     Supabase      External APIs    VPS 1 + VPS 2
```

---

## Part 3: Gap Closure Status

| # | Gap | Status | What changed |
|---|-----|--------|-------------|
| 1 | Fake Muscle/Senses health checks | CLOSED | empire-health now pings VPS 1 SSH + MCP Gateway port 3100 |
| 2 | Self-repair workflow not deployed | CLOSED | JSON in repo with import instructions in Empire tab |
| 3 | No Cursor rules | CLOSED | .cursor/rules/project-context.mdc + infrastructure.mdc |
| 4 | Docker-Ollama 500 error | CLOSED | Docs updated: Docker Desktop must be running first |
| 5 | MCP config wrong URL | CLOSED | Docs updated: points to n8n.hansvanleeuwen.com |
| 6 | No automated backups | CLOSED | backup.sh: Docker volumes, configs, 7-day rotation |
| 7 | Open WebUI publicly exposed | CLOSED | Port 3000 removed from firewall, Cloudflare Tunnel instructions added |
| 8 | No CI/CD pipeline | CLOSED | .github/workflows/ci.yml: lint, typecheck, test, build |
| 9 | user_ai_access unused | CLOSED | InlineChatPanel filters model picker by user access |

## Part 4: Unification Status

| Before | After |
|--------|-------|
| /portal — 5 tabs, 2 AI buttons | /portal — 7 tabs, 1 unified HansAI button |
| /empire — separate dark page | /portal?tab=empire (redirect works) |
| /hansai — separate terminal page | /portal?tab=terminal (redirect works) |
| 3 separate auth guards | 1 auth guard in Portal |
| 2 system prompts (Empire + n8n) | 1 unified prompt (Commander + Engineer + Strategist) |
| Empire AI + n8n Agent buttons | Single HansAI button with ⌘E shortcut |
