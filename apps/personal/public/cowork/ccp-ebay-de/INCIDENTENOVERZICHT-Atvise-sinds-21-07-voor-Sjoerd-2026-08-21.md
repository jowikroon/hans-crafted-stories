# Incidentenoverzicht Magento-platform — periode 21 juli t/m 21 augustus 2026

*Connect Car Parts · opgesteld 21-08-2026 · voor: Sjoerd, t.b.v. gesprek met Atvise · classificatie: internal*

Dit overzicht bevat uitsluitend feiten met bron en datum. Aannames en onbevestigde punten zijn expliciet gemarkeerd. Interpretatie en weging zijn aan de lezer. Voor de periode t/m 11 juli bestaat een apart dossier: `Atvise-dossier-feiten-impact-verbetervoorstel-2026-07-11.md` (890 shipments / 888 zonder track, storeview-incident 7 juli, 17 platform_failures).

**Keten:** eBay/Bol/Amazon → Channable (project 314525) → Magento 2 (Adobe Commerce, Hyvä) → D365/ABS.
**Rolverdeling zoals vastgelegd:** Atvise = Magento-platform: techniek, werking, updates, maatwerkmodules (9), hosting/DNS/CDN incl. Cloudflare. Merchant-team = configuratie, kanalen, content.

---

## 1 · Tijdlijn sinds de platformupdate

| Datum | Feit | Bron |
|---|---|---|
| 11-07 | Magento-versie **2.4.7-p10** vastgesteld (REST API, setup-analyse) | Magento-setup-analyse 11-07 |
| 21-07 | Magento-versie **2.4.8-p5** gemeten: geautoriseerde API-call geeft 200 op die versie | Edge-function-test magento-track-push, log 21-07 |
| 21-07 | Volgens merchant-administratie de datum van de platformupdate door Atvise | Merchant; exacte changelog bij Atvise op te vragen |
| 22-07 | Vraag aan Atvise (Dylan) over ontbrekende trackingnummers in de D365-ship-call verzonden | Mail 22-07 |
| 25-07 | Magento REST API onbereikbaar voor niet-browser-clients: Cloudflare-challenge ("Just a moment…", HTTP 403) op geautoriseerde API-verzoeken | Meting 25-07, herhaald 20-08 en 21-08 |
| 28-07 | Vraag van 22-07 onbeantwoord; merchant beantwoordt de wedervraag zelf via Magento-forensiek. Stand: **959 shipments, 5 met track, alle 5 handmatig door merchant** | 2026-07-28-D365-veld-antwoord-en-TT-plan.md |
| 28-07 | Cloudflare blokkeert database-/sandbox-IP's, edge-IP's wel toegelaten (meting tijdens forensiek) | idem |
| 03-08 | Melding merchant aan Channable: **alternative-ID-mapping leeg na "Magento + Magmodules-update afgelopen week"; alle Magento product-ID's gewijzigd; orders gaan met verkeerde producten de deur uit** | Mail Hans → Channable 03-08, 09:56 |
| 04-08 | Order 144013320: bestelregel lost op naar het verkeerde product. Vandaag (21-08) live geverifieerd in Magento: entity-ID 18722 = SKU 422292 (remklauw Mercedes), terwijl SKU 18722 = remschijf Audi/VW (entity 5270) | Channable-orderlog · Magento REST 21-08 |
| 06-08 | Mapping-incident opgelost: dubbele Magento-orderconnection in Channable verwijderd (import gebruikte connection 241541, orders 240631), mapping herbouwd, orders matchen weer op SKU | Mailthread Channable, afgesloten door Hans 06-08 |
| 20-08 | **20.013 van 23.966 producten zonder (actieve) categoriekoppeling in de Magento-uitlevering** — alle vier categorievelden leeg op exact deze set; koppeling zelf werkt correct (70 velden) | MAGENTO-CATEGORIEGAT-oorzaak-en-fix-2026-08-20.md |
| 21-08 | **Betaalde Duitse eBay-order niet in Magento geland, status platform_failure** (Channable Orders API, 62 orders geanalyseerd). Zelfde foutklasse als de Allow-Countries-bevindingen van 06/07 juli, die toen door het merchant-team zelf zijn hersteld | Payloadanalyse 21-08 |
| 21-08 | Pad `/blog` antwoordt **HTTP 403 met `cf-mitigated: challenge` op een verzoek met volledige Chrome-browser-user-agent** (zonder JavaScript-uitvoering). Homepage zonder browser-UA: eveneens 403 | curl-meting 21-08, cf-ray a2ea1a42…-AMS |

---

## 2 · Openstaande storingen per 21-08

