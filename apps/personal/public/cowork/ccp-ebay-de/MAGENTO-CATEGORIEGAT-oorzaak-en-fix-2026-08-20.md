---
type: root-cause + bronfix
scope: CCP · Magento → Channable 314525 · categoriedekking
status: oorzaak afgebakend, fix voorbereid, één blokkade
created: 2026-08-20
last_reviewed: 2026-08-20
bron: live Channable importinstellingen + veldkoppeling 750543, Import kwaliteit, Supabase product_inputs
---

# Waarom 20.013 items geen categorie krijgen — en hoe je het aan de bron repareert

## 1 · Wat het níét is

**De koppeling werkt.** Import 750543 is een echte Channable-Magento-koppeling ("Magento Import · Verbonden"), geen URL-feed, en levert 70 velden. In de veldkoppeling staan de categorievelden gewoon gevuld:

```
categories          Remblokken ABS (standaard) · Remschijven ABS (standaard) · Remklauwen
category_paths      Remmen > Remblokken > Remblokken ABS (standaard)
category_urls       https://www.connectcarparts.nl/remmen/remblokken/remblokken-abs
active_category_ids 122 · 121 · 44
```

Er is dus niets stuk aan de connector, de mapping of de veldnamen. Voor producten die een categorie hébben komt die netjes binnen.

**Correctie op mijn eigen waarneming van gisteren:** in deze veldkoppeling toont `sku` gewoon `37477 · 8871 · 8806`. De `37 477.00` die ik op de overzichtspagina zag was **weergaveopmaak van Channable's overzichtstabel**, niet de data. Dat zwakt het NaN-verhaal verder af — de SKU's komen schoon binnen uit Magento.

**Wat wél goed staat:** deze import heeft veiligheidsacties aan — "Blokkeer en stuur melding" bij −5% / +20% verschil. Dat is precies de rem die op de hoofdimport (de Google Sheet) ontbreekt.

Twee instellingen onder Geavanceerd: **Import filter** is leeg, **"Foutieve categorieën negeren"** staat op *Uitgeschakeld*.

## 2 · Wat het wél is

Uit `Setup → Import kwaliteit`, alle vier exact hetzelfde aantal:

```
categories            ontbrak → 20.013 items
active_category_ids   ontbrak → 20.013 items
category_urls         ontbrak → 20.013 items
category_paths        ontbrak → 20.013 items
```

Vier velden die allemaal uit dezelfde bron komen — de categoriekoppeling van het product — falen op exact dezelfde items. Dat is de handtekening van producten die **in Magento aan geen enkele categorie hangen** (of alleen aan categorieën die niet actief zijn; `active_category_ids` filtert daarop).

Van de 23.966 items in het project hebben er dus ±3.953 wél een categorie. De rest niet.

**Waarom dit niet met een Channable-regel te repareren is:** een regel kan alleen bewerken wat binnenkomt. Er komt niets binnen. De fix hoort in Magento.

## 3 · Blokkade bij verder onderzoek — de API-credentials deugen niet

Ik kon de Magento REST API niet aanroepen om de drie resterende oorzaken uit elkaar te trekken:

| Route | Uitkomst |
|---|---|
| `MAGENTO_TOKEN` uit `_skill/adapters/.env` | placeholderwaarde, geen echte token |
| `ACCESS_TOKEN` als Bearer | HTTP 403, Cloudflare-challenge ("Just a moment…") vanaf deze sandbox |
| OAuth 1.0a met de 4 sleutels | bereikt Magento wél, maar geeft *The signature is invalid* |

Oorzaak van dat laatste is vermoedelijk concreet: **`CONSUMER_SECRET` is 33 tekens**, terwijl `CONSUMER_KEY`, `ACCESS_TOKEN` en `ACCES_TOKEN_SECRET` alle drie 32 zijn. Magento geeft 32-teken sleutels uit. Er staat één teken te veel in de env.

Te herstellen via Magento Admin → System → Extensions → Integrations → de betreffende integratie → sleutels opnieuw kopiëren naar `_skill/adapters/.env`. Let op: de sleutel heet daar `ACCES_TOKEN_SECRET` (met typefout), dat blijft zo tot alles is nagelopen.

Zonder werkende API blijven drie oorzaken open:

