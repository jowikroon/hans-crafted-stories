# Empire AI to N8N Automations — Complete Flow Map

The Sovereign AI Empire is a 7-layer system. N8N sits at **Layer 3 (Brain)** and is triggered from three UI entry points (HansAI, Empire Dashboard, Portal). All flows converge at the `trigger-webhook` Supabase edge function or direct webhook calls.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ENTRY POINTS (Layer 2 — Portal)                  │
│                                                                     │
│  /hansai Terminal     /empire Dashboard     /portal Tools           │
│  ┌──────────────┐    ┌──────────────────┐  ┌───────────────────┐   │
│  │ /run [name]  │    │ Quick Actions    │  │ Webhook Tools     │   │
│  │ /workflows   │    │ Health Grid      │  │ Cmd+E Commander   │   │
│  │ /ai [prompt] │    │ Claude Panel     │  │ Cmd+J n8n Agent   │   │
│  │ /campaign    │    │ Audit Trail      │  │ Tool CRUD         │   │
│  └──────┬───────┘    └────────┬─────────┘  └────────┬──────────┘   │
│         │                     │                      │              │
└─────────┼─────────────────────┼──────────────────────┼──────────────┘
          │                     │                      │
          │ direct fetch()      │ via Supabase         │ via Supabase
          │                     │                      │
┌─────────┼─────────────────────┼──────────────────────┼──────────────┐
│         │        MIDDLEWARE (Layer 6 — Supabase)      │              │
│         │                     │                      │              │
│         │         ┌───────────▼──────────┐  ┌────────▼──────────┐  │
│         │         │  trigger-webhook     │  │  n8n-agent        │  │
│         │         │  (webhook proxy)     │  │  (AI JSON builder)│  │
│         │         └───────────┬──────────┘  └───────────────────┘  │
│         │                     │                                     │
│         │         ┌───────────┴──────────┐                         │
│         │         │  empire-health       │  ┌───────────────────┐  │
│         │         │  (7-layer checker)   │  │  hansai-chat      │  │
│         │         └──────────────────────┘  │  (streaming AI)   │  │
│         │                                   └───────────────────┘  │
│         │         ┌──────────────────────┐                         │
│         │         │  portal-api          │  ┌───────────────────┐  │
│         │         │  (tool CRUD)         │  │  empire_events    │  │
│         │         └──────────────────────┘  │  portal_tools     │  │
│         │                                   └───────────────────┘  │
└─────────┼─────────────────────┬────────────────────────────────────┘
          │                     │
          ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                N8N ORCHESTRATION (Layer 3 — Brain)                   │
│                https://n8n.hansvanleeuwen.com                       │
│                                                                     │
│  /webhook/autoseo         AutoSEO Brain (Claude + Sheets)          │
│  /webhook/product-titles  Product Title Optimizer (Sheets)          │
│  /webhook/health-check    Health Check                              │
│  /webhook/product-feed    Product Feed Optimizer (Channable)        │
│  /webhook/campaign        Campaign Generator (Claude)               │
│  /webhook/scraper         Web Scraper (Claude)                      │
│  Form Trigger             SEO Audit (OpenAI o1 + Gmail)            │
│                                                                     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                              │
│                                                                     │
│  Claude AI (Anthropic)  ·  OpenAI o1  ·  Google Sheets             │
│  Gmail  ·  Channable Feed  ·  HTTP endpoints                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Category 1: Entry Points (UI Layer)

Three pages serve as the command surface for triggering N8N automations.

### 1A. HansAI Terminal (`/hansai`)

- **File:** `src/pages/HansAI.tsx`
- **Access:** Admin-only
- **Trigger method:** Direct `fetch()` to N8N webhook URLs (bypasses Supabase proxy)
- **Commands:**
  - `/workflows` — list all available workflows
  - `/run [name]` — trigger a specific workflow by name
  - `/ai [prompt]` — chat via `hansai-chat` edge function (streaming SSE)
  - `/idea`, `/task` — local task management
  - `/campaign` — launch campaign form (triggers campaign webhook)
  - `/prompt` — open prompt builder (seo/campaign/product/email)
- **Workflows defined inline** (lines 11-18):

| Name | Label | Webhook URL |
|------|-------|-------------|
| `autoseo` | AutoSEO Brain | `https://n8n.hansvanleeuwen.com/webhook/autoseo` |
| `product-titles` | Product Title Optimizer | `https://n8n.hansvanleeuwen.com/webhook/product-titles` |
| `health-check` | Health Check | `https://n8n.hansvanleeuwen.com/webhook/health-check` |
| `product-feed` | Product Feed Optimizer | `https://n8n.hansvanleeuwen.com/webhook/product-feed` |
| `campaign` | Campaign Generator | `https://n8n.hansvanleeuwen.com/webhook/campaign` |
| `scraper` | Web Scraper | `https://n8n.hansvanleeuwen.com/webhook/scraper` |

