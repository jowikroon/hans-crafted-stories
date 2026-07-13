# eBay DE — huidige setup & status (2026-07-07)

**Scope:** CCP / [[eBay-DE-Launch]] · Channable project **314525** (company 101300) · kanaal **eBay DE**
Vastgelegd n.a.v. de bouwsessie 2026-07-07 (titels/omschrijvingen per kanaal, GPSR, attributen, kostenrem, verzending).

---

## 1. Vaste feiten (live bevestigd deze sessie)

| Onderwerp | Waarde |
|---|---|
| Titelveld | `ebay_title_de` (eBay "Titel") |
| Omschrijvingveld | `omschrijving` (eBay "Beschrijving") |
| Categorie-gate | `categories_clean` (bevat "remschijven" / "remblokken" / …) |
| Merk | veld `brand` (waarde "ABS", dynamisch — ook Brembo). **Nooit "A.B.S." hardcoden.** |
| Artikelnummer / MPN | veld `sku` (item id = SKU ingesteld) |
| GPSR-fabrikant | veld `gpsr_manufacturer_name` = **A.B.S. All Brake Systems B.V., Tinbergenlaan 7, 3401 MT IJsselstein, NL** (Zeemanlaan 8 = oud, gecorrigeerd) |
| Positie DE (schijf) | `vooras_achteras_duits` ("Vorderachse") — NIET einbauposition_de/inbouwplaats_clean (leeg) |
| Type DE (schijf) | `remschijftype_de` ("Belüftet") — NIET remschijftype (NL) |
| Voertuig | `car_brands_top1` + `car_models_top1` (car_brand_primary bestaat NIET) |
| Schijf-maten | `buitendiameter`, `remschijfdikte`, `minimale_dikte`, `centreringdiameter` |
| Titel-conventie | `… für u.a. {car_brands_top1} {car_models_top1}` (afspraak Luca) — NIET "passend für" |
| eBay-categorie Remschijven | **33564** (Autoteile › Bremsen & Bremsenteile › Bremsscheiben) |
| eBay-categorie Remblokken | **57357** (Bremsbeläge) |
| Verzendmethode | **DPD Classic** (tracking → beschermt DACH Late-Shipment-Rate ≤3%) |
| Verzendlocatie | **Nieuwegein, 3433 KN, Nederland** ("Verzenden uit") |
| BTW | 19% (Duits tarief), via OSS |

---

## 2. Huidige eBay-attribuut-mapping — Bremsbeläge (uit screenshot Hans, huidige setup)

Kanaal opnieuw toegevoegd (om item-id=SKU in te stellen) → mappings gereset. Huidige stand op de Bremsbeläge-attributenpagina:

| eBay-attribuut | Nu gekoppeld aan | Actie |
|---|---|---|
| Hersteller (vereist •) | `brand` | ✓ goed |
| Herstellernummer | `sku` | ✓ goed |
| Material | `material` | ✓ (indien data) |
| Produktart | `product_type` | ✓ goed |
| **Breite** | **`diameter`** | ✗ **FOUT — verwijderen** (diameter = schijfmaat, geen blok-breedte) |
| Oe/Oem Referenznummer(N) | — | **koppelen aan `oe_reference`** |
| Vergleichsnummer | — | koppelen aan `oe_reference` |
| Anzahl Pro Packung | — | statisch "4" (via import-regel) |
| Einbauposition / overige | — | leeg (geen data) |
| Variatie: Herstellernummer op variant niveau | No | ✓ goed (geen varianten) |

---

## 3. Import-regels (attribuutverrijking o.b.v. aanwezige data)

Zie visuele mockup: `channable-import-regels-visueel.html`.

**Generiek (alle producten, geen conditie):**
- `ebay_oldtimer_teil` = "Nein" (statisch)
- `ebay_tuning_teil` = "Nein" (statisch)

**Remblokken (Als `categories_clean` bevat remblokken):**
- `ebay_anzahl_pro_packung` = "4" (statisch — bevestig dat alle blok-SKU's assets zijn)
- `ebay_lieferumfang` = "1 Bremsbelagsatz (4 Beläge)" (statisch)
- `ebay_oe_referenz` = kopieer `oe_reference`
- `ebay_vergleichsnummer` = kopieer `oe_reference`

**Niet verzinnen (leeg tot bron/policy bekend):** Ursprungsland, Herstellergarantie, Besonderheiten.

---

## 4. Kostenrem (NOOIT aan komen)

- Regel **"SKU selectie"** = `sku is één van [lijst]` → alleen die SKU's online (voorkomt €0,04/listing over alles). **Live money-guard — niet dupliceren/leeghalen.**
- Alternatief/aanvullend patroon: **aantal per categorie** (rangnummer per groep → verwijder als rang > N). Zie `channable-regelopbouw-visueel-alle-categorieen.html` (Limiet A/B).
- **Waarschuwing:** kanaal opnieuw toegevoegd → controleer dat SKU-selectie/limiet op het NIEUWE kanaal staat vóór "Uitvoeren".

---

## 5. Status (plan vs live) — eerlijk

| Werkstroom | Stand |
|---|---|
| GPSR-adres correctie (Tinbergenlaan 7) | ✅ opgeslagen (omschrijving-veld) + master/structured al goed |
| Merk-dynamisch (`{brand}`) i.p.v. hardcoded A.B.S. | ✅ opgeslagen (fallback-omschrijving) |
| Titel "für u.a."-conventie | ✅ verwerkt in alle prompts/mockups/skill |
| Remschijven titel+omschrijving PER KANAAL | 🔄 in aanbouw op laptop (velden bevestigd) |
| Remblokken / remklauwen / draagarmen | ⏳ prompt + Gmail-concept klaar, nog bouwen |
| Overige 16 categorieën | ⏳ prompts via `/channable-templates`; velden per categorie nog scannen |
| GPSR-mapping nieuw kanaal (manufacturer + EU-verantwoordelijke) | ⏳ opnieuw koppelen na kanaal-herbouw |
| Attribuut-import-regels | ⏳ te bouwen (deze mockup) |
| SKU-selectie op nieuw kanaal | ⚠️ controleren vóór Uitvoeren |
| Merk-conditioneel kwaliteits-/GPSR-blok voor Brembo | ⏳ zodra Brembo-SKU's live |

---

## 6. Deliverables deze sessie (in `_cowork/ccp-ebay-de/`)

- `channable-regelopbouw-visueel-alle-categorieen.html` — titel+omschrijving per categorie + kostenrem A/B
- `channable-import-regels-visueel.html` — import-regels attribuutverrijking
- `veld-gap-analyse-per-categorie.html` — wat ontbreekt per categorie + scan-prompt
- `PROMPT-eBayDE-titels-{remschijven,remblokken,remklauwen}-…md` + draagarmen-sjabloon
- `CLAUDE-CHROME-PROMPT-titel-omschrijving-per-categorie.md` — sjabloon + Produktart-tabel + geverifieerde veldnamen
- `channable-templates.SKILL.md` — dispatch-skill (v1.4) bron

*Bron sectie 2 = screenshot Hans (eBay Bremsbeläge attributenpagina, 2026-07-07). Overige = live scans deze sessie.*
