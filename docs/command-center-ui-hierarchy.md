# Command Center — Full Hierarchy & Function List (UI Developer Reference)

This document maps the **Command Center** and related surfaces so a UI developer can improve layout, accessibility, and visual design. No implementation changes—reference only.

---

## 1. High-Level Hierarchy

```
App
├── Routes
│   ├── /portal          → Portal (main command-center host)
│   ├── /empire          → Empire (Operations Command Center dashboard)
│   ├── /hansai          → HansAI (full terminal + hierarchy filters)
│   └── /wiki            → Wiki (AI guide; links back to Portal)
│
├── Global (non-route)
│   └── EmpireTerminalCard  (floating card: "claude@srv1402218" link; shown when !isDarkPage)
│
Portal (page)
├── Header (welcome, visibility-controlled buttons)
│   ├── Empire AI button     → opens EmpireOverlay
│   ├── n8n Agent button     → opens N8nAgentModal
│   ├── Command Center btn   → toggles UnifiedChatPanel (collapsible strip)
│   ├── Wiki link
│   ├── Search (⌘K)          → opens PortalCommandPalette
│   └── Sign out
├── Command Center strip     (collapsible; contains UnifiedChatPanel)
├── Tab nav                  (Tools | Content | Pages | Users | Status)
├── Sub-nav                  (per-tab: All, SEO, …)
├── Tab content              (PortalToolsTab | PortalContentTab | …)
├── PortalFloatingDock       (mobile: bottom dock + Search)
├── PortalCommandPalette     (modal: ⌘K)
├── EmpireOverlay            (slide/panel: Empire Commander chat)
└── N8nAgentModal            (modal: n8n workflow builder chat)
```

**Empire page** (`/empire`) is a separate “Operations Command Center” with Status Grid, Quick Actions, Audit Trail; it does not host the Portal tabs.

**HansAI page** (`/hansai`) hosts the full “Command Center” experience with **HierarchyControls** (3-layer goal/tabs/sub-tools) and a larger chat/terminal UI.

---

## 2. Entry Points & Naming

| User-facing name     | What it opens                    | File / component           |
|----------------------|----------------------------------|----------------------------|
| **Command Center**   | Collapsible strip with UnifiedChatPanel (intent-first chat) | Portal.tsx → UnifiedChatPanel |
| **Empire AI**        | Empire Commander chat overlay    | EmpireOverlay.tsx          |
| **n8n Agent**        | n8n workflow builder chat modal  | N8nAgentModal.tsx          |
| **Search** / ⌘K      | Command palette (nav + Empire/n8n) | PortalCommandPalette.tsx   |
| **Empire** (nav link)| Full Empire dashboard page       | Empire.tsx                 |
| **Portal**           | Main tools board page            | Portal.tsx                 |

Visibility of header buttons is controlled by **page elements** (e.g. `command_center_button`, `empire_ai_button`, `n8n_agent_button`, `terminal_button`) — see `usePageElements("portal")` in Portal.

---

## 3. Component Tree (Detailed)

### 3.1 Portal page — `src/pages/Portal.tsx`

| Section / component   | Purpose |
|------------------------|--------|
| **Login block**       | When `!user`: email/password + Google sign-in. |
| **PageBreadcrumb**    | Single item: "Portal". |
| **Header**            | "Welcome back", optional name; buttons (Empire AI, n8n Agent, Command Center, Wiki, Search, Sign out). |
| **Command Center strip** | Collapsible panel (height 40vh when open); header "Command Center" + admin link to /hansai; body = **UnifiedChatPanel**. |
| **Tab nav**           | 5 tabs: Tools, Content, Pages, Users, Status. |
| **Sub-nav**           | Per-tab filters (e.g. Tools: All, SEO, Automation, Data, AI, General). |
| **Tab content**       | Rendered by activeTab: PortalToolsTab, PortalContentTab, PortalPagesTab, PortalUsersManager, PortalStatusTab. |
| **PortalFloatingDock** | Mobile only; bottom bar: 5 tab icons + Search icon. |
| **PortalCommandPalette** | Modal overlay; search input; groups: Navigate (tabs), AI Agents (Empire AI, n8n Agent). |
| **EmpireOverlay**      | Slide/overlay panel: Empire Commander chat (context pills, suggestions, send). |
| **N8nAgentModal**     | Modal: n8n workflow automation chat. |

