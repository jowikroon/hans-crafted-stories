# Prompt voor Claude-in-Chrome — eBay DE titel + omschrijving per categorie

**Model:** Claude **Opus 4.8** (`claude-opus-4-8`). Sonnet 5 alleen als Opus niet beschikbaar is.
**Werkwijze:** één categorie per keer. Eerste = **Draagarmen (Querlenker)**. Na opslaan stopt de agent en laat Hans het resultaat aan Cowork-Claude checken vóór de volgende categorie.

Plak alles hieronder in de Claude-in-Chrome chat op de laptop (Channable moet open zijn, ingelogd als Luca).

---

## PROMPT (kopieer vanaf hier)

Je bestuurt Channable in Chrome voor Connect Car Parts. Project **314525** (company 101300), kanaal **eBay DE (id 152339)**. Doel: bouw de Duitse **titel** én **omschrijving** voor precies één categorie — **Draagarmen** (Duits: **Querlenker**) — als één channel-regel, gegate op die categorie. Raak geen andere categorie aan.

### HARDE GUARDRAILS (nooit overtreden)
1. **Kom NOOIT aan de regel "SKU selectie".** Niet openen om te wijzigen, niet pauzeren, niet verslepen, niet verwijderen. Die bepaalt hoeveel/welke SKU's listen en beschermt tegen €0,04-per-listing kosten. Verander nergens het aantal of de selectie van SKU's.
2. **Klik NOOIT op "Uitvoeren"** (dat pusht live naar eBay). Alleen **"Regel opslaan"**.
3. Werk **alleen binnen de eBay DE-kanaalregels**. Raak geen andere kanalen, imports of master-groepen aan tenzij expliciet gevraagd.
4. **Merk komt uit het veld `{brand}`** (dynamisch). Type NOOIT "A.B.S." hard in — sommige producten zijn Brembo.
5. **GPSR/fabrikant = veld `gpsr_manufacturer_name`** (dat staat al goed: Tinbergenlaan 7, 3401 MT IJsselstein). Nooit Zeemanlaan, nooit hardcoden.
6. **Titel ≤ 80 tekens** (eBay-limiet). Te lang? Kap het voertuig-deel achteraan eerst af, op een woordgrens.
7. **Twijfel of een veld ontbreekt → STOP en rapporteer.** Niet gokken, niet forceren.
8. Maak **alleen deze ene categorie**, dan **stoppen** en rapporteren met screenshot voor Hans.

### STAP 1 — scan eerst (niets wijzigen)
Open eBay DE → **Regels**. Bekijk of er al iets voor Draagarmen/titel/omschrijving bestaat, zodat je uitbreidt i.p.v. dubbel bouwt. Noteer de exacte veldnamen die op een Draagarm-item bestaan: `brand`, `sku`, `categories_clean`, positie (`einbauposition_de` of links/rechts), automerk/model (`car_brand_primary` / `car_models_top1`), `oe_reference`, `ean`, `gpsr_manufacturer_name`. Gebruik de exacte namen zoals ze in de veldkiezer staan.

### STAP 2 — bouw één regel "DE — Draagarmen (Querlenker)"
Twee secties, beide gegate op: **Als `categories_clean` bevat `draagarmen`**.

**Sectie A — Titel** → zet veld **`ebay_title_de`** = combineer waarde:
`{brand}` + " " + `{sku}` + " Querlenker" + (indien positie gevuld: " " + `{positie}`) + " für u.a. " + `{car_brand_primary}` + " " + `{car_models_top1}`
→ afkappen op ≤ 80 tekens (voertuig-deel eerst).
Voorbeeld A.B.S.: **A.B.S. 210123 Querlenker Vorderachse links für u.a. Audi A4**
Voorbeeld Brembo: **Brembo ... Querlenker ... für u.a. ...** (merk komt automatisch mee).

**Sectie B — Omschrijving** → zet het beschrijvingsveld (dat eBay bij "Beschrijving" gebruikt, `omschrijving`) = onderstaande tekst. Alles tussen `{ }` invoegen als veldchip; de rest is platte tekst.

```
{brand} {sku} Querlenker – Original {brand} Qualität

Produkt: Querlenker {positie}
Artikelnummer: {sku} · EAN: {ean}
OE-/OEM-Referenznummern: {oe_reference}

Passend für folgende Fahrzeuge: {car_models}

Bitte prüfen Sie die Passgenauigkeit anhand der OE-Nummer und Ihres Altteils – innerhalb einer Baureihe gibt es unterschiedliche Ausführungen (links/rechts, oben/unten).

Über {brand}: Markenqualität nach OE-Standard, abgestimmt auf TecDoc-/KBA-Fahrzeugdaten.
Wichtiger Hinweis: Fahrwerksteile immer prüfen und paarweise ersetzen. Einbau nur durch eine Fachwerkstatt.
Hersteller (GPSR): {gpsr_manufacturer_name}
```
Regels voor de omschrijving: het "Passend für folgende Fahrzeuge"-blok alleen tonen als `{car_models}` gevuld is (anders die regel weglaten). Geen dubbele spaties of losse streepjes.

