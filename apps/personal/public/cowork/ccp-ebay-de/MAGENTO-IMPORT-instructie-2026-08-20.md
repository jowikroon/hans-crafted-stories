---
type: instructie + importbestand
scope: CCP · Magento bulk-categorietoewijzing
status: klaar op 15 regels handwerk na
created: 2026-08-20
last_reviewed: 2026-08-20
bron: category_paths/category_urls uit live Channable-import 750543 + v_ccp_categorie_uit_naam + companion-remblokken
---

# Magento importbestand — klaar, met 15 regels die jij moet invullen

## 1 · Wat er ligt

**`magento-import-categories-2026-08-20.csv`** — 25.765 rijen.

| Status | SKU's | Betekenis |
|---|---|---|
| `BEVESTIGD` | **3.942** | pad letterlijk overgenomen uit de live Magento-feed |
| `AFGELEID - pad controleren` | **1.484** | Brembo-remblokken, patroon doorgetrokken |
| `PAD AAN TE VULLEN` | **20.036** | categorie bekend, Magento-pad nog niet |
| `GEEN CATEGORIE AFGELEID` | **303** | naam geeft niets prijs |

Kolommen: `sku`, `categories`, plus vier hulpkolommen met `_` ervoor (`_productnaam`, `_afgeleide_categorie`, `_merk`, `_status_pad`). **Die vier verwijder je vóór je importeert** — Magento negeert onbekende kolommen meestal, maar schoon is schoon.

De 1.501 Brembo-remblokken zaten niet in `product_inputs`; die zijn erbij gehaald uit de companion-feed. 17 stonden er al in, dus 1.484 zijn nieuw toegevoegd.

## 2 · Wat er bevestigd is en waarom

Deze drie paden komen letterlijk uit `category_paths` en `category_urls` van de draaiende Magento-koppeling 750543:

```
Remmen > Remblokken > Remblokken ABS (standaard)      1.197 SKU's
Remmen > Remschijven > Remschijven ABS (standaard)      663 SKU's
Remmen > Remklauwen                                   2.065 SKU's
```

Bevestigd door de bijbehorende URL's: `/remmen/remblokken/remblokken-abs`, `/remmen/remschijven/remschijven-abs`, `/remmen/remklauwen`. Let op dat Remklauwen maar **twee** niveaus diep zit — de boom is niet overal even diep.

Sterke aanwijzing dat dit klopt: 3.942 bevestigde SKU's ligt vlak bij de ±3.953 items die volgens Channable's kwaliteitsstap wél een categorie hebben. De categorieën die al werken zijn precies deze drie.

## 3 · Wat jij moet invullen

**`magento-import-categories-AANVULLIJST-2026-08-20.csv`** — 15 regels. Meer is het niet.

| Categorie | Merk | SKU's | Vul in |
|---|---|---|---|
| Stuur- en ophangdelen | A.B.S. | 4.490 | |
| Rem- en koppelingscilinders | A.B.S. | 3.174 | |
| Remslangen | A.B.S. | 3.038 | |
| Handremdelen | A.B.S. | 2.540 | |
| Slijtage-indicatoren | A.B.S. | 2.398 | |
| Wiellagers en wielnaven | A.B.S. | 1.885 | |
| **Remblokken** | **Brembo** | **1.484** | *controleren, niet invullen* |
| Remschoenen | A.B.S. | 1.174 | |
| Koppelingsdelen | A.B.S. | 605 | |
| Remtrommels | A.B.S. | 432 | |
| *(geen categorie)* | A.B.S. | 303 | *apart bekijken* |
| Kabels | A.B.S. | 210 | |
| Bevestigingsmateriaal | A.B.S. | 73 | |
| Remvloeistof | A.B.S. | 13 | |
| Toebehoren | A.B.S. | 4 | |

Dertien paden invullen, één controleren, één restgroep beslissen. Dat is de hele klus voor 20.036 producten.

## 4 · Twee placeholders die overal in het bestand staan

**`«ROOT»`** — de naam van je hoofdcategorie. In Magento standaard `Default Category`, maar bij een aangepaste store kan dat anders heten. Kijk in `Catalog → Categories`, bovenste knoop. Vervang alle voorkomens.

**`«AAN TE VULLEN»`** — de tak boven de categorie. Voor de bevestigde paden is dat `Remmen`; voor bijvoorbeeld wiellagers is dat waarschijnlijk iets als `Onderstel` of `Wiellagers`, maar dat weet ik niet en verzin ik niet.

Zoek-en-vervang in volgorde: eerst `«ROOT»`, dan per categorie het pad uit je aanvullijst.

## 5 · Het Brembo-pad dat je moet controleren

Ik heb voor de 1.484 Brembo-remblokken dit gezet:

```
Remmen/Remblokken/Remblokken Brembo (premium)
```

Onderbouwing: het bevestigde ABS-pad eindigt op `Remblokken ABS (standaard)`, en in de brondata kwam eerder `Remschijven Brembo (premium)` voor. Het patroon `<Type> <Merk> (<tier>)` is dus reëel. **Maar ik heb dit specifieke pad niet gezien.** Bestaat de categorie nog niet, dan maakt Magento hem aan bij de import — dat is geen ramp, maar wel iets wat je bewust moet willen.

## 6 · Importeren

`System → Data Transfer → Import → Products → Add/Update`

- Scheidingsteken: komma, tekstscheider: dubbele quote
- **Eerst "Check Data"** — dat valideert zonder te schrijven
- Dan pas "Import"

**Doe eerst een tranche van 100.** Knip de eerste 100 regels van één categorie eruit, importeer, en controleer in Channable of `categories` bij die SKU's binnenkomt. Pas daarna de rest.

Reden: Magento maakt bij een verkeerd pad stilzwijgend nieuwe categorieën aan. Bij 20.000 rijen heb je dan een tweede, parallelle boom voordat je het doorhebt.

## 7 · De 303 zonder categorie

Die zitten in het bestand met `«AAN TE VULLEN»/«AAN TE VULLEN»`. **Haal ze eruit vóór de import** — anders maakt Magento een categorie met die letterlijke naam aan.

Ze staan apart te filteren op `_status_pad = GEEN CATEGORIE AFGELEID`.

## 8 · Wat dit niet oplost

Dit vult de categoriekoppeling. Het zegt niets over de andere twee verplichte gaten uit de kwaliteitsstap: `image_main_1600` en `material_safe_data_sheet` staan allebei op **alle 23.966 items** leeg.

En het blijft een bronfix op basis van productnamen. Zodra de Magento API weer werkt (`CONSUMER_SECRET` is 33 tekens waar het er 32 moeten zijn) is de eerste controle: hangen die 20.013 producten écht aan niets, of aan een categorie die op inactief staat. In dat tweede geval is de fix niet importeren maar de categorie activeren — en dan is dit bestand overbodig.
