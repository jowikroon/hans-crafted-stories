# CLAUDE.md — Sovereign AI Empire
# Root project context. Read on every Claude Code session.
# Keep concise. Commands must be copy-paste ready.

## Quick Start

```bash
# Install dependencies
npm install

# Run personal app (port 8080)
npm run dev --workspace=apps/personal

# Run saas app
npm run dev --workspace=apps/saas

# Start full local AI stack (n8n + Ollama + Qdrant + AnythingLLM)
docker compose up -d

# Check all services
docker compose ps
```

## Architecture

```
hans-crafted-stories/
├── apps/
│   ├── personal/     → hansvanleeuwen.com (React + Vite + Supabase)
│   ├── saas/         → SaaS product (React + Vite + Supabase)
│   └── thought-canvas/ → Canvas app
├── packages/         → Shared libs (if any)
├── supabase/         → Supabase migrations (personal)
├── supabase-saas/    → Supabase migrations (saas)
├── .claude/
│   ├── agents/       → Custom subagent definitions
│   ├── skills/       → Reusable skill scripts
│   ├── mcp/          → MCP server configs
│   └── launch.json   → Dev server configs
└── docker-compose.yml → Local AI stack
```

## Infrastructure — Two VPS + Cloudflare

| Node | Host | IP | Role |
|------|------|----|------|
| Primary | srv1402218.hstgr.cloud | 187.124.1.75 | n8n, Claude Code, orchestration |
| Secondary | srv1411336.hstgr.cloud | 187.124.2.66 | Compute worker ("industrial") |

**Empire root on VPS:** `/opt/hansai/`
**Tmux session:** `hansai`

## SSH Setup (Ed25519 + Cloudflare Zero Trust)

```bash
# Generate key (if missing)
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_hansai -C "hansai-empire"

# Copy to primary VPS
ssh-copy-id -i ~/.ssh/id_ed25519_hansai.pub root@srv1402218.hstgr.cloud

# Copy to secondary VPS
ssh-copy-id -i ~/.ssh/id_ed25519_hansai.pub root@srv1411336.hstgr.cloud

# Add SSH config (~/.ssh/config)
Host primary
  HostName srv1402218.hstgr.cloud
  User root
  IdentityFile ~/.ssh/id_ed25519_hansai
  ControlMaster auto
  ControlPath ~/.ssh/control-%h-%p-%r
  ControlPersist 3600

Host industrial
  HostName srv1411336.hstgr.cloud
  User root
  IdentityFile ~/.ssh/id_ed25519_hansai
  ProxyJump primary

# Test connections
ssh primary "docker ps"
ssh industrial "uptime"
```

## SSH Tunnels (local access to VPS services)

```bash
# All tunnels at once (background)
ssh -N -f -L 5678:localhost:5678 \
         -L 11434:localhost:11434 \
         -L 6333:localhost:6333 \
         -L 3001:localhost:3001 \
         primary

# Or use .claude/agents/ssh-sentinel to manage tunnels automatically
```

## Docker Services (local dev)

| Service | Port | URL |
|---------|------|-----|
| n8n | 5678 | http://localhost:5678 |
| Ollama | 11434 | http://localhost:11434 |
| Qdrant | 6333 | http://localhost:6333/dashboard |
| AnythingLLM | 3001 | http://localhost:3001 |

## 7-Layer AI Spine

1. **Shield** — Cloudflare Zero Trust (SSH + DDoS)
2. **Portal** — hansvanleeuwen.com/empire (React dashboard)
3. **Brain** — n8n Orchestration (workflows, webhooks)
4. **Muscle** — Claude Code CLI (autonomous execution)
5. **Senses** — Docker MCP Gateway (tool exposure)
6. **Memory** — Supabase (empire_events, portal_tools, blog_posts)
7. **Immune** — Health Guardian agent (monitoring, self-heal)

## Key n8n Webhooks

