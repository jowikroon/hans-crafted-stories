# eBay DE — verificatie + snelste weg naar 100% schone listing-data (2026-07-24)

**Scope:** CCP / A.B.S. · Channable project **314525** (company 101300) · kanaal **eBay** (API-id 159122, rules-channel 1400294). Bronnen: live scan `rules-state.json` (21-07), `eBay-DE-huidige-setup-en-status-2026-07-08.md`, `veld-gap-analyse-per-categorie.html`, `ebay-compat-FULL-2discs-16880-18537.csv`, geverifieerde veldnamen (07-07), eBay.de-benchmark + GPSR (web, 24-07).

---

## Verdict eerst

**De pitch die je kreeg klopt inhoudelijk, maar hij gaat uit van een schaal die je nog niet hebt.** Op dit moment listen er **4 test-SKU's** op eBay (SKU Filter 27858166: 16880, 37760, SL 5595, 210017), zijn item-specifics gemapt voor **3 van 21 categorieën**, en staat de K-Typ-koppeling die je "op alle producten" noemt in werkelijkheid op **2 remschijven** (16880, 18537 — het bestand `ebay-compat-FULL-2discs...csv`). "100% op alle listings" is dus vandaag "100% op een handvol test-listings". De onderbouw is goed; de klus is **opschalen + de laatste velden vullen**, niet opnieuw bouwen.

**Belangrijkste bevinding voor je #1 vraag (overschrijf-risico):** Channable pusht op dit moment **geen** compatibiliteit/Fahrzeugverwendungsliste naar eBay — dat veld is in het eBay-kanaal **niet gemapt** (het staat als open TODO in de 08-07 status). Daarom is je directe eBay-upload **vandaag veilig**: de eerstvolgende Channable-sync wist je K-Types niet. Het risico ontstaat pas op het moment dat iemand de geplande "K-Typ-lijst uit Channable bouwen" alsnog aanzet. Beslis dus één bron voor fitment (zie §2).

---

## 1. Wat staat er echt (geverifieerd)

| Onderdeel | Status | Bewijs |
|---|---|---|
| eBay-kanaal actief | ✓ actief (11/11 kanalen activated, 21-07 drift-flag) | rules-state.json |
| Live listings | **4 SKU's** (kostenrem SKU Filter 27858166) | status 08-07 §5 |
| Categorisatie | **78,1%** (20.091 van ~25.736; 5.645 niet gecategoriseerd) | status 08-07 §4 |
| Titel + omschrijving | 20 categorieregels live (`ebay_title_de` / `ebay_omschrijving_de`) | status 08-07 §2 |
| Item-specifics | gemapt voor **3 categorieën** (test-scope) | status 08-07 §3 |
| K-Typ fitment | **direct in eBay op 2 discs**, niet via Channable | compat-CSV, status §7 |
| Mandatory quality-issues | 2: `material_safe_data_sheet` leeg op **32.202** items · `additional_imagelinks` leeg op 2.722 | rules-state.json |

**Nettobeeld:** de architectuur is een split-system (data via Channable, fitment direct op eBay). Dat is werkbaar, maar alleen als je het bewust zo houdt én de fitment op schaal genereert i.p.v. per SKU met de hand.

---

## 2. Split-system: de beslissing die je één keer moet nemen

Twee schone opties. Kies er één — niet allebei half.

**Optie A — fitment blijft eBay-direct (aanbevolen, snelste, nul overschrijf-risico).**
- Houd het compatibiliteit-veld in het Channable eBay-kanaal **leeg/ongemapt**. Dan raakt geen enkele sync je K-Types.
- Genereer de **volledige** Fahrzeugverwendungsliste voor álle live SKU's met de bestaande `ebay-ktype-compat` skill (script `build_ebay_compat.py`) uit de ABS TecDoc KType-export — niet 2 discs maar de hele lijst. Upload via Verkäufer-Cockpit Pro > Berichte > Uploads.
- Voordeel: schaalt scripted, geen Channable-afhankelijkheid, groene "Passt zu Ihrem Fahrzeug"-stripe gegarandeerd.

**Optie B — fitment via Channable (alleen als KType per SKU in de feed staat).**
- Map de Fahrzeugverwendungsliste in het eBay-kanaal uit de feld `ktype`/`car_brands_top1`+`car_models_top1`+`from_year`/`to_year`.
- Voordeel: één systeem. Nadeel: je moet de directe eBay-upload dan **stoppen** (anders vecht Channable met je handmatige lijst), en KType moet compleet in de feed zitten.

> Advies: **Optie A** tot de hele catalogus live is. Snelste weg naar volledige, veilige fitment. Zet daarna eventueel om naar B als je alles in één systeem wil.

