# hansvanleeuwen.com — Cloudflare Pages Deployment

**DNS and hosting are both in Cloudflare.** The site is deployed via Cloudflare Pages connected to the GitHub repo.

---

## Setup: Cloudflare Pages

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Select the GitHub repo **jowikroon/hans-crafted-stories**.
3. Configure build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** 20 (set via environment variable `NODE_VERSION=20`)
4. Deploy. Cloudflare Pages will auto-deploy on every push to `main`.

---

## Custom Domain

Since the domain is already in Cloudflare:

1. In Cloudflare Pages → your project → **Custom domains**.
2. Add `hansvanleeuwen.com` and `www.hansvanleeuwen.com`.
3. Cloudflare automatically configures DNS records (CNAME) — no manual DNS changes needed.

---

## SPA Routing

The file `public/_redirects` handles client-side routing:

```
/*  /index.html  200
```

This ensures all routes are served by the React app.

---

## More info

- [Cloudflare Pages: Get started](https://developers.cloudflare.com/pages/get-started/)
- [Cloudflare Pages: Custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Cloudflare Pages: Redirects](https://developers.cloudflare.com/pages/configuration/redirects/)