1. producten hangen aan **geen enkele** categorie
2. producten hangen aan categorieën die **niet actief** zijn (`is_active = 0`)
3. producten staan op **visibility "Niet afzonderlijk zichtbaar"** en zijn daardoor nooit ingedeeld

Alle drie leiden tot hetzelfde symptoom, maar tot een andere fix. Dit moet uitgezocht vóór er 20.000 producten worden aangeraakt.

## 4 · De bronfix — en die is verrassend haalbaar

De A.B.S.-productnamen zijn buitengewoon consistent. Getest op de 24.264 productnamen in `product_inputs`:

| Afgeleide categorie | Items | % |
|---|---|---|
| Stuur- en ophangdelen | 4.490 | 18,5% |
| Rem- en koppelingscilinders | 3.174 | 13,1% |
| Remslangen | 3.038 | 12,5% |
| Handremdelen | 2.540 | 10,5% |
| Slijtage-indicatoren | 2.398 | 9,9% |
| Remklauwen | 2.065 | 8,5% |
| Wiellagers en wielnaven | 1.885 | 7,8% |
| Remblokken | 1.197 | 4,9% |
| Remschoenen | 1.174 | 4,8% |
| Remschijven | 663 | 2,7% |
| Koppelingsdelen | 605 | 2,5% |
| Remtrommels | 432 | 1,8% |
| Kabels | 210 | 0,9% |
| Bevestigingsmateriaal | 73 | 0,3% |
| Remvloeistof | 13 | 0,1% |
| Toebehoren | 4 | 0,0% |
| **— niet af te leiden** | **303** | **1,2%** |

**98,8% dekking** met zestien patronen op de productnaam. Voorbeelden van wat de naam prijsgeeft:

```
ABS 8871 Remschoenen set Achteras 40 mm
ABS 201676 Wielnaaf Achteras links/rechts 125 mm
ABS 71000 Hoofdcilinder, koppeling 15,9 mm
ABS 240428 Axiaalkogel Vooras links/rechts 279 mm
```

Vastgelegd als view `v_ccp_categorie_uit_naam` in Supabase-project `pesfakewujjwkyybwaom`, met anon-SELECT.

Geëxporteerd als **`_cowork/ccp-ebay-de/magento-categorie-toewijzing-2026-08-20.csv`** — 24.264 rijen, kolommen `sku`, `productnaam`, `afgeleide_categorie`.

## 5 · Uitvoering in Magento

De praktische route voor 20.000 producten is **niet** handmatig toewijzen, maar Magento's eigen product-import:

`System → Data Transfer → Import → Products → Add/Update`

Een CSV met minimaal `sku` en `categories`, waarbij `categories` het volledige pad bevat zoals Magento het kent, bijvoorbeeld:

```
sku,categories
8871,"Default Category/Remmen/Remschoenen"
201676,"Default Category/Onderstel/Wiellagers en wielnaven"
```

**Wat nog moet gebeuren voordat dat bestand klaar is:** de zestien afgeleide categorienamen moeten worden gekoppeld aan de werkelijke padnamen in de Magento-categorieboom. Uit `category_paths` weten we de vorm al — `Remmen > Remblokken > Remblokken ABS (standaard)` — maar niet de volledige boom. Dat vergt één uitlezing van de categorieënlijst, en daarvoor is de API-fix uit §3 nodig.

**Volgorde:**

1. `CONSUMER_SECRET` herstellen in de env
2. Categorieboom uitlezen (`GET /rest/V1/categories`) en de zestien namen erop mappen
3. Steekproef van 20 SKU's controleren: hangen die écht aan niets, of aan een inactieve categorie
4. Importbestand genereren uit de CSV van §4
5. Eerst 100 SKU's importeren, resultaat in Channable controleren, dan de rest
6. Pas daarna de eBay-categorisatie opnieuw meten

## 6 · Wat dit oplevert

De 14.837 items zonder Categorie ID in het eBay-kanaal is een direct gevolg van dit gat. Categorie is de voorwaarde voor attribuutmapping: zonder categorie krijgt een item nooit item specifics, en zonder item specifics geen vindbaarheid op eBay.

Dit is daarmee de grootste enkele hefboom in de hele keten — groter dan titels, groter dan afbeeldingen. En hij ligt niet in Channable.
