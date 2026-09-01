---
type: incident + fix
scope: CCP · eBay DE · 1.037 verborgen listings · Grundsatzverstoß
status: oorzaak bewezen · bronfix doorgevoerd · uploadbestand klaar
created: 2026-08-20
last_reviewed: 2026-08-20
bron: eBay Verkäufer-Cockpit Pro (LISTINGS_ON_HOLD), case 2-107942881270, listing 257692372902, Channable master-regel 27809318
---

# 1.037 verborgen listings — een telefoonnummer in de omschrijving

**Het ligt niet aan je Image Link-regel.** Die regel is leeg: één sectie met conditie
`always_true` en actie `nothing`. Aangemaakt maar nooit ingevuld, en hij verandert dus niets.
Uitgelezen via Channable's eigen API, regel 28235477.

## 1 · Wat eBay letterlijk zegt

Case **2-107942881270**, opgehaald uit het Verkäufer-Cockpit:

| Veld | Inhoud |
|---|---|
| Grundsatz | *Beleid voor aanbiedingen om objecten buiten eBay om te kopen of verkopen* |
| Activiteit | *Voorstellen om buiten eBay om te kopen of verkopen, **inclusief directe contactgegevens delen** vóór een aankoop op eBay, is niet toegestaan* |
| Maatregel | Listings verborgen tot je het oplost. Kosten voor verkochte listings zijn gecrediteerd. Na herziening bekijkt eBay ze opnieuw en worden ze weer zichtbaar. Eerdere verkopen blijven intact. |

Geen boete, geen accountschade. Zichtbaarheid weg tot je het repareert.

## 2 · De directe contactgegevens

In de live omschrijving van elke geraakte listing staat:

> **Hersteller / Manufacturer** A.B.S. All Brake Systems B.V., Tinbergenlaan 7, 3401 MT IJsselstein, Niederlande. **Tel. +31 30 687 8555.**

Dat telefoonnummer is de trigger. Herkomst gevonden: **Channable master-regel 27809318 "Kwaliteit & GPSR"** in groep 321808, sectie 2:

```
set omschrijving_gpsr_de =
  "A.B.S. All Brake Systems B.V., Tinbergenlaan 7, 3401 MT IJsselstein, Niederlande. Tel. +31 30 687 8555."
```

Dat veld wordt via `omschrijving_de_basic_fallback_all` onderaan elke omschrijving geplakt.

**GPSR blijft gedekt.** eBay heeft een eigen gestructureerd blok — *Informationen zur Produktsicherheit → Hersteller/EU Verantwortliche Person* — en dat staat op de listing. Daar mág het telefoonnummer wél staan. In vrije tekst niet.

## 3 · Waarom nu, en niet gisteren

Het telefoonnummer stond er al langer. Wat vandaag veranderde is dat wíj de listings hebben aangeraakt: de Revise-upload van 1.167 listings landde om **13:22 MESZ**. Een revise laat eBay de listing opnieuw door de compliance-scan halen. Toen pas ging de filter af.

Dit klopt met wat je ziet: geraakt zijn uitsluitend **Bremsbelagsätze** (37340, 37040, 36788, 37126, 37579, 36839, 37101 …) — precies onze revise-set. De Bremssättel en Bremsscheiben in dezelfde lijst zijn níét geraakt, want die hebben we niet aangeraakt.

1.037 van de 1.163 geslaagde revises. De rest is waarschijnlijk nog niet uitgescand.

## 4 · Wat ik al heb gedaan

**Bronfix in Channable — doorgevoerd.** Master-regel 27809318 aangepast via de API, version_id 16193139 → 16921993, geverifieerd door terug te lezen:

```
was:  ... IJsselstein, Niederlande. Tel. +31 30 687 8555.
nu:   ... IJsselstein, Niederlande.
```

Naam en adres blijven staan — dat is GPSR-tekst en geen contactgegeven in eBay's zin. Alleen het nummer is eruit. Elke toekomstige push is hiermee schoon. Terugdraaien kan met de originele waarde hierboven.

## 5 · Wat jij moet uploaden

**`ebay-revise-OMSCHRIJVING-1167-2026-08-20.csv`** — 1.167 regels, 1,7 MB.
Kolommen: `Action`, `ItemID`, `CustomLabel`, `Description`.

Waarom alle 1.167 en niet alleen de 1.037: de overige 130 dragen hetzelfde telefoonnummer en gaan om zodra iemand ze aanraakt. In één keer schoon.

Wat er in de nieuwe omschrijving staat — de rijke versie uit Supabase, niet de generieke fallback:

- kop met SKU en A.B.S.-kwaliteit
- Produkt, Einbauposition, Herstellernummer, EAN
- OE-/OEM-referentienummers, **ontdubbeld** (258 listings hadden dubbelingen, bijv. 37340: `0790710, 6G065, 6L065, 0790710, 6G065, 6L065`)
- Passend für u. a. + voertuigmodellen
- afsluitend: `Hersteller / Manufacturer: A.B.S. All Brake Systems B.V., Tinbergenlaan 7, 3401 MT IJsselstein, Niederlande.`

Machinecontrole op alle 1.167: **0 telefoonnummers, 0 e-mailadressen, 0 URL's.** Langste omschrijving 3.860 tekens, ruim binnen eBay's limiet.