```
N8N Base:          https://n8n.srv1402218.hstgr.cloud
AutoSEO:           https://n8n.srv1402218.hstgr.cloud/webhook/autoseo
Product Titles:    https://n8n.srv1402218.hstgr.cloud/webhook/product-titles
Product Feed:      https://n8n.srv1402218.hstgr.cloud/webhook/product-feed
Campaign:          https://n8n.srv1402218.hstgr.cloud/webhook/campaign
Scraper:           https://n8n.srv1402218.hstgr.cloud/webhook/scraper
Monday Orch:       https://n8n.srv1402218.hstgr.cloud/webhook/monday-orchestrator
Claude Relay v2:   https://n8n.srv1402218.hstgr.cloud/webhook/claude-relay-v2
N8N Architect:     https://n8n.srv1402218.hstgr.cloud/webhook/n8n-architect
```

## Supabase

- **Cloud Project:** `pesfakewujjwkyybwaom` (shared: hansvanleeuwen.com + marketplacegrowth.nl)
- **Cloud URL:** `https://pesfakewujjwkyybwaom.supabase.co`
- **Self-hosted:** `https://supabase.srv1402218.hstgr.cloud` (data tables for hansvanleeuwen.com)
- **Key tables:** `empire_events`, `portal_tools`, `blog_posts`, `case_studies`, `workflow_runs`
- **Edge Functions:** `empire-health`, `portal-api`, `trigger-webhook`, `n8n-agent`

## Environment Files

| File | Purpose |
|------|---------|
| `.env.development` | Local dev (Supabase + local Docker URLs) |
| `.env.production` | Production (VPS + tunnel URLs) |
| `.env.example` | Template — copy and fill in missing values |

**Gotcha:** `VITE_CF_ACCOUNT_ID` and `VITE_CF_TUNNEL_TOKEN` must be set for Cloudflare Zero Trust SSH.

## Rules

- Always log infrastructure changes to Supabase `empire_events` table
- SSH between VPSs: use Ed25519 key + "industrial" alias via `ProxyJump primary`
- MCP is the ONLY way to expose tools to Claude Code on VPS
- Use tmux session `hansai` on VPS for persistent Claude Code sessions
- Run health check before any major changes: `bash /opt/hansai/scripts/claude-health.sh`

---

## 4 Agents — Empire Management System

### Agent #1: Context Keeper (Skill)
> Maintains CLAUDE.md accuracy. Run after any infrastructure change.

```bash
# Invoke
claude skill context-keeper
```

**File:** `.claude/skills/context-keeper/SKILL.md`
**Type:** Skill (on-demand, lightweight)
**Responsibilities:** Audits all CLAUDE.md files, detects drift vs actual codebase, proposes updates.

---

### Agent #2: SSH Sentinel (Custom Agent)
> Autonomous SSH connection manager. Tests, fixes, and tunnels VPS connections.

```bash
# Invoke
claude agent ssh-sentinel

# Or from n8n webhook
POST https://hansvanleeuwen.app.n8n.cloud/webhook/ssh-sentinel
```

**File:** `.claude/agents/ssh-sentinel.md`
**Type:** Custom subagent (autonomous Bash + network tools)
**Responsibilities:** Ed25519 key verification, tunnel management, connection health, Cloudflare Zero Trust setup.

---

### Agent #3: Workflow Orchestrator (MCP Server)
> Manages n8n workflows, git deployments, and webhook registry.

```bash
# Start MCP server
node .claude/mcp/workflow-orchestrator/index.js

# Add to Claude Code
claude mcp add workflow-orchestrator node .claude/mcp/workflow-orchestrator/index.js
```

**File:** `.claude/mcp/workflow-orchestrator/`
**Type:** MCP Server (long-running, production)
**Responsibilities:** n8n workflow CRUD, git branch→deploy mapping, active webhook registry.

---

### Agent #4: Health Guardian (MCP Server)
> Monitors all 7 layers. Logs incidents to Supabase. Auto-suggests fixes.

```bash
# Start MCP server
node .claude/mcp/health-guardian/index.js

# Add to Claude Code
claude mcp add health-guardian node .claude/mcp/health-guardian/index.js
```

**File:** `.claude/mcp/health-guardian/`
**Type:** MCP Server (continuous monitoring, production)
**Responsibilities:** 60s health polling of all services, Supabase event logging, incident detection, Claude Code alert triggers.
