# OpenClaw schedules migration

Goal: OpenClaw owns schedules and cron. n8n, Cloudflare Workers, and Cowork may still execute workflow logic, but they should not remain the timing source after cutover.

Target session:

`https://openclaw-cvpd.srv1411336.hstgr.cloud/chat?session=agent%3Aconnectcarparts%3Amain`

## Source inventory

| Job | Current scheduler | New owner | Cadence |
| --- | --- | --- | --- |
| `hvl-edge-health-warm` | Cloudflare Worker `workers/scheduled` | OpenClaw cron | hourly |
| `ebay-de-launch-order-watch` | Cowork scheduled-tasks registry | OpenClaw cron | launch week, every 2h 08:00-20:00 |
| `ebay-de-golive-audit` | Cowork scheduled audit | OpenClaw cron | daily 07:25 |
| `autoseo-weekly` | n8n schedule trigger | OpenClaw cron | Monday 06:00 |

The canonical desired jobs live in [`ops/openclaw/cron-jobs.json`](../ops/openclaw/cron-jobs.json).

## Live inventory, 2026-07-15

Read-only check against `srv1411336.hstgr.cloud` / `187.124.2.66`.

### OpenClaw Gateway cron

OpenClaw cron is enabled and stores jobs in SQLite:

- Store path: `/data/.openclaw/cron/jobs.json`
- SQLite path: `/data/.openclaw/state/openclaw.sqlite`
- Job count reported by scheduler: `9`

Visible jobs:

| ID | Name | Cadence | Agent | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| `1a97d246-796a-4ea9-b494-8e6621d775a2` | `ccp-health-check` | every 15m | `connectcarparts` | error | Times out after 120s in `model-call-started`; 6 consecutive errors. Runs `/data/workspaces/connectcarparts/scripts/health_check.py` through an agent turn. |
| `41cd0752-94a5-4507-9b56-458969e04d5d` | `ccp-order-watch` | every 15m | `connectcarparts` | error | Times out after 180s in `model-call-started`; 6 consecutive errors. Runs `/data/workspaces/connectcarparts/scripts/order_watch.py` through an agent turn. |
| `d7a31a10-e99f-451e-a944-4f3657ebbd82` | `hansos-dashboard-check` | `10 7 * * *` Europe/Amsterdam | command job | idle | Runs `node /data/.openclaw/workspace/scripts/hansos_dashboard_check.mjs`. |
| `3ef3e8df-f1d6-47f9-9d36-b814c5638723` | `DNA Reflection Log` | every 2d | `samantha` | ok | Existing non-CCP job. |
| `88e39c70-7a3d-4868-a6da-ffdc2ce0b97e` | `Samantha2 nachtelijke...` | `30 23 * * *` Europe/Amsterdam | `samantha2` | ok | Existing non-CCP job. |
| `d190f888-1825-4995-a4d0-ce7b95db84bf` | `ccp-night-dream` | `0 1 * * *` Europe/Amsterdam, staggered | `connectcarparts` | error | Last error: interrupted by gateway restart. |
| `cb5b1226-2a4a-45ff-842e-478dc104cb91` | `Billy Joel NL Monitor` | `0 10 * * 1,4` Europe/Amsterdam | `main` | ok | Existing non-CCP job. |

OpenClaw CLI currently warns that `whatsapp` and `codex` plugins are blocked by suspicious ownership under `/data/.openclaw/extensions/whatsapp` and `/data/.openclaw/npm/projects/openclaw-codex-8902d781d4/...`. Do not treat this as the cron scheduler failure by itself; the two CCP watcher jobs are timing out in model-call phase.

Attempted fix, 2026-07-15:

- Manual command runs succeeded quickly:
  - `/data/workspaces/connectcarparts/scripts/health_check.py` returned `Health: OK`.
  - `/data/workspaces/connectcarparts/scripts/order_watch.py` returned `Order-watch: OK`.
- Intended fix: convert `ccp-health-check` and `ccp-order-watch` from `agentTurn` jobs to deterministic `command` jobs:
  - Health command: `/data/workspaces/connectcarparts/scripts/health_check.py`
  - Order command: `/data/workspaces/connectcarparts/scripts/order_watch.py`
- Live edit is blocked by OpenClaw auth: the available gateway token does not have `operator.admin` scope. `openclaw cron edit ...` returns `GatewayClientRequestError: missing scope: operator.admin`.
- Next action: perform the edits from an OpenClaw operator/admin session or issue a scoped admin token, then run:

```sh
openclaw cron edit 1a97d246-796a-4ea9-b494-8e6621d775a2 \
  --command /data/workspaces/connectcarparts/scripts/health_check.py \
  --command-cwd /data/workspaces/connectcarparts \
  --timeout-seconds 60 \
  --output-max-bytes 4000 \
  --no-deliver \
  --description AutoCCP-health-command

openclaw cron edit 41cd0752-94a5-4507-9b56-458969e04d5d \
  --command /data/workspaces/connectcarparts/scripts/order_watch.py \
  --command-cwd /data/workspaces/connectcarparts \
  --timeout-seconds 90 \
  --output-max-bytes 4000 \
  --no-deliver \
  --description AutoCCP-order-command

openclaw cron run 1a97d246-796a-4ea9-b494-8e6621d775a2
openclaw cron run 41cd0752-94a5-4507-9b56-458969e04d5d
openclaw cron runs --id 1a97d246-796a-4ea9-b494-8e6621d775a2 --limit 3
openclaw cron runs --id 41cd0752-94a5-4507-9b56-458969e04d5d --limit 3
```

