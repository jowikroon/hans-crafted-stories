# PROMPT — Import-regels clusteren + veldsanering (projectbreed) · 2026-08-19

**Model:** Claude Opus 4.8. **Kanaal:** projectbreed (import-laag, vóór alle kanalen). **Company 101300 · Project 314525.**
**Werkwijze:** scan-eerst → één object per checkpoint → opslaan → rapporteren. Nooit "Uitvoeren".

---

## HARDE GUARDRAILS

1. Kom **NOOIT** aan de regel "SKU selectie" (27858166 / kostenrem €0,04 per listing). Niet openen om te wijzigen, pauzeren, verslepen of verwijderen.
2. Klik **NOOIT** op "Uitvoeren" / "Run now". Alleen **"Regel opslaan"**.
3. Merk uit veld `{brand}` — nooit "A.B.S." hardcoden. Er zijn ook Brembo-producten.
4. GPSR uit `gpsr_manufacturer_name` (Tinbergenlaan 7, 3401 MT IJsselstein) — nooit Zeemanlaan, nooit hardcoden.
5. Titel ≤ 80 tekens, afkappen op woordgrens.
6. Bewerk **geen** gedeelde master-groepen (o.a. "Omschrijvingen" 321808) — die voeden ook Bol en Google. Check eerst Usage.
7. Eén regel per keer, dan stoppen + rapporteren met screenshot.
8. Bij twijfel of een ontbrekend veld: **STOP** en rapporteer.
9. Verwijderen is eindstation. Eerst PAUSE of hernoemen naar `LEGACY_NIET_GEBRUIKEN_{naam}`.

---

## ARCHITECTUURPRINCIPE (leidend voor elke keuze hieronder)

Channable kent vier gescheiden verwerkingsfasen, strikt lineair:

| Fase | Wat hoort hier | Wat hier NIET hoort |
|---|---|---|
| **1. Import-regels** | opschoning, datatype-conversie, **alle attribuutwaarden en aanvulling op basisdata, inclusief vertalingen** | kanaalspecifieke output |
| **2. Master Rule Groups** (max 20 groepen × 30 regels) | datakwaliteit, media-array, merkharmonisatie, marge/labels | per-kanaal overrides |
| **3. Categorieën-stap** | native taxonomie koppelen | categorisatie via IF/THEN-regels |
| **4. Kanaalregels** | kanaal-overrides, verplichte attributen, fitment | basisdata-opschoning |

**Regel van Hans, hard:** attribuutwaarden, opschoning, aanvulling én vertaling gebeuren op **basisdata in de import-regels**. Eén regel mag **maximaal 7 sub-if/then-secties** bevatten, logisch geclusterd.

**Val uit de PDF die we moeten vermijden:** categorisatie via IF/THEN in plaats van de Categorieën-stap → Channable genereert de verplichte categorie-attributen niet in de Build-stap, waardoor Einbauposition en Marke niet mappen.

---

## DEEL A — 32 import-regels clusteren naar 14

Vijf losse regels die één ding doen worden één regel met genummerde secties. Dat is de opschoning: minder objecten, dezelfde output, leesbare volgorde.

### A1 · Omschrijvingsketen: 7 regels → 1 regel met 5 secties

Huidig: 128434 `Desc_fitment` · 128436 `Desc_oe` · 134321 `0. Omschrijving leeg maken_` · 134317 `1. Basisopbouw` · 134318 `2. Fitment Block` · 134319 `3. OE-referenties` · 134320 `4. Omschrijving totaal`
(128435 `Desc_cta` is al verdwenen tussen 17 en 19-08.)

Nieuw: **één regel `Omschrijving basisdata`** met secties in deze volgorde:

| Sectie | ALS | DAN |
|---|---|---|
| 1 | altijd | `omschrijving_basis` leegmaken |
| 2 | `produktart` niet leeg | basisopbouw wegschrijven naar `omschrijving_basis` |
| 3 | `fahrzeugmarken` niet leeg | fitment-blok toevoegen |
| 4 | `oe_nummern` niet leeg | OE-blok toevoegen |
| 5 | altijd | GPSR-blok uit `gpsr_manufacturer_name` toevoegen |

Blijft binnen 7. Schrijft naar een **neutraal basisveld**, niet naar `ebay_omschrijving_de` — dat laatste is en blijft kanaal-output.

