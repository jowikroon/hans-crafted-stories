# Hosting context (Cloudflare Pages)

This project is hosted on **Cloudflare Pages**.

---

## Project context (for Cloudflare Pages or AI tools)

**Project:** hans-crafted-stories — Personal portfolio and admin dashboard for Hans van Leeuwen (hansvanleeuwen.com). React 18 + Vite 5 + TypeScript, Tailwind CSS, shadcn/ui, Supabase. Not a Next.js or Nuxt app.

**Live site:** https://hansvanleeuwen.com (custom domain on Cloudflare Pages).

**Build:** Build command: `npm run build --workspace=@hans/personal`. Output directory: `apps/personal/dist`. Node 20.

Do not replace the Cloudflare Pages build command with `cd apps/personal && npx vite build` or another plain Vite build. The production build must run the full `@hans/personal` build pipeline:

1. `scripts/check-og-image.cjs`
2. Vite client build
3. `scripts/inject-static-content.cjs`
4. `scripts/build-ssr.cjs`
5. `scripts/prerender.mjs`

The SSR/prerender steps generate static HTML for `/writing/<slug>/` blog routes with per-post canonical tags, Open Graph URLs, BlogPosting JSON-LD, crawler fallback content, and safe `__PRELOADED__` payloads. A plain Vite build skips those steps and can regress blog SEO back to homepage canonical metadata.

**SPA routing:** Cloudflare Pages handles SPA routing automatically for single-page apps. The `_redirects` or `_headers` files in `dist/` can be used if custom redirect rules are needed.

**Environment:** Supabase and Cloudflare keys are stored in `.env` locally and in Cloudflare Pages environment variables; never commit secrets. Prefer existing env var names (e.g. `VITE_SUPABASE_*`) when suggesting new variables.

**Custom domain & SSL:** hansvanleeuwen.com and www are pointed at Cloudflare Pages via Cloudflare DNS (apex A record + www CNAME, both proxied). SSL is handled automatically by Cloudflare. DNS is managed in Cloudflare.

**Deploys:** Branch to deploy: `main`. Cloudflare Pages auto-deploys on every push to `main`. Preview deployments are created for other branches/PRs. If production SEO output looks stale, first verify the Cloudflare Pages project build command still matches `npm run build --workspace=@hans/personal`.

**Git:** Both Cursor and Lovable push to `jowikroon/hans-crafted-stories` on GitHub. Cloudflare Pages is connected to this repo.
