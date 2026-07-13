# eBay DE Go-Live — Roadmap + Master Checklist (Fase 1 + 2, ter akkoord)

*CCP × A.B.S. · 2026-07-10 · gesynthetiseerd uit vault, log.md, _cowork/ccp-ebay-de/, scheduled tasks · door Cowork*
*Gelezen bronnen: [[eBay-DE-Launch]], GOLIVE-checklist-DE.md, eBay-DE-golive-checklist.md, eBay-DE-huidige-setup-en-status-2026-07-08.md, eBay-DE-actieplan-1A4.md, BUJO-livegang-DE.md, order-to-cash onderzoek 07-06, testorder-diagnose 07-06, stoplicht Dennis 07-07, TT-bewijs 07-08, storeview-incident 07-08, Returnless-insteladvies 07-10, eBay-DE-command-center.html, log.md, scheduled-tasks registry.*
*NIET leesbaar deze sessie: `Downloads\KNOWLEDGE_BASE.md` + `Downloads\CLAUDE.md` (buiten gemounte map). `rules-state.json` is stale (laatste scan 2026-06-20; channable-operator-daily-scan staat uit sinds 02-07) — live-status hieronder komt uit log.md + sessie-artefacten 07-08/07-10.*

---

## DEEL 1 · Chronologische Go-Live Roadmap

### Al gebeurd (evidence-backed)

| Datum | Gebeurtenis | Bron |
|---|---|---|
| 2026-05-11 | eBay DE live met 20 SKU's, Quality Score 100/100 (testorder 144012797). Keten: eBay → Channable (314525) → Magento 2 → D365/ABS, ~5 min sync | [[eBay-DE-Launch]] |
| 2026-07-06 | Go-live-week plan + order-to-cash onderzoek: klant-facing kan live zónder DE-storefront (eBay stuurt bevestiging + trackingmail; B2C-factuur niet verplicht). Doel toen: **maandag 13-07 live** | order-to-cash onderzoek, golive-checklist |
| 2026-07-06 | DE-testorder faalt: Magento **Allow Countries** mist DE → fix geïdentificeerd (config, Hans/Luca zelf) | testorder-diagnose |
| 2026-07-07 | Veldnamen live geverifieerd (ABS 16880); titel-conventie "für u.a. {merk} {model}" afgesproken met Luca; verzendlocatie Nieuwegein, DPD Classic | log.md 07-07 |
| 2026-07-07 | Allow Countries DE gezet → adres geaccepteerd. Nieuwe blocker: **verzendmethode DE ontbreekt** in Magento (order 106110610). Stoplicht-briefing naar Dennis (Thinkyellow) | stoplicht-A4 07-07 |
| 2026-07-08 | Channable content-laag afgebouwd via API: master `categories_clean` (315886, 19 mappings art_grp_code), **20 kanaalregels** titel+omschrijving (≤80, merk-dynamisch, GPSR-veld), item-specifics gemapt, categorie-mapping 47,8% → **78,1%**, Remschijven→Bremsscheiben gefixt. **Niets gepubliceerd — "Uitvoeren" = Hans' knop** | setup-status 07-08, command-center |
| 2026-07-08 | T&T-keten bewezen: trackingnr (DPD 05112095164869) op Magento-shipment via Niek's ABS-API-koppeling; Channable "Shipment updates = Enabled" → eBay | TT-bewijs-A4 |
| 2026-07-08 | **Incident**: Atvise activeert DE store view op live → feed 0 producten (alle kanalen), 13 order-import-errors (alle test). Herstel belegd: Atvise rollback, Hans orders opnieuw, Niek D365-sync | Incident-A4 |
| 2026-07-08 | SKU Filter (27858166, kostenrem €0,04/listing) door Hans teruggezet naar **4 test-SKU's** (16880, 37760, SL 5595, 210017) | log.md |
| 2026-07-10 | Retourflow onderzocht + Returnless×Channable insteladvies (validatie → **postcode** i.p.v. e-mail; importer uit; "Search order"-model). Carrier/formulier-pagina's nog live te bevestigen | Returnless-insteladvies |
| Gepland | **Launch-week order-watch al gescheduled: 14–18 juli, elke 2 uur 08–20u, WhatsApp-alert bij order-fouten** (`ebay-de-launch-order-watch`) | scheduled-tasks registry |

**Datum-discrepantie:** golive-checklist zegt "maandag 13-07", de order-watch dekt 14–18 juli. Actuele go-live-datum na het storeview-incident = `[unverified]` — aanname hieronder: **launch-week 14–18 juli**.

### Content-status per categorie (Channable, gebouwd vs live)

```
eBay DE — titels + omschrijvingen (kanaalregels 1400294)
Gebouwd (regel bestaat, ≤80, GPSR)   ████████████████████  20/20 categorieën
Live op eBay (Uitvoeren geklikt)     ░░░░░░░░░░░░░░░░░░░░   0/20 — bewust: Hans' gate
Scope (SKU Filter)                   4 test-SKU's van ~39.684
Categorisatie feed                   78,1% (20.091 items)
```

