# n8n Personal Agents — Suggestions for This Project

This doc suggests **personal agent** workflows in n8n that would improve the project. “Personal agent” here means: a workflow that receives a **goal in natural language**, uses **AI to reason and choose actions**, and returns a **clear result** — so you interact by intent, not by picking a specific workflow.

Your stack already has:

- **Command Center** → intent pipeline (fast route + LLM) → one of 7 webhooks (autoseo, product-titles, health-check, etc.).
- **n8n** as Layer 3 (Brain) with those webhooks plus Monday.com orchestrator.
- **Supabase**: `intent-router`, `n8n-agent` (build/fix workflows), `hansai-chat` (streaming AI).

The idea is to add **one or more n8n workflows that behave as agents**: webhook in → AI reasons and calls your existing workflows or tools → structured or narrative reply out. That gives you a single “ask in plain language” entry point inside n8n and keeps the rest of the architecture.

---

## Option A: Single “Unified” Personal Agent (recommended first)

**What:** One n8n workflow that acts as your main personal agent.

- **Trigger:** Webhook, e.g. `POST /webhook/personal-agent`.
- **Input:** JSON body with a `message` (and optional `context`), e.g. from Command Center or a form.
- **Logic:**
  - Use an **AI Agent** node (or a Chat Model + a few steps) with **tools** that map to actions you already have:
    - **Run workflow** → HTTP Request to your own n8n webhooks (autoseo, product-titles, health-check, product-feed, campaign, scraper).
    - **Health summary** → HTTP to your `empire-health` Supabase function or a small “health summary” subflow.
    - **Content generation** → direct LLM call for outlines, meta descriptions, short copy (no workflow needed).
  - System prompt: “You are Hans’s personal automation assistant. Given the user message, decide whether to: (1) run one of the known workflows, (2) answer a health/status question, (3) generate content, or (4) explain what you can do. Use the tools to run workflows or fetch health; otherwise answer concisely.”
- **Output:** JSON or text: `{ "action": "workflow_run" | "answer" | "clarify", "workflow"?: "autoseo", "result"?: "..." }` or a short narrative.

**Why it helps:**

- One place to “ask anything” that can both **run** your existing workflows and **answer** (e.g. “what’s the status of my services?”, “what can you do?”).
- Fits the current Command Center flow: you could add a “personal-agent” intent that forwards the user message to this webhook and displays the agent’s reply.
- You can add more tools later (e.g. “list recent empire_events”, “create Monday item”) without changing the frontend.

**Integration with this repo:**

- Add a workflow in `WORKFLOWS` in [src/lib/config/workflows.ts](src/lib/config/workflows.ts), e.g. `personal-agent` → `https://n8n.srv1402218.hstgr.cloud/webhook/personal-agent`.
- In [supabase/functions/intent-router/index.ts](supabase/functions/intent-router/index.ts), add `personal-agent` (or a generic “agent” intent) to the list the LLM can return when the user says things like “do what’s best” or “handle this”.
- Command Center already triggers workflows by name; you’d either (a) route to `personal-agent` with the raw message in the body, or (b) keep the current intent router and have it sometimes return `personal-agent` and pass the message through.

---

## Option B: Multiple Specialized Personal Agents

If you prefer **separate agents per domain** (clearer ownership, simpler prompts, easier debugging), add 2–3 n8n workflows:

### 1. SEO & Content Agent

- **Webhook:** e.g. `/webhook/agent-seo`.
- **Role:** All SEO and content tasks: product titles, meta descriptions, blog outlines, keyword ideas.
- **Tools:**
  - Call **autoseo** and **product-titles** webhooks (with optional params).
  - Optional: “generate content” tool (LLM) for meta descriptions, outlines, short copy.
- **Input:** `{ "message": "optimize my product titles for NL", "context": "..." }`.
- **Output:** Summary of what was run (e.g. “Started AutoSEO Brain”) or generated text (e.g. meta description).
- **Intent:** In the frontend, map “seo”, “content”, “titles”, “meta”, “blog outline” to this agent’s webhook so Command Center can send the user message here.

### 2. Ops & Health Agent

- **Webhook:** e.g. `/webhook/agent-ops`.
- **Role:** “Why is X down?”, “Run full health check”, “What failed in the last 24h?”.
- **Tools:**
  - Call **health-check** webhook.
  - Optional: HTTP to **empire-health** and/or read from a Supabase view of recent `empire_events` (if you expose a small API or use n8n’s Supabase node with RLS).
- **Input:** `{ "message": "run health check and summarize" }`.
- **Output:** Short narrative: “All 7 layers OK” or “Layer X is down; …”.
- **Intent:** Map “health”, “status”, “ops”, “down”, “broken” to this agent.

### 3. Writing / Blog Agent (optional)

- **Webhook:** e.g. `/webhook/agent-writing`.
- **Role:** Drafts and outlines for the site’s /writing content (e.g. “Amazon A+ content”, “Bol.com SEO”).
- **Tools:** Mainly LLM; optional “search my blog” if you add a small search API or use existing content in context.
- **Input:** `{ "message": "draft a short outline for a post on marketplace CRO" }`.
- **Output:** Markdown outline or draft.
- **Intent:** Map “blog”, “post”, “outline”, “draft”, “writing” to this agent.

**Why multiple agents:**

- Each agent has a narrow system prompt and a small set of tools → fewer tokens, clearer behavior, easier to tune.
- You can assign different models or credentials per agent (e.g. cheaper model for ops, stronger for content).
- Fits your existing categories (seo, data, infra, ai, marketing) and makes it easy to add one more “agent” entry in the Portal and in the intent router.

---

## Implementation Notes

1. **n8n AI Agent node**  
   Use the built-in **AI Agent** node (or equivalent in your n8n version) so the workflow can “reason” and call tools. Give it tools that are implemented as **Execute Workflow** or **HTTP Request** to your other webhooks and to Supabase/empire-health.

2. **Idempotency and logging**  
   For “run workflow” tools, send a correlation id (e.g. `request_id`) in the webhook body so you can trace agent → workflow runs in n8n execution history and in your audit trail.

3. **Command Center integration**  
   - **Option 1:** Add one (or more) workflow entries in [workflows.ts](src/lib/config/workflows.ts) and in the intent router’s workflow list; when the user message is classified as “personal-agent” or “agent-seo” / “agent-ops”, the frontend POSTs the **message** (and optional context) to that webhook and shows the agent’s reply in the chat.
   - **Option 2:** Keep the current “clarify then run one workflow” flow and add a **separate** “Ask personal agent” action that always sends the input to the unified agent webhook and streams or displays the answer.

4. **Security**  
   Protect agent webhooks (e.g. secret in header or query) and validate it in n8n so only your app or Supabase can call them. Reuse the same pattern you use for other n8n webhooks.

---

## Summary

| Approach | Pros | Cons |
|----------|------|------|
| **Single unified agent** | One entry point; easy to add tools later; fits “ask anything” | Prompt can get long; one place to debug |
| **Multiple specialized agents** | Clear domains (SEO, Ops, Writing); simpler prompts; matches your categories | More workflows to maintain; need to route intents to the right agent |

**Recommendation:** Start with **one Unified Personal Agent** in n8n that has tools to run your existing webhooks (autoseo, product-titles, health-check, etc.) and to answer health/content questions. Expose it as a new workflow (e.g. `personal-agent`) and optionally add an intent so Command Center can route “do this” / “what’s the status?” to it. Once that’s stable, split by domain (SEO agent, Ops agent) if you want clearer separation and simpler prompts.
