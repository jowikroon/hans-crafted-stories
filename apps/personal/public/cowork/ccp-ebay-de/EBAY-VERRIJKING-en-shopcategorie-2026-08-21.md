---
type: uitvoering + uploadpakket
scope: CCP · eBay DE · shopcategorie + attribuutverrijking · 2.521 live listings
status: brondata bijgewerkt · uploadbestanden klaar
created: 2026-08-21
last_reviewed: 2026-08-21
bron: Channable-run 628453/628515 van 21-08 · eBay all-active-listings 21-08 · promoted-listing report 21-08 · Supabase
---

# Shopcategorie en verrijking — bestanden klaar

**2.521 listings live: 1.437 A.B.S. en 1.084 Brembo, allemaal Bremsbeläge op vier na. De remschijven zijn weg. 908 daarvan kan de API niet aanraken; die krijgen alles via upload.**

## 1 · De stand na jouw run

| | Aantal |
|---|---:|
| Live listings 21-08 | **2.521** |
| waarvan Bremsbeläge (57357) | 2.499 |
| waarvan Bremssättel (33563) | 18 |
| waarvan Sonstige (42605) | 4 |
| A.B.S. | 1.437 |
| Brembo | 1.084 |
| **Niet via API** (`CHANNABLE_GENERATE_ERROR`) | **908** — 907 A.B.S. + 1 Brembo |
| Wel via API | 1.613 |

Remschijven staan op nul. Dat klopt met wat je hebt gedaan.

## 2 · Wat ik in de brondata heb opgelost

**`anzahl_pro_packung` stond op 3 van de 2.521.** Nu 100%: remblokken 4, remschijven 2, de rest 1. Backup in `ccp_sku_attributes_bak_20260821_anzahl`.

**Twee nieuwe velden in `v_channable_import`**, afgeleid van de SKU zodat ze nooit meer uit de pas lopen:

| Veld | Waarde | Aantal |
|---|---|---:|
| `marke_ebay` | `A.B.S.` / `Brembo` | 2.189 / 1.501 |
| `ebay_shop_kategorie_id` | `42245731010` / `42245732010` | 2.189 / 1.501 |

Die komen automatisch mee zodra import 849793 opnieuw draait. **Koppel `ebay_shop_kategorie_id` in de Build aan de shopcategorie en `marke_ebay` aan het gedeelde attribuut Marke** — dan gaat het voor de 1.613 API-listings vanzelf en hoef je die nooit meer met de hand te doen.

## 3 · De Marke-fout is terug

In de run van vandaag staat **`attributes.Marke` op `ABS`** bij 907 van de 908 — zonder punten. Precies de waarde waar eBay je een 0 op gaf in het kwaliteitsrapport.

Ik heb dat gisteren via Revise op de listings gerepareerd, maar de bron is nooit omgelegd: de Build leest nog steeds het projectveld `brand`, dat door importregel 143655 project-breed op `ABS` wordt gezet. `attributes.Hersteller` staat wél goed op `A.B.S.` bij alle 908.

Daarvoor is `marke_ebay` bedoeld. Tot dat gekoppeld is, zet het uploadbestand `C:Marke` op de goede waarde.

## 4 · De shopcategorie werd al goed berekend

Interessant: in de feed staat `store_category_id` bij de 908 al correct op **42245731010** (907×) en **42245732010** (1×). De Channable-regel bestaat dus en werkt.

**Het probleem is niet de berekening maar het transport.** Die 908 listings zijn met een upload aangemaakt, dus kanaal 159122 mag ze niet aanraken — en daarmee komt ook de shopcategorie er niet op. Dat verklaart je 250 tegen 2.162.

## 5 · De bestanden

| Bestand | Regels | Voor wie |
|---|---:|---|
| `ebay-VERRIJKING-shopcategorie-TEST25-2026-08-21.csv` | 25 | eerst dit |
| `ebay-VERRIJKING-shopcategorie-NIET-API-908-2026-08-21.csv` | 908 | de listings die de API niet kan bereiken |
| `ebay-VERRIJKING-shopcategorie-WEL-API-1613-2026-08-21.csv` | 1.613 | optioneel, tot de Build-koppeling staat |
| `ebay-VERRIJKING-shopcategorie-ALLE-2521-2026-08-21.csv` | 2.521 | alles in één keer |

