# Volledige workflow — eBay DE KType voertuigkoppeling

## 1. Aanlevering door de specialist (long-format)
Kolommen: `sku;ktype;einbauposition`. Eén regel per SKU-KType-combinatie. KType = kaal numeriek
TecDoc-ID. `einbauposition` is optioneel (Vorderachse / Hinterachse / Vorderachse links) en wordt
de Note. Bewaren als `ktype-linkage.csv`. Zie `../templates/ktype-linkage-TEMPLATE.csv`.

De ruwe ABS TecDoc-export mag direct als input: het script trimt SKU-padding (trailing spaces) en
snift de scheiding (`;` of `,`). Alleen SKU's met een bekende ItemID worden verwerkt; de rest van
het (grote) bestand wordt genegeerd.

Belangrijk: de ABS **specs/OE-export bevat GEEN ktypes** — dat is een aparte TecDoc-koppeltabel.
Ontbreken de ktypes voor een SKU (zoals remblokken 37414/37760 op 21-07-2026), dan kun je die SKU
niet koppelen. Meld dat en vraag de koppeltabel op; verzin niets.

## 2. MVL downloaden (validatiebron)
Verkauferportal (DE) > **Angebote > Fahrzeugteile > PKW & Transporter** >
"Fahrzeugverwendungsliste herunterladen". Versie 26.04 (april 2026). Wachtwoord: `Fahrzeugliste`.
Bewaren als `Fahrzeugverwendungsliste.xlsx`.

NL-equivalent van het pad: Verkoperscentrum > Verkopen > Actieve advertenties (auto-onderdelen) >
sectie Voertuiggegevens/Compatibiliteit > "Voertuiggebruikslijst downloaden". Let op: de
onderliggende Motors-pagina van eBay.de blijft vaak Duits, ook met NL-taalinstelling.

## 3. Genereren + valideren
```bash
pip install pandas openpyxl msoffcrypto-tool
python3 ../scripts/build_ebay_compat.py                 # met validatie tegen de MVL
python3 ../scripts/build_ebay_compat.py --no-validate   # dry-run zonder MVL
```
Output:
- `ebay-compatibility-import.csv` — upload-klaar (geverifieerd format).
- `ktype-rejects.csv` — ktypes die NIET in de MVL staan (fix/negeer vóór upload).
Het script waarschuwt als een SKU boven de limiet komt.

Alternatieve validatieroutes (programmatisch, voor het MPG-platform):
- **Taxonomy/Metadata API**: `getCompatibilityProperties`, `getCompatibilityPropertyValues`,
  `getAutomotivePartsCompatibilityPolicies` — check welke aspecten/categorieën Parts Compatibility
  ondersteunen (leaf-categorie 33564 Bremsscheiben, 57357 Bremsbeläge).
- **Browse API `checkCompatibility`**: test op een live ItemID of eBay een voertuig als Compatible /
  Not Compatible / Likely Compatible ziet. Werkt alleen in productie (Sandbox heeft alleen mock-data).
- **TecDoc-sync**: ABS' 4-wekelijkse TecDoc-cyclus synchroon houden voorkomt verouderde ktypes.

## 4. Uploaden
Verkaufer-Cockpit Pro > **Berichte > Uploads** > bestand kiezen > uploaden. eBay verwerkt asynchroon.
Download daarna het resultaatbestand en controleer op foutcodes (zie `verified-format.md`). Controleer
op de live itempagina of "Prüfen Sie die Artikelbeschreibung" is vervangen door de voertuigselector.

## 5. Splitsen boven de limiet (3.000 voertuigen)
eBay telt geëxpandeerd per bouwjaar, dus de limiet komt sneller in zicht dan het aantal ktypes suggereert.
Boven de limiet: splits de SKU over **max. 5 aparte listings**, elk met een **eigen ItemID**, en
**zonder enige overlap** tussen de KType-lijsten (overlap = duplicate-afkeuring).

Channable-aanpak (automatisch splitsen):
1. Projectveld `splits_index` aanmaken; voor risicovolle SKU's vullen met `deel_1,deel_2`.
2. Regel "Splits artikelen" op de komma → Channable genereert een rij per deel.
3. SKU/MPN uniek maken per deel: bij `deel_2` → `%item_sku%_2` (titel + afbeeldingen mogen identiek).
4. KTypes gesegmenteerd mappen naar `ItemCompatibilityList` (bv. VAG-merken op deel_1, Franse merken
   op deel_2) — geen overlap, geen lege regels.

## Channable-alternatief (realtime, i.p.v. bulk-CSV)
Voor doorlopende sync kun je de KTypes in Channable mappen naar `ItemCompatibilityList` (komma-
gescheiden per SKU, `|` voor een note). Dan activeert de Parts Finder automatisch bij elke feed-run.
De bulk-CSV in deze skill is de directe backend-route voor bestaande/actieve listings; de Channable-
route is de structurele route vanuit de bronsystemen. Zie de `channable-templates`-skill voor de
kanaalregels.
