> ⛔ **ONGELDIG per 2026-08-19** — live UI-scan toont dat "Attributen per categorie" LEEG is. Er bestaat geen mismap `ebay_de_bremsbelage_*` en geen export-hold (kanaal staat op Publiceer). De veldnamen `oe_nummern` / `einbauposition` / `lochkreis_mm` / `laenge_mm` bestaan niet in Channable. Zie `_cowork/channable-operator/state/NULMETING-eBayDE-live-UI-2026-08-19.md`. **NIET UITVOEREN.**

# OP-0.5 — Repoint remschijf-attributen (Bremsscheiben 33564) · 2026-08-19

**Operator:** Claude in Chrome, ingelogd op app.channable.com als Hans.
**Scope:** company 101300 · project 314525 · kanaal eBay API-id **159122** · Build → Attributes per category → **Bremsscheiben (33564)**.
**Werkwijze:** verifieer-eerst → repoint → preview → opslaan → stoppen. Geen data toevoegen; alleen bronvelden herkoppelen.
**Vervangt:** `PROMPT-eBayDE-mismap-correctie-2026-07-24.md` (24-07, nooit uitgevoerd — veldnamen daarin zijn verouderd, zie §1).

---

## 0 · BLOKKEREND — OP-0 moet eerst klaar zijn

Deze prompt mag pas draaien nadat de export-schema's op hold staan. Reden is niet procedureel maar hard:

De eBay-Preview toont `compatibility_k_type = Empty` én `compatibility_description = Empty` op **alle 229 rijen**, terwijl die outputkolommen wél bestaan in het kanaal (geverifieerd 24-07, §10 van de 100pct-data-verificatie). De K-Types staan er dus alleen omdat ze **handmatig via het Verkäufer-Cockpit** zijn geüpload — Channable draagt ze niet.

Consequentie: één ongeplande push kan een lege compatibility over de handmatige Fahrzeugverwendungsliste heen schrijven. Op SKU 37411 gaat dat om **708 KTypes**; op 16880/18537 om de groene "Passt zu Ihrem Fahrzeug"-stripe.

**Doe dit eerst:** eBay-kanaal 159122 → Instellingen/Schema → alle geplande runs op **hold/pauze**. Bevestig met screenshot vóór stap 1.

---

## 1 · Waarschuwing veldnamen — herverifiëren, niet blind overnemen

