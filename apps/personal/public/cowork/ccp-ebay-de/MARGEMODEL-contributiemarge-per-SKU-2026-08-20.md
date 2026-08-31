---
type: datamodel + bevinding
scope: CCP · Supabase · Channable-import 849793 · contributiemarge per SKU
status: live in de feed · parameters nog aannames
created: 2026-08-20
last_reviewed: 2026-08-20
bron: ccp_sku_attributes · abs_articles_pads · eBay all-active-listings 20-08 · Channable preview 20-08 · eBay-helppagina gebruikersgebühren
---

# Contributiemarge als attribuut op elk product

**Ja, dit kan — en het staat er al in. `marge_status` is nu een veld in `v_channable_import`, naast alle onderliggende bedragen. Filteren op "alle remblokken van A.B.S. met marge Gezond of Hoog" geeft 49 SKU's.**

Dat filter heb ik live getest via de feed. Het werkt zoals je het beschreef.

## 1 · Hoe het gebouwd is

Alles in Supabase, want Channable rekent slecht en jij wilt één waarheid. De feed pikt het automatisch op: import 849793 leest `v_channable_import` met `select=*`, dus elke nieuwe kolom komt vanzelf mee — zelfde route als `image_main_1600` vanmiddag.

```
ccp_kosten_parameters   per eBay-categorie: btw, commissie, vaste fee, advertentie%, verpakking, derving%
ccp_verzendtarieven     verzendkosten per gewichtsklasse
ccp_sku_prijs           bruto consumentenprijs per SKU, met herkomst en meetdatum
        │
        ▼
v_sku_marge             de hele berekening
        │
        ▼
v_channable_import      19 nieuwe velden bovenop de bestaande 74
```

**Nieuw in de feed:** `inkoopprijs`, `verkoopprijs_bruto`, `prijs_bron`, `prijs_gemeten_op`, `btw_percentage`, `netto_verkoopprijs`, `shipping_costs`, `verpakkingskosten`, `ebay_commissie_percentage`, `ebay_fee_variabel`, `ebay_fee_vast`, `ebay_fee_kosten`, `ebay_advertentie_percentage`, `ebay_advertentiekosten`, `overige_aftersales_kosten`, `contributie_marge_eur`, `contributie_marge_pct`, `marge_status`, `marge_compleet`.

Je berekeningen zijn precies zo overgenomen. `marge_status` gebruikt jouw vier drempels: < 0 Verliesgevend · 0–20 Laag · 20–50 Gezond · > 50 Hoog. Vijfde waarde `Onbekend` voor SKU's waar prijs of inkoop ontbreekt — beter dan ze stilzwijgend als verliesgevend tellen.

## 2 · Wat ik heb gerepareerd voordat dit kon

**De inkoopprijs stond op 150 van 3.442 remblokken.** In `abs_articles_pads.price` staat hij voor alle 3.442. Op de 150 overlappende SKU's is die waarde tot op de cent identiek aan wat er al in `ccp_sku_attributes.inkoopprijs` stond — dus dezelfde grootheid, niet een gok. Doorgezet: **3.688 van 3.690 SKU's hebben nu COGS.** Backup in `ccp_sku_attributes_bak_20260820_inkoop`.

Let op: `verkoopprijs_abs` in diezelfde tabel is de **ABS-adviesprijs**, niet onze verkoopprijs. Gemiddeld €65 terwijl we op eBay €25 vragen. Misleidende veldnaam, niet gebruiken voor marge.

**De verkoopprijs stond nergens.** `ccp_product_pricing` en `ccp_price_history` bestaan maar zijn leeg. Ik heb 2.983 prijzen geladen uit jouw eBay-export van vandaag plus de Channable-preview — die twee bronnen spreken elkaar op geen enkele SKU tegen.

## 3 · Antwoord op je vraag: ja, er ontbrak nogal wat

Je lijstje miste vijf kostenposten. Vier heb ik toegevoegd, één is de grootste van allemaal.

**Vaste transactiekosten — toegevoegd.** eBay rekent bovenop het percentage **€0,35 per bestelling, en €0,45 bij bestellingen boven €10**. Bij een remblokset van €25 is dat €0,45 die je niet meerekende.

**Advertentiekosten — dit is de grote.** In je eigen Verkäufer-Cockpit staat per listing *Basis: Beworben, Anzeigentarif 13,4%* en *Premium: Beworben 9,6%*. Ik reken met 9,6%. Op een gemiddelde remblokset van €43 bruto is dat **€4,14 per verkoop** — meer dan de hele contributiemarge die eronder overblijft. Dit hoort in het model, niet in een aparte marketingpot.

**Verzendkosten — je zette ze op 0, maar je biedt Gratis Lieferung.** Dan betaal jij ze. Ik heb een gewichtsstaffel gemaakt (`ccp_verzendtarieven`), nu nog met aannames.

**Verpakkingskosten — toegevoegd.** Doos, tape, label. €0,45 voor remblokken, €0,75 voor schijven.

**Nog niet in het model, bewust:** kortingscodes. Op je listings loopt `CCPAUG26` met 10% korting. Dat is geen vaste kost per product maar een actie, dus die hoort in een campagne-analyse. Wil je hem meenemen, dan wordt het een extra parameter.

**Niet nodig:** betaalkosten. Bij eBay Managed Payments zit de betaalafhandeling al in de verkoopprovisie. Niet dubbel tellen.

## 4 · Wat het model nu zegt — en waarom je hier moet kijken

| Status | SKU's | Gem. marge % |
|---|---:|---:|
| Verliesgevend | 1.211 | −8,8% |
| Laag | 1.624 | 8,9% |
| Gezond | 146 | 30,6% |
| Hoog | 2 | 52,4% |
| Onbekend | 707 | — |