---

## 3. Item-specific gap-matrix — Bremsscheibe als vlaggenschip

Benchmark = wat topconcurrenten (incl. A.B.S.-listings 18535/18730, ATE, TEXTAR, AUTODOC) op eBay.de vullen. Veldnamen = geverifieerd (07-07).

| eBay Artikelmerkmal (Bremsscheibe) | CCP feed-veld | Status |
|---|---|---|
| Hersteller | `brand` | ✓ live |
| Herstellernummer (MPN) | `sku` | ✓ live |
| OE-/OEM-Referenznummer + Vergleichsnummer | `oe_list` | ✓ (3 cat) — uitrollen naar alle |
| EAN | `ean` | ✓ shared attribute |
| Produktart | `product_type` / `categories_clean_single_de` | ✓ |
| Einbauposition (as + Links/Rechts) | `einbauposition_de` (+ `vooras_achteras_duits`) | ⚠ as ✓, **Links/Rechts vaak leeg** |
| Außendurchmesser [mm] | `buitendiameter` | ⚠ gemapt zodra Bremsscheiben-cat live — **nu nog niet** |
| Bremsscheibendicke [mm] | `remschijfdikte` | ⚠ TODO |
| Mindestdicke [mm] | `minimale_dikte` | ⚠ TODO |
| Lochzahl / Lochkreis-Ø | `bolt_pattern` | ⚠ TODO |
| Nabenbohrung / Innendurchmesser | `centreringdiameter` | ⚠ TODO |
| Bremsscheibenart (Belüftet/Voll) | `remschijftype_de` | ⚠ bestaat, **niet als eBay-specific gemapt** |
| Bremssystem (ATE/Lucas/TRW) | — | ✗ **veld ontbreekt in feed** |
| Höhe [mm] | — | ✗ **veld ontbreekt in feed** |
| Material | `material` | ✓ |
| Fahrzeug-Kompatibilität (K-Typ) | eBay-direct (2 discs) | ⚠ zie §2 — opschalen |

**Conclusie:** de dure/onderscheidende velden (maten, Bremssystem, Lochzahl, Links/Rechts) zijn precies wat Cassini gebruikt voor filters — en precies wat nu ontbreekt. Twee ervan (**Bremssystem, Höhe**) bestaan nog niet als feed-veld en moeten erbij.

---

## 4. GPSR-status (harde wet sinds 19-02-2026, ProdSG)

Art. 19 GPSR eist **4 blokken per listing**: (1) fabrikant + contact, (2) EU-verantwoordelijke bij niet-EU-maker, (3) product-identificatoren (modelnr + beeld), (4) veiligheids-/waarschuwingsinfo. eBay laat je dit **één keer** centraal zetten en op alle listings toepassen.

- **(1)+(2)** ✓ afgedekt: `gpsr_manufacturer_name` = Tinbergenlaan 7, 3401 MT IJsselstein. A.B.S. is EU-maker (NL) → verantwoordelijke = jullie. Sinds ProdSG mag merk- óf firmanaam.
- **(3)** ✓ sku/ean/beeld — behalve `additional_imagelinks` leeg op 2.722 items.
- **(4)** ⚠ **`material_safe_data_sheet` leeg op 32.202 items** (mandatory-flag). Voor remdelen: veiligheids-/inbouwwaarschuwing (paarweise ersetzen, Fachwerkstatt, Bremsstaub) hoort in het GPSR-veiligheidsveld, niet alleen in de omschrijving. Dit is je grootste compliance-gat en het snelst te dichten met één master-regel (zie §5, stap 3).

---

## 5. Snelste weg naar 100% schoon op ALLE listings (volgorde = prioriteit)

1. **Categoriseer de laatste 5.645 items** (21,9%). Ongecategoriseerde SKU's krijgen géén categorie-specifics — dit blokkeert 100% aan de bron. Corrigeer de resterende `art_grp_code`-mappings in master `Categories_clean` (315886).
2. **Rol de item-specific mapping uit van 3 → alle 21 categorieën** in eBay Build → Attributes. Dit is bulk-config, één keer, met bestaande velden — grootste completeness-sprong voor de minste moeite.
3. **Dicht de 2 mandatory-gaten met master-regels:**
   - `material_safe_data_sheet` → vul met een standaard veiligheids-/GPSR-tekst per productgroep (master "Product safety component" 326214 / "DE compliance" 331271 breiden uit).
   - `additional_imagelinks` → bron-zijdig vullen of split-regel her-activeren ("Split additional image links" staat nu paused).
