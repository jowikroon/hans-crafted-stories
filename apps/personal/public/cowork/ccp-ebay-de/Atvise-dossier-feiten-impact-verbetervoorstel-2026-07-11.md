# Dossier leveranciersrelatie Atvise — feiten, impact, verbetervoorstel

*Connect Car Parts × A.B.S. · 2026-07-11 · opgesteld voor OpenClaw-analyse · classificatie: internal*
*Bronnen: Magento admin (live), Magento REST API, Channable (project 314525, orderdetails + statuslogs), vault-incidentdossiers 06–10 juli, log.md. Elke claim heeft een bron; aannames zijn gemarkeerd.*

---

## 1 · Context

Keten: eBay/Bol/Amazon → Channable → **Magento 2** (2.4.7-p10) → D365/ABS.
Rolverdeling zoals afgesproken: **Atvise = Magento-platform** (techniek, werking, features, updates, integratie-onderhoud incl. de D365→Magento shipment-koppeling). Merchant-team = configuratie, kanalen, content. ABS-integratie = ABS-API-domein.
Aanleiding dossier: livegang eBay DE (window week 29) legde structurele gebreken in de shipment/track&trace-keten bloot, bovenop een reeks incidenten.

---

## 2 · Feiten-tijdlijn (met bewijs)

| Datum | Feit | Bewijs |
|---|---|---|
| ~mei–jul | D365→Magento shipment-aanmaak via API gebouwd en draaiend: **890 shipments**, alle met comment "Verzonden via API" | Magento REST API, shipments-analyse 11-07 |
| ~mei–jul | **888 van 890 shipments zonder trackingnummer** (99,8%) | Magento API: `tracks: []` op 888/890 |
| ~mei–jul | In het hele systeem zijn ooit **2 tracks** aangemaakt | `sales_shipment_track` bevat alleen entity_id 4 en 5 |
| 15 jun | Shipment aangemaakt; track pas **21 dagen later** (7 jul) toegevoegd | entity 4 hoort bij shipment van 15-06 |
| ~jun–jul | **17 Channable platform_failure-errors** onopgemerkt; fulfillments `null` op alle orders behalve 1 | Channable orders-log, analyse 11-07 |
| 6 jul | DE-testorders falen op order-import (Allow Countries) — door merchant zelf gediagnosticeerd en gefixt; geen signalering vanuit platform-leverancier | testorder-diagnose 06-07 |
| 7 jul 09:23 | Track-sync getest: entity 4 aangemaakt | `sales_shipment_track` |
| 7 jul | **Incident: DE-storeview op live geactiveerd zonder afstemming.** Channable-feed → 0 producten op álle kanalen (Amazon NL, Google Shopping, Bol, eBay); 13 order-import-errors; land-herkenning op inkomende orders brak | Incident-A4 08-07, Channable-API + Magento import-overview (feed=0 geverifieerd) |
| 7–8 jul | Volledige werkdag merchant-team verloren aan diagnose + herstel-coördinatie; go-live in gevaar; rollback moest door merchant worden aangevraagd | Incident-A4, log.md |
| 8 jul 05:53 | Track-sync entity 5 — **daarna stopt de track-sync volledig** | `sales_shipment_track`: geen entities meer na 08-07 |
| 8–10 jul | Orderpad DE door merchant-team zelf hersteld (Allow Countries-scope, verzendmethode DE); geen monitoring of nazorg vanuit leverancier waargenomen | log.md, checklist-dossier |
| 10 jul 13:17–13:30 | Echte eBay DE-order 144013198: shipment 126101351 automatisch aangemaakt (+13 min) — **zonder track** | Magento admin, live gecheckt 10-07 |
| 10 jul 14:18 | Laatste login Atvise-superuser (`ict@atvise.nl`, rol Administrators) | Magento Users-grid, gecheckt 11-07 |
| 11 jul | Merchant-analyse via Magento REST API (OAuth 1.0a): patroon 888/890 vastgesteld; **root cause: de D365 ship-call stuurt geen `tracks`-array mee** | API-analyse 11-07 |
| 11 jul 19:34–19:47 | Merchant injecteert tracks op 144013192 (entity 6) en 144013198 (entity 7); **volledige keten Magento→Channable→eBay bewezen: fulfillment + tracking bij eBay in 11 minuten** | entity_id 6/7, Channable fulfillment, eBay-order |
| 11 jul | Werkend formaat vastgesteld (3× bewezen): `carrier_code: "custom"`, `title: "DPD"`, 14-cijferig nummer | injectie-tests |

### Login-/activiteitsbewijs (Magento, gecheckt 11-07 ±22:15)

| Account | Rol | Laatste login |
|---|---|---|
| Atvise (superuser, ict@atvise.nl) | Administrators | **10 jul 2026, 14:18** |
| Merchant-account | Administrators | 11 jul 2026, 22:15 (deze analyse) |
| ABS-accounts (2×) | Administrators | 9 jul · 8 jul |
| ABS-operations-account | Administrators | 5 mei |
| Agency-account (mcc@thinkyellow.nl) | Administrators | 15 jun |

