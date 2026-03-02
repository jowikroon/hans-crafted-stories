# User Flow & AI Interfaces — Overview

This document describes (1) how users reach the site and access **Command Center AI** vs all other paths, (2) a full list of **AI interfaces** with how they work, what they do, who they talk to, and what they are successful at, and (3) your **n8n environment** details (to fill in).

---

## 1. User flow: site entry and access to Command Center AI vs other paths

### 1.1 Entry points to the site

| Entry | Who | Where |
|-------|-----|--------|
| **Public site** | Anyone | `https://hansvanleeuwen.com` — Home, Work, Writing, About. Nav shows Command Center link and “Command Center” button only when **logged in**. |
| **Portal** | Logged-in users | `https://hansvanleeuwen.com/portal` — Dashboard (Tools, Content, Pages, Status, Users). Admin-only areas depend on role. |
| **HansAI (full terminal)** | Logged-in users | `https://hansvanleeuwen.com/hansai` — Full-page Command Center terminal. Linked from nav and from “Full Terminal →” in the overlay. |
| **Empire** | Admin only | `https://hansvanleeuwen.com/empire` — Operations dashboard, health grid, Empire Commander AI panel. |
| **Wiki (AI Guide)** | Admin only | `https://hansvanleeuwen.com/wiki` — Documentation of tools and how to use Command Center. |

### 1.2 Flow: reaching Command Center AI

```
User on site (any page)
    │
    ├─ Not logged in
    │      → Sees public pages only. No Command Center in nav (or link visible but gated).
    │
    └─ Logged in
           │
           ├─ Clicks "Command Center" in navbar (or pill / mobile item)
           │      → Opens Command Center overlay (HansAIOverlay)
           │      → Inside: UnifiedChatPanel (intent-first: pipeline → workflow or AI)
           │
           ├─ Clicks nav link to /hansai
           │      → Full HansAI page (terminal UI)
           │      → Same intent pipeline + slash commands (/run, /workflows, /ai, etc.)
           │      → Workflow match → n8n webhook; chat fallback → hansai-chat (streaming)
           │
           └─ Goes to /portal
                  → Can open "Command Center" panel (same UnifiedChatPanel as overlay)
                  → Cmd+E / Cmd+J toggles Command Center panel
                  → Can open "n8n Agent" modal (N8nAgentModal) for workflow build/fix/troubleshoot
```

So **Command Center AI** is reached by:

- **Overlay:** Navbar → “Command Center” → **UnifiedChatPanel** (intent pipeline + fallback to AI).
- **Full terminal:** Nav or “Full Terminal →” → **/hansai** → **HansAI** page (intent pipeline + slash commands; chat via **hansai-chat**).

Both use the **same intent pipeline** (fast route + LLM) to decide “run a workflow” vs “answer with AI”.

### 1.3 Flow: all other (non–Command Center) AI and automation

| Path | What user does | Result |
|------|----------------|--------|
| **Portal → n8n Agent** | Opens n8n Agent (e.g. from Tools or Cmd+J if wired) | **N8nAgentModal** → chat with **n8n-agent** (build/fix/troubleshoot n8n workflows). No intent pipeline; direct AI. |
| **Portal → Tool card** | Clicks a webhook tool (e.g. AutoSEO, Health Check) | **WebhookTriggerModal** or direct trigger → **n8n** webhook (or **trigger-webhook** Supabase function → n8n). No AI chat. |
| **Empire → Empire Commander** | Opens Claude/Commander panel on /empire | **EmpireClaudePanel** → **n8n-agent** (Empire Commander system prompt). No intent pipeline. |
| **Portal → Empire overlay** | Opens Empire overlay from Portal | **EmpireOverlay** → same style chat → **n8n-agent** (Empire Commander prompt). No intent pipeline. |
| **HansAI terminal** | Types **/ai** or natural language that falls back to chat | **hansai-chat** (streaming) with HansAI persona + optional hierarchy context. |
| **HansAI terminal** | Types **/run &lt;name&gt;** or message that matches a workflow | **Intent pipeline** → **triggerWorkflow** → **n8n** webhook directly (no Supabase proxy). |

So:

