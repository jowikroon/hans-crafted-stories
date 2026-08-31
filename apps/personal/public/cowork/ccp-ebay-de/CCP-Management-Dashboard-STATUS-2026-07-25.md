---
title: CCP Management Dashboard — gebouwd, live geverifieerd
date: 2026-07-25
scope: [CCP]
topics: [eBay-DE-Launch, Channable-D365-Integration, Magento, Track-and-Trace]
status: live · alle checks draaien tegen echte API's · 2 openstaande bouwstappen bij Hans
---

# CCP Management Dashboard — wat er nu staat

Twee dashboards plus twee edge functions. Alles read-only richting Magento, alle sleutels server-side.

| Bestand | Wat |
|---|---|
| `CCP-Command-Dashboard.html` | Management-dashboard: verkoop, orderflow, keten-run, Magento-health, sleutelbeheer |
| `CCP-Package-Flow.html` | Experimenteel: geanimeerde pakketreis rechts→links, echte doorlooptijden |
| edge `ccp-ops-api` | health · magento_health · sales · credentials · PIN |
| edge `ccp-ops-link` | Channable↔Magento↔T&T-koppeling met matchdiagnose |

Beide HTML-bestanden zijn zelfstandig: dubbelklikken opent ze, geen server of build nodig.
Project: Supabase `pesfakewujjwkyybwaom`. Sleutelbron: `cms_secrets` — dezelfde durable store die
`magento-track-push` al gebruikt.

---

## Wat de live run vandaag zegt

Keten-run 2026-07-25, 1.659 ms, 13 stappen: **8 ok · 2 fail · 3 skip**.

| # | Stap | Uitkomst |
|---|---|---|
| 1 | Supabase secret-store | ok — 7 sleutels |
| 2-5 | Channable auth + orderfeed | ok — 36 orders, `error_count=0`, 0 openstaande verzendingen |
| 6 | Magento token (read) | ok — HTTP 200, bron `cms_secrets` |
| 7 | Magento onderdelen | ok — **14/14** |
| 8 | `magento_track_queue` leesbaar | ok — 0 rijen |
| 9 | Harvest levert T&T aan | **fail** — queue leeg |
| 10-12 | eBay · Bol · n8n | skip — sleutels nog niet ingevuld |
| 13 | Keten koop→T&T | **fail** — 1 blokker |

**Magento is volledig gezond** (alles read-only geverifieerd): orders 1.298 · shipments 949 ·
invoices 1.016 · credit memos 3 · producten 40.049 · store views 3 · websites 2 · klanten 235 ·
CMS 8 · BTW-tarieven 97 · kortingsregels 4 · MSI-bron 1 · categorieboom · store configs.

---

## Drie bevindingen die het dashboard blootlegt

### 1 · T&T bereikt nul kopers — bevestigd op ordersniveau
17 van 18 echte orders staan op verzonden, **0** heeft een trackingnummer.
`magento_track_queue` is nog steeds leeg. Dit bevestigt het T&T-dossier van 21-07 met harde cijfers:
de push-kant werkt (Magento-token geldig, `token_source: cms_secrets`, HTTP 200), maar de **ABS-kant
levert niets aan**. De API-route verviel omdat A.B.S. geen token geeft; de Chrome-harvest is nooit
gebouwd. Dát is de enige ontbrekende schakel.

### 2 · Magento bewaart geen marketplace-ordernummer
Van 300 gescande Magento-orders heeft **0** een gevulde `ext_order_id`. Er bestaat dus geen harde
sleutel tussen marketplace-order en webshop-order. Het dashboard matcht daarom op e-mailadres +
bedrag: **5 van 18** lukt. De overige 13 zijn blind — óf ze bestaan niet in Magento, óf ze zijn niet
te herkennen. Structurele fix: laat de Channable-Magento-plugin (of D365) het marketplace-ordernummer
in `ext_order_id` schrijven. Zonder die sleutel blijft elke orderreconciliatie een gok.

### 3 · Wat je nu meet is bijna volledig testverkeer
Van 36 Channable-orders zijn er **18 pure testorders** ("Test item"). Van de resterende 18 zijn de
meeste door jezelf geplaatst (eBay-gebruiker `vanle-5833`, klantnaam Hans van Leeuwen) tegen €1-7.
Echte omzet 30d na filtering: **€14,00 over 7 orders**. Het dashboard filtert testorders standaard weg
en laat het aantal zien dat het wegliet — anders bouw je een dashboard op ruis.

Ter vergelijking: Magento heeft in dezelfde periode webshop-orders van €41,30 en €71,12. De echte
CCP-omzet loopt dus buiten Channable om; het €100K-cijfer in het dashboard is daarom **handmatig**
(nu €18.947 per W19) en niet uit Channable afgeleid.

---

## Doorlooptijden (mediaan, echte orders)

