

# Add SEO Meta Tags and Open Graph Data to All Subpages

## Current State

6 of 10 pages already use the `useSEO` hook for dynamic meta tags (title, description, OG, Twitter, canonical). However, 4 pages are missing it entirely, and several pages lack structured data (JSON-LD).

| Page | useSEO | JSON-LD | Notes |
|---|---|---|---|
| Index (/) | Yes | Via index.html | OK |
| Work (/work) | Yes | CollectionPage + CreativeWork items | OK |
| Writing (/writing) | Yes | CollectionPage | OK |
| BlogPostPage (/writing/:slug) | Yes | BlogPosting | OK |
| About (/about) | Yes | None | Missing JSON-LD; hardcoded EN strings instead of translations |
| Privacy (/privacy) | Yes | None | Missing JSON-LD |
| NotFound (404) | No | None | Missing everything |
| Empire (/empire) | No | None | Internal tool -- low priority |
| HansAI (/hansai) | No | None | Internal tool -- low priority |
| Portal (/portal) | No | None | Internal tool -- low priority |

## Plan

### 1. Add SEO translations for About page

Add `aboutTitle` and `aboutDescription` to the `seo` section of both `en` and `nl` translations in `src/data/translations.ts`, plus a `notFoundTitle` for the 404 page.

### 2. About page -- use translations + add JSON-LD

Update `src/pages/About.tsx`:
- Replace hardcoded title/description with `seo.aboutTitle` / `seo.aboutDescription` from translations
- Add Person-type JSON-LD with `ProfilePage` wrapper, linking to the `#person` entity already defined in `index.html`

### 3. Privacy page -- add JSON-LD

Update `src/pages/Privacy.tsx`:
- Add a simple `WebPage` JSON-LD schema with breadcrumb data

### 4. NotFound page -- add useSEO

Update `src/pages/NotFound.tsx`:
- Add `useSEO` with a "Page Not Found" title and noindex-friendly description
- Set a basic meta robots noindex tag so search engines don't index 404 pages

### 5. Empire, HansAI, Portal -- add basic useSEO

These are internal/admin tools, so they get minimal SEO with `noindex` signals:
- Add `useSEO` to each with a simple title and description
- This ensures proper document titles for browser tabs and prevents accidental indexing

### 6. Update sitemap.xml

Add `/about` and `/privacy` to the sitemap if not already present (they are public-facing pages that should be indexed).

## Technical Details

### Translation type update (`src/data/translations.ts`)

Add to the `seo` type interface:
- `aboutTitle: string`
- `aboutDescription: string`

Add corresponding values in both `en` and `nl` objects.

### JSON-LD for About page

```text
{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "mainEntity": { "@id": "https://hansvanleeuwen.com/#person" },
  "name": "About Hans van Leeuwen",
  "url": "https://hansvanleeuwen.com/about",
  "breadcrumb": { ... }
}
```

### JSON-LD for Privacy page

```text
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Privacy Policy",
  "url": "https://hansvanleeuwen.com/privacy",
  "breadcrumb": { ... }
}
```

### Files changed

| File | Change |
|---|---|
| `src/data/translations.ts` | Add aboutTitle, aboutDescription to seo type + both languages |
| `src/pages/About.tsx` | Use translated SEO strings + add ProfilePage JSON-LD |
| `src/pages/Privacy.tsx` | Add WebPage JSON-LD |
| `src/pages/NotFound.tsx` | Add useSEO with noindex title |
| `src/pages/Empire.tsx` | Add basic useSEO |
| `src/pages/HansAI.tsx` | Add basic useSEO |
| `src/pages/Portal.tsx` | Add basic useSEO |
| `public/sitemap.xml` | Add /about and /privacy URLs if missing |
