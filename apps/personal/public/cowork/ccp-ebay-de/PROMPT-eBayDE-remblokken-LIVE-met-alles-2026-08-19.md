# Operator-prompt — eBay DE Remblokken LIVE "met alles" · 2026-08-19

**Model operator:** Claude **Opus 4.8** (`claude-opus-4-8`); Sonnet 5 alleen als Opus niet kan.
**Omgeving:** Channable open + ingelogd op app.channable.com (company **101300** · project **314525** · kanaal eBay DE **152339** / eBay API-id **159122**). Draai in de kernel/Browser 2-sessie waar de CCP-login leeft.
**Doel:** de volledige remblokken-catalogus (3.442: 1.941 A.B.S. + 1.501 Brembo) verkoopklaar op eBay DE — mét native DE-titel, native omschrijving, KType-fitment, positie, merk-split en GPSR — zónder de reeds live remschijven te raken.

**Databron staat klaar (Supabase `ccp-marketplace` / `kskumhtisifsdjjbzvbo`, geverifieerd 19-08):** titel 100%, omschrijving 100%, KType 99,1%, positie 99,3%, merk-split A.B.S./Brembo, EAN 100%. Wat nog mist is **Channable-wiring**, niet content.

## UPDATE 2026-08-19 (na end-to-end verificatie — dit is leidend)
- **Rijke remblokken-feed = import `v_companion_remblokken`** (REST-ready, anon-SELECT verleend; 3.442 rijen; merge op **`sku`**). Levert per SKU native `title_de`/`description_de` + KType + positie + `brand_display` — rijker dan de categorie-baseline. Gebruik deze als hoofd-enrichment voor remblokken; categorie-baseline alleen als vangnet voor kale items.
  URL: `https://kskumhtisifsdjjbzvbo.supabase.co/rest/v1/v_companion_remblokken?select=*&apikey=<PUBLISHABLE_KEY>` (zelfde key als de andere feeds).
- **Merk-GPSR merge op veld `gpsr_brand_key`** (waarden exact `ABS`/`Brembo`) ↔ `v_channable_brand_gpsr.brand`. NIET op ruwe `brand` (staat overal op 'ABS') en NIET op `brand_display` ('A.B.S.' met punten matcht niet op 'ABS').
- **Brembo-content is nu correct in de databron**: de 1.501 P-serie titels/omschrijvingen zijn hermerkt naar Brembo, de A.B.S.-ISO-claim verwijderd, GPSR = Brembo N.V. (geverifieerd: 0 A.B.S.-resten, 0 ISO-resten). A.B.S.-items (1.941) behouden hun ISO-claim (cert 10750362, geldig t/m 03/2029).
- **Merk-afleiding = SKU-regel** (betrouwbaarst in onze data): numeriek = A.B.S.; P-serie/letter-prefix (en bij schijven 08./09. met punten) = Brembo. Kruischeck: bevestig of de live Magento-`brand` in Channable Brembo apart toont; zo ja, prefereer dat veld.

---

## 0 · COMPLIANCE-BLOCKERS — controleren vóór er ook maar iets live gaat (Uitvoeren)
Deze blokkeren *publiceren*, niet *bouwen*. Bouw/preview mag; Uitvoeren pas als deze groen zijn (beslissing Hans).

1. **ISO-9001 claim.** Alle 3.442 omschrijvingen bevatten `Qualitätsmanagement nach ISO 9001:2015 (Zertifikat 10750362, gültig bis 03/2029)`. De vault (OP-0.5) meldt dat dit certificaat **11-03-2026 verlopen** is. Zolang Hans de geldigheid niet bevestigt: **niet publiceren** — een onjuiste certificeringsclaim is in DE direct Abmahnfähig. Fix bij verloop = regel uit alle `description_de` strippen (Supabase UPDATE) vóór publish.
2. **Brembo GPSR.** In `ccp_brand_gpsr` staat Brembo op `verified=false` met leeg adres. De 1.501 Brembo-remblokken mogen **niet live** tot het GPSR-adres correct én geverifieerd is. A.B.S.-GPSR (Tinbergenlaan 7, 3401 MT IJsselstein) staat wel geverifieerd.
3. **GPSR "Product safety component" / Sicherheitshinweise-blok** staat op eBay nog Unmapped (pictogram-/statement-codes leeg). Aparte mapping-run; niet publiceren zonder.

---

## HARDE GUARDRAILS (nooit overtreden)
1. **Kom NOOIT aan de regel "SKU selectie"** (27858166 / kostenrem). Niet openen, wijzigen, pauzeren, verslepen, verwijderen. Verander nergens het aantal of de selectie van SKU's.
2. **Klik NOOIT op "Uitvoeren" / "Run now".** Alleen **"Regel opslaan" / Save**. De export-hold uit STAP 0 blijft staan tot Hans hem expliciet vrijgeeft.
3. **Bewerk GEEN gedeelde master-groepen** (bv. "Omschrijvingen" 321808) — die voeden ook Bol/Amazon. Maak het kanaal self-contained.
4. **Merk uit veld `brand`** (dynamisch, ook Brembo) — nooit "A.B.S." hardcoden. Waar de feed `brand_display` levert (A.B.S./Brembo split), gebruik díe.
5. **GPSR via de brand-GPSR-merge** (zie STAP 2) — nooit hardcoden.
6. **Titel ≤ 80 tekens**, afkappen op woordgrens (voertuig-deel eerst).
7. **Twijfel of veld ontbreekt → STOP en rapporteer** met screenshot. Niet gokken.
8. **Scope: additief.** De reeds live remschijven (Bremsscheiben 33564) blijven staan. Deze run voegt remblokken toe; verwijder/pauzeer geen bestaande listings.

---

