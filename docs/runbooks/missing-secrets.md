# Runbook: Missing Secrets

When `commander secrets:heal` or `secrets_registry_verify` reports missing secrets that cannot be auto-provisioned, follow this guide.

---

## General procedure

1. Identify the missing secret from the Commander report.
2. Find the provider instructions below.
3. Obtain the value from the provider dashboard.
4. Store it:
   - **Server ENV:** Add to `config/all-credentials.export.env` (local) or the server's `.env` / Docker environment.
   - **Vault:** `node vault-adapter/cli.js set <SECRET_NAME> <value>`
   - **n8n Credential:** Open n8n UI -> Settings -> Credentials -> Add/Edit.
5. Re-run: `npm run commander -- secrets:verify`

---

## Per-secret instructions

### N8N_API_KEY
- **Provider:** n8n instance
- **How:** Open n8n (`https://n8n.srv1402218.hstgr.cloud`) -> Settings (gear) -> n8n API -> Create an API key.
- **Store in:** `config/all-credentials.export.env` as `N8N_API_KEY=<value>`

### N8N_ENCRYPTION_KEY
- **Provider:** Self-generated
- **How:** `openssl rand -hex 32`
- **Store in:** n8n server ENV. Set once, never change (or all credentials become unreadable).
- **Warning:** If you lose this key, you must re-create all n8n credentials.

### SUPABASE_SERVICE_ROLE_KEY
- **Provider:** Supabase dashboard
- **How:** Project Settings -> API -> "service_role" key (the secret one, not anon).
- **Store in:** `config/all-credentials.export.env` and as n8n credential "Prod - Supabase Service Role".

### ANTHROPIC_API_KEY
- **Provider:** Anthropic Console (`console.anthropic.com`)
- **How:** API Keys -> Create key.
- **Store in:** `config/all-credentials.export.env` and as n8n credential "Prod - Anthropic Claude".

### OPENAI_API_KEY
- **Provider:** OpenAI Platform (`platform.openai.com`)
- **How:** API Keys -> Create new secret key.
- **Store in:** `config/all-credentials.export.env` and as n8n credential "Prod - OpenAI".

### MONDAY_API_TOKEN
- **Provider:** Monday.com
- **How:** Profile picture -> Developers -> My Access Tokens -> Show/Generate.
- **Store in:** `config/all-credentials.export.env` and as n8n credential "Prod - Monday.com".

### CLOUDFLARE_API_TOKEN
- **Provider:** Cloudflare dashboard
- **How:** Profile -> API Tokens -> Create Token (use "Edit zone DNS" or custom template).
- **Store in:** `config/all-credentials.export.env`

### COMMANDER_WEBHOOK_TOKEN
- **Provider:** Self-generated
- **How:** `openssl rand -hex 32`
- **Store in:** `config/all-credentials.export.env` AND in the Supabase edge function secrets (for `trigger-webhook`).

### VAULT_MASTER_KEY
- **Provider:** Self-generated
- **How:** `openssl rand -hex 32`
- **Store in:** Server ENV only. Never commit. Required for the vault adapter to start.

### FIRECRAWL_API_KEY
- **Provider:** Firecrawl (`firecrawl.dev`)
- **How:** Sign up -> Dashboard -> API Keys -> Copy.
- **Store in:** `config/all-credentials.export.env`

### GRAFANA_PASSWORD
- **Provider:** Self-chosen
- **How:** Pick a strong password for the Grafana admin user.
- **Store in:** Server ENV as `GRAFANA_PASSWORD` (overrides the default `empire2024`).

---

## Google Sheets & Gmail (OAuth2)

These cannot be provisioned via API or CLI. You must:

1. Open n8n UI -> Settings -> Credentials -> Add credential.
2. Choose "Google Sheets OAuth2 API" or "Gmail OAuth2 API".
3. Name it "Prod - Google Sheets" or "Prod - Gmail".
4. Complete the OAuth2 flow (sign in with Google).
5. Save.

---

## After provisioning

Run the full heal cycle to confirm:

```bash
npm run commander -- secrets:heal --mode=apply
```

If the report shows `ok: true`, you're done. If not, check which secrets are still missing and repeat the steps above.
