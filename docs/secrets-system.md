# Secrets System — Architecture & Operations

Self-healing secrets management for the Sovereign AI Empire's n8n orchestration layer.

---

## Architecture

```
                        ┌──────────────────────┐
                        │   Commander CLI       │
                        │  scripts/commander.js │
                        └──────┬───────────────┘
                               │  X-COMMANDER-TOKEN
                 ┌─────────────┼─────────────────┐
                 ▼             ▼                  ▼
         ┌──────────┐  ┌──────────────┐  ┌──────────────┐
         │ Verify   │  │ Provisioner  │  │ Reconcile    │
         │ Workflow  │  │ Workflow     │  │ & Retry      │
         └──┬──┬──┬─┘  └──────┬───┬──┘  └──────┬───────┘
            │  │  │           │   │             │
     ┌──────┘  │  └──────┐   │   │      ┌──────┘
     ▼         ▼         ▼   ▼   ▼      ▼
  ┌──────┐ ┌───────┐ ┌──────────┐ ┌──────────┐
  │ ENV  │ │ Vault │ │ n8n Cred │ │ Runbook  │
  │ vars │ │Adapter│ │   API    │ │ (manual) │
  └──────┘ └───────┘ └──────────┘ └──────────┘
```

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **secrets.manifest.yml** | `n8n/secrets.manifest.yml` | Declarative inventory of all secrets, variables, and per-workflow requirements. Safe to commit. |
| **Verify workflow** | `n8n/workflows/secrets_registry_verify.json` | Checks ENV, Vault adapter, and n8n Credentials API for every secret in the manifest. |
| **Provisioner workflow** | `n8n/workflows/secrets_provisioner.json` | Attempts auto-provisioning (stub) or generates human-readable request packages. |
| **Reconcile workflow** | `n8n/workflows/n8n_reconcile_retry.json` | Re-verifies after provisioning, runs smoke tests, escalates if still broken. |
| **Vault adapter** | `vault-adapter/` | Stub encrypted file-backed secret store with HTTP API and `vaultctl` CLI. |
| **Commander CLI** | `scripts/commander.cjs` | Single-command entrypoint: `secrets:heal`, `secrets:verify`. |
| **Log redaction** | `scripts/lib/redact.cjs` | Masks secret values in all log output. |

---

## Threat model

| Threat | Mitigation |
|--------|-----------|
| **Vault master key compromise** | Key lives only in server ENV (`VAULT_MASTER_KEY`), never in code or logs. Rotate by re-encrypting the vault file. |
| **n8n encryption key loss** | `N8N_ENCRYPTION_KEY` is set once in n8n server ENV. Losing it means all n8n credentials become unreadable. Back up securely. |
| **Webhook replay / SSRF** | `trigger-webhook` requires `X-COMMANDER-TOKEN` header. Commander CLI sends it on every call. |
| **Secret in workflow JSON** | All workflow exports use credential references (name/ID), never inline values. Credential IDs are replaced with `REPLACE_WITH_YOUR_CREDENTIAL_ID` for portability. |
| **Log leakage** | `scripts/lib/redact.js` masks any env var matching `API_KEY`, `TOKEN`, `SECRET`, `PASSWORD`, `ENCRYPTION`, `MASTER_KEY`. All scripts import and use it. |
| **Bootstrap problem** | The system needs at least `N8N_BASE_URL`, `N8N_API_KEY`, and `COMMANDER_WEBHOOK_TOKEN` in ENV to start. These must be set manually once. |

---

## Setup

### Local (Docker)

1. Copy env example and fill in your values:
   ```bash
   cp config/all-credentials.export.env.example config/all-credentials.export.env
   # Edit and paste real values
   ```

2. Generate a vault master key:
   ```bash
   openssl rand -hex 32
   # Paste into VAULT_MASTER_KEY in your env file
   ```

3. Start the vault adapter:
   ```bash
   cd vault-adapter && VAULT_MASTER_KEY=<key> node index.cjs
   # Or via docker compose:
   cd public/empire && docker compose up vault-adapter -d
   ```

4. Import the three workflows into n8n:
   - `n8n/workflows/secrets_registry_verify.json`
   - `n8n/workflows/secrets_provisioner.json`
   - `n8n/workflows/n8n_reconcile_retry.json`
   - Activate all three.

5. Run the heal command:
   ```bash
   npm run commander -- secrets:heal --mode=apply
   ```

### VPS

Same steps, but:
- ENV vars go in `/opt/hansai/.env` or the n8n Docker environment.
- Vault adapter runs as a Docker service (see `public/empire/docker-compose.yml`).
- `VAULT_FILE=/mnt/data/secrets.vault` for persistent storage.
- Ensure `COMMANDER_WEBHOOK_TOKEN` is set in both the n8n server env (for `trigger-webhook`) and in the env where Commander runs.

---

## Key rotation

1. **Update the value** in `config/all-credentials.export.env` (local) or server ENV (VPS).
2. **If the secret is in the vault:** `vaultctl set <name> <new-value>`.
3. **If the secret is an n8n credential:** Open n8n UI -> Credentials -> Edit -> paste new value -> Save.
4. **Re-run verify:** `npm run commander -- secrets:verify` to confirm.

---

## Adding a new secret

1. Add entry to `n8n/secrets.manifest.yml` under `secrets:` with name, source, purpose, required, rotation_days, scopes.
2. If it belongs to a workflow, add it to the workflow's `required_secrets` list in the manifest.
3. Add the env var name to `config/all-credentials.export.env.example` (commented, with placeholder).
4. If auto-provisionable, add logic to the `Classify & Provision` node in `secrets_provisioner.json`.
5. If manual, add instructions to `docs/runbooks/missing-secrets.md`.
6. Run `npm run commander -- secrets:heal` to verify.

---

## Commands reference

| Command | What it does |
|---------|-------------|
| `npm run commander -- secrets:heal --mode=apply` | Full heal cycle: verify -> provision -> reconcile |
| `npm run commander -- secrets:heal --mode=dry-run` | Verify only, report what would be provisioned |
| `npm run commander -- secrets:verify` | Just run verification, exit 0 if all OK |
| `npm run n8n:add-credentials` | Push credentials to n8n via API (existing script) |
| `node vault-adapter/cli.cjs set <name> <value>` | Store a secret in the vault |
| `node vault-adapter/cli.cjs get <name>` | Retrieve a secret (stdout only) |
| `node vault-adapter/cli.cjs list` | List secret names in the vault |
