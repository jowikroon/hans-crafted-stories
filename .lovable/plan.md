

# SEO Quick Wins Implementation

Based on the audit, here are the fast, high-impact changes we can make within the current codebase.

---

## 1. Host OG/social image on the same domain

**Problem**: `og:image` and `twitter:image` point to `storage.googleapis.com`, reducing brand control.

**Fix**: Copy the social image to `public/og-image.png` (already exists) and update all references in `index.html` and `functions/[[path]].ts` to use `https://hansvanleeuwen.com/og-image.png`.

Files: `index.html` (lines 29, 41, 56, 75)

---

## 2. Fix `og:locale` from `en_US` to `en_GB`

**Problem**: `og:locale` is `en_US` but primary audience is Netherlands/EU.

**Fix**: Change `og:locale` from `en_US` to `en_GB` in `index.html` (line 33). This is the closest standard OG locale for international English targeting EU.

---

## 3. Shorten the page title

**Problem**: Title is 80+ chars, risks SERP truncation.

**Fix**: Change title across `index.html`, translations, and the `useSEO` default to:
`Freelance E-commerce Manager (Amazon & Bol.com) | Hans van Leeuwen`

Files: `index.html` (line 18, 27, 39, 62), `src/hooks/useSEO.ts` (DEFAULT_TITLE), `src/data/translations.ts` (seo.homeTitle)

---

## 4. Make FAQ answers visible by default (no accordion hide)

**Problem**: FAQ answers are hidden behind an accordion click, which Google may not index as FAQ rich results.

**Fix**: In `HomeFAQ.tsx`, render all answers expanded by default (remove the toggle-to-show behavior). Keep the accordion interaction for UX but default `openIndex` to show all, or simply always render `<dd>` content visibly. The simplest approach: remove the conditional `{isOpen && ...}` wrapper so answers are always in the DOM (use CSS `max-height` transition for the expand/collapse animation instead).

File: `src/components/HomeFAQ.tsx`

---

## 5. Fix BreadcrumbList schema (homepage should only have "Home")

**Problem**: The homepage BreadcrumbList includes all sections (Home, Work, Writing, About), which is incorrect -- breadcrumbs should reflect the current page's hierarchy position.

**Fix**: In `index.html`, reduce the BreadcrumbList to only one item (`Home`). Per-page breadcrumb schemas are already handled by the `useSEO` hook's `jsonLd` prop on inner pages.

File: `index.html` (lines 87-114)

---

## 6. Add keyword-rich contextual internal links in Hero body copy

**Problem**: Internal links only appear in nav/CTAs with generic anchors.

**Fix**: In the Hero description paragraph and expertise cards, add contextual links like:
- "Amazon marketplace case studies" linking to `/work`
- "e-commerce insights" linking to `/writing`

This means adding `<Link>` elements inside the Hero description or adding a new short paragraph with varied anchor text after the main description.

File: `src/components/Hero.tsx`

---

## 7. Add CRO/jargon definitions on first use

**Problem**: Terms like CRO and UX appear without explanation.

**Fix**: In the expertise card descriptions (via translations), expand first occurrences:
- "conversion rate optimization (CRO)" instead of just "CRO"
- "user experience (UX)" instead of just "UX"

File: `src/data/translations.ts` (expertise descriptions)

---

## Summary of files to change

| File | Changes |
|------|---------|
| `index.html` | OG image URLs, og:locale, title, BreadcrumbList |
| `src/hooks/useSEO.ts` | Shorter DEFAULT_TITLE |
| `src/data/translations.ts` | Shorter homeTitle, jargon definitions in expertise |
| `src/components/HomeFAQ.tsx` | Always-visible FAQ answers |
| `src/components/Hero.tsx` | Contextual internal links with keyword anchors |
| `functions/[[path]].ts` | No changes needed (inner pages only) |
| `scripts/inject-static-content.cjs` | Update title to match shortened version |

