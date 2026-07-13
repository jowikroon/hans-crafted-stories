# Prompt voor Claude-in-Chrome — eBay DE titel + omschrijving · Remklauwen (Bremssattel)

**Model:** Claude **Opus 4.8** (`claude-opus-4-8`). Sonnet 5 alleen als Opus niet beschikbaar is.
**Categorie:** Remklauwen → Duits **Bremssattel**. Eén regel, Sectie A (titel) + Sectie B (omschrijving). Na opslaan stoppen en Hans laten checken.

Plak alles hieronder in de Claude-in-Chrome chat op de laptop (Channable open, ingelogd als Luca).

---

## PROMPT (kopieer vanaf hier)

Je bestuurt Channable in Chrome voor Connect Car Parts. Project **314525** (company 101300), kanaal **eBay DE (id 152339)**. Doel: bouw de Duitse **titel** én **omschrijving** voor precies één categorie — **Remklauwen** (Duits: **Bremssattel**) — als één channel-regel, gegate op die categorie. Raak geen andere categorie aan.

### HARDE GUARDRAILS (nooit overtreden)
1. **Kom NOOIT aan de regel "SKU selectie".** Niet openen om te wijzigen, niet pauzeren, niet verslepen, niet verwijderen. Die bepaalt hoeveel/welke SKU's listen en beschermt tegen €0,04-per-listing kosten. Verander nergens het aantal of de selectie van SKU's.
2. **Klik NOOIT op "Uitvoeren"** (dat pusht live naar eBay). Alleen **"Regel opslaan"**.
3. Werk **alleen binnen de eBay DE-kanaalregels**. Raak geen andere kanalen, imports of master-groepen aan tenzij expliciet gevraagd.
4. **Merk komt uit het veld `{brand}`** (dynamisch). Type NOOIT "A.B.S." hard in — sommige producten zijn Brembo.
5. **GPSR/fabrikant = veld `gpsr_manufacturer_name`** (staat al goed: Tinbergenlaan 7, 3401 MT IJsselstein). Nooit Zeemanlaan, nooit hardcoden.
6. **Titel ≤ 80 tekens** (eBay-limiet). Te lang? Kap het voertuig-deel achteraan eerst af, op een woordgrens.
7. **Twijfel of een veld ontbreekt → STOP en rapporteer.** Niet gokken, niet forceren.
8. Maak **alleen deze ene categorie**, dan **stoppen** en rapporteren met screenshot voor Hans.

### STAP 1 — scan eerst (niets wijzigen)
Open eBay DE → **Regels**. Bekijk of er al iets voor Remklauwen/Bremssattel/titel/omschrijving bestaat, zodat je uitbreidt i.p.v. dubbel bouwt. Noteer de exacte veldnamen op een Remklauw-item: `brand`, `sku`, `categories_clean`, positie (`einbauposition_de` of links/rechts), `car_brand_primary` / `car_models_top1`, `oe_reference`, `ean`, `gpsr_manufacturer_name`.
**Let op (Bremssattel-specifiek):** remklauwen kennen soms **Altteilpfand (Pfand/core deposit)**. Als je een pfand-/statiegeldveld ziet, wijzig het NIET — meld het en laat Hans beslissen of het in titel/omschrijving moet.

### STAP 2 — bouw één regel "DE — Remklauwen (Bremssattel)"
Twee secties, beide gegate op: **Als `categories_clean` bevat `remklauwen`**.

**Sectie A — Titel** → zet veld **`ebay_title_de`** = combineer waarde:
`{brand}` + " " + `{sku}` + " Bremssattel" + (indien positie gevuld: " " + `{positie}`) + " für u.a. " + `{car_brand_primary}` + " " + `{car_models_top1}`
→ afkappen op ≤ 80 tekens (voertuig-deel eerst).
Voorbeeld A.B.S.: **A.B.S. 729091 Bremssattel Vorderachse links für u.a. Daewoo Lanos**
Voorbeeld Brembo: **Brembo … Bremssattel … für u.a. …** (merk komt automatisch mee).

**Sectie B — Omschrijving** → zet het beschrijvingsveld (`omschrijving`, dat eBay bij "Beschrijving" gebruikt) = onderstaande tekst. Alles tussen `{ }` invoegen als veldchip; de rest is platte tekst.

```
{brand} {sku} Bremssattel – Original {brand} Qualität

Produkt: Bremssattel {positie}
Artikelnummer: {sku} · EAN: {ean}
OE-/OEM-Referenznummern: {oe_reference}

Passend für folgende Fahrzeuge: {car_models}

Bitte prüfen Sie die Passgenauigkeit anhand der OE-Nummer und Ihres Altteils – innerhalb einer Baureihe gibt es unterschiedliche Bremssysteme (links/rechts, Vorder-/Hinterachse).

Über {brand}: Markenqualität nach OE-Standard, abgestimmt auf TecDoc-/KBA-Fahrzeugdaten.
Wichtiger Hinweis: Bremsteile immer fachgerecht prüfen und paarweise beurteilen. Einbau nur durch eine Fachwerkstatt.
Hersteller (GPSR): {gpsr_manufacturer_name}
```
Regels voor de omschrijving: het "Passend für folgende Fahrzeuge"-blok alleen tonen als `{car_models}` gevuld is (anders die regel weglaten). Geen dubbele spaties of losse streepjes.

### STAP 3 — preview + opslaan
Preview op één Remklauw-SKU (via "... Items na"). Controleer: correct Duits, titel ≤ 80, merk dynamisch (test ook een Brembo-SKU indien aanwezig), geen lege placeholders, GPSR-regel aanwezig. Klopt het? → **"Regel opslaan"** (NIET "Uitvoeren"). Maak daarna een screenshot van de regel + preview en meld: "Remklauwen klaar, klaar om te checken." **Stop daarna** — geen volgende categorie.

## (einde prompt)