Per categorie, gemiddeld:

| | Bruto | Netto | COGS | Verzend | eBay-fee | Ads | **Contributie** |
|---|---:|---:|---:|---:|---:|---:|---:|
| Remblokken | 43,14 | 36,25 | 19,17 | 5,35 | 5,63 | 4,14 | **0,42** |
| Remschijven | 77,38 | 65,03 | 13,64 | 8,03 | 9,74 | 7,43 | **23,50** |
| Remklauwen | 58,19 | 48,90 | 19,20 | 5,64 | 7,43 | 5,59 | **9,12** |

**Remblokken draaien op 42 cent per verkoop. Remschijven op €23,50.** Dat is geen detail — dat is een assortimentsbeslissing.

Voordat je daarop acteert: dit hangt op vijf parameters die nog aannames zijn. Hier is hoe gevoelig het is:

| Scenario | Gem. marge | Verliesgevend |
|---|---:|---:|
| Huidige aannames | 2,8% | 1.211 |
| Zonder advertentiekosten | 14,2% | 444 |
| Zonder verzendkosten | 21,3% | 281 |
| Zonder ads én verzend | 32,7% | 4 |
| Commissie 8% i.p.v. 12% | 8,1% | 680 |

De conclusie "remblokken zijn marginaal" houdt stand in elk scenario waarin je advertentiekosten of gratis verzending meerekent. Maar of het 42 cent of €5 is, hangt volledig op wat je echt betaalt.

## 5 · Wat je moet verifiëren

Vier getallen, allemaal binnen een half uur te controleren. Zeg de echte waarden en ik zet ze erin — de hele feed rekent dan opnieuw.

| Parameter | Nu | Waar je het vindt |
|---|---|---|
| `commissie_pct` | 12% | eBay-maandfactuur, Verkaufsprovision ÷ omzet. eBay noemt 5–15% per categorie en heeft per 1 juli 2026 de staffel afgeschaft voor een vast percentage per categorie — dus je oude ervaringscijfer klopt misschien niet meer. |
| `advertentie_pct` | 9,6% | Verkäufer-Cockpit → Advertising. Draaien alle listings mee, of alleen een deel? |
| `verzendkosten` | €4,50–13,50 per gewicht | Je vervoerderscontract NL→DE. |
| `verpakkingskosten` | €0,45 / €0,75 | Je eigen inkoop dozen en labels. |
| `retour_derving_pct` | 3% (5% klauwen) | Retourpercentage × gemiddelde afhandelkost. |

Alle vijf staan in `ccp_kosten_parameters` en `ccp_verzendtarieven` met `bron = 'AANNAME'`. Zolang dat er staat is elk marge-getal een schatting, geen feit.

## 6 · Zo gebruik je het in Channable

Ververs eerst import 849793 (`Opslaan & import vernieuwen`) — anders bestaan de velden nog niet als projectveld.

Daarna is jouw voorbeeld één regel:

```
Als  categorie      is        Remblokken
En   hersteller     bevat     A.B.S.
En   marge_status   is één van  Gezond, Hoog
Dan  ...
```

Bruikbaar op drie manieren: als **exclude-regel** (niets onder een bepaalde marge naar eBay), als **advertentiestuur** (alleen Gezond/Hoog in de campagne), en als **prijsstuur** (Verliesgevend automatisch signaleren).

Waarschuwing bij de exclude-variant: `marge_status = 'Onbekend'` staat op 707 SKU's. Sluit je "niet Gezond of Hoog" uit, dan verdwijnen die 707 ook. Filter expliciet.

## 7 · De zwakke plek die je moet kennen

De prijs is een **momentopname van 20-08-2026**, niet live. Verandert een prijs in Magento, dan loopt `marge_status` achter tot `ccp_sku_prijs` opnieuw geladen wordt. Het veld `prijs_gemeten_op` maakt dat zichtbaar.

Structureel oplossen kan op twee manieren:

1. **Magento REST repareren.** Dat blokkeert nu op `CONSUMER_SECRET` in de env — 33 tekens waar de andere drie sleutels er 32 hebben. Eén teken. Zodra dat klopt kan een dagelijkse job de prijzen verversen en is de marge nooit ouder dan een dag.
2. **Berekenen in Channable** met de live prijs uit de Magento-import. Kan, maar dat is zes berekeningen en vier condities in een UI die vandaag drie keer is vastgelopen — en dan staat de logica op twee plekken.

Route 1 heeft mijn voorkeur. Één teken in de env versus een tweede implementatie.

## 8 · Aan Brembo mist nog iets

De 1.350 Brembo-prijzen komen uit de Channable-preview en staan in het model. Maar Brembo staat niet live (verkooplimiet), dus die marges zijn planningscijfers, geen realisatie. Zodra de limiet omhoog gaat is dit precies de lijst waarmee je bepaalt wat je als eerste inzet.

## Bronnen

- [Gebühren für gewerbliche Verkäufer | eBay](https://www.ebay.de/help/selling/fees-credits-invoices/gebhren-fr-gewerbliche-verkufer-die-der-zahlungsabwicklung-teilnehmen?id=4809)
- [Ebay ändert Gebühren: Was teurer wird – und was günstiger | Händlerbund](https://ohn.haendlerbund.de/themen/marktplaetze/ebay-aendert-gebuehren-teurer-guenstiger)
- [eBay Gebühren 2026: Was Verkäufer wirklich zahlen | AMZ+ Consulting](https://amzplus-consulting.de/blog/ebay-gebuehren-2026)