### 3.2 UnifiedChatPanel — `src/components/portal/UnifiedChatPanel.tsx`

**Role:** Intent-first “Sovereign AI Command Center” chat: infrastructure + marketing/SEO; can route to workflows, call universal-router, create n8n workflows from JSON.

| Element / area        | Function |
|------------------------|----------|
| **Context filter**     | Category/sub-category pills (from unifiedCategories) to scope the AI. |
| **Pipeline stages**    | TRANSMIT → INTENT → ANALYZE → SYNTHESIZE → COMPLETE (visual steps during request). |
| **Model selector**      | Opens ModelChoiceModal (Gemini, GPT-5, etc.); value in localStorage. |
| **Suggestions**        | Shuffle + fixed suggestionPool; click to send. |
| **Intent clarification**| When multiple workflows match, pendingClarification shows choices (IntentButton). |
| **Chat messages**      | user / assistant / system / workflow; markdown; optional workflow creation. |
| **Input**              | Textarea; Enter to send; optional advanced (n8n filter, etc.). |
| **History**            | Stored in localStorage (HISTORY_KEY); dropdown to restore past conversations. |

**Integrations:** `runIntentPipeline`, `triggerWorkflow`, `extractWorkflowJsonFromMarkdown`, `createWorkflowInN8n`; Supabase functions: `n8n-agent`, `universal-router`, `n8n-filter-proxy`.

### 3.3 EmpireOverlay — `src/components/overlays/EmpireOverlay.tsx`

**Role:** “Empire Commander” chat focused on infrastructure (n8n, Cloudflare, VPS, Docker, Supabase). No tab/hierarchy; context pills + suggestions.

| Element | Function |
|---------|----------|
| **Header**            | "Empire Commander"; close button. |
| **Context pills**      | empireCategories (from contextCategories). |
| **Command list**       | When a sub-category selected, show command suggestions. |
| **Messages**           | user/assistant; scroll to bottom. |
| **Input**              | Single line; Send; placeholder "Ask Empire Commander...". |
| **Suggestions**        | Fix AutoSEO, Generate Channable workflow, Run health check. |

**Backend:** Supabase `n8n-agent` with Empire-specific system prompt.

### 3.4 PortalCommandPalette — `src/components/portal/PortalCommandPalette.tsx`

**Role:** Quick navigation and AI launchers (⌘K or Search button).

| Item / group   | Action |
|----------------|--------|
| **Navigate**   | Tools, Content, Pages, Users, Status → switch tab and close. |
| **AI Agents**  | Empire AI → onEmpireOpen(); n8n Agent → onN8nOpen(); close. |

Filter: by label and description; grouped by `group`; Escape closes.

### 3.5 PortalFloatingDock — `src/components/portal/PortalFloatingDock.tsx`

**Role:** Mobile-only bottom bar.

| Item        | Action |
|-------------|--------|
| **5 tab icons** | Tools, Content, Pages, Users, Status → onTabChange(id). |
| **Search icon** | onCommandOpen() → opens PortalCommandPalette. |

Visible only `sm:hidden`; active tab has pill indicator (layoutId="dockIndicator").

### 3.6 Empire page — `src/pages/Empire.tsx`

**Role:** “Operations Command Center” dashboard (admin-only). Dark theme (emerald accents).