### 1B. Empire Dashboard (`/empire`)

- **File:** `src/pages/Empire.tsx`
- **Access:** Admin-only
- **Components:**
  - **EmpireStatusGrid** — health monitoring of all 7 layers via `empire-health` edge function
  - **EmpireQuickActions** — button triggers via `trigger-webhook` proxy for: AutoSEO, Title Optimizer, Health Check, Audit Trail
  - **EmpireAuditTrail** — real-time event log from `empire_events` table (Supabase subscriptions)
  - **EmpireClaudePanel** — AI chat via `n8n-agent` edge function

### 1C. Portal (`/portal`)

- **File:** `src/pages/Portal.tsx`
- **Access:** Admin-only (left sidebar layout)
- **Components:**
  - **PortalToolsTab** — grid of tools (webhook, site-audit, keyword, ai-agent, etc.) with category filtering
  - **WebhookTriggerModal** — manual webhook trigger with JSON payload editor
  - **ToolPreviewModal** / **ToolSettingsModal** — configure and test webhook tools
  - **InlineChatPanel** — Cmd+E (Empire Commander) and Cmd+J (n8n Agent)
  - **N8nAgentModal** — AI assistant for building/fixing n8n workflow JSON

---

## Category 2: Middleware Layer (Supabase Edge Functions)

### 2A. `trigger-webhook` — Generic Webhook Proxy

- **File:** `supabase/functions/trigger-webhook/index.ts`
- **Used by:** Empire Quick Actions, Portal webhook tools
- **Flow:**
  1. Receives `{ webhook_url, payload }` via POST
  2. Validates URL format
  3. POSTs payload to the N8N webhook URL
  4. Returns `{ success, status, data }` response

### 2B. `empire-health` — Health Checker

- **File:** `supabase/functions/empire-health/index.ts`
- **Checks (in parallel):**
  - Shield — `https://cloudflare.com/cdn-cgi/trace`
  - Portal — `https://hansvanleeuwen.com`
  - Brain — `https://n8n.hansvanleeuwen.com/healthz`
  - Memory — Supabase REST API
  - Immune — Edge Functions (`site-audit`)
  - Muscle — Claude Code CLI (manual status)
  - Senses — MCP Gateway (manual status)
- **Logs:** Results to `empire_events` table with service count

### 2C. `n8n-agent` — AI Workflow Builder

- **File:** `supabase/functions/n8n-agent/index.ts`
- **Model:** `google/gemini-2.5-flash` via Lovable Gateway
- **Purpose:** Generates/fixes N8N workflow JSON (does NOT trigger webhooks)
- **Used by:** Empire Claude Panel, Portal Cmd+E and Cmd+J panels

### 2D. `hansai-chat` — Streaming AI Chat

- **File:** `supabase/functions/hansai-chat/index.ts`
- **Model:** `google/gemini-3-flash-preview` via Lovable Gateway (configurable)
- **Purpose:** General AI assistant with Empire infrastructure context
- **System prompt includes:** N8N workflows, Cloudflare Workers, VPS servers, Docker MCP Gateway, Supabase, Claude Code CLI
- **Returns:** Server-Sent Events stream

### 2E. `portal-api` — Tool CRUD

- **File:** `supabase/functions/portal-api/index.ts`
- **Purpose:** Manages `portal_tools` table (list, create, update, delete tools)
- **Also handles:** Blog posts, case studies, user management

---

## Category 3: N8N Workflows (Brain Layer)

All workflows are hosted at `https://n8n.hansvanleeuwen.com` on the primary VPS.

### 3A. AutoSEO Brain (`/webhook/autoseo`)

- **Workflow file:** `public/workflows/autoseo-brain-v2.json`
- **Triggers:** Webhook POST, Weekly Schedule (Monday 06:00), Manual
- **Steps:**
  1. Receive product data (SKUs, titles, categories)
  2. Score existing titles (keyword density, length)
  3. Identify weak titles needing enrichment
  4. Call Claude AI to generate optimized titles
  5. Generate multi-market variants (NL, BE, DE, EN)
  6. Create A/B test variants
  7. Detect duplicates
  8. Write results to Google Sheets
  9. Format Channable-ready output
- **Integrations:** Claude AI (Anthropic), Google Sheets, Channable
- **Batch size:** 50 SKUs per run

### 3B. Product Title Optimizer (`/webhook/product-titles`)