> **Correctie op mijn eigen Fase 2-analyse:** ik noemde `ebay_omschrijving_de` een "dood veld". Dat klopt niet. Het veld-opschoonplan van 08-07 zegt expliciet: *"Output van je eBay-kanaalregels (leeg in master, gevuld op kanaal)"*. Het is dus een legitiem kanaalveld. De echte fout is dat de **import-laag er rechtstreeks naartoe schrijft** en daarmee de kanaallaag in de weg zit. Vandaar: repointen naar `omschrijving_basis`, niet pauzeren.

### A2 · Voertuigketen: 6 regels → 1 regel met 6 secties

155917 `Car_brands vullen uit OE-references` · 130686 `split_to_list` · 130689 `top1` · 130679 `top_all` · 130869 `car_models split` · 130870 `car_models_top1`

→ één regel **`Voertuigdata basisdata`**. Let op de datatype-val uit de PDF: zodra een veld via `split text to list` een lijst is, falen daaropvolgende `modify text`-acties op datzelfde veld. Volgorde dus: vullen → splitsen → dedupliceren → slicen.

### A3 · OE-blok: 3 regels → 1 regel met 3 secties

154267 `Split naar Lijst` · 154268 `Normaliseer formaat` · 154269 `Dedupe` → **`OE-referenties basisdata`**. Werkt aantoonbaar (`oe_nummern` 100% gevuld), dus puur samenvoegen — geen logica wijzigen.

### A4 · Beeldketen: 2 regels → 1

129564 `Split additional image links` (order 6) en 161759 `Additional image links splitsen` (order 38) doen hetzelfde. **161759 behouden** (draait laatst, wint), **129564 pauzeren.**

> `image_main_1600` blijft **buiten scope** — dat veld komt uit de Channable Creative-tool en het abonnement staat nog niet actief. Niet aanraken, niet als issue rapporteren.

### A5 · Vertalingen naar de import-laag

Nu op de verkeerde plek of half: `143661 Remschijftype vertaald` · `143672 Vooras Achteras Duits` · master-groep 326253 `Vooras Achteras vertalingen`.

→ één import-regel **`Vertalingen NL→DE basisdata`** met secties voor: positie (`vooras_achteras_duits`), remschijftype (`remschijftype_de`), produktart, materiaal, oppervlak. Max 7 secties. De master-groep 326253 blijft ongemoeid tot Usage bevestigd is (guardrail 6).

### A6 · LEGACY hernoemen (4)

`145433` + `145434` (BOL automodel, hardgecodeerde merkenlijst voor 6 merken — `fahrzeugmarken` is 100% gevuld in de verrijking) · `134277` Titels Remslangen · `134278` Titels Accessoiresets (categorieën staan niet live op eBay).

### A7 · Ongewijzigd behouden (10)

126712 · 127918 · 121945 · 143446 · 143619 · 143655 · 143662 · 143668 · plus de nieuwe geclusterde regels.

**Netto: 32 → 14 regels.**

---

## DEEL B — Marke = 0 (gemeten, hoogste prioriteit)

Uit *Bericht zur Angebotsqualität DE, 17-08-2026*:

| | connectcarparts | top 10% | onder 10% |
|---|---|---|---|
| Marke | **0** | 0,27 | 0,29 |
| Herstellernummer | 1 | 0,53 | 0,38 |
| EAN | 1 | 0,35 | 0,24 |
| Empfohlene Artikelmerkmale | **2** (Bremsbeläge) / 3 (Bremsscheiben) | 4 | 3 |
| 14 Tage Rücknahme | **0** | 0,16 | 0,12 |

**Marke wordt niet aangeleverd** terwijl `hersteller` in de feed 100% gevuld is. De PDF schrijft voor: normaliseren via **Lookup and replace value** in een master-regel, zodat "ABS", "A.B.S.", "Brembo Aftermarket" allemaal naar de exacte eBay-merkwaarde gaan.

