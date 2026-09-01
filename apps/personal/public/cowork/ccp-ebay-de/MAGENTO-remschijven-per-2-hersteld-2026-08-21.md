---
type: uitvoering + diagnose
scope: CCP · Magento 2.4.7-p10 · remschijven verkoopeenheid
status: uitgevoerd en geverifieerd
created: 2026-08-21
last_reviewed: 2026-08-21
bron: Magento REST API (Bearer MAGENTO_TOKEN) · live productpagina · v_channable_import
---

# Remschijven staan weer op per 2 — uitgevoerd

**Alle 214 remschijven in Magento staan nu op `qty_increments = 2`. Op de live productpagina van 16883 staat het aantal-veld op `min 2, step 2` waar het vanochtend nog `min 1, geen step` was.**

## 1 · Magento-toegang werkt

De Bearer-route werkt gewoon; de OAuth1-sleutels met die scheve `CONSUMER_SECRET` zijn niet nodig.

```
GET /rest/V1/store/storeConfigs   → 200
GET /rest/V1/products/16883       → 200
```

Wat wel nodig bleek: een normale browser-user-agent. Met de standaard Python-user-agent blokkeert Cloudflare. Dat verklaart de eerdere 403's — het lag niet aan de sleutel.

## 2 · Wat er werkelijk aan de hand was

Niet wat ik vanochtend vermoedde. Geen prijsomzetting en geen artikelomzetting.

**Het Magento-artikel is en was altijd één losse schijf.** De prijs van €16,95 voor 16883 is de stuksprijs. Wat de webshop per paar liet verkopen was de instelling **Qty Increments = 2** in Advanced Inventory. Die is bij een deel van het assortiment verdwenen.

| | Aantal |
|---|---:|
| Remschijven in Magento | 214 |
| Stonden nog goed op `qty_increments = 2` | **97** |
| Waren teruggezet naar 0 / uit | **117** |

En je waarneming klopt precies: **van de 100 remschijven die live op eBay staan had er nog maar één de instelling** (16880). De omzetting heeft dus vrijwel exact de eBay-set geraakt. Dat is geen toeval maar een bulk-actie die die selectie te pakken had.

Wat het gewicht van 2,7 kg bij een prijs van €16,95 betreft — mijn redenering van vanochtend was fout. Het gewichtsveld in Magento staat gewoon op de paar-waarde terwijl de prijs per stuk is. Dat is een aparte inconsistentie, geen bewijs van een prijsomzetting.

## 3 · Wat ik heb gedaan

Per SKU, via `PUT /rest/V1/products/{sku}/stockItems/{itemId}`:

```json
{"stockItem": {
  "qty_increments": 2,
  "enable_qty_increments": true,
  "use_config_qty_increments": false,
  "use_config_enable_qty_inc": false
}}
```

- Eerst één product als test (16883), geverifieerd, daarna de overige 116
- **117 bijgewerkt, 0 mislukt**
- Steekproef van 28 producten teruggelezen: allemaal `qty_increments = 2`, `enable = true`
- Live gecontroleerd op `connectcarparts.nl/16883-remschijf`: aantal-veld nu `value 2, min 2, step 2`

Ik heb alleen deze vier velden aangeraakt. Prijs, voorraad, status en alle overige attributen zijn ongemoeid.

**Backup:** `magento-backup-remschijven-stockitems-2026-08-21.json` — de volledige stand van alle 214 stock items vóór de wijziging, inclusief prijs, voorraad en item_id. Terugzetten kan met dezelfde PUT.

## 4 · Waarom per 2 de juiste keuze is

Niet omdat het zo was, maar omdat de leverancier het zo levert:

| Categorie | `moq` bij A.B.S. | SKU's |
|---|---:|---:|
| **Remschijven** | **2** | 214 |
| Remblokken | 1 | 3.442 |
| Remklauwen | 1 | 23 |
| Remvloeistof | 1 | 11 |

Alle 214 remschijven hebben minimumafname 2 bij A.B.S. Er is dus geen enkele remschijf waar per 1 verkopen klopt met de inkoopkant.

## 5 · Wat dit níét oplost

**De eBay-orderflow is hiermee niet gerepareerd.** Qty Increments is een winkelwagenregel op de webshop. Een order die Channable via de API aanmaakt gaat daar langsheen. Een eBay-order van 1 komt nog steeds binnen als 1 stuk in Magento, terwijl de koper er 2 betaalde.

Dat blijft dus staan, en het is de reden om de remschijven op eBay voorlopig op voorraad 0 te zetten — dat bestand staat klaar.

## 6 · Wat ik onderweg tegenkwam en apart aandacht vraagt

**Twaalf listings waar de eBay-paarprijs te laag staat.** In `REMSCHIJVEN-prijsafwijkers-ebay-2026-08-21.csv`. Vijf daarvan staan op exact de Magento-stuksprijs — je verkoopt daar een paar voor de prijs van één schijf:

| SKU | Magento per stuk | eBay per paar | Zou moeten zijn | Verlies per order |
|---|---:|---:|---:|---:|
| 18722 | € 113,41 | € 113,41 | € 226,82 | **€ 113,41** |
| 18535 | € 79,61 | € 79,61 | € 159,22 | € 79,61 |
| 18643C | € 74,84 | € 74,84 | € 149,68 | € 74,84 |
| 18536 | € 57,46 | € 57,46 | € 114,92 | € 57,46 |
| 18408 | € 44,73 | € 44,73 | € 89,46 | € 44,73 |

Plus zeven waar de ratio tussen 1,14 en 1,56 ligt in plaats van rond 2. Zolang die listings op voorraad 0 staan gebeurt er niets, maar zet ze niet terug voordat dit klopt.

**De voorraad op eBay en in Magento lopen ver uiteen.** 15857 staat op 138 in Magento en 8 op eBay; 15704 op 8 in Magento en 30 op eBay. Die eBay-listings worden niet door het huidige kanaal gevoed, dus de cijfers daar zijn bevroren. Bij het terugzetten moet de voorraad opnieuw synchroniseren.

**Het gewichtsveld.** Bij 16883 staat 2,7 kg terwijl de prijs per stuk is. Voor de verzendkostenberekening in het margemodel maakt dat verschil. Ik heb het niet aangeraakt omdat ik niet weet of Magento dat gewicht per stuk of per zending gebruikt — dat wil ik eerst met je nakijken.

## 7 · Volgende stap

Zoals afgesproken eerst de webshop, dan de marketplaces. De webshop staat. Voor eBay ligt klaar:

- `ebay-remschijven-OFFLINE-voorraad0-2026-08-21.csv` — 100 listings op voorraad 0
- `ebay-remschijven-TERUG-originele-voorraad-2026-08-21.csv` — om ze terug te zetten
- `REMSCHIJVEN-prijsafwijkers-ebay-2026-08-21.csv` — 12 prijzen die eerst moeten kloppen
