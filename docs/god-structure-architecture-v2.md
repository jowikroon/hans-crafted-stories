# The God Structure — AI Empire Architecture v2.0

> **Hans van Leeuwen | marketplacegrowth.nl**
> Updated: 2026-03-08 | Version 2.0
> Previous audit: 2026-03-07 v1.0

---

## Executive Summary

A 6-layer AI-powered SaaS platform with infrastructure automation across two domains: the marketplacegrowth.nl commercial SaaS and the hansvanleeuwen.com personal site / AI command center. The stack has matured significantly since v1.0 — the marketplacegrowth repo is now separated from the monorepo into its own standalone repository, Ollama models are deployed on the VPS, the God Structure dashboard has been committed to GitHub, and core infrastructure scores 8.5/10 on health.

**Current grade: B+** — Up from B. The SaaS backend is fully migrated (7 migrations, 6 Edge Functions, 14 validation rules), Ollama is live with qwen2.5 models, and the standalone repo is clean. Remaining gaps: security token rotation needed (GitHub PAT + Cloudflare API token exposed in session), Edge Functions still need an LLM API key, legacy tables still lack RLS, and the frontend isn't yet wired to the new backend.

---

## 1. The Stack (Current State)

```
┌─────────────────────────────────────────────────────────────────┐
│                        USERS                                     │
│           marketplacegrowth.nl  |  hansvanleeuwen.com            │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS
         ┌─────────────┼─────────────┐
         ▼                           ▼
┌────────────────────┐    ┌────────────────────────────────────────┐
│ LAYER 1A: FRONTEND │    │ LAYER 1B: FRONTEND                     │
│ Vercel             │    │ Cloudflare Pages                       │
│ marketplacegrowth  │    │ hansvanleeuwen                         │
│ React 18 + Vite    │    │ React 18 + Vite                        │
│ + Tailwind + shadcn│    │ + Tailwind + shadcn                    │
│ Repo: jowikroon/   │    │ Repo: jowikroon/                       │
│  marketplacegrowth │    │  hans-crafted-stories                  │
│ Domain: market     │    │ Domain: hansvanleeuwen.com             │
│  placegrowth.nl    │    │ + *.hansvanleeuwen.com subdomains      │
└────────┬───────────┘    └───────────────┬────────────────────────┘
         │                                │
         │  Supabase JS Client            │  Supabase JS Client
         │  (anon key)                    │  (anon key)
         ▼                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2: BACKEND — Supabase (pesfakewujjwkyybwaom, eu-central-1)│
│                                                                   │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────────┐    │
│  │ Auth         │  │ PostgreSQL    │  │ Edge Functions (7)  │    │
│  │ 2 admins     │  │ ~30 tables    │  │ generate-content    │    │
│  │ Email+OAuth  │  │ 14 val.rules  │  │ cb-generate         │    │
│  │ Google via   │  │ 7 migrations  │  │ cb-normalize        │    │
│  │  Lovable SDK │  │ pgvector ext  │  │ cb-validate         │    │
│  │ (to replace) │  │ 9 infra svcs  │  │ cb-repair           │    │
│  └──────────────┘  └───────────────┘  │ cb-export           │    │
│                                        │ create-n8n-workflow  │    │
│  ⚠️  Edge Functions need LLM API key  └────────────────────┘    │
│  ⚠️  Legacy infra tables lack RLS                                │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Webhook / HTTP
┌──────────────────────▼──────────────────────────────────────────┐
│  LAYER 3: AUTOMATION — n8n                                       │
│                                                                   │
│  ┌─ Hostinger VPS (PRIMARY) ────────────────────────────────┐   │
│  │  URL: https://n8n.srv1402218.hstgr.cloud                 │   │
│  │  22 workflows (7 active)                                  │   │
│  │  Active:                                                  │   │
│  │  ├── Claude Relay v2 (webhook gateway to all n8n APIs)   │   │
│  │  ├── Claude Relay v1 (legacy)                            │   │
│  │  ├── Hans Site Update Engine v3 (BJ Fogg + LLM)         │   │
│  │  ├── Docker Container Health Scanner (every 5 min)       │   │
│  │  ├── Service Endpoint Health Checker (every 5 min)       │   │
│  │  ├── State Snapshot Logger (every 15 min)                │   │
│  │  └── Change Detector (every 15 min)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ SSH / Docker API
┌──────────────────────▼──────────────────────────────────────────┐
│  LAYER 4: COMPUTE — Hostinger VPS Infrastructure                 │
│                                                                   │
│  ┌─ VPS1: Capital City (srv1402218 / 187.124.1.75) ─────────┐  │
│  │  Ubuntu 24.04 | 2 cores | 8GB RAM | 96GB disk            │  │
│  │  Docker containers:                                        │  │
│  │  ├── n8n (primary, via Traefik)                           │  │
│  │  ├── hansai-n8n (secondary, port 5679)                    │  │
│  │  ├── hansai-anythingllm (port 3001)                       │  │
│  │  ├── hansai-qdrant (ports 6333-6334)                      │  │
│  │  ├── hansai-ollama (port 11434)                           │  │
│  │  ├── ttyd (port 7681) — "Samantha terminal"               │  │
│  │  └── Traefik (reverse proxy, SSL)                         │  │
│  │  Non-Docker:                                               │  │
│  │  ├── Claude Code CLI v2.1.50 (/usr/local/bin/claude)      │  │
│  │  ├── PM2 process manager                                  │  │
│  │  └── tmux session: hansai (persistent)                    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─ VPS2: Industrial Zone (srv1411336 / 187.124.2.66) ──────┐  │
│  │  Role: Heavy processing / local LLM inference             │  │
│  │  ├── Ollama (qwen2.5:7b + qwen2.5:14b) ✅ DEPLOYED       │  │
│  │  └── Reserved for future compute workloads                │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│  LAYER 5: AI MODELS                                              │
│  ├── Claude API (via Supabase Edge Functions + direct CLI)       │
│  ├── Ollama local (qwen2.5:7b + qwen2.5:14b on VPS2) ✅ LIVE   │
│  ├── AnythingLLM (RAG interface, port 3001)                      │
│  └── Qdrant (vector search, ports 6333-6334)                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  LAYER 6: MONITORING & OBSERVABILITY                             │
│  ├── 4 n8n monitoring workflows (Docker, endpoints, snapshots)  │
│  ├── Host scripts: /opt/n8n-monitoring/ (Python)                │
│  ├── File-based logs: snapshots/ + changes.log (JSONL)          │
│  └── Infrastructure health: 8.5/10 (last check: 2026-03-08)    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Map

### 2.1 Complete Data Flow Diagram

```
                    ┌───────────────────────────────┐
                    │         USER BROWSER           │
                    │  marketplacegrowth.nl           │
                    │  hansvanleeuwen.com             │
                    └───────┬───────────┬────────────┘
                            │           │
                   (auth)   │           │  (data)
                            ▼           ▼
                    ┌───────────────────────────────┐
                    │      SUPABASE AUTH             │
                    │  Email + Google OAuth          │
                    │  JWT issued → anon key +       │
                    │  auth.uid() in token           │
                    └───────────────┬────────────────┘
                                    │
               ┌────────────────────┼────────────────────┐
               │                    │                    │
               ▼                    ▼                    ▼
    ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
    │  SaaS DOMAIN     │ │  INFRA DOMAIN    │ │  EDGE FUNCTIONS  │
    │  (user-facing)   │ │  (internal)      │ │  (AI processing) │
    │                  │ │                  │ │                  │
    │  profiles        │ │  infrastructure_ │ │  generate-content│
    │  workspaces      │ │    services (9)  │ │  cb-generate     │
    │  workspace_      │ │  infrastructure_ │ │  cb-normalize    │
    │    members       │ │    state         │ │  cb-validate     │
    │  brands          │ │  infrastructure_ │ │  cb-repair       │
    │  content_        │ │    change_log    │ │  cb-export       │
    │    projects      │ │  empire_vector_  │ │  create-n8n-     │
    │  product_inputs  │ │    memory        │ │    workflow      │
    │  generated_      │ │  ai_sessions     │ │                  │
    │    listings      │ │  ai_lessons_     │ │  Calls:          │
    │  generated_      │ │    learned       │ │  → Claude API    │
    │    content       │ │  workflow_history │ │  → Gemini API    │
    │  publications    │ │  sov_projects    │ │  (fallback)      │
    │  export_jobs     │ │  sov_executions  │ └──────────────────┘
    │  validation_     │ │                  │
    │    rules (14)    │ │  seo_news_digest │
    │                  │ │  user_roles      │
    │  RLS: ✅ ON      │ │  RLS: ⚠️ PARTIAL │
    └──────────────────┘ └──────────────────┘
               │                    │
               │                    │
               ▼                    ▼
    ┌──────────────────────────────────────────┐
    │         n8n WORKFLOWS                     │
    │  Read/write via service_role key          │
    │                                           │
    │  Claude Relay ◄──── webhook calls         │
    │       │                                   │
    │       ├──► n8n internal API               │
    │       ├──► Supabase REST                  │
    │       ├──► GitHub API                     │
    │       └──► Cloudflare API                 │
    │                                           │
    │  Monitoring Suite ──► file-based logs     │
    │  (Docker, Endpoints,  (snapshots/ dir)    │
    │   Snapshots, Changes)                     │
    │                                           │
    │  Hans Site Update Engine                  │
    │       │                                   │
    │       ├──► BJ Fogg behavioral filter      │
    │       ├──► Builder router (Claude/GPT/    │
    │       │    Gemini/Lovable)                │
    │       └──► GitHub push → auto-deploy      │
    └──────────────────────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────────┐
    │         EXTERNAL SERVICES                 │
    │                                           │
    │  Google Sheets ──── Magento 2 product     │
    │    1XhFg...KLY       export data          │
    │                                           │
    │  Channable ───────── Feed management      │
    │                      SEO rules export     │
    │                                           │
    │  Cloudflare ──────── DNS, Workers,        │
    │    7fe1db55...39      Pages hosting        │
    │                                           │
    │  GitHub ──────────── jowikroon/           │
    │                      marketplacegrowth    │
    │                      hans-crafted-stories │
    │                                           │
    │  Vercel ──────────── marketplacegrowth.nl │
    │    prj_jpiL4...lW    deploy pipeline      │
    └──────────────────────────────────────────┘