**Doe eerst de testtranche.** `ebay-revise-OMSCHRIJVING-TEST25-2026-08-20.csv` — dezelfde 4 kolommen, eerste 25 regels. Upload die, wacht op het resultaatbestand, kijk of één van die 25 uit de on-hold-lijst verdwijnt. Pas dan de volle 1.167.

Route: `Verkäufer-Cockpit Pro → Berichte → Uploads`.

Let op bij openen in Excel: UTF-8 met BOM, en de omschrijvingen bevatten HTML met komma's. Opslaan als **CSV UTF-8** of, beter, helemaal niet openen.

## 6 · Wat je niet hoeft te doen

Niet per listing op **Klären** klikken. eBay herbeoordeelt automatisch zodra de listing herzien is. Ook geen **Einspruch** — er valt niets te betwisten, het nummer stond er echt.

## 7 · Twee dingen die ik onderweg tegenkwam

**Het telefoonnummer klopt niet met zichzelf.** De vrije tekst had `+31 30 687 8555`, het gestructureerde GPSR-veld in Channable (regel 27339807) heeft `+31 30 686 1200`. Eén van de twee is fout. Voor eBay maakt het nu niet meer uit, voor de GPSR-registratie wel.

**Regel 27809318 kent geen merkonderscheid.** Hij zet de A.B.S.-tekst zonder merkconditie, dus Brembo-items krijgen in de omschrijving het A.B.S.-adres. De gestructureerde GPSR-velden zijn wél merk-gesplitst (27339807 A.B.S. / 28208115 Brembo). Zolang Brembo niet live is doet het geen kwaad; vóór de Brembo-livegang moet dit een merkconditie krijgen.

## 8 · Openstaand

- Regel 28231746 `DE | AA01 | Build-velden vullen` is nog leeg — vier secties te vullen.
- Regel 28235477 `Image Link` is leeg. Vullen volgens `PROMPT-hoofdafbeelding-koppelen-2026-08-20.md`, of weggooien.
- Verkooplimiet verhogen: blokkeert nog steeds 1.660 nieuwe listings, waaronder alle Brembo.
- De OE-dubbelingen zitten óók in het attribuut `C:OE/OEM Referenznummer(n)` uit de eerste revise. Los te trekken in een vervolgbestand; de omschrijving is nu wel schoon.
- `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET` en `EBAY_REFRESH_TOKEN` in `_skill/adapters/.env` zijn placeholders van 14 tekens. Daardoor kon ik de eBay Compliance API niet gebruiken en moest dit via de browser. Zelfde soort probleem als de Magento `CONSUMER_SECRET`.

---

## 9 · Uitslag van de upload (20-08, 15:41 MESZ)

**1.163 van 1.167 geslaagd, 4 mislukt, €0 kosten.** Alle fee-kolommen staan op nul — een Revise is gratis.

eBay's resultaatbestand bevestigt de diagnose woord voor woord. Waarschuwing **21920396** staat op precies **1.037 regels**:

> *Warning - Dieses Angebot verstößt gegen Grundsatz zu Käufen und Verkäufen außerhalb von eBay.*

Exact het aantal verborgen listings. De koppeling tussen de omschrijving en de blokkade is daarmee hard, niet afgeleid.

Die waarschuwing beschrijft de **stand bij het insturen**, niet het oordeel over de nieuwe tekst. eBay schrijft in de case: *"Zodra u de aanbiedingen hebt herzien, bekijken we ze."* De herbeoordeling loopt asynchroon.

Geverifieerd op listing 257692372902 om 15:41: `Zuletzt aktualisiert am 20. Aug. 2026 15:41:00 MESZ`, en in de volledige paginatekst staat **geen telefoonnummer meer**. De teller stond een paar minuten later nog op 1.037 — dat is eBay's wachtrij, niet een tweede overtreding.

De overige twee waarschuwingen zijn oud nieuws en blokkeren niets:

| Code | Aantal | Betekenis |
|---|---|---|
| 21919456 | 1.167 | gebruik Rahmenbedingungen-ID's in plaats van losse verzend-/betaalvelden |
| 21917236 | 1.156 | ingehouden betalingen |

## 10 · De 4 mislukkers

Foutcode **21919137** — *Die Auflösung der bereitgestellten Bilder entspricht nicht den Anforderungen des eBay-Bildergrundsatzes.*

| SKU | ItemID | Huidig beeld |
|---|---|---|
| 36133 | 257692306262 | 400 × 498 |
| 36056 | 257692306289 | 400 × 425 |
| 36077 | 257692306388 | 400 × 445 |
| 37700 | 257692306393 | 400 × 467 |

Deze vier hebben dus ook de nieuwe omschrijving níét gekregen — de hele regel is geweigerd. Beeld en tekst moeten samen mee.

**`ebay-revise-FIX4-beeld-en-omschrijving-2026-08-20.csv`** — 4 regels, kolommen `Action`, `ItemID`, `CustomLabel`, `PicURL`, `Description`. De vier R2-URL's zijn zojuist gecontroleerd: HTTP 200, `image/jpeg`, 58–75 kB, 1600 × 1600.

Leerpunt voor later: eBay hercontroleert bij élke revise ook de bestaande afbeeldingen. Elke listing met een beeld onder 500 px sneuvelt bij de eerstvolgende aanraking, ongeacht wat je wijzigt.
