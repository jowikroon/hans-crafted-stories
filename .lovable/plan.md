
# Add /docs Page with SEO Meta Tags and Sitemap Entry

## Overview

The `/docs` page referenced in the user's summary doesn't exist yet in the codebase. This plan creates it from scratch: page component, route, SEO, sitemap, Cloudflare OG tags, and footer link.

## Changes

### 1. Add SEO translation strings

**File: `src/data/translations.ts`**

Add `docsTitle` and `docsDescription` to the `seo` type and both EN/NL translation objects:
- EN: "Documentation Index | Hans van Leeuwen" / "Browse project documentation — hosting, architecture, integrations, and more."
- NL: "Documentatie-index | Hans van Leeuwen" / "Bekijk projectdocumentatie — hosting, architectuur, integraties en meer."

Also add `docs` to the `footer` translation type for the footer link label.

### 2. Create the Docs page

**File: `src/pages/DocsDatabase.tsx`** (new)

A simple page listing the project's documentation files by category, each linking to the file on GitHub (`jowikroon/hans-crafted-stories`). Categories:
- **Project**: README.md
- **Hosting and Deploy**: hosting-context.md, lovable-cloudflare-pages.md, domain-nameservers-hansvanleeuwen.md, cloudflare-connection-troubleshooting.md
- **Architecture and Flows**: empire-n8n-flow.md, post-commit-workers-and-agents.md
- **Integrations**: monday-mcp-setup.md

Includes `useSEO` with translated title/description and a `CollectionPage` JSON-LD schema with breadcrumb.

### 3. Add route

**File: `src/components/AnimatedRoutes.tsx`**

Add: `<Route path="/docs" element={<PageTransition><DocsDatabase /></PageTransition>} />`

### 4. Add footer link

**File: `src/components/Footer.tsx`**

Add a "Docs" link next to the "Privacy" link, using the new `t.docs` translation.

### 5. Update sitemap

**File: `public/sitemap.xml`**

Add `/docs` entry with `changefreq: monthly`, `priority: 0.5`.

### 6. Update Cloudflare Pages Function

**File: `functions/[[path]].ts`**

The `/docs` route is already in `ROUTE_META` -- no changes needed here.

## Files Changed

| File | Action |
|---|---|
| `src/data/translations.ts` | Add docsTitle, docsDescription to seo type + both languages; add docs to footer |
| `src/pages/DocsDatabase.tsx` | New -- docs listing page with useSEO and JSON-LD |
| `src/components/AnimatedRoutes.tsx` | Add /docs route |
| `src/components/Footer.tsx` | Add Docs link |
| `public/sitemap.xml` | Add /docs URL |
