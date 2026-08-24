# Hosting context (Vercel)

**hansvanleeuwen.com wordt geserveerd door Vercel.** Cloudflare doet de DNS en bouwt
daarnaast een eigen Pages-kopie mee, maar serveert geen bezoekersverkeer.

> Dit document stond tot 24-08-2026 op "hosted on Cloudflare Pages". Dat klopte niet meer
> en heeft een productiestoring acht dagen onzichtbaar gehouden: drie mislukte Vercel-deploys
> werden afgedaan als "Cloudflare Pages is toch de echte host". Zie de verificatie onderaan.

---

## Wie doet wat

| Laag | Partij | Bewijs |
|---|---|---|
| Nameservers / DNS | Cloudflare | `diva.ns.cloudflare.com`, `jerry.ns.cloudflare.com` |
| Apex + www serveren | **Vercel** | `curl -sI https://hansvanleeuwen.com` → `server: Vercel` |
| A-records apex | Vercel-IP's, **onproxied** | `76.76.21.241`, `66.33.60.193` (grijze wolk — bij proxy zie je Cloudflare-IP's en `server: cloudflare`) |
| Cloudflare Pages | bouwt parallel mee | `hansvanleeuwen.pages.dev` → 200, `server: cloudflare`; geen productiedomein |

Dat Cloudflare Pages groen is, zegt dus **niets** over of de site is bijgewerkt. Alleen de
Vercel-deploy telt.

---

## Project

**hans-crafted-stories** — persoonlijke site en admin-dashboard van Hans van Leeuwen
(hansvanleeuwen.com). React 18 + Vite 5 + TypeScript, Tailwind CSS, shadcn/ui, Supabase.
Geen Next.js of Nuxt.

## Vercel-configuratie

| | |
|---|---|
| Project | `hansvanleeuwen` (`prj_AzLljugBWGCWo9lJiclEKKNTqLLz`) |
| Framework preset | vite |
| Root directory | `apps/personal` |
| Build command | `cd ../.. && npm run build:personal` (staat in `apps/personal/vercel.json`) |
| Output directory | `dist` |
| Node | 24.x |

Vervang het build command niet door `npx vite build` of iets anders kaals. De productiebuild
moet de volledige `@hans/personal`-keten draaien:

1. `scripts/check-og-image.cjs`
2. Vite client build
3. `scripts/inject-static-content.cjs`
4. `scripts/build-ssr.cjs`
5. `scripts/prerender.mjs`
6. `scripts/seo-guard.mjs`
7. `scripts/generate-sitemap.mjs`
8. `scripts/indexnow-ping.mjs`

De SSR/prerender-stappen genereren statische HTML voor `/writing/<slug>/` met per-post
canonical, Open Graph, BlogPosting JSON-LD, crawler-fallback en veilige `__PRELOADED__`.
Een kale Vite-build slaat die over en laat de blog-SEO terugvallen op homepage-metadata.
`seo-guard.mjs` faalt de build bewust bij >1 `h1`, ontbrekende title/canonical/description
of een lang-mismatch.

**Routing, headers en redirects** staan in `apps/personal/vercel.json` — niet in `_redirects`
of `_headers`, en niet in een `vercel.json` in de repo-root (die wordt door de root directory
`apps/personal` niet gelezen; zie #305/#306).

**Environment:** Supabase-sleutels staan lokaal in `.env` en in de Vercel project environment
variables. Nooit committen. Houd bestaande namen aan (`VITE_SUPABASE_*`).

**Deploys:** elke push naar `main` triggert een production-deploy; andere branches en PR's
krijgen een preview. Een gezonde build duurt ongeveer **20 seconden**. Duurt hij minuten,
dan zit er iets fout in de dependency-resolutie — zie hieronder.

---

## Bekende valkuil: buildtimeout door override-drift

Van 16 t/m 24 augustus 2026 mislukte elke production-deploy met
`BUILD_EXCEEDED_MAXIMUM_TIME` na 45 minuten. Oorzaak: het `overrides`-blok in de root
`package.json` pinde 34 `@tiptap`-packages op `3.20.2`, terwijl `apps/personal` er 12 op
`3.26.0` declareerde. Bij elke schone resolutie botsten die frontaal en bleef npm het
conflict herevalueren.

Lokaal viel dat niet op: de root-lockfile had het conflict al opgelost, dus daar installeerde
het in seconden. Op de Vercel-runner wordt vanuit `apps/personal` geresolved — daar staat
geen lockfile — en haalt elke pass registry-metadata op.

Bij een trage of vastlopende build: kijk eerst of `overrides` in de root nog overeenkomt met
wat de workspaces declareren.

---

## Verificatie

Deze pagina is geen aanname. Controleer 'm zo:

```sh
curl -sI https://hansvanleeuwen.com | grep -i '^server'      # -> server: Vercel
curl -sI https://www.hansvanleeuwen.com | grep -i '^location' # -> 308 naar apex
getent hosts hansvanleeuwen.com                               # -> Vercel-IP's, geen Cloudflare
```

**Git:** zowel Cursor als Lovable pushen naar `jowikroon/hans-crafted-stories`. Zowel Vercel
als Cloudflare Pages zijn aan die repo gekoppeld.
