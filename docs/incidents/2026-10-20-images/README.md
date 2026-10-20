# Afbeeldingenstoring hansvanleeuwen.com, 20 oktober 2026

## Bevestigde uitkomst

54 unieke afbeeldings-URL's retourneren HTTP 402 met dezelfde Supabase-melding:
`exceed_egress_quota, exceed_storage_size_quota`.
Dit is een actuele bezoekersstoring. Een browser op het Anthropic-artikel bevestigt
7 geladen maar ondecodeerbare afbeeldingen (`complete=true`, `naturalWidth=0`).
De lokale profielfoto en het logo renderen correct. Een verzoek met de
AhrefsBot-user-agent geeft voor dezelfde headerafbeelding eveneens 402.

| Controle | Resultaat |
| --- | ---: |
| Canonieke sitemap-pagina's opgehaald, allemaal HTTP 200 | 49 |
| Unieke afbeeldings-URL's uit HTML en share-metadata | 72 |
| HTTP 200 met image-content-type | 18 |
| HTTP 402, JSON in plaats van afbeeldingsdata | 54 |
| Geblokkeerde bestanden aanwezig in storage.objects | 54 van 54 |
| Sitemap-pagina's met minimaal één geblokkeerde afbeelding | 28 |
| Unieke pagina-afbeeldingcombinaties voor geblokkeerde bestanden | 80 |
| Afbeeldingen waarvan levering hersteld is | 0 |

`http-checks.json` bevat alle pagina- en afbeeldings-URL's, HTTP-status,
content-type, de verwijzende pagina's en de aanwezigheid in de opslagmetadata.
Dit bestand is een onafhankelijke livecontrole, geen Ahrefs-export. Inline
data-URI-logo's zijn buiten de 72 HTTP-bronnen gehouden.

## Afbakening Ahrefs

De e-mail van 20 oktober 01:12 UTC bevestigt 174 interne URL's, Health Score 37,
120 pagina's met broken images en 54 broken image-bronnen. De e-mail van
13 oktober 21:10 UTC rapporteerde Health Score 97 en 5 fouten.

De auditlink retourneert in de beschikbare browsersessie een Ahrefs-404. De
projectenlijst toont alleen Connectcarparts. Daardoor kon de volledige lijst
van 120 Ahrefs-pagina-URL's niet worden geëxporteerd of met de 28 canonieke
pagina's worden vergeleken. Queryvarianten/aliassen zijn geen vastgestelde
verklaring. De onafhankelijke 54 unieke defecte bronnen komen numeriek exact
overeen met de melding; een één-op-één vergelijking met de auditexport blijft open.

## Gedeelde oorzaak en deployments

Het project `pesfakewujjwkyybwaom` heet `Claude n8n` en behoort volgens de
Supabase-connector tot `jowikroon's Org` (`jtmrwxzqvuxofcvuhdum`). De
beperkingsmail voor deze organisatie is verzonden op 19 oktober 22:46 UTC,
vóór de Ahrefs-audit. De daadwerkelijke afbeeldingresponses benoemen de twee
quota-overschrijdingen expliciet. Het project kan tegelijk `ACTIVE_HEALTHY`
rapporteren: dat is hier geen bewijs dat de publieke API of Storage werkt.

Alle 54 paden bestaan nog in `storage.objects`, samen 5.525.302 bytes.
Er is geen bewijs voor een bestandsverwijdering of padwijziging als oorzaak.
De gedeelde afhankelijkheid is de Supabase Storage-gateway, niet één ontbrekend
logo of één defecte React-component. Headers worden hergebruikt in artikelindex,
artikelpagina en share-metadata; inline illustraties gebruiken dezelfde gateway.

De actuele `/build.json` bevestigt productiecommit
`8679bd0ce74c24e7175c2e61bdaa33a7b377d9a6` (main), gebouwd op
16 oktober 14:51:31 UTC. De onderzochte broncode staat op die commit.
De storing is aanwezig in deze nog actieve deployment. Een code-rollback
verhelpt de bewezen blokkade van dezelfde externe opslag niet.

Opslaginventaris uit metadata, uitsluitend gelezen:

| Bucket | Objecten | Bytes |
| --- | ---: | ---: |
| music-artwork | 3.641 | 4.280.753.048 |
| bucket | 464 | 304.293.949 |
| documents | 32 | 56.418.220 |
| apps | 190 | 26.455.608 |

