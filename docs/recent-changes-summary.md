# Recent Changes Summary (Last 30 Minutes)

Single reference for other AI analyses and flow/function improvements. Covers two main efforts: **Command Center as single intent link** and **automatic n8n workflow creation**.

---

## 1. Command Center as the Only Real Link to Intent

### Goal
One canonical entry point where user intent is classified, executed (workflow), clarified, or logged as unhandled. All other “Command Center” surfaces either use this pipeline or delegate to it.

### New / Shared Code

| Item | Path | Purpose |
|------|------|--------|
| Shared intent pipeline | `src/lib/intent/pipeline.ts` | `runIntentPipeline(input, source)`, `triggerWorkflow(wf, source)`, `logUnhandledIntent(...)`. fastRoute → LLM classify → returns `PipelineOutcome`: `workflow_match` \| `clarify` \| `unhandled` \| `chat_fallback`. |

### Flow (High Level)

```text
User input → runIntentPipeline("command_center")
  → workflow_match (high/LLM) → triggerWorkflow() → show result in chat
  → clarify → show workflow picker UI; user picks or “Something else” → execute or fallback to AI
  → unhandled → logUnhandledIntent(..., "command_center"); then optional AI fallback
  → chat_fallback → send to n8n-agent (UnifiedChatPanel) or hansai-chat (HansAI)
```

### Files Touched (Intent Consolidation)

- **`src/lib/intent/pipeline.ts`** (new)  
  - Exports: `runIntentPipeline`, `triggerWorkflow`, `logUnhandledIntent`.  
  - Uses `fastRoute` from `@/lib/intent/router`, `WORKFLOWS` from `@/lib/config/workflows`, intent-router edge function, Supabase `unhandled_intents`.  
  - All user-facing unhandled intents use `source: "command_center"`.

- **`src/components/portal/UnifiedChatPanel.tsx`**  
  - Send flow is intent-first: runs `runIntentPipeline` before calling n8n-agent.  
  - Pipeline stages include **INTENT** (TRANSMIT → INTENT → ANALYZE → SYNTHESIZE → COMPLETE).  
  - Handles `workflow_match` (execute + show workflow message), `clarify` (inline workflow picker), `unhandled` (log + optional AI), `chat_fallback` (n8n-agent).  
  - Message types: `user` \| `assistant` \| `system` \| `workflow`.  
  - IntentButton receives `onExecute(wf)` and runs workflow from badge.  
  - Subtitle/copy: “Intent · Workflows · AI” / “Type a goal — workflows run automatically”.

- **`src/components/portal/IntentButton.tsx`**  
  - Uses `runIntentPipeline` instead of direct intent-router fetch.  
  - New prop: `onExecute?: (wf: WorkflowDef) => void`. When a workflow is matched, badge can show a play button that calls `onExecute(wf)`.

- **`src/pages/HansAI.tsx`**  
  - Removed local `classifyIntent`, `logUnhandledIntent`, `fastRoute` usage.  
  - `processInput` uses `runIntentPipeline(trimmed, "command_center")` and switches on outcome (workflow_match, clarify, unhandled, chat_fallback).  
  - All workflow triggers and logs use `source: "command_center"`.  
  - Removed agent debug `fetch` calls.

- **`src/components/overlays/HansAIOverlay.tsx`**  
  - Replaced chat-only UI with a shell that renders **UnifiedChatPanel** (same intent-first panel as Portal).  
  - “Full Terminal →” still links to `/hansai`.

- **Wiki and discoverability**  
  - `src/components/wiki/WikiComponentRegistry.tsx`: Command Center card = “the only link to intent”; Hans AI → “Hans AI Terminal”; Smart Routing = “Built into every send”.  
  - `src/components/wiki/WikiExamples.tsx`: Examples say “Open Command Center from the Portal or navigation bar”.  
  - `src/pages/Wiki.tsx`: Quick-start cards updated (Command Center everywhere, intent-first).

- **Direct webhook hints**  
  - `src/components/portal/WebhookTriggerModal.tsx`: Line “For intent-based runs, use **Command Center**”.  
  - `src/components/empire/EmpireQuickActions.tsx`: “For intent-based runs, use Command Center”.

### Data / Backend (Intent)

- **`unhandled_intents`**  
  - User-initiated unhandled intents from Command Center (Portal panel + HansAI page) use `source: "command_center"`.  
  - Monday webhook keeps `source: "monday"` for system-driven intents.  
  - Portal Status tab and weekly intent-analysis workflow unchanged; they already consume `unhandled_intents`.

---

## 2. Automatic n8n Workflow Creation

### Goal
When the AI (Command Center or n8n-agent) generates a workflow, that workflow is created in n8n via the API, not only returned as JSON for manual import.

### New / Shared Code

| Item | Path | Purpose |
|------|------|--------|
| Edge function | `supabase/functions/n8n-create-workflow/index.ts` | POST with workflow JSON; validates/sanitizes; POSTs to n8n REST API; returns `{ success, id, name, url }` or error. |
| Client helper | `src/lib/n8n/create-workflow.ts` | `extractWorkflowJsonFromMarkdown(text)`, `createWorkflowInN8n(payload, accessToken)`. |

### Flow (High Level)

