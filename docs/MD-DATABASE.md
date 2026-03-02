# Markdown documentation database

**Purpose:** Single index of all active, used, and latest Markdown files in this project. Use this for project scan and build details in **Lovable** and **Cursor**.

- **Last updated:** 2026-02-27  
- **Live index on site:** [hansvanleeuwen.com/docs](/docs)  
- **Repo:** `jowikroon/hans-crafted-stories`

---

## Active docs (used and latest)

| Path | Title / purpose | Category |
|------|-----------------|----------|
| `README.md` | Project overview, Lovable/GitHub edit flow, local dev | Project |
| `docs/hosting-context.md` | Cloudflare Pages context for AI tools and deploy (build command, output dir, env, SPA) | Hosting |
| `docs/lovable-cloudflare-pages.md` | Lovable + Cloudflare Pages flow, dual-edit (Cursor/Lovable), sync and deploy steps | Hosting |
| `docs/domain-nameservers-hansvanleeuwen.md` | DNS records, Cloudflare Pages project name, custom domains for hansvanleeuwen.com | Hosting |
| `docs/cloudflare-connection-troubleshooting.md` | Dashboard login, wrong account, API/CLI tokens, wrangler | Hosting |
| `docs/lovable-deploy-backend-first.md` | Path A: deploy Lovable Supabase edge functions via Lovable editor (try before migrating) | Hosting |
| `docs/migrate-supabase-to-own-org.md` | Path B: migrate from Lovable Supabase to your own org, schema, functions, secrets | Hosting |
| `docs/empire-n8n-flow.md` | Empire AI → N8N flow map: entry points, middleware, workflows, trigger paths, gaps | Architecture |
| `docs/one-input-intent-routing.md` | Single point of contact: how one input is translated to action (HansAI pipeline, fast router, LLM, clarification) | Architecture |
| `docs/post-commit-workers-and-agents.md` | CI/CodeQL/Cloudflare after commit; optional empire-health trigger via GitHub Actions | CI/CD |
| `docs/monday-mcp-setup.md` | Monday.com MCP for Cursor: install app, OAuth, example prompts | Integrations |
| `docs/cursor-git-noob-guide.md` | Cursor, Git, project folder, GitHub — noob-friendly explanation and workflow | Project |
| `docs/DIFFERENCES-LOCAL-VS-GITHUB.md` | Full diff: local vs jowikroon/hans-crafted-stories (main) — only local, only GitHub, modified, deps | Project |
| `public/empire/CLAUDE.md` | Empire/Claude context (referenced from Empire dashboard) | Empire |

---

## By category

### Project
- **README.md** — How to edit (Lovable, IDE, GitHub), clone, `npm i`, `npm run dev`.

### Hosting & deploy
- **docs/hosting-context.md** — One-page context: Cloudflare Pages, build (`npm run build`, `dist`, Node 20), SPA, env, custom domain, Git.
- **docs/lovable-cloudflare-pages.md** — Dual-edit workflow (Lovable + Cursor → GitHub → Cloudflare), Cloudflare checklist, project name.
- **docs/domain-nameservers-hansvanleeuwen.md** — DNS (A, CNAME), Pages project **hansvanleeuwen**, build settings table.
- **docs/cloudflare-connection-troubleshooting.md** — Login, account/team, API tokens, wrangler.
- **docs/lovable-deploy-backend-first.md** — Path A: deploy backend (edge functions) via Lovable when you can’t access Lovable’s Supabase.
- **docs/migrate-supabase-to-own-org.md** — Path B: full migration to your own Supabase org; use `scripts/deploy-supabase-functions.ps1` after linking.

### Architecture & flows
- **docs/empire-n8n-flow.md** — Full flow: HansAI/Empire/Portal → trigger-webhook / edge functions → N8N (autoseo, product-titles, health-check, etc.), data layer, infra.
- **docs/one-input-intent-routing.md** — One input → context translated to action: where it lives (HansAI), pipeline (slash → NL map → fast router → LLM → clarification / workflow / chat), and how to reuse it from Portal/Empire.

### CI/CD
- **docs/post-commit-workers-and-agents.md** — What runs on push (CI, CodeQL, Cloudflare Pages); optional post-commit empire-health.

### Integrations
- **docs/monday-mcp-setup.md** — Monday.com MCP setup and usage in Cursor.

### Empire
- **public/empire/CLAUDE.md** — In-app context for Empire/Claude.

---

## For AI tools (Lovable, Cursor)

When scanning or generating build/deploy steps:

1. Use **docs/hosting-context.md** for Cloudflare Pages build and env.
2. Use **docs/lovable-cloudflare-pages.md** for dual-edit and deploy verification.
3. Use **docs/empire-n8n-flow.md** for entry points, webhooks, and N8N workflow names.
4. Use **docs/one-input-intent-routing.md** for how a single input is routed to workflows or chat (intent layer, HansAI as single point of contact).
4. Use **docs/domain-nameservers-hansvanleeuwen.md** for DNS and Pages project name (**hansvanleeuwen**).

---

## Not in this index

- `.github/` issue/PR templates — process only.  
- `.lovable/plan.md` — internal Lovable state.  
- Cursor plan files under `.cursor/plans/` — planning only, not runtime docs.
