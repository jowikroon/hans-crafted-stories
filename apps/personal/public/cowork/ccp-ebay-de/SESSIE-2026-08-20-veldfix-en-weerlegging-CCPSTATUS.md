---
type: sessie-log
scope: CCP · Channable 314525 · kanaal eBay DE (159122)
status: fix-doorgevoerd + diagnose-correctie
created: 2026-08-20
last_reviewed: 2026-08-20
bron: Kernel-operator (profiel channable-ccp), live UI, drie saves + server-herlaadverificatie
---

# Sessie 2026-08-20 — omschrijvingveld gefixt, CCPSTATUS-diagnose weerlegd

## 1 · Wat er live is gewijzigd (opgeslagen én na herlaad geverifieerd)

**Regel 27864233 — `DE | AA01 | Remblokken (Bremsbeläge)`**

| Sectie | Was | Is nu |
|---|---|---|
| S2 doelveld | `ebay_omschrijving_de` | **`ebay_beschreibung_de`** |
| S4 conditieveld | `ebay_omschrijving_de` leeg is | **`car_brands_top1` leeg is** |
| S4 doelveld | `ebay_omschrijving_de` | **`ebay_beschreibung_de`** |

Definitieve sectiestructuur na de fix:

```
S1  art_code = AA01  OF  categories_clean bevat "remblok"  EN  car_brands_top1 niet leeg  → ebay_title_de
S2  art_code = AA01  OF  categories_clean = "remblokken"                                  → ebay_beschreibung_de
S3  categories_clean bevat "remblok"  EN  car_brands_top1 leeg is                         → ebay_title_de
S4  categories_clean bevat "remblok"  EN  car_brands_top1 leeg is                         → ebay_beschreibung_de
```

S1/S2 = de datarijke tak (A.B.S., voertuigdata aanwezig). S3/S4 = de arme tak (Brembo, geen voertuigdata). Titel en omschrijving lopen nu op dezelfde conditie — dat was de fout van 19-08: S4 hing aan "veld leeg", en dat veld werd al half gevuld.

**Regel 28209293 — `DE | AA01 | Remblokken (Bremsbeläge)_copy`**
- S2 doelveld `ebay_omschrijving_de` → **`ebay_beschreibung_de`**. Rest onaangeroerd.

**Niet aangeraakt:** SKU-filter, master-groepen, "Uitvoeren".

## 2 · Bevestiging dat `ebay_beschreibung_de` het juiste veld is

Twee bestaande fallback-regels in hetzelfde kanaal draaien er al op:

- `DE Basic Omschrijvingen (Fallback)` (28209239) — `ebay_beschreibung_de` leeg is → vult `omschrijving_de_basic_fallback_all`
- `omschrijving gedeeld fallback` (28202218) — `ebay_beschreibung_de` leeg is EN fallback niet leeg → **kopieer** naar `ebay_beschreibung_de`

Beide vuren alleen bij een leeg veld, dus de AA01-content overleeft. Dit bevestigt §2 van `CHANNABLE-VERIFIED-FACTS-2026-08-19.md` onafhankelijk: `ebay_omschrijving_de` is dode output.

## 3 · CCPSTATUS20260819 §3 is onjuist — Product_Online is al gepauzeerd

Alle drie de "blokkerende" regels tonen in de UI de knop **"Hervat regel"**, wat betekent dat ze **gepauzeerd** zijn:

| Regel | ID | Staat |
|---|---|---|
| Product_Online | 28097660 | gepauzeerd |
| SKU Filter 400 producten_copy | 28097628 | gepauzeerd |
| Filter verwijderen product online | 28201901 | gepauzeerd |

Ter vergelijking: 27864233 en 28209293 tonen die knop niet en zijn dus actief.

De claim "Product_Online wist alle velden → nul items" kan daarmee niet kloppen. De radar-scan van 19-08 (57 van 211 kanaalregels gepauzeerd) is consistent met deze waarneming.

## 4 · De echte stand van het kanaal — gemeten 2026-08-20

**Stap 6 Bekijk levert wél items.** Voorbeeldrijen: categorie `33564` (Bremsscheiben), Brembo-SKU's `08.1365.10`, `08.1395.40`, … Kolommen Titel, Beschrijving en `compatibility_k_type` tonen "Leeg veld", Originele verkoopprijs toont "Niet gemapt veld", 2 fouten per rij.

**Stap 5 Kwaliteit draait** en geeft precies drie verplichte fouten:

| Veld | Items zonder waarde |
|---|---|
| Beschrijving | 20.945 |
| Titel | 16.850 |
| Categorie ID | 14.837 |

Op ~23.957 items betekent dat ±7.100 items mét titel en ±3.000 mét omschrijving.

**Stap 7 Resultaat: 0 verstuurd, 0 fouten** — er is nog nooit iets naar eBay gegaan.

Conclusie: de pijplijn is **niet geblokkeerd**. Het probleem is dekking, niet een gate. De volgorde uit CCPSTATUS §6 (eerst Product_Online repareren) is daarmee achterhaald; de eerste echte hefboom is **categoriedekking** (14.837 items zonder categorie halen nooit een titel- of attribuutregel).

## 5 · Publicatieniveau kan niet omlaag — UI-slot bevestigd

In stap 1 Instellingen zijn **beide** opties gelocked: `data-disabled="true"` op zowel "Alleen verifiëren" als "Publiceer", en beide radio-inputs hebben `disabled=true`. Het kanaal staat vast op **Publiceer**.

Gevolg: het advies uit CCPSTATUS §6 punt 3 ("eBay-status naar Alleen verifiëren vóór stap 1") is **niet uitvoerbaar** via de UI. De enige beschikbare rem is **"Deactiveer API"**. Dat is niet gedaan — dat is een statuswijziging die Hans expliciet moet willen.

Nuance op het risico: het kanaal staat op Publiceer én actief, maar heeft in zijn hele bestaan 0 items verstuurd. Het risico van een scheduled run is dus reëel maar niet bewezen acuut.

## 6 · Openstaand

- Effect van de veldfix is pas meetbaar ná een nieuwe build; preview en kwaliteitscijfers hierboven komen uit de laatst voltooide run en dateren dus van vóór de wijziging.
- `_copy`-regel S3 doet `car_models leeg is → car_models · splits items`. Niet begrepen, niet aangeraakt. Uitzoeken vóór de volgende run.
- Prijs staat op "Niet gemapt veld" in de Build — mapping ontbreekt.
- 14.837 items zonder categorie: grootste enkele hefboom.
- Merkconflict `brand` = ABS (importregel 143655) versus live-gerenderde Brembo: nog steeds niet opgelost.