```

### 2.2 Database Table Inventory

**SaaS Domain (RLS enabled, user-facing)**

| Table | Purpose | Rows | FK Dependencies | RLS |
|---|---|---|---|---|
| `profiles` | User accounts, linked to auth.users | Active | → auth.users | ✅ |
| `workspaces` | Multi-tenant workspace containers | Active | → profiles (created_by) | ✅ |
| `workspace_members` | User ↔ workspace membership | Active | → workspaces, → profiles | ✅ |
| `brands` | Client brands per workspace | Active | → workspaces | ✅ |
| `content_projects` | Content generation projects | Active | → workspaces, → brands | ✅ |
| `product_inputs` | Raw product data for optimization | Active | → content_projects | ✅ |
| `generated_listings` | AI-generated product listings | Active | → content_projects, → product_inputs | ✅ |
| `generated_content` | General AI-generated content | Active | → workspaces | ✅ |
| `publications` | Published content records | Active | → generated_content, → workspaces | ✅ |
| `export_jobs` | Bulk export tracking | Active | → content_projects | ✅ |
| `validation_rules` | Amazon DE/FR marketplace rules | 14 seeded | None | ✅ |

**Infrastructure Domain (RLS partially missing)**

| Table | Purpose | Rows | RLS |
|---|---|---|---|
| `infrastructure_services` | Registered services (9 entries) | 9 | ⛔ OFF |
| `infrastructure_state` | CPU/memory/disk snapshots | 0 | ⛔ OFF |
| `infrastructure_change_log` | Change detection log | 0 | ⛔ OFF |
| `empire_vector_memory` | pgvector embeddings (384-dim) | Low | ⛔ OFF |
| `ai_sessions` | AI session tracking | Low | ⛔ OFF |
| `ai_lessons_learned` | AI learning memory | Low | ⛔ OFF |
| `workflow_history` | n8n workflow execution log | Low | ⛔ OFF |
| `sov_projects` | Sovereign OS project tracking | Low | Partial |
| `sov_executions` | Sovereign OS execution log | Low | Partial |

**Other Tables**

| Table | Purpose | RLS |
|---|---|---|
| `seo_news_digest` | SEO news (written by n8n) | ⚠️ Overly permissive |
| `user_roles` | Admin role detection | Partial |

### 2.3 Content Builder Pipeline (Data Flow)

```
content_projects (workspace + brand context)
       │
       ├──► product_inputs (raw product data uploaded)
       │         │
       │         ▼
       │    Edge Fn: cb-normalize (clean/standardize)
       │         │
       │         ▼
       │    Edge Fn: cb-generate (AI listing generation)
       │         │
       │         ▼
       │    generated_listings (AI output stored)
       │         │
       │         ▼
       │    Edge Fn: cb-validate (check against validation_rules)
       │         │
       │         ▼
       │    Edge Fn: cb-repair (fix validation failures)
       │         │
       │         ▼
       └──► export_jobs (bulk export to CSV/Channable)
                 │
                 ▼
            Edge Fn: cb-export (format + deliver)