Dit is geen egressrapport. De grootste opslagbucket bewijst niet welke workload
het dataverkeer heeft veroorzaakt. Er is niets verwijderd of aan quota, billing,
RLS, metadata of content aangepast. De afzonderlijke SEO-auditpipeline is niet
onderzocht en krijgt hier geen gedeelde oorzaak toegeschreven.

## Herstel en resterende blokkade

Het centrale herstel is de Supabase-servicebeperking opheffen voor deze
organisatie. De gateway noemt een planupgrade of een wijziging van de spend cap.
Het actuele abonnement en de concrete totaalprijs zijn niet vastgesteld; de
billingpagina vraagt om aanmelding. Er is geen betaalde wijziging uitgevoerd.
Bestanden verwijderen is zonder gecontroleerde backup en verwijzingsanalyse
geen veilige herstelactie. Alleen opslag reduceren bewijst bovendien niet dat
ook de egressbeperking verdwijnt.

Na herstel: voer de 72 afbeeldingscontroles opnieuw uit, controleer natuurlijke
afbeeldingsafmetingen op NL/EN-artikelen en indexen, en laat Ahrefs opnieuw
crawlen. Verwacht resultaat: 54 eerder geblokkeerde bronnen hebben weer een
succesvolle image-response. Rapporteer de werkelijke resultaten, niet alleen
een verbeterde Health Score. Migreer publieke artikelafbeeldingen later pas
naar site/CDN-opslag wanneer de originele bytes beschikbaar zijn en op inhoud
en volledigheid zijn gecontroleerd; behoud stabiele verwijzingen of redirects.

## Regressiebescherming in deze PR

- `image-guard.mjs` controleert gerenderde img/srcset-, picture-, inline-style-
  en OG/Twitter-verwijzingen. Lokale bestanden moeten bestaan en niet leeg zijn;
  externe afbeeldingen moeten een succesvolle HTTP-response met image-type geven.
  De controle dedupliceert URL's, beperkt parallelle verzoeken tot vier en
  annuleert responsebodies om dataverkeer te beperken. Het is geen visuele decoder.
- Een 402 of een HTML-fallback met HTTP 200 stopt de build. De controle draait
  vóór sitemapgeneratie en IndexNow. Standalone tools/private exportmappen vallen
  buiten deze controle van publieke React-pagina's.
- Prerender stopt bij een fout bij het ophalen van gepubliceerde artikelen.
  Sitemapgeneratie stopt bij ontbrekende configuratie of een foutresponse.
  Voorheen slaagde een build tijdens de huidige 402 en produceerde die slechts
  23 sitemap-URL's in plaats van 49, zonder artikelen. Deze onvolledige lokale
  build is niet gepubliceerd en de gewijzigde sitemap is teruggedraaid.

Validatie:

```sh
npm run test:images --workspace=@hans/personal
npm run check:images --workspace=@hans/personal -- --dist=/tmp/hans-live-dist
VERCEL_ENV=preview npm run build:personal
```

Drie regressietests slagen (ontbrekende/dubbele lokale verwijzingen; 402 en
soft-404; srcset/relatieve/inline/ongeldige verwijzingen). De nieuwe controle
op de 49 opgeslagen livepagina's rapporteert 72 bronnen en exact 54 HTTP
402-fouten. De aangepaste echte build stopt terecht bij de artikel-fetch met
402 en publiceert niets. Een volledig groene productiebuild en een succesvolle
nacontrole zijn pas mogelijk na herstel van Supabase.

## Bronnen

- [Ahrefs auditlink](https://app.ahrefs.com/site-audit/10487592/overview?current=20-10-2026T011244)
- [Ahrefs melding 20 oktober](https://mail.google.com/mail/u/?authuser=hansvl3%40gmail.com#all/1a156de520ee6587)
- [Supabase beperkingsmail](https://mail.google.com/mail/u/?authuser=hansvl3%40gmail.com#all/1a15658bfb154971)
- [Voorbeeldartikel](https://hansvanleeuwen.com/writing/tragic-mistake-anthropic-leaks-claude-s-source-code)
- [Live build-identificatie](https://hansvanleeuwen.com/build.json)
- [Supabase opslaggebruik](https://supabase.com/docs/guides/platform/manage-your-usage/storage-size)
- [Supabase egressgebruik](https://supabase.com/docs/guides/platform/manage-your-usage/egress)