### Nog te gebeuren (kritieke pad, in volgorde)

1. **Magento hersteld & stabiel** — storeview-rollback door Atvise bevestigd, feed weer >0, verzendmethode DE aan, mislukte testorders opnieuw → 1 DE-order end-to-end.
2. **Meeting-besluit** (open sinds 09-07): live zonder DE-storeview ja/nee.
3. **Compliance-gates dicht** (Sjoerd): Impressum/AGB/Widerruf/Datenschutz, OSS 19%, Lizenzero/LUCID — stonden 4 wk stil per actieplan 07-06; actuele status `[unverified]`.
4. ~~Factuurbesluit~~ — **GEEN go-live-blocker (besluit Hans 10-07)**: B2C-factuur niet verplicht; besluit + evt. tool (Billbee/easybill) mag ná live.
5. **Retour af**: Returnless-config afmaken (postcode-validatie, formulier-koppeling, DE→NL label live bevestigen).
6. **Hans breidt SKU Filter uit** naar de bedoelde go-live-lijst (kostenrem, alleen Hans).
7. **Preview-verificatie** op sample-SKU's per categorie → **Hans klikt Uitvoeren**.
8. **Launch-week 14–18 juli**: order-watch draait, eindtest 1 echte order betaald→verzonden→getrackt→(gefactureerd) + 1 retour.
9. **Na live**: Promoted Listings 2–5%, Fahrzeug-Kompatibilitätsliste (K-Typ, grootste hefboom), item-specifics maten zodra Bremsscheiben live, veld-opschoning.

---

## DEEL 2 · Master Checklist (taak · Definition of Done · verificatiemethode · owner)

Verificatie-legenda: **API** = Channable/Magento API-call · **VIS** = screenshot (Playwright/Chrome, UI-bewijs) · **SIGN** = handmatige sign-off (naam + datum) · **E2E** = end-to-end testtransactie.

### GATE 0 · Infra hersteld (blocker, nieuw t.o.v. bestaande checklist)
| # | Taak | Done = | Verificatie | Owner |
|---|---|---|---|---|
| 0.1 | Atvise: Magento scope/storeview terug naar situatie vóór 07-07 | Channable Magento-import Items > 0 (was 0) | API: import 750543 item-count | Atvise |
| 0.2 | Verzendmethode DE aan ("Ship to Applicable Countries" = all/DE, juiste store-view scope) | DE-testorder importeert zonder "verzendmethode ontbreekt" | API + VIS Magento config | Hans/Luca |
| 0.3 | 13 mislukte (test)orders opnieuw versturen | 0 orders in "Mislukte bestellingen" | VIS Channable Orders | Hans |
| 0.4 | Besluit: live zonder DE-storeview | Besluit gelogd in vault | SIGN Hans+Sjoerd | Hans |

### GATE 1 · Legal / compliance (Sjoerd) — status `[unverified]`, stond 4 wk stil
| # | Taak | Done = | Verificatie | Owner |
|---|---|---|---|---|
| 1.1 | Impressum · AGB · Widerruf · Datenschutz live | 4 teksten zichtbaar op eBay-shop/listings | VIS eBay shop-pagina's | Sjoerd |
| 1.2 | OSS actief, 19% DE-btw op listing + factuur | Bevestiging adviseur op schrift | SIGN | Sjoerd |
| 1.3 | Lizenzero/VerpackG getekend + LUCID-nr | Contract + LUCID-registratienummer in dossier | SIGN + doc | Sjoerd |
| 1.4 | GPSR op elke listing (Tinbergenlaan 7, 3401 MT — uit veld `gpsr_manufacturer_name`) | Compliance Dashboard 0 rood; GPSR-blok in preview | VIS Seller Hub + API feedcheck | Hans |

### GATE 2 · Order loopt door
| # | Taak | Done = | Verificatie | Owner |
|---|---|---|---|---|
| 2.1 | Allow Countries = DE (gezet 07-07, na incident herbevestigen) | DE-adres geaccepteerd | API/VIS | Hans/Luca |
| 2.2 | eBay order-sync "Complete" actief in Channable | Connectie Active + shipment updates Enabled | API order-config | Hans |
| 2.3 | DE-testorder komt in Magento én bereikt D365 | Order zichtbaar in Magento + D365-sync bevestigd | E2E + SIGN Niek | Hans/Niek |

### GATE 3 · Verzending + T&T
| # | Taak | Done = | Verificatie | Owner |
|---|---|---|---|---|
| 3.1 | DPD DE-label + tarief (schijven >5 kg marge >15%) | Testlabel gegenereerd, marge-check gelogd | VIS + SIGN | Hans |
| 3.2 | ABS API vult T&T op shipment bij ÁLLE orders (nu alleen testorder bewezen) | 3 opeenvolgende orders met gevuld trackingveld | VIS Magento Shipments steekproef | Niek |
| 3.3 | Tracking terug op eBay, koper krijgt trackingmail; carrier toont "DPD" (default staat op "DPD Predict" — fixen) | Trackingnr klikbaar op eBay-order | E2E + VIS | Hans |

