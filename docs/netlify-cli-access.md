# Netlify CLI access (env vars, deploys)

This project can manage your Netlify site from the terminal (and from Cursor) using a **Personal Access Token**. Once set up, we can set environment variables and trigger deploys without using the Netlify UI.

## One-time setup

### 1. Create a Personal Access Token

1. Go to **https://app.netlify.com**
2. Open **Applications** (in the left sidebar or user menu) → **Personal access tokens**
3. Click **New access token**
4. Name it (e.g. `hans-crafted-stories CLI`)
5. Choose an expiration (e.g. 1 year; you can revoke it anytime)
6. Click **Generate token**
7. **Copy the token** (starts with `nfp_` or similar) — you won’t see it again.

### 2. Store the token in `.env`

In your project root, add this line to `.env` (create the file from `.env.example` if needed):

```bash
NETLIFY_AUTH_TOKEN=nfp_your_token_here
```

Do **not** commit `.env`; it is already in `.gitignore`.

### 3. Install dependencies and link the site

```bash
npm install
npm run netlify -- link
```

- When prompted, choose **Create & configure a new site** or **Link to an existing site**.
- Pick your team and the site (e.g. `hansvanleeuwencom`).
- This writes a `.netlify` folder (add it to `.gitignore` if you don’t want to commit the link).

## What you can do after setup

All commands use your token from `.env` via the `netlify` script:

- **List env vars:** `npm run netlify -- env:list`
- **Set one var:** `npm run netlify -- env:set VITE_SUPABASE_URL "https://...."`
- **Trigger production deploy:** `npm run netlify -- deploy --prod --dir=dist`
- **Open site dashboard:** `npm run netlify -- open`

You can run these yourself or ask the assistant to run them (e.g. to fix the blank site by setting Supabase env vars and redeploying).