Zestien kolommen: `Action`, `ItemID`, `CustomLabel`, `StoreCategory`, `C:Marke`, `C:Hersteller`, `C:Herstellernummer`, `C:Produktart`, `C:Einbauposition`, `C:OE/OEM Referenznummer(n)`, `C:Anzahl pro Packung`, `C:Herstellergarantie`, `C:Ursprungsland`, `C:Oldtimer-Teil`, `C:Tuning- & Styling-Teil`, `EAN`.

Voorbeeldregel:

```
Revise,257637849010,36784,42245731010,A.B.S.,A.B.S.,36784,Bremsbelagsatz,Vorne,
06450SAA901, 06450SAAB00, 06450SAAB01, 06450SAAE50, 06450SAAG00,4,2 Jahre,China,Nein,Nein,8717109048087
```

**Vulling over alle 2.521:**

| Kolom | Gevuld |
|---|---|
| StoreCategory | 2.521 (1.437 + 1.084) |
| C:Marke, C:Hersteller, C:Herstellernummer | 2.521 |
| C:Produktart | 2.521 — Bremsbelagsatz 2.499, Bremssattel 18, Bremsflüssigkeit 4 |
| C:Anzahl pro Packung | 2.521 — 4 bij remblokken, 1 bij de rest |
| C:Herstellergarantie, C:Ursprungsland, EAN | 2.521 |
| **C:Einbauposition** | **2.417 (95,9%)** — Vorne 1.650, Hinten 767 |
| **C:OE/OEM Referenznummer(n)** | **1.435 (56,9%)** |

De OE-strings zijn netjes op hele nummers afgekapt binnen 65 tekens — geen afgebroken nummer, geen komma aan het eind. Dat was bij de vorige upload wel het geval.

## 6 · Wat er niet in zit, en waarom

**1.086 zonder OE-nummers, waarvan 1.082 Brembo.** Die data bestaat niet — niet in Channable, niet in Supabase, ook niet in `abs_articles_pads`. Bij Brembo zijn er 2 van de 1.501 gevuld. Dit is precies waar **MAIL-2 aan Nils** over gaat, en die staat nog altijd niet verstuurd. Zolang die er niet is, blijft dit een gat dat geen enkel uploadbestand kan dichten.

**104 zonder Einbauposition.** Vier vloeistoffen (terecht) en honderd remblokken waar de bron `Vorne, Hinten` zegt of leeg is en de titel het ook niet oplost. eBay accepteert één waarde, dus een gok daar levert een onjuiste listing op. Beter leeg.

**Material, ECE-R90, Besonderheiten, WVA-nummer, Bremssystem, Verschleißwarnkontakt** staan op 1 tot 17 van de 2.521 in de bron. Dat is dezelfde TecDoc-levering. Ik heb ze niet in het bestand gezet omdat er niets te zetten valt.

## 7 · Volgorde

1. **`ebay-VERRIJKING-shopcategorie-TEST25-2026-08-21.csv`** uploaden via `Verkäufer-Cockpit Pro → Berichte → Uploads`. Wacht op het resultaatbestand en controleer één listing: staat hij in de juiste shopcategorie en klopt Marke?
2. Daarna **NIET-API-908** — dat is de groep die je met niets anders kunt bereiken.
3. **Import 849793 vernieuwen** in Channable, zodat `marke_ebay` en `ebay_shop_kategorie_id` als projectveld verschijnen.
4. Die twee velden koppelen in de Build: shopcategorie ← `ebay_shop_kategorie_id`, gedeeld attribuut Marke ← `marke_ebay`.
5. Pas als dat staat is **WEL-API-1613** overbodig. Zolang het niet staat, kun je dat bestand gebruiken om de andere 1.613 nu al goed te zetten.

Let op bij Excel: UTF-8 met BOM, en de OE-kolom bevat komma's. Opslaan als CSV UTF-8 of het bestand niet openen.
