# hansvanleeuwen.com — Domain & DNS (Cloudflare Pages)

**DNS is managed in Cloudflare. De site zelf draait op Vercel**, gebouwd uit
`jowikroon/hans-crafted-stories` op GitHub. Cloudflare levert alleen de nameservers — de
records staan DNS-only en wijzen naar Vercel.

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

Both **Cursor** and **Lovable** push to the same GitHub repo. **Vercel** builds and deploys
the live site on every push to `main`; Cloudflare Pages bouwt parallel mee maar serveert geen
bezoekersverkeer. Zie [`hosting-context.md`](./hosting-context.md).

---

## DNS records (Cloudflare)

Managed at [dash.cloudflare.com](https://dash.cloudflare.com) → **Websites** → **hansvanleeuwen.com** → **DNS** → **Records**.

> **Let op — dit stond hier fout tot 24-08-2026.** De tabel beschreef records die naar
> Cloudflare Pages wijzen, proxied. Zo staat het niet ingesteld en zo hoort het ook niet:
> wie die records "herstelt", haalt de live site van Vercel af. Hieronder staat wat er
> daadwerkelijk in de zone staat, gemeten op 24-08-2026.

| Type      | Name  | Content / Target                        | Proxy status      | TTL  |
|-----------|-------|-----------------------------------------|-------------------|------|
| **A**     | `@`   | `76.76.21.241` (+ `66.33.60.193`)       | DNS only (grijs)  | Auto |
| **CNAME** | `www` | Vercel                                   | DNS only (grijs)  | Auto |

- **De apex wijst naar Vercel**, niet naar Cloudflare Pages. Vercel serveert het verkeer en
  regelt het certificaat.
- **Proxy status is DNS only (grijze wolk)**, niet proxied. Bij een oranje wolk zou
  `curl -sI https://hansvanleeuwen.com` `server: cloudflare` teruggeven en Cloudflare-IP's
  tonen; hij geeft `server: Vercel` en Vercel-IP's.
- **`www` doet een 308 naar de apex**, geregeld in `apps/personal/vercel.json` (HAN-136).
- Cloudflare blijft de DNS-provider — alleen de nameservers, niet de proxy of de hosting.

Controleren:

```sh
getent hosts hansvanleeuwen.com                          # -> Vercel-IP's
curl -sI https://hansvanleeuwen.com | grep -i '^server'  # -> server: Vercel
```

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
