---
type: analyse + advies
scope: CCP · eBay DE · assortimentsruil remschijven ↔ Brembo remblokken · campagnestructuur
status: doorgerekend · advies wijkt af van het voorstel
created: 2026-08-21
last_reviewed: 2026-08-21
bron: v_channable_import (margemodel 20-08) · eBay all-active-listings 20-08 · Channable preview 20-08 · briefing-PDF Brembo Assortment
---

# Brembo erbij: kan technisch, maar ruil niet de verkeerde kant op

**De Brembo-remblokken zijn verrijkt genoeg — beter dan de PDF suggereert. Maar remschijven offline halen om er Brembo voor terug te zetten is je beste categorie inruilen voor je slechtste.**

## 1 · Het antwoord op je tweede vraag eerst: ja, Brembo is klaar

De briefing zegt dat Brembo "data-poor" is. Dat klopte, maar het is gisteren opgelost. Stand nu, uit `v_channable_import`:

| Veld | Gevuld | |
|---|---:|---|
| Titel (≤80 tekens) | 1.501 / 1.501 | ✓ |
| Omschrijving | 1.501 / 1.501 | ✓ |
| Hersteller = Brembo | 1.501 / 1.501 | ✓ |
| Produktart | 1.501 / 1.501 | ✓ |
| Einbauposition | 1.495 / 1.501 | ✓ |
| Afbeelding 1600×1600 | 1.501 / 1.501 | ✓ |
| KType-voertuigkoppeling | 1.494 / 1.501 | ✓ |
| EAN | 1.501 / 1.501 | ✓ |
| Inkoopprijs | 1.500 / 1.501 | ✓ |
| **OE-nummers** | **2 / 1.501** | **✗** |
| Anzahl pro Packung | 0 / 1.501 | ✗ |
| Material | 0 / 1.501 | ✗ |
| Verkoopprijs | 1.350 / 1.501 | ~ |

Voorbeeldtitel: `Brembo P 06 008 Bremsbelagsatz vorne für BMW PORSCHE FERRARI MASERATI ALPINA` — 76 tekens, merk, artikelnummer, positie en voertuigmerken.

**Vijf dingen die eerst moeten:**

1. **OE-nummers ontbreken bij de bron.** Niet in Channable, niet in Supabase, ook niet in `abs_articles_pads`: 2 van 1.501. Dit is precies waar **MAIL-2 aan Nils** over gaat, en die staat nog steeds niet verstuurd. Zonder OE-nummers mis je het kanaal waarop monteurs zoeken.
2. **51 SKU's hebben `Vorne, Hinten` als Einbauposition.** eBay accepteert één waarde; twee is gegarandeerde afkeuring — precies de fout die vandaag 9 items kostte. Moet naar één waarde vóór de push.
3. **10 SKU's boven 500 KTypes, de grootste met 2.146.** Die vallen buiten de 3.000-limiet zodra je per bouwjaar expandeert. Zelfde splitsaanpak als bij A.B.S.
4. **Anzahl pro Packung en Material staan op 0.** Anzahl is een vaste waarde (4), Material komt pas met de TecDoc-levering.
5. **151 SKU's zonder verkoopprijs.** Die kun je niet listen.

Punt 2 en 4 kan ik vandaag oplossen. Punt 1 en 5 liggen buiten ons.

## 2 · Eén correctie op de briefing

De PDF beveelt aan: *"Immediately update the eBay DE configuration to read ebay_omschrijving_de."*

**Dat is precies verkeerd om.** Ik heb de Build-configuratie gisteren via Channable's eigen API uitgelezen: het kanaal leest `ebay_beschreibung_de`. Het probleem was dat de regels naar `ebay_omschrijving_de` schréven. Ik heb de regels omgelegd naar het veld dat de Build al las. Het opvolgen van deze aanbeveling zou het opnieuw stukmaken.

## 3 · Je eerste vraag: ja het kan, en het moet zelfs

De verkooplimiet is geen vaag plafond maar een hard getal, en je zit eroverheen:

| | |
|---|---:|
| Actieve listingwaarde nu | € 874.759 |
| eBay-limiet deze maand | € 868.508 |
| **Tekort aan ruimte** | **€ 6.251** |

Dáárom worden er 1.660 items geweigerd met foutcode 21919188. Er moet dus hoe dan ook iets af.

Wat jouw voorstel oplevert:

| Offline | Listings | Stuks | Waarde |
|---|---:|---:|---:|
| Bremsscheiben | 100 | 4.947 | € 357.342 |
| Sonstige (vloeistof/vet) | 4 | 1.807 | € 33.259 |
| **Samen** | **104** | **6.754** | **€ 390.601** |

Dat is **45% van je actieve waarde in 8% van je listings** — remschijven zijn duur en je hebt er veel van. Daarna sta je op €484.158 en heb je €384.350 ruimte. Alle 1.350 Brembo samen zijn €166.421, dus dat past er ruim twee keer in.

**Technisch werkt je plan dus. Maar kijk even naar wat je weggeeft.**

## 4 · Waarom ik het niet zou doen

| Groep | SKU's | Verliesgevend | Laag | Gezond | Hoog | Gem. contributie |
|---|---:|---:|---:|---:|---:|---:|
| **Remschijven** | 100 | 1 | 5 | **92** | **2** | **€ 23,90** |
| Remklauwen | 18 | 0 | 13 | 5 | 0 | € 9,03 |
| A.B.S. remblokken | 1.511 | 399 | 1.063 | 49 | 0 | € 2,45 |
| **Brembo remblokken** | 1.350 | **808** | 542 | **0** | **0** | **− € 0,90** |

