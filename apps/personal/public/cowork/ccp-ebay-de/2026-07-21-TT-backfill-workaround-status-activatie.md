---
title: Permanente T&T-backfill workaround — status + activatie (2 secrets)
date: 2026-07-21
scope: [CCP]
topics: [eBay-DE-Launch, Channable-D365-Integration, ABS-Brand-Profile]
status: push-kant durable + live; wacht op 1x Magento-token minten; ABS-kant via Chrome
---

# Permanente T&T-backfill — hij bestaat al, draait op 2 secrets na

**Kernconclusie (geverifieerd live 2026-07-21):** de permanente workaround die je vraagt — elk uur T&T uit ABS halen en via de Magento API in het juiste shipment-track-veld zetten — is op 11 juli al gebouwd én gescheduled in Supabase (`pesfakewujjwkyybwaom`). Hij staat compleet stil op **twee ontbrekende secrets**. Geen nieuwe bouw nodig; alleen activeren.

De ABS-API-route is bewust gekozen boven Claude-Chrome-scraping: schoner, geen browsersessie, geen login-automatisering. Chrome is alleen de fallback als ABS geen API-token geeft (zie onderaan).

---

## Architectuur (3 componenten, autonoom)

```
[elk uur :10]  abs-track-harvest      ABS API v2 packingslip/list  ->  magento_track_queue
[elke 30 min]  magento-track-push     magento_track_queue          ->  Magento POST /rest/V1/shipment/track
               (Channable leest de shipment-track uit -> eBay/Bol toont T&T aan koper)
```

| Component | Wat het doet | Cron | Status |
|---|---|---|---|
| `abs-track-harvest` (edge function) | `GET api.abs-bv.com/v2/packingslip/list?order_date=dd-mm-yyyy`, pakt per pakbon `containers[].tracking.tracking_number`, matcht op `order_reference` = Magento increment_id (9 cijfers), upsert naar queue | `10 * * * *` (nu hourly) | ACTIVE |
| `magento_track_queue` (tabel) | buffer met dedupe op (track_number, order_increment_id), status pending/pushed/error, 5 retries | — | **leeg** |
| `magento-track-push` (edge function) | leest pending, resolvet shipment/order entity_id via Magento search-API, `POST /rest/V1/shipment/track` met `carrier_code:"custom" / title:"DPD" / track_number` | `*/30 * * * *` | ACTIVE |

Dit schrijft exact naar het veld dat Niek en Atvise bedoelen: `sales_shipment_track` op de bestaande shipment. Het werkt dus ook als backfill op de track-loze shipments die de D365-koppeling nu aanmaakt.

Terzijde: "autoccp" uit je bericht = je eigen edge-function-suite (`autoccp-orderflow-health` elke 30 min, `autoccp-brief` 06:30 + 15:30, `autoccp-heartbeat`) — die monitort de orderflow, hij vult zelf geen T&T.

---

## Live status — waarom er nu niets stroomt

Geverifieerd op 2026-07-21:

- Beide edge functions bestaan en zijn ACTIVE; beide crons staan aan.
- `magento_track_queue` is **volledig leeg** (0 rijen).
- `abs-track-harvest` bevat: `if (!ABS_TOKEN) { skipped = true; return }` — zonder token schrijft hij nooit in de queue.
- `magento-track-push` bevat: `if (!MAGENTO_TOKEN) { skipped = true; return }` — zonder token pusht hij nooit.

Lege queue + actieve harvest = de harvest slaat elke run over. Conclusie: **de twee secrets staan niet (geldig) in Supabase.** Dit is exact wat de bouwnotitie van 11 juli al vastlegde ("compleet op 2 secrets na").

---

## De Magento-token bestond nergens — geverifieerd 2026-07-21

Uitputtend gezocht, overal leeg: n8n (68 workflows, 31 credentials — geen Magento), Supabase `cms_secrets` + `hvl_secrets` (geen Magento), `.env` + alle backups (`.env.bak-20260710`, `.env.tmp`, `.env.example`, `ENV-INVULLEN`), en de edge-secret zelf (functie meldt `token_source: none`). De vault-log van 11-07 zegt het letterlijk: "MAGENTO_TOKEN bestaan nog nergens — Integration aanmaken." Er is dus niets kwijt; de token is nooit aangemaakt. Hij moet één keer gemint worden.

