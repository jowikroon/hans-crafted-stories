
## What I found (root cause)

I traced the white-screen issue in the preview runtime and found a hard crash before React mounts:

- Browser console shows: **`Error: supabaseUrl is required.`** (thrown from `src/integrations/supabase/client.ts`)
- Network response for that module shows `import.meta.env` only contains base Vite keys (`BASE_URL`, `DEV`, etc.) and is missing the backend frontend keys (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).

That means the app crashes during module initialization, so the page stays fully white.

## Implementation plan

1. **Restore required frontend backend env vars for both dev + production builds**
   - Add committed Vite env files (non-secret public client values):
     - `.env.development`
     - `.env.production`
   - Include required keys:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`
     - `VITE_SUPABASE_PROJECT_ID`
   - This ensures both:
     - Lovable preview runtime loads correctly
     - Cloudflare Pages production build gets the same variables

2. **Prevent future hard white screens with a bootstrap guard**
   - Update `src/main.tsx` to:
     - Validate required env vars **before** loading `App`
     - Dynamically import `App` only when config is present
     - Render a clear fallback message if config is missing (instead of blank page)
   - This prevents module-level crashes from taking down the whole UI silently.

3. **Add deployment guardrail documentation**
   - Update `docs/lovable-cloudflare-pages.md` with a short section listing required frontend env vars for Cloudflare Pages builds.
   - This prevents regressions if deployment settings are changed later.

## Files to change

- `src/main.tsx` (bootstrap safety check + dynamic app import)
- `.env.development` (new)
- `.env.production` (new)
- `docs/lovable-cloudflare-pages.md` (add env checklist)

## Validation checklist after implementation

1. Open preview `/` → page should render (no white screen).
2. Check console → no `supabaseUrl is required` error.
3. Verify `src/integrations/supabase/client.ts` network response now includes populated `VITE_*` values in `import.meta.env`.
4. Open production domain and do a hard refresh:
   - `https://hansvanleeuwen.com/`
   - `https://hansvanleeuwen.com/about`
5. Confirm social crawler metadata behavior remains intact for `/about`, `/work`, `/writing`, `/privacy`.

## Notes

- No database schema/auth policy changes are needed.
- This is a frontend runtime/config hardening fix to stop crash-on-load behavior and restore reliable rendering.
