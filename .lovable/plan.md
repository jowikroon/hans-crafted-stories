

# AI Hub Page — Replace Command Center Button with Full AI Template Page

## What Changes

When logged in, the "Command Center" button in the navbar's second row becomes a link to a new `/ai` page. This page acts as a **central hub** listing every AI agent and interface available in the system, each with its own card and launch action.

## New Route: `/ai`

A new page at `/ai` with a dark theme (matching Portal/HansAI), featuring:

### Sub-menu tabs across the top
- **All** — shows every AI interface
- **Agents** — dedicated chat agents (Empire Commander, n8n Agent)
- **Interfaces** — UI modes (Command Center Terminal, Popup, Inline)
- **Tools** — action-oriented AI (Intent Router, AutoSEO Brain, Content Suggest)

### Cards for each AI interface

Each card shows: name, description, icon, status badge, and a launch button.

| Card | Description | Action |
|------|-------------|--------|
| **Command Center Terminal** | Full terminal at /hansai — slash commands, intent pipeline, streaming AI | Navigate to /hansai |
| **Command Center Popup** | Overlay version — same categories, compact mode | Open HansAIOverlay |
| **Empire Commander** | Infrastructure ops AI — n8n, Cloudflare, VPS, Docker | Open EmpireClaudePanel overlay |
| **n8n Agent** | Workflow engineer — build, fix, troubleshoot n8n workflows | Open N8nAgentModal |
| **Intent Router** | Classify prompts into workflow actions or AI fallback | Info card (no direct launch) |
| **AutoSEO Brain** | Batch SEO title optimization via n8n webhook | Trigger webhook or navigate |
| **AI Content Suggest** | Generate copy for pages, products, descriptions | Open inline panel |
| **Keyword Research** | Gemini-powered keyword analysis | Open modal |
| **Standalone Template** | Self-contained HTML export of Command Center | Link to /templates/command-center.html |

### Hero section
A brief header: "AI Interfaces" with a one-liner explaining this is the central hub for all AI agents and automation interfaces.

## Navbar Changes

**Desktop (row 2):** The existing "Command Center" button changes from `onClick={() => navigate("/hansai")}` to `onClick={() => navigate("/ai")}`. Label stays "Command Center" or becomes "AI Hub".

**Mobile menu:** Same change — the Command Center button navigates to `/ai` instead of `/hansai`.

**Nav links:** The `/hansai` link in the `links` array (added when logged in) changes to `{ to: "/ai", label: "AI Hub" }`.

## Files

| File | Action |
|------|--------|
| `src/pages/AIHub.tsx` | **Create** — new page with sub-menu tabs and AI interface cards |
| `src/components/Navbar.tsx` | **Edit** — change Command Center button target from `/hansai` to `/ai`; update nav link |
| `src/components/AnimatedRoutes.tsx` | **Edit** — add `/ai` route |
| `src/App.tsx` | **Edit** — add `/ai` to dark page list |

## Technical Details

- The AIHub page imports and renders overlay components (HansAIOverlay, EmpireOverlay, N8nAgentModal) locally so cards can trigger them directly
- Sub-menu filtering uses simple state (`useState<string>("All")`) with a horizontal pill bar
- Cards use the existing `Card` UI component with hover effects and accent colors per AI type
- Dark theme forced on mount (same pattern as Portal)
- Page is auth-gated: redirects to `/portal` if not logged in
- The `/hansai` route remains accessible directly for power users

