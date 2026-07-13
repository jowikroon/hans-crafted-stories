# eBay.de — go-live checklist (afvinkbaar)

*CCP × A.B.S. · doel: maandag 13-07 direct live · 2026-07-06 · [kritisch] = moet vóór maandag · owner tussen haakjes*

## Fase 0 · Account & policies (nu regelen)
- [ ] Business Policies compleet: Shipping, Payment, Return — opgeslagen + gekoppeld aan álle listings [kritisch] (Hans)
- [ ] Retourbeleid: 30 dagen, retouradres (NL of DE-hub), retourprovider gekozen [kritisch] (Hans)
- [ ] Verwerker retouren aangewezen (wie ontvangt + fiatteert refund) (Sjoerd)
- [ ] Payout-config eBay Managed Payments: bank, uitbetaalschema, EUR (Hans)
- [ ] Handling time realistisch (≤2 dagen) — beschermt Late-Shipment-Rate ≤3% (Hans)

## Fase 1 · Content per categorie (Channable)
- [ ] Titels per categorie correct — rule `DE - ebay_title_de`/`_trim`, ≤80 tekens incl. compat, per categorie (Remschijven/Remblokken/Stuurdelen/Wiellagersets) [kritisch] (Hans)
- [ ] Omschrijvingen per categorie — rule `DE - ebay_desc_de`, sectie schijf + blok, gegate op `categories_clean_single_de` [kritisch] (Hans)
- [ ] GPSR-blok in elke omschrijving — A.B.S. All Brake Systems B.V., Tinbergenlaan 7, 3401 MT IJsselstein [kritisch] (Hans)
- [ ] Categorie + item specifics — Bremsscheiben 33564 / Bremsbeläge 57357; schijf Ø/dikte, blok WVA/maten (Hans)
- [ ] Marktprijs ±5% t.o.v. Amazon/eBay DE gecheckt (Luca)
- [ ] Preview 3 SKU (16880 · 37760 · 37770): correct Duits, geen dubbele spaties/streepjes [kritisch] (Hans)

## Fase 2 · Listing-selectie safeguard (Channable) — de €0,04-bescherming
- [ ] Include-veld `ebay_de_include` aangemaakt, default leeg voor alle ~39.684 SKU's [kritisch] (Hans)
- [ ] Channel-rule zet `include=true` op allowlist-categorieën of pilot-SKU-lijst [kritisch] (Hans)
- [ ] eBay DE channel-filter: exporteer alleen items waar `include=true` [kritisch] (Hans)
- [ ] Item-teller in eBay DE-preview = exact bedoeld aantal (niet de volle feed) — voorkomt 30k @ €0,04 [kritisch] (Hans)
- [ ] Uitsluiten getest: categorie uit allowlist → verdwijnt uit export (Hans)

## Fase 3 · Order- & Track&Trace-flow
- [ ] **Magento: Duitsland toevoegen aan Allow Countries** (juiste store-view scope) + verzendmethode naar DE — blocker van de faalde DE-testorder; Hans/Luca kunnen dit zelf (admin) [kritisch] (Hans/Luca)
- [ ] eBay order-sync "Complete" actief in Channable (order in + verzendstatus terug) (Hans)
- [ ] DE-testorder verschijnt in Magento/administratie (na fix opnieuw versturen) (Hans/Luca)
- [ ] ABS API vult T&T (DPD) in generieke Magento-velden bij updates — ABS-kant (Niek)
- [ ] Trackingnr. van Magento via Channable terug naar eBay → koper ziet tracking (Hans)
- [ ] DPD DE-label + tarief werkend (schijven >5kg marge >15%) (Hans)
- [ ] Bevestigd op testorder: koper krijgt eBay bestelbevestiging + trackingmail (Hans)

## Fase 4 · Klantfactuur (besluit + tool)
- [ ] Besluit factuurpad — B2C niet verplicht, B2B wel; CCP-tool vs ABS-factuur (Sjoerd)
- [ ] Factuurtool gekozen indien gewenst: Billbee (Bol+eBay) of easybill (eBay/DE) (Hans)
- [ ] Tool gekoppeld aan eBay-account, DE-tarief/OSS ingesteld (Hans)
- [ ] Test B2B-order: factuur correct gemaakt + gemaild (Hans)
- [ ] Optioneel: nette review-uitnodiging als tekst/bijlage bij factuurmail (Hans)

## Fase 5 · Compliance (jouw listing-kant)
- [ ] GPSR Responsible Person op elke listing + verpakking [kritisch] (Hans)
- [ ] eBay Compliance Dashboard (Seller Hub): 0 geflagde listings (Hans)
- [ ] OSS actief + 19% DE-btw op listing en factuur (bevestigen adviseur) (Sjoerd)
- [ ] Impressum / AGB / Widerruf / Datenschutz live op shop + listings [kritisch] (Sjoerd)
- [ ] Lizenzero / VerpackG contract getekend + LUCID gekoppeld (Sjoerd)

## Fase 6 · Metrics & klantinteractie (na eerste orders)
- [ ] eBay Messages reactietijd bewaakt (Hans)
- [ ] INR / SNAD case-proces + eigenaar vastgelegd (Hans)
- [ ] Verkäufer-Cockpit / seller level gecheckt (Hans)
- [ ] Out-of-stock control tegen ~5 min sync-mismatch — config Hans/Luca; technisch/integratie → Atvise (Hans/Luca)

## Fase 7 · Groei (na live)
- [ ] Promoted Listings (Anzeigen) — start 2–5% ad-rate, ná content-check (Luca)

## Dependencies · buiten CCP-scope, wél bewaken
- [ ] Magento Allow Countries / DE-verzending config — geen aparte storefront nodig, alleen config; Hans/Luca zelf (verplaatst naar Fase 3) (Hans/Luca)
- [ ] CCP-eigen DE-factuur — advies: extern via tool i.p.v. Magento/ABS (Sjoerd)
- [ ] ABS API T&T-koppeling (ABS-kant) (Niek)
- [ ] Compliance-blockers afgerond (verkoop-gate) (Sjoerd)

---
*Klant-facing werkt maandag ook zonder de Magento-DE-storefront: eBay stuurt zelf bevestiging + trackingmail, B2C-factuur is niet verplicht. Bron: order-to-cash onderzoek 2026-07-06.*