| # | Storing | Sinds | Status | Waar de fix ligt |
|---|---|---|---|---|
| 1 | Shipments zonder trackingnummer: D365-ship-call stuurt geen `tracks`-array mee. Vraag hierover van 22-07 is per 28-07 onbeantwoord; antwoordtekst voor Atvise ligt sindsdien klaar | ≥ mei | open | Atvise/integratie (ship-call), per dossier 11-07 |
| 2 | Cloudflare-challenge op niet-browser-verkeer: REST API, monitoring en curl krijgen 403. Merchant-integraties draaien op een user-agent-workaround | ≥ 25-07 | open | Cloudflare-zone: Atvise |
| 3 | `/blog` gechallenged, ook met browser-user-agent zonder JS | meting 21-08; begindatum onbekend | open | Cloudflare-zone: Atvise |
| 4 | 20.013 producten zonder actieve categoriekoppeling in de uitlevering. Gevolg: 61,9% van de feed ongecategoriseerd; marketplace-verrijking bereikt ~16% van de items. Correctiebestand (25.765 rijen) ligt klaar aan merchant-zijde | meting 20-08; begindatum onbekend | open | Magento-catalogus; import-CSV klaar |
| 5 | platform_failure op betaalde DE-order; vermoedelijke oorzaak: Allow-Countries-instelling op een storeview-scope **[onbevestigd]** | meting 21-08 | open | Magento-config; check bij Atvise gevraagd |

---

## 3 · Verkeer sinds 21-07 — wat meetbaar is en wat niet

**Waarneming merchant:** sinds de update van 21-07 is het webshopverkeer sterk gedaald; blogpagina's die organisch verkeer hadden, ontvangen dat niet meer; advertentie-omzet herstelt langzamer dan organisch.

**Onafhankelijke meting vanuit merchant-tooling is op dit moment niet mogelijk:**

| Bron | Status |
|---|---|
| Cloudflare-analytics connectcarparts.nl | Zone staat in het Atvise-account; merchant-token ziet alleen andere domeinen. Cijfers (requests, challenges-served, bot-classificatie per dag) zijn daar direct beschikbaar |
| GA4 / Search Console | Cijfers aan te leveren door merchant-team (Sjoerd/Hans) als bijlage bij dit overzicht |
| Ahrefs | Huidige plan geeft geen site-explorer-historie |

**Feitelijk raakvlak tussen de traffic-klacht en de metingen in §1:** een Cloudflare-challenge wordt alleen opgelost door een client die JavaScript uitvoert. Elke client die dat niet doet krijgt op de gechallengde paden een 403. De meting van 21-08 laat zien dat `/blog` in die situatie zit. Of zoekmachine-crawlers hierdoor geraakt worden, hangt af van de zone-instellingen (verified-bots-uitzondering, challenge-type, sinds wanneer actief) — die zijn alleen bij Atvise in te zien.

---

## 4 · Vragen aan Atvise (feitelijk te beantwoorden)

1. **Changelog 21-07:** welke onderdelen zijn bij de update gewijzigd (Magento-core 2.4.7-p10 → 2.4.8-p5, modules incl. Magmodules Channable Connect, thema, serverconfig, Cloudflare-regels), en op welke datum/tijd per onderdeel?
2. **Entity-ID's:** waardoor zijn bij de update de product-entity-ID's gewijzigd (reïndex/migratie/herimport), en is dit vooraf bekend geweest? Dit was de directe aanleiding van het verkeerde-producten-incident van 03/04-08.
3. **Cloudflare:** welke WAF-/bot-regels staan actief en sinds wanneer; is er een verified-bots-uitzondering (Googlebot/Bingbot); wat tonen de zone-analytics aan "challenges served" per dag vanaf 14-07; en staat er een challenge op het pad `/blog`?
4. **Categoriekoppeling:** waardoor hebben 20.013 producten geen actieve categorie in de uitlevering, en is dit te herleiden tot de update? Het merchant-team heeft een correctie-importbestand klaarstaan.
5. **Allow Countries:** graag bevestiging van de huidige instelling op alle scopes (default + storeview 'de'), n.a.v. de platform_failure op een betaalde DE-order (21-08).
6. **Ship-call:** status van de `tracks`-array-fix waar op 22-07 naar gevraagd is; het bewezen werkende formaat (`carrier_code: custom`, `title: DPD`, 14-cijferig) staat in het dossier van 11-07.

---

## 5 · Bijlagen / bewijsstukken

- `Atvise-dossier-feiten-impact-verbetervoorstel-2026-07-11.md` — periode t/m 11-07
- Mailthread "Alternative ID mapping – Magento – Channable" (03-08 t/m 06-08)
- `2026-07-28-D365-veld-antwoord-en-TT-plan.md` — shipment-forensiek, 959/5-meting
- `MAGENTO-CATEGORIEGAT-oorzaak-en-fix-2026-08-20.md` + correctie-CSV (25.765 rijen)
- Curl-metingen 21-08 (reproduceerbaar): `/blog` met Chrome-UA → 403 `cf-mitigated: challenge`; homepage zonder UA → 403; REST `/rest/V1/modules` met browser-UA + geldig token → 200
- Magento REST-verificatie 21-08: entity 18722 = SKU 422292 (remklauw); SKU 18722 = entity 5270 (remschijf)

*Aan te vullen door merchant-team vóór verzending: GA4-sessies per week (jun–aug) en Search Console-clicks per week voor de blogpaden, als bijlage bij §3.*
