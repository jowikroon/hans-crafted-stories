# Path A: Deploy backend via Lovable (try this first)

If the **Lovable-managed** Supabase edge function is out of date (e.g. `/run health-check` returns "Failed to fetch" or wrong response), you can’t deploy to that project from Cursor or the Supabase CLI. Try getting Lovable to deploy the backend from the repo first.

**Goal:** Get the correct `trigger-webhook` (and other edge functions) running on the Lovable Supabase so the live site works, without migrating to your own Supabase.

---

## Steps (in the Lovable editor)

1. **Open the project**  
   In [Lovable](https://lovable.dev), open the hans-crafted-stories project (the one linked to `jowikroon/hans-crafted-stories` on GitHub).

2. **Sync from GitHub**  
   Use the option to **sync or pull the latest from GitHub** so Lovable has the current code, including:
   - `supabase/functions/trigger-webhook/index.ts` (with `success` field and 30s timeout)
   - Any other edge function changes that are already on `main`.

3. **Trigger a backend deploy**  
   - Look for actions like **Deploy**, **Publish**, **Sync backend**, or **Deploy edge functions** and run one that deploys the backend/Supabase.
   - If there’s no obvious “deploy backend” button: make a **small, safe change** in a backend-related file in Lovable (e.g. add a comment in an edge function file) and **confirm/publish**, so Lovable’s pipeline may deploy Supabase.

4. **If you can’t find how to deploy the backend**  
   In Lovable’s chat, ask:  
   *“Please deploy the Supabase edge functions from the current repo, especially trigger-webhook, so the production backend matches the code.”*

---

## If it works

- The live backend will serve the updated `trigger-webhook`.
- With Cloudflare Pages env vars set (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) and a fresh deploy, **/run health-check** should succeed.

---

## If it doesn’t work

If Lovable only deploys the frontend or you have no way to deploy edge functions from the repo, use **Path B**: migrate to your own Supabase and deploy from this repo with the Supabase CLI. See [migrate-supabase-to-own-org.md](migrate-supabase-to-own-org.md) and the deploy script in `scripts/deploy-supabase-functions.ps1`.