### STAP 3 — preview + opslaan
Preview op één Draagarm-SKU (via "... Items na"). Controleer: correct Duits, titel ≤ 80, merk dynamisch (probeer ook een Brembo-SKU als die er is), geen lege placeholders, GPSR-regel aanwezig. Klopt het? → **"Regel opslaan"** (NIET "Uitvoeren"). Maak daarna een screenshot van de regel + preview en meld: "Draagarmen klaar, klaar om te checken." **Stop daarna** — geen volgende categorie.

## (einde prompt)

---

## Voor de VOLGENDE categorieën — verander alleen deze 3 dingen
1. De conditie-waarde: `categories_clean` bevat **`<nederlandse categorie>`**.
2. De Duitse Produktart in titel + omschrijving (tabel hieronder).
3. Regelnaam: "DE — <categorie> (<Produktart>)".

| Categorie (NL) | Duitse Produktart | Positie relevant? |
|---|---|---|
| Draagarmen | Querlenker | ja (Vorderachse, links/rechts, oben/unten) |
| Remklauwen | Bremssattel | ja (Vorderachse, links/rechts) |
| Remtrommel | Bremstrommel | ja (meestal Hinterachse) |
| Remslangen | Bremsschlauch | ja (Vorder-/Hinterachse) |
| Wielremcilinder | Radbremszylinder | ja (Hinterachse, links/rechts) |
| Slijtindicatoren | Warnkontakt Bremsbelagverschleiß | soms |
| Accessoiresets | Zubehörsatz Bremsbacken | soms |
| Draagarmrubber | Lagerung Lenker | soms |
| Fuseekogel | Traggelenk | ja (oben/unten) |
| Spoorstangeind | Spurstangenkopf | ja (links/rechts, außen) |
| Axiaalkogel | Axialgelenk (innere Spurstange) | nee |
| Stabilisatorstangen | Koppelstange (Pendelstütze) | soms (links/rechts) |
| Wielsnelheidssensor | ABS-Sensor | ja (Vorder-/Hinterachse, links/rechts) |
| Manchette | Manschette | nee (subtype uit SKU) |
| Wartelmoer | Achsmutter | nee |
| Koppelingkabel | Kupplungsseilzug | nee |
| Trekkabel | Handbremsseil | nee |
| Gaskabel | Gaszug | nee |

Merk-dynamisch (`{brand}`), GPSR uit `{gpsr_manufacturer_name}`, titel ≤ 80, SKU selectie onaangeroerd — geldt voor élke categorie.

---

## BELANGRIJK — alles PER KANAAL, self-contained
Bouw titel én omschrijving als **kanaalregel onder het gekozen kanaal**, niet in een gedeelde master. Als de omschrijving nu via de gedeelde master "Omschrijvingen" (321808) of via gepauzeerde kanaalregels loopt: zet de omschrijving in DEZE kanaalregel zodat die de master **overschrijft** voor deze categorie. Bewerk de gedeelde master NIET (voedt ook Bol/Amazon). Controleer in de preview dat er precies één (juiste) omschrijving uitkomt — geen dubbele, geen lege. Dit geldt ook voor Remschijven en Remblokken: die alsnog per kanaal opbouwen.


---

## GEVERIFIEERDE VELDNAMEN — eBay DE (live bevestigd 2026-07-07, via operator-scan op ABS 16880)
Gebruik deze exacte namen; ze wijken af van eerdere aannames:
- Merk: `brand` (waarde is "ABS", niet "A.B.S." — dynamisch, ook Brembo)
- Artikelnummer: `sku`
- Categorie-gate: `categories_clean` bevat "remschijven" / "remblokken" / ...
- **Positie DE (voor/achter): `vooras_achteras_duits`** ("Vorderachse"/"Hinterachse") — NIET `einbauposition_de` of `inbouwplaats_clean` (die staan leeg)
- **Remschijftype DE: `remschijftype_de`** ("Belüftet") — NIET `remschijftype` (dat is NL "Geventileerd")
- **Voertuigmerk: `car_brands_top1`; model: `car_models_top1`** — er bestaat GEEN `car_brand_primary`
- Titelveld: `ebay_title_de` · omschrijvingveld: `omschrijving` · GPSR: `gpsr_manufacturer_name`
- NIET gebruiken: `DE - ebay_title_de_remschijf` (hardcodet "A.B.S.", schrijft naar amazon_title_de)
- "Titel DE — Bremsscheiben" bestaat maar de waarde is LEEG -> titel moet echt gebouwd worden.
- Maten remschijf (gevuld op 16880): `buitendiameter`, `remschijfdikte`, `minimale_dikte`, `centreringdiameter`.