- **Command Center (overlay + /hansai)** = intent pipeline (keyword + LLM) → either **run n8n workflow** or **AI reply** (UnifiedChatPanel → n8n-agent; HansAI → hansai-chat for chat).
- **All other AI** = direct chat to **n8n-agent** (N8nAgentModal, EmpireClaudePanel, EmpireOverlay) or **hansai-chat** (HansAI /ai or chat fallback), or direct **n8n** webhook with no AI.

---

## 2. Full list of AI interfaces

For each interface we list: **how it works**, **what it does**, **who it talks to**, and **what it’s successful at**.

---

### 2.1 Command Center (overlay) — UnifiedChatPanel

| Field | Detail |
|-------|--------|
| **Where** | Navbar “Command Center” → **HansAIOverlay** → **UnifiedChatPanel**. Same panel when “Command Center” is opened from **Portal**. |
| **How it works** | User types a message → **runIntentPipeline** (frontend) → **intent-router** (Supabase) for LLM classification. Outcome: (1) **workflow_match** → trigger that n8n webhook; (2) **clarify** → show workflow choices; (3) **unhandled** → log + still send to AI; (4) **chat_fallback** → send to AI. AI replies go through **n8n-agent** (non-streaming). |
| **What it does** | Intent-first: classify goal → run the right n8n workflow or answer with AI. Shows pipeline stages (TRANSMIT → INTENT → ANALYZE → SYNTHESIZE → COMPLETE). Model picker (Gemini/GPT), context filters, suggestion chips, clarification buttons. |
| **Who it talks to** | **intent-router** (Supabase, LLM: e.g. Gemini) for classification; **n8n** webhooks (direct from browser) for workflow execution; **n8n-agent** (Supabase) for AI replies. |
| **Successful at** | Routing clear intents (e.g. “run health check”, “optimize product titles”) to the right workflow; answering when no workflow matches or user asks a question; clarifying when intent is ambiguous. |

---

### 2.2 Command Center (full terminal) — HansAI page

| Field | Detail |
|-------|--------|
| **Where** | **/hansai** — full-page terminal. Linked from nav and from overlay “Full Terminal →”. |
| **How it works** | Slash commands (/help, /run, /workflows, /ai, /task, /idea, /campaign, /prompt, /clear) or plain text. Plain text → **runIntentPipeline** (same as overlay). If **workflow_match** → **triggerWorkflow** (direct n8n webhook). If **chat_fallback** or user typed **/ai** → **hansai-chat** (streaming). Tasks/ideas stored locally. Hierarchy (Laag 1–3) sent to hansai-chat as context. |
| **What it does** | Terminal-style Command Center: run workflows by name or natural language, chat with AI (streaming), save tasks/ideas, open campaign/prompt forms, list workflows. |
| **Who it talks to** | **intent-router** (Supabase) for classification; **n8n** webhooks directly for workflows; **hansai-chat** (Supabase, streaming) for chat. |
| **Successful at** | Power users: /run, /workflows, /ai; natural language workflow trigger; streaming chat with HansAI persona and hierarchy; tasks/ideas. |

---

### 2.3 hansai-chat (Supabase Edge Function)

| Field | Detail |
|-------|--------|
| **Where** | Backend. Called only from **HansAI** page when chat is needed (e.g. /ai or chat_fallback). |
| **How it works** | Receives `messages`, optional `model`, optional `router_context` (hierarchy). Adds hierarchy to system prompt. Calls **Lovable AI gateway** (`ai.gateway.lovable.dev`) with selected model (e.g. Gemini), **stream: true**. Returns SSE stream. |
| **What it does** | Streaming chat for HansAI terminal: HansAI persona, Dutch/English, Empire infrastructure context, optional Command Center focus from hierarchy. |
| **Who it talks to** | **Lovable AI gateway** (external). No n8n, no DB. |
| **Successful at** | Conversational answers, follow-ups, streaming UX; infrastructure/SEO/n8n advice in Hans’s voice; language matching. |

---

### 2.4 intent-router (Supabase Edge Function)

