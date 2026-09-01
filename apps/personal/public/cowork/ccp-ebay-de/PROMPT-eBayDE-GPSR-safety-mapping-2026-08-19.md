# Operator-prompt — eBay DE GPSR / Product-safety mapping · 2026-08-19 (v2)

**Model:** Claude **Opus 4.8**. **Werkwijze:** read-first → bouwen → één stap per keer → na opslaan stoppen en Hans laten checken.
**Omgeving:** Channable, kernel/Browser 2-sessie · company **101300** · project **314525** · kanaal eBay (API-id **159122**, rules-channel **1400294**) · master-groepen **"Product safety component" 326214** (3 rules) + **"DE compliance" 331271** (1 rule).
**Vervangt** `PROMPT-eBayDE-GPSR-safety-mapping-2026-07-24.md` — zelfde logica, twee correcties (ISO + merk-gesplitste GPSR, zie §Wijzigingen).

## Wijzigingen t.o.v. 24-07 (belangrijk)
1. **ISO 9001 is NIET verlopen.** Cert **10750362 gültig bis 03/2029** (bevestigd Hans 2026-08-19; fysiek cert op `S:\ABS Bronbestanden`). De oude `ABS-ISO9001-2023-2026.pdf` was de vorige termijn. → De ISO-trust-zin mag nu **wel** gebruikt worden.
2. **GPSR-fabrikant is merk-gesplitst.** Niet meer één hardcoded `gpsr_manufacturer_name`, maar de merge-import **`v_channable_brand_gpsr`** (merge op `brand`): A.B.S. (Tinbergenlaan 7, 3401 MT IJsselstein, info@abs-bv.nl) én Brembo (Brembo N.V., Viale Europa 2, 24040 Stezzano (BG), reach@brembo.it) — **beide `verified=true`**.

## Waarom dit een MASTER-taak is
Titels/omschrijvingen zijn per kanaal; **GPSR-safety is identiek voor eBay, Bol én Amazon** → hoort in de **master-groep 326214** (voedt alle kanalen), daarna een **mapping** in de eBay-Build naar het eBay Product-safety-attribuut. Master verrijken mag hier dus wél.

## HARDE GUARDRAILS
1. Nooit aan **"SKU selectie" (27858166)** — niet openen/wijzigen/pauzeren/verslepen/verwijderen.
2. Nooit **"Uitvoeren"/"Run now"** — alleen **"Regel opslaan"**. Export-hold (OP-0) blijft staan.
3. Merk uit `brand`/`brand_display`; GPSR-fabrikant uit de **brand-merge** — nooit hardcoden.
4. Twijfel/ontbrekend veld → **STOP en rapporteer** met screenshot.

## Veiligheids-assets (bron: vault `_cowork/ccp-ebay-de/compliance/`)
- **MSDS** (`ABS-MSDS-092025.zip`) — ALLEEN **chemie**: Bremsflüssigkeit DOT 3/4/4 LV/5.1, Bremsenreiniger, Ceramic Anti-Seize (7512/7521). DE = `Material_Safety_Data_Sheets_DE/`. **Metaal-artikelen (remschijven/-blokken/-sättel) = géén SDS** (REACH: geen stof/gemisch).
- **Matching Quality** (`ABS-Matching-Quality-BER461-2026.pdf`) — "matching quality spare parts" onder **Verordnung (EG) 461/2010**. Trust-signaal, geldig 2026.
- **ISO 9001:2015** — cert **10750362, gültig bis 03/2029** (LRQA). **Nu geldig** → trust-zin toegestaan.

## STAP 1 — SCAN (niets wijzigen)
1. Master **"Product safety component" 326214** → noteer wat de 3 rules exact produceren (outputveld + waarde). Idem **"DE compliance" 331271**.
2. eBay → **Build → Shared attributes** → zoek **`Product safety component`**, **`Product safety pictogram code`**, **`Product safety statement code`** → bevestig Unmapped/leeg.
3. Noteer de bronvelden om chemie van metaal te onderscheiden: `categories_clean` / `art_grp_code` (remblokken = AA01/AA09, metaal). **Rapporteer de scan vóór wijzigen.**

