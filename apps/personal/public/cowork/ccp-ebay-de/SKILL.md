---
name: ebay-ktype-compat
description: Bouw en valideer het eBay DE voertuigcompatibiliteit-importbestand (Fahrzeugverwendungsliste) uit een ABS TecDoc KType-export, zodat de groene "Passt zu Ihrem Fahrzeug"-stripe (Parts Finder) verschijnt. Use whenever the user says "voeg ktypes toe", "ebay compatibiliteit", "voertuigkoppeling", "Fahrzeugverwendungsliste", "parts finder groene stripe", "ktype import", "bulk voertuigen uploaden eBay", "compatibiliteits-CSV", "koppel remschijven/remblokken aan voertuigen", of een KType-linkage/ABS TecDoc-export deelt en er een upload-klaar eBay-bestand van wil. Genereert het GEVERIFIEERDE hierarchische eBay-format (Revise-artikelregel + Add,,Compatibility,ktype= per voertuig), valideert tegen de officiele MVL, bewaakt de 3.000-limiet en levert een upload-klaar CSV voor Verkaufer-Cockpit Pro > Berichte > Uploads.
scope: [CCP]
last_reviewed: 2026-07-21
---

# ebay-ktype-compat

Doel: A.B.S.-listings op **eBay.de** voorzien van gestructureerde voertuigcompatibiliteit
(de *Fahrzeugverwendungsliste*), zodat de groene **"Passt zu Ihrem Fahrzeug"**-stripe (Parts
Finder) verschijnt. Dat gebeurt via **KType-ID's** — niet via platte tekst in titel of omschrijving.

Een KType is de unieke TecDoc-code voor één voertuiguitvoering (model + motor + vermogen +
bouwperiode). eBay gebruikt hem als sleutel om een onderdeel te matchen tegen zijn eigen Master
Vehicle List (MVL). ABS levert deze koppelingen als TecDoc Premier Supplier.

**Conclusie eerst, altijd:** een importbestand is pas bruikbaar als (1) de ItemID's echte, live
eBay-nummers zijn en (2) de KTypes uit de ABS TecDoc-export komen — niet gegenereerd/geraden.
Verzin nooit ItemID's of KTypes. Ontbreekt een van beide, meld dat en stop.

## Wanneer deze skill draait
Bij elk verzoek om eBay DE voertuigcompatibiliteit: "voeg ktypes toe", "maak de compatibiliteits-CSV",
"koppel deze SKU's aan voertuigen", "parts finder werkt niet", "Fahrzeugverwendungsliste", of wanneer
Hans een KType-linkage / ruwe ABS TecDoc-export (`sku;ktype;einbauposition`) deelt.

