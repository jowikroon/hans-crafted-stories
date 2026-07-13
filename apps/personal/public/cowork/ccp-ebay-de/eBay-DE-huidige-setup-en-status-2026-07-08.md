# eBay DE — huidige setup & status (2026-07-08)

**Scope:** CCP / [[eBay-DE-Launch]] · Channable project **314525** (company 101300) · kanaal **eBay** (API-id 159122, rules-channel 1400294).
Vervangt [[eBay-DE-huidige-setup-en-status-2026-07-07]]. Alles hieronder is deze sessie live gebouwd/geverifieerd via de Channable-API + UI. **Niet op "Uitvoeren"/"Run now" geklikt** — dat blijft Hans' gate.

---

## 1. categories_clean — één centrale bron (master)

- Master-groep **"Categories_clean" (315886)**, 2 nieuwe actieve regels: **`categories_clean uit art_grp_code (1/2 + 2/2)`** = 19 mappings `art_grp_code → categories_clean`. Draait op master-niveau → geldt voor álle kanalen (eBay, Bol, Amazon…).
- **Live geverifieerd**: master bereikt eBay (SKU 7169-S → categories_clean = Remtrommels, terwijl de oude channel-fillers uitstonden).
- De 2 tijdelijke **eBay-channel-fillers zijn verwijderd** (versnippering weg).
- Oude 22 gepauzeerde master-regels (op veld `categories`) staan er nog, uit → later opruimen.

### art_grp_code → categories_clean (canoniek)

| Code | categories_clean | Code | categories_clean |
|---|---|---|---|
| CA01 | Remschijven | SG01 | Draagarmrubbers |
| AA01 | Remblokken | SB01 | Fuseekogels |
| IA01 | Remslangen | SC01 | Spoorstangeinden |
| LE01 | Accessoiresets | SD01 | Axiaalkogels |
| KA01 | Remklauwen | LK01 | Wielsnelheidssensoren |
| SA01 | Draagarmen | LC01 | Manchetten |
| SF01 | Stabilisatorstangen | LJ01 | Wartelmoeren |
| DA01 | Remtrommels | JA01 | Trekkabels |
| HE01 | Wielremcilinders | JC01 | Gaskabels |
| LF01 | Slijtindicatoren | | |

---

## 2. Per-kanaal categorie-regels (titel + omschrijving)

- **20 categorieregels** onder eBay (rules-channel 1400294), elk 3 secties: titel-mét-voertuig, titel-zónder-voertuig (voorwaardelijk op `car_brands_top1`), omschrijving.
- **Titel** → `ebay_title_de` = `{brand} {sku} {ProduktartDE} {positie} für u.a. {car_brands_top1}` — **model uit de titel** (staat in de omschrijving), voorwaardelijk "für u.a." (geen los deel als voertuig leeg), **alle ≤ 80 tekens**.
- **Omschrijving** → `ebay_omschrijving_de` (rijk, met "Passend für folgende Fahrzeuge", GPSR-regel).
- **Merk-dynamisch** uit `{brand}` (ABS + Brembo, live bevestigd), GPSR uit `{gpsr_manufacturer_name}` (Tinbergenlaan 7).
- Remblokken gecorrigeerd naar **data-rijk** (positie + voertuig aanwezig; oude "data-arm" note was fout).

---

## 3. eBay item-specifics (Build → Attributes per category)

Voor de 3 live eBay-categorieën (door 4-SKU test-scope) gemapt + opgeslagen:

| eBay Artikelmerkmal | ← bronveld |
|---|---|
| Einbauposition | `einbauposition_de` (nieuwe channelregel: as + Links/Rechts) |
| OE-/OEM-Referenznummer | `oe_list` |
| Vergleichsnummer | `oe_list` |
| EAN (Item ID / ID type) | `ean` (shared attribute, globaal) |
| Hersteller / Herstellernummer / Material / Produktart | brand / sku / material / product_type |

Nog te doen zodra een **Bremsscheiben**-categorie live is: Außendurchmesser←`buitendiameter`, Lochkreis←`bolt_pattern`, Nabenbohrung←`centreringdiameter`.

---

## 4. Categorie-mapping (Categorieën → Handmatige categorisatie)

- **Categorisatie 78,1%** (20.091 gecategoriseerd, 5.645 niet) — was 47,8% aan begin sessie.
- **19 mapping-rijen, 0 mismatches** (alle bronwaarden matchen nu de master-`categories_clean`).
- Gecorrigeerd deze sessie:
  - 8 waarde-fixes: Koppelstang→Stabilisatorstangen, Slijtagesensor→Slijtindicatoren, Asmoer→Wartelmoeren, ABS-sensor→Wielsnelheidssensoren, Handremkabel→Trekkabels, Radbremszylinder→Wielremcilinders, Spurstangen→Spoorstangeinden, Asmanchet→Manchetten.
  - **Remschijven → Bremsscheiben (33564)** (stond fout op Bremsbeläge).
  - **"remschoen"-rij → Accessoiresets** (→ Bremsbacken).
  - **"Stuurkogel"-rij → Axiaalkogels** (→ Spurstangen & -köpfe; Axialgelenk = innere Spurstange).
- Referentie eBay-categorie-IDs: Remschijven **33564** (Bremsscheiben) · Remblokken **57357** (Bremsbeläge).

---

## 5. Kostenrem (NIET aankomen)

- **SKU Filter (27858166)** = `sku is_equal_any` → **do nothing / else remove**. Staat op **4 test-SKU's** (16880, 37760, SL 5595, 210017) — door Hans zelf gezet. Live gaat er niets buiten deze 4 tot de lijst wordt uitgebreid.
- SKU Filter_copy (gepauzeerd) ongemoeid.

---

## 6. Opschoning velden (troepvelden)

- Steekproef 270 items / 18 categorieën: **488 velden, 119 in gebruik, 369 altijd leeg** (76%).
- Plan-document: `channable-veld-opschoonplan.html` (batches + methode + behoud-lijst). **Niet uitgevoerd** — verwijderen doe je bron-zijdig (Google-Sheets-kolommen / Magento-attribuutselectie), per batch.
- Behouden ondanks leeg: `ebay_title_de`, `ebay_omschrijving_de`, `einbauposition_de`, `amazon_*`/`bol_*`/`beslist_*` (andere kanalen).

---

## 7. Openstaand

| Onderwerp | Actie |
|---|---|
| Go-live scope | SKU Filter-lijst uitbreiden (Hans, kostenrem) |
| Fahrzeug-Kompatibilitätsliste (K-Typ) | Grootste hefboom — bouwen uit car_brands/car_models/from_year/to_year |
| Maten-item-specifics | Mappen zodra Bremsscheiben-categorie live is |
| Oude paused master-regels (`categories`) | Opruimen |
| Veld-opschoning | Per batch bij de bron |
| Attribuut-mapping overige categorieën | Zodra meer eBay-categorieën items krijgen |

---

*Bron: live Channable-API + UI (project 314525), 2026-07-08. eBay-categorie-IDs uit [[eBay-DE-blauwdruk-per-categorie]]. Volledige sessie-log in `log.md`.*
