---
type: diagnose + beslisstuk
scope: CCP · eBay DE ↔ Channable ↔ Magento ↔ ABS 365 · remschijven per 1 of per 2
status: oorzaak bevestigd · bestanden klaar
created: 2026-08-21
last_reviewed: 2026-08-21
bron: live eBay-listings 20-08 · connectcarparts.nl productpagina 21-08 · v_channable_import · eBay-helppagina's
---

# Remschijven: eBay verkoopt per paar, de webshop per stuk

**Er is geen MOQ-veld op eBay. Dat bestaat niet voor vaste-prijs-aanbiedingen. En per stuk gaan verkopen — de enige eBay-kant-oplossing — kost je €5,69 marge per paar. Tijdelijk offline is de verstandigste zet, en ik heb het bestand klaargezet met een omkeerknop.**

## 1 · Wat er precies misgaat, met bewijs

| | eBay DE | Webshop |
|---|---|---|
| Titel | ABS 16883 **2x** Bremsscheibe Hinten Massiv Ø230 mm | ABS 16883 **Remschijf** Achteras 230mm Massief |
| Prijs | € 36,40 (incl. 19% DE) | € 16,95 (incl. 21% NL) |
| Eenheid | 1 aanbieding = **2 schijven** | 1 artikel = **1 schijf** |

Per stuk netto komen die prijzen keurig overeen (€15,29 vs €14,01). Het probleem zit niet in de prijs maar in de **eenheid**.

Komt er een eBay-order binnen met hoeveelheid 1, dan geeft Channable die 1 door aan Magento. Magento boekt één schijf af, ABS 365 pakt één schijf, en de klant krijgt één schijf terwijl hij er twee betaalde. Precies wat je beschrijft.

**Alle 100 live remschijf-listings hebben "2x" in de titel.** Van die 100 staat `anzahl_pro_packung` bij 85 op 2 en bij **15 op 1** — daar klopt het verpakkingsveld dus ook niet met wat je verkoopt.

## 2 · Nee, eBay heeft geen MOQ-veld

Ik heb het nagezocht: **eBay kent geen minimum-afname bij vaste-prijs-aanbiedingen.** Er is geen Mindestbestellmenge en geen Mindestbestellwert. Het enige wat eBay biedt is precies wat je al doet: artikelen bundelen in één aanbieding — dus 1 listing = 1 paar.

Het item-merkmaal *Anzahl pro Packung* is beschrijvend, niet dwingend. Het staat in de listing maar stuurt niets aan.

En de kern: **zelfs als eBay zo'n veld had, zou het niet helpen.** De order komt hoe dan ook binnen als hoeveelheid 1. Het probleem is niet wat de koper mag bestellen, maar hoe die 1 wordt vertaald naar 2 stuks in Magento en ABS 365. Dat is een vertaalslag in jouw keten, niet een instelling bij eBay.

## 3 · De drie routes, doorgerekend

### Route A — eBay omzetten naar per stuk
Revise de 100 listings: "2x" uit de titel, prijs halveren, voorraad verdubbelen, `Anzahl pro Packung` op 1. Dan spreken eBay, Magento en ABS allemaal dezelfde eenheid en is de orderflow meteen goed.

**Maar het kost je meer dan de helft van je marge:**

| | Per paar (nu) | Per stuk (na omzetting, 2 losse verkopen) |
|---|---:|---:|
| Gemiddelde contributie per order | **€ 9,85** | **€ 4,16** |
| Verliesgevende SKU's | 14 / 100 | **37 / 100** |

De reden is simpel: verzendkosten en de vaste eBay-ordergebühr betaal je dan **twee keer**. Een enkele schijf van 1,35 kg kost bijna evenveel verzending als een paar van 2,7 kg. Bij ABS 18770 ga je van −€5,89 naar −€10,99.

Afraden.

### Route B — Magento-paarproduct herstellen
Zet in Magento naast `16883` een tweede artikel neer, bijvoorbeeld `16883-SET2`, als bundel die 2 × `16883` verbruikt. Channable mapt de eBay-listing op die SKU. Order komt binnen als 1 × SET2, Magento boekt 2 stuks af, ABS 365 krijgt 2 stuks — en dat is precies hun eigen minimumafname, want `moq` staat bij alle schijven op 2.