```

### 2.4 Authentication & Authorization Flow

```
User arrives at marketplacegrowth.nl
       │
       ├──► Email/password signup
       │    └──► Supabase Auth → JWT with auth.uid()
       │
       └──► Google OAuth (currently via @lovable.dev/cloud-auth-js)
            └──► Redirect to Supabase → JWT with auth.uid()
       │
       ▼
  JWT contains auth.uid() → used in all RLS policies
       │
       ├──► is_workspace_member(workspace_id) helper function
       │    └──► Checks workspace_members table
       │
       └──► Admin detection: useAdmin.tsx hook
            └──► Checks env var + user_roles table
```

### 2.5 MCP Connection Map

```
Claude.ai (this session)
       │
       ├──► Hostinger n8n MCP
       │    https://n8n.srv1402218.hstgr.cloud/mcp-server/http
       │    Token: Bearer (mcp-server-api audience)
       │    Access: search, execute, get details
       │
       ├──► Supabase MCP
       │    https://mcp.supabase.com/mcp
       │    Access: SQL, migrations, Edge Functions
       │
       ├──► Cloudflare MCP
       │    https://bindings.mcp.cloudflare.com/mcp
       │    Account: 7fe1db55d4caa07b7488d8b298fd9f39
       │
       ├──► Hugging Face MCP
       │    https://huggingface.co/mcp
       │    User: jowikroon
       │
       ├──► Figma MCP
       │    https://mcp.figma.com/mcp
       │
       ├──► Gmail / Google Calendar MCPs
       │
       ├──► Linear MCP
       │
       ├──► Vercel MCP
       │
       └──► Slack MCP

