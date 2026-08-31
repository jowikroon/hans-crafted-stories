---
type: analyse + actieplan
scope: CCP · eBay DE · Bremsbeläge · Bericht zur Angebotsqualität 17-08-2026
status: oorzaak vastgesteld, route bepaald
created: 2026-08-20
last_reviewed: 2026-08-20
bron: eBay Angebotsqualität-rapport 17-08-2026 + live meting ccp-marketplace
---

# Waarom de listings leeg zijn — en wat er nu moet gebeuren

## 1 · eBay's eigen oordeel over jullie Bremsbeläge

Uit het tabblad Bremsbeläge, benchmarkregel `connectcarparts`:

| Merkmal | Jullie | Top 10% |
|---|---|---|
| **Marke** | **0** | 0,27 |
| Herstellernummer | 1 | 0,53 |
| EAN | 1 | 0,35 |
| Empfohlene Artikelmerkmale angegeben | 2 | 4 |
| Tägliche Impressions per Angebot | 32 | 64 |
| **Klickrate** | **0,0006** | **0,3132** |
| **Konversion** | **0,045** | **1,8893** |

Rang: 32e op impressies, **470e op klikratio**, 177e op conversie.

**Marke = 0.** Niet gedeeltelijk, niet laag — nul. Terwijl in de listing gewoon `Fabrikant: ABS` staat.

## 2 · De oorzaak van Marke = 0

eBay koppelt `ABS` **niet** aan een automotive merk. In de eBay-catalogus staat "ABS" voor *ABS by Allen Schwartz*, een modemerk. De onderdelenfabrikant heet in eBay's merkregister **A.B.S.** — met punten.

Dat is exact de bevinding uit de titelanalyse van 19-08: 13 van de 15 concurrenten schrijven `A.B.S.`, en de catalogus koppelt de puntloze variant aan kleding.

Het gevolg is groter dan een leeg veldje. Zonder herkend merk val je uit merkfilters, uit merkgebaseerde aanbevelingen en uit een deel van de Cassini-ranking. Een klikratio van 0,0006 tegenover 0,3132 — een factor 500 — past bij precies dat beeld.

**Dit is de goedkoopste en zwaarste ingreep die er ligt.** Eén veld, op alle listings.

## 3 · Waarom Installatiepositie en OE leeg staan

Niet omdat de data ontbreekt. Voor de 1.941 A.B.S.-remblokken in de database:

| Veld | Gevuld |
|---|---|
| OE-referenties | **1.941 / 1.941 — 100%** |
| Einbauposition (Duits) | 1.838 enkelvoudig + 85 dubbelzijdig = **99,1%** |
| EAN | 100% |
| Titel DE | 100% |
| Omschrijving DE | 100% |

De listings staan leeg omdat **deze data nooit naar eBay is gestuurd**. Channable-kanaal 159122 heeft in zijn hele bestaan **0 items verstuurd** — dat staat zwart op wit in stap 7. De bestaande listings zijn langs een andere route ontstaan, vóór de verrijking bestond.

Er is dus geen bug. Er is een ontbrekende verbinding.

## 4 · Waarom een Channable-push nu het verkeerde instrument is

Drie redenen:

**Duplicaatrisico.** De listings bestaan al en zijn niet door dit kanaal aangemaakt. Een push kan nieuwe listings aanmaken naast de bestaande in plaats van ze bij te werken. Dan betaal je twee keer insertion fees, verlies je verkoopgeschiedenis en Best-Match-positie, en krijg je nieuwe ItemID's waardoor elke K-Type-koppeling ongeldig wordt.

**De companion-feed hangt er nog niet aan.** De 3.442 verrijkte records zitten in Supabase, niet in Channable. Een push vandaag stuurt dezelfde lege attributen die er nu al staan.

**Het kanaal staat vast op Publiceer.** Beide publicatie-opties zijn UI-locked, dus je kunt niet droog draaien.

## 5 · Wat wél kan, en snel

**Revise-upload via Verkäufer-Cockpit Pro.** Dat werkt zoals de K-Type-upload: bestaande listings bijwerken op ItemID, geen nieuwe listings, geen fees, geschiedenis blijft intact.

Wat we daarmee in één bestand kunnen vullen voor alle actieve A.B.S.-remblokken:

| Item specific | Bron | Dekking |
|---|---|---|
| **Marke → `A.B.S.`** | vast | 100% |
| Einbauposition | `einbauposition_de` | 99,1% |
| OE/OEM Referenznummer(n) | `oe_csv` | 100% |
| Herstellernummer | `sku` | 100% |
| EAN | `ean` | 100% |
| Produktart | `Bremsbelagsatz` | 100% |

Dat brengt "Empfohlene Artikelmerkmale angegeben" van 2 naar 6 en zet Marke van 0 naar 1.

**Wat ik daarvoor nodig heb:** een verse listing-export uit eBay met **ItemID + SKU** van de ~1.200 die je net hebt geactiveerd. Onze snapshot `ebay_listing_state` heeft 553 regels waarvan er 212 matchen op remblokken — die is ouder dan jouw actie van vandaag.

Verkäufer-Cockpit Pro → Berichte → Downloads → *Aktive Angebote*.

## 6 · Antwoord op je vraag: wanneer ben ik klaar

**Voor de Revise-upload: dezelfde dag dat je de listing-export aanlevert.** Het bouwen van het bestand is een paar uur; de data staat klaar en is geverifieerd.

**Voor een volledige Channable-push: niet vóór drie dingen af zijn.**

1. Companion-feed als import in Channable, merge op `sku` — daarvoor moet `db-max-rows` in Supabase omhoog (één instelling) of we doen het met vier gepagineerde URL's
2. Vastgesteld hoe het kanaal omgaat met bestaande listings — eerst een tranche van 10 SKU's om te zien of het bijwerkt of dupliceert
3. De 3.442 afbeeldingen naar R2, waarvoor de S3-sleutels nog in de env moeten

Realistisch: Revise deze week, Channable-push pas nadat de tranche van 10 bewezen heeft dat er niets dupliceert.

## 7 · Volgorde die ik aanraad

1. **Marke-fix via Revise op alle actieve listings** — grootste effect, kleinste risico
2. Einbauposition + OE + Herstellernummer in dezelfde upload meenemen
3. Meten na 7 dagen: klikratio en impressies in het volgende kwaliteitsrapport
4. Pas daarna de Channable-route inrichten voor nieuwe listings en voor Brembo

Punt 1 en 2 kosten één bestand en één upload. Dat is vandaag te doen.
