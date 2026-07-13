# Prompt Claude-in-Chrome — eBay DE titel + omschrijving · Remblokken (Bremsbeläge) — PER KANAAL

**Model:** Claude **Opus 4.8** (`claude-opus-4-8`).
**Reality-note (geverifieerd live deze sessie):** remblokken komen **data-arm** binnen — `car_brands`, `car_models`, positie en maten zijn meestal **LEEG** (bron: remblok-diagnose). Betrouwbaar aanwezig: `brand`, `sku`, `ean`, `oe_reference`, `categories_clean`. Titel/omschrijving dus **zonder** voertuig/positie, tenzij het veld bij een specifiek item wél gevuld is. Titelveld = `ebay_title_de`, omschrijvingveld = `omschrijving`, GPSR = `gpsr_manufacturer_name`, categorie-waarde = `remblokken`. Onder eBay DE bestaat (nog) **geen** eigen remblok-titelregel → nieuw bouwen.

---

## PROMPT (kopieer vanaf hier)

Je bestuurt Channable in Chrome voor Connect Car Parts. Project **314525** (company 101300), kanaal **eBay DE (id 152339)**. Doel: geef **Remblokken** (Duits: **Bremsbeläge**) een **eigen kanaalregel** voor titel én omschrijving — self-contained op kanaal-niveau. Raak geen andere categorie aan.

### HARDE GUARDRAILS (nooit overtreden)
1. **Kom NOOIT aan de regel "SKU selectie"** (kostenrem €0,04/listing). Niet openen om te wijzigen, pauzeren, verslepen, verwijderen. Verander nergens het SKU-aantal of de selectie.
2. **Klik NOOIT op "Uitvoeren"**. Alleen **"Regel opslaan"**.
3. **Bewerk GEEN gedeelde master-groepen** (bv. "Omschrijvingen" 321808) — die voeden ook Bol/Amazon. Maak het kanaal self-contained.
4. **Merk uit veld `{brand}`** — nooit "A.B.S." hardcoden (ook Brembo).
5. **GPSR uit veld `{gpsr_manufacturer_name}`** (Tinbergenlaan 7, 3401 MT) — nooit hardcoden.
6. **Titel ≤ 80 tekens**.
7. **Twijfel/ontbrekend veld → STOP en rapporteer.**
8. Alleen deze categorie; daarna stoppen + rapporteren met screenshot.

### STAP 1 — scan eerst (niets wijzigen)
Open eBay DE → **Regels**. Bevestig dat er nog geen eigen remblok-titelregel is. Check op één remblok-item welke velden gevuld zijn: verwacht **leeg**: `car_brands`, `car_models`, positie, maten. Verwacht **gevuld**: `brand`, `sku`, `ean`, `oe_reference`. Gebruik alleen gevulde velden — géén lege placeholders in titel/tekst. Let op: een eerdere kapotte titel maakte per ongeluk "Bremsscheibe"-tekst op remblokken → zorg dat jouw remblok-regel alleen op `categories_clean bevat remblokken` vuurt.

### STAP 2 — kanaalregel "DE — Remblokken (Bremsbeläge)"
Gegate op: **Als `categories_clean` bevat `remblokken`**.

**Sectie A — Titel** → zet `ebay_title_de` =
`{brand}` + " " + `{sku}` + " Bremsbeläge Bremsbelagsatz" + (ALLEEN indien voertuigveld gevuld: " für u.a. " + `{car_brand_primary}` + " " + `{car_models_top1}`)
→ ≤ 80 tekens. Bij lege voertuigdata blijft de titel compact.
Voorbeeld (data-arm): **A.B.S. 37760 Bremsbeläge Bremsbelagsatz**

**Sectie B — Omschrijving** → zet `omschrijving` = onderstaande tekst (overschrijft de master-waarde voor remblokken). `{ }` = veldchip.

```
{brand} {sku} Bremsbelagsatz – Original {brand} Qualität

Produkt: Bremsbelagsatz für Scheibenbremse
Artikelnummer: {sku} · EAN: {ean}
OE-/OEM-Referenznummern: {oe_reference}

Bitte prüfen Sie die Passgenauigkeit anhand der OE-Nummer und Ihres Altteils – innerhalb einer Baureihe gibt es unterschiedliche Bremssysteme.

Über {brand}: Markenqualität nach OE-Standard.
Wichtiger Hinweis: Bremsbeläge immer achsweise komplett wechseln und dabei die Bremsscheiben prüfen. Einbau nur durch eine Fachwerkstatt.
Hersteller (GPSR): {gpsr_manufacturer_name}
```
Het "Passend für folgende Fahrzeuge"-blok bewust WEGgelaten (voertuigdata ontbreekt bij blokken). Geen dubbele spaties/losse streepjes.

### STAP 3 — preview + opslaan
Preview op ABS 37760 en 37770 (remblokken). Check: correct Duits, titel ≤ 80 en zonder lege stukken, merk-dynamisch, GPSR-regel aanwezig, en **precies één** omschrijving (geen dubbele/lege). Klopt het? → **"Regel opslaan"** (NIET "Uitvoeren"). Screenshot + meld: "Remblokken klaar, klaar om te checken." Stop daarna.

## (einde prompt)
