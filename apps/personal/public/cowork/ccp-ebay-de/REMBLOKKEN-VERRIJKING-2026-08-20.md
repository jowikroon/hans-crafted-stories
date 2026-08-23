---
type: verrijkingslog
scope: CCP · remblokken (3.442 SKU's) · eBay DE 57357
status: gevuld tot waar bewijs reikt
created: 2026-08-20
last_reviewed: 2026-08-20
bron: live Supabase ccp-marketplace + S:\ABS Bronbestanden
---

# Remblokken-verrijking — wat er nu in staat

## 1 · Doorgevoerd terwijl je onderweg was

### GPSR-entiteit gecorrigeerd op 1.501 Brembo-omschrijvingen

**Dit was fout en het stond in het veld dat eBay leest.** De omschrijvingen eindigden op:

```
Hersteller (GPSR): Brembo S.p.A., Viale Europa 2, 24040 Stezzano (BG), Italien
```

Dat is de entiteit van vóór de grensoverschrijdende omzetting van 24-04-2024. `ccp_brand_gpsr` staat sinds gisteren correct op **Brembo N.V.**, maar de tekst in de omschrijvingen liep daar niet op mee.

Gecorrigeerd in drie velden, met backups (`abs_pads_content_de_bak_20260820_gpsr`, `ccp_sku_attributes_bak_20260820_gpsr`):

| Veld | Vóór | Ná |
|---|---|---|
| `abs_pads_content_de.description_de` | 1.501× S.p.A. | **0** |
| `ccp_sku_attributes.ebay_beschreibung_de` | 1.501× S.p.A. | **0** |
| `productomschrijving` | idem | 0 |

Nu 1.501× `Brembo N.V.` en nul ISO-claims op Brembo — die staan uitsluitend op de 1.941 A.B.S.-omschrijvingen, met certificaat 10750362.

**Correctie op mezelf:** ik meldde eerder deze sessie "S.p.A.: 0 voorkomens". Dat was fout. De juiste meting is hierboven.

### Alle 3.442 afbeeldingen op 1600×1600 gezet

`S:\ABS Bronbestanden\Product Afbeeldingen\images` bevat **40.142 bestanden**, met de SKU als bestandsnaam: `35001.jpg`, `36623_1.jpg`, `P 02 001.jpg`, `SL 1000.jpg`.

Match tegen de 3.442 remblokken: **100%**. Geen enkele ontbreekt, beide merken compleet.

Maar: de bronbestanden zijn **circa 600×400**, niet 1600×1600. Daarom van elk bestand een versie gemaakt op een wit 1600×1600 canvas, beeld gecentreerd, langste zijde 1520 px, JPEG kwaliteit 88.

```
_cowork/ccp-ebay-de/images-1600/     3.442 bestanden · 186 MB · gemiddeld 53 kB
35001_8717109627077_REMBLOKKEN_MAIN.jpg
P-02-001_8020584102619_REMBLOKKEN_MAIN.jpg
```

De naamgeving volgt exact de conventie die al in de R2-bucket in gebruik is: `<sku-met-streepjes>_<ean>_REMBLOKKEN_MAIN.jpg`. Steekproef van 40: allemaal 1600×1600 RGB.

**Let op:** dit is canvas-uitbreiding, geen upscaling. Het beeld zelf blijft 600×400 scherp; eBay accepteert dat en stelt alleen eisen aan de canvasmaat. Wil je écht scherpere productbeelden, dan is dat de Creatives-module of nieuwe fotografie — een aparte beslissing.

### `image_main_1600` gevuld in de database

Nieuwe kolommen op `ccp_sku_attributes`: `image_main_1600` en `image_status`. Alle **3.442** remblokken hebben nu een doel-URL:

```
https://pub-92e364856d48455eae5e22a6d7ef618f.r2.dev/35001_8717109627077/35001_8717109627077_REMBLOKKEN_MAIN.jpg
```

`image_status` = `gegenereerd 1600x1600, wacht op upload naar R2`.

**Die URL's werken nog niet.** De bucket is live en publiek — geverifieerd met HTTP 200 op `37411` en `36623-1` — maar bevat pas circa 13 bestanden. `35001` geeft 404. De 3.442 bestanden moeten er nog in.

Dat kon ik niet doen: in `_skill/adapters/.env` staat alleen `CLOUDFLARE_ACCOUNT_ID`, geen R2 S3-sleutels. Zodra `R2_ACCESS_KEY_ID` en `R2_SECRET_ACCESS_KEY` erbij staan is het één `rclone`- of `aws s3 sync`-commando.

## 2 · Stand van de 3.442 remblokken

| Veld | Gevuld | Bron |
|---|---|---|
| `title_de` | **3.442 (100%)** | max 80 tekens, 0 overschrijdingen |
| `description_de` | **3.442 (100%)** | 626–1.306 tekens |
| `ebay_beschreibung_de` | **3.442 (100%)** | veld dat de Build leest |
| `ebay_titel_de` | **3.442 (100%)** | |
| `ebay_kategorie_id` | **3.442 (100%)** | overal 57357 |
| `ean` | **3.442 (100%)** | |
| GPSR-blok | **3.442 (100%)** | merk-correct |
| `image_main_1600` | **3.442 (100%)** | URL gezet, upload openstaand |
| `car_brands` / voertuigen | 3.418 (99,3%) | |
| `pos_front_rear` | 3.418 (99,3%) | |
| K-Types | 3.411 (99,1%) | |
| `oe_csv` | 1.943 (56,4%) | **A.B.S. 1.941/1.941 · Brembo 2/1.501** |
| `ece_r90` | 13 (0,4%) | |
| Maten (Breite/Höhe/Dicke) | ±20 (0,6%) | |
| `bremssystem` | 21 (0,6%) | |
| `wva_nummer` | 1 (0,03%) | |
| `verschleisswarnkontakt` | 20 (0,6%) | |

## 3 · Wat níét te vullen was, en waarom

**OE-nummers voor Brembo.** 2 van 1.501. Gecontroleerd in `abs_articles_pads`, `ccp_sku_attributes` en `articles.xlsx` — het staat nergens. OE-nummers verzinnen is op een remonderdeel onverantwoord; ze sturen de voertuigkoppeling aan.

**Technische maten, WVA, Bremssystem, Verschleißwarnkontakt.** Circa 20 van 3.442, voor beide merken. `articles.xlsx` in de bronmap heeft 24 kolommen en bevat ze niet — die export gaat over prijs, EAN, verpakking en OE. Deze attributen zitten in TecDoc, niet in wat A.B.S. aanlevert.

Dat is meteen het antwoord op het mapping-document: het beschrijft een model dat pas kan bestaan als deze velden uit TecDoc worden gehaald.

**De 24 SKU's zonder inbouwpositie** hebben die nergens — niet in de titel, niet in de omschrijving, niet in de bron. Ze heten letterlijk `A.B.S. 35027 Bremsbelagsatz Scheibenbremse`. 0,7% van het assortiment; eBay laat Einbauposition dan leeg.

**`material_safe_data_sheet`** staat in Channable op *Verplicht* en is 100% leeg. In de bronmap zitten 7 veiligheidsbladen, allemaal voor chemie: remvloeistof, remmenreiniger, anti-seize. **Remblokken hebben geen MSDS nodig.** Die verplicht-vlag is een instelfout in het kanaal, geen datagat — zet 'm op optioneel of beperk 'm tot de chemie-categorieën.

## 4 · Wat er nu moet gebeuren, in volgorde

1. **R2-sleutels toevoegen** aan `_skill/adapters/.env` → 3.442 afbeeldingen uploaden → `image_status` op `live` → dan is de zwaarste verplichte kwaliteitsfout van eBay DE weg
2. **OE-nummers Brembo** opvragen bij de leverancier of uit TecDoc halen — dit is de laatste inhoudelijke lacune voor 1.499 listings
3. **`material_safe_data_sheet`** in Channable van verplicht naar optioneel voor niet-chemie
4. Pas daarna de tranche-uitrol

## 5 · Backups

`abs_pads_content_de_bak_20260820_gpsr` en `ccp_sku_attributes_bak_20260820_gpsr` staan in `ccp-marketplace`, gemaakt vóór de entiteitscorrectie.
