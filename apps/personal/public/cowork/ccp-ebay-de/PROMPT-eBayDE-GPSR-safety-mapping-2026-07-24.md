# PROMPT — eBay DE GPSR / Product-safety mapping (2026-07-24)

**Model:** Claude **Opus 4.8**. **Werkwijze:** read-first, dan bouwen, één stap per keer, na opslaan stoppen en Hans laten checken.
**Context:** Connect Car Parts · company **101300** · project **314525** · kanaal **eBay (API-id 159122, rules-channel 1400294)** · master-groepen **"Product safety component" 326214** (3 rules) + **"DE compliance" 331271** (1 rule).

## Waarom dit een MASTER-taak is (afwijking van de per-kanaal-regel)
Titels/omschrijvingen bouw je per kanaal (verschillen per kanaal). **GPSR-safety is identiek voor eBay, Bol én Amazon** — dus dit hoort in de **master-groep 326214** (voedt alle kanalen), met daarna een **mapping** in de eBay-Build naar het eBay Product-safety-attribuut. Master verrijken mag hier dus wél.

## HARDE GUARDRAILS
1. Nooit aan de regel **"SKU selectie" (27858166)** — niet openen/wijzigen/pauzeren/verslepen/verwijderen.
2. Nooit **"Uitvoeren"/"Run now"** — alleen **"Regel opslaan"**.
3. Merk uit `{brand}`, GPSR-adres uit `{gpsr_manufacturer_name}` (Tinbergenlaan 7) — nooit hardcoden.
4. Twijfel/ontbrekend veld → **STOP en rapporteer**.

## Veiligheids-assets (bron: vault `_cowork/ccp-ebay-de/compliance/`)
- **MSDS** (`ABS-MSDS-092025.zip`) — geldt ALLEEN voor **chemie**: Bremsflüssigkeit DOT 3/4/4 LV/5.1, Bremsenreiniger (Brake Cleaner Spray), Ceramic Anti-Seize (7512/7521). 27 talen; DE = `Material_Safety_Data_Sheets_DE/`. **Metalen remschijven/-blokken/-sättel = artikelen, GEEN SDS nodig** (REACH: geen stof/gemisch).
- **Matching Quality** (`ABS-Matching-Quality-BER461-2026.pdf`) — A.B.S. producten = "matching quality spare parts" onder **Verordnung (EG) 461/2010**. Sterk trust-signaal, geldig 2026.
- **ISO 9001:2015** (`ABS-ISO9001-2023-2026.pdf`, LRQA, approval 00009185, scope rem-/stuur-/ophanging + wiellagers). ⚠ **Vervaldatum 11-03-2026 → verlopen**. Niet als "ISO 9001"-claim gebruiken tot vernieuwd.

## STAP 1 — SCAN (niets wijzigen)
1. Open master **"Product safety component" 326214** → noteer wat de 3 rules exact produceren (welk outputveld, welke waarde). Idem **"DE compliance" 331271**.
2. Open eBay → **Build → Shared attributes** → zoek **`Product safety component`**, **`Product safety pictogram code`**, **`Product safety statement code`** → noteer dat ze **Unmapped/leeg** zijn (Preview 24-07 bevestigd).
3. Noteer de bronvelden voor productgroep (bv. `categories_clean` / `art_grp_code`) om chemie van metaal te onderscheiden.

## STAP 2 — LOGICA (per producttype)
**A. Metaal-artikelen (default: Remschijven, Remblokken, Remklauwen, Remtrommels, stuur-/ophangdelen, wiellagersets):**
- `material_safe_data_sheet` = **leeg** (correct — geen SDS voor artikelen; de Channable "mandatory"-flag is hier een false-positive).
- Product safety **statement** (DE): `"Sicherheitsrelevantes Fahrwerk-/Bremsbauteil. Montage nur durch eine qualifizierte Fachwerkstatt. Verschleißteile (z. B. Bremsscheiben und -beläge) achsweise paarweise ersetzen."`
- Pictogram: **geen** (geen GHS voor metaal).

**B. Chemie-SKU's (Bremsflüssigkeit, Bremsenreiniger, Anti-Seize):**
- `material_safe_data_sheet` = **gehoste MSDS-URL (DE)** voor die SKU (zie infra-noot).
- Pictogram + `Product safety statement` = **GHS-signaalwoord + H-Sätze** uit de betreffende SDS (Abschnitt 2).

## STAP 3 — BOUW in master 326214 (voedt alle kanalen)
Maak twee create-field-rules, conditie op productgroep:
- `gpsr_safety_statement_de` → default = metaal-tekst (A); chemie = GHS-tekst (B).
- `gpsr_msds_url_de` → IF productgroep ∈ chemie THEN `<MSDS-URL DE>` ELSE leeg.
Bewerk de bestaande 3 rules NIET destructief; breid uit / voeg toe. Backup de rule-JSON in het run-mapje vóór wijziging.

## STAP 4 — MAP in eBay Build → Attributes
- `Product safety statement code` ← `gpsr_safety_statement_de`
- `Product safety component` ← bestaande 326214-output (of `gpsr_safety_statement_de` als de 3 rules leeg blijken)
- `material_safe_data_sheet` ← `gpsr_msds_url_de`
- `Product safety pictogram code` ← alleen bij chemie (anders leeg laten)

## STAP 5 — PREVIEW + opslaan
Preview op **16880** (metaal → statement gevuld, MSDS leeg, geen pictogram) én — indien aanwezig — één chemie-SKU (→ MSDS-URL + pictogram). Controleer: correct DE, geen lege placeholders, GPSR-fabrikantblok blijft staan. Klopt? → **"Regel opslaan"** (NIET Uitvoeren). Screenshot + melden. **Stop.**

## TRUST-verrijking (apart, niet-GPSR — optioneel maar hoge waarde)
Voeg toe aan **Besonderheiten** / omschrijving (per kanaal, self-contained):
- `"Matching-Quality-Ersatzteil gemäß EU-Verordnung (EG) 461/2010"` — geldt voor alle A.B.S.-onderdelen, veilig te gebruiken.
- `"Hergestellt unter ISO-9001-Qualitätsmanagement"` — **pas gebruiken ná vernieuwing van het ISO-cert** (verliep 11-03-2026).

## INFRA-NOOT (blokkeert alleen deel B)
`material_safe_data_sheet` verwacht een **URL**, geen PDF. De 27-talige MSDS moeten eerst gehost worden (eigen site/CDN, stabiele URL per SKU+taal), bv. `https://connectcarparts.nl/msds/DE/<productcode>.pdf`. Zolang dat niet staat: deel A (metaal) kan volledig live; deel B (chemie) wacht op hosting. Voor de huidige 229 (allemaal metaal) is deel A voldoende voor GPSR-compliance.
