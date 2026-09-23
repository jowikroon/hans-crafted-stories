# SEO: één URL per taal, echte 404's en een guard die het afdwingt (2026-09-05)

Refereert aan Linear HAN-167, HAN-83, HAN-138, HAN-145, HAN-146, HAN-165.

## Wat er mis was
- Eén URL serveerde Nederlands (prerender met `initialLang: "nl"`) én Engels (client-hydratie op `navigator.language`/localStorage). `html[lang]`, title/meta en body spraken elkaar tegen; Google indexeerde een andere taal dan NL-bezoekers zagen.
- `hreflang="nl"` en `hreflang="en"` wezen naar dezelfde URL en het blok stond twee keer in `index.html`.
- Onbekende paden kregen via de catch-all rewrite de homepage-prerender met `index,follow` + `canonical /` (soft-404).
- `/music` linkte naar login-gated SoundCloud-tracks die publiek "Track not found" renderen.
- `--muted-foreground` (#8A877C) haalde 3.39:1 op de site-achtergrond (WCAG AA vraagt 4.5).

## Hoe het nu werkt
- **URL = taal.** `/nl/<pad>` is Nederlands, al het andere Engels. `src/lib/i18n/routes.ts` bevat de lijst van gelokaliseerde routes en de helpers (`localizePath`, `alternatesFor`, `absoluteUrl`). `hooks/useLang.tsx` leest de taal uitsluitend uit de URL; de NL/ENG-schakelaar in de navigatie zijn echte `<a href>`-links naar de tweeling-URL.
- **`components/LocalizedLink.tsx`** houdt interne links in de actieve taal. Nieuwe pagina's: importeer `Link` daaruit, niet uit `react-router-dom`.
- **`hooks/useSEO.ts`** krijgt `path` + `lang` en leidt canonical, wederkerige hreflang (`en`, `nl`, `x-default`=en), `og:locale` en `html[lang]` af. Eentalige routes (artikelen, muziek) krijgen géén hreflang.
- **`data/servicePages.ts`** is de enige bron voor de vier dienstenpagina's (NL+EN): title, meta, intro, bewijs met bron, praktijkcases uit `/writing`, werkwijze, tarief-modellen, FAQ. `components/ServicePage.tsx` rendert; `scripts/prerender.mjs` gebruikt dezelfde data voor head, JSON-LD en noscript-fallback.
- **Prerender** schrijft elke gelokaliseerde route twee keer (`dist/<pad>` en `dist/nl/<pad>`) en genereert `dist/404.html` (noindex, geen canonical). `vercel.json` heeft geen catch-all rewrite meer; alleen app-routes (portal, write, dashboards, auth, music/:slug, writing/:slug) vallen terug op `index.html`. Alles wat geen bestand matcht geeft HTTP 404.
- **`scripts/seo-guard.mjs`** faalt de build op: ≠1 h1, canonical ≠ eigen URL, `lang` ≠ pad, hreflang-set niet exact {en, nl, x-default}, en = nl, x-default ≠ en, ontbrekende tweeling in dist, JSON-LD `inLanguage` ≠ `lang`, og:locale/content-language ≠ `lang`, noindex op indexeerbare pagina's, `/music`-links naar niet-publieke tracks, ontbrekende/foute 404.html.
- **Sitemap** bevat beide taalversies met `xhtml:link`-alternates.

## Bewijsregels voor content
Elk cijfer op een dienstenpagina heeft een zichtbare bron (cv-rol + jaar, of een artikel op `/writing`). De 20% wekelijkse verkoopgroei komt uit een Back-to-School social-ad-campagne bij Alpine Hearing Protection — niet uit Bol Ads; eerdere teksten schreven dat verkeerd toe. 70% marktaandeel = oordoppencategorie Amazon NL, Nielsen 2023.

## Restrisico's
- `/writing/:slug` en `/music/:slug` vallen nog terug op `index.html` (drafts en niet-geprerenderde tracks). Een onbekend pad in die twee subtrees geeft dus nog een 200-shell. Structurele oplossing: SSR of edge-middleware voor die twee routes.
- `Person.sameAs` mist nog Wikidata en YouTube (HAN-115) — alleen toevoegen met geverifieerde URL's.