### GATE 4 · Factuur — GEEN go-live-blocker (besluit Hans 10-07; afronden ná live)
| # | Taak | Done = | Verificatie | Owner |
|---|---|---|---|---|
| 4.1 | Besluit factuurpad (B2C geen / Billbee / easybill) | Besluit gelogd | SIGN Sjoerd | Sjoerd |
| 4.2 | Indien tool: gekoppeld, 19%/OSS ingesteld, test-B2B-factuur | 1 correcte factuur op testorder | E2E + VIS | Hans |

### GATE 5 · Retour
| # | Taak | Done = | Verificatie | Owner |
|---|---|---|---|---|
| 5.1 | eBay retourbeleid (30 dgn) + retouradres + provider | Policy zichtbaar op listing | VIS | Hans |
| 5.2 | Returnless: validatie → postcode, koppeling opgeslagen/geverifieerd, importer UIT, formulier gekoppeld, DE→NL label bevestigd, Magento-Development-integratie los | Testretour vindt order op postcode | E2E Returnless | Hans |
| 5.3 | Verwerker refund aangewezen | Naam gelogd | SIGN | Sjoerd |

### GATE 6 · Listings kloppen
| # | Taak | Done = | Verificatie | Owner |
|---|---|---|---|---|
| 6.1 | Titels Duits ≤80 (20 regels staan) | 0 titels >80 op go-live-scope | API: preview alle scope-SKU's | Hans |
| 6.2 | Omschrijving met GPSR, geen lege velden | Preview 3 SKU per categorie schoon | VIS preview | Hans |
| 6.3 | eBay-categorie per product juist (mapping 78,1%, 0 mismatches) | Go-live-SKU's 100% gecategoriseerd | API | Hans |
| 6.4 | **SKU Filter = exact de bedoelde go-live-lijst** (kostenrem — alleen Hans raakt dit aan) | Item-teller preview = bedoeld aantal | API "items na SKU Filter" + SIGN Hans | Hans |
| 6.5 | Item-specifics live categorieën (OE/Vergleich/EAN/Einbauposition); maten zodra Bremsscheiben live | Attributes-pagina gemapt | VIS Build→Attributes | Hans |

### GATE 7 · Betaling
| # | Taak | Done = | Verificatie | Owner |
|---|---|---|---|---|
| 7.1 | Managed Payments payout-config (bank, EUR, schema) | Payout-status actief in Seller Hub | VIS | Hans |
| 7.2 | Business Policies (Shipping ≤2 dgn handling, Payment, Return) gekoppeld aan alle listings | Policies-pagina toont koppeling | VIS | Hans |

### 🟢 Eindtest vóór GO + launch-week
| # | Taak | Done = | Verificatie | Owner |
|---|---|---|---|---|
| 8.1 | Hans klikt **Uitvoeren** (nooit de agent) | Listings live op eBay DE | SIGN Hans + VIS | **Hans** |
| 8.2 | 1 echte order: betaald → verzonden → getrackt → (gefactureerd) | Alle stappen met bewijs | E2E | Hans |
| 8.3 | 1 retour getest end-to-end | Refund verwerkt | E2E | Hans |
| 8.4 | Launch-week monitoring 14–18/7 actief (`ebay-de-launch-order-watch`, elke 2u, WhatsApp) | Task enabled + eerste run gelogd | API scheduled-tasks | Cowork |
| 8.5 | Na live: Messages-reactietijd, INR/SNAD-proces, Verkäufer-Cockpit, out-of-stock-control (~5 min sync) | Proces + eigenaar gelogd | SIGN | Hans/Luca |

---

## Vooruitblik Fase 3+4 (bouw ik ná jouw akkoord)

**Automation:** Supabase-tabellen `golive_checklist_items` + `golive_audit_runs` (project pesfakewujjwkyybwaom) · Cowork scheduled task (2×/dag launch-week, daarna 1×/dag) draait de verificaties: Channable-API-checks (SKU-filter-count, titellengtes, feed-items>0), Magento-checks, Playwright/Chrome-screenshots naar Supabase Storage als bewijs, SIGN-items blijven handmatig afvinkbaar. Elke run = audit-regel (timestamp, status, proof-URL).
**Dashboard:** hansvanleeuwen.com/dashboards/connect-car-parts/go-live-checklist in `jowikroon/hans-crafted-stories` — de dashboards-route bestaat al (PR#201, 10-07). React-component leest Supabase (auth-gated, RLS), toont per item status/laatste run/completion-timestamp/screenshot-thumbnails. Deploy via push-bridge + squash-merge.
**Classifier-gate:** checklist-data + screenshots zijn operationeel/internal; publicatie alleen achter login, classifier-run vóór push.

*Wijzigingen op deze checklist: zeg welke items erbij/eraf/anders moeten, dan bouw ik direct Fase 3+4.*