Security note: during the 2026-07-15 investigation, sensitive environment values were exposed in local tool output. Treat the OpenClaw gateway token and configured LLM provider keys as needing rotation before broadening automation access.

### Host cron on VPS2

Root crontab is empty. `/etc/cron.d` has platform/maintenance entries plus OpenClaw watchdogs:

```cron
*/5 * * * * root flock -n /run/openclaw-n8n-watchdog.lock /docker/openclaw-cvpd/scripts/n8n-watchdog.sh >> /var/log/openclaw-watchdogs.log 2>&1
*/2 * * * * root flock -n /run/openclaw-vault-watcher.lock /docker/openclaw-cvpd/scripts/vault-reload-watcher.sh >> /var/log/openclaw-watchdogs.log 2>&1
43 0 * * * root docker image prune -af --filter "until=24h" > /dev/null 2>&1
```

These are infrastructure watchdog/maintenance schedules, not business workflow schedules. Leave them alone unless replacing the OpenClaw platform management model.

### n8n on VPS2

`openclaw-n8n` is running with image `n8nio/n8n:2.29.9` and mount:

`/docker/openclaw-cvpd/data/.openclaw/n8n-data/.n8n:/home/node/.n8n`

`n8n export:workflow --all` reported no workflows. Treat this container as a local OpenClaw companion n8n, not the known primary historical n8n scheduler.

### n8n on VPS1

Read-only SSH to `srv1402218.hstgr.cloud` is blocked by a changed SSH host key:

`SHA256:AjFcYvvnU+joxdQxzp65VYZGMJyRIGC3hQQvnOmzPqg`

DNS still resolves to the expected documented VPS1 addresses:

- A: `187.124.1.75`
- AAAA: `2a02:4780:79:115d::1`

Port 22 is reachable, but `ssh-keyscan` did not return an ed25519 key from this local network path. Do not bypass strict host checking until the fingerprint is verified through Hostinger/hPanel. This means the old primary n8n Cloud/VPS schedules still need verification before final cutover.

## Cutover rules

1. Create OpenClaw jobs first.
2. Run each job manually once with delivery visible in the `connectcarparts` session.
3. Confirm run history with `openclaw cron runs --id <job-id>`.
4. Only then disable the old scheduler.
5. Never leave two timing sources active for the same job longer than the verification window.

## Commands

Run these on the OpenClaw VPS/container where the gateway CLI has operator admin access:

Before creating new jobs, inspect existing OpenClaw jobs:

```sh
openclaw cron status
openclaw cron list
openclaw cron get 1a97d246-796a-4ea9-b494-8e6621d775a2
openclaw cron get 41cd0752-94a5-4507-9b56-458969e04d5d
openclaw cron get d190f888-1825-4995-a4d0-ce7b95db84bf
```

Do not add duplicate CCP health/order jobs. Reuse or edit the existing OpenClaw jobs after their timeout behavior is fixed.

```sh
openclaw cron create \
  --name "HVL edge health and cache warm" \
  --cron "0 * * * *" \
  --tz "Europe/Amsterdam" \
  --session "agent:connectcarparts:main" \
  --message "Run the hourly hansvanleeuwen.com edge health and cache warm check. Warm https://hansvanleeuwen.com and https://marketplacegrowth.nl for /, /writing, /work and /about, then POST a compact health result to the configured empire-health endpoint. Report only failures or material degradation." \
  --announce

openclaw cron create \
  --name "eBay DE launch order watch" \
  --cron "0 8-20/2 14-18 7 *" \
  --tz "Europe/Amsterdam" \
  --session "agent:connectcarparts:main" \
  --message "Run the eBay DE launch-week order watch for ConnectCarParts. Check Channable/eBay/Magento order state, especially not_shipped, tracking, tax, and order import errors. Send a WhatsApp alert only for real customer-order failures or launch-blocking anomalies; otherwise write a concise run summary." \
  --announce

openclaw cron create \
  --name "eBay DE go-live checklist audit" \
  --cron "25 7 * * *" \
  --tz "Europe/Amsterdam" \
  --session "agent:connectcarparts:main" \
  --message "Run the ConnectCarParts eBay DE go-live checklist audit. Verify the live checklist status, Channable order/config indicators, known open items, and evidence freshness. Update the dashboard artifact only when facts changed, and summarize critical blockers." \
  --announce

openclaw cron create \
  --name "AutoSEO weekly run" \
  --cron "0 6 * * 1" \
  --tz "Europe/Amsterdam" \
  --session "agent:connectcarparts:main" \
  --message "Run the weekly AutoSEO workflow through the existing webhook/orchestrator path. Keep n8n as execution engine only where credentials/workflow nodes still live; OpenClaw is now the scheduler and reporting owner. Summarize what ran, changed, or failed." \
  --announce
```

Then verify:

```sh
openclaw cron list
openclaw cron run <job-id>
openclaw cron runs --id <job-id>
```

## Disable old timing sources

After each OpenClaw job has one successful manual run and appears in `openclaw cron list`:

- Cloudflare: remove or disable the scheduled trigger for `hvl-edge-cron`.
- Cowork: disable `ebay-de-launch-order-watch` and the daily go-live audit in the scheduled-tasks registry.
- n8n: disable only the Schedule Trigger node for AutoSEO; keep webhook/manual execution intact.

## Notes

OpenClaw cron runs inside the Gateway process and persists jobs in OpenClaw state. The Gateway must stay online for schedules to fire.