**Remschijven zijn je enige gezonde categorie: 94 van de 100 staan op Gezond of Hoog, met €23,90 contributie per verkoop. Brembo-remblokken hebben er nul, en 808 van de 1.350 zijn verliesgevend.**

De oorzaak is de inkoopverhouding. Bij A.B.S. is de brutoprijs mediaan 2,5× de inkoop, bij Brembo 2,0×. Met 12% provisie, 9% advertentietarief, verzendkosten en verpakking erbij is die 2,0× niet genoeg.

Je zou dus €2.390 aan contributie per 100 verkopen inruilen voor iets dat gemiddeld geld kost. Dat kan een bewuste keuze zijn — merkbreedte, Brembo-zoekverkeer, positionering — maar dan moet je het als investering boeken, niet als omzetgroei.

Voorbehoud dat ik eerlijk moet maken: dit rust op de kostenparameters uit het margemodel, en advertentie (9,6%) en verzendkosten zijn nog aannames. Zijn die te hoog ingeschat, dan schuift het beeld voor beide categorieën op — maar de **rangorde** tussen remschijven en Brembo verandert niet, want die zit in de inkoopverhouding.

## 5 · Het alternatief dat ik wél zou doen

Maak ruimte door weg te halen wat geld kost in plaats van wat geld oplevert.

| | Listings | Waarde |
|---|---:|---:|
| Verliesgevende live listings offline (275 remblokken, 3 vloeistoffen, 1 schijf) | 279 | € 82.971 |
| Ruimte t.o.v. de limiet daarna | | **€ 76.720** |
| Brembo mét positieve marge erbij (542 SKU's) | 542 | € 70.778 |
| **Past** | | **ja, met € 5.942 over** |

Wat je daarmee bereikt:

- Je **houdt** de 94 gezonde remschijven en hun €23,90 per verkoop
- Je **verliest** 279 listings die per verkoop geld kosten
- Je **wint** 542 Brembo-SKU's die wél marge dragen, waaronder P 85 161 (19,8%), P 37 026 (16,1%) en P 59 095 (14,4%)
- Je laat de 808 verliesgevende Brembo staan tot de inkoopprijs of de verkoopprijs verandert

Netto ga je van 1.289 naar 1.552 listings zonder de limiet te raken, en je gemiddelde marge stijgt in plaats van te dalen.

## 6 · Campagnes per lijn

Er zijn **46 P-families**. Dat zijn geen 46 campagnes — dat is onbestuurbaar bij zes verkopen per week.

Elf families hebben 50 SKU's of meer en dekken samen 1.075 van de 1.501:

| Familie | SKU's | marge > 0 | verliesgevend |
|---|---:|---:|---:|
| P 85 | 163 | 52 | 98 |
| P 50 | 137 | 48 | 75 |
| P 23 | 126 | 44 | 71 |
| P 83 | 106 | 43 | 51 |
| P 30 | 104 | 45 | 48 |
| P 06 | 91 | 18 | 69 |
| P 61 | 87 | 31 | 46 |
| P 24 | 81 | 29 | 45 |
| P 56 | 63 | 31 | 30 |
| P 59 | 63 | 22 | 35 |
| P 68 | 54 | 20 | 29 |

**Mijn voorstel: niet per familie, maar drie campagnes.**

1. **Brembo · marge Gezond en Laag** — de 542 SKU's die marge dragen. Basis-strategie, bovengrens 4%.
2. **A.B.S. remblokken · marge Gezond en Laag** — vervangt de huidige brede campagne.
3. **Remschijven** — je gezonde categorie verdient een eigen campagne, en hier is een hoger tarief te verdedigen omdat er €23,90 per verkoop tegenover staat.

Reden om niet per familie te splitsen: bij zes verkopen per week over 46 campagnes duurt het jaren voordat één campagne statistisch iets zegt. Het attributievenster is 30 dagen; met minder dan een handvol verkopen per campagne per maand meet je alleen ruis. Splitsen kan later, zodra volume dat rechtvaardigt.

En het praktische argument: `marge_status` staat nu als veld in de feed, dus deze drie campagnes zijn met regelselectie te bouwen. Familie-campagnes zouden op SKU-patroon moeten, wat Channable niet als regelcriterium aanbiedt.

## 7 · Wat ik nu kan doen

1. **De 51 Brembo-SKU's met dubbele Einbauposition terugbrengen naar één waarde** — uit de titel, zoals bij A.B.S.
2. **Anzahl pro Packung op 4 zetten** voor alle Brembo-remblokken
3. **De 10 Brembo-SKU's boven 500 KTypes splitsen**, zelfde aanpak als het KType-pakket dat klaarstaat
4. **De offline-lijst bouwen** — 279 verliesgevende listings met ItemID, klaar voor upload met Action=End
5. **De Brembo-lijst bouwen** — 542 SKU's met positieve marge, klaar als Add-bestand

Zeg welke, dan draai ik ze. Punt 4 en 5 zijn irreversibel op eBay, dus die lever ik als bestand en upload jij.

**Wat ik niet kan oplossen:** de OE-nummers. Die moeten van Nils komen, en MAIL-2 staat er al klaar voor.
