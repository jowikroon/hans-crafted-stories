# n8n Credentials Setup Guide

This guide maps every credential used by the Sovereign AI Empire’s n8n workflows to your single source of truth: **`config/all-credentials.export.env`**. Use it to create and test each credential in the n8n UI.

---

## n8n URL (your instance)

| Use for | URL |
|--------|-----|
| **Open n8n (dashboard / UI)** | **https://n8n.srv1402218.hstgr.cloud** |
| **Webhooks & API (code / env)** | **https://n8n.hansvanleeuwen.com** |

Whenever this doc says “in n8n” or “open n8n”, use: **https://n8n.srv1402218.hstgr.cloud**.  
For `N8N_BASE_URL` / `N8N_URL` in env and for the script, use either URL (script talks to the same instance).

---

## Basic steps (what to do)

1. **Open n8n**  
   Go to **https://n8n.srv1402218.hstgr.cloud** and log in.

2. **Enable the API and create an API key**  
   In n8n: **Settings (gear) → n8n API → Create an API key**.  
   Copy the key; you’ll put it in `config/all-credentials.export.env` as `N8N_API_KEY`.  
   (If the API isn’t available, set `N8N_API_ENABLED=true` in the environment where n8n runs and restart n8n.)

3. **Prepare your env file**  
   In **`config/all-credentials.export.env`** (create it if needed), add or confirm:
   - `N8N_BASE_URL=https://n8n.srv1402218.hstgr.cloud` (or `N8N_URL=...` — same value)
   - `N8N_API_KEY=<the key from step 2>`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `MONDAY_API_TOKEN` (and optionally `FIRECRAWL_API_KEY`).  
   Never commit this file.

4. **Add credentials automatically**  
   From the project root run:  
   `npm run n8n:add-credentials`  
   This adds Supabase, Anthropic, OpenAI, Monday.com (and optionally Firecrawl) to **https://n8n.srv1402218.hstgr.cloud**.

5. **Add Google Sheets and Gmail in n8n**  
   Open **https://n8n.srv1402218.hstgr.cloud** → **Settings → Credentials → Add credential**. Add **Google Sheets OAuth2** and **Gmail OAuth2** (OAuth flow in the UI; cannot be scripted).

6. **Test**  
   In n8n, open a workflow that uses a credential (e.g. Supabase or Claude), select the new credential, and run the node once.

---

## Add all credentials via script (recommended)

You can add **Supabase, Anthropic, OpenAI, Monday.com, and Firecrawl** credentials in one go using the n8n REST API. The script talks to **https://n8n.srv1402218.hstgr.cloud** (or whatever you set in `N8N_BASE_URL`).

**Prerequisites**

1. **n8n API enabled** on your instance (e.g. env `N8N_API_ENABLED=true`). Open **https://n8n.srv1402218.hstgr.cloud** → **Settings → n8n API → Create an API key**.
2. **`config/all-credentials.export.env`** (or your `.env`) containing at least:
   - `N8N_BASE_URL` or `N8N_URL` — your n8n URL, e.g. **`https://n8n.srv1402218.hstgr.cloud`**
   - `N8N_API_KEY` — the API key from step 1
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `MONDAY_API_TOKEN` (optional: `FIRECRAWL_API_KEY`)

**Run (from project root)**

```bash
npm run n8n:add-credentials
```

This loads `config/all-credentials.export.env` and runs the script. Or run with env already in the shell:

```bash
node scripts/n8n-add-credentials.js
```

The script creates: **Prod - Supabase Service Role**, **Prod - Anthropic Claude**, **AnthropicApi** (for workflows that expect that name), **Prod - OpenAI**, **Prod - Monday.com**, and optionally **Prod - Firecrawl**. **Google Sheets** and **Gmail** require OAuth and must be added manually in the n8n UI (see section 2 below).

---

## 1. Credential table (source → n8n)

Copy values from `config/all-credentials.export.env` (or your Supabase / Cloudflare / API dashboards) into n8n using the names below.

