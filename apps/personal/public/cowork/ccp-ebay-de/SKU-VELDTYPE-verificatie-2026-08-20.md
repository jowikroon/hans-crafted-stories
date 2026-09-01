---
type: verificatie
scope: CCP · Channable 314525 · projectvelden en importkwaliteit
status: hypothese weerlegd
created: 2026-08-20
last_reviewed: 2026-08-20
bron: live Channable Setup > Projectvelden + Setup > Import kwaliteit + importinstellingen 745824
---

# SKU-veldtype: mijn hypothese was fout

## 1 · Wat ik dacht, en wat er staat

Ik vermoedde dat het projectveld `sku` numeriek was getypeerd, en dat dat de `NaN` bij Brembo en de 650 SKU-conflicten verklaarde.

**Dat klopt niet.** In `Setup → Projectvelden` staat:

```
sku    Tekst    CCP Attributen · Import Magento · Aantal producten beperkt o.b.v. dit bestand
```

Type **Tekst**, gebruikt door alle drie de imports. Er is geen numerieke cast.

Veldtelling over het hele project: **772 projectvelden**, waarvan 755 Tekst, 8 Getal, 4 Afbeelding. Alle SKU-achtige velden (`artikelnummer_paar`, `associated_skus`, `paarige_artikelnummer`, `ebay_de_*_artikelnummer`) zijn eveneens Tekst. `ean` is type GTIN.

Er staan wél **twee velden met de naam `sku`** in de lijst: één gekoppeld aan alle drie de imports, één zonder enige import. Die tweede is een wees en is een kandidaat voor de opschoning — maar niet de oorzaak van iets.

## 2 · Wat de 648 conflicten wél zijn

Uit `Setup → Import kwaliteit`, letterlijk:

| Niveau | Probleem | Items |
|---|---|---|
| Verplicht | `"sku"` bevat waarden die niet uniek zijn als ze **hoofdlettergevoelig** worden vergeleken | **648** |
| Aanbevolen | `"sku"` bevat waarden die niet uniek zijn als ze **hoofdletterongevoelig** worden vergeleken | **648** |

Dat is een **duplicatenprobleem**, geen typeprobleem. Dezelfde SKU komt twee keer voor. Omdat beide tellingen exact 648 zijn, verschillen de duplicaten niet in hoofdletters — het zijn echte dubbelen, precies zoals de veldcensus meldde ("exacte duplicaten uit Magento").

## 3 · Waar de NaN dan vandaan komt

De hoofdimport 745824 is een **Google Spreadsheet**:
`docs.google.com/spreadsheets/d/1GsdDap1vAuwS_bMfDLOhk_Hac3h1iF8roSuH5ninru0`

De veldkoppeling van diezelfde import toont correcte Brembo-SKU's (`08.1365.10`, `08.1395.40`, `08.1401.30`), terwijl het overzicht `Sku: NaN` liet zien. Met een Tekst-veld kan Channable dat niet zelf hebben veroorzaakt.

De waarschijnlijke verklaring is dan ook dat **`NaN` letterlijk als tekst in die spreadsheet staat** — het klassieke artefact van een pandas- of Excel-export waarin lege cellen als `NaN` worden weggeschreven. Dat verklaart ook `37 477.00` en `15 315.00`: getalsopmaak die in de sheet zelf zit, niet in Channable.

**Nog niet bewezen.** Om dit hard te maken moet de spreadsheet zelf worden bekeken — hoeveel rijen hebben `NaN` in de SKU-kolom, en welke. Dat is een kwestie van de sheet openen, niet van Channable.

## 4 · Wat de kwaliteitspagina wél blootlegt — en dit is groter

Totaal aantal items: **23.966**.

| Probleem | Items | Betekenis |
|---|---|---|
| `image_main_1600` leeg | **23.966** | 100% — geen enkel item heeft de hoofdafbeelding op 1600×1600 |
| `material_safe_data_sheet` leeg | **23.966** | 100%, en het staat op *Verplicht* |
| Magento levert geen `categories` | **20.013** | 84% van de catalogus komt zonder categorie binnen |
| Magento levert geen `active_category_ids` | 20.013 | idem |
| Magento levert geen `category_urls` / `category_paths` | 20.013 | idem |
| Magento levert geen `sale_price` | **31.504** | méér dan het aantal items — de Magento-export bevat dus meer rijen dan er items overblijven |
| Magento levert geen `ean` | 22 | klein |
| Magento levert geen `image_link` | 16 | klein |

**Dit verplaatst de diagnose van de categoriedekking.** De 14.837 items zonder Categorie ID in het eBay-kanaal zijn geen kwestie van een ontbrekende Channable-regel — de **Magento-export levert voor 20.013 items simpelweg geen categorie aan**. Geen enkele regel in Channable kan een veld vullen dat niet binnenkomt. De fix zit in de Magento-export, niet in de feed.

## 5 · Nog een gat: geen rem op de whitelist

Bij de hoofdimport staat *"Actie wanneer er een grote wijziging in de import plaatsvindt"* op **"Geen actie"**.

Die import bepaalt welke producten überhaupt bestaan ("Aantal producten beperkt o.b.v. dit bestand"). Als die Google Sheet leegloopt of half wordt overschreven, verdwijnt de catalogus zonder waarschuwing. Op een kanaal dat vaststaat op *Publiceer* is dat een reëel risico. Zet dit op een waarschuwing of blokkade.

## 6 · Wat dit betekent voor de opschoning

772 projectvelden, waarvan het overgrote deel nergens aan een import hangt. De eerdere claim van "342 verwijderkandidaten" is met dat totaal plausibel — maar de kolom *Gebruikt bij import* in Projectvelden is de enige betrouwbare filter, en die is nu leesbaar. Een veilige saneringslijst is dus te maken: alles zonder import én zonder gebruik in een actieve regel.

Dat blijft een aparte, gecontroleerde actie. Niet vanavond, en niet blind.
