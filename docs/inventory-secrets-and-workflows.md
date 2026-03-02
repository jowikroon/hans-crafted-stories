# Secrets & Workflows Inventory Report

> Auto-generated from codebase scan. Safe to commit — contains no secret values.

---

## 1. Files and current state

| Category | Files | State / risks |
|----------|-------|---------------|
| **n8n workflow exports** | `public/workflows/intent-analysis.json`, `autoseo-brain-v2.json`, `autoseo-n8n-v2.json`, `monday-orchestrator.json`, `seo-audit-workflow.json`, `product-title-optimizer.json` | No inline secret values. `seo-audit-workflow.json` uses placeholder `REPLACE_WITH_YOUR_CREDENTIAL_ID`. `product-title-optimizer.json` uses same placeholder. |
| **Webhook relay** | `supabase/functions/trigger-webhook/index.ts` | Auth: `X-COMMANDER-TOKEN` must match `COMMANDER_WEBHOOK_TOKEN` (ENV); 401 if invalid. Backward compat if token not set. |
| **n8n API usage** | `scripts/n8n-add-credentials.cjs` | Uses `N8N_BASE_URL`/`N8N_URL`, `N8N_API_KEY`, `X-N8N-API-KEY`, `/api/v1`. Log redaction via `scripts/lib/redact.cjs`. |
| **Credentials source** | `config/all-credentials.export.env.example` | Defines N8N_*, SUPABASE_*, ANTHROPIC_*, OPENAI_*, MONDAY_*, N8N_ENCRYPTION_KEY, COMMANDER_WEBHOOK_TOKEN, VAULT_*. Real file gitignored. |
| **Docker / env** | `public/empire/docker-compose.yml`, `.env.example` | MCP gateway, Loki, Promtail, Grafana, **vault-adapter** (port 4000). Default Grafana password `empire2024` (override via GRAFANA_PASSWORD). |
| **Workflow config** | `src/lib/config/workflows.ts`, `supabase/functions/_shared/workflows.ts` | Centralized `N8N_BASE` and webhook paths. No secrets. |
| **CI** | `.github/workflows/ci.yml` | Uses GitHub secrets `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. No secrets in logs. |
| **Docs** | `docs/n8n-credentials-setup.md`, `docs/empire-n8n-flow.md` | N8N_ENCRYPTION_KEY documented. No runbooks folder. |

---

## 2. Workflow dependency matrix

| Workflow | n8n node types | Required credentials | Required variables |
|----------|---------------|---------------------|-------------------|
| `intent-analysis.json` | scheduleTrigger, supabase, if, lmChatOpenAi, gmail, noOp | Supabase API (service role), OpenAI API (gemini-compatible), Gmail OAuth2 | `SUPABASE_URL` |
| `autoseo-brain-v2.json` | stickyNote, webhook, scheduleTrigger, code, if, set, splitInBatches, lmChatAnthropic, googleSheets | Anthropic API (`AnthropicApi`), Google Sheets OAuth2 | `N8N_BASE_URL` |
| `autoseo-n8n-v2.json` | Same family as autoseo-brain-v2 | Anthropic API, Google Sheets OAuth2 | `N8N_BASE_URL` |
| `seo-audit-workflow.json` | formTrigger, httpRequest, lmChatOpenAi (x2), agent (x2), merge, aggregate, markdown, gmail, gmailTrigger | OpenAI API (Prod - OpenAI), Gmail OAuth2 (Prod - Gmail); credential IDs replaced with placeholder in export. Supports optional session cookie for protected/backend pages. | — |
| `product-title-optimizer.json` | googleSheets (x3) | Google Sheets OAuth2 (`REPLACE_WITH_YOUR_CREDENTIAL_ID`) | — |
| `monday-orchestrator.json` | webhook trigger | (depends on downstream dispatch) | `N8N_BASE_URL` |

---

## 3. External systems referenced

| System | Where used | Secrets needed |
|--------|-----------|---------------|
| **Supabase** | Edge functions, n8n nodes, frontend client | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_PUBLISHABLE_KEY` |
| **Cloudflare** | Workers, DNS, Zero Trust, Tunnels | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_ACCOUNT_ID` |
| **OpenAI / Anthropic** | n8n LangChain nodes, edge functions | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` |
| **Google (Sheets + Gmail)** | n8n OAuth2 credentials | OAuth2 flow (client ID/secret or n8n built-in) |
| **Monday.com** | Edge functions, n8n nodes | `MONDAY_API_TOKEN` |
| **GitHub** | CI secrets | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Actions secrets) |
| **Ollama** | `public/workflows/install-ai-brain.sh` (VPS 2) | No API key (local); firewall-restricted to VPS 1 |
| **MCP Gateway** | `public/empire/docker-compose.yml` | `SUPABASE_URL`, `SUPABASE_KEY` (via env) |
| **n8n API** | `scripts/n8n-add-credentials.js` | `N8N_BASE_URL`, `N8N_API_KEY` |

---

## 4. Security risks identified

1. **trigger-webhook has no auth** — any caller can proxy to any URL via the Supabase edge function.
2. **seo-audit-workflow.json contains instance-specific credential IDs** — not portable; should use placeholders.
3. **n8n-add-credentials.js may log API key** — needs redaction.
4. **Grafana default password** in docker-compose (`empire2024`).
5. **N8N_ENCRYPTION_KEY not in env example** — must be added.
6. **No COMMANDER_WEBHOOK_TOKEN** defined anywhere yet.
7. **No vault or external secrets store** — all secrets live in flat env files.

---

## 5. Canonical secret names

These are the secrets tracked by `n8n/secrets.manifest.yml`:

| Canonical name | Source | Required | Used by |
|----------------|--------|----------|---------|
| `N8N_API_KEY` | ENV | yes | n8n-add-credentials script, Commander CLI |
| `N8N_ENCRYPTION_KEY` | ENV | yes | n8n server (credential encryption at rest) |
| `SUPABASE_SERVICE_ROLE_KEY` | ENV | yes | n8n Supabase nodes, edge functions, CI |
| `ANTHROPIC_API_KEY` | ENV / VAULT | yes | n8n Anthropic nodes |
| `OPENAI_API_KEY` | ENV / VAULT | yes | n8n OpenAI nodes |
| `MONDAY_API_TOKEN` | ENV / VAULT | no | n8n Monday.com nodes, edge functions |
| `CLOUDFLARE_API_TOKEN` | ENV | no | Wrangler, Workers deploy |
| `COMMANDER_WEBHOOK_TOKEN` | ENV | yes | trigger-webhook auth, Commander CLI |
| `VAULT_MASTER_KEY` | ENV | yes (if vault used) | Vault adapter encryption |
| `FIRECRAWL_API_KEY` | ENV / VAULT | no | n8n Firecrawl HTTP auth |
| `GRAFANA_PASSWORD` | ENV | no | Grafana admin |

---

## 6. Supabase cloud (Edge Functions + types)

**Edge Function secrets** (set in Supabase Dashboard → Project Settings → Edge Functions → Secrets):

| Secret | Required by | Purpose |
|--------|--------------|---------|
| `LOVABLE_API_KEY` | n8n-agent | Primary LLM gateway (Lovable/Gemini) |
| `OPENAI_API_KEY` | llm-resume | Fallback when primary fails (model choice flow) |

**TypeScript types**: After migrations are applied to the cloud DB, run `supabase login` then `npm run supabase:types` to regenerate `src/integrations/supabase/types.ts` from the linked project (`oejeojzaakfhculcoqdh`).

*Generated from codebase scan on 2026-03-01.*
