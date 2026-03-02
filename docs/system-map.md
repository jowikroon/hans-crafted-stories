# System Map

This document describes the system architecture, entry points, universal chat routing, n8n integration, and the Command Center v6.1 UX.

---

## Part 1 — System overview

- **Single entry point:** Users reach the Command Center via `/command-center` or the domain root. Portal, Empire, and HansAI link or redirect to the Command Center so one place handles intent-first chat, filters, and n8n workflow preview.
- **Entry points in practice:**
  - **Portal** (`/portal`): Dashboard with a Command Center panel (UnifiedChatPanel); “Command Center” button opens the overlay or panel.
  - **Empire** (`/empire`): Operations dashboard; links to Command Center for intent-based runs.
  - **HansAI** (`/hansai`): Full terminal view of Command Center (slash commands, intent pipeline, streaming AI).
- **Universal chat** uses the `universal-router` Edge Function so all Command Center chat goes through one URL with filter context.

---

## Part 2 — Universal chat and routing

- **universal-router** (`/functions/v1/universal-router`): Single entry for Command Center chat. Accepts `{ messages, model?, system?, filter_context?, router_context? }`, enriches the system prompt with `filter_context`, and forwards the request to `n8n-agent`. Same request/response shape as calling `n8n-agent` directly; the client sends `filter_context` so the model can adapt to the active filter.
- **Filters and example prompts** are backed by Supabase where available:
  - **prompt_templates:** Template prompts for the Command Center (e.g. by category or sub-tool).
  - **user_preferences:** Per-user preferences; includes `n8n_filter_presets` (JSONB) for “Show n8n workflows” and related options. Used to restore last filter and pinned examples on load.
  - **filter_settings:** Optional table for filter configuration and labels.
- **Intent pipeline** (frontend) still runs before chat when appropriate: fast route → LLM classification (intent-router) → workflow execution or clarification; fallback to AI chat via universal-router.

---

## Part 3 — n8n

- **n8n instance:** `https://n8n.srv1402218.hstgr.cloud` (or configured `N8N_BASE_URL`). Env vars **N8N_API_KEY** and **N8N_BASE_URL** are set in Supabase secrets and are never exposed to the client.
- **create-n8n-workflow:** Edge Function `n8n-create-workflow` creates workflows in n8n via the REST API. Used when the AI outputs a workflow JSON block; the client calls this with the user’s JWT.
- **n8n-filter-proxy:** Edge Function `n8n-filter-proxy` proxies GET requests to n8n (e.g. list workflows). Used by the Command Center to power the right-hand “n8n workflow cards” pane and the status line “n8n: N workflows loaded.” All n8n API access goes through this proxy so the client never sees API keys.

---

## Part 4 — Command Center v6.1

- **Single Command Center UX:** One UX surface (UnifiedChatPanel) with basic filter chips, Advanced bar, and optional n8n preview pane. No breaking changes to existing flow or styling.
- **Basic filter chips:** Unchanged at the top of chat (ContextFilterPills, orange styling). Users keep the same category/sub selection they use today.
- **Advanced bar:** Below the chips, an “Advanced” button toggles a collapsible section (desktop) or opens a modal (mobile). Contains “Show n8n workflows” and any future advanced filter options. Uses existing Tailwind and orange design tokens.
- **n8n preview pane:** When the n8n filter is active, a right-hand pane shows n8n workflow cards (from n8n-filter-proxy). Cards use existing card style and orange accents (`border-orange-500/20`, `bg-orange-500/5`). Status bar shows “n8n: N workflows loaded” when the n8n filter is on.
- **Restore on load:** On load, the client restores last filter and pinned examples from `user_preferences` (e.g. `n8n_filter_presets.show_n8n_workflows`). Depends on `user_preferences` (and optionally `prompt_templates` / `filter_settings`) existing.
- **Example prompts:** Clickable cards under the input remain; they are filtered by the active (basic + advanced) filter. If prompts come from DB they are queried by active filter; otherwise the in-code list is filtered by selected category/sub.
- **Auto-inherit:** When the n8n filter is active and a workflow is created (create-n8n-workflow flow), tags/status from the current n8n filter preset can be auto-inherited where the n8n API supports it.
- **Live breadcrumb:** A breadcrumb above the chat shows the current context (e.g. “All > SEO > AutoSEO” or “n8n: Feed workflows”) using existing text styles.
- **Mobile:** Filter chips scroll horizontally; the Advanced bar opens as a modal. The n8n right pane is hidden on small screens (status “n8n: N workflows loaded” remains visible).
- **Styling lock:** No changes to existing visual design. New elements (Advanced bar, n8n cards, status line, breadcrumb) reuse the existing design system (orange, border-radius, shadows, font, spacing).