4. **Voeg de 3 ontbrekende feed-velden toe via de "Extra specs" Google Sheet** (import 834217) — snelste route, geen Magento-dev: `bremssystem`, `hoehe`, en een expliciet `links_rechts`. Key op `sku`.
5. **Genereer de volledige K-Typ-lijst** met de `ebay-ktype-compat` skill voor alle live SKU's (Optie A, §2) i.p.v. 2 discs.
6. **Breid daarna pas de SKU Filter uit** (jouw kostenrem-beslissing). Zet SKU's pas live als hun data 100% is — anders betaal je €0,04/listing voor onvolledige listings.

---

## 6. Concrete Channable-wijzigingen (per kanaal, self-contained)

Regels op **kanaal-niveau** onder eBay (rules-channel 1400294), gegate op categorie. Bewerk **geen** gedeelde master die ook Bol/Amazon voedt (principe uit `channable-templates`). Guardrails: nooit aan **SKU selectie** (27858166), nooit **Uitvoeren** — alleen **Regel opslaan**.

**A. Maten-specifics (Bremsscheibe), gate `categories_clean` bevat `remschijven`:**
- Außendurchmesser ← `buitendiameter` · Bremsscheibendicke ← `remschijfdikte` · Mindestdicke ← `minimale_dikte` · Lochzahl/Lochkreis ← `bolt_pattern` · Nabenbohrung ← `centreringdiameter` · Bremsscheibenart ← `remschijftype_de`.

**B. Einbauposition Links/Rechts** — breid de bestaande `einbauposition_de`-regel uit zodat naast as (`vooras_achteras_duits`) ook Links/Rechts wordt gezet, voor de positie-relevante categorieën (Remklauwen, Draagarmen, Spoorstangeind, Wielremcilinder, Wielsnelheidssensor).

**C. OE/Vergleichsnummer** — rol de bestaande `oe_list` → Referenznummer/Vergleichsnummer-mapping uit naar alle 21 categorieën (nu 3). Meerdere OE-nummers komma-gescheiden; nooit in de omschrijving proppen.

**D. Bremssystem/Höhe** — pas beschikbaar nadat §5-stap 4 de velden heeft toegevoegd; dan mappen als extra Artikelmerkmal.

**E. Compatibiliteit-veld** — expliciet **leeg laten** in het eBay-kanaal zolang je Optie A rijdt (§2).

---

## 7. Relevante skills (inzetten, niet opnieuw uitvinden)

- **`ebay-ktype-compat`** — genereer de volledige Fahrzeugverwendungsliste (script aanwezig) uit de ABS TecDoc KType-export. Voor §5-stap 5.
- **`channable-templates`** — exacte Claude-in-Chrome bouwprompts per categorie/kanaal voor de regels in §6 (self-contained, guardrails ingebakken).
- **`/channable-audit`** (nieuw) — read-only volledige snapshot + attribute-coverage % per kanaal, als 0-meting vóór en na deze wijzigingen.
- **`concurrentie-radar` / `ccp-concurrentie-radar`** — periodieke eBay.de-benchmark om item-specific pariteit met febi/ATE/TEXTAR te bewaken.

---

## 8. Nog live te bevestigen (heeft ingelogde app.channable.com-tab nodig)

1. eBay-kanaal-ID: docs noemen 152339 (07-07) én 159122 (08-07) — bevestig via `GET /channels` welke actueel is.
2. Bestaat het compatibiliteit-veld in het eBay-kanaal en is het echt ongemapt? (bevestigt §2 nul-risico).
3. Exacte namen `bolt_pattern` / eventuele `links_rechts` in de veldkiezer.
4. Of de K-Typ direct-upload werkelijk alleen 16880/18537 dekt, of breder (verkoperportaal).

**Volgende stap:** open een ingelogde Channable-tab en zeg "run de audit" → ik draai `/channable-audit --channel ebay-de`, bevestig §8 live, en lever daarna de kant-en-klare bouwprompts per categorie uit §6.

---

## 9. LIVE UI-verificatie — eBay Build (2026-07-24)

Read-only via Channable UI (Browser 1, ingelogd als Hans). Niets gewijzigd, geen "Uitvoeren"/"Run now", SKU selectie onaangeroerd.

**§8-vragen beantwoord:**
1. **eBay-kanaal-ID = 159122** (API-kanaal, URL `/apis/159122/build`). De 152339 uit oudere docs is achterhaald — 159122 is actueel.
2. **Compatibiliteit/Fahrzeugverwendungsliste is NIET gemapt in Channable.** In eBay → Build → *Attributes per category* bestaat geen K-Typ/Fahrzeug-fitment-veld — alleen "Universelle Kompatibilität" (ja/nee-vlag, niet de voertuiglijst). → **Bevestigt het nul-overschrijf-risico**: je directe eBay K-Type-upload is veilig; een Channable-sync raakt de fitment niet. Optie A (§2) staat.