De 24-07-spec noemde `oe_list` en `vooras_achteras_duits`. Die namen komen uit de **oude** verrijkingslaag (`Extra specs`, `laatste 2 categorietjes`). Beide imports zijn sindsdien **verwijderd** en geconsolideerd in de JSON-import **`CCP Attributen`** (Supabase `v_channable_import` ← `ccp_sku_attributes`, 398 SKU's).

Die consolidatie heeft de veldnamen **verduitst**. Geverifieerd op SKU 37411 (2026-08-19):

`einbauposition` · `dicke_mm` · `hoehe_mm` · `breite_mm` · `bremssystem` · `produktart` · `ece_r90` · `baujahr_von` / `baujahr_bis` · `verschleisswarnkontakt` · `warnkontaktlaenge_mm` · `ebay_category_id` · OE-nummers (45) · ktypes (708) · modellen (58)

→ **`oe_list` en `vooras_achteras_duits` bestaan mogelijk niet meer.** Repoint niet op een naam uit dit document zonder hem in de veldkiezer te hebben gezien.

---

## 2 · STAP 1 — scan (read-only)

Open Build → Attributes per category → **Bremsscheiben (33564)**. Klik elke chip open voor de volledige veldnaam. Noteer per rij het huidige bronveld.

Verwacht fout (`ebay_de_bremsbelage_*` op een schijf-categorie = altijd leeg):

| eBay-attribuut | verwacht huidig bronveld (FOUT) |
|---|---|
| Oe/Oem Referenznummer(n) | `ebay_de_bremsbelage_oe_oem_referenznummern` |
| Einbauposition | `ebay_de_bremsbelage_einbauposition` |
| Besonderheiten | `ebay_de_bremsbelage_besonderheiten` |
| Im Lieferumfang Enthalten | `ebay_de_bremsbelage_im_lieferumfang` |
| Vergleichsnummer | *(leeg / ongemapt)* |

Check daarnaast of **Lochkreis** en **Länge** verwisseld staan (leken 24-07 op `ebay_de_bremsscheiben_lange` resp. `_mater…`).

**Rapporteer de scan vóór je iets wijzigt.**

---

## 3 · STAP 2 — repoint met kandidaat-ladder

Type in de veldkiezer de eerste kandidaat. Bestaat hij niet → volgende. Geen enkele kandidaat aanwezig → **STOP en rapporteer**, niet improviseren.

| eBay-attribuut | kandidaat 1 (nieuw) | kandidaat 2 (oud) | kandidaat 3 |
|---|---|---|---|
| **Oe/Oem Referenznummer(n)** | `oe_nummern` | `oe_list` | `oe_reference` |
| **Einbauposition** | `einbauposition` | `vooras_achteras_duits` | `einbauposition_de` |
| **Vergleichsnummer** | `oe_nummern` | `oe_list` | `oe_references` |
| **Besonderheiten** | `ece_r90` (zie noot) | `ebay_de_bremsscheiben_besonderheiten` | **leeglaten** |
| **Im Lieferumfang Enthalten** | `ebay_de_bremsscheiben_im_lieferumfang` | — | **leeglaten** |
| **Lochkreis** | `lochkreis_mm` | `bolt_pattern` | — |
| **Länge** | `laenge_mm` | — | **leeglaten** |

Verwijder telkens het foute `bremsbelage`-veld uit de chip.

**Noot Besonderheiten:** de ECE-R90-string (`E11 90R-01 0/414`) is een sterk trust-signaal en categoriebreed geldig. Toegestaan als vrije-tekst-toevoeging: *"Matching-Quality-Ersatzteil gemäß EU-Verordnung (EG) 461/2010"*. ISO-9001-claim mag WÉL (correctie 2026-08-19): het oude cert 10499964 verliep 11-03-2026, maar cert **10750362 is geldig t/m 11-03-2029** (LRQA approval 00009185). Zie `compliance/ISO9001-ABS-cert-10750362-bewijs-2026-08-19.md` + agent_knowledge id 50.

Laat ongemoeid (stonden 24-07 correct): Aussendurchmesser · Bremsscheibenart · Höhe · Mindestdicke · Stärke · Oberflächenbeschaffenheit · Produktart · Material · Hersteller · Herstellernummer.

---

## 4 · STAP 3 — preview op SKU 16880 (geverifieerde remschijf)

Na de repoint moet in Preview verschijnen:

- **Einbauposition** = `Vorderachse` of `Hinterachse` — niet leeg
- **Oe/Oem Referenznummer(n)** = gevulde OE-lijst — niet leeg
- **Vergleichsnummer** = gevuld
- **Aussendurchmesser / Mindestdicke / Stärke** = ongewijzigd gevuld

Klopt het → **"Regel opslaan" / Save**. Screenshot + melden.

Ziet één van deze er nog leeg uit → **niet opslaan**, rapporteren met screenshot.

---

## 5 · HARDE GUARDRAILS

1. **Nooit "Uitvoeren" / "Run now"** — alleen Save. De export-hold uit §0 blijft staan tot Hans hem expliciet vrijgeeft.
2. **Nooit aan SKU selectie** (27858166).
3. Alleen categorie **33564** in deze run. Bremsbeläge (57357), Bremssättel en Sonstige zijn OP-0.6 — spiegelbeeldfout waarschijnlijk aanwezig, maar aparte run.
4. Twijfel over een veldnaam → STOP.
5. eBay-API-compliance: geen scraping, geen klantdata, alleen de Channable-UI.

---

## 6 · Wat dit wél en niet oplost

**Wel:** de actieve data-afbraak op de 92 remschijf-SKU's binnen de 398-masterfile. Elke herpush schreef tot nu toe leeg over gevuld.

**Niet:** de scope-bottleneck. 398 verrijkte SKU's tegen 29.995 in de whitelist en 31.923 in Magento. De ~3.292 remblokken buiten de masterfile krijgen alleen ruwe Magento option-ID's (`remsysteem = 385` i.p.v. `LUCAS/TRW`) — dat is laag 1 van het masterplan (`v_channable_category_enrichment`), niet deze run.

**Ook niet:** GPSR-blok 4. `Product safety component` staat nog op *Unmapped*; pictogram- en statement-codes zijn leeg. Compliance-risico, aparte prompt (`PROMPT-eBayDE-GPSR-safety-mapping-2026-07-24.md`).

---

Gerelateerd: [[eBay-DE-Launch]] · [[eBay-DE-KType-Compatibiliteit]] · [[Channable-D365-Integration]] · [[ABS-Brand-Profile]]
