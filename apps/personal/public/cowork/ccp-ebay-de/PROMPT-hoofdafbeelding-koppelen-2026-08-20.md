---
type: operator-prompt + analyse
scope: CCP · Channable 314525 · kanaal eBay DE (159122) · hoofdafbeelding
status: klaar om uit te voeren
created: 2026-08-20
last_reviewed: 2026-08-20
bron: preview-export 20-08 (kolom images) + gemeten resolutie van de Magento-beelden
---

# Hoofdafbeelding koppelen aan `image_main_1600`

## 1 · Waarom dit moet — met bewijs

De preview-export laat zien wat Channable nu meestuurt:

```
images  →  https://www.connectcarparts.nl/media/catalog/product/3/5/35002.jpg
```

**Eén beeld per item, 4.452 van 4.452, allemaal uit Magento.** Ik heb er twee opgemeten:

| Bestand | Afmeting | Voldoet aan eBay-minimum (500 px)? |
|---|---|---|
| `35002.jpg` | 600 × 262 | ja, net |
| `36133.jpg` | **498 × 400** | **nee** |

`36133` is precies een van de vier listings die vanmiddag faalden met *«Die Auflösung der bereitgestellten Bilder entspricht nicht den Anforderungen»*. Dat was dus geen toeval: de Magento-beelden zitten tegen de eBay-ondergrens aan en gaan er soms onderdoor.

Onze R2-versie is **1600 × 1600** voor alle 3.442 remblokken. Omschakelen lost het structureel op.

## 2 · Wat het níét doet

Channable stuurt nu één beeld en straks nog steeds één beeld. Je verliest dus niets. Dat de live listings er vier tonen komt van eBay's catalogus of van de oorspronkelijke aanmaak — niet van Channable.

## 3 · De ingreep

Twee routes. **Route B heeft mijn voorkeur.**

**Route A — Build-stap.** Stap 4 Opbouw → Gedeelde attributen → *Afbeeldingen* omzetten naar `image_main_1600`.
Nadeel: die pagina laadt 56 dropdowns tegelijk en komt in een lichte browser niet rond. Op jouw laptop lukt het wel.

**Route B — kanaalregel.** Eén regel onderaan het eBay-kanaal die het bestaande beeldveld overschrijft. Werkt betrouwbaar, is per categorie te begrenzen, en is met één klik terug te draaien door hem te pauzeren.

## 4 · Voorwaarde: import 849793 moet eerst vernieuwd zijn

`image_main_1600` is toegevoegd aan `v_channable_import`. Die kolom bestaat pas als projectveld in Channable **nadat import 849793 opnieuw heeft gedraaid**.

Controleer dat eerst: `Setup → Import → CCP Attributen → Veld toewijzing`. Staat `image_main_1600` in de lijst, dan kun je door. Zo niet: `Opslaan & import vernieuwen`, even wachten, opnieuw kijken.

## PROMPT — kopieer vanaf hier

Je bestuurt **Channable**, project **314525**, kanaal **eBay** (**159122**).

**Guardrails**
1. Nooit op "Uitvoeren" klikken. Alleen "Regel opslaan".
2. Alleen de regel maken die hieronder staat. Raak geen andere regel aan.
3. Niet aan de SKU-filter, niet aan import 745824, niet aan master-groep 321808.
4. Verzin geen veldnamen. Staat een veld niet in de kiezer, meld dat en stop.
5. Elke sectie krijgt zijn eigen volledige conditie. Channable kent geen regel-brede gate; een sectie zonder conditie raakt alle ~24.000 items.

**Stap 1 — controleer dat het bronveld bestaat**

Open `Setup → Import → CCP Attributen → Veld toewijzing` en zoek `image_main_1600`.
Staat hij er niet: klik `Opslaan & import vernieuwen`, wacht tot de import klaar is, en kijk opnieuw. Lukt het dan nog niet, stop en meld het.

**Stap 2 — het doelveld is bekend, deze stap is al gedaan**

Uitgelezen via Channable's eigen API op 20-08-2026:

```json
"images": { "nodeType": "list", "value": [ { "nodeType": "projectField", "value": "image_link" } ] }
```

Het doelveld is dus **`image_link`**, één entry (de lijst mag er maximaal 40). Je hoeft de Build-stap niet te openen.

**Stap 3 — maak de regel**

Nieuwe kanaalregel, naam: `DE | Remblokken | Hoofdafbeelding 1600`
Plaats: **onderaan** de regellijst. De laatste regel wint.

```
Sectie 1
  Als   categories_clean   bevat        remblok
  En    image_main_1600    niet leeg is
  Dan neem  image_link
  en        kopieer waarde  uit  image_main_1600
```

De tweede conditie is belangrijk: zonder die controle overschrijf je een goed Magento-beeld met een lege waarde zodra de import een keer niets levert.

Sla op.

**Stap 4 — controleer**

Ga naar "Items na" bij deze regel en controleer vijf SKU's: `35001`, `36133`, `36784`, `37307`, `P 02 001`.

Verwacht per SKU een URL die begint met:
```
https://pub-9ccb70216ac94f948be5a3b58f14b2e8.r2.dev/
```

Controleer ook drie remschijven (`16883`, `18825`, `17541`): die moeten **nog steeds** de Magento-URL hebben. Zo niet, dan is de conditie gelekt — meld het en pauzeer de regel.

**Rapporteer**

```
Regel aangemaakt: ja/nee
Bronveld uit stap 2: ...
image_main_1600 gevonden in de import: ja/nee
5 remblok-SKU's met R2-URL: ... / 5
3 remschijven ongewijzigd: ja/nee
Afwijkingen:
```

## (einde prompt)

## 5 · Daarna

Zodra dit staat is `image_main_1600` in Channable geen dode kolom meer, en gaat elke nieuwe of bijgewerkte remblok-listing met een 1600 × 1600-beeld de deur uit. De vier listings die vanmiddag faalden kun je dan ook met het losse fix-bestand herstellen — of ze komen vanzelf goed bij de volgende run.
