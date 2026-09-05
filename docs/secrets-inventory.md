# Secrets & Configuration Inventory (Gate 1)

> **Safe to commit — contains no secret values.**
> Generated: 2026-03-01. Source: full repo scan of `hans-crafted-stories-main`.

---

## 1. Repo Map

### 1a. n8n Workflow Exports

#### Public / template workflows (`public/workflows/`)

| File | Trigger type | Purpose |
|------|-------------|---------|
| `public/workflows/intent-analysis.json` | Schedule + webhook | Weekly intent clustering; writes to Supabase, sends Gmail report |
| `public/workflows/autoseo-brain-v2.json` | Webhook + Schedule (Mon 06:00) | AutoSEO product-title optimization (NL/BE/DE/EN), writes Google Sheets |
| `public/workflows/autoseo-n8n-v2.json` | Webhook + Schedule | Same family as autoseo-brain-v2 (earlier version preserved) |
| `public/workflows/monday-orchestrator.json` | Webhook (Monday events) | Routes Monday.com item events to specialist sub-workflows by name |
| `public/workflows/seo-audit-workflow.json` | Form trigger + webhook | On-page SEO + conversion audit via OpenAI; sends Gmail report |
| `public/workflows/product-title-optimizer.json` | Webhook | Google Sheets product-title batch optimizer |

#### Infrastructure / secrets workflows (`n8n/workflows/`)

| File | Trigger type | Purpose |
|------|-------------|---------|
| `n8n/workflows/secrets_registry_verify.json` | Webhook (POST) + manual | Checks ENV, Vault, and n8n Credentials presence; never returns values |
| `n8n/workflows/secrets_provisioner.json` | Webhook (POST) + manual | Auto-provisions or generates human-in-loop request packages for missing secrets |
| `n8n/workflows/n8n_reconcile_retry.json` | Webhook (POST) + manual | Re-runs verify after provisioning; runs smoke tests or escalates |

### 1b. Templates

No dedicated `/n8n/templates/` folder exists. The workflow JSON files in `n8n/workflows/` and `public/workflows/` serve as importable templates. `seo-audit-workflow.json` and `product-title-optimizer.json` use credential-ID placeholders (`REPLACE_WITH_YOUR_CREDENTIAL_ID`) for portability.

### 1c. Scripts

| File | Language | Purpose |
|------|----------|---------|
| `scripts/commander.cjs` | Node.js (CJS) | Single-command entrypoint: `secrets:heal`, `secrets:verify`, `secrets:plan` |
| `scripts/commander.js` | Node.js (ESM) | ESM mirror of the above (both generated) |
| `scripts/n8n-add-credentials.cjs` | Node.js (CJS) | Adds Supabase, Anthropic, OpenAI, Monday.com, Firecrawl credentials to n8n via REST API |
| `scripts/n8n-add-credentials.js` | Node.js (ESM) | ESM mirror |
| `scripts/lib/redact.cjs` | Node.js (CJS) | Log-redaction middleware; masks values matching `API_KEY`, `TOKEN`, `SECRET`, `PASSWORD`, `ENCRYPTION`, `MASTER_KEY` |
| `scripts/lib/redact.js` | Node.js (ESM) | ESM mirror |
| `scripts/test-secrets-integration.cjs` | Node.js (CJS) | Integration test for the secrets heal cycle |
| `scripts/test-secrets-integration.js` | Node.js (ESM) | ESM mirror |
| `n8n/scripts/validate-manifest.cjs` | Node.js (CJS) | JSON-schema validator for `n8n/secrets.manifest.yml` |
| `n8n/scripts/validate-manifest.js` | Node.js (ESM) | ESM mirror |
| `n8n/scripts/validate-manifest.test.cjs` | Node.js (CJS) | Unit tests for the manifest validator |
| `vault-adapter/cli.cjs` | Node.js (CJS) | `vaultctl` CLI: `list`, `set <name>`, `get <name>` |
| `vault-adapter/cli.js` | Node.js (ESM) | ESM mirror |
| `vault-adapter/index.cjs` | Node.js (CJS) | Vault adapter HTTP server (port 4000); AEAD encryption via `VAULT_MASTER_KEY` |
| `vault-adapter/store.cjs` | Node.js (CJS) | Encrypted file-backed secret store (`/mnt/data/secrets.vault`) |
| `vault-adapter/crypto.cjs` | Node.js (CJS) | AEAD crypto primitives used by the store |

