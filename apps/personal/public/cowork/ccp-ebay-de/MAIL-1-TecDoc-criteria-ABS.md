**Onderwerp:** TecDoc-criteria A.B.S.-assortiment — export t.b.v. marketplace-listings

Hi [naam],

Wij zetten het A.B.S.-assortiment op eBay Duitsland. De listings staan klaar, maar de item specifics blijven leeg omdat het TecDoc-criteriablok niet in de artikelexport zit. Op de 3.442 remblokken die wij voeren ontbreken gemiddeld 9,4 velden per artikel.

Wat ik nodig heb, per artikelnummer:

- OE-/OEM-referentienummers, met fabrikantnaam erbij (`AUDI: 1J0 698 451L`)
- Vergelijkingsnummers / trade numbers
- Breite, Höhe, Dicke in mm
- Bremssystem (LUCAS/TRW, ATE, Bosch, Teves, Girling, Akebono)
- Verschleißwarnkontakt — de exacte TecDoc-waarde
- WVA-nummer
- Prüfzeichen / ECE-R90, inclusief goedkeuringsnummer
- Belagmaterial
- Anzahl pro Packung
- Einbauposition en Einbauseite
- Zubehör: mit/ohne
- Paarige Artikelnummer

Graag hetzelfde criteriablok voor de rest van het assortiment. De remschijven zijn nog leger dan de remblokken: van de 214 die wij voeren heeft er tien een diameter. Daar heb ik naast de standaardcriteria ook Nabendurchmesser en Nabenhöhe nodig — bij Mercedes W205/W213 blijft er soms 8 mm naafhoogte over voor de velgcentrering, en zonder dat veld kunnen wij de koper daar niet voor waarschuwen.

Formaat, dit voorkomt een tweede ronde:

- CSV of XLSX in UTF-8, één rij per artikelnummer, één kolom per criterium
- Artikelnummer exact zoals in `articles.xlsx` — dus `36623/1` met schuine streep, geen getalnotatie
- Criteria met naam én TecDoc criteria-ID
- Eenheden consequent, of in een aparte kolom
- Meerwaardige velden gescheiden met een puntkomma
- Leeg is leeg: geen `NaN`, geen streepje, geen nul

In de bijlage staan de 3.442 remblok-artikelnummers met per stuk welke velden ontbreken. Dat scheelt uitzoekwerk.

Kun je dit vrijdag 28 augustus leveren? Dan halen wij de uitrol op eBay DE deze maand nog.

Groet,
Hans