Claude Code CLI (VPS1)
       │
       ├──► /root/.claude.json
       │    ├── n8n-hostinger (X-N8N-API-KEY header)
       │    └── n8n-cloud (X-N8N-API-KEY header)
       │
       └──► tmux session: hansai
            └── Persistent workspace at /opt/hansai/
```

---

## 3. What's Working Well

**Repo separation complete.** marketplacegrowth.nl is now a standalone repository at `github.com/jowikroon/marketplacegrowth` with a clean single commit, no monorepo history. hansvanleeuwen.com remains in `hans-crafted-stories`. Both deploy independently.

**Frontend deployment pipelines** are clean on both projects: push to `main` → auto-build → production. marketplacegrowth deploys via Vercel (~20s builds), hansvanleeuwen via Cloudflare Pages.

**Database schema** is properly migrated via 7 sequential Supabase migrations. The Content Builder pipeline has proper foreign keys, enum types, `is_workspace_member()` helper function, and 14 seeded Amazon DE/FR validation rules. RLS is enabled on all SaaS tables.

**Edge Functions** cover the complete Content Builder lifecycle with a shared `_shared/llm.ts` LLM abstraction layer.

**n8n automation** is powerful. The Claude Relay v2 webhook gives programmatic control over all 22 workflows. The 4 monitoring workflows provide real infrastructure observability. Health score: 8.5/10.

**Ollama deployed.** Both qwen2.5:7b and qwen2.5:14b models are running on VPS2, unblocking local AI inference for the AutoSEO Brain and JSON Workflow Improver.

**God Structure dashboard** committed to GitHub (commit `96aa700`) with full React visualization.

**Infrastructure services registered.** 9 services catalogued in the `infrastructure_services` table: n8n (Hostinger), n8n (secondary), Traefik, AnythingLLM, Qdrant, Ollama, n8n Cloud, Supabase, Vercel, and Cloudflare Workers.

---

## 4. Critical Issues (Fix These First)

### 4.0 BLOCKER: Edge Functions Have No LLM API Key ⛔

The `generate-content` and `content-builder-generate` Edge Functions read `GEMINI_API_KEY` (primary) or `LOVABLE_API_KEY` (fallback) from `_shared/llm.ts`. Neither is set. All AI generation fails silently.

**Fix:** Supabase Dashboard → Edge Functions → Secrets → add `GEMINI_API_KEY` or refactor to use `ANTHROPIC_API_KEY` for Claude.

### 4.1 SECURITY: Exposed Tokens Need Immediate Rotation ⛔

The verification report (2026-03-08) confirmed that a GitHub PAT and Cloudflare API token shared during a previous session are still valid and exposed. These must be rotated immediately.

**Fix:**
- GitHub: github.com/settings/tokens → revoke + regenerate
- Cloudflare: dash.cloudflare.com → API Tokens → revoke + regenerate
- Update all n8n credentials and Claude Code configs with new tokens

### 4.2 SECURITY: 6 Legacy Tables Without RLS ⛔

These infrastructure tables are queryable by anyone with the anon key:

| Table | Risk Level |
|---|---|
| `ai_sessions` | HIGH — contains session PII |
| `infrastructure_services` | HIGH — reveals full infra topology |
| `infrastructure_state` | HIGH — CPU/memory/disk data |
| `infrastructure_change_log` | MEDIUM |
| `ai_lessons_learned` | MEDIUM |
| `empire_vector_memory` | MEDIUM — AI memory contents |

**Fix:** Enable RLS with admin-only policies, or move to a separate `infra` schema not exposed via PostgREST.

### 4.3 SECURITY: Leaked Password Protection Disabled ⚠️

Supabase HaveIBeenPwned check is off. Enable in Supabase Dashboard → Auth → Security.

### 4.4 SECURITY: Overly Permissive RLS on `seo_news_digest` ⚠️

Anonymous users can INSERT and UPDATE any row. Use service_role key from n8n instead.

### 4.5 AUTH: Lovable OAuth Dependency 🔧

Google OAuth goes through `@lovable.dev/cloud-auth-js` — a third-party proxy. Replace with direct Supabase Google OAuth provider. Google OAuth credentials are available (Client ID: `773115162300-...hd0k.apps.googleusercontent.com`).

### 4.6 AUTH: Verify Site URL Configuration 🔧

Confirm in Supabase Dashboard → Auth → URL Configuration that Site URL = `https://marketplacegrowth.nl` and redirect URLs include both `https://marketplacegrowth.vercel.app/**` and `https://marketplacegrowth.nl/**`.

