---
type: uitgevoerde fix + operator-instructie
scope: CCP · Channable 314525 · contributiemarge vóór marketplace-kosten · Brembo SKU-weergave
status: DB-kant live · Channable-kant wacht op één UI-handeling
created: 2026-08-21
last_reviewed: 2026-08-21
bron: live Supabase-migraties kskumhtisifsdjjbzvbo · Magento REST · Google Sheet "versie2" (1GsdDap1...) · SKU-VELDTYPE-verificatie-2026-08-20
---

# Marge stuurbaar gemaakt + Brembo SKU-diagnose

## 1 · Wat er nu in Channable staat (na eerstvolgende import-run van 849793)

De import "CCP Attributen" leest `v_channable_import` met `select=*`, dus onderstaande velden komen automatisch mee. **Geen mapping-wijziging nodig.**

| Veld | Betekenis | Gevuld |
|---|---|---|
| `inkoopprijs` | inkoop ex btw × stuks per verkoop (COGS van de listing) | 3.688 / 3.690 |
| `contributie_marge_eur` | **netto verkoop − inkoop, vóór alle marketplace-kosten** | 2.983 |
| `contributie_marge_pct` | eur / netto verkoop × 100 | 2.983 |
| `marge_status` | Verliesgevend / Laag / Gezond / Hoog / Onbekend | **3.690 (100%)** |
| `marge_compleet` | true zodra inkoop én echte verkoopprijs bekend | **3.690, nooit leeg** |
| `netto_marge_eur` / `_pct` / `_status` | het oude beeld: ná verzend, verpakking, commissie, ads, derving | 2.983 |
| `kosten_compleet` | true als ook gewicht bekend is (nodig voor verzendkosten) | 3.690 |
| `stuks_per_verkoop` · `inkoopprijs_per_eenheid` | de bouwstenen, controleerbaar | 3.690 / 3.688 |

**Sturen doe je zo:** omzetpotentie op `verkoopprijs_bruto`, contributie op `contributie_marge_*` (wat houd je over vóór eBay er iets van afsnoept), werkelijke winstgevendheid op `netto_marge_*`. Selectie "alles wat na kosten verlies draait": `netto_marge_status = Verliesgevend`.

## 2 · De btw-vraag, beantwoord

- `inkoopprijs` in `ccp_sku_attributes` is de **ABS B2B-prijslijst: exclusief btw**. Geverifieerd tegen `einkaufspreis` uit het ABS-assortiment: 0 conflicten op 3.688 SKU's.
- `verkoopprijs_bruto` is de live eBay-prijs: **inclusief 19% Duitse btw**.
- Bruto minus inkoop zou dus appels met peren zijn. De berekening is: `netto = bruto / 1,19`, daarna `contributie = netto − inkoop × stuks`. Steekproef 16880: 54,80 / 1,19 = 46,05 − (2 × 9,85) = **26,35 (57,2%)** — klopt handmatig nagerekend.
- De paar-correctie zit in `stuks_per_verkoop` uit `ccp_kosten_parameters`: Bremsscheiben 2, Bremsbeläge 1.

## 3 · Statusverdeling na de herbouw

| Status | Aantal | Gem. pct |
|---|---:|---:|
| Hoog | 1.621 | 64,1% |
| Gezond | 1.351 | 38,9% |
| Onbekend | 707 | — |
| Laag | 10 | 16,4% |
| Verliesgevend | 1 | −5,8% |

De 707 Onbekend (556 A.B.S. + 151 Brembo) hebben **geen gemeten echte verkoopprijs** — ze staan niet live en zitten niet in de prijsmeting van 20-08. Bewust géén adviesprijs als vervanger gebruikt: jij vroeg om de échte verkoopprijs. Zodra de dagelijkse prijsrun ze meet, vullen ze zichzelf. Twee SKU's missen inkoop: `P 54 065` en `35465`.

## 4 · Brembo SKU "8.14" — de bron is NIET vervuild

Alle drie de bronnen zijn vandaag live gecontroleerd op `08.1432.10`:

| Bron | Resultaat |
|---|---|
| Magento REST | `08.1432.10` bestaat exact (entity 37655); `8.14` bestaat niet |
| Supabase v_channable_import | 0 verdachte decimaal-SKU's, 0 NaN |
| Google Sheet "versie2" (hoofdimport 745824) | alle Brembo-SKU's staan er correct als tekst, incl. 08.1432.10 |

**Conclusie: de verminking ontstaat ín Channable bij het inlezen.** `08.1432.10` wordt door een numeriek getypeerd veld als getal geparsed → 8.1432 → weergave met 2 decimalen = "8.14". Dit is dezelfde klasse als de "37 477.00"-weergave van 20-08. Relevante meting van toen: er bestaan **twee projectvelden met de naam `sku`** (één wees, zonder import) en 8 van de 772 velden zijn type Getal.

### Operator-fix (Channable UI, 10 minuten — kan ik niet vanaf hier, API-token is order-scoped)

1. **Setup → Projectvelden**: zoek beide velden `sku`. Noteer per veld het type en welke imports erop mappen. Het wees-veld (zonder import): als het type Getal is, is dit vrijwel zeker de boosdoener → hernoem naar `sku_OUD_NIET_GEBRUIKEN` of verwijder het.
2. **Setup → Imports → 745824 (Google Sheet)**: open de veldmapping. De kolom `SKU` moet op het **tekst**-veld `sku` staan — het veld dat ook de Magento-import gebruikt. Zelfde check voor de EAN-kolom (moet ook tekst zijn: EAN's met voorloopnul).
3. Draai de import opnieuw en controleer onder **Items** het product met EAN `8020584143216`: SKU moet `08.1432.10` tonen.
4. Regressiecheck op 3 andere vormen: een A.B.S.-nummer (`16880`), een P-serie (`P 06 001`) en een slash-SKU (`36623/1`).

⚠ Niet doen: de SKU-kolom in de Google Sheet "als getal opmaken" of de sheet aanpassen — die is goed. De fix zit uitsluitend in de Channable-veldtypering/mapping.

## 5 · Wat er in de database is gewijzigd (migraties, teruglezen mogelijk)

- `contributie_voor_marketplace_kosten`: `v_sku_marge` herbouwd — contributie nu vóór marketplace-kosten; oude na-kosten marge behouden als `netto_marge_*`; `marge_compleet` eist geen gewicht meer (daarvoor is `kosten_compleet`).
- `channable_import_netto_marge_kolommen`: `v_channable_import` geeft de nieuwe kolommen achteraan door.
- Geen tabellen gewijzigd, geen data verwijderd; views zijn omkeerbaar via migratiehistorie.

Gerelateerd: `MARGEMODEL-contributiemarge-per-SKU-2026-08-20.md` · `SKU-VELDTYPE-verificatie-2026-08-20.md` · `PLAN-bundels-veilig-implementeren-2026-08-21.md`
