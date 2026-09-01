---
type: uploadpakket + instructie
scope: CCP · eBay DE · voertuigcompatibiliteit (Fahrzeugverwendungsliste) · alle actieve listings
status: klaar om te uploaden · gesplitst op 500 voertuigen per listing
created: 2026-08-20
last_reviewed: 2026-08-20
bron: eBay all-active-listings export 20-08-2026 · v_channable_import (ktypes_vorderachse/hinterachse) · ebay_ktype_rejects · Channable preview-export
---

# KType-import voor alle 1.289 actieve listings

**1.274 listings krijgen voertuigcompatibiliteit — 74.455 voertuigen op de bestaande listings, plus 5.078 op 14 nieuwe listings.**

Alles in `ktype-import-2026-08-20/`. Geen enkele listing komt boven de 500 voertuigen uit, dus geen enkele listing gaat offline op de 3.000-grens.

## 1 · Waarom 500 en niet 3.000

eBay's harde limiet is 3.000 voertuigen per listing, maar **geëxpandeerd per bouwjaar**: een KType met bouwperiode 2000–2005 telt als zes regels. Bij een gemiddelde bouwperiode van vijf à zes jaar zit je met 500 KTypes tegen de 3.000 aan.

Ik heb de bouwjaren per KType nergens in de vault — `abs_ktype_fitment` levert alleen de KType-lijsten, en `from_year`/`to_year` in `ccp_sku_attributes` gaan over de SKU als geheel, niet per voertuig. **500 is dus een onderbouwde bovengrens, geen gemeten waarde.** Heb je de MVL, dan kan ik exact rekenen en de grens omhoog schuiven.

## 2 · Wat er gesplitst is

Veertien SKU's zaten boven de 500. Die zijn **gelijkmatig** verdeeld, niet afgekapt op 500 met een restje — een tweede listing met zes voertuigen is geen listing.

| SKU | Categorie | Voertuigen | Verdeling |
|---|---|---:|---|
| 520011 | Bremssattel | 893 | 447 + 446 |
| 520012 | Bremssattel | 893 | 447 + 446 |
| 37477 | Bremsbelag | 861 | 431 + 430 |
| 37958 | Bremsbelag | 859 | 430 + 429 |
| 37414 | Bremsbelag | 838 | 419 + 419 |
| 421611 | Bremssattel | 819 | 410 + 409 |
| 421612 | Bremssattel | 818 | 409 + 409 |
| 37411 | Bremsbelag | 708 | 354 + 354 |
| 37155 | Bremsbelag | 676 | 338 + 338 |
| 16883 | Bremsscheibe | 639 | 320 + 319 |
| 37008 | Bremsbelag | 591 | 296 + 295 |
| 37296 | Bremsbelag | 532 | 266 + 266 |
| 37914 | Bremsbelag | 530 | 265 + 265 |
| 18196 | Bremsscheibe | 506 | 253 + 253 |

Geen enkele SKU heeft een derde listing nodig — de grootste is 893, dus twee delen volstaan. De logica schaalt wel door: bij meer dan 1.000 voertuigen komt er vanzelf een derde deel bij.

**Deel 1 blijft op de bestaande listing.** Deel 2 heeft een nieuwe listing nodig, en dus een nieuw ItemID dat nog niet bestaat.

## 3 · De bestanden

| Bestand | Wat | Listings | Voertuigen |
|---|---|---:|---:|
| `00-TEST-10-listings.csv` | testtranche | 10 | 22 |
| `01` t/m `07-ktype-batch.csv` | productie | 1.264 | 74.433 |
| `NIEUWE-LISTINGS-deel2-14-stuks.csv` | **nieuwe listings aanmaken** | 14 | — |
| `OVERFLOW-wacht-op-nieuwe-itemids.csv` | deel 2, nog zonder ItemID | 14 | 5.078 |
| `OVERZICHT-per-sku.csv` | wie zit waar, met totalen | 1.274 | — |
| `ZONDER-ktypes.csv` | krijgen niets | 15 | — |

Elke listing komt in precies één KType-bestand voor. Machinecontrole over alle acht: **nul fouten** op header, artikelregel met lege C/D, `Add` met lege ItemID, lowercase `ktype=`, één ktype per cel, geen dubbele ktype binnen een listing, max 496 voertuigen per listing, UTF-8 zonder BOM, LF-regeleindes.

## 4 · Volgorde

**Stap 1 — `00-TEST-10-listings.csv`.** Tien kleine listings over alle drie de categorieën, 22 voertuigen. Wacht het resultaatbestand af en controleer één listing live: *"Prüfen Sie die Artikelbeschreibung"* moet vervangen zijn door de voertuigselector.

**Stap 2 — batch 01 t/m 07**, één voor één. `Verkäufer-Cockpit Pro → Berichte → Uploads`.