**Per-categorie attribuut-mapping (eBay Build → Attributes per category):**

| eBay-categorie | Required attrs | Items |
|---|---|---|
| Bremsbeläge (57357) | ✓ alle required gemapt | 104 |
| Bremsscheiben (33564) | ✓ alle required gemapt | 100 |
| Bremssättel & -halterungen | ✓ alle required gemapt | 17 |
| Sonstige | ✓ alle required gemapt | 8 |

Alleen deze **4 rem-categorieën** hebben eBay-attribuutmapping. De overige ~17 CCP-categorieën (Draagarmen, Spoorstangeind, Wielsnelheidssensor …) staan hier **niet** → nog geen item-specifics op eBay. (De 20 titel/omschrijving-regels bestaan wél; attribuutmapping is een aparte laag.)

**Reconcile-punt:** de Items-tellingen (104/100/17/8 = **229**) zijn hoger dan de "4 test-SKU's" uit de 08-07 status. Óf de SKU Filter is verruimd, óf deze telling staat vóór de SKU-filter. Live bevestigen.

**Bremsscheiben — volledige eBay-attribuutlijst (33564) = je 100%-checklist:**
Hersteller · Herstellernummer · Produktart · Einbauposition · Oe/Oem Referenznummer(n) · Vergleichsnummer · Material · Bremsscheibenart · Bremsscheiben-Aussendurchmesser · Mindestdicke · Stärke · Lochkreis · Höhe · Länge · Oberflächenbeschaffenheit · Besonderheiten · Herstellergarantie · Im Lieferumfang Enthalten · Oldtimer-Teil · Tuning-/Styling-Teil · Universelle Kompatibilität · Ursprungsland.

De **required** hiervan zijn gemapt. De **booster-optionals** naar 100%, gemapt op je feed-velden: Bremsscheiben-Aussendurchmesser ← `buitendiameter` · Stärke ← `remschijfdikte` · Mindestdicke ← `minimale_dikte` · Lochkreis ← `bolt_pattern` · Bremsscheibenart ← `remschijftype_de` · Höhe/Länge/Oberflächenbeschaffenheit ← **nieuw feed-veld nodig**.

**Wat de UI-sessie niet gaf:** de gemapte wáárden per attribuut bleven op "Loading" (de SPA laadt ze via XHR die in de automatiserings-context stokt). Welke optionals exact leeg zijn → één blik op je eigen scherm op de Build-pagina, of de API-route (JSON, geen render nodig).

---

## 10. Definitieve fill-status (Preview-output, 229 items, 2026-07-24)

De "Loading" uit §9 was render-timing; een screenshot + de **Preview** (de echte output naar eBay) gaven de harde waarden. Preview toont **229 items, allemaal groen (geen export-errors)**.

**Mapping-laag (Build → Bremsscheiben 33564):** alle 22 Artikelmerkmale gemapt op een feed-veld **behalve Vergleichsnummer = leeg**. ⚠ Let op: enkele disc-attributen wijzen naar `ebay_de_bremsbelage_*`-velden (remblokken): Besonderheiten, Einbauposition, Im Lieferumfang, Oe/Oem — controleren of die op discs wel data bevatten (anders komt de output leeg ondanks "gemapt").

**Output-laag (Preview) — GEVULD ✓ op alle 229:**
Category ID · EAN (ID + Item group ID) · ID type=EAN · Condition=New · Currency=EUR · Description · Dispatch time=2 · EU responsible person (List) · Images (List 3-4) · Location · Manufacturer info (Company **A.B.S. All Brake Systems B.V.**, City IJsselstein, Country NL, Email info@abs-bv.nl, Phone, Postal 3401 MT, State Utrecht, Street Tinbergenlaan 7) · Payment/Return/Shipping-profielen · Price · Stock · Title · Shipping weight · VAT 19%.