Opvallend uit hetzelfde rapport: de handmatig aangemaakte listings (item-ID's `2576384391xx`) dragen **5-6 Artikelmerkmale**, de Channable-listings **1-3**. De handmatige route levert nu betere data dan de geautomatiseerde.

CTR staat op 0,0006 tegen 0,3132 in de top-10% van Bremsbeläge. Dat is geen prijsprobleem — dat is zichtbaarheid door ontbrekende specifics.

---

## DEEL C — Veldsanering (342 kandidaten)

Gemeten 08-07 over 270 items uit 18 categorieën: **488 velden, 119 in gebruik, 369 altijd leeg, 342 verwijderkandidaten, 27 leeg-maar-behouden.**

**Cruciaal:** de meeste lege velden zijn **importkolommen** (Google Sheets + Magento-attributen). Die verwijder je **bij de bron**, niet in Channable — anders komen ze bij de volgende import terug.

| Batch | Voorbeelden | Aantal | Waar opruimen |
|---|---|---|---|
| 1. Afbeeldingsslots | `additional_image_1..7`, `additional_image_labels` | 19 | Channable Setup → Velden |
| 2. API/systeem/Magento-ruis | `api_error_code`, `approved_at`, `attribute_set_id` | 15 | Magento-attribuutselectie |
| 3. Bundle/set | `bundle_values`, `bundle_sku_type` | 6 | bron |
| 4. Verzending/gewicht | `package_weight_grams`, `shipping_profile_*` | 8 | bron |
| 5. GPSR ongebruikt | lege `gpsr_*`-varianten | 13 | Channable |
| 6. Compat/voertuig | `compatibility_description`, `car_models_top2`, `car_brands_count` | 7 | Channable |
| 7. Prijs/voorraad | `allow_backorders`, `bundle_price_type`, `min_order_qty` | 21 | Magento |
| 8. `attributes_*` ongebruikt | `attributes_afwerking`, `attributes_kleur`, `attributes_boutpatroon` | 24 | bron — **let op** |
| 9. Overige los | `aantal_items`, `abs_ref`, `adult`, `age_group`, `brake_system` | 229 | per veld checken |

Volgorde: batch 1 → 2 → 3 → 4 (veiligst), daarna 5-7, dan 8, dan 9. **Na elke batch één import + kanaal-preview** om te bevestigen dat er niets brak.

**Niet verwijderen** (27): `ebay_title_de`, `ebay_omschrijving_de`, `einbauposition_de`, `ebay_description_de`, `categories_clean_de`, alle `amazon_*` (8), `bol_*` (4), `beslist_*`, Google-velden (22).

⚠ Batch 8 met beleid: als je later één `attributes_*`-veld tóch als item-specific wilt mappen, houd díe. Gezien Deel B (Artikelmerkmale te laag) is dit de batch om als **laatste** te doen — mogelijk hebben we er straks juist een paar nodig.

---

## UITVOERING

**STAP 1 — scan.** Open Setup → Import-regels. Bevestig de 32 regels, hun volgorde en welke gepauzeerd zijn. Noteer de order-gaten (1, 2, 5, 8, 35, 36, 37). Rapporteer vóór je iets wijzigt.

**STAP 2 — A4 eerst** (kleinste risico): pauzeer 129564. Opslaan. Checkpoint.

**STAP 3 — A6**: hernoem de 4 regels naar `LEGACY_NIET_GEBRUIKEN_*`. Opslaan. Checkpoint.

**STAP 4 — A3** (OE-blok, werkt aantoonbaar): cluster naar één regel. Preview op SKU 37411 → `oe_nummern` moet 45 nummers houden. Opslaan. Checkpoint.

**STAP 5 — A1, A2, A5**: één cluster per checkpoint, telkens preview op 37411 (remblok) én 16880 (remschijf).

**STAP 6 — Deel B**: master-regel Marke via Lookup and replace value. Preview, opslaan, **niet uitvoeren**.

**STAP 7 — Deel C**: batch 1 t/m 4, één batch per run, import + preview na elke batch.

Na elke opgeslagen wijziging: `CHECKPOINT [HH:MM] {batch} {object} {status}` en item-count vóór/ná. Meer dan 10% onverwachte verschuiving → stoppen.

---

Register: `_cowork/channable-operator/state/cleanup/register.csv` · Plan: `CHANNABLE-MASTERPLAN-v2.md` · Bron-architectuur: *Channable Insights Master Prompt* (13 p.) · Meting: *Bericht zur Angebotsqualität DE 17-08-2026*