| Block              | Component / content |
|--------------------|--------------------|
| **Breadcrumb**     | "Empire". |
| **Header**         | Crown icon, "Sovereign AI Empire", "Operations Command Center"; "Ask Claude" → EmpireClaudePanel. |
| **Status grid**    | EmpireStatusGrid (7 layers: Shield, Portal, Brain, Muscle, Senses, Memory, Immune). |
| **Quick actions**  | EmpireQuickActions (AutoSEO, Product Titles, Health Check, Audit Trail). |
| **Audit trail**    | EmpireAuditTrail (empire_events from Supabase). |
| **Bootstrap files**| Links: CLAUDE.md, docker-compose.yml, setup.sh. |
| **Modal**          | EmpireClaudePanel (same Empire Commander chat as overlay, different container). |

### 3.7 EmpireStatusGrid — `src/components/empire/EmpireStatusGrid.tsx`

**Role:** 7-layer health (Shield, Portal, Brain, Muscle, Senses, Memory, Immune). Calls `empire-health` edge function; shows online/offline/checking + optional latency/tooltip.

### 3.8 EmpireQuickActions — `src/components/empire/EmpireQuickActions.tsx`

**Role:** Buttons that POST to `trigger-webhook` with n8n webhook URLs (autoseo, product-titles, health-check) + “Audit Trail” (view events). Uses WORKFLOWS from `@/lib/config/workflows`.

### 3.9 EmpireClaudePanel — `src/components/empire/EmpireClaudePanel.tsx`

**Role:** Modal chat “Empire Commander” (same system prompt as EmpireOverlay). Used on Empire page only.

### 3.10 HansAI page — `src/pages/HansAI.tsx`

**Role:** Full “Command Center” with 3-layer hierarchy and chat. Uses **HierarchyControls** and a larger chat/terminal UI.

| Area               | Function |
|--------------------|----------|
| **HierarchyControls** | Laag 1: Primary goal (SEO & Content, n8n Workflows, Data Feeds, …). Laag 2: Tabs (reordered by goal). Laag 3: Sub-tools (chips). Undo. |
| **Chat / terminal**   | Same intent pipeline and workflow triggers as UnifiedChatPanel, with more space and optional terminal styling. |

### 3.11 HierarchyControls — `src/components/command-center/HierarchyControls.tsx`

**Role:** 3-layer filter for intent routing.

| Layer    | UI | Data |
|----------|-----|------|
| **Laag 1** | Primary goal cards (emoji + label) or mobile Sheet | `PrimaryGoal` → `HIERARCHY_MAP[goal]` |
| **Laag 2** | Tabs (reordered by goal) | `activeTabs`, `orderedTabs` |
| **Laag 3** | Sub-tool chips (scroll area) | `subTools`, `scope` |

Props: `value: HierarchyContext`, `onChange`, `lastValue`, `onUndo`. Persistence: `command_center_hierarchy_v2` in localStorage. Wrapped optionally in **HierarchyErrorBoundary** (`src/components/command-center/HierarchyErrorBoundary.tsx`).

### 3.12 Intent / hierarchy types — `src/lib/intent/types.ts`

- **PrimaryGoal:** seo_content | n8n_workflows | data_feeds | campaigns | web_scraping | system_health | general.
- **HIERARCHY_MAP:** per goal, `tabs` and `subTools` arrays.
- **ALL_TABS:** All, SEO, Content, Campaigns, Analytics, Workflows, Feeds, Infrastructure, Database, Code, Monitoring, Security.

---

## 4. Tab Content Components (Portal)

| Tab     | Component           | Main functions |
|---------|---------------------|----------------|
| **Tools**   | PortalToolsTab      | List portal_tools (cards); category filter; open ToolPreviewModal, ToolSettingsModal, WebhookTriggerModal, IframeToolModal; add/edit/delete tools. |
| **Content** | PortalContentTab    | Blog posts + case studies; filters; BlogPostFormModal, CaseStudyFormModal; PortalLangToggle. |
| **Pages**   | PortalPagesTab      | Page visibility (published/hidden); PageContentEditorModal; PortalLangToggle. |
| **Users**   | PortalUsersManager  | User list; tab/tool/content/AI access toggles; add user; delete user. |
| **Status**  | PortalStatusTab     | Resource checks (DB, Auth, Functions, Storage, API); connectors; unhandled intents; Monday.com webhook events + Trigger Agent URL; TrackingScriptsManager. |

