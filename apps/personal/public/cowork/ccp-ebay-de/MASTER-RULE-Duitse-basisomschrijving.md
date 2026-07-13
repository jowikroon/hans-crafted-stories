# MASTER RULE — Duitse basisomschrijving (A.B.S. auto-onderdelen)

**Doel:** elke SKU krijgt éérst één consistente, platform-neutrale **Duitse basisomschrijving**. Dat is de fundering waarop Luca de eBay-DE brand store bouwt; daarna verfijnt Hans per ebay.de-listing.
**Scope:** hele catalogus — Remmen, Stuurdelen, Wiellagersets ([[CCP]] / [[ABS-Brand-Profile]]).
**Status:** v1 — 2026-07-06. Bron-feiten: [[ABS-Brand-Profile]], [[Channable-D365-Integration]], [[eBay-DE-Launch]].

---

## De regel (de 8 vaste bouwstenen)

Elke basisomschrijving bevat **exact deze blokken, in deze volgorde**. Ontbreekt brondata voor een blok → dat blok weglaten, **nooit gokken**.

1. **Kopzin** — `[Produkttyp] von A.B.S.` + kernfunctie in 1 zin. (bevat het SEO-kernwoord)
2. **Wat & waarvoor** — 2 zinnen: functie van het onderdeel + waar het toe dient.
3. **Fahrzeugkompatibilität** — verwijs naar OE-nummer + KBA/HSN-TSN-afgleich. Alleen echte OE-/TecDoc-data uit D365/Channable.
4. **Technische Merkmale** — spec-lijst uit brondata (placeholders `{…}`): Ø, Höhe, Dicke, Lochzahl, Material, belüftet/massiv, etc.
5. **Lieferumfang** — aantal stuks / set-inhoud.
6. **Qualität & Sicherheit** — vaste A.B.S.-claim (zie hieronder, letterlijk).
7. **GPSR / Hersteller** — **verplicht** blok, identiek voor álle producten (zie hieronder, letterlijk).
8. **(leeg voor verfijning)** — géén prijs, levertijd, eBay-HTML of platformclaims in de basis. Dat komt in de verfijn-laag.

---

## Vaste tekstblokken (letterlijk overnemen)

**Qualität & Sicherheit (blok 6):**
> Qualität von A.B.S. – All Brake Systems, niederländischer Hersteller seit 1978. Zertifiziert nach ISO 9001 und BER 461/2010, mit über 36.000 Referenzen und einer Fahrzeugabdeckung von 99,7 % in Europa.

**GPSR / Hersteller (blok 7) — verplicht op elke DE-listing:**
> **Hersteller / Manufacturer:** A.B.S. All Brake Systems B.V., Tinbergenlaan 7, 3401 MT IJsselstein, Niederlande. Tel. +31 30 687 8555.

---

## Harde regels (niet-onderhandelbaar)

- **Taal:** Duits, formeel (`Sie`), correcte kfz-vakterminologie (Bremsbeläge, Bremsscheibe, Radlagersatz, Spurstange, Traggelenk …).
- **Geen verzonnen fitment/OE.** Alleen wat feitelijk in TecDoc / D365 / Channable staat. Onbekend = weglaten.
- **Basis = platform-neutraal.** Geen eBay-specifieke opmaak, geen prijzen, geen levertijden, geen "Nr. 1"/superlatieven, geen concurrentievergelijking.
- **GPSR-blok altijd aanwezig** (EU-productveiligheid; verplicht voor eBay.de).
- **Lengte:** 120–180 woorden.
- **Consistente kopjes** zodat Luca ze uniform in de brand-store-template kan gieten.
- **Eén product = één basis.** Varianten (maat/zijde) erven de basis, alleen blok 4/5 verschilt.

---

## Herbruikbare prompt (voor n8n / Gemini-pipeline)

```
Du bist Produkttexter für A.B.S. Autoteile (Marke „A.B.S. – All Brake Systems").
Schreibe eine SACHLICHE, plattformneutrale deutsche BASIS-Produktbeschreibung
(120–180 Wörter, Anrede „Sie") aus den folgenden Quelldaten. Halte dich exakt an
diese Reihenfolge: 1) Kopfzeile „[Produkttyp] von A.B.S." + Kernnutzen,
2) Was & wofür (2 Sätze), 3) Fahrzeugkompatibilität (nur echte OE-/KBA-Daten;
fehlt etwas → weglassen, NICHT erfinden), 4) Technische Merkmale (nur gelieferte
Felder), 5) Lieferumfang, 6) den festen Qualitäts-Satz, 7) den festen
GPSR/Hersteller-Block. KEINE Preise, Lieferzeiten, eBay-HTML, Superlative oder
Wettbewerbsvergleiche. Feste Blöcke 6 und 7 wörtlich übernehmen.

QUELLDATEN:
- Produkttyp: {produkttyp}
- Kategorie: {remmen|stuurdelen|wiellagersets}
- OE-Nummern: {oe_nummern}
- Technische Felder: {specs_key_value}
- Lieferumfang: {lieferumfang}

FESTER BLOCK 6: „Qualität von A.B.S. – All Brake Systems, niederländischer
Hersteller seit 1978. Zertifiziert nach ISO 9001 und BER 461/2010, mit über
36.000 Referenzen und einer Fahrzeugabdeckung von 99,7 % in Europa."
FESTER BLOCK 7: „Hersteller: A.B.S. All Brake Systems B.V., Tinbergenlaan 7,
3401 MT IJsselstein, Niederlande. Tel. +31 30 687 8555."
```

---

## Voorbeeld (Bremsscheibe — placeholders ingevuld)

> **Bremsscheibe von A.B.S. – geprüfte Qualität für sicheres Bremsen.**
> Die Bremsscheibe überträgt die Bremskraft auf den Bremsbelag und sorgt für zuverlässiges, gleichmäßiges Verzögern. Ein Verschleißteil, das paarweise pro Achse getauscht werden sollte.
>
> **Fahrzeugkompatibilität:** Bitte gleichen Sie die OE-Nummer {OE} sowie Ihre KBA-/HSN-TSN-Nummer vor dem Kauf ab.
> **Technische Merkmale:** Durchmesser {Ø} mm · Höhe {H} mm · Dicke {D} mm · Lochzahl {n} · {belüftet/massiv}.
> **Lieferumfang:** {n} Stück.
>
> Qualität von A.B.S. – All Brake Systems, niederländischer Hersteller seit 1978. Zertifiziert nach ISO 9001 und BER 461/2010, mit über 36.000 Referenzen und einer Fahrzeugabdeckung von 99,7 % in Europa.
>
> **Hersteller:** A.B.S. All Brake Systems B.V., Tinbergenlaan 7, 3401 MT IJsselstein, Niederlande. Tel. +31 30 687 8555.

---

## Verfijn-laag (later, Hans → ebay.de)
De basis blijft ongemoeid. Per eBay-listing voeg je toe: eBay-titel (75/80 tekens, incl. voertuigcompatibiliteit — [[eBay-DE-Launch]]), Subtitle (€1,50, +15% CTR), Artikelmerkmale/Item Specifics, eBay-HTML-opmaak van de brand-store-template, en categorie-specifieke keywords.
