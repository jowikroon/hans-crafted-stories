# Operator-prompt — GPSR + ISO merk-correct over ALLE kanalen (master 326207) · 2026-08-19

**Model:** Claude **Opus 4.8** (`claude-opus-4-8`).
**Omgeving:** Channable, kernel/Browser 2-sessie · company **101300** · project **314525**.
**Type:** MASTER-taak (bewust — GPSR/ISO is identiek voor eBay DE, eBay NL, Bol, Amazon, Google Shopping, ChatGPT). Master-groep **`gpsr_manufacturer_name` (326207)** voedt alle kanalen.
**Doel:** GPSR-fabrikant **merk-gesplitst** maken (A.B.S. vs Brembo) én de **ISO-claim** merk-correct meesturen, in één master zodat het over alle kanalen klopt. Nu draait 326207 nog op één hardgecodeerde A.B.S.-waarde → Brembo krijgt daardoor het verkeerde GPSR-adres en zou A.B.S.'s ISO claimen.

## Databron staat klaar (Supabase ccp-marketplace)
- Import-view **`v_channable_brand_gpsr`** (REST-ready), merge op **`brand` = `gpsr_brand_key`** (waarden `ABS`/`Brembo`). Velden: `gpsr_manufacturer_name`, `gpsr_address`, `gpsr_email`, `quality_claim`, `verified`.
  - A.B.S. → A.B.S. All Brake Systems B.V., Tinbergenlaan 7, 3401 MT IJsselstein · quality_claim = ISO-regel · verified=true.
  - Brembo → Brembo N.V., Viale Europa 2, 24040 Stezzano (BG), IT · quality_claim = **NULL** · verified=true.
- URL: `https://kskumhtisifsdjjbzvbo.supabase.co/rest/v1/v_channable_brand_gpsr?select=*&apikey=<PUBLISHABLE_KEY>` (zelfde key als CCP Attributen; staat in `2026-08-19-categoriebrede-verrijking-voorstel.md`).

## HARDE GUARDRAILS
1. Nooit aan **"SKU selectie" (27858166)**.
2. Nooit **"Uitvoeren"/"Run now"** — alleen **"Regel opslaan"**. Export-hold (OP-0) blijft staan.
3. Merk = uit de SKU (numeriek=A.B.S.; letter-prefix/P-serie of getal-met-punten 08./09.=Brembo) — nooit op het ruwe `brand`-veld leunen (dat staat overal op ABS door regel 143655).
4. Twijfel/ontbrekend veld → STOP en rapporteer met screenshot.
5. Dit is bewust een MASTER-edit (GPSR). Raak géén andere master (Omschrijvingen 321808) en geen kanaalregels aan.

## STAP 1 — scan (read-only)
1. Open master **`gpsr_manufacturer_name` (326207)** → noteer wat de 2 rules exact produceren (outputveld + huidige hardgecodeerde waarde, verwacht: A.B.S.-adres hard).
2. Imports: bevestig of **`v_channable_brand_gpsr`** al als import bestaat. Zo nee → toevoegen (STAP 2). Check ook of er een veld **`gpsr_brand_key`** op de items bestaat (uit de remblokken-companion of een import-regel). Zo niet → STAP 2b.
3. Bevestig op één A.B.S.-item (numeriek) én één Brembo-item (P-serie) welke velden binnenkomen. **Rapporteer de scan vóór wijzigen.**

## STAP 2 — brand-GPSR-import + merge-key
2a. **Import "Brand GPSR" (JSON)** → bovenstaande URL. **Merge op veld `gpsr_brand_key`** (koppel bron `brand`). Zet ná Magento + CCP Attributen.
2b. **`gpsr_brand_key` cataloguswijd garanderen** (nodig omdat de merge erop draait): als het veld niet op elk item bestaat, voeg een **import-regel** toe die het afleidt uit de SKU —
   `ALS sku begint met een letter OF sku bevat een punt → gpsr_brand_key = "Brembo"; ANDERS → "ABS"`.
   (Dekt P-serie remblokken én 08./09. Brembo-schijven; numerieke A.B.S. → ABS.)

## STAP 3 — master 326207 herbouwen (merk-gesplitst)
Herbouw de 2 rules zodat ze de gemergede brand-GPSR-velden gebruiken i.p.v. hardcode:
- `gpsr_manufacturer_name` = `{gpsr_manufacturer_name}` (uit merge) + samengesteld adres uit `{gpsr_address}` (+ evt. `{gpsr_email}`).
- Nieuw/aanvullend outputveld voor de kwaliteitsclaim: `gpsr_quality_claim` = `{quality_claim}` (A.B.S. = ISO-regel; Brembo = leeg → toon niets).
Bewaar de rule-JSON in het run-mapje vóór wijziging. Bewerk niet-destructief; test in preview.

## STAP 4 — preview (meerdere merken + kanalen)
Preview op: A.B.S. remblok (`35001`) → A.B.S.-adres + ISO-regel gevuld. Brembo remblok (`P 06 091`) → **Brembo N.V.-adres, ISO-regel LEEG** (correct). Doe dezelfde check zichtbaar op minstens eBay DE en Bol (master voedt beide). Controleer: geen hardgecodeerde A.B.S. meer op Brembo, geen lege placeholders, ISO alleen bij A.B.S.
Klopt alles → **"Regel opslaan"** (NOOIT Uitvoeren). Screenshot per merk + kanaal. Meld: "GPSR+ISO master merk-correct over alle kanalen; publish blijft op hold." **Stop.**

## Waarom master en niet per kanaal
GPSR/ISO is wettelijk identiek over alle marktplaatsen; één master (326207) houdt het consistent en voorkomt drift tussen eBay/Bol/Amazon. Dit is de uitzondering op de "alles per kanaal"-regel (titels/omschrijvingen blijven wél per kanaal).

Gerelateerd: [[Channable-Data-Flow-eBay-DE]] · [[ABS-ISO9001-Certificering]] · PROMPT-eBayDE-GPSR-safety-mapping-2026-08-19 · CHANNABLE-VERIFIED-FACTS-2026-08-19.
