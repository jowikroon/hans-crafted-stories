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

## C — Edge worker (cache-warm + health ping) — LIVE via Workers Builds
`workers/scheduled/src/index.ts` (isolated; does NOT duplicate cowork-dispatch
SEO/radar). Config is the **repo-root `wrangler.toml`**, name
`hans-crafted-stories` — the Worker that Cloudflare Workers Builds already
targets through its Git integration on this repo. Every push to `main` ships
it (default deploy command `npx wrangler deploy`); PR branches only upload a
preview version (`npx wrangler versions upload`). No `CLOUDFLARE_API_TOKEN`
is needed anywhere.

**No Cloudflare cron trigger.** OpenClaw owns scheduling
(`ops/openclaw/cron-jobs.json`, job `hvl-edge-health-warm`, hourly) and calls
the Worker's HTTP endpoint (`workers_dev = true`); one GET runs the full
warm + health cycle at the edge and POSTs the result to empire-health.
Adding `[triggers] crons` back would double-run it.
(Add `@cloudflare/workers-types` for local typecheck; wrangler bundles TS.)

## D — R2 media serving — code live, binding pending
`apps/personal/functions/media/[[path]].js` serves `/media/*` from R2; 404s until
bound (touches no existing route).
1. Pages project → Settings → Functions → **R2 bucket bindings**: add variable
   `BLOG_MEDIA` → bucket `hvl-blog-media`.
2. Upload objects: `npx wrangler r2 object put hvl-blog-media/hero/x.jpg --file x.jpg`.

## Cleanup
The red "Workers Builds" check is fixed at the source: the Worker
`hans-crafted-stories` (created 2026-03-02 as a Hello-world stub when the repo
was connected, and failing on every commit because no config carried its name)
now hosts item C via the root `wrangler.toml`. Do **not** delete it — deleting
it would bring the failing check back and remove the edge endpoint OpenClaw calls.

Still safe to delete from the dashboard (nothing in this repo references them):
- `hello-world-purple-dew-00fa` (2023 demo)
- `llm-chat-app-template` (unused template)
Keep `n8n-relay-proxy`.
