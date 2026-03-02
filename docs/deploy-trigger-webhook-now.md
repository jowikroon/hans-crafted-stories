# Deploy trigger-webhook (fix HTTP 500)

The fix is committed locally. Deploy it to the live backend in two steps.

## 1. Push to GitHub

```powershell
cd "c:\Users\Malle Flappie\hans-crafted-stories"
git push origin main
```

(If you use another remote or branch, push that.)

## 2. Deploy the edge function to Supabase

Your live backend is project **oejeojzaakfhculcoqdh**. Deploy the updated function:

```powershell
cd "c:\Users\Malle Flappie\hans-crafted-stories"
npx supabase login
npx supabase link --project-ref oejeojzaakfhculcoqdh
npx supabase functions deploy trigger-webhook
```

- **First time:** `npx supabase login` opens the browser; sign in with the Supabase account that can access project `oejeojzaakfhculcoqdh` (e.g. the Lovable-linked org).
- **If link asks for DB password:** use the database password for that project (Supabase Dashboard → Project Settings → Database).

After deploy, test: **hansvanleeuwen.com/hansai** → `/run health-check`. You should get a success line instead of HTTP 500.

## If you can’t use Supabase CLI

- **Lovable:** In the Lovable editor, sync from GitHub and trigger a backend/edge-function deploy so the updated `trigger-webhook` is deployed from the repo.
- **Other:** Use Supabase Dashboard → Edge Functions → trigger-webhook and deploy from the repo or paste the updated code if the UI allows it.
