---
type: verified-facts
scope: CCP · Channable project 314525 · company 101300
status: verified
created: 2026-08-19
last_reviewed: 2026-08-19
bron: Supabase ccp-marketplace (live queries) + HUIDIGE-STAAT 2026-08-19 06:08 (Kernel live-API) + Hans-bevestiging
---

# Channable — geverifieerde feiten (leidend voor alle channable-skills)

Deze notitie overschrijft oudere aannames in de channable-skills en operator-prompts. Bij conflict wint dit bestand.

## 1. Merk komt NIET als Brembo binnen — leid af uit de SKU
- Magento `manufacturer` staat op **ABS** (option-ID 249) voor álles, óók Brembo.
- Bovendien forceert **import-regel 143655 "Brand ABS"** (actief, #25) `brand`='ABS' kanaal-breed.
- Gevolg: het `brand`-veld in de feed is géén betrouwbaar merk-signaal.
- **Betrouwbare merk-afleiding = SKU-regel:** numeriek → **A.B.S.**; letter-prefix (P-serie) of getal-met-punten (08./09.) → **Brembo**.
- In de databron geïmplementeerd als `brand_display` (A.B.S./Brembo) en `gpsr_brand_key` (ABS/Brembo) in `v_companion_remblokken`.
- **Bron-fix (optioneel, schoner):** in Magento `manufacturer`=Brembo zetten voor de P-serie + regel 143655 vervangen door merk-uit-SKU.

## 2. Omschrijving-veld: schrijf naar `ebay_beschreibung_de`
- De Build leest **`ebay_beschreibung_de`**. Het veld **`ebay_omschrijving_de` is dode output** (wordt niet gelezen).
- Categorie-baseline + kanaalregels moeten naar `ebay_beschreibung_de` (en `ebay_title_de`) schrijven.

## 3. Rijke remblokken-feed = `v_companion_remblokken`
- REST-ready (anon-SELECT), 3.442 rijen, merge op **`sku`**.
- Levert per SKU: `title_de`, `description_de`, `ktypes`, `einbauposition`, `brand_display`, `gpsr_brand_key`.
- Rijker dan de categorie-baseline; gebruik als hoofd-enrichment, baseline als vangnet.

## 4. GPSR + ISO = merk-gesplitst, merge op `gpsr_brand_key`
- Import `v_channable_brand_gpsr`, **merge op `brand` = `gpsr_brand_key`** (waarden ABS/Brembo) — NIET op ruwe `brand` of `brand_display`.
- Velden: `gpsr_manufacturer_name`, `gpsr_address`, `gpsr_email`, `verified`, **`quality_claim`**.
- **A.B.S.:** A.B.S. All Brake Systems B.V., Tinbergenlaan 7, 3401 MT IJsselstein · quality_claim = ISO-regel (zie §5).
- **Brembo:** Brembo N.V., Viale Europa 2, 24040 Stezzano (BG), IT · quality_claim = **NULL** (A.B.S.-ISO geldt niet voor Brembo).
- Beide `verified=true`.

## 5. ISO 9001 — geldig t/m 11-03-2029 (Abmahnung-veilig)
- Cert **10750362**, LRQA approval **00009185**, geldig **12-03-2026 t/m 11-03-2029**.
- Oud cert 10499964 verliep 11-03-2026 (bron van eerdere "verlopen"-verwarring — achterhaald).
- Claim (DE): `Qualitätsmanagement nach ISO 9001:2015 (Zertifikat 10750362, gültig bis 03/2029)`.
- Staat op de 1.941 A.B.S.-omschrijvingen; bij de 1.501 Brembo verwijderd.
- Bewijs: `compliance/ISO9001-ABS-cert-10750362-bewijs-2026-08-19.md` + agent_knowledge id 50.

## 6. Cross-channel stand (per 2026-08-19 06:08, Kernel live-API)
- **9 kanalen, 5 actief:** Bol.com (153718), ChatGPT Commerce (584845), Custom CSV (666057), Google Shopping (560778), eBay DE (159122). Inactief: eBay NL (145706), TikTok, Vergelijk, Backup Rules.
- GPSR loopt via **master-groep `gpsr_manufacturer_name` (326207)** — gedeeld over alle kanalen. Product-safety = master **326214**; DE compliance = **331271**.
- **Belangrijk:** de correcties uit §1–§5 zitten in de Supabase-databron maar zijn nog **NIET gewired** in de Channable-masters/imports. Tot de operator dat doet, drijven álle kanalen nog op de oude A.B.S.-centrische master + de "Brand ABS"-flatten. Een live cross-channel merk/GPSR/ISO-scan vergt de Kernel-operator (niet vanuit Supabase te zien).

## Openstaand voor de operator (alle kanalen)
1. Brand-GPSR-import (merge op `gpsr_brand_key`) koppelen aan master 326207 zodat GPSR + ISO merk-correct over alle kanalen loopt.
2. `v_companion_remblokken` als remblokken-enrichment importeren (merge op sku).
3. Regel 143655 vervangen door merk-uit-SKU (of feed op `brand_display` laten leunen).
4. Omschrijvingen naar `ebay_beschreibung_de` (niet `ebay_omschrijving_de`).
