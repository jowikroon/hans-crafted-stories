

# Portal Backend: Full Implementation Plan

## Overview

The Google sign-in is already wired up and functional. This plan focuses on building real, working backend tools behind the portal and making the system extensible for future additions.

---

## What We'll Build

### 1. Database: Portal Tools Configuration

Create a `portal_tools` table so you can manage your n8n webhook URLs and tool configurations without code changes.

- **portal_tools** table: stores tool name, webhook URL, description, icon, and sort order
- Secured with RLS so only your authenticated account can read/write
- Pre-seeded with the three existing tools

### 2. Site Audit Tool (powered by Firecrawl)

Connect the **Firecrawl** connector (already available in your workspace) to enable real website crawling and SEO auditing.

- A backend function that accepts a URL, calls Firecrawl to scrape and analyze it
- Returns page title, meta description, headings structure, links count, images without alt text, and other SEO signals
- Results displayed in a clean modal/drawer in the portal

### 3. N8N Workflow Trigger

A backend function that acts as a proxy to trigger your n8n webhooks securely.

- Webhook URLs stored in the database (not hardcoded)
- The portal sends a request to the backend function, which forwards it to the n8n webhook
- Supports passing custom payload data
- Shows success/error feedback in the UI

### 4. Keyword Research Tool (AI-powered)

Use Lovable AI (no API key needed) to provide keyword analysis.

- A backend function that takes a seed keyword and uses AI to generate related keywords, estimated search intent, competition level, and content suggestions
- Results displayed in a structured table in the portal

### 5. Portal UI Upgrade

- Replace hardcoded tool cards with dynamic cards from the database
- Add modals/drawers for each tool's input and output
- Add a settings section to manage webhook URLs
- Keep the extensible "Add more tools" card

---

## Implementation Sequence

1. **Connect Firecrawl** -- link the existing Firecrawl connector to this project
2. **Database migration** -- create `portal_tools` table with seed data
3. **Edge function: `site-audit`** -- Firecrawl-powered SEO audit
4. **Edge function: `trigger-webhook`** -- generic n8n webhook proxy
5. **Edge function: `keyword-research`** -- AI-powered keyword analysis
6. **Portal UI** -- dynamic tool loading, input modals, result displays, webhook settings

---

## Technical Details

### Database Schema

```text
portal_tools
+--------------+----------+------------------------------------------+
| Column       | Type     | Notes                                    |
+--------------+----------+------------------------------------------+
| id           | uuid     | PK, auto-generated                       |
| user_id      | uuid     | references auth.users, NOT NULL           |
| name         | text     | Tool display name                        |
| description  | text     | Short description                        |
| tool_type    | text     | "site-audit" | "webhook" | "keyword"     |
| config       | jsonb    | Webhook URL, default params, etc.        |
| icon         | text     | Lucide icon name                         |
| color        | text     | Tailwind color class                     |
| sort_order   | int      | Display order                            |
| created_at   | timestamptz | default now()                         |
+--------------+----------+------------------------------------------+

RLS: Users can only SELECT/INSERT/UPDATE/DELETE their own rows
```

### Edge Functions

- **`site-audit`**: Receives `{ url }`, calls Firecrawl, returns structured SEO data
- **`trigger-webhook`**: Receives `{ webhook_url, payload }`, forwards POST request, returns response
- **`keyword-research`**: Receives `{ keyword }`, calls Lovable AI, returns keyword suggestions

### Portal UI Components

- `SiteAuditModal` -- URL input, displays crawl results (headings, meta, issues)
- `WebhookTriggerModal` -- select workflow, optional payload, trigger button with status
- `KeywordResearchModal` -- keyword input, results table with intent/competition
- `ToolSettingsDrawer` -- manage webhook URLs, add/remove tools

---

## Connectors Needed

- **Firecrawl**: Already available in your workspace, just needs to be linked to this project