### 4.7 DEPLOY: God Structure Dashboard Not Publicly Accessible ⚠️

The god-structure.html file exists in the repo but lives in `apps/personal/public/` instead of the root `public/` directory — meaning it doesn't get copied to `dist/` during build.

**Fix:** Move to `public/` in the correct repo, or serve via a dedicated route.

### 4.8 INFRA: Self-hosted Supabase DOWN ⚠️

Returns 504 Gateway Timeout. Docker container likely not running or hung. This is on VPS1 and separate from the cloud Supabase project used for production.

---

## 5. Performance Issues (Fix Before Scale)

### 5.1 RLS Policies Re-evaluate `auth.uid()` Per Row

28 policies across 10 tables use `auth.uid()` directly instead of `(select auth.uid())`. At scale, the auth function runs for every row scanned.

**Fix pattern:**
```sql
-- SLOW (current)
USING (auth.uid() = user_id)

-- FAST (optimal)
USING ((select auth.uid()) = user_id)
```

### 5.2 Missing Foreign Key Indexes

6 foreign keys lack covering indexes: `brands.workspace_id`, `content_projects.brand_id`, `generated_content.workspace_id`, `publications.content_id`, `publications.workspace_id`, `empire_vector_memory.service_id`.

### 5.3 Duplicate RLS Policies on `workspaces`

