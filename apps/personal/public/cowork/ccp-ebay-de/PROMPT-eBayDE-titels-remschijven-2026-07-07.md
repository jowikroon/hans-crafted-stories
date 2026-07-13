# Prompt Claude-in-Chrome — eBay DE titel + omschrijving · Remschijven (Bremsscheibe) — PER KANAAL

**Model:** Claude **Opus 4.8** (`claude-opus-4-8`).
**Reality-note (geverifieerd live deze sessie):** onder eBay DE bestaat al de titelregel **"Titel DE — Bremsscheiben"**; de omschrijving loopt nu via de **gedeelde master "Omschrijvingen" (321808)** + gepauzeerde kanaalregels ("1. Basisopbouw omschrijving" is remschijf-gated en gebruikt velden: `brand, categories_clean_single, buitendiameter, remschijfdikte, minimale_dikte, centreringdiameter, remschijftype, inbouwplaats_clean, ean`). Bevestigd: titelveld = `ebay_title_de`, omschrijvingveld = `omschrijving`, GPSR-veld = `gpsr_manufacturer_name`, categorie-waarde = `remschijven`.

---

## PROMPT (kopieer vanaf hier)

Je bestuurt Channable in Chrome voor Connect Car Parts. Project **314525** (company 101300), kanaal **eBay DE (id 152339)**. Doel: zorg dat **Remschijven** (Duits: **Bremsscheibe**) een **eigen kanaalregel** heeft voor titel én omschrijving — self-contained op kanaal-niveau, niet via een gedeelde master. Raak geen andere categorie aan.

### HARDE GUARDRAILS (nooit overtreden)
1. **Kom NOOIT aan de regel "SKU selectie"** (kostenrem €0,04/listing). Niet openen om te wijzigen, pauzeren, verslepen, verwijderen. Verander nergens het SKU-aantal of de selectie.
2. **Klik NOOIT op "Uitvoeren"**. Alleen **"Regel opslaan"**.
3. **Bewerk GEEN gedeelde master-groepen** (bv. "Omschrijvingen" 321808) — die voeden ook Bol/Amazon. Maak het eBay DE-kanaal self-contained door de waarde in de kanaalregel te zetten.
4. **Merk uit veld `{brand}`** — nooit "A.B.S." hardcoden (ook Brembo).
5. **GPSR uit veld `{gpsr_manufacturer_name}`** (Tinbergenlaan 7, 3401 MT) — nooit hardcoden.
6. **Titel ≤ 80 tekens**, afkappen op woordgrens (voertuig-deel eerst).
7. **Twijfel/ontbrekend veld → STOP en rapporteer.**
8. Alleen deze categorie; daarna stoppen + rapporteren met screenshot.

### STAP 1 — scan eerst (niets wijzigen)
Open eBay DE → **Regels**. Bekijk **"Titel DE — Bremsscheiben"** (bestaat al) en de gepauzeerde omschrijving-regels. Noteer de exacte veldnamen op een remschijf-item en kies de juiste positie-veldnaam uit de veldkiezer (`einbauposition_de` of `inbouwplaats_clean`). Beslis: titel al goed via "Titel DE — Bremsscheiben"? → dan alleen bevestigen/aanvullen, NIET dubbel bouwen. Omschrijving loopt via de gedeelde master → die ga je hieronder op **kanaal-niveau overschrijven**.

### STAP 2 — kanaalregel "DE — Remschijven (Bremsscheibe)"
Gegate op: **Als `categories_clean` bevat `remschijven`**.

**Sectie A — Titel** (alleen als "Titel DE — Bremsscheiben" het nog niet correct doet): zet `ebay_title_de` =
`{brand}` + " " + `{sku}` + " Bremsscheibe" + (indien positie gevuld: " " + `{einbauposition_de}`) + (indien `{remschijftype}` gevuld: " " + `{remschijftype}`) + " Ø" + `{buitendiameter}` + " für u.a. " + `{car_brand_primary}` + " " + `{car_models_top1}`
→ ≤ 80 tekens (voertuig-deel eerst afkappen).
Voorbeeld: **A.B.S. 16880 Bremsscheibe Vorderachse belüftet Ø256mm für u.a. VW Golf**

**Sectie B — Omschrijving** → zet `omschrijving` = onderstaande tekst (overschrijft de master-waarde voor remschijven). `{ }` = veldchip.

```
{brand} {sku} Bremsscheibe – Original {brand} Qualität

Produkt: Bremsscheibe {einbauposition_de} {remschijftype}
Maße: Ø {buitendiameter}, Dicke {remschijfdikte}, Mindestdicke {minimale_dikte}, Nabenbohrung {centreringdiameter}
Artikelnummer: {sku} · EAN: {ean}
OE-/OEM-Referenznummern: {oe_reference}

Passend für folgende Fahrzeuge: {car_models}

Über {brand}: Markenqualität nach OE-Standard, abgestimmt auf TecDoc-/KBA-Fahrzeugdaten.
Wichtiger Hinweis: Bremsscheiben immer achsweise paarweise wechseln. Einbau nur durch eine Fachwerkstatt.
Hersteller (GPSR): {gpsr_manufacturer_name}
```
Toon een "Maße"- of "Passend für"-regel alleen als het bijbehorende veld gevuld is. Geen dubbele spaties/losse streepjes.

### STAP 3 — preview + opslaan
Preview op ABS 16880 (remschijf). Check: correct Duits, titel ≤ 80, merk-dynamisch, maten kloppen, GPSR-regel aanwezig, en **precies één** omschrijving (geen dubbele/lege → als de master ook nog schrijft, zorg dat de kanaalregel ná de master komt of het veld overschrijft). Klopt het? → **"Regel opslaan"** (NIET "Uitvoeren"). Screenshot + meld: "Remschijven klaar, klaar om te checken." Stop daarna.

## (einde prompt)
