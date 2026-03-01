

# On-Page SEO Audit Fix Plan for /about (and site-wide improvements)

This plan addresses the findings from the SEO audit, prioritized by impact. Some fixes are /about-specific; others are site-wide and benefit all pages.

---

## 1. Critical Fixes

### 1a. Reduce noscript duplication risk
**Problem:** The `<noscript>` block in `index.html` contains full homepage content. The `inject-static-content.cjs` script also injects similar content into `<div id="root">` post-build. Google may see duplicate headings/sections.

**Fix:**
- Remove the `inject-static-content.cjs` post-build injection entirely (or reduce it to nav + single CTA). The `<noscript>` block already provides crawlable fallback.
- Trim the `<noscript>` block to essentials: navigation, H1, one paragraph, key CTAs, and FAQ (no repeated service blocks that duplicate the rendered DOM).

### 1b. Add /about-specific structured data via Cloudflare edge function
**Problem:** The /about page injects a `ProfilePage` JSON-LD via `useSEO`, but this only works after JS renders. Crawlers hitting the raw HTML see only the homepage schema.

**Fix:** Extend `functions/[[path]].ts` to inject /about-specific JSON-LD (ProfilePage + BreadcrumbList for Home > About) using `HTMLRewriter`, replacing the homepage schema for /about requests.

### 1c. Fix the Lovable badge outbound link
**Problem:** Third-party badge injects DOM + outbound link.

**Fix:** This badge is injected by the Lovable platform and cannot be removed from code. It is only present in preview/development builds and is not included in production deployments to custom domains. No action needed if publishing to hansvanleeuwen.com.

---

## 2. Quick Wins

### 2a. Add missing meta tags to index.html
Add to `<head>`:
```html
<meta name="referrer" content="strict-origin-when-cross-origin" />
<meta name="format-detection" content="telephone=no" />
```

### 2b. Update inject-static-content.cjs H1 to match rendered H1
**Problem:** The injected static H1 says "Driving marketplace growth through strategy & design" while the rendered H1 is "Freelance E-commerce Manager -- strategy, growth & design". These should match.

**Fix:** Update the static content script's H1 to mirror the rendered keyword-rich version.

### 2c. About page -- add Person schema with ImageObject
**Problem:** The /about page's `useSEO` only outputs a simple `ProfilePage` schema. It should include a richer Person entity with `ImageObject` for the profile photo.

**Fix:** Expand the `useSEO` call in `About.tsx` to include a `@graph` with `Person` (image, jobTitle, worksFor, knowsAbout, address, sameAs) and `ImageObject` for the profile photo, plus the existing BreadcrumbList.

### 2d. Ensure OG image is PNG (not WebP)
**Current:** `og-image.png` -- already PNG. No change needed. The audit flagged .webp as a risk, but the current implementation is correct.

---

## 3. Opportunities

### 3a. Add hreflang for NL/EN language variants
**Problem:** The site supports NL/EN but has no hreflang tags.

**Fix:** Add `<link rel="alternate" hreflang="en" href="..." />` and `<link rel="alternate" hreflang="nl" href="..." />` in `useSEO` hook dynamically, or statically in `index.html` with the Cloudflare function swapping URLs per route.

### 3b. Improve Footer with internal links for topical clustering
**Problem:** Footer only has LinkedIn, BeHans.nl, and Privacy. Missing internal nav links.

**Fix:** Add Work, Writing, About links to Footer for stronger internal linking across all pages.

### 3c. Add /about noscript fallback
**Problem:** When crawlers hit /about without JS, they see the homepage noscript content (since it's an SPA with a single index.html).

**Fix:** This is already handled by the Cloudflare edge function which rewrites meta tags for /about. For deeper crawlability, the edge function could also inject an /about-specific `<noscript>` block, but this is lower priority since Google typically renders JS.

---

## Technical Summary of File Changes

| File | Change |
|------|--------|
| `index.html` | Add referrer + format-detection meta tags; trim noscript to essentials |
| `scripts/inject-static-content.cjs` | Update H1 to match rendered version, or remove script entirely |
| `src/pages/About.tsx` | Expand `useSEO` JSON-LD to include rich Person + ImageObject schema |
| `functions/[[path]].ts` | Add /about JSON-LD injection via HTMLRewriter |
| `src/components/Footer.tsx` | Add internal navigation links (Work, Writing, About) |
| `src/hooks/useSEO.ts` | Add hreflang link injection support |