Two permissive SELECT policies both fire for every query. Merge into one.

### 5.4 Frontend Bundle Size: 930KB

Entire app ships as single JS chunk. Route-level code splitting with `React.lazy()` would cut initial load to ~200KB.

### 5.5 46 Unused Indexes

Infrastructure and monitoring tables have indexes that have never been used. Consuming storage and slowing writes.

---

## 6. The God Structure (Target Architecture)

```
                    ┌─────────────────┐
                    │   USERS          │
                    │   Browser/API    │
                    └────────┬────────┘
                             │
              ┌──────────────▼──────────────┐
              │  CDN / EDGE                  │
              │  Vercel (marketplacegrowth)  │
              │  Vercel (hansvanleeuwen)      │
              │  Route-split bundles         │
              │  Edge Middleware (auth check) │
              └──────────────┬──────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐       ┌─────▼─────┐      ┌─────▼──────┐
    │ Supabase │       │ Supabase  │      │ Supabase   │
    │ Auth     │       │ Database  │      │ Edge Fns   │
    │          │       │           │      │            │
    │ Google   │       │ SaaS      │      │ generate   │
    │ (direct) │       │ schema    │      │ validate   │
    │ Email    │       │           │      │ repair     │
    │          │       │ Infra     │      │ export     │
    │          │       │ schema    │      │ normalize  │
    └──────────┘       │ (separate)│      └─────┬──────┘
                       └───────────┘            │
                                         ┌──────▼──────┐
                                         │ Claude API  │
                                         │ (Anthropic) │
                                         └─────────────┘
         ┌────────────────────────────────────────────┐
         │  AUTOMATION LAYER (n8n)                     │
         │                                             │
         │  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
         │  │ Relay    │  │ Site     │  │ Monitor  │ │
         │  │ Gateway  │  │ Update   │  │ Suite    │ │
         │  │ (webhook)│  │ Engine   │  │ (4 wfs)  │ │
         │  └──────────┘  └──────────┘  └──────────┘ │
         │                                             │
         │  ┌──────────────────────────────────────┐  │
         │  │ VPS1: Capital (Orchestration)         │  │
         │  │ n8n, Traefik, Claude Code, ttyd       │  │
         │  │ AnythingLLM, Qdrant                   │  │
         │  ├──────────────────────────────────────┤  │
         │  │ VPS2: Industrial (Inference)          │  │
         │  │ Ollama (qwen2.5:7b + qwen2.5:14b)    │  │
         │  └──────────────────────────────────────┘  │
         └────────────────────────────────────────────┘
```

### Key Principles

1. **Separate repos, separate deploys.** marketplacegrowth → Vercel. hansvanleeuwen → Vercel. No monorepo.
2. **One database, domain separation.** SaaS tables in default schema with full RLS. Infrastructure in `infra` schema or separate project.
3. **Every table has RLS.** No exceptions. n8n writes via service_role key, never anon.
4. **RLS uses `(select auth.uid())`.** Subquery pattern prevents per-row re-evaluation.
5. **Edge Functions handle all AI calls.** Frontend never talks to Claude/Gemini directly.
6. **n8n is the orchestration brain.** Scheduled tasks, multi-step workflows, infra management. NOT user-facing API requests.
7. **VPS1 = orchestration, VPS2 = inference.** Do not mix roles.
8. **BJ Fogg filter on all site changes.** Every update must serve Motivation, Ability, or Prompt.
9. **Monitoring writes to database.** Not host files. Queryable and dashboardable.
10. **Every push is tested.** GitHub Actions runs typecheck + build before deploy.

---

## 7. Priority Fix Roadmap

