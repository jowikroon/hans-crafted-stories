---
type: verificatie
scope: CCP · Channable 314525 · eBay DE · Build-stap categorie 57357
status: geverifieerd
created: 2026-08-20
last_reviewed: 2026-08-20
bron: live Build > Attributen per categorie 57357 + eBay all-active-listings export 20-08-2026
---

# Kan Channable nu alles pushen? Nee — en dit is precies waarom

## 1 · De live export

1.289 actieve listings, waarvan **1.167 Bremsbeläge** (categorie 57357). Alle 1.167 hebben een SKU, alle 1.167 zijn A.B.S. — geen Brembo live. 1.084 met voorraad, 83 op nul.

**Match met onze database: 1.167 van 1.167.** Elke live SKU zit in `v_companion_remblokken` en heeft daar titel, omschrijving, EAN én OE-referenties. 1.156 hebben ook K-Types.

De data bestaat dus voor elke listing die je net hebt geactiveerd.

## 2 · De attribuutmapping in de Build-stap — compleet en correct

Alle vijftien attributen van categorie 57357 zijn gekoppeld:

| eBay-attribuut | Channable-projectveld | Staat in de listing |
|---|---|---|
| Hersteller | `hersteller` | **nu `A.B.S.`** ✓ gecorrigeerd |
| Herstellernummer | `sku` | ✓ gevuld |
| Anzahl Pro Packung | `anzahl_pro_packung` | ✓ 4 |
| Herstellergarantie | `herstellergarantie` | ✓ 2 Jahre |
| Ursprungsland | `ursprungsland` | ✓ China |
| Oldtimer-Teil | `oldtimer_teil` | ✓ Nein |
| Tuning- & Styling-Teil | `tuning_styling_teil` | ✓ Nein |
| **Einbauposition** | `einbauposition_ebay` | **leeg** |
| **Oe/Oem Referenznummer(N)** | `oe_nummern_kurz` | **leeg** |
| **Produktart** | `produktart` | **leeg** |
| **Material** | `material` | **leeg** |
| **Besonderheiten** | `besonderheiten` | **leeg** |
| **Im Lieferumfang Enthalten** | `lieferumfang` | **leeg** |
| Breite | `ebay_de_bremsbelage_breite_2` | leeg |
| Vergleichsnummer | `oe_nummern_kurz` | leeg |

De koppeling is niet het probleem. **De projectvelden zelf zijn leeg.**

## 3 · Het antwoord op je vraag

**Nee.** Je kunt pushen, en `Hersteller` wordt nu correct `A.B.S.` — dat is de zwaarste van de zeven en die is gefixt. Maar Einbauposition, OE/OEM, Produktart, Material, Besonderheiten en Lieferumfang gaan nog steeds leeg de deur uit, want die velden hebben in Channable geen waarde.

Het bewijs staat in je eigen listings: precies die zes staan vandaag blanco, en daar is niets aan veranderd behalve het merk.

## 4 · Waar de verwarring zat — en dat is mijn fout

De `einbauposition_de` die ik vanochtend heb gevuld staat in **Supabase**, niet in Channable. Channable heeft zijn eigen veld `einbauposition_ebay`, gevoed door de regelketen `DE | Inbouwpositie | 01 t/m 06`. Die keten bestaat, maar levert aantoonbaar niets — anders stond Einbauposition niet leeg op 1.167 listings.

Zelfde patroon bij OE: er is een regel `OE-ref cap 65 tekens (eBay limiet)` die `oe_nummern_kurz` hoort te vullen. Ook die levert niets.

Uit de radar-scan: **17 van de 43 eBay DE-regels staan gepauzeerd.** Dat is de eerste plek om te kijken — dit is waarschijnlijk geen bouwwerk maar een schakelaar.

## 5 · Eén mappingfout die je moet weten

`Vergleichsnummer` en `Oe/Oem Referenznummer(N)` zijn allebei gekoppeld aan **hetzelfde veld** `oe_nummern_kurz`. Dat zijn twee verschillende eBay-attributen: OE-nummers zijn de fabrikantreferenties, Vergleichsnummern zijn de nummers van concurrerende merken. Zodra `oe_nummern_kurz` gevuld raakt, verschijnt dezelfde waarde in beide velden — feitelijk onjuist.

## 6 · Volgorde

1. **Nu pushen is prima** — `Hersteller` gaat van niet-herkend naar `A.B.S.` op 1.167 listings. Dat is de grootste enkele winst en hij is nu al beschikbaar.
2. Daarna: uitzoeken welke van de 17 gepauzeerde regels de ketens Inbouwpositie, OE, Produktart en Material bedienen, en die hervatten.
3. Dan de mappingfout op Vergleichsnummer herstellen.
4. Dan pas de tweede push.

## 7 · Nog niet gedaan, wel nodig vóór Brembo

De regel `Hersteller` (28202493) luidt: *als `hersteller` leeg is, zet `A.B.S.`*. Er zit geen merkconditie op. Zolang alleen A.B.S. live staat klopt dat. Zodra Brembo meegaat krijgt die ook `A.B.S.` — een onjuiste merkclaim. Er moet een sectie bóven de fallback: SKU begint met `P` of `08.`/`09.` → `Brembo`.
