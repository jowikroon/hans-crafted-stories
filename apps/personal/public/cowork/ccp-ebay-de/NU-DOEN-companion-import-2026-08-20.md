---
type: actieplan
scope: CCP · Channable 314525 · kanaal eBay DE (159122)
status: klaar om uit te voeren
created: 2026-08-20
last_reviewed: 2026-08-20
bron: live REST-test tegen ccp-marketplace + live inspectie Channable Setup
---

# Waar we echt staan, en de ene stap die nu vult

## 1 · De kern in één zin

De content is af, de pijplijn werkt, maar ze zijn nooit aan elkaar geknoopt: Channable **bouwt** titels met regels terwijl er 3.442 **afgemaakte** Duitse titels en omschrijvingen in de database klaarliggen.

## 2 · Wat bewezen klaarstaat (gemeten vandaag, niet aangenomen)

`v_companion_remblokken` via REST opgehaald, 4 pagina's, gededupliceerd:

| Meting | Waarde |
|---|---|
| Rijen | **3.442** |
| A.B.S. / Brembo | 1.941 / 1.501 |
| `title_de` leeg | **0** |
| `description_de` leeg | **0** |
| `ean` leeg | **0** |
| `gpsr_name` leeg | **0** |
| Langste titel | **80 tekens** — geen enkele overschrijding |
| Prijs = 0 | 2 SKU's: `35465` (A.B.S.), `P 54 065` (Brembo) |

Voorbeelden zoals ze eruit komen:

```
A.B.S. 35001 Bremsbelagsatz hinten für AUDI SEAT VW SKODA
Brembo P 02 001 Bremsbelagsatz hinten für MASERATI JAGUAR ASTON MARTIN AUDI
```

Beide merken hebben hun eigen toon zonder dat er een regel aan te pas komt. De ISO-claim staat alleen op de 1.941 A.B.S.-omschrijvingen, nul keer op Brembo.

## 3 · Wat er in Channable tegenover staat

| Stap | Stand |
|---|---|
| Imports | 3: Hoofd (745824, beperkt het aantal producten), Magento (750543), CCP Attributen (849793) |
| Kwaliteit | Beschrijving ontbreekt op **20.945**, Titel op **16.850**, Categorie ID op **14.837** |
| Resultaat | 0 verstuurd |

De companion-feed zit er **niet** bij. Dat is het gat.

## 4 · Wat er nu gebeurt versus wat er zou moeten gebeuren

**Nu:** kanaalregel 27864233 stelt een titel samen uit `brand` + `sku` + een vaste synoniemenreeks. Dat levert `Brembo P 06 001 Bremsbelagsatz Bremsbeläge Bremsklötze Scheibenbremse` — technisch correct, maar een generieke stapel zonder voertuigen.

**Zou moeten:** `title_de` uit de companion overnemen. Dat levert `Brembo P 02 001 Bremsbelagsatz hinten für MASERATI JAGUAR ASTON MARTIN AUDI` — met positie én voertuigen, binnen 80 tekens.

Hetzelfde geldt voor de omschrijving: 626–1.306 tekens uitgeschreven Duitse copy per SKU tegenover een regel-samenstelling.

## 5 · De handeling

### 5a · Import toevoegen
`Setup → Import → Combineer imports`

- **Type:** JSON, via URL
- **Importrol:** Combineren op veld → **`sku`**
- **Naam:** `Companion remblokken (Supabase)`
- **URL:** `https://kskumhtisifsdjjbzvbo.supabase.co/rest/v1/v_companion_remblokken?select=...&order=sku&limit=1000&offset=0&apikey=<CCP_MARKETPLACE_ANON_KEY>`

De sleutel staat in `_skill/adapters/.env` onder `CCP_MARKETPLACE_ANON_KEY` en `CCP_MARKETPLACE_URL` — daar op 2026-08-20 toegevoegd. Niet in chat, niet in tickets.

### 5b · De enige echte hobbel: PostgREST geeft maximaal 1.000 rijen
Getest: `limit=5000` levert er 1.000. Het project staat op `db-max-rows = 1000`.

Twee routes:

1. **Aanbevolen — één klik.** Supabase Dashboard → Project Settings → API → **Max rows** op bijvoorbeeld 10.000. Daarna dekt één URL de volledige 3.442. Ik kan dit niet vanuit hier: `SUPABASE_MGMT_TOKEN` in de env is 25 tekens en wordt geweigerd met `JWT could not be decoded` — die moet vernieuwd.
2. **Zonder aanpassing** — vier imports met `offset=0 / 1000 / 2000 / 3000`, alle vier combineren op `sku`. Werkt, maar kost vier importslots en breekt zodra het assortiment boven 4.000 komt.

### 5c · Twee kanaalregels erbij (bovenaan de titel- en omschrijvingsregels)
```
ALS companion_title_de is niet leeg  DAN ebay_title_de        = kopieer companion_title_de
ALS companion_description_de is niet leeg DAN ebay_beschreibung_de = kopieer companion_description_de
```
De bestaande AA01-regels blijven staan als vangnet voor SKU's die niet in de companion zitten. Volgorde: companion wint, want laatste regel wint.

### 5d · Tussenoplossing die nu al klaarligt
`_cowork/ccp-ebay-de/companion-remblokken-2026-08-20.csv` — 3.442 rijen, 34 kolommen, 6,3 MB. Volledig, gededupliceerd, direct als bestand-import bruikbaar als je de URL-route wilt overslaan.

## 6 · Wat dit oplevert

3.442 items krijgen in één beweging een echte titel én omschrijving. Afgezet tegen de kwaliteitsstap: de post "Titel ontbreekt" zakt van 16.850 richting 13.400, "Beschrijving ontbreekt" van 20.945 richting 17.500 — en voor de categorie waar je Q3-doel op staat, is het gat dan dicht.

## 7 · Vondst tijdens de inspectie, apart uitzoeken

Op de Overzicht-pagina van de hoofdimport (745824) staat bij Brembo-rijen `Sku: NaN`, terwijl de veldkoppeling van diezelfde import de SKU's correct toont als `08.1365.10 / 08.1395.40 / 08.1401.30`. Bij Magento (750543) verschijnt SKU als `37 477.00` en bij CCP Attributen als `15 315.00` — getalsopmaak op een artikelnummer.

Dat wijst op een numeriek getypeerd `sku`-projectveld. Als dat klopt, verklaart het in één klap de 650 "case-sensitive" SKU-conflicten, de NaN-titels bij Brembo en de noodzaak van het `sku_clean`-lapmiddel. **Nog niet bevestigd** — de Projectvelden-pagina liep vast in de headless browser. Eerst verifiëren, dan pas aankomen: de merge-sleutel wijzigen raakt alle imports tegelijk.
