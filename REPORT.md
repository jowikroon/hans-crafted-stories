# Self-Healing Secrets System — Implementation Report

## What was built

A complete self-healing secrets management system for the Sovereign AI Empire's n8n orchestration layer. The system inventories, detects, provisions, and reconciles secrets across ENV, a vault adapter, and n8n credentials — with no plaintext secrets in code or workflow exports.

### Artifacts created

| # | Artifact | Path | Description |
|---|----------|------|-------------|
| 1 | **Inventory report** | `docs/inventory-secrets-and-workflows.md` | Full codebase scan: files, security risks, workflow dependency matrix, external systems |
| 2 | **Secrets manifest** | `n8n/secrets.manifest.yml` | Declarative inventory of all variables, secrets (with source, rotation, scopes), and per-workflow requirements matrix |
| 3 | **Verify workflow** | `n8n/workflows/secrets_registry_verify.json` | n8n workflow: checks ENV, Vault adapter, and n8n Credentials API against manifest |
| 4 | **Provisioner workflow** | `n8n/workflows/secrets_provisioner.json` | n8n workflow: classifies missing secrets, attempts auto-provision (stub), generates human request packages |
| 5 | **Reconcile workflow** | `n8n/workflows/n8n_reconcile_retry.json` | n8n workflow: re-verifies after provisioning, runs smoke tests, escalates if still broken |
| 6 | **Vault adapter** | `vault-adapter/` | Node HTTP server + CLI (`vaultctl`): AES-256-GCM encrypted file-backed secret store |
| 7 | **Commander CLI** | `scripts/commander.cjs` | Single-command entrypoint: `secrets:heal`, `secrets:verify` |
| 8 | **Log redaction** | `scripts/lib/redact.cjs` | Masks API keys, tokens, passwords in all log output |
| 9 | **Architecture docs** | `docs/secrets-system.md` | Architecture diagram, threat model, setup (local + VPS), rotation, adding secrets |
| 10 | **Runbook** | `docs/runbooks/missing-secrets.md` | Per-secret manual provisioning instructions |
| 11 | **Manifest validator** | `n8n/scripts/validate-manifest.cjs` | Schema validator for secrets.manifest.yml (CLI + importable) |
| 12 | **Unit tests** | `n8n/scripts/validate-manifest.test.cjs` | 12 assertions on manifest schema (all pass) |
| 13 | **Integration tests** | `scripts/test-secrets-integration.cjs` | 11 assertions: vault server, store, retrieve, list, remove (all pass) |

### Security fixes applied

| Fix | File | What changed |
|-----|------|-------------|
| **Webhook auth** | `supabase/functions/trigger-webhook/index.ts` | Added `X-COMMANDER-TOKEN` header validation; returns 401 if invalid |
| **Credential placeholders** | `public/workflows/seo-audit-workflow.json` | Replaced instance-specific IDs (`K6BcdLmg5csDdEHs`, `m8zHwo4b2LMy6U6Z`) with `REPLACE_WITH_YOUR_CREDENTIAL_ID` |
| **Log redaction** | `scripts/n8n-add-credentials.cjs` | Added redact import; API key masked in logs |
| **Env example** | `config/all-credentials.export.env.example` | Added `N8N_ENCRYPTION_KEY`, `COMMANDER_WEBHOOK_TOKEN`, `VAULT_MASTER_KEY`, Cloudflare, Firecrawl |
| **Gitignore** | `.gitignore` | Added `vault-adapter/data/` and `*.vault` |

---

## How to run locally

### Prerequisites
- Node.js 20+
- n8n instance (local Docker or remote)

### Quick start

```bash
# 1. Install dependencies (if not done)
npm ci

# 2. Copy and fill env file
cp config/all-credentials.export.env.example config/all-credentials.export.env
# Edit and paste your real values

# 3. Validate the manifest
npm run secrets:validate-manifest

# 4. Run unit tests
npm run test:secrets-unit

# 5. Run integration tests (starts vault adapter automatically)
npm run test:secrets-integration

# 6. Start vault adapter (in a separate terminal)
npm run vault:start

# 7. Push credentials to n8n
npm run n8n:add-credentials

# 8. Import workflows into n8n
#    Import these 3 files via n8n UI (Settings -> Import):
#    - n8n/workflows/secrets_registry_verify.json
#    - n8n/workflows/secrets_provisioner.json
#    - n8n/workflows/n8n_reconcile_retry.json
#    Activate all three.

# 9. Run the full heal cycle
npm run secrets:heal

# 10. Or just verify
npm run secrets:verify
```

### All npm scripts

| Script | Command |
|--------|---------|
| `npm run commander -- secrets:heal` | Full heal: verify -> provision -> reconcile |
| `npm run commander -- secrets:verify` | Verify only |
| `npm run secrets:heal` | Shortcut for heal with apply mode |
| `npm run secrets:verify` | Shortcut for verify |
| `npm run secrets:validate-manifest` | Validate manifest schema |
| `npm run test:secrets-unit` | Run manifest unit tests |
| `npm run test:secrets-integration` | Run vault integration tests |
| `npm run vault:start` | Start vault adapter on port 4000 |
| `npm run vaultctl -- set NAME VALUE` | Store a secret |
| `npm run vaultctl -- get NAME` | Retrieve a secret |
| `npm run vaultctl -- list` | List secret names |
| `npm run n8n:add-credentials` | Push credentials to n8n via API |

---

## How to deploy on VPS

1. **Clone repo** to `/opt/hansai/` (or wherever the empire root is).

2. **Set ENV vars** in the server environment (e.g. `/opt/hansai/.env` or Docker env):
   - All vars from `config/all-credentials.export.env.example`
   - `VAULT_MASTER_KEY` (generate: `openssl rand -hex 32`)
   - `COMMANDER_WEBHOOK_TOKEN` (generate: `openssl rand -hex 32`)

3. **Start vault adapter** via Docker:
   ```bash
   cd /opt/hansai && docker compose up vault-adapter -d
   ```

4. **Import workflows** into n8n and activate them.

5. **Set `COMMANDER_WEBHOOK_TOKEN`** in Supabase edge function secrets (for `trigger-webhook`).

6. **Run heal**:
   ```bash
   npm run secrets:heal
   ```

---

## Known limitations

| Limitation | Details |
|-----------|---------|
| **Auto-provisioning is stub-only** | No provider APIs are called. Cloudflare token creation, GitHub App tokens, etc. are marked as manual. The provisioner generates request packages with instructions. |
| **Vault adapter is a stub** | File-backed AES-256-GCM encryption. For production, replace with HashiCorp Vault, AWS Secrets Manager, or similar — same GET/PUT HTTP contract. |
| **n8n workflows must be imported manually** | The three workflow JSONs need to be imported into n8n via the UI or API. Commander assumes they're active and webhook paths are registered. |
| **Google Sheets & Gmail require OAuth** | Cannot be provisioned via API. Must be set up in n8n UI manually. |
| **trigger-webhook backward compat** | If `COMMANDER_WEBHOOK_TOKEN` is not set, the auth check is skipped (allows existing callers to keep working). Set the token to enforce auth. |

---

## Test results

```
Unit tests (manifest validator):    12/12 passed
Integration tests (vault adapter):  11/11 passed
```

---

*Generated 2026-03-01. Single source of truth: `n8n/secrets.manifest.yml` + `config/all-credentials.export.env`.*