| Field | Detail |
|-------|--------|
| **Where** | Backend. Called from **UnifiedChatPanel** and **HansAI** when processing a user message (runIntentPipeline). |
| **How it works** | Receives `input`, optional `context`, optional `router_context`. Uses fixed workflow list (autoseo, product-titles, health-check, product-feed, campaign, scraper; monday-orchestrator not in prompt). Sends to **Lovable AI gateway** (e.g. Gemini) with strict JSON instruction: intent, confidence, missing_params, clarification. Returns one workflow name or “unknown”. |
| **What it does** | Classifies user intent into one of the known workflows or “unknown” so the frontend can run a webhook or fall back to chat. |
| **Who it talks to** | **Lovable AI gateway** only. No n8n, no DB. |
| **Successful at** | Clear workflow-like phrases (“run health check”, “optimize titles”); avoids treating “what can you do” as a workflow. |

---

### 2.5 n8n-agent (Supabase Edge Function)

| Field | Detail |
|-------|--------|
| **Where** | Backend. Called from **UnifiedChatPanel**, **N8nAgentModal**, **EmpireClaudePanel**, **EmpireOverlay**, **InlineChatPanel** (if used). |
| **How it works** | Receives `system` (prompt) and `messages`. Optional `model` (UnifiedChatPanel). Single non-streaming request to **Lovable AI gateway** (default e.g. Gemini 2.5 Flash). Returns `{ reply }`. |
| **What it does** | Generic “chat with AI” endpoint. Behavior is entirely determined by the **system** prompt and **messages** each caller sends. |
| **Who it talks to** | **Lovable AI gateway** only. No n8n, no DB. |
| **Successful at** | Whatever the caller’s prompt targets: Command Center general answers (UnifiedChatPanel), n8n workflow build/fix/troubleshoot (N8nAgentModal), Empire ops (EmpireClaudePanel, EmpireOverlay). |

---

### 2.6 N8n Agent Modal (Portal)

| Field | Detail |
|-------|--------|
| **Where** | **Portal** → n8n Agent button or (if configured) Cmd+J → **N8nAgentModal**. |
| **How it works** | User chats in the modal. Each message is sent to **n8n-agent** with a **fixed system prompt**: n8n workflow engineer (build workflows, fix workflows, troubleshoot). No intent pipeline; no workflow execution. |
| **What it does** | Dedicated “n8n expert” chat: get JSON workflows, fix errors, debug triggers/credentials. Suggestions: build Gmail→Slack, fix Code node error, troubleshoot Schedule trigger. |
| **Who it talks to** | **n8n-agent** (Supabase) → Lovable AI gateway. |
| **Successful at** | Generating or correcting n8n workflow JSON; explaining n8n nodes and best practices; troubleshooting execution/credential issues. |

---

### 2.7 Empire Commander — EmpireClaudePanel

| Field | Detail |
|-------|--------|
| **Where** | **/empire** page → “Empire Commander” / Claude panel. |
| **How it works** | User types; message + **Empire Commander** system prompt (and optional context from empireCategories) sent to **n8n-agent**. Non-streaming. |
| **What it does** | Ops-focused AI: n8n, Cloudflare, VPS, Docker MCP, Supabase, Claude CLI. Diagnose, give commands, workflow JSON, markdown. |
| **Who it talks to** | **n8n-agent** (Supabase) → Lovable AI gateway. |
| **Successful at** | Infrastructure and workflow troubleshooting; exact commands and step-by-step fixes; Empire context. |

---

### 2.8 Empire Overlay

| Field | Detail |
|-------|--------|
| **Where** | **Portal** → Empire button → **EmpireOverlay**. |
| **How it works** | Same as EmpireClaudePanel: chat UI with Empire Commander prompt + optional context → **n8n-agent**. |
| **What it does** | Same ops-focused AI as Empire Commander, but from the Portal without going to /empire. |
| **Who it talks to** | **n8n-agent** (Supabase) → Lovable AI gateway. |
| **Successful at** | Same as EmpireClaudePanel. |

---

### 2.9 InlineChatPanel (component)

