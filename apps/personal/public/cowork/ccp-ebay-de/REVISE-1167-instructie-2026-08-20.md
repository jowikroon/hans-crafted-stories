---
type: uploadbestand + instructie
scope: CCP · eBay DE · 1.167 actieve remblok-listings
status: klaar om te uploaden
created: 2026-08-20
last_reviewed: 2026-08-20
bron: eBay all-active-listings export 20-08-2026 + v_companion_remblokken + ccp_sku_attributes
---

# Revise-bestand voor alle 1.167 live remblok-listings

**`ebay-revise-ALLE-1167-2026-08-20.csv`** — 1.167 regels, 1.167 unieke ItemID's, 152 kB.

Dit is de enige route naar deze listings. Kanaal 159122 weigert ze met *«on eBay but not sent through this API»*, dus Channable kan er niet bij.

## 1 · Wat erin staat

| Kolom | Waarde | Dekking |
|---|---|---|
| `Action(...)` | `Revise` | 1.167 |
| `ItemID` | uit jouw export van vandaag | 1.167 uniek |
| `CustomLabel` | SKU | 1.167 |
| `C:Marke` | **`A.B.S.`** | 1.167 |
| `C:Hersteller` | `A.B.S.` | 1.167 |
| `C:Herstellernummer` | SKU | 1.167 |
| `C:Produktart` | `Bremsbelagsatz` | 1.167 |
| `C:Einbauposition` | Vorne 788 · Hinten 337 | **1.125 (96,4%)** |
| `C:OE/OEM Referenznummer(n)` | max 65 tekens | **1.167 (100%)** |
| `C:Anzahl pro Packung` | `4` | 1.167 |
| `EAN` | uit de database | 1.167 |

Voorbeeldregel:

```
Revise,257637849010,36784,A.B.S.,A.B.S.,36784,Bremsbelagsatz,Vorne,
06450SAA901; 06450SAAB00; 06450SAAB01; 06450SAAE50; 06450SAAG00,4,8717109048087
```

## 2 · Twee correcties op mijn eerdere testtranche

**`Vorne`/`Hinten`, niet `Vorderachse`/`Hinterachse`.** De preview-export van vanmiddag bewijst het: eBay 57357 gebruikt de korte vorm. In de testtranche van vanochtend stond de lange vorm — die was fout. Dit bestand is de goede.

**`C:Marke` is toegevoegd.** Dat is het attribuut waarop eBay je een 0 gaf, en het is een ánder attribuut dan `Hersteller`. Beide staan er nu in.

## 3 · Hoe Einbauposition is bepaald

| Herkomst | Aantal |
|---|---|
| Uit de database (`einbauposition_de`) | 1.119 |
| Uit de bestaande eBay-titel, waar de database er twee gaf | 6 |
| Leeg gelaten | 42 |

**Kwaliteitscontrole die me vertrouwen geeft:** van de 1.119 uit de database komt de positie bij **alle 1.119** overeen met wat er in de bestaande eBay-titel staat. Nul tegenspraken. Titel zegt *Vorne*, wij zetten `Vorne`.

De 42 lege zijn artikelen die volgens de bron op beide assen passen én waarvan de titel dat ook openlaat. eBay accepteert voor dit attribuut één waarde; een gok daar is een onjuiste listing. Beter leeg.

## 4 · Uploaden

`Verkäufer-Cockpit Pro → Berichte → Uploads` — dezelfde plek als de K-Type-bestanden.

**Doe eerst een tranche van 25.** Knip de header plus de eerste 25 regels in een apart bestand, upload dat, en controleer één listing in de browser voordat je de rest doet. Bij 1.167 regels wil je niet ontdekken dat een kolomnaam net anders moet.

Let op bij het openen in Excel: het bestand is UTF-8 met BOM. Sla je het opnieuw op, doe dat dan als **CSV UTF-8** — anders sneuvelen de umlauten in `Bremsbelagsatz`-varianten en de puntjes in `A.B.S.` blijven wel heel, maar OE-nummers met bijzondere tekens niet altijd.

## 5 · Wat dit oplevert

Op de zeven merkmalen die eBay telt gaat `connectcarparts` van **2** naar **6**:

```
Marke              0  →  1
Herstellernummer   1  →  1
EAN                1  →  1
Einbauposition     0  →  1   (96,4% van de listings)
Produktart         0  →  1
OE/OEM             0  →  1
Anzahl pro Packung 1  →  1
```

De benchmark voor de top 10% is 4. Daar kom je overheen.

## 6 · Controlebestand

**`ebay-revise-ALLE-1167-CONTROLE-2026-08-20.csv`** — zelfde 1.167 regels met ItemID, SKU, de bestaande titel, wat de database zei, wat er in het uploadbestand komt, waar de positie vandaan komt en hoeveel tekens de OE-string telt. Bedoeld om steekproeven te doen vóór je uploadt, niet om te uploaden.

## 7 · Wat dit níét oplost

- De **157 live listings** die niet in dit bestand zitten omdat ze geen remblok-categorie hebben.
- De **verkooplimiet**. Revise verandert bestaande listings en telt niet als nieuwe inventaris, dus dit bestand loopt daar niet tegenaan. Nieuwe listings wel.
- `Material`, `Besonderheiten`, `Breite/Höhe/Dicke`, `WVA`, `Vergleichsnummer` — die data bestaat niet en komt pas met de TecDoc-levering.