**Output-laag — LEEG / NIET GEMAPT ✗ (de echte gaten):**
- **compatibility_k_type = Empty** én **compatibility_description = Empty** (alle rijen). Het eBay-kanaal HEEFT dus wél compatibility-outputkolommen, maar ze gaan **leeg** mee. → Fitment loopt niet via Channable (bevestigt je directe-upload aanpak). **Maar:** omdat de kolom bestaat en leeg meegaat, verifieer of een "Run now" een lege compatibility naar eBay pusht (kan je handmatige K-Types theoretisch legen). Zolang je niet op "Run now" klikt gebeurt er niets; **test op 1 SKU vóór elke bulk-push**.
- **Product safety component = Unmapped** · **Product safety pictogram code = Empty** · **Product safety statement code = Empty** → **GPSR-blok 4 (veiligheidswaarschuwing/pictogram) wordt NIET meegestuurd**. Dit is het `material_safe_data_sheet`-gat uit §1/§4, nu bevestigd op outputniveau. Fabrikant + EU-verantwoordelijke (blok 1-3) staan wél 100% goed.
- Original Retail Price = Unmapped (strike-through prijs, optioneel) · Storefront category ID/naam leeg (optioneel) · Condition description / Variant images / image_variation_attribute leeg (optioneel).

**Niet als Preview-kolom zichtbaar:** de categorie-specifieke maten (Aussendurchmesser, Lochkreis, Mindestdicke, Stärke, Höhe, Einbauposition) staan niet als losse Preview-kolom — ze gaan als eBay item-specific mee. Óf ze per SKU écht data bevatten, bevestig je met "Select columns" in Preview of de **"Download as CSV"**-export.

**Netto-verdict:** identiteit, prijs, verzending, GPSR-fabrikantblok en beeld zijn **100% gevuld op alle 229**. De echte to-do's naar 100% clean: (1) **GPSR-veiligheidsblok** (Product safety component) mappen — hoogste prioriteit, compliance; (2) **Vergleichsnummer** vullen; (3) **fitment**: bevestig non-overwrite bij "Run now"; (4) **maten per-SKU** bevestigen via CSV-export; (5) de `bremsbelage_*`-mappings op de disc-categorie checken.

---

## 11. Product safety-bestanden + maten-status (2026-07-24)

**Safety-bestanden — antwoord op de vraag:** er zijn **geen aparte "Product safety component"-databestanden** in de vault of ccp-ebay-de (geen MSDS/Sicherheitsdatenblatt/pictogram-tabel; PDF/CSV/XLSX-scan leeg). Wat wél bestaat en geverifieerd is: het **GPSR-fabrikant/EU-rep-adresblok** (A.B.S. All Brake Systems B.V. · Tinbergenlaan 7 · 3401 MT IJsselstein · info@abs-bv.nl · +31 30 686 1200) — `wiki/sources/2026-07-07-ccp-gpsr-address-correction.md`. Dat blok staat **100% goed** in de eBay-output (§10).

Ontbrekend = **GPSR-blok 4** (veiligheidswaarschuwing/pictogram/statement). Géén bronbestand ervoor. **Maar** er is wél een Channable master-groep **"Product safety component" (326214, 3 rules)** — die logica bestaat dus al, maar bereikt de eBay-output niet (Preview: `Product safety component = Unmapped`). **Snelste fix = die bestaande master-groep koppelen aan het eBay safety-attribuut** (of pictogram/statement-waarden kiezen; voor remdelen meestal "geen pictogram van toepassing" + een fabrikant-veiligheidsstatement). Geen nieuw bestand van jou nodig — tenzij je echte safety-sheet-content wilt toevoegen.

**Maten per-SKU — status + methode (gecorrigeerd 24-07):** de eBay-**Preview kan de maten niet als kolom tonen** — dat is structureel, niet een browserfout: de "Column options"-dialoog (Select columns) biedt alleen de ~49 platte output-kolommen; de maten (Aussendurchmesser, Lochkreis, Mindestdicke, Stärke, Höhe, Einbauposition) zijn **per-categorie item-specifics** en verschijnen daar niet. Bekend: op SKU 16880 zijn `buitendiameter / remschijfdikte / minimale_dikte / centreringdiameter` gevuld (07-07) en in Build gemapt → **pipeline werkt**; open vraag = dekking over alle 100 discs. **Correcte verificatie-route:** (a) **Items** → kolommen `buitendiameter/remschijfdikte/minimale_dikte/centreringdiameter` toevoegen → filter categorie Remschijven → scan op leeg; óf (b) per categorie **Build → Attributes per category → "View in Preview"**.

**Status 24-07:** poging via Items-view mislukt — die pagina (32.622 items) **bevriest de renderer** (CDP-timeout 45s). Omgevingslimiet, geen dataconclusie. Bekend blijft: gemapt + 16880 gevuld → pijplijn werkt. **Snelste dekkingscheck zonder de zware UI:** Items → filter Remschijven → **Download as CSV** met de 4 maat-kolommen, óf herhalen bij een verse/lichte browsersessie. **Bron voor backfill:** de RAI/TecDoc-dataset (§12) bevat álle maten — ontbrekende feed-waarden zijn daaruit aan te vullen.

