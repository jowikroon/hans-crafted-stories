# PROMPT — eBay DE mapping-sessie (beide lagen, één keer goed) · 2026-07-24

**Model:** Opus 4.8. **Doel:** in één sessie de Bremsscheiben-mapping (33564) 100% maken: (A) de mis-map repointen, (B) de missende concurrent-item-specifics toevoegen. **Alle data staat al in de feed — dit is puur mappen, geen data toevoegen.**
**Context:** company 101300 · project 314525 · kanaal eBay (API-id **159122**) · Build → Attributes per category → **Bremsscheiben (33564)**.

## Waarom deze prompt (i.p.v. Cowork het live laten doen)
De Channable-Build-SPA bevriest in de Cowork-automatisering (screenshot- en JS-timeouts). Bij een normale, ingelogde Claude-in-Chrome-sessie op de laptop reageert de UI wél. Draai dit dáár. De mapping-logica hieronder is gevalideerd tegen de echte veldnamen (07-07 scan) en de TEXTAR-concurrentbenchmark (24-07).

## HARDE GUARDRAILS
1. Nooit aan de regel **"SKU selectie" (27858166)** (kostenrem). 2. Merk uit `{brand}`, GPSR uit `{gpsr_manufacturer_name}`. 3. Alleen categorie **Bremsscheiben (33564)** in deze run. 4. Twijfel over een veldnaam → **STOP en rapporteer**, niet gokken.
> Hans heeft opslaan + pushen geautoriseerd. Toch: **eerst per blok previewen op SKU 16880**, pas bij correcte preview **Save**, en pas **Run now** ná volledige validatie.

## LAAG A — mis-map repointen (leeg → juiste bron)
Deze 5 attributen staan fout of leeg. Repoint ze:

| eBay-attribuut | staat nu (FOUT/leeg) | zet op (GEVERIFIEERD feed-veld) |
|---|---|---|
| Oe/Oem Referenznummer(n) | `ebay_de_bremsbelage_oe_oem_referenznummern` | **`oe_list`** |
| Einbauposition | `ebay_de_bremsbelage_einbauposition` | **`vooras_achteras_duits`** |
| Vergleichsnummer | *(leeg)* | **`oe_list`** (of `oe_references`) |
| Besonderheiten | `ebay_de_bremsbelage_besonderheiten` | schijf-/generiek veld of leeglaten |
| Im Lieferumfang Enthalten | `ebay_de_bremsbelage_im_lieferumfang` | schijf-/generiek veld of leeglaten |

Ook checken: **Lochkreis** en **Länge** leken verwisseld (`_lange` / `_mater…`) — corrigeer indien fout.

## LAAG B — missende item-specifics toevoegen (concurrent vult ze, wij niet)
Benchmark TEXTAR vult deze; voeg ze toe op Bremsscheiben. Bron = TecDoc-criteria die al in de feed zitten. **Bevestig de exacte veldnaam in de veldkiezer** (kandidaat tussen haakjes):

| eBay-attribuut | bron-feedveld (bevestigen in veldkiezer) |
|---|---|
| Zentrierungsdurchmesser [mm] | **`centreringdiameter`** (geverifieerd) |
| Vergleichsnummer | **`oe_list`** (geverifieerd, zie laag A) |
| Bohrbild/Lochzahl (bv. 05/05) | kandidaat `bolt_pattern` / TecDoc-criterium "Lochzahl" |
| Lochkreis-Ø [mm] (bv. 116) | TecDoc-criterium "Lochkreis"/"Teilkreis" (bolt_pattern check) |
| Innendurchmesser [mm] | TecDoc-criterium "Innendurchmesser" |
| Gewicht [kg] | gewicht/verzendgewicht-veld (bevestigen; niet de verpakking) |

> Lochzahl en Lochkreis-Ø zijn **Cassini-filtervelden** — hoogste prioriteit van laag B (kopers filteren erop).

## STAP-VOOR-STAP (met validatie)
1. **Scan** (niets wijzigen): open Build → Bremsscheiben, klik elke chip open, noteer het huidige bronveld. Bevestig de 5 mis-maps + de lege item-specifics.
2. **Laag A** rij voor rij: vervang het bronveld volgens de tabel. Verwijder het foute `bremsbelage`-veld uit de chip.
3. **VALIDEER laag A**: preview op SKU **16880** → **Einbauposition = Vorderachse** en **Oe/Oem = gevulde OE-nummers** moeten nu verschijnen (waren leeg). Zo niet → stop, verkeerd bronveld.
4. **Laag B** rij voor rij: koppel de item-specifics. Bevestig elke veldnaam vóór opslaan.
5. **VALIDEER laag B**: preview op 16880 (en een 5-gaats disc) → Lochzahl/Lochkreis/Zentrierung/Innendurchmesser tonen echte getallen.
6. **Save** (Regel opslaan). Screenshot van preview als bewijs.
7. **Run now** (push) — geautoriseerd — en check daarna live op eBay dat de nieuwe listing de velden toont.
8. **Andere categorieën**: dezelfde `bremsbelage`↔`bremsscheiben`-copy-paste-fout zit waarschijnlijk ook op Bremsbeläge (57357), Bremssättel en Sonstige. Loop ze na met dezelfde logica.

## Validatie-bewijs dat de méthode klopt
De repoint is testbaar op één SKU vóór de bulk: 16880 mist nu OE + Einbauposition (live bevestigd op eBay 24-07). Ná repoint + preview moeten die gevuld zijn — dat is de harde bevestiging dat de mapping werkt, vóór je pusht. Draait het niet zoals verwacht op 16880 → niet opslaan.