## STAP 0 — export-schema's op HOLD (OP-0, blokkerend)
eBay-kanaal 159122 → Instellingen/Schema → alle geplande runs op **hold/pauze**. Reden: de scheduled sync pusht anders elke opgeslagen regel direct live, en kan lege compatibility over de handmatig geüploade Fahrzeugverwendungsliste heen schrijven. Bevestig met screenshot vóór STAP 1. (Doe hetzelfde voor Bol als die op schema staat.)

## STAP 0.5 — remschijf-mismap dichten (bestaande prompt)
Voer **`PROMPT-OP-0.5-repoint-remschijven-2026-08-19.md`** uit (repoint de vier `ebay_de_bremsbelage_*`-velden op Bremsscheiben 33564). Dit actieve datalek leegt schijf-listings bij elke push; eerst dicht, dan remblokken.

## STAP 1 — scan eerst (read-only)
- eBay DE → **Imports**: bevestig dat de huidige enrichment-import "CCP Attributen" (Supabase `v_channable_import`, 398 SKU's) draait. Noteer de importvolgorde.
- eBay DE → **Regels**: bevestig dat er nog geen eigen remblok-titel/omschrijving-regel op kanaalniveau leeft (of alleen gepauzeerd).
- Open op één A.B.S.-remblok (bv. `35001`) én één Brembo-remblok (P-serie, bv. `P 06 091`) de veldkiezer. Noteer welke velden gevuld zijn. Verwacht na wiring: `brand`/`brand_display`, `sku`, `ean`, `categories_clean`, `ebay_title_de`, `ebay_beschreibung_de`, `ktypes`, `einbauposition`/`vooras_achteras_duits`, `oe_nummern`. **Rapporteer de scan vóór je iets wijzigt.**

## STAP 2 — twee JSON-imports toevoegen (unlockt "met alles")
Zet beide ná Magento + "CCP Attributen" in de importvolgorde (later = wint waar gevuld).

1. **Import "Categorie-baseline DE" (JSON)** → URL:
   `https://kskumhtisifsdjjbzvbo.supabase.co/rest/v1/v_channable_category_enrichment?select=*&apikey=<PUBLISHABLE_KEY>`
   **Merge = Combineren op veld `categories_clean`** (koppel bronveld `categorie`). Levert per categorie: `produktart` (Remblokken→Bremsbelagsatz), `ebay_category_id` (57357), titel-/beschrijving-template, ECE-R90-zin.
2. **Import "Brand GPSR" (JSON)** → URL:
   `https://kskumhtisij...supabase.co/rest/v1/v_channable_brand_gpsr?select=*&apikey=<PUBLISHABLE_KEY>`
   **Merge op veld `brand`**. Levert per merk het GPSR-blok. *Let op blocker §0.2: Brembo `verified=false` → GPSR-veld blijft leeg voor Brembo tot ingevuld; die items niet publiceren.*

> De exacte URL's met key staan in `_cowork/channable-operator/deliverables/2026-08-19-categoriebrede-verrijking-voorstel.md` (publishable key, geen secret). Neem ze daar 1-op-1 over.

## STAP 3 — regelgroep "DE categorie-baseline" (self-contained)
Rendert naar de velden die de **Build écht leest**: **`ebay_title_de`** en **`ebay_beschreibung_de`** (NIET het dode `ebay_omschrijving_de`). Met leeg-guards zodat de SKU-overlay (CCP Attributen) altijd wint waar aanwezig, en de baseline alleen de kale items (alle Brembo + niet-verrijkte A.B.S.) vult:
- `ALS ebay_title_de leeg is` → zet `default_title_template` (interpoleer placeholders; `[[…]]`-segmenten weglaten bij leeg veld; ≤80 tekens).
- `ALS ebay_beschreibung_de leeg is` → zet `default_description_template`.
- `produktart` / `ebay_category_id` uit de baseline zetten waar leeg.

Gate: **`categories_clean` bevat `remblokken`**. Raak geen andere categorie.

## STAP 4 — self-contained eBay DE remblokken-kanaalregel (titel + omschrijving)
Als de native `ebay_title_de`/`ebay_beschreibung_de` uit de Supabase-feed al 100% gevuld binnenkomen (dat is de bedoeling), hoeft hier alleen bevestigd te worden dat het kanaal die velden mapt en niet overschrijft met een oude master. Bestaat er nog een oude/gepauzeerde remblok-titelregel die "Bremsscheibe"-tekst of een leeg veld produceert → die pauzeren, niet de master bewerken. Merk = `brand_display` waar aanwezig, anders `brand`.

## STAP 5 — preview + opslaan + rapporteren
Preview op minstens 4 SKU's: 2 A.B.S. (bv. `35001`, `35140`) + 2 Brembo (bv. `P 06 091`, en één met KType). Controleer:
- Titel ≤80, correct Duits, merk = A.B.S. resp. Brembo (niet ABS-zonder-punten voor A.B.S.), geen lege haakjes/streepjes.
- **Precies één** omschrijving (geen dubbele/lege), met KType/positie waar gevuld.
- GPSR-blok: A.B.S. gevuld; Brembo **leeg/afwezig** zolang §0.2 open — dat is correct, niet "fixen".
- ISO-regel §0.1: zolang niet bevestigd, ga ervan uit dat publish geblokkeerd is.
Klopt alles → **"Regel opslaan"** (NOOIT Uitvoeren). Screenshot van regel + preview per merk. Meld: "Remblokken-wiring klaar, klaar om te checken; publish geblokkeerd op ISO + Brembo-GPSR." **Stop daarna.**

---
Gerelateerd: [[eBay-DE-Launch]] · categorie-brede verrijking (2026-08-19-voorstel) · OP-0.5 repoint · [[ABS-Brand-Profile]]