---

## 12. Product-safety-assets + GPSR-strategie (2026-07-24, bestanden aangeleverd)

Bewaard in `_cowork/ccp-ebay-de/compliance/`. Vier assets:

| Asset | Wat | Geldt voor | eBay-relevantie |
|---|---|---|---|
| `ABS-MSDS-092025.zip` | 7 chemie-SDS × 27 talen: Bremsflüssigkeit DOT 3/4/4 LV/5.1, Bremsenreiniger, Ceramic Anti-Seize 7512/7521 | **alleen chemie-SKU's** | `material_safe_data_sheet` + GHS-pictogram/-statement — maar chemie zit (nog) niet in de 229 |
| `ABS-Matching-Quality-BER461-2026.pdf` | "Matching quality spare parts" onder Verordnung (EG) 461/2010 | alle A.B.S.-onderdelen | sterk trust-signaal in Besonderheiten/omschrijving (geldig 2026) |
| `ABS-ISO9001-2023-2026.pdf` | ISO 9001:2015 (LRQA, approval 00009185, scope rem/stuur/ophanging + wiellagers) | bedrijf | trust-signaal — ⚠ **vervaldatum 11-03-2026 = verlopen, eerst vernieuwen** |
| `ABS-RAI-TecDoc-dataset.zip` | Volledige A.B.S. RAI/TecDoc-data per artikelgroep (.200 Remschijven, .100 Remblokken, .651 Remtangen…) incl. artikelcriteria | alle onderdelen | **autoritatieve bron** voor maten/OE/KType — backfill van elk leeg feed-veld |

**Kerncorrectie op §1/§4:** het `material_safe_data_sheet`-gat op 32.202 items is grotendeels een **false-positive**. Metalen remschijven/-blokken/-sättel zijn **artikelen** (REACH: geen stof/gemisch) en hebben **geen SDS nodig**. De MSDS gelden uitsluitend voor de **chemie-SKU's**. Voor de huidige 229 (allemaal metaal) is GPSR compleet met: fabrikantblok (staat 100%) + **veiligheidsstatement** (nog te mappen) — géén SDS.

**GPSR-fix (uitgewerkt in `PROMPT-eBayDE-GPSR-safety-mapping-2026-07-24.md`):**
- **Metaal (default, incl. alle 229):** `Product safety statement` = montage-/veiligheidswaarschuwing DE; `material_safe_data_sheet` = leeg (correct); geen pictogram. Bouwen in master **326214** (voedt ook Bol/Amazon) → mappen in eBay-Build.
- **Chemie (indien gelist):** `material_safe_data_sheet` = **gehoste** MSDS-URL (DE) + GHS-pictogram/-statement uit de SDS. **Blokker:** MSDS moeten eerst op een URL gehost (site/CDN) — PDF-upload volstaat niet voor de feed.
- **Trust-verrijking:** "Matching-Quality-Ersatzteil gemäß EG 461/2010" (nu bruikbaar) + "ISO 9001" (**pas ná cert-vernieuwing**).

---

## 13. RAI-dataset als import — analyse + wat het wél/niet kan (2026-07-24)

**Gedecodeerd:** alle 32 bestanden = type **RAIART** (artikel-master). Parser → `ABS-RAIART-articles-prices-2026-07-24.csv`: **43.199 artikelen** met `article_number`, `list_price_eur` (afgeleid, cent/100), `price_group`, `group_description`, `source_file`. Sanity: 16880 = €54,80 (matcht eBay-Preview), 18537 = €89,40.

**Wat RAIART bevat:** artikelnummer · lijst/catalogusprijs · prijsgroep · artikelgroep (Remschijven ABS/Brembo, Remblokken, Remtangen, Draagarmen, Wiellagersets, ABS-sensoren …).

**Wat RAIART NIET bevat (beslissend):** **geen maten, geen OE/OEM, geen EAN-per-artikel, geen KType.** Die horen in aparte RAI-bestandstypen (criteria/referentie/KType) of een TecDoc-export — niet in deze zip.