| Schakel | Mediaan |
|---|---|
| Marketplace → Channable | 5 min |
| Channable → Magento | 0 min (wanneer de match lukt) |
| Magento → verzonden | 18 uur |
| Verzonden → T&T bij koper | **geen data** — gebeurt nooit |

---

## Sleutelbeheer — bewust twee gescheiden lagen

**API-sleutels → Supabase `cms_secrets`, server-side.** Ingevuld op het tabblad Toegang, beschermd met
een beheer-PIN (SHA-256, waarde nooit opgeslagen). De backend geeft een sleutel **nooit terug** — je ziet
alleen of hij gevuld is en de laatste vier tekens. Dezelfde store voedt de edge functions en n8n, dus
één keer invullen werkt overal.

Slots: `channable_api_token` · `channable_company_id` · `channable_project_id` · `magento_base_url` ·
`magento_token` · `ebay_client_id` · `ebay_client_secret` · `ebay_refresh_token` · `bol_client_id` ·
`bol_client_secret` · `n8n_base_url` · `n8n_api_key`.

**Login-wachtwoorden → NIET naar Supabase.** eBay-, Bol-, ABS-portal- en Magento-admin-wachtwoorden gaan
bewust niet naar de cloud: dat botst met je eigen §8-regel en met `access-pointers.md`. Het tabblad
Toegang geeft er in plaats daarvan twee knoppen voor: kopieer de `.env`-regels voor
`_skill/adapters/.env`, of kopieer een kant-en-klare Chrome-login-opdracht die naar die `.env` verwijst
in plaats van het wachtwoord te bevatten. Lokaal bewaren in de browser kan, maar staat standaard uit en
is expliciet gemarkeerd als onversleuteld.

De PIN is nog **niet** gezet — dat doe jij bij de eerste keer opslaan (de eerste PIN die je invult wordt
de PIN). Ik heb er bewust geen aangemaakt: een PIN die ik verzin zou via de chat moeten lopen.

---

## Verificatie — wat is echt getest

Tier 1, deterministisch geverifieerd tegen live API's:

- 13-stappen keten-run uitgevoerd, elke stap met echte HTTP-status en responstijd.
- 14 Magento read-endpoints, allemaal HTTP 200, met recordaantallen.
- Channable orders-API: 36 orders, 3 paginaties, veldstructuur geïnspecteerd.
- Beide dashboards headless gerenderd (jsdom) tegen de **echte** payload: **19/19 controles geslaagd,
  nul runtime-fouten**. Gecontroleerd: KPI-vulling, grafiek, kanaalverdeling, doorlooptijdbalken,
  €100K-tracker, top-SKU's, trechter, orderflowtabel, ketenrail, koppeldiagnose, stations, statuslamp.
- Beveiliging: geen auth-header → HTTP 401. PIN < 6 tekens → geweigerd zonder bijwerking.
  Onbekende sleutelnaam → geweigerd. `cms_secrets` heeft een unieke index op `name`, dus de upsert klopt.
  Geen service-role-key in de HTML (alleen de publieke anon-key).

Tier 2, vendor-afhankelijk, nog niet gedraaid omdat de sleutels ontbreken: eBay OAuth, Bol OAuth,
n8n API. De code-paden staan er, de checks melden nu eerlijk `skip` in plaats van groen te doen alsof.

Tier 3, handmatig: het `credentials_save`-schrijfpad achter de PIN. De validatie is getest, de
daadwerkelijke schrijfactie doe jij bij de eerste opslag.

---

## Wat er nu moet gebeuren

1. **ABS-Chrome-harvest bouwen** — de enige ontbrekende schakel voor T&T. Deterministische URL:
   `abs-bv.shop/en/portal/orders/packingslips/tracktrace/<PAKBONNR>` → DPD-parcelnummer → vult
   `magento_track_queue`. De push-kant staat klaar en is geverifieerd.
2. **`ext_order_id` laten vullen** in Magento door de Channable-plugin of D365. Zonder die sleutel
   blijft 13 van 18 orders onkoppelbaar.
3. **eBay-, Bol- en n8n-sleutels invullen** op het tabblad Toegang — dan worden stap 10-12 van de
   keten-run echte checks in plaats van skips.
4. **Security, los hiervan:** in Supabase-project `ccp-marketplace` (`kskumhtisifsdjjbzvbo`) staat op
   6 tabellen RLS uit (`ebay_listing_audit`, `marketplace_title_templates`,
   `marketplace_field_write_rules`, `ebay_ktype_source`, `ebay_sku_itemid`, `ebay_compat_master`).
   Iedereen met de anon-key kan die lezen en schrijven. Niet automatisch aangezet: RLS zonder policies
   blokkeert alles. Beslis zelf welke policies erbij horen.

Gerelateerd: [[eBay-DE-Launch]] · [[Channable-D365-Integration]] · zie ook
`2026-07-21-TT-backfill-workaround-status-activatie.md` en
`eBay-DE-100pct-data-verificatie-en-actieplan-2026-07-24.md`.