### 1d. Documentation

| File | Purpose |
|------|---------|
| `docs/secrets-inventory.md` | **This file** — Gate 1 canonical inventory |
| `docs/inventory-secrets-and-workflows.md` | Earlier inventory (superseded by this file for Gate 1 onwards) |
| `docs/secrets-system.md` | Architecture, threat model, local/VPS setup, rotation guide |
| `docs/runbooks/missing-secrets.md` | Per-secret instructions (how to obtain, where to store, rotation) |
| `docs/n8n-credentials-setup.md` | Step-by-step n8n credential setup (API key, Supabase, OAuth, etc.) |
| `docs/empire-n8n-flow.md` | 7-layer architecture; n8n webhook routing map; Supabase edge functions |
| `docs/n8n-credentials-setup.md` | n8n API key creation, credential script usage |
| `config/README.md` | How to use `config/all-credentials.export.env.example` |

### 1e. Docker-Compose and ENV Files

| File | Purpose |
|------|---------|
| `public/empire/docker-compose.yml` | MCP Gateway, Loki, Promtail, Grafana, **vault-adapter** (port 4000). **No n8n service** — n8n runs on the VPS itself. |
| `.env.example` | Frontend placeholders: `VITE_SUPABASE_*`, `CLOUDFLARE_*`, `VITE_ADMIN_EMAILS`. No N8N_* or COMMANDER_* here. |
| `.env.development` | Supabase project ID + URL (non-secret; Supabase project URL is public). Committed. |
| `.env.production` | Same as above for production. Committed (anon key placeholder). |
| `config/all-credentials.export.env.example` | **The key secrets template.** Defines: `N8N_BASE_URL`, `N8N_API_KEY`, `N8N_ENCRYPTION_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `MONDAY_API_TOKEN`, `COMMANDER_WEBHOOK_TOKEN`, `VAULT_MASTER_KEY`, `FIRECRAWL_API_KEY`, `CLOUDFLARE_*`. All values are placeholder strings only. Real file (`config/all-credentials.export.env`) is gitignored. |

### 1f. CI/CD

| File | Description |
|------|-------------|
| `.github/workflows/ci.yml` | Runs: lint → tsc → test → build → post-commit empire-health check. Uses GitHub secrets `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. No secrets in shell output (env vars only). |
| `.github/workflows/codeql.yml` | GitHub CodeQL security analysis |
| `.github/workflows/stale.yml` | Stale issues/PRs auto-close |
| `.github/dependabot.yml` | Dependabot for npm dependency updates |

### 1g. Commander / Relay / Webhook / Orchestrator Components

| Component | Location | Description |
|-----------|----------|-------------|
| **Commander CLI** | `scripts/commander.cjs` | Calls `secrets-registry-verify`, `secrets-provisioner`, `n8n-reconcile-retry` webhooks with `X-COMMANDER-TOKEN`. npm scripts: `commander`, `secrets:verify`, `secrets:heal`. |
| **Relay (webhook proxy)** | `supabase/functions/trigger-webhook/index.ts` | Supabase Edge Function. Validates `X-COMMANDER-TOKEN`, then proxies POST to any `webhook_url`. Used by Empire Quick Actions and Portal webhook tools. |
| **Monday Orchestrator** | `public/workflows/monday-orchestrator.json` | n8n workflow; routes Monday.com item events by `workflow` field to autoseo, product-titles, health-check, product-feed, campaign, or scraper. |
| **Webhook trigger modal** | `src/components/portal/WebhookTriggerModal.tsx` | UI component for manual webhook triggers in the Portal. |
| **EmpireQuickActions** | `src/components/empire/EmpireQuickActions.tsx` | Hardcoded buttons that fire n8n webhooks via `trigger-webhook` proxy. |
| **Manifest** | `n8n/secrets.manifest.yml` | YAML declaration of all secrets, variables, rotation metadata, and per-workflow requirements. Safe to commit. |

---

## 2. n8n Integration Surfaces

### How n8n is started

n8n runs **self-hosted on VPS1** (`https://n8n.srv1402218.hstgr.cloud`), not from the repo's docker-compose. It is provisioned separately (via the VPS setup scripts or manually). The former n8n Cloud instance was retired on 2026-08-19. The public compose file (`public/empire/docker-compose.yml`) manages the observability stack and vault adapter only.

