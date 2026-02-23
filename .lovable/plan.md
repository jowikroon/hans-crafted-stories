

# Sovereign AI Empire Dashboard — Implementation Plan

## Overview

Build `hansvanleeuwen.com/empire` as a new route within the existing React SPA. This is a dark-mode operations dashboard that visualizes the full infrastructure stack and provides interactive controls for n8n workflows, system health, and AI agent commands.

---

## What Gets Built

### 1. New Route: `/empire`

A protected admin-only page accessible from the navbar, featuring a dark-themed command center layout with live status tiles, workflow controls, and an "Ask Claude" AI interface.

### 2. Dashboard Components

The dashboard will display the **7-Layer Sovereign AI Spine** as interactive cards:

| Layer | Card Title | Live Data Source |
|-------|-----------|-----------------|
| Shield | Cloudflare Zero Trust | Health check ping |
| Portal | hansvanleeuwen.com | Current app status (self-check) |
| Brain | n8n Orchestration | n8n API health via webhook |
| Muscle | Claude Code CLI | Status indicator (manual/webhook) |
| Senses | MCP Gateway | Docker container status via webhook |
| Memory | Database | Existing Supabase health check (reuse PortalStatusTab logic) |
| Immune | AI Doctor / Monitoring | Loki/Grafana endpoint check |

### 3. "Ask Claude" AI Panel

Reuse the existing `n8n-agent` edge function pattern but with a new system prompt focused on empire management. This lets you type commands like "Fix my AutoSEO workflow" which get routed through Lovable AI to generate actionable responses.

### 4. Quick Actions Grid

One-click buttons that trigger n8n webhooks for common operations:
- Trigger AutoSEO workflow
- Run Product Title Optimizer
- Health check all services
- View recent audit trail

### 5. Database Tables

New `empire_events` table to log system events and command history for the audit trail.

---

## Technical Plan

### Step 1: Database Migration

Create an `empire_events` table for audit trail logging:

```sql
CREATE TABLE public.empire_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL DEFAULT 'info',
  source text NOT NULL DEFAULT 'system',
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.empire_events ENABLE ROW LEVEL SECURITY;
-- Admin-only access
CREATE POLICY "Admins can manage empire events"
  ON public.empire_events FOR ALL
  USING (has_role(auth.uid(), 'admin'));
```

### Step 2: Edge Function — `empire-health`

A new backend function that:
- Checks n8n health (pings `https://n8n.hansvanleeuwen.com/healthz`)
- Checks Cloudflare status
- Checks the primary VPS endpoint
- Returns a consolidated status JSON
- Logs results to `empire_events`

### Step 3: New Page — `src/pages/Empire.tsx`

Dark-themed dashboard with:
- **7 status tiles** in a responsive grid (reusing patterns from PortalStatusTab)
- **Quick Actions** row with webhook trigger buttons
- **Audit Trail** — recent events from `empire_events`
- **Ask Claude panel** — full-screen modal chat (reusing N8nAgentModal pattern with empire-specific system prompt)

### Step 4: New Components

| File | Purpose |
|------|---------|
| `src/pages/Empire.tsx` | Main dashboard page |
| `src/components/empire/EmpireStatusGrid.tsx` | 7-layer status tiles |
| `src/components/empire/EmpireQuickActions.tsx` | Webhook trigger buttons |
| `src/components/empire/EmpireAuditTrail.tsx` | Event log feed |
| `src/components/empire/EmpireClaudePanel.tsx` | AI chat panel |
| `supabase/functions/empire-health/index.ts` | Health check aggregator |

### Step 5: Routing and Navigation

- Add `/empire` route to `AnimatedRoutes.tsx`
- Add "Empire" link in navbar (visible only to admin users, with a terminal/command icon)

### Step 6: Downloadable Bootstrap Files

Serve infrastructure setup files from `/public/empire/`:
- `CLAUDE.md` template
- `docker-compose.yml` for MCP Gateway + observability
- `setup.sh` bootstrap script
- These are downloadable reference files, not executed by the app

### Step 7: Product Title Optimizer Integration

The workflow JSON is already at `public/workflows/product-title-optimizer.json`. The existing tool card for Luca's account will work via webhook trigger. The Empire dashboard adds a quick-action button that triggers the same webhook endpoint.

---

## Design Approach

- **Dark mode forced** on the Empire page using Tailwind's `dark` class overrides and inline CSS variables
- **Color palette**: Deep navy/charcoal background, emerald/cyan accent for online states, amber for warnings, red for offline
- **Typography**: Monospace elements for technical data, display font for headings
- **Animations**: Framer Motion entrance animations (consistent with existing portal)
- **Mobile**: Responsive grid that stacks to single column; status tiles become 2-column on small screens

---

## Files Changed Summary

| Action | File |
|--------|------|
| Create | `src/pages/Empire.tsx` |
| Create | `src/components/empire/EmpireStatusGrid.tsx` |
| Create | `src/components/empire/EmpireQuickActions.tsx` |
| Create | `src/components/empire/EmpireAuditTrail.tsx` |
| Create | `src/components/empire/EmpireClaudePanel.tsx` |
| Create | `supabase/functions/empire-health/index.ts` |
| Create | `public/empire/CLAUDE.md` |
| Create | `public/empire/docker-compose.yml` |
| Create | `public/empire/setup.sh` |
| Edit | `src/components/AnimatedRoutes.tsx` (add /empire route) |
| Edit | `src/components/Navbar.tsx` (add Empire link for admins) |
| Edit | `supabase/config.toml` (add empire-health function) |
| Migration | Create `empire_events` table with RLS |

