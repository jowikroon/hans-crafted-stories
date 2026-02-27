# hansvanleeuwen.com — Domain & DNS (Cloudflare Pages)

**DNS is managed in Cloudflare.** The site is hosted on **Cloudflare Pages**, built from `jowikroon/hans-crafted-stories` on GitHub.

---

If the site ever showed a "Site not available" or paused-host message, point DNS back to Cloudflare Pages using the records in the table below (and ensure a Cloudflare Pages project is connected to this repo). For step-by-step DNS and Pages setup, see the sections below.

---

## Architecture

```
Cursor  ──push──►  GitHub (jowikroon/hans-crafted-stories)  ◄──push──  Lovable
                              │
                     Cloudflare Pages (auto-deploy on push)
                              │
                   hansvanleeuwen.com  (Cloudflare DNS)
```

Both **Cursor** and **Lovable** push to the same GitHub repo. Cloudflare Pages builds and deploys automatically on every push to `main`.

---

## DNS records (Cloudflare)

Managed at [dash.cloudflare.com](https://dash.cloudflare.com) → **Websites** → **hansvanleeuwen.com** → **DNS** → **Records**.

| Type      | Name  | Content / Target       | Proxy status | TTL  |
|-----------|-------|------------------------|--------------|------|
| **A**     | `@`   | `185.158.133.1`        | Proxied      | Auto |
| **CNAME** | `www` | `<project>.pages.dev`  | Proxied      | Auto |

- **A record `@`**: apex domain (hansvanleeuwen.com) pointing to Cloudflare Pages.
- **CNAME `www`**: replace `<project>` with your Cloudflare Pages project subdomain (visible in Workers & Pages → your project).
- **Proxy status**: use **Proxied** (orange cloud) for both records so Cloudflare handles SSL and caching.

---

## Cloudflare Pages project

Managed at [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → your project.

| Setting             | Value                              |
|---------------------|------------------------------------|
| Repository          | `jowikroon/hans-crafted-stories`   |
| Production branch   | `main`                             |
| Build command       | `npm run build`                    |
| Output directory    | `dist`                             |
| Node version        | 20                                 |

Custom domains (`hansvanleeuwen.com` and optionally `www.hansvanleeuwen.com`) are added under the **Custom domains** tab.

---

## Lovable ↔ Git

In [lovable.dev](https://lovable.dev), the project is linked to **jowikroon/hans-crafted-stories**. Pushes from Lovable go to the same repo that Cloudflare Pages deploys from.

---

## More info

- [Cloudflare Pages: Get started](https://developers.cloudflare.com/pages/get-started/)
- [Cloudflare Pages: Custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Cloudflare Pages: Redirects](https://developers.cloudflare.com/pages/configuration/redirects/)
- [Cloudflare: DNS records](https://developers.cloudflare.com/dns/manage-dns-records/)
- [Cloudflare Pages: Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
