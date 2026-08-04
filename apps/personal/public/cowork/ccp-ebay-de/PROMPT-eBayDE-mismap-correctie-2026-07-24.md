# PROMPT — eBay DE mis-map correctie (Bremsscheiben 33564) · 2026-07-24

**Model:** Opus 4.8. **Werkwijze:** read-first, repoint, preview, opslaan, stoppen. **Geen data toevoegen** — de data staat al in de feed; alleen de bronvelden zijn fout gekoppeld.
**Context:** company 101300 · project 314525 · kanaal eBay (API-id **159122**) · Build → Attributes per category → **Bremsscheiben (33564)**.

## Wat er mis is (live bevestigd 24-07 via screenshot)
Op de **remschijf**-categorie wijzen 4 attributen naar **remblokken-velden** (`ebay_de_bremsbelage_*`). Die zijn op een schijf leeg → output leeg, terwijl de juiste schijf-/generieke data wél in de feed staat (`oe_list`, `vooras_achteras_duits`).

| eBay-attribuut | staat nu op (FOUT) | moet worden (verified feed-veld) |
|---|---|---|
| **Oe/Oem Referenznummer(n)** | `ebay_de_bremsbelage_oe_oem_referenznummern` | **`oe_list`** |
| **Einbauposition** | `ebay_de_bremsbelage_einbauposition` | **`vooras_achteras_duits`** (+ `einbauposition_de` voor Links/Rechts) |
| **Besonderheiten** | `ebay_de_bremsbelage_besonderheiten` | `ebay_de_bremsscheiben_besonderheiten` indien aanwezig, anders leeglaten |
| **Im Lieferumfang Enthalten** | `ebay_de_bremsbelage_im_lieferumfang` | `ebay_de_bremsscheiben_im_lieferumfang` indien aanwezig, anders leeglaten |
| **Vergleichsnummer** | *(leeg/ongemapt)* | **`oe_list`** (of `oe_references`) |

**Te verifiëren (renderde niet volledig):** `Lochkreis` en `Länge` leken op `ebay_de_bremsscheiben_lange` resp. `_mater…` te staan — mogelijk verwisseld. Check en zet **Lochkreis** op het lochcirkel/bolt-veld en **Länge** op het lengte-veld. De rest (Aussendurchmesser, Bremsscheibenart, Höhe, Mindestdicke, Stärke, Oberflächenbeschaffenheit, Produktart, Material, Hersteller, Herstellernummer) stond correct.

## HARDE GUARDRAILS
1. Nooit aan "SKU selectie" (27858166). 2. Nooit "Uitvoeren"/"Run now" — alleen **"Regel opslaan"/Save**. 3. Alleen deze categorie (33564) in deze run. 4. Twijfel over een veldnaam → STOP en rapporteer.

## STAP 1 — scan
Open eBay → Build → Attributes per category → Bremsscheiben. Bevestig per rij het huidige bronveld (klik de chip open voor de volledige naam). Noteer welke van bovenstaande 5 daadwerkelijk op een `ebay_de_bremsbelage_*`-veld of leeg staan.

## STAP 2 — repoint (per rij)
Vervang het bronveld volgens de tabel. Voor Einbauposition: primair `vooras_achteras_duits`; als er een gecombineerde as+Links/Rechts-regel bestaat (`einbauposition_de`), gebruik die. Verwijder het foute `bremsbelage`-veld uit de chip.

## STAP 3 — preview op 16880 (verified disc)
Controleer dat na de repoint **Einbauposition = Vorderachse/Hinterachse** en **Oe/Oem = gevulde OE-nummers** uit `oe_list` verschijnen (niet leeg). Klopt? → **Save/Regel opslaan** (NIET Uitvoeren). Screenshot + melden.

## STAP 4 — audit de andere 3 live categorieën
Dezelfde copy-paste-fout zit waarschijnlijk ook op **Bremsbeläge (57357)**, **Bremssättel** en **Sonstige** (spiegelbeeld: bremsscheiben-velden op remblokken, etc.). Loop ze na met dezelfde tabel-logica.

## Waarom dit "wat miste": data vs mapping
De maten/OE/OEM/KType stonden altijd al in de feed (Magento + Extra specs + jouw KType-linkage). Het gat naar 100% was nooit ontbrekende data — het waren deze **verkeerd gekoppelde bronvelden**. Repointen (deze prompt) + item-specifics uitrollen naar alle categorieën + KType-linkage toepassen (`ebay-ktype-compat`, bestand `1784898520377_20260721_KTypes.csv`) = 100% clean.