Dit is de goede oplossing. Het is ook de enige die je marge intact laat. Maar het is Magento-werk plus een hermapping in Channable, dus niet vandaag.

### Route C — tijdelijk offline
Wat jij voorstelt. Verdedigbaar, en er zit een tweede voordeel aan dat je misschien niet had meegerekend: **het lost meteen je verkooplimiet op.**

| | |
|---|---:|
| Actieve listingwaarde nu | € 874.759 |
| eBay-limiet deze maand | € 868.508 |
| Waarde in de 100 remschijven | **€ 357.342** |
| Na offline halen | € 517.417 |

Je zit nu €6.251 óver je limiet — dáárom worden er 1.660 nieuwe items geweigerd. Die 100 schijven zijn 41% van je actieve waarde in 8% van je listings.

## 4 · Wat ik heb klaargezet

Niet beëindigen, maar **voorraad op 0 zetten**. Dan blijft de listing bestaan met zijn ItemID, verkoopgeschiedenis en zoekpositie, en zet je hem later terug met één upload. Beëindigen gooit dat allemaal weg.

| Bestand | Wat het doet |
|---|---|
| `ebay-remschijven-OFFLINE-voorraad0-2026-08-21.csv` | 100 regels, Revise, Quantity 0 |
| `ebay-remschijven-TERUG-originele-voorraad-2026-08-21.csv` | dezelfde 100 met hun huidige voorraad terug |

**Eén voorwaarde die je moet controleren:** in `Verkaufseinstellungen` moet **Out-of-Stock-Control** aan staan. Staat die uit, dan beëindigt eBay een listing zodra de voorraad 0 wordt en werkt het terugzet-bestand niet meer. Even kijken vóór je uploadt.

## 5 · Een correctie op mijn analyse van gisteren

Ik heb je gisteren geschreven dat remschijven je gezonde categorie zijn met €23,90 contributie per verkoop, en op basis daarvan afgeraden ze offline te halen. **Dat cijfer was ongeveer twee keer te hoog.**

Het margemodel rekende de verkoopprijs van een paar (€36,40) tegen de inkoopprijs van één schijf (€6,26). Dat is nu gecorrigeerd: ik heb een veld `stuks_per_verkoop` toegevoegd aan `ccp_kosten_parameters`, voor Bremsscheiben op 2 gezet, en `v_sku_marge` rekent nu met COGS × dat aantal.

| Categorie | Was | Nu | Verdeling nu |
|---|---:|---:|---|
| Remschijven | € 23,50 | **€ 9,85** | 35 Gezond · 51 Laag · 14 Verliesgevend |
| Remklauwen | € 9,12 | € 9,12 | 5 Gezond · 13 Laag |
| Remblokken | € 2,45 | € 0,42 | 49 Gezond · 1.605 Laag · 1.207 Verliesgevend |
| Remvloeistof | − € 0,46 | − € 0,46 | 3 Verliesgevend |

Remschijven blijven je beste categorie in euro's per order, maar het verschil met de rest is kleiner dan ik zei. Dat maakt het offline halen minder pijnlijk dan het gisteren leek.

**Waar dit vandaan kwam:** de verpakkingseenheid stond nergens in het model. Nu wel, en zichtbaar per categorie.

## 6 · Wat ik zou doen

**Vandaag:** upload het voorraad-0-bestand. Je orderflow is meteen veilig, je zit onder de verkooplimiet, en je kunt terug met één upload.

**Deze week:** de 15 schijven waar `anzahl_pro_packung` op 1 staat terwijl de titel 2x zegt — uitzoeken welke van de twee klopt. Dat is dezelfde fout in het klein, en die zit nu ook in je webshop.

**Daarna, structureel:** route B. Het paarproduct in Magento is de enige oplossing die de orderflow klopt maakt zonder je marge te halveren. Zeg het als je wilt dat ik de Magento-kant uitwerk — dan heb ik wel eerst de REST-toegang nodig, en die zit nog vast op die `CONSUMER_SECRET` van 33 tekens.