One URL serves both roles:
- **Admin UI / API and public webhooks:** `https://n8n.srv1402218.hstgr.cloud`

### How n8n is authenticated

| Method | Header / Config | Used by |
|--------|----------------|---------|
| **REST API key** | `X-N8N-API-KEY: <N8N_API_KEY>` | `scripts/n8n-add-credentials.cjs`, `secrets_registry_verify.json` (credential check), `n8n_reconcile_retry.json` (smoke tests) |
| **Webhook header auth** | `X-COMMANDER-TOKEN: <COMMANDER_WEBHOOK_TOKEN>` | `secrets_registry_verify.json`, `secrets_provisioner.json`, `n8n_reconcile_retry.json` (all set `authentication: "headerAuth"` in webhook trigger node) |
| **Supabase proxy auth** | `X-COMMANDER-TOKEN` → validated by `trigger-webhook` edge function | EmpireQuickActions, PortalStatusTab, UnifiedChatPanel |

### Where current secrets live

| Location | Secret storage method | Notes |
|----------|----------------------|-------|
| **`config/all-credentials.export.env`** | Flat env file (gitignored) | Loaded by Commander and n8n-add-credentials via `dotenv -e config/...`. Primary secret source for local dev and VPS. |
| **Server ENV** | Docker `-e` flags or VPS `.env` file | `N8N_ENCRYPTION_KEY` must be set in n8n's own server ENV. |
| **`public/empire/docker-compose.yml`** | `environment:` block with `${VAR}` interpolation | Passes `VAULT_MASTER_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`, `GRAFANA_PASSWORD` into containers at runtime. |
| **Vault adapter** | AES-256-GCM encrypted file at `/mnt/data/secrets.vault` | HTTP API at port 4000. Master key from `VAULT_MASTER_KEY` ENV. Returns existence only, never values. |
| **n8n credential store** | n8n's internal encrypted store (`N8N_ENCRYPTION_KEY`) | Credentials added once via UI or script; referenced by name/type in workflow JSON. |
| **Supabase edge function secrets** | Supabase project secrets panel | `COMMANDER_WEBHOOK_TOKEN` must be set here for `trigger-webhook` to authenticate. |
| **GitHub Actions secrets** | GitHub repository secrets | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` for CI post-commit health check. |
| **Source code / workflow JSON** | **None** — no secret values in code | Credential references use placeholder IDs (`REPLACE_WITH_YOUR_CREDENTIAL_ID`) and names only. |

---

## 3. Hard Security Findings (Redacted)

> All findings below are descriptions only. No real secrets are printed here.

| # | File | Line(s) | Severity | Finding |
|---|------|---------|----------|---------|
| F-01 | `supabase/functions/trigger-webhook/index.ts` | 9–11 | **HIGH** | `verifyCommanderToken()` returns `true` when `COMMANDER_WEBHOOK_TOKEN` is not set in Supabase secrets (`if (!expected) return true`). This means the webhook proxy is fully unauthenticated on any deployment where the secret has not yet been provisioned. Any caller can proxy arbitrary POST requests to any URL. **Mitigation (Gate 6):** Change to fail-closed: if `expected` is empty/null, return `false` (deny). |
| F-02 | `public/empire/docker-compose.yml` | 79 | **MEDIUM** | Default Grafana admin password hardcoded as fallback: `${GRAFANA_PASSWORD:-empire2024}`. The string `empire2024` is committed in the repo. If `GRAFANA_PASSWORD` is not set, Grafana starts with this known-public password. **Mitigation:** Require `GRAFANA_PASSWORD` to be set; do not provide a default, or use a random-generated placeholder that fails clearly. |
| F-03 | `public/workflows/seo-audit-workflow.json` | 61, 86, 220, 250 | **INFO** | Credential nodes reference `id: "REPLACE_WITH_YOUR_CREDENTIAL_ID"`. This is the correct export pattern (no real IDs). Confirmed no secret values present. |
| F-04 | `public/workflows/product-title-optimizer.json` | 72, 114, 156 | **INFO** | Same placeholder pattern as F-03. Correct. |
| F-05 | `supabase/functions/trigger-webhook/index.ts` | 42 | **LOW** | `console.log("Triggering webhook:", webhook_url)` — if a webhook URL ever contains a token or API key as a query parameter, it would be logged in plain text. Current usage does not include tokens in URLs. **Mitigation (Gate 6):** Wrap with redact middleware before logging URLs. |
| F-06 | `public/empire/docker-compose.yml` | 20 | **INFO** | `N8N_URL=https://n8n.srv1402218.hstgr.cloud` hardcoded in compose. This is a non-secret URL, but it couples the compose file to a specific hostname. Consider using `${N8N_URL}` with a documented default. |
| F-07 | `scripts/n8n-add-credentials.js` | 109–110 | **LOW** | When creating OpenAI credentials, the script sets `headerValue: \`Bearer ${openAiKey}\`` inline in the credential object. This is sent to the n8n API (HTTPS), not logged. Redact middleware (`scripts/lib/redact.cjs`) should be imported to guard `console.log` calls in this file. |

