# Content redeploy watch: operation and incident 2026-10-20

The watch checks the published CMS timestamp and exact published row count. It is not a website availability test, deployment success test, or content checksum. Unpublishing an older row is detected by its count change; edits that do not advance the maximum `updated_at` and leave the count unchanged remain outside the existing stamp design.

## Proven incident cause

- Original run: https://github.com/jowikroon/hans-crafted-stories/actions/runs/39380006305 (job 118486719424). The Supabase request returned HTTP 402, preventing comparison.
- Project `pesfakewujjwkyybwaom`, named `Claude n8n`, belongs to organization `jtmrwxzqvuxofcvuhdum`, named `jowikroon's Org`, on the Free plan. Verified with the Supabase management connector.
- A new, read-only REST request returned HTTP 402 with violation codes `exceed_egress_quota` and `exceed_storage_size_quota`. This establishes the connection to the organization's service restrictions, rather than inferring it from the status code alone.
- Supabase's restriction email dated 2026-10-19 22:46:58 UTC reports storage 3.48 GB / 1.1 GB and egress 9 GB / 5.5 GB, and says the quota refills during October 20. These are notification-time billing figures, not current measurements or a guarantee of immediate service restoration.
- A read-only SQL query still returns 13 published posts, maximum `updated_at` `2026-10-14 21:33:34.233146+00`. This matches the existing repository stamp. SQL accessibility does not prove that REST is available; it is never used as a successful fallback by the watch.
- Current storage object metadata in this project reports: `music-artwork` 3,641 objects / 4.281 decimal GB; `bucket` 464 / 0.304 GB; `documents` 32 / 0.056 GB; `apps` 190 / 0.026 GB. This metadata inventory has different timing/accounting from the billing email and is not an authoritative quota meter. No objects were removed.

## Configuration and failure behavior

No live homepage or JavaScript bundle is fetched. The watch reads the two existing, public frontend settings in `apps/personal/.env.production` as literal text. This file already contains the anon key used by the frontend. It is not executed. No new credentials, elevated database roles, RLS changes or API access are introduced.

Optional Actions configuration: set **both** `vars.CONTENT_SUPABASE_URL` and `secrets.CONTENT_SUPABASE_PUBLISHABLE_KEY` (or the same-named public repository variable). A partial override is an error. The URL is pinned to the expected project. A legacy JWT must declare an unexpired, matching `anon` role/project; service-role keys are rejected. A publishable key is sent as `apikey`, never as a bearer JWT. Credentials are not forwarded through redirects or printed in errors.

One REST request retrieves the latest published timestamp and `Prefer: count=exact`, reducing the old two-query comparison to one response. A valid nonempty row, timezone-aware timestamp and exact positive count are required. Invalid JSON, empty rows, absent timestamps/counts, invalid repository baselines, HTTP failures and timeouts all exit nonzero without emitting `verified`, `changed` or a stamp. An empty published dataset requires manual review; it cannot silently replace a live site with an empty build.

HTTP 402 reports safe violation codes without retries. HTTP 401/403 points to configuration/grants/RLS. Transient failures receive at most three attempts, each with a 15-second timeout and bounded backoff. Responses are capped at 16 KiB. No network, content or credentials are changed by the check script.

## Running and activating

```bash
python3 -m unittest discover -s scripts -p test_content_redeploy_watch.py -v
python3 scripts/content_redeploy_watch.py --check-only
```

The workflow runs the tests before its live check. Pull-request runs and manual `check_only=true` runs never commit a stamp. Manual runs default to check-only. Scheduled main runs retain the original redeploy behavior, but only after a verified change. A concurrent main change causes a failure instead of an overwrite/rebase. Only the stamp file is staged.

Do not activate this repair on main while REST remains restricted: a main change may trigger the connected Vercel production build, whose content dependency is currently unavailable. Keep the repair on its review branch until service restoration is verified. Do not advance the repository stamp during the incident.

## Remaining recovery dependency (no automatic subscription)

1. Inspect organization Usage/Billing after the stated reset. Read-only access is sufficient. The browser is currently signed out; the connected management tools establish project ownership but do not expose the billing dashboard or a restriction-lift action.
2. Resolve **both** violations. Waiting for the egress period to reset does not reduce retained storage. Identify referenced/required assets and plan backups and a reversible migration or compression before removing anything. The large `music-artwork` inventory is a candidate for investigation, not deletion authorization. Rewriting or deleting its storage metadata with SQL is not a valid cleanup method.
3. Retest the actual REST check. If 402 persists after the quota reset and remediation, inspect the Usage dashboard and contact Supabase support. No upgrade, spend-cap removal, payment, project transfer or storage deletion is performed by this repair.
4. Once REST passes, merge the tested repair and run the workflow on main with `check_only=true`. Verify the live job and unchanged stamp. Re-enable normal publication only with valid data; use an explicit non-check-only manual run if a reviewed content change needs deployment.

Official references:
- https://supabase.com/docs/guides/troubleshooting/http-status-codes
- https://supabase.com/docs/guides/platform/billing-faq#fair-use-policy
- https://supabase.com/dashboard/org/jtmrwxzqvuxofcvuhdum/usage
