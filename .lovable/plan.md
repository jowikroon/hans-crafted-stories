

# Inject Page-Specific OG Meta Tags for Social Media Crawlers

## Problem

Social media crawlers (Facebook, LinkedIn, Twitter/X) do not execute JavaScript. Since this is an SPA, all subpages serve the same `index.html` with the homepage's OG tags. Sharing `/about` or `/work` on LinkedIn shows the homepage title and description instead of the page-specific ones.

## Solution: Cloudflare Pages Function (`functions/[[path]].ts`)

Cloudflare Pages supports **Pages Functions** — server-side middleware that runs before serving static files. We create a single catch-all function that:

1. Checks the request path
2. If it matches a known route, fetches the static `index.html` and replaces the OG meta tags with page-specific values
3. For unknown routes or non-HTML requests, passes through to the static file

This runs entirely on Cloudflare's edge — no external server needed.

## Architecture

```text
Browser/Crawler request
        |
        v
  Cloudflare Pages Function (functions/[[path]].ts)
        |
        |-- Is it a known page route? (/about, /work, /writing, /privacy)
        |     Yes -> Fetch index.html, replace OG tags, serve modified HTML
        |     No  -> Pass through to static files (SPA _redirects handles it)
        |
        v
  Response with correct OG meta tags
```

## File to Create

### `functions/[[path]].ts` (Cloudflare Pages Function)

A single file that:
- Defines a map of route -> { title, description } using the same SEO strings from translations
- On each request, checks if the URL path matches a known route
- If yes: fetches the origin response (index.html), does string replacement on the `<title>`, `og:title`, `og:description`, `twitter:title`, `twitter:description`, and canonical URL tags
- If no: returns the origin response unmodified

### Route metadata map (hardcoded in the function):

| Route | Title | Description |
|---|---|---|
| `/` | (unchanged — already correct in index.html) | (unchanged) |
| `/about` | About Hans van Leeuwen -- E-commerce Manager, 10+ Years Experience | Learn about Hans van Leeuwen's 10+ years of experience in e-commerce management... |
| `/work` | Design Portfolio & Case Studies, E-commerce, 3D & UX, Hans van Leeuwen | Explore Hans van Leeuwen's portfolio... |
| `/writing` | E-commerce Insights & Articles, Hans van Leeuwen | Read Hans van Leeuwen's thoughts on e-commerce strategy... |
| `/privacy` | Privacy Policy, Hans van Leeuwen | Read the privacy policy of hansvanleeuwen.com... |

### Key implementation details:

- Only modifies HTML responses (checks `Accept` header or content-type)
- Uses `HTMLRewriter` (Cloudflare's streaming HTML rewriter) for efficient tag replacement — no regex on HTML
- Preserves the `og:image` (same for all pages — the site-wide OG image)
- Updates `og:url` and `canonical` to match the current path
- Falls through to `env.ASSETS.fetch(request)` for static assets (JS, CSS, images)

## Important Note

**This file must be created at the project root as `functions/[[path]].ts`** — Cloudflare Pages automatically picks up files in the `functions/` directory and deploys them as edge functions. The `[[path]]` catch-all syntax means it handles all routes.

Since this project deploys via GitHub -> Cloudflare Pages, simply committing this file to the repo will auto-deploy it on the next push to `main`.

## What Changes

| File | Change |
|---|---|
| `functions/[[path]].ts` | New — Cloudflare Pages Function for OG meta tag injection |

No changes to existing files. The `_redirects` SPA fallback still works as before — the Pages Function runs first, and for non-matched routes it falls through to the static asset pipeline which uses `_redirects`.

## Verification

After deployment, test with:
- `curl -A "facebookexternalhit" https://hansvanleeuwen.com/about` — should show About-specific OG tags
- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
- Twitter Card Validator (via posting a tweet preview)