```text
User: “Build a Gmail → Slack workflow”
  → n8n-agent (or Command Center) returns reply (markdown + optional ```json workflow block)
  → Client: extractWorkflowJsonFromMarkdown(reply)
  → If workflow JSON found → createWorkflowInN8n(workflowJson, token)
      → POST to /functions/v1/n8n-create-workflow (Bearer token)
      → Edge function: validate/sanitize → POST to N8N_BASE_URL/api/v1/workflows (X-N8N-API-KEY)
  → Client: append message “✓ Workflow created in n8n: [name](url)” or error
```

### Edge Function: `n8n-create-workflow`

- **Method:** POST only.  
- **Auth:** Requires `Authorization: Bearer <JWT>`. Validates with Supabase `getUser(token)`.  
- **Env (server-only):** `N8N_BASE_URL` or `N8N_URL`, `N8N_API_KEY`. Used only inside the function.  
- **Body:** JSON with optional `name`, `nodes`, `connections`, `settings`, `staticData`, `meta`.  
- **Validation:** Body must be an object; if `nodes` present, must be array; `connections` must be object if present.  
- **Sanitization:** Only forwards the fields above to n8n; default `name` = `"AI-generated workflow"` if missing.  
- **n8n call:** `POST ${N8N_BASE_URL}/api/v1/workflows` with header `X-N8N-API-KEY`.  
- **Response:** `{ success: true, id, name, url }` (url = workflow editor link) or `{ success: false, error }`.  

Config: `supabase/config.toml` — `[functions.n8n-create-workflow]` with `verify_jwt = false` (auth done inside the function).

### Client Helper: `src/lib/n8n/create-workflow.ts`

- **`extractWorkflowJsonFromMarkdown(text)`**  
  - Finds first fenced code block (e.g. ` ```json ... ``` ` or ` ``` ... ``` `).  
  - Parses as JSON; returns payload only if it looks like an n8n workflow (has `nodes` array or non-empty `name`).  

- **`createWorkflowInN8n(payload, accessToken)`**  
  - POSTs to `VITE_SUPABASE_URL/functions/v1/n8n-create-workflow` with Bearer token.  
  - Returns `{ success, id?, name?, url?, error? }`.

### Wiring in UI

- **UnifiedChatPanel** (`src/components/portal/UnifiedChatPanel.tsx`)  
  - After n8n-agent reply in `sendToAI`: runs `extractWorkflowJsonFromMarkdown(data.reply)`.  
  - If found and token present: `createWorkflowInN8n(workflowJson, token)`.  
  - Appends a `workflow` or `system` message with creation result (link or error).  

- **N8nAgentModal** (`src/components/portal/N8nAgentModal.tsx`)  
  - After assistant reply: same extraction and `createWorkflowInN8n`; appends follow-up message with result.

### Prompt Updates (Workflow JSON Output)

- **N8nAgentModal** `SYSTEM_PROMPT`: When user asks to **create/build/generate** a workflow, the model must output a **single** valid n8n workflow in a **` ```json ` code block** with `name`, `nodes`, `connections`; standard n8n node types; credential placeholders (e.g. `REPLACE_WITH_YOUR_CREDENTIAL_ID`) instead of real secrets.  
- **UnifiedChatPanel** `UNIFIED_SYSTEM_PROMPT`: Same instruction added so “create/build/generate workflow” responses include one valid workflow in a ` ```json ` block for automatic creation.

### Required Setup (n8n-create-workflow)

- Supabase secrets (or env for the function): `N8N_BASE_URL` (or `N8N_URL`), `N8N_API_KEY`.  
- Deploy: e.g. `supabase functions deploy n8n-create-workflow`.

---

## Quick Reference: Key Paths

| Concern | Paths |
|--------|--------|
| Intent pipeline (shared) | `src/lib/intent/pipeline.ts`, `src/lib/intent/router.ts` |
| Command Center UI (intent-first) | `src/components/portal/UnifiedChatPanel.tsx` |
| Intent button + execute | `src/components/portal/IntentButton.tsx` |
| Full-page terminal (same pipeline) | `src/pages/HansAI.tsx` |
| Navbar Command Center | `src/components/overlays/HansAIOverlay.tsx` |
| n8n create workflow (server) | `supabase/functions/n8n-create-workflow/index.ts` |
| n8n create workflow (client) | `src/lib/n8n/create-workflow.ts` |
| Unhandled intents | `unhandled_intents` table; Portal Status tab; intent-analysis workflow |
| Wiki / discoverability | `src/components/wiki/WikiComponentRegistry.tsx`, `WikiExamples.tsx`, `src/pages/Wiki.tsx` |

---

## Suggested Follow-ups for Flow / Function Improvements

1. **Intent pipeline**  
   - Optional: allow `runIntentPipeline` to accept context (e.g. hierarchy or current page) for better routing.  
   - Consider rate limiting or idempotency for workflow execution from clarification picks.

2. **n8n-create-workflow**  
   - Optional: allowlist of user IDs or roles for who can create workflows.  
   - Stricter schema validation (e.g. node `type` allowlist, position bounds).  
   - Optional: `verify_jwt = true` and use Supabase-injected user instead of manual `getUser(token)`.

3. **AI workflow output**  
   - If the model often returns invalid JSON, add retry or a small “fix JSON” step before calling the create endpoint.  
   - Optional: backend parses reply and creates workflow inside n8n-agent edge function so the client never sees raw workflow JSON.

4. **Observability**  
   - Log workflow creation (user id, workflow name/id) in `empire_events` or similar for audits.  
   - Track unhandled intent volume by `source` for tuning the intent model and workflows.