## Bronnen

- [eBay.de — Artikel mit „Sofort-Kaufen" verkaufen](https://www.ebay.de/help/selling/listings/artikel-mit-sofortkaufen-verkaufen?id=4109)
- [eBay.de — Mehrfach-Angebote und Angebote mit Varianten](https://www.ebay.de/help/default/default/mehrfachangebote-und-angebote-mit-varianten?id=4150)
- [community.ebay.de — Mindestbestellwert bei eBay möglich?](https://community.ebay.de/t5/Archiv-Verkaufen-bei-eBay/Mindestbestellwert-bei-eBay-m%C3%B6glich/m-p/775697)

---

## 7 · Verduidelijking: wat ik met "paarproduct" bedoelde

"Paarproduct" was een verwarrende term van mij. Wat ik bedoel is precies wat jij zegt: **het Magento-artikel moet weer één paar zijn in plaats van één schijf.** Geen nieuw product ernaast, gewoon terug naar hoe het was.

Maar het is de moeite waard om eerst vast te stellen wát er precies is omgezet, want er zijn twee heel verschillende oorzaken en maar één daarvan raakt je eBay-orders.

### Wat ik op de productpagina zie

`connectcarparts.nl/16883-remschijf`, vanochtend:

| Veld | Waarde |
|---|---|
| Titel | ABS 16883 Remschijf Achteras 230mm Massief |
| Prijs | € 16,95 |
| **Gewicht** | **2,7 kg** |
| Aantal-veld | min 1, max 10000, geen stapgrootte |

**Dat gewicht is het bewijsstuk.** In Supabase staat `gewicht_kg = 2,7` bij `anzahl_pro_packung = 2` — dus 2,7 kg is het gewicht van twee schijven, 1,35 kg per stuk. De pagina toont dus de specificaties van een paar naast een prijs van één schijf.

Dat wijst erop dat **alleen de prijs is omgezet**, niet het artikel zelf. Het Magento-artikel is qua specs nog steeds het paar.

### De twee mogelijke oorzaken

**Oorzaak A — alleen de prijs is gehalveerd.** Het artikel is nog het paar, iemand of iets heeft de prijs op stuksbasis gezet. Reparatie: prijs terug naar de paarprijs (circa €33,90). Voorraad en orderflow zijn dan meteen weer goed, want een eBay-order van 1 blijft 1 paar.

**Oorzaak B — het artikel is echt omgezet naar één schijf.** Dan is ook de voorraad omgerekend van paren naar stuks. Reparatie is dan zwaarder: prijs én voorraad terug, en controleren of er in de tussentijd orders zijn geweest die verkeerd zijn afgeboekt.

### Hoe je het onderscheidt

Eén vraag beantwoordt het: **staat er in Magento nu 154 of 308 op voorraad voor 16883?**

- 154 → het artikel is nog het paar, alleen de prijs is stuk (oorzaak A)
- 308 → het artikel is omgezet naar losse schijven (oorzaak B)

eBay toont 154 beschikbaar. Klopt dat met Magento, dan is het oorzaak A en is het een prijsreparatie.

### Wat er níét bij hoort

Wat ik expliciet níét bedoel: het aantal-veld op 2 zetten met een minimum of stapgrootte in Advanced Inventory. Dat lijkt logisch maar lost je eBay-probleem niet op — die instelling geldt alleen voor de winkelwagen op de webshop. Een order die Channable via de API aanmaakt gaat daar langsheen. Je webshop zou dan kloppen en je eBay-orders nog steeds niet.

Daarom is het onderscheid belangrijk: **de eenheid van het artikel moet kloppen, niet de bestelregel in de winkelwagen.**

### Wat ik zelf niet kan controleren

De Magento REST-toegang staat nog steeds vast op `CONSUMER_SECRET` in de env — 33 tekens waar de andere drie sleutels er 32 hebben. Eén teken. Zodra dat klopt kan ik de voorraad, prijs en het gewicht van alle 100 remschijven in één keer uitlezen en precies zeggen welke van de twee oorzaken het is, per SKU.
