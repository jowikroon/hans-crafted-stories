

# On-Page SEO Audit Implementation Plan

This plan addresses the key findings from the SEO audit of hansvanleeuwen.com, organized by priority.

---

## Phase 1: Critical / High-Impact Fixes

### 1. Reduce H1/H2 redundancy on homepage
The audit flags that H1 and H2 repeat nearly the same "Freelance E-commerce Manager / Amazon & Bol.com" phrasing. 
- **H1** stays keyword-led (current is fine)
- **H2** becomes benefit-led instead of repeating the H1, e.g. *"Grow Amazon NL & Bol.com revenue with a hands-on interim marketplace lead"*
- Update both EN and NL translations in `src/data/translations.ts`

### 2. Make FAQ answers always visible in the DOM
Currently `HomeFAQ.tsx` uses `max-h-0 opacity-0` to hide answers — crawlers may not index collapsed content. Change to use `<details>`/`<summary>` or render answers in the DOM (with `aria-hidden` + CSS collapse) so they are always crawlable regardless of JS state.

### 3. Add "Who I Help" and "Problems I Solve" sections to the homepage
Add two new content sections to `Hero.tsx` (between results and expertise):
- **"Who I Help"** — target audience (D2C brands, category leaders, brands entering NL marketplaces)
- **"Problems I Solve"** — specific pain points (high ACOS, low conversion, stockouts, listing suppression, Buy Box loss)

This addresses the "content depth for service intent" finding and introduces problem-based keywords naturally.

### 4. Enrich proof bullets into mini case studies
Expand the 3 result bullets in `Hero.tsx` to show challenge/action/result format, each linking to `/work`. This adds E-E-A-T signals and internal links with descriptive anchor text.

### 5. Improve CTA specificity and add alternative conversion path
- Change "Request a marketplace audit" to something more specific with microcopy, e.g. *"Get a 7-point marketplace audit (48h reply)"*
- Add a secondary CTA linking to the About page contact form: *"Book a 30-min growth call"*
- Update both EN and NL translations

---

## Phase 2: Keyword & Internal Linking Improvements

### 6. Improve internal anchor text
Replace generic link labels with keyword-rich anchors throughout:
- "Amazon & Bol.com cases" becomes "Amazon NL marketplace case studies"
- "E-commerce insights" becomes "Amazon & Bol.com optimization articles"
- Update `Hero.tsx` quick links section and `Footer.tsx`

### 7. Add keyword variants to copy
Introduce variant terms naturally into existing sections:
- "marketplace consultant," "interim e-commerce manager," "Amazon NL specialist," "Bol.com consultant"
- Primarily in the description paragraph and expertise card descriptions in `translations.ts`

### 8. Add location relevance block
Add a short line to the hero or ServiceDetails: *"Working with brands across Amsterdam, Utrecht, Rotterdam, and the wider EU"* to build local relevance signals.

---

## Phase 3: Structured Data & Technical

### 9. Add contactPoint.url to ProfessionalService schema
In `index.html` JSON-LD, add `"url": "https://hansvanleeuwen.com/about"` to the `contactPoint` object.

### 10. Add hreflang tags to the Cloudflare edge function
Extend `functions/[[path]].ts` to inject `<link rel="alternate" hreflang="...">` tags for all routes (currently only done client-side via `useSEO`). This ensures crawlers see hreflang in the initial HTML.

### 11. Update static inject script for richer fallback
Update `scripts/inject-static-content.cjs` to include the new "Who I Help" and "Problems I Solve" content so non-JS crawlers see the expanded content.

---

## Phase 4: Readability & UX Polish

### 12. Shorten hero sentences
Split the long intro paragraph into 2-3 shorter sentences in `translations.ts` for both EN and NL.

### 13. Wrap adjacent CTAs in a semantic list/group
In `Hero.tsx`, wrap the two CTA buttons in a `<div role="group">` with an `aria-label` for better accessibility semantics.

---

## Files to modify

| File | Changes |
|------|---------|
| `src/data/translations.ts` | H2 rewording, CTA text, keyword variants, shorter sentences |
| `src/components/Hero.tsx` | New sections (Who I Help, Problems I Solve), enriched proof bullets, CTA group semantics |
| `src/components/HomeFAQ.tsx` | Always-visible FAQ answers for crawlability |
| `src/components/Footer.tsx` | Keyword-rich anchor text |
| `index.html` | contactPoint.url in JSON-LD |
| `functions/[[path]].ts` | Inject hreflang tags server-side |
| `scripts/inject-static-content.cjs` | Add new sections to static fallback |

---

## Out of scope (noted for future)
- Dedicated service landing pages (`/amazon-marketplace-management`, `/bol-com-optimization`) — significant effort, separate project
- Testimonial/review schema — requires collecting verified reviews first
- Calendar booking integration — requires third-party service setup

