# Redeploy all (frontend + edge functions)

## 1. Frontend (Cloudflare Pages)

Cloudflare Pages auto-deploys from **GitHub** on every push to `main`.

- **Option A — Push to trigger deploy**  
  Resolve any merge with `origin/main`, then:
  ```powershell
  git pull origin main   # merge or rebase as you prefer
  # resolve conflicts if any, then:
  git push origin main
  ```
  Cloudflare will build and deploy within a few minutes.

- **Option B — Retry in dashboard**  
  [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → your project → **Deployments** → **Retry deployment** on the latest.

**Local build (already run):**
```powershell
npm run build
# Output: dist/ (used by Cloudflare when building from GitHub)
```

---

## 2. Supabase Edge Functions

Deploy all edge functions (including `empire-health`, `trigger-webhook`) from repo root:

```powershell
npx supabase login
npx supabase link --project-ref oejeojzaakfhculcoqdh   # if not already linked
.\scripts\deploy-supabase-functions.ps1
```

If you hit "Access token not provided", run `npx supabase login` and complete the browser flow, then run the script again.

---

## Summary

| What              | How |
|-------------------|-----|
| Frontend (Pages)  | Push to `main` → auto-deploy, or retry in Cloudflare dashboard. |
| Edge functions   | `npx supabase login` then `.\scripts\deploy-supabase-functions.ps1`. |