## Inputs (source of truth — nooit verzinnen)
1. **KType-linkage** (long-format, van de ABS/TecDoc-export): kolommen `sku;ktype;einbauposition`,
   één regel per SKU-KType. Zie `templates/ktype-linkage-TEMPLATE.csv`. De ruwe ABS-export mag
   direct als input (SKU's met trailing spaces en `;`-scheiding worden opgevangen).
2. **SKU → ItemID**: geverifieerde, live eBay DE advertentienummers. De pilot-set staat ingebouwd
   in het script en in `references/itemids.md`. Nieuwe SKU's: lever een `sku,itemid`-CSV mee via
   `--itemid-map`, of verifieer eerst live in Seller Hub (Claude in Chrome).
3. **MVL** (validatiebron, optioneel maar aangeraden): de met wachtwoord beveiligde
   `Fahrzeugverwendungsliste.xlsx` uit het Verkauferportal. Wachtwoord: `Fahrzeugliste`.

## Workflow (handel autonoom door de stappen)
1. **Aanlevering check** — heb je een linkage met echte KTypes én ItemID's voor de betrokken SKU's?
   Zo nee: benoem exact wat ontbreekt (bv. "remblokken 37414/37760 hebben geen KTypes in de export")
   en stop of vraag de ontbrekende input. Nooit placeholders uploaden.
2. **MVL** — download de Fahrzeugverwendungsliste (Verkauferportal > Angebote > Fahrzeugteile >
   PKW & Transporter). Zonder MVL kan het script draaien met `--no-validate`, maar dan filtert eBay
   de ongeldige KTypes pas ná upload (als warnings in het resultaatbestand).
3. **Genereren** — draai het script (zie hieronder). Output = upload-klaar `ebay-compatibility-import.csv`
   in het geverifieerde hierarchische format, plus `ktype-rejects.csv` (KTypes buiten de MVL).
4. **Uploaden** — Verkaufer-Cockpit Pro > **Berichte > Uploads** > bestand kiezen. eBay verwerkt
   asynchroon. Download daarna het resultaatbestand en check foutcodes (bv. `25023` = ongeldige
   compatibiliteit). KTypes die eBay's MVL niet kent worden per regel geweigerd — dat is geen scriptfout,
   die voertuigen bestaan simpelweg niet in eBays database.
5. **Live verifiëren** — check op de itempagina of "Prüfen Sie die Artikelbeschreibung" is vervangen
   door de voertuigselector / "Teil ist kompatibel mit N Fahrzeug(en)". Gebruik Claude in Chrome.

## Het script draaien
```bash
pip install pandas openpyxl msoffcrypto-tool     # eenmalig, alleen nodig voor MVL-validatie

# met validatie tegen de MVL (aangeraden):
python3 scripts/build_ebay_compat.py --linkage ktype-linkage.csv --mvl Fahrzeugverwendungsliste.xlsx

# snelle dry-run zonder MVL (format/aantallen checken):
python3 scripts/build_ebay_compat.py --linkage 20260721_KTypes.csv --no-validate

# extra SKU's met eigen ItemID's:
python3 scripts/build_ebay_compat.py --itemid-map mijn-itemids.csv
```
Het script trimt SKU-padding, snift `;`/`,`, verwerkt alleen SKU's met bekende ItemID, voegt een
KType die op meerdere assen zit samen tot één regel (posities in de note), en rapporteert per SKU
het aantal voertuigen, ontbrekende ItemID's, lege SKU's en overschrijding van de limiet.

## GEVERIFIEERD importformaat (niet afwijken)
1-op-1 getoetst aan eBay's eigen sample (`Upload_Fahrzeugverwendungsliste_Autoteile.xlsx`, 21-07-2026)
én aan een geslaagde live upload. Het format is **hiërarchisch**:
```
Action,ItemID,Relationship,Relationship Details
Revise,257626217845,,                              <- artikelregel: kolom C+D LEEG
Add,,Compatibility,ktype=8798|Notes=Vorderachse    <- 1 voertuig per regel, ItemID LEEG
Add,,Compatibility,ktype=9306|Notes=Vorderachse
Revise,257624435711,,                              <- volgend artikel
Add,,Compatibility,ktype=108003|Notes=Hinterachse
```
Harde regels: kolommen exact `Action, ItemID, Relationship, Relationship Details` · artikelregel is
`Revise` + ItemID met C/D leeg · per voertuig een aparte `Add`-regel met ItemID leeg en
`Relationship=Compatibility` · keyword **lowercase** `ktype=` · note met `|Notes=` (hoofdletter N) ·
nooit meerdere ktypes in één cel · elk voertuig max. 1× (dubbel = afkeuring) · LF-eindes, UTF-8 zonder BOM.
Details in `references/verified-format.md`; voorbeeldoutput in `references/example-output-2discs.csv`.

## Guardrails
- **Nooit** ItemID's of KTypes verzinnen. Dummy-ItemID's (bv. `300000168801`) of gegenereerde KTypes
  leiden tot afkeuring of — erger — een groene stripe op de verkeerde auto's (retouren + aansprakelijkheid).
- Ontbreekt echte input, dan is het antwoord "nog niet uploadbaar" + wat er mist. Geen work-around.
- De skill genereert en valideert; **uploaden doet Hans** (of via een geautoriseerde eBay-connector).
  Nooit namens Hans publiceren zonder expliciete bevestiging.

## Splitsen boven de limiet (3.000 voertuigen)
eBay telt **geëxpandeerd per bouwjaar**, dus een KType met een bouwperiode van 6 jaar telt als 6 regels.
Het script waarschuwt zodra een SKU boven `--limit` (default 3.000) KTypes komt. Boven de limiet: splits
de SKU over max. 5 aparte listings (elk een eigen ItemID), **zonder enige overlap** tussen de KType-lijsten
(overlap = duplicate-afkeuring). Praktisch splitsen op merkgroep (bv. VAG vs. Franse merken). Zie
`references/workflow.md` voor de Channable-splitsregels.

## Bestanden in deze skill
- `scripts/build_ebay_compat.py` — generator + MVL-validatie (CLI, met defaults)
- `templates/ktype-linkage-TEMPLATE.csv` — aanleverformaat voor de specialist
- `references/verified-format.md` — de geverifieerde eBay-formaatspec + foutcodes
- `references/itemids.md` — geverifieerde SKU → ItemID tabel (21-07-2026) + openstaande punten
- `references/workflow.md` — volledige workflow, MVL-download, validatie, splitsen, Channable-alternatief
- `references/example-output-2discs.csv` — geverifieerde voorbeeldoutput (16880 + 18537)