## STAP 2 — LOGICA per producttype
**A. Metaal-artikelen (Remschijven, Remblokken, Remklauwen, Remtrommels, stuur-/ophangdelen, wiellagersets — dekt de volledige remblokken-uitrol):**
- `material_safe_data_sheet` = **leeg** (correct; Channable "mandatory"-flag is hier false-positive).
- Product safety **statement (DE)**: `"Sicherheitsrelevantes Fahrwerk-/Bremsbauteil. Montage nur durch eine qualifizierte Fachwerkstatt. Verschleißteile (z. B. Bremsscheiben und -beläge) achsweise paarweise ersetzen."`
- Pictogram: **geen** (geen GHS voor metaal).

**B. Chemie-SKU's (Bremsflüssigkeit, Bremsenreiniger, Anti-Seize):**
- `material_safe_data_sheet` = **gehoste MSDS-URL (DE)** per SKU (zie infra-noot — nog niet gehost).
- Pictogram + statement = GHS-signaalwoord + H-Sätze uit de SDS (Abschnitt 2).

## STAP 3 — BOUW in master 326214 (voedt alle kanalen)
Twee create-field-rules, conditie op productgroep (breid de bestaande 3 rules uit, niet destructief; backup de rule-JSON in het run-mapje vóór wijziging):
- `gpsr_safety_statement_de` → metaal = tekst A; chemie = GHS-tekst B.
- `gpsr_msds_url_de` → IF productgroep ∈ chemie THEN `<MSDS-URL DE>` ELSE leeg.

## STAP 4 — MAP in eBay Build → Attributes
- `Product safety statement code` ← `gpsr_safety_statement_de`
- `Product safety component` ← bestaande 326214-output (of `gpsr_safety_statement_de` als de 3 rules leeg blijken)
- `material_safe_data_sheet` ← `gpsr_msds_url_de`
- `Product safety pictogram code` ← alleen chemie (anders leeg)
- Bevestig dat het **fabrikant/GPSR-adresblok** uit de `v_channable_brand_gpsr`-merge komt (A.B.S. resp. Brembo), niet hardcoded.

## STAP 5 — PREVIEW + opslaan
Preview op **16880** (metaal remschijf → statement gevuld, MSDS leeg, geen pictogram), **35001** (metaal remblok A.B.S. → idem, A.B.S.-GPSR), **P 06 091** (metaal remblok Brembo → statement gevuld, Brembo-GPSR). Indien aanwezig één chemie-SKU (→ MSDS-URL + pictogram). Check: correct DE, geen lege placeholders, GPSR-fabrikantblok per merk correct. Klopt? → **"Regel opslaan"** (NIET Uitvoeren). Screenshot + melden. **Stop.**

## TRUST-verrijking (apart, per kanaal self-contained — nu allebei veilig)
Toevoegen aan Besonderheiten/omschrijving:
- `"Matching-Quality-Ersatzteil gemäß EU-Verordnung (EG) 461/2010"` — alle A.B.S.-onderdelen.
- `"Hergestellt unter ISO-9001-Qualitätsmanagement (Zertifikat 10750362)"` — **nu toegestaan** (cert geldig t/m 03/2029).

## INFRA-NOOT (blokkeert alleen deel B — chemie)
`material_safe_data_sheet` verwacht een **URL**, geen PDF. De 27-talige MSDS moeten eerst gehost worden (stabiele URL per SKU+taal, bv. `https://connectcarparts.nl/msds/DE/<code>.pdf`). Tot dan: **deel A (metaal) — incl. alle 3.442 remblokken — kan volledig GPSR-compliant live**; deel B (chemie) wacht op hosting.