**Conclusie optie 3:** deze bestanden kunnen **maten/OE/KType niet vullen**. Wél bruikbaar als **prijs-/catalogus-referentie-import** (43k artikelen + lijstprijs → margecheck, detecteert SKU's die in Magento ontbreken). Kanttekening: prijs is lijst/bruto (16880 matcht eBay 54,80, maar 37477 = RAIART 46,00 vs eBay 25,00 → verkoopprijzen worden apart gezet); dedup nodig (bv. 18730 komt 2× voor).

**CORRECTIE (Hans, 24-07) — de data is er al, niet opvragen bij A.B.S.:**
Maten/OE/OEM/KType zitten al in de **gekoppelde Channable-imports** (Magento + "Extra specs") en Hans heeft de **KType-linkage los** als apart bestand. Bewijs uit deze sessie:
- Items-kolommen bevatten `Oe list`, `Oe references`, `Art code`, `Ebay de bremsbelage oe oem referenznummern`.
- eBay-Build Bremsscheiben mapt naar echte feed-velden `ebay_de_bremsscheiben_aussendurchmesser/lochkreis/mindestdicke/starke/hohe` (kan niet mappen naar niet-bestaande velden).
- 16880 output = maten + OE gevuld. KType-linkage-format bestaat (`ebay-compat-...csv`).
De RAIART-zip is dus **puur artikel+prijs** en NIET nodig voor maten/OE/KType. Mijn eerdere "opvragen bij A.B.S." was een denkfout — teruggetrokken.

**Het echte gat naar 100% = de MAPPING-laag, niet de data:**
1. eBay item-specifics staan pas op **4 rem-categorieën** → uitrollen naar alle live categorieën.
2. **Vergleichsnummer** ongemapt → koppelen aan `oe_list` / `oe_references`.
3. **Mis-mapping (waarschijnlijk de kern):** meerdere Bremsscheiben-attributen wijzen naar `ebay_de_bremsbelage_*` (remblokken-velden) i.p.v. de schijf-/generieke velden → dáárom komt output leeg terwijl de data bestaat. Repoint naar `oe_list` / `ebay_de_bremsscheiben_*`.
4. **GPSR-safety** wiren (§12, bouwprompt klaar).
5. **KType**: volledige linkage toepassen op álle discs i.p.v. 2 (via `ebay-ktype-compat`).

**RAIART-zip = wél bruikbaar** als prijs-/catalogus-referentie (43k artikelen), niet voor specs.

---

## 14. Mis-map LIVE BEVESTIGD + KType-linkage binnen (2026-07-24)

**Live in eBay-Build (Bremsscheiben 33564) bevestigd** — 4 attributen op de remschijf-categorie pullen uit **remblokken-velden** (`ebay_de_bremsbelage_*`) → leeg op discs terwijl de data in `oe_list`/`vooras_achteras_duits` staat:
- Oe/Oem Referenznummer → `ebay_de_bremsbelage_oe_oem_referenznummern` → **moet `oe_list`**
- Einbauposition → `ebay_de_bremsbelage_einbauposition` → **moet `vooras_achteras_duits`**
- Besonderheiten → `ebay_de_bremsbelage_besonderheiten`
- Im Lieferumfang → `ebay_de_bremsbelage_im_lieferumfang`
- Vergleichsnummer → leeg → **moet `oe_list`/`oe_references`**
Te checken: Lochkreis/Länge leken verwisseld (renderde niet volledig). **Dit is "wat miste": geen data-gat, een mapping-fout.** Correctie-bouwprompt: `PROMPT-eBayDE-mismap-correctie-2026-07-24.md`. Waarschijnlijk dezelfde copy-paste-fout op de 3 andere live categorieën → meenemen.

**KType-linkage ontvangen:** `1784898520377_20260721_KTypes.csv` — kolommen `sku;ktype;einbauposition`, **1.048.576 regels (= Excel-max, mogelijk afgekapt → coverage-check nodig)**. Volledige catalogus-linkage; voedt de `ebay-ktype-compat` skill om fitment op álle discs te bouwen i.p.v. 2.

---

## 15. LIVE eBay-listings gecheckt (2026-07-24, web) — hebben de discs al KType?

Twee handmatig-gedane discs vergeleken (bron: live eBay.de, seller **connectcarparts**):

| | 16880 (item 257626217845) | 18537 (item 257624435711) |
|---|---|---|
| Status | **BEËINDIGD** 22-07 ("nicht mehr verfügbar") | **LIVE** (>10 verfügbar) |
| KType / Kompatibilität | **JA — 425 Fahrzeuge** (tabel, "von connectcarparts") | **NEE** — geen compat-tabel, alleen "Prüfen Sie die Artikelbeschreibung" |
| OE/OEM Referenznummer | **leeg** | **gevuld** (000 423 18 12, A0004231812…) |
| Einbauposition | **ontbreekt** | **Hinterachse** ✓ |
| Oberflächenbeschaffenheit | ontbreekt | Beschichtet ✓ |
| Maten (Ø/Höhe/Stärke/Mindestdicke) | gevuld | gevuld |
| GPSR-fabrikantblok | ✓ | ✓ |

**Antwoord op de vraag:** de discs hebben **niet consistent** KType. 16880 heeft het (maar die listing is beëindigd), 18537 (live) heeft het NIET. De overige discs vrijwel zeker ook niet (Channable stuurt compatibility leeg, §10). → **De volledige KType-linkage bouwen is nodig — geen dubbel werk.** Eerst uitzoeken waarom 18537's handmatige upload niet plakte (compat-CSV was 21-07; 18537 laatst bijgewerkt 20-07 → upload raakte 18537 mogelijk niet).

**Nuance op de mis-map (ik corrigeer mezelf op bewijs):** 18537 (bijgewerkt 20-07) toont OE + Einbauposition wél gevuld; 16880 (bijgewerkt 21-07) niet. Meest waarschijnlijke verklaring: de mis-map naar `ebay_de_bremsbelage_*` is een **recente regressie** — listings die ná de fout opnieuw gepusht zijn (16880) verliezen OE/Einbauposition; die van ervóór (18537) tonen nog de oude goede data. Dat versterkt de urgentie: elke nieuwe push leegt stil OE/Einbauposition. Fix = repointen (PROMPT-mismap) + re-push → OE/positie terug op álle discs. (Tijdlijn afgeleid uit "zuletzt aktualisiert"-datums, niet hard bevestigd.)

**Extra signalen:** 16880 beëindigd wegens "nicht mehr verfügbar" (voorraad of Channable? — checken). Store: "7 Artikel verkauft", nog geen reviews (vroege fase). ECE-R90 staat in de shop-omschrijving (niet per listing als item-specific → kans: als Besonderheiten toevoegen). Ursprungsland = China op beide.

---

## 16. Volledigheid vs concurrent — geverifieerd (2026-07-24, web)

Benchmark: **TEXTAR PRO Bremsscheibe** (seller Koberger-Hamburg, 99,6% positief, 26.605 verkocht, sinds 2021) vs CCP's meest complete disc-listing (18537).

**Antwoord: nee, de listings zijn NIET volledig t.o.v. concurrenten.** Twee lagen:

**(a) Mis-map (bekend):** OE/OEM-Referenznummer + Einbauposition leeg op discs die ná de regressie gepusht zijn.

**(b) Structureel missende item-specifics** — de concurrent vult ze, CCP niet (ook op de complete listings):

| eBay-attribuut (concurrent vult) | CCP | feed-veld voor de fix |
|---|---|---|
| Bohrbild/Lochzahl (bv. 05/05) | ✗ | `bolt_pattern` (aanwezig) |
| Lochkreis-Ø [mm] (bv. 116) | ✗ | uit TecDoc-criteria (feed) |
| Innendurchmesser [mm] | ✗ | idem |
| Zentrierungsdurchmesser [mm] | ✗ op listing | `centreringdiameter` (aanwezig) |
| Radbolzenbohrung-Ø [mm] | ✗ | TecDoc-criteria |
| Gewicht [kg] | ✗ | verzendgewicht (aanwezig) |
| Vergleichsnummer | ✗ (leeg) | `oe_list`/`oe_references` |
| Ergänzungsartikel / Verpackungsmaße | ✗ | nice-to-have |

Lochzahl/Lochkreis en Innendurchmesser zijn juist **Cassini-filtervelden** — kopers filteren erop; ontbreekt = uit de zoekfilter. De data bestaat (ATP/TecDoc bevestigt voor 18117: Ø272, 5-gaats, boring 65) — puur niet gemapt.

**CCP heeft wél goed:** Ø, Höhe, Dicke/Stärke, Mindestdicke, Bremsscheibenart, Oberfläche, Hersteller, EAN, GPSR-fabrikantblok, en (op complete listings) Einbauposition + OE.

**Trust-gat:** concurrent 26.605 verkocht / 99,6% / sinds 2021; CCP 7 verkocht, geen reviews. CCP's wapen = **prijs** (A.B.S. matching-quality €40-90 vs TEXTAR €144) — maar zichtbaarheid (Promoted Listings) + volledige specs zijn nodig om te ranken en converteren.

**Conclusie:** volledigheid vergt (1) de mis-map-repoint én (2) het mappen van Lochzahl/Lochkreis/Innendurchmesser/Zentrierung/Gewicht/Vergleichsnummer in de eBay-Build. Beide uit bestaande feed-data — geen nieuwe data nodig.

**Import-opzet RAIART-prijsreferentie (optioneel, nu direct mogelijk):** CSV → Google Sheet → Channable **Add import → Google Spreadsheet** → key op `article_number` → master-rule `list_price_ref` (read-only referentie; verkoopprijs NIET overschrijven).
