# Cloudflare — staged automations

Status of the smart-automations set. **A is live.** B/C/D are committed as
non-breaking code; each needs one step I can't do without Pages-binding access
or a Cloudflare API token. Resources already provisioned are listed with IDs.

## Provisioned (done)
- KV namespace **`hvl-edge-config`** — id `1735f72eb6f84347ae5efd441db18906`
- R2 bucket **`hvl-blog-media`** (location ENAM)

## A — Edge security headers — LIVE
`apps/personal/public/_headers`: HSTS, Permissions-Policy, COOP, and a
**report-only** CSP. Flip `Content-Security-Policy-Report-Only` to
`Content-Security-Policy` once violation reports are clean to enforce it.

## B — KV-driven redirects + meta — code live, binding pending
`apps/personal/functions/_middleware.js` reads `env.EDGE_CONFIG` and overlays the
inline defaults. Until bound it uses the inline map (identical behaviour).
1. Pages project → Settings → Functions → **KV namespace bindings**: add
   variable `EDGE_CONFIG` → namespace `hvl-edge-config`.
2. Seed keys (wrangler):
   `npx wrangler kv key put --namespace-id 1735f72eb6f84347ae5efd441db18906 redirects '{"/old":"/new"}'`
   `npx wrangler kv key put --namespace-id 1735f72eb6f84347ae5efd441db18906 meta '{"/x":{"t":"..","d":".."}}'`

## C — Hourly cron worker (cache-warm + health ping) — code ready, deploy pending
`workers/scheduled/` (isolated; does NOT duplicate cowork-dispatch SEO/radar).
Deploy: `cd workers/scheduled && CLOUDFLARE_API_TOKEN=… npx wrangler deploy`
(add `@cloudflare/workers-types` for local typecheck; wrangler bundles TS).

## D — R2 media serving — code live, binding pending
`apps/personal/functions/media/[[path]].js` serves `/media/*` from R2; 404s until
bound (touches no existing route).
1. Pages project → Settings → Functions → **R2 bucket bindings**: add variable
   `BLOG_MEDIA` → bucket `hvl-blog-media`.
2. Upload objects: `npx wrangler r2 object put hvl-blog-media/hero/x.jpg --file x.jpg`.

## Cleanup (kills the red "Workers Builds" check)
Delete the stray Workers (Pages-based site, no Worker needed):
- `hans-crafted-stories` (Hello-world stub — source of the failing build)
- `hello-world-purple-dew-00fa` (2023 demo)
- `llm-chat-app-template` (unused template)
Keep `n8n-relay-proxy`.
