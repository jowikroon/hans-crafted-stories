

# Fix Build Errors + Switch from Netlify to Cloudflare Pages

## Overview

Three things to fix: (1) TypeScript build errors blocking deployment, (2) missing database tables/columns, and (3) replace Netlify deployment config with Cloudflare Pages.

## 1. Create Missing Database Table: `unhandled_intents`

Both `PortalStatusTab.tsx` and `HansAI.tsx` reference an `unhandled_intents` table that doesn't exist in the database yet. Create it via migration:

```text
CREATE TABLE public.unhandled_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_input TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'hansai',
  fast_route_score NUMERIC,
  llm_intent TEXT,
  llm_confidence NUMERIC,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_workflow TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.unhandled_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to unhandled_intents"
  ON public.unhandled_intents FOR ALL USING (true) WITH CHECK (true);
```

## 2. Add Missing Column: `empire_events.monday_item_id`

`PortalStatusTab.tsx` selects `monday_item_id` from `empire_events`, but the column doesn't exist.

```text
ALTER TABLE public.empire_events
  ADD COLUMN monday_item_id TEXT;
```

## 3. Fix Edge Function TypeScript Error

In `supabase/functions/n8n-agent/index.ts`, line 47 uses `error.message` but `error` is typed as `unknown`. Fix:

```typescript
// Change:
return new Response(JSON.stringify({ error: error.message }), {
// To:
return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
```

## 4. Replace Netlify with Cloudflare Pages

**Delete:**
- `netlify.toml` (no longer needed)

**Create** `public/_redirects` for Cloudflare Pages SPA support:
```text
/*  /index.html  200
```

**Update** `docs/domain-nameservers-hansvanleeuwen.md` to reflect Cloudflare Pages instead of Netlify.

**Update** `.env.example` to remove Netlify references and add Cloudflare Pages note.

**Clean up** `docs/lovable-netlify-troubleshooting.md` — either delete or replace with Cloudflare Pages deployment notes.

## 5. Summary of File Changes

| File | Action |
|---|---|
| Database migration | Create `unhandled_intents` table + add `monday_item_id` to `empire_events` |
| `supabase/functions/n8n-agent/index.ts` | Fix `error` type narrowing |
| `netlify.toml` | Delete |
| `public/_redirects` | Create (SPA redirect for Cloudflare Pages) |
| `.env.example` | Remove Netlify env vars |
| `docs/lovable-netlify-troubleshooting.md` | Delete or replace with Cloudflare Pages docs |
| `docs/domain-nameservers-hansvanleeuwen.md` | Update to reflect Cloudflare Pages deployment |

After these changes, the project will build cleanly and be ready for Cloudflare Pages deployment (connect the GitHub repo in Cloudflare dashboard with build command `npm run build` and output directory `dist`).