---

## 5. Supporting Components & APIs

| Component / file        | Role |
|-------------------------|------|
| **IntentButton**        | Renders workflow choice when pipeline returns multiple matches; triggers workflow. |
| **ModelChoiceModal**    | Pick AI model (Gemini, GPT-5, …) for UnifiedChatPanel. |
| **ContextFilterPills**  | Category/sub-category pills (used in UnifiedChatPanel, EmpireOverlay). |
| **CommandSuggestionList** | Clickable suggestion chips. |
| **contextCategories**   | unifiedCategories, empireCategories, buildContextPrefix. |
| **runIntentPipeline**   | Intent routing and workflow trigger (`src/lib/intent/pipeline.ts`). |
| **portalApi**           | getTools, addTool, updateTool (`src/lib/api/portal.ts`). |
| **usePageElements**     | Visibility flags for portal (e.g. command_center_button, empire_ai_button). |

---

## 6. Keyboard Shortcuts

| Shortcut | Action (Portal) |
|----------|------------------|
| ⌘E / Ctrl+E | Toggle “Command Center” (UnifiedChatPanel strip). |
| ⌘J / Ctrl+J | Same toggle (duplicate in handler). |
| ⌘K / Ctrl+K | Open PortalCommandPalette. |
| Escape     | Close palette / overlay / modals. |

---

## 7. Theming & Layout Notes

- **Portal:** Forces `dark` on mount; restores previous theme on unmount. Uses `section-container`, `section-container` padding.
- **Command Center strip:** Border and accent `border-orange-500`, `bg-card`; height `40vh` when open.
- **Empire page:** Custom CSS vars in `.empire-page` (emerald palette); `bg-[hsl(220,20%,6%)]`.
- **HierarchyControls:** Accent `#ff6600`, border `#1e1e1e`; mobile uses Sheet (left side).
- **EmpireOverlay:** Violet accent; slide/overlay from side.
- **N8nAgentModal:** Cyan accent.

---

## 8. File Map (Quick Reference)

| Path | Purpose |
|------|--------|
| `src/pages/Portal.tsx` | Portal page; host for Command Center strip, tabs, overlays, palette. |
| `src/pages/Empire.tsx` | Empire dashboard page. |
| `src/pages/HansAI.tsx` | Full Command Center with HierarchyControls. |
| `src/components/portal/UnifiedChatPanel.tsx` | Main Command Center chat panel. |
| `src/components/portal/PortalCommandPalette.tsx` | ⌘K command palette. |
| `src/components/portal/PortalFloatingDock.tsx` | Mobile bottom dock. |
| `src/components/overlays/EmpireOverlay.tsx` | Empire Commander overlay. |
| `src/components/portal/N8nAgentModal.tsx` | n8n Agent modal. |
| `src/components/empire/EmpireStatusGrid.tsx` | 7-layer status grid. |
| `src/components/empire/EmpireQuickActions.tsx` | Webhook quick actions. |
| `src/components/empire/EmpireClaudePanel.tsx` | Empire Commander modal (Empire page). |
| `src/components/empire/EmpireAuditTrail.tsx` | Event list. |
| `src/components/command-center/HierarchyControls.tsx` | 3-layer goal/tabs/sub-tools. |
| `src/components/command-center/HierarchyErrorBoundary.tsx` | Error boundary for hierarchy. |
| `src/lib/intent/types.ts` | PrimaryGoal, HIERARCHY_MAP, ALL_TABS. |
| `src/lib/intent/pipeline.ts` | runIntentPipeline, triggerWorkflow. |
| `src/lib/config/workflows.ts` | WORKFLOWS (n8n webhook list). |

Use this hierarchy and function list to adjust layout, contrast, spacing, responsive behavior, and accessibility (focus, labels, live regions) without changing behavior.