| Credential | n8n Type | Recommended Name in n8n | Fields to fill | Source value from our .env |
|------------|----------|--------------------------|----------------|----------------------------|
| **Supabase (service role)** | Supabase API | Prod - Supabase Service Role | **Host:** `https://oejeojzaakfhculcoqdh.supabase.co`<br>**Service Role Key:** (secret) | `SUPABASE_URL` → Host<br>`SUPABASE_SERVICE_ROLE_KEY` → Service Role Key |
| **Supabase (anon, optional)** | Supabase API | Prod - Supabase Anon | **Host:** `https://oejeojzaakfhculcoqdh.supabase.co`<br>**Anon Key:** (see below) | `VITE_SUPABASE_URL` → Host<br>`VITE_SUPABASE_PUBLISHABLE_KEY` → Anon Key |
| **Anthropic (Claude)** | Anthropic API | Prod - Anthropic Claude | **API Key:** (secret) | `ANTHROPIC_API_KEY` |
| **OpenAI** | OpenAI API | Prod - OpenAI | **API Key:** (secret) | `OPENAI_API_KEY` |
| **Google Sheets** | Google Sheets OAuth2 API | Prod - Google Sheets | OAuth2 flow (see step-by-step) | Use Google Cloud OAuth client ID/secret from env or Google Cloud Console; no single .env key — set up OAuth in n8n |
| **Gmail** | Gmail OAuth2 API | Prod - Gmail | OAuth2 flow (see step-by-step) | Use Google Cloud OAuth; same or separate client as Sheets. No single .env key — OAuth in n8n |
| **Monday.com** | Monday.com API | Prod - Monday.com | **API Token:** (secret) | `MONDAY_API_TOKEN` |
| **Firecrawl (optional)** | HTTP Header Auth or Custom | Prod - Firecrawl | **Header:** `Authorization`<br>**Value:** `Bearer <key>` | `FIRECRAWL_API_KEY` |
| **Lovable / AI (optional)** | Not used in n8n | — | — | `LOVABLE_API_KEY` used by Supabase Edge (hansai-chat, n8n-agent, intent-router), not by n8n nodes |

**Real values you can paste now (public / non-secret):**

- **Supabase URL (Host):** `https://oejeojzaakfhculcoqdh.supabase.co`
- **Supabase Project ID:** `oejeojzaakfhculcoqdh`
- **Supabase Anon Key (for reference; use in frontend only, not for n8n service role):**  
  `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lamVvanphYWtmaGN1bGNvcWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NDU5NzUsImV4cCI6MjA4NzMyMTk3NX0.T1QzJqTEZTlyqU4DI3sUGTblb5TGD52jJqRbaBXa9A4`

All other values (service role key, API keys, tokens) must come from **`config/all-credentials.export.env`** — never commit that file.

---

## 2. Step-by-step: add each credential in n8n UI

Open **https://n8n.srv1402218.hstgr.cloud** and use the steps below.

### 2.1 Supabase (Service Role) — required for Supabase nodes