| Priority | Task | Effort | Impact | Status |
|---|---|---|---|---|
| 🔴 P0 | **Rotate exposed GitHub PAT + Cloudflare API token** | 10 min | Security | ❌ Open |
| 🔴 P0 | **Set LLM API key in Supabase Edge Function secrets** | 2 min | Unblocks AI gen | ❌ Open |
| 🔴 P0 | Enable RLS on 6 legacy infra tables | 30 min | Security | ❌ Open |
| 🔴 P0 | Enable leaked password protection | 2 min | Security | ❌ Open |
| 🟡 P1 | Fix RLS `auth.uid()` → `(select auth.uid())` (28 policies) | 1 hour | Performance | ❌ Open |
| 🟡 P1 | Add missing FK indexes (6 tables) | 15 min | Performance | ❌ Open |
| 🟡 P1 | Replace Lovable OAuth with direct Supabase Google OAuth | 1 hour | Independence | ❌ Open |
| 🟡 P1 | Verify Supabase Site URL = `https://marketplacegrowth.nl` | 2 min | Auth flows | ❌ Open |
| 🟡 P1 | Move God Structure dashboard to correct public/ directory | 15 min | Accessibility | ❌ Open |
| ✅ Done | Database schema + 7 migrations | — | — | ✅ |
| ✅ Done | Deploy 7 Edge Functions | — | — | ✅ |
| ✅ Done | Update TypeScript types | — | — | ✅ |
| ✅ Done | Separate marketplacegrowth into standalone repo | — | — | ✅ |
| ✅ Done | Deploy Ollama (qwen2.5:7b + qwen2.5:14b) on VPS2 | — | — | ✅ |
| ✅ Done | Commit God Structure dashboard to GitHub | — | — | ✅ |
| ✅ Done | Register 9 infrastructure services in Supabase | — | — | ✅ |
| ✅ Done | Set up 4 monitoring workflows in n8n | — | — | ✅ |
| 🟢 P2 | Add admin role to profiles table | 15 min | Access control | ❌ Open |
| 🟢 P2 | Merge duplicate workspace SELECT policies | 15 min | Performance | ❌ Open |
| 🟢 P2 | Route-level code splitting (React.lazy) | 2 hours | Page load | ❌ Open |
| 🟢 P2 | Add GitHub Actions CI (typecheck + build) | 30 min | Deploy safety | ❌ Open |
| 🟢 P2 | Wire frontend pages to new backend (workspace, brands) | 4 hours | Features | ❌ Open |
| 🔵 P3 | Move infra tables to separate schema | 1 hour | Clean separation | ❌ Open |
| 🔵 P3 | Connect monitoring to Supabase instead of files | 2 hours | Observability | ❌ Open |
| 🔵 P3 | Clean up 15 inactive n8n workflows | 30 min | Clarity | ❌ Open |
| 🔵 P3 | Add Edge Function error monitoring | 1 hour | Reliability | ❌ Open |
| 🔵 P3 | Fix self-hosted Supabase (504 timeout) | 1 hour | Infra | ❌ Open |
| 🔵 P3 | Create OG image for social sharing | 30 min | Marketing | ❌ Open |

---

## 8. Connected Service Map

| Service | URL / ID | Role | Status |
|---|---|---|---|
| **Vercel** | `prj_jpiL4aZ58kd1tCwGJ9kbZSWSb9lW` | marketplacegrowth frontend | ✅ Live |
| **Vercel** | `prj_AzLljugBWGCWo9lJiclEKKNTqLLz` | hansvanleeuwen frontend | ✅ Live |
| **Cloudflare** | Account: `7fe1db55d4caa07b7488d8b298fd9f39` | DNS, Workers, CDN | ✅ Active |
| **GitHub** | `jowikroon/marketplacegrowth` | MG source code (standalone) | ✅ Connected |
| **GitHub** | `jowikroon/hans-crafted-stories` | HVL source code | ✅ Connected |
| **GitHub** | `jowikroon/hans-crafted-stories` (monorepo) | ARCHIVE — extracted from | ⚪ Archived |
| **Supabase** | `pesfakewujjwkyybwaom` (eu-central-1) | Database + Auth + Edge Fns | ✅ Active |
| **Hostinger VPS1** | `srv1402218` / 187.124.1.75 | Capital: n8n + Docker + AI | ✅ Running |
| **Hostinger VPS2** | `srv1411336` / 187.124.2.66 | Industrial: Ollama inference | ✅ Running |
| **Hostinger n8n** | `n8n.srv1402218.hstgr.cloud` | Primary workflow automation | ✅ 7 active |
| **Ollama** | `187.124.2.66:11434` | Local AI (qwen2.5:7b + 14b) | ✅ Running |
| **Qdrant** | `172.20.0.1:6333` | Vector database | ✅ Running |
| **AnythingLLM** | `172.20.0.1:3001` | RAG interface | ✅ Running |
| **Claude Code** | `/usr/local/bin/claude` on VPS1 | CLI AI agent | ✅ Installed |
| **Google Sheets** | `1XhFg...KLY` | Magento 2 product export | ✅ Connected |
| **Channable** | Feed management | SEO rules + product feeds | ✅ In use |
| **Cloudflare Workers** | `n8n-relay-proxy` + templates | Edge API gateway | ✅ Deployed |