**Beperking + bevinding tegelijk:** Magento registreert alleen de *laatste* login per account; er is geen login-historie en geen admin-action-log-module actief. Activiteit tijdens het incident van 7–8 juli is dus **niet reconstrueerbaar** — er is geen audit trail van wie wat wanneer wijzigde op live. Voor een platform waarop een externe partij superuser is, is dat op zichzelf een governance-gat (zie voorstel 5).

---

## 3 · Impact

| Gebied | Impact |
|---|---|
| Klantbelofte | 888/890 zendingen zonder tracking → koper krijgt geen trackingmail; op marketplaces telt dit direct in valid-tracking-rate en Late-Shipment-metrics (DACH-norm ≤3%) en dus in zichtbaarheid en verkooprecht |
| eBay DE go-live | T&T was dé resterende ketenschakel; zonder fix geen verantwoorde livegang. Root cause lag 2 maanden onopgemerkt in productie |
| Incident 7 jul | Feed 0 op alle verkoopkanalen (omzetrisico volle breedte), 13 order-errors, 1 werkdag verloren, go-live-planning geraakt |
| Vertrouwen/controle | Wijziging op live zonder afstemming; geen eigen monitoring (17 errors onopgemerkt); testactiviteit (2 tracks) zonder afronding of terugkoppeling |
| Kosten | Diagnose, herstel en ketenbewijs zijn door het merchant-team gedaan — werk dat binnen de leveranciersscope viel |

---

## 4 · Oorzaken-analyse

1. **Technisch:** de D365→Magento ship-call is half af — shipments worden aangemaakt, maar de `tracks`-array ontbreekt in de call. Het werkende formaat is triviaal en inmiddels 3× bewezen (`carrier_code: "custom"`, `title: "DPD"`, nummer). Dit is geen complexe fix.
2. **Proces:** geen definition-of-done op de oplevering (er is getest tot "shipment verschijnt", niet tot "tracking bij de marketplace-koper"); testactiviteit op 7–8 juli gestopt zonder afronding of melding.
3. **Monitoring:** geen bewaking op het eigen resultaat (Channable-errors, lege trackvelden) — het faalpercentage van 99,8% is door de merchant ontdekt, niet door de leverancier.
4. **Change-management:** wijziging met productie-brede impact (storeview) zonder aankondiging, afstemming of stand-by; herstel op initiatief van de merchant.
5. **Auditbaarheid:** geen action-logging op een omgeving waar een externe superuser op werkt — activiteit is achteraf niet aantoonbaar (voor geen van de partijen, ook niet ontlastend).

---

## 5 · Verbetervoorstel

| # | Voorstel | Eigenaar | Termijn |
|---|---|---|---|
| 1 | **Ship-call afmaken:** `tracks`-array meesturen in de D365→Magento ship-call, exact in het bewezen formaat. Acceptatie = 3 opeenvolgende productie-orders met tracking automatisch tot op de eBay-order | Atvise/integratie | vóór livegang-opschaling |
| 2 | **Definition-of-done op opleveringen:** een koppeling is af als het resultaat end-to-end bij de eindbestemming (marketplace/koper) is aangetoond, niet als de call een 200 geeft | beide | direct |
| 3 | **Monitoring op resultaat:** dagelijkse geautomatiseerde check "shipments zonder track > 24 u" + Channable-errorteller, met alert. (Query bestaat al — is deze analyse.) | merchant (bouwt), leverancier (volgt op) | deze week |
| 4 | **Change-policy live-omgeving:** geen wijzigingen op productie zonder vooraf-afstemming en stand-by; bij incident: melding binnen 1 uur, herstel-eigenaarschap bij veroorzaker | Atvise | per direct, schriftelijk bevestigen |
| 5 | **Audit trail aanzetten:** admin action logging (module) + login-historie, zodat activiteit van álle admin-accounts aantoonbaar is — beschermt ook de leverancier | Atvise | 2 weken |
| 6 | **Vangnet tot fix 1 live is:** merchant-injectie van tracks via de Magento API (bewezen werkwijze, 11 min tot eBay) als dagelijkse routine op open shipments | merchant | actief |

---

## 6 · Samenvatting in drie zinnen

De shipment-koppeling draait al twee maanden op 99,8% faalratio voor tracking (888/890), zonder dat de bouwer dit zag; de root cause (geen `tracks`-array in de ship-call) is door het merchant-team gevonden en het werkende alternatief is dezelfde middag 3× bewezen tot op eBay. Daarbovenop veroorzaakte een onaangekondigde live-wijziging op 7 juli een productie-breed feed- en order-incident dat een werkdag en bijna de go-live-planning kostte. Het voorstel: koppeling afmaken op het bewezen formaat, resultaat-monitoring en audit-logging inrichten, en een harde change-policy voor de live-omgeving — de merchant heeft het vangnet al draaien.

---

*Bijlagen in de vault (_cowork/ccp-ebay-de/): Incident-Magento-DE-storeview-A4 · testorder-diagnose 06-07 · stoplicht-orderflow 07-07 · TT-bewijs-magento-shipment 08-07 · root-cause-log order 144013198 (log.md 10-07) · golive-status/golive-checklist-status.json (audit-trail).*