| Field | Detail |
|-------|--------|
| **Where** | Component exists in codebase; referenced in docs for “Cmd+E / Cmd+J”. Current Portal uses **UnifiedChatPanel** and **N8nAgentModal** instead; confirm in app where/if InlineChatPanel is rendered. |
| **How it works** | Configurable system prompt, suggestions, title, accent. Sends conversation to **n8n-agent**. Pipeline-style UI (TRANSMIT → ANALYZE → SYNTHESIZE → COMPLETE). No intent pipeline. |
| **What it does** | Generic inline AI chat with context and model picker. |
| **Who it talks to** | **n8n-agent** (Supabase) → Lovable AI gateway. |
| **Successful at** | Whatever the passed-in system prompt and suggestions target (e.g. infrastructure or n8n). |

---

### 2.10 n8n workflows (webhooks) — not “AI interfaces” but triggered by Command Center

When the intent pipeline returns a **workflow_match**, the frontend calls the n8n **webhook** for that workflow. These are not chat interfaces; they are automation endpoints that may use AI inside n8n:

| Workflow | Webhook | Role |
|----------|---------|------|
| AutoSEO Brain | `/webhook/autoseo` | Optimize product titles for SEO (NL/BE/DE/EN). |
| Product Title Optimizer | `/webhook/product-titles` | Rewrite/optimize product titles. |
| Health Check | `/webhook/health-check` | Check services/infrastructure health. |
| Product Feed Optimizer | `/webhook/product-feed` | Optimize/sync feeds (Channable, Google Shopping). |
| Campaign Generator | `/webhook/campaign` | Generate/launch campaigns (AI copy). |
| Web Scraper | `/webhook/scraper` | Scrape competitor/data from websites. |
| Monday.com Orchestrator | `/webhook/monday-orchestrator` | Route Monday.com events to specialist workflows. |

Command Center (and HansAI) **trigger** these; they do not “chat” with them. Results are shown in the UI as workflow output.

---

### 2.11 trigger-webhook (Supabase Edge Function)

| Field | Detail |
|-------|--------|
| **Where** | Backend. Called when the app needs to trigger an n8n (or other) webhook via Supabase (e.g. with auth or from server-side). |
| **How it works** | Receives `webhook_url` and optional `payload`. Verifies optional `X-COMMANDER-TOKEN`. POSTs to the given URL. Returns success/status and response body. |
| **What it does** | Proxy to call any webhook (typically n8n) from a secure context. |
| **Who it talks to** | The URL you pass (usually n8n webhooks). |
| **Successful at** | Centralized, token-protected webhook triggering from Portal/Empire/CI. |

---

## 3. Summary table: who talks to whom

| Interface | Calls | Notes |
|-----------|--------|------|
| UnifiedChatPanel | intent-router, n8n webhooks, n8n-agent | Intent first; then workflow or AI. |
| HansAI page | intent-router, n8n webhooks, hansai-chat | Same intent; chat uses streaming hansai-chat. |
| hansai-chat | Lovable AI gateway (streaming) | HansAI persona, hierarchy. |
| intent-router | Lovable AI gateway | Classify → workflow name or unknown. |
| n8n-agent | Lovable AI gateway | Generic; prompt from caller. |
| N8nAgentModal | n8n-agent | n8n workflow engineer prompt. |
| EmpireClaudePanel | n8n-agent | Empire Commander prompt. |
| EmpireOverlay | n8n-agent | Same as EmpireClaudePanel. |
| InlineChatPanel | n8n-agent | Configurable prompt (if used). |
| trigger-webhook | n8n (or other) webhooks | Proxy for webhook calls. |

---

## 4. n8n environment (fill in)

Please complete this section for your n8n instance:

| Setting | Your value |
|---------|------------|
| **n8n version:** | |
| **Database (default: SQLite):** | e.g. SQLite / PostgreSQL / MySQL |
| **n8n EXECUTIONS_PROCESS setting (default: own, main):** | e.g. `main`, `own`, or custom |
| **Running n8n via:** | e.g. Docker / npm / n8n cloud / desktop app |
| **Operating system:** | e.g. Linux (Ubuntu 22.04) / Windows Server / macOS |

Example:

| Setting | Your value |
|---------|------------|
| **n8n version:** | 1.62.0 |
| **Database (default: SQLite):** | PostgreSQL 15 |
| **n8n EXECUTIONS_PROCESS setting (default: own, main):** | main |
| **Running n8n via:** | Docker (docker-compose on VPS) |
| **Operating system:** | Linux (Debian 12) |