1. In n8n (**https://n8n.srv1402218.hstgr.cloud**): **Settings (gear) → Credentials → Add credential**.
2. Search for **Supabase** → choose **Supabase API**.
3. **Name:** `Prod - Supabase Service Role`.
4. **Host:** paste `https://oejeojzaakfhculcoqdh.supabase.co` (or from `SUPABASE_URL`).
5. **Service Role Key:** paste value of `SUPABASE_SERVICE_ROLE_KEY` from `config/all-credentials.export.env`.
6. Click **Save**.
7. **Test:** open a workflow with a Supabase node (e.g. Intent Analysis), select this credential, run the node once.

### 2.2 Anthropic (Claude) — for AutoSEO Brain v2 and other Claude nodes

1. **Credentials → Add credential** → search **Anthropic** → **Anthropic API**.
2. **Name:** `Prod - Anthropic Claude`.
3. **API Key:** paste `ANTHROPIC_API_KEY` from `config/all-credentials.export.env`.
4. **Save** → in workflow (e.g. AutoSEO Brain v2) open the Claude/LangChain node and select credential **Prod - Anthropic Claude** (or the name you gave; workflow JSON expects `AnthropicApi` — either create with that exact name or remap in the node).

### 2.3 OpenAI — for SEO Audit and Intent Analysis (OpenAI/Groq-compatible nodes)

1. **Credentials → Add credential** → **OpenAI API**.
2. **Name:** `Prod - OpenAI`.
3. **API Key:** paste `OPENAI_API_KEY` from `config/all-credentials.export.env` (or your Groq/OpenAI key if you use it for `google/gemini-2.5-flash`-style model IDs).
4. **Save** → attach to OpenAI Chat Model / LangChain nodes.

### 2.4 Google Sheets OAuth2 — for Product Title Optimizer and AutoSEO Sheets output

1. **Credentials → Add credential** → **Google Sheets OAuth2 API**.
2. **Name:** `Prod - Google Sheets`.
3. Complete the OAuth2 flow (sign in with the Google account that has access to your sheets).  
   If you have **Google OAuth Client ID** and **Client Secret** in `config/all-credentials.export.env` (e.g. `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`), you can use a custom OAuth app; otherwise use n8n’s built-in Google connection.
4. **Save** → in workflows (Product Title Optimizer, AutoSEO Brain v2 “Write to Google Sheets”) select **Prod - Google Sheets**.

### 2.5 Gmail OAuth2 — for SEO Audit and Intent Analysis “Email Summary”

1. **Credentials → Add credential** → **Gmail OAuth2 API**.
2. **Name:** `Prod - Gmail`.
3. Complete OAuth2 (same Google account or separate; Gmail scope required).
4. **Save** → in Email/Gmail nodes select **Prod - Gmail**.

### 2.6 Monday.com — if any workflow calls Monday API from n8n

1. **Credentials → Add credential** → **Monday.com API**.
2. **Name:** `Prod - Monday.com`.
3. **API Token:** paste `MONDAY_API_TOKEN` from `config/all-credentials.export.env`.
4. **Save**.

### 2.7 Firecrawl (optional) — only if you add a “scrape URL”–style node using Firecrawl

1. **Credentials → Add credential** → **HTTP Request** or **Header Auth** (depending on n8n version).
2. **Name:** `Prod - Firecrawl`.
3. **Header:** `Authorization` · **Value:** `Bearer <paste FIRECRAWL_API_KEY>`.
4. **Save**.

---

## 3. n8n environment variables (server / Docker)

Set these where n8n runs (e.g. `.env` next to `docker-compose` or in your process manager). Do **not** put secrets in this doc; keep them in `config/all-credentials.export.env` and source them when building the env.

| Variable | Purpose | Example / source |
|----------|---------|-------------------|
| `N8N_HOST` | Host n8n listens on | `0.0.0.0` |
| `N8N_PORT` | Port | `5678` |
| `N8N_PROTOCOL` | http or https | `https` (if behind reverse proxy) |
| `N8N_URL` | Public URL of your n8n (for webhooks/callbacks) | **`https://n8n.hansvanleeuwen.com`** (or **`https://n8n.srv1402218.hstgr.cloud`** — same instance) |
| `N8N_ENCRYPTION_KEY` | Encrypts credentials at rest; set once and never change | Long random string (e.g. `openssl rand -hex 32`); store in `config/all-credentials.export.env` as `N8N_ENCRYPTION_KEY` |
| `WEBHOOK_URL` | Override webhook base URL if different from `N8N_URL` | Usually same as `N8N_URL` |
| `GENERIC_TIMEZONE` | Default timezone for schedules | `Europe/Amsterdam` |
| `N8N_LOG_LEVEL` | Logging | `info` or `debug` |

**Example `.env` snippet for n8n (values from your export file):**

```bash
# Paste from config/all-credentials.export.env
N8N_URL=https://n8n.hansvanleeuwen.com
N8N_ENCRYPTION_KEY=<from all-credentials.export.env>
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=https
GENERIC_TIMEZONE=Europe/Amsterdam
```

**Example docker-compose (empire stack already uses N8N_URL; add encryption key from env):**

```yaml
# In your n8n service (if you run n8n in Docker)
environment:
  - N8N_URL=https://n8n.hansvanleeuwen.com
  - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
  - N8N_HOST=0.0.0.0
  - N8N_PORT=5678
```

---

## 4. Quick checklist

- [ ] `config/all-credentials.export.env` exists and contains: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `MONDAY_API_TOKEN`, `N8N_ENCRYPTION_KEY` (and optionally Firecrawl, Google OAuth vars).
- [ ] In n8n: **Prod - Supabase Service Role** created and tested with a Supabase node.
- [ ] **Prod - Anthropic Claude** created and selected in AutoSEO Brain v2 Claude node (or credential named `AnthropicApi`).
- [ ] **Prod - OpenAI** created and selected in SEO Audit / Intent Analysis AI nodes.
- [ ] **Prod - Google Sheets** and **Prod - Gmail** created via OAuth2 and selected in the relevant workflows.
- [ ] **Prod - Monday.com** created if any n8n workflow calls Monday API.
- [ ] n8n server `.env` or Docker env has `N8N_URL`, `N8N_ENCRYPTION_KEY`, and (optional) `GENERIC_TIMEZONE`.
- [ ] Each credential tested with “Test” or a single-node run before using in production.

---

## 5. Best practices

- **Naming:** Use a consistent prefix (e.g. `Prod - …`) so credentials are easy to find and never confused with local/dev.
- **One source of truth:** Keep all secrets in `config/all-credentials.export.env`; never commit it. This doc and n8n only reference or use those values.
- **Test after create:** For each credential, run at least one node that uses it (e.g. Supabase “Execute Query”, Anthropic “Chat”, Gmail “Send”) to confirm access.
- **Env var references:** Where n8n supports expression/env (e.g. `{{ $env.VAR }}`), you can point nodes at env vars instead of duplicating secrets — use that only if your n8n deployment injects env from `all-credentials.export.env`.
- **Rotation:** When you rotate a key (Supabase, Anthropic, OpenAI, Monday), update `config/all-credentials.export.env` and then update the corresponding credential in n8n (Credentials → Edit → paste new value → Save).

---

*Generated from the AI-Centered Journey Map (system map) and codebase scan. Single source of truth: `config/all-credentials.export.env`.*