- **Workflow file:** `public/workflows/product-title-optimizer.json`
- **Triggers:** Webhook POST
- **Steps:**
  1. Receive request with `action` parameter
  2. Route by action: `get_categories`, `export_csv`, `export_channable`
  3. Read product data from Google Sheets (ID: `1XhFgdJNY_y0QfCTtJbdoSEZBRSMe0EQ3O5Jek0jYKLY`)
  4. Analyze categories (missing brand, missing year, avg title length)
  5. Generate improved titles
  6. Export as CSV or Channable rules
- **Integrations:** Google Sheets, Channable

### 3C. SEO Audit (Form Trigger)

- **Workflow file:** `public/workflows/seo-audit-workflow.json`
- **Triggers:** Form Trigger (URL input), Gmail Trigger (from `hansvl3@gmail.com`)
- **Steps:**
  1. Receive landing page URL
  2. Scrape website content via HTTP Request
  3. Run Technical SEO Audit (OpenAI o1) — critical issues, quick wins, opportunities
  4. Run Content SEO Audit (OpenAI o1) — quality, keywords, readability
  5. Merge audit results
  6. Convert to HTML report
  7. Send via Gmail
- **Integrations:** OpenAI o1, Gmail
- **Cost:** ~$0.30 per page audit

### 3D. Health Check (`/webhook/health-check`)

- **Purpose:** System health monitoring triggered from Empire dashboard
- **Workflow file:** None in repo (exists on live N8N instance)

### 3E. Product Feed Optimizer (`/webhook/product-feed`)

- **Purpose:** Channable feed optimization
- **Workflow file:** `public/workflows/product-feed-optimizer.json` (template)

### 3F. Campaign Generator (`/webhook/campaign`)

- **Purpose:** Marketing campaign generation with AI
- **Workflow file:** `public/workflows/campaign-generator.json` (template)

### 3G. Web Scraper (`/webhook/scraper`)

- **Purpose:** Web scraping automation with AI analysis
- **Workflow file:** `public/workflows/web-scraper.json` (template)

---

## Category 4: Data Layer (Supabase)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `empire_events` | Audit trail with real-time subscriptions | `event_type`, `source`, `message`, `metadata` |
| `portal_tools` | Tool registry with webhook URLs in `config` JSON | `tool_type`, `config`, `sort_order`, `category` |
| `tool_attributes` | Key-value metadata for tools | `tool_id`, `key`, `value` |
| `portal_profiles` | User profiles with tab access | `tab_access` |
| `user_roles` | Admin/user role assignments | `role` |
| `user_tool_access` | Per-user tool permissions | `can_view`, `can_execute` |

---

## Category 5: Infrastructure Layer

| Component | Details |
|-----------|---------|
| **Primary VPS** | `srv1402218.hstgr.cloud` (187.124.1.75) — hosts N8N, Claude Code CLI in tmux "hansai" |
| **Secondary VPS** | `srv1411336.hstgr.cloud` (187.124.2.66) — SSH alias "industrial", Ed25519 key auth |
| **Cloudflare** | Zero Trust, 5 Workers (including `n8n-relay-proxy`), DNS, Tunnels for SSH |
| **Docker Stack** | MCP Gateway (port 3100), Loki (3101), Promtail, Grafana (3000) |
| **Supabase** | Project `oejeojzaakfhculcoqdh`, Edge Functions with `verify_jwt = false` |

---

## 5 Trigger Paths Summary

| Path | From | Through | To N8N | Description |
|------|------|---------|--------|-------------|
| 1 | HansAI `/run` | Direct `fetch()` | Any webhook | Terminal command triggers workflow directly |
| 2 | Empire Quick Actions | `trigger-webhook` edge fn | autoseo, product-titles, health-check | Dashboard buttons via Supabase proxy |
| 3 | Portal Webhook Tools | `trigger-webhook` edge fn | Any configured webhook | Tool cards with configurable URLs |
| 4 | Empire/Portal AI Chat | `n8n-agent` edge fn | None (generates JSON) | AI builds workflow JSON for manual import |
| 5 | Scheduled (N8N cron) | N8N internal | autoseo (Monday 06:00) | Automated recurring runs |

---

## Gaps and Notes

**Missing workflow JSON files** — three workflows are referenced in the codebase but had no exported JSON. Template files have been created in `public/workflows/`:
- `product-feed-optimizer.json`
- `campaign-generator.json`
- `web-scraper.json`

**Webhook URL duplication** — webhook URLs are hardcoded in both `src/pages/HansAI.tsx` (lines 11-18) and `src/components/empire/EmpireQuickActions.tsx` (line 37). These have been centralized into `src/lib/config/workflows.ts`.