**Stap 3 — `NIEUWE-LISTINGS-deel2-14-stuks.csv`.** Maakt de veertien tweede listings aan. Zelfde route.

**Stap 4 — stuur mij het resultaatbestand van stap 3.** Daar staan de nieuwe ItemID's per CustomLabel in. Daarmee bouw ik het KType-bestand voor de 5.078 geparkeerde voertuigen. Zonder die echte ItemID's kan dat bestand niet bestaan — ItemID's verzinnen is precies waar dit misgaat.

## 5 · Het bestand voor de nieuwe listings

Veertien regels, 26 kolommen. Alles komt uit geverifieerde bron: prijs, voorraad, categorie, EAN en conditie uit jouw actieve-listings-export; omschrijving en attributen uit `v_channable_import`; de business-policy-ID's (verzending 258691405024, betaling 258686263024, retour 258691457024), `location` Nieuwegein en `dispatch_time` 2 uit de Channable-preview; artikelstandort geverifieerd op de live listing.

Drie dingen die ik onderweg heb rechtgezet:

- **Afbeeldingen: alle veertien op 1600 × 1600.** De acht remblokken hadden al een R2-beeld. Voor de twee remschijven en vier remklauwen stond alleen een Magento-beeld van 600 × ~280. Die heb ik op wit canvas naar 1600 × 1600 gezet en naar R2 geüpload; alle veertien URL's geven HTTP 200 met `image/jpeg`. Daarmee lopen ze niet tegen dezelfde beeldfout aan als 36133 en consorten.
- **Einbauposition teruggebracht tot één waarde.** 37296 en 37477 hadden «Vorne, Hinten» in de bron. eBay accepteert daar één waarde; twee is een gegarandeerde afkeuring. Beide staan nu op `Hinten`, overgenomen uit de bestaande live titel.
- **Omschrijvingen zonder contactgegevens.** Zelfde schoonmaak als vanmiddag: geen telefoonnummer, geen e-mail, geen URL. Anders staan die veertien er morgen bij als Grundsatzverstoß.

Titels krijgen `| Fahrzeugliste 2` erachter (bij 18196 `| FZ-Liste 2`, anders past het niet in 80 tekens). Dat onderscheidt ze van de originele listing, wat je wilt tegen eBay's regel op dubbele aanbiedingen.

**CustomLabel blijft de echte SKU**, dus zonder toevoeging. Zo blijft de orderkoppeling naar Magento en Channable werken. Prijs op de deel-2-listing kan afwijken van deel 1: houd ze gelijk, of laat het via Channable lopen.

## 6 · Twee dingen die het kunnen blokkeren

**De verkooplimiet.** De preview van vanmiddag gaf 1.660 keer foutcode `21919188` — je zit aan je limiet voor nieuw in te stellen artikelen. Veertien listings is weinig, maar als de limiet vol is worden ze geweigerd. Zie je die code in het resultaat, dan is dat de oorzaak en niet het bestand.

**Voorraad staat dubbel.** 421611 heeft 4 stuks, 421612 heeft er 5. Straks staan die op twee listings met elk dezelfde voorraad. Bij deze aantallen is oververkoop een reëel risico. Overweeg voor die twee de voorraad te halveren, of de splitsing over te slaan.

## 7 · Wat er verder in zit

**315 KType-regels eruit** die eBay eerder al afkeurde — 170 unieke KTypes uit `ebay_ktype_rejects`, voertuigen die niet in eBay's Master Vehicle List staan.

**541 KTypes stonden op beide assen** en zijn samengevoegd tot één regel met `Notes=Vorderachse/Hinterachse`.

**Geen MVL-validatie.** De `Fahrzeugverwendungsliste.xlsx` staat niet in de vault of in Downloads. Onbekende KTypes worden dus pas ná upload geweigerd, als warnings per regel. Download hem uit het Verkäuferportal (Angebote → Fahrzeugteile → PKW & Transporter, wachtwoord `Fahrzeugliste`) en ik filter vooraf.

## 8 · De vijftien zonder KTypes

Elf remblokken (35027, 35140, 35141, 36065, 36117, 36434, 36738, 36806, 37026, 37047, 37770) en vier vloeistoffen (7500, 7501, 7507, 7516). De vloeistoffen horen geen voertuigkoppeling te hebben. De elf remblokken ontbreken in de ABS TecDoc-export — die horen in **MAIL-1 aan Nils**: ze staan live zonder Parts Finder en verkopen daardoor aantoonbaar slechter.

## 9 · Bij een herhaling van dezelfde batch

`Add` voegt toe aan de bestaande lijst. Een tweede identieke upload geeft dubbelingen die eBay per regel afkeurt — onschadelijk maar rommelig. Moet je een batch echt overdoen, zeg het dan: ik zet de compat-regels om naar `Revise`, wat de hele lijst vervangt.