## Permanente fix tegen verdwijnende tokens (2026-07-21)

`magento-track-push` v3 leest de token nu uit een **durable DB-store** i.p.v. een ephemeral env-secret:

1. `cms_secrets` (name=`magento_token`) — bron van waarheid, overleeft container-/redeploys (zelfde plek waar `channable_api_token` al staat).
2. env-secret `MAGENTO_TOKEN` — fallback.

Zo verdwijnt de token niet meer bij een redeploy. Menselijke backups (gelijk houden): Bitwarden-item "CCP Magento API Token", n8n-cred "Magento API", en de `MAGENTO_TOKEN`-regel in `_skill/adapters/.env`.

### Activatie — 1x minten, 1x in de durable store
1. **Mint** (alleen jij, Magento-admin): System → Integrations → Add New → resources **Sales (Shipments + Orders read)** → Save → **Activate** → kopieer de **Access Token**.
2. **Durable opslaan** (Supabase → SQL Editor, 1 regel):
   `insert into cms_secrets(name,value) values('magento_token','<TOKEN>') on conflict (name) do update set value=excluded.value;`
3. **Mirror** naar Bitwarden + `.env` (`MAGENTO_TOKEN=`) + n8n-cred — voor de menselijke redundantie die je wil.
4. **Verifieer:** open `…/functions/v1/magento-track-push` → `token_source` moet `cms_secrets` zijn.

Waarde nooit via chat — plakken doe jij, in Supabase/Bitwarden/.env.

## ABS-kant: geen API-token → Claude-Chrome-harvest
Je krijgt geen ABS API-token, dus de `abs-track-harvest` API-route vervalt. De ABS-kant draait op de Chrome/portal-scrape (deterministische `tracktrace/<pakbonnr>` → DPD-parcelnummer) die dezelfde `magento_track_queue` vult. Dat is de eerstvolgende bouwstap; de push-kant (hierboven) is dan al klaar en durable.

---

## Al gedaan (2026-07-21)
- Harvest-cron elke 2u → **elk uur** (`10 * * * *`, jobid 11), conform je "ieder uur".
- `magento-track-push` v3 gedeployed: durable token-bron `cms_secrets` → env-fallback. Geverifieerd `token_source: none`, skip-safe.
- `MAGENTO_TOKEN`-blok toegevoegd aan `_skill/adapters/.env` met mint- + durable-store-instructie.
- Uitputtend geverifieerd dat de token nergens bestond (n8n, secret-stores, env-backups).

## Nog te doen (jij, 1x)
1. Magento Integration Access Token **minten** (admin → Integrations → Activate).
2. In `cms_secrets` zetten (SQL hierboven) + mirroren naar Bitwarden + `.env` + n8n-cred.
3. `magento-track-push` verifiëren op `token_source: cms_secrets`.
4. ABS-Chrome-harvest laten bouwen (vervangt de dode API-route).

---

## Fallback: Claude Chrome (alleen als ABS geen API-token geeft)
De ABS-portal heeft een deterministische T&T-URL per pakbon:
`abs-bv.shop/en/portal/orders/packingslips/tracktrace/<PAKBONNR>` → redirect naar DPD met het 14-cijferige `parcelNumber`. Route: Claude Chrome logt in de portal, leest de pakbonlijst (Your reference = Magento increment_id → pakbonnr), volgt de tracktrace-URL, plukt het parcelNumber uit de redirect, en vult daarmee dezelfde `magento_track_queue`. `magento-track-push` blijft ongewijzigd. Alleen bouwen als de API-route niet beschikbaar komt — de API is betrouwbaarder dan een browsersessie.

## Openstaand / onzeker
- Een deel van de pakbonnen had géén T&T (bv. NLPS260088071, 404) — te recent of andere carrier. De harvest maakt dit meetbaar zodra hij draait. [unverified waarom]
- Harvest kijkt 3 dagen terug; voor een eenmalige backfill van oudere orders die venster tijdelijk verruimen.

Gerelateerd: [[eBay-DE-Launch]] · [[Channable-D365-Integration]] · zie ook `2026-07-11-ebay-de-tt-diagnose-openclaw-correctie.md`, `2026-07-11-abs-portal-verkenning.md`