**Scan result:** No literal `sk-`, `ghp_`, `xoxb-`, `AKIA[A-Z0-9]{16}`, or bare Bearer token strings found anywhere in tracked source files. The only `Bearer` strings in docs are instructional (e.g., `Authorization: Bearer YOUR_TOKEN`).

---

## 4. Dependency Matrix

Per-workflow breakdown of integrations, required ENV secrets, required variables, and n8n credential names.

| Workflow | File | Integrations / node types | Required ENV secrets | Required variables | n8n credentials (names) |
|----------|------|--------------------------|----------------------|-------------------|------------------------|
| `intent-analysis` | `public/workflows/intent-analysis.json` | Supabase, OpenAI (LangChain), Gmail | `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` | `SUPABASE_URL` | Prod - Supabase Service Role, Prod - OpenAI, Prod - Gmail |
| `autoseo-brain-v2` | `public/workflows/autoseo-brain-v2.json` | Anthropic (LangChain), Google Sheets | `ANTHROPIC_API_KEY` | `N8N_BASE_URL` | AnthropicApi, Prod - Google Sheets |
| `autoseo-n8n-v2` | `public/workflows/autoseo-n8n-v2.json` | Anthropic (LangChain), Google Sheets | `ANTHROPIC_API_KEY` | `N8N_BASE_URL` | AnthropicApi, Prod - Google Sheets |
| `seo-audit-workflow` | `public/workflows/seo-audit-workflow.json` | OpenAI (LangChain x2), Gmail | `OPENAI_API_KEY` | — | Prod - OpenAI, Prod - Gmail |
| `product-title-optimizer` | `public/workflows/product-title-optimizer.json` | Google Sheets (x3) | — | — | Prod - Google Sheets |
| `monday-orchestrator` | `public/workflows/monday-orchestrator.json` | HTTP Request (dispatch to sub-workflows) | `MONDAY_API_TOKEN` | `N8N_BASE_URL` | — |
| `secrets-registry-verify` | `n8n/workflows/secrets_registry_verify.json` | Webhook, Code (ENV check, Vault HTTP, n8n API) | `N8N_API_KEY`, `COMMANDER_WEBHOOK_TOKEN` | `N8N_BASE_URL`, `VAULT_BASE_URL` | — |
| `secrets-provisioner` | `n8n/workflows/secrets_provisioner.json` | Webhook, Code (Vault HTTP PUT) | `COMMANDER_WEBHOOK_TOKEN` | `VAULT_BASE_URL` | — |
| `n8n-reconcile-retry` | `n8n/workflows/n8n_reconcile_retry.json` | Webhook, Code (re-verify + n8n API smoke test) | `COMMANDER_WEBHOOK_TOKEN`, `N8N_API_KEY` | `N8N_BASE_URL` | — |

### Canonical secret registry

All secrets are declared in `n8n/secrets.manifest.yml`. Summary:

| Canonical name | Source | Required | Rotation | Consumers |
|----------------|--------|----------|----------|-----------|
| `N8N_API_KEY` | ENV | yes | 90 days | Commander CLI, n8n-add-credentials, verify/reconcile workflows |
| `N8N_ENCRYPTION_KEY` | ENV (n8n server) | yes | never rotate | n8n (credential encryption at rest) |
| `SUPABASE_SERVICE_ROLE_KEY` | ENV | yes | 365 days | n8n Supabase nodes, edge functions, CI |
| `ANTHROPIC_API_KEY` | ENV | yes | 180 days | n8n Anthropic LangChain nodes |
| `OPENAI_API_KEY` | ENV | yes | 180 days | n8n OpenAI LangChain nodes |
| `MONDAY_API_TOKEN` | ENV | no | 365 days | n8n Monday.com nodes, edge functions |
| `CLOUDFLARE_API_TOKEN` | ENV | no | 365 days | Wrangler, Workers deploy |
| `COMMANDER_WEBHOOK_TOKEN` | ENV | yes | 90 days | trigger-webhook edge function, Commander CLI, secrets workflows |
| `VAULT_MASTER_KEY` | ENV | no (required if vault used) | never rotate | Vault adapter (AES-256-GCM key) |
| `FIRECRAWL_API_KEY` | ENV | no | 365 days | n8n Firecrawl HTTP auth node |
| `GRAFANA_PASSWORD` | ENV | no | 90 days | Grafana admin UI |

---

## 5. Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R-01 | **Webhook proxy fail-open** (`trigger-webhook` returns `true` when token unset) | High (unset on new deploy) | High (SSRF / unauthenticated proxy to any URL) | Gate 6: change `verifyCommanderToken` to fail-closed; require `COMMANDER_WEBHOOK_TOKEN` in Supabase secrets before deploy |
| R-02 | **Secrets in logs** (any script that logs env vars or HTTP responses) | Medium | Medium | `scripts/lib/redact.cjs` covers `API_KEY`, `TOKEN`, `SECRET`, `PASSWORD` patterns; Gate 6: extend to URLs with query params and `Authorization` header values; ensure all scripts import redact |
| R-03 | **Grafana default password committed** (`empire2024`) | High (shipped by default) | Medium (Grafana admin access) | Gate 6: remove default from docker-compose; require explicit `GRAFANA_PASSWORD` or generate at startup; document in runbook |
| R-04 | **N8N_ENCRYPTION_KEY loss** | Low (stable infra) | Critical (all n8n credentials unreadable) | Set once and back up securely offline; documented in `docs/runbooks/missing-secrets.md`; never rotate unless re-creating all credentials |
| R-05 | **Bootstrap chicken-and-egg** (Commander needs `COMMANDER_WEBHOOK_TOKEN` + `N8N_API_KEY` to run) | Medium (new install) | Medium (system won't start) | Document minimal bootstrap checklist; provide `commander secrets:plan` (dry-run) that can run with only `N8N_BASE_URL` to show what's missing |
| R-06 | **Workflow JSON re-export with real credential IDs** | Low (manual error) | Low (credential ID exposure, not value) | Gate 6: add git pre-commit hook that scans workflow JSON for non-placeholder credential IDs; document "always use placeholder on export" |
| R-07 | **Secret rotation not enforced** | Medium | Medium (stale/compromised keys stay active) | `n8n/secrets.manifest.yml` has `rotation_days` per secret; Gate 5/6: add Commander `secrets:audit` command that reports overdue rotations based on last-set timestamp |
| R-08 | **Blast radius of service-role key** (`SUPABASE_SERVICE_ROLE_KEY` bypasses RLS) | Low (limited distribution) | High (full DB access) | Use only in server-side ENV (never in frontend); n8n and edge functions only; scoped by row-level policies on application tables |
| R-09 | **VAULT_MASTER_KEY in compose** | Low (compose uses `${VAR}` interpolation) | High (decrypts entire vault) | Never commit real value; key must be set only in server ENV or `.env` file that is gitignored |
| R-10 | **Seoaudit/product-title cred IDs re-exported** | Low | Low | Already using `REPLACE_WITH_YOUR_CREDENTIAL_ID`; maintain this pattern; scanner in Gate 6 |

---

## 6. Next Gate (Gate 2 — Manifest + Validator)

> **Do not proceed until Gate 1 is reviewed and signed off.**

Gate 2 will:
- Define a formal JSON Schema for `n8n/secrets.manifest.yml`
- Enhance `n8n/scripts/validate-manifest.cjs` with full schema validation and unit tests
- Produce `docs/secrets-manifest-spec.md` summarizing all fields
- Make no secrets system behavior changes

No implementation beyond schema and validator occurs in Gate 2.