---

## 9. Repository Structure

### marketplacegrowth (standalone)

```
marketplacegrowth/
├── src/
│   ├── components/          # React components + shadcn/ui
│   ├── hooks/               # useAuth, useAdmin, custom hooks
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts    # Supabase init (VITE_SUPABASE_URL + KEY)
│   │       └── types.ts     # Generated types (903 lines, all tables)
│   ├── pages/               # Index, Work, Writing, Portal, Empire, HansAI
│   ├── lib/
│   │   └── api/             # portal.ts, API helpers
│   └── data/                # content.ts, static data
├── supabase/
│   ├── migrations/          # 7 sequential migrations
│   └── functions/           # 7 Edge Functions + _shared/llm.ts
├── vercel.json              # SPA rewrite + cache headers
├── vite.config.ts           # Build config
├── package.json             # Standalone (no monorepo deps)
└── .env.example             # Required env vars
```

### hans-crafted-stories (hansvanleeuwen.com)

```
hans-crafted-stories/
├── apps/
│   ├── personal/            # hansvanleeuwen.com main site
│   └── thought-canvas/      # hansvanleeuwen.com/blogs
├── packages/
│   ├── ui/                  # Shared UI components
│   └── config/              # Shared configs
├── supabase/                # Auth + database
└── public/
    └── god-structure.html   # Infrastructure dashboard (needs move)
```

---

## 10. Key Credentials & Security

| Credential | Location | Status |
|---|---|---|
| Google OAuth Client ID | `773115162300-...hd0k.apps.googleusercontent.com` | ✅ Stored in memory |
| Google OAuth Secret | `GOCSPX-L9i96S-...T4l9` | ✅ Stored in memory |
| GitHub PAT | n8n credential: `Claude Architect GitHub` | ⛔ ROTATE — exposed in session |
| Cloudflare API token | Cloudflare dashboard | ⛔ ROTATE — exposed in session |
| Supabase anon key | Frontend env vars | ✅ Set |
| Supabase service_role key | n8n + Edge Functions | ✅ Set |
| n8n MCP tokens | Bearer (mcp-server-api audience) | ✅ Working |
| Hostinger n8n API key | n8n Settings > API | ✅ Working |
| Ollama | No auth needed (internal network) | ✅ N/A |

---

## 11. Locked Decisions

1. **Separate repos.** `marketplacegrowth` is standalone. `hans-crafted-stories` is for hansvanleeuwen.com. No more monorepo.
2. **npm only.** No bun. No yarn. Compatibility across all deploy targets.
3. **Vercel for both marketplacegrowth and hansvanleeuwen.** Separate repos, separate Vercel projects, separate deploy pipelines.
4. **Single Supabase project** (cloud) for both sites. Separate schemas later if needed.
5. **VPS1 = orchestration, VPS2 = inference.** Do not mix compute roles.
6. **One builder per request.** BJ Fogg filter → single AI builder. No chaining.
7. **MCP server tokens** use `mcp-server-api` audience, not `public-api`.
8. **VPS hostnames** (`srv1402218.hstgr.cloud`) for SSL, not custom domains (avoids Cloudflare proxy interference with Let's Encrypt).

---

*This is the single source of truth. Every architectural decision, every fix, every optimization starts here. Version 2.0 reflects the state as of 2026-03-08.*
