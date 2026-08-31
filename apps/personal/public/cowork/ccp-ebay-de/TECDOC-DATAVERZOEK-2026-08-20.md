---
type: dataverzoek
scope: CCP · A.B.S. TecDoc-data · eBay DE 57357 + 33564
status: klaar om te versturen
created: 2026-08-20
last_reviewed: 2026-08-20
bron: gemeten vulgraden in ccp-marketplace, 2026-08-20
---

# Dataverzoek A.B.S. TecDoc — vraag het in één keer goed

## Kort: OE is niet je grootste gat

Je vraagt om OE-nummers. Terecht — 1.499 Brembo-remblokken hebben er geen. Maar in dezelfde export zit het antwoord op **negen andere velden die op vrijwel het hele assortiment leeg staan**. Gemiddeld mist elke remblok-SKU 9,4 velden.

| Ontbrekend veld | SKU's zonder waarde | van 3.442 |
|---|---|---|
| WVA-Nummer | **3.441** | 100,0% |
| Anzahl pro Packung | 3.438 | 99,9% |
| Material (Belagmaterial) | 3.431 | 99,7% |
| ECE-R90 / Prüfzeichen | 3.429 | 99,6% |
| Dicke [mm] | 3.423 | 99,4% |
| Breite [mm] | 3.422 | 99,4% |
| Höhe [mm] | 3.422 | 99,4% |
| Verschleißwarnkontakt | 3.422 | 99,4% |
| Bremssystem | 3.421 | 99,4% |
| **OE-Nummern** | **1.499** | 43,6% |
| KType-Verknüpfung | 31 | 0,9% |
| Einbauposition | 24 | 0,7% |

Als hij toch in TecDoc duikt, kost het hem nauwelijks extra moeite om het hele criteriablok mee te geven. Eén verzoek in plaats van vijf.

## Wat je precies vraagt — remblokken (Genart: Bremsbelagsatz, Scheibenbremse)

Vraag per artikelnummer:

1. **OE-/OEM-Referenznummern** — met fabrikantnaam erbij (`AUDI: 1J0 698 451L`), niet alleen het kale nummer
2. **Vergleichsnummern / Trade Numbers** — de nummers van concurrerende merken. eBay heeft hier een apart attribuut voor en dat vullen we nu niet
3. **Breite / Höhe / Dicke [mm]** — de drie maten
4. **Bremssystem** — LUCAS/TRW, ATE, Bosch, Teves, Girling, Akebono. Duitse kopers filteren hierop
5. **Verschleißwarnkontakt** — de exacte TecDoc-waarde: *für Verschleißwarnanzeiger vorbereitet* / *mit integriertem Verschleißwarnkontakt* / *ohne*
6. **WVA-Nummer**
7. **Prüfzeichen / ECE-R90** — inclusief het goedkeuringsnummer als dat er is
8. **Belagmaterial** — met/zonder asbest, keramisch, low-metallic
9. **Anzahl pro Packung** — 4 stuks per asset is de aanname, maar bevestigd is beter dan aangenomen
10. **Einbauposition / Einbauseite** — specifiek voor de 24 SKU's zonder positie
11. **Zubehör** — mit/ohne Zubehör (montageset meegeleverd ja/nee)
12. **Paarige Artikelnummer** — het bijbehorende artikel voor de andere as

## Neem meteen de andere categorieën mee

Dit is het moment. De remschijven staan er nog slechter voor: **214 SKU's, waarvan er 10 een diameter hebben**.

| Remschijf-criterium | Gevuld van 214 |
|---|---|
| Durchmesser [mm] | 10 |
| Bremsscheibenart (Voll / Belüftet) | 11 |
| Dicke / Stärke [mm] | 0 |
| Mindestdicke [mm] | 4 |
| Höhe [mm] | 5 |
| Zentrierungsdurchmesser [mm] | 7 |
| Lochkreis (PCD) | 7 |
| Lochzahl | 7 |
| Oberfläche (beschichtet) | 117 |
| **Nabendurchmesser** | bestaat niet als veld |
| **Nabenhöhe / Protrusion** | bestaat niet als veld |

Die laatste twee zijn geen luxe: bij Mercedes W205/W213 blijft er soms maar 8 mm naafhoogte over voor de velgcentrering. Zonder dat veld kun je de koper daar niet voor waarschuwen.

**Vraag daarom breder:** het volledige TecDoc-criteriablok voor het hele A.B.S.-assortiment, niet alleen remblokken. Het gaat om circa 24.000 artikelnummers over remschoenen, remtrommels, remslangen, remcilinders, handremdelen, slijtage-indicatoren, wiellagers, koppelingsdelen en stuur- en ophangdelen.

## De vraag die je niet moet vergeten: geldt dit ook voor Brembo?

**Dit is de kritieke vraag.** Brembo is in TecDoc een eigen merk met een eigen Marken-Nr. Als de A.B.S.-man alleen toegang heeft tot het A.B.S.-merkaccount, kan hij de 1.501 Brembo-SKU's helemaal niet leveren — en dat is precies waar je grootste OE-gat zit.

Vraag dus expliciet:

> Kun je deze data ook leveren voor de Brembo-artikelen die wij via jullie afnemen (P-serie en 08./09.-nummers), of moet dat via Brembo of een TecDoc-licentie op ons eigen account?

Antwoordt hij nee, dan is het alternatief een eigen TecDoc-abonnement of de Brembo-catalogusdata rechtstreeks.

## Formaat — noem dit erbij, het scheelt een ronde

- **CSV of XLSX, UTF-8**, één rij per artikelnummer, één kolom per criterium
- **Artikelnummer exact zoals in `articles.xlsx`** — dus `36623/1` met schuine streep, `P 02 001` met spaties. Geen herformattering, geen getalnotatie
- Criteria met **naam én TecDoc criteria-ID**, zodat we later automatisch kunnen mappen
- **Eenheden in een aparte kolom** of consequent in de waarde (`17` + `mm`, niet `17 mm` de ene keer en `17,0` de andere)
- Meerwaardige velden (OE, Vergleichsnummern, KTypes) met een vast scheidingsteken, bij voorkeur `;`
- **Leeg = leeg**, geen `NaN`, geen `-`, geen `0`

Dat laatste punt is niet theoretisch: er zit nu al `NaN` als tekst in een van onze bronbestanden.

## Wat je níét hoeft te vragen

Dit hebben we compleet en dubbel gecontroleerd:

- EAN — 3.442 van 3.442
- Prijs, brutoprijs, gewicht, verpakkingsmaten, MOQ, doosaantal
- Voertuigmerken en -modellen — 99,3%
- KType-koppelingen — 99,1%, gemiddeld 51 KTypes per A.B.S.-artikel en 60 per Brembo
- Productafbeeldingen — 100%, alle 3.442 gevonden in de bronmap

## Bijlage

`tecdoc-verzoek-skulijst-2026-08-20.csv` — 3.442 rijen met per SKU het merk, de EAN, de artikelgroepcode en precies welke velden ontbreken. Meesturen scheelt hem het uitzoekwerk en jou een discussie over wat er nu precies mist.
