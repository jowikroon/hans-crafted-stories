---
type: implementatieplan + live audit
scope: CCP · eBay DE · native Magento bundles via Channable (project 314525 / kanaal 159122)
status: plan · Magento-kant live geverifieerd via REST · Channable-kant uit vault + extern rapport
created: 2026-08-21
last_reviewed: 2026-08-21
bron: live Magento REST (connectcarparts.nl, token uit cms_secrets) · Supabase v_sku_marge (kskumhtisifsdjjbzvbo) · extern onderzoeksrapport 21-08 · BUNDLES-remschijven-ebayDE-2026-08-20 · PREVIEW-DIAGNOSE-2026-08-20 · Magmodules-mail 06/07-08 · Channable-mail 03/10-08
methode-tier: 1 voor Magento (live uitgelezen) · 2 voor Channable (vendor-UI, niet live geverifieerd deze sessie)
---

# Bundels veilig implementeren op eBay DE

**De vier bundels die het rapport nog als toekomstplan beschrijft, bestaan al in Magento. Eén ervan staat enabled. En het margemodel rekent één inkoopprijs tegen een paarverkoopprijs, waardoor bundels die "Gezond" heten in werkelijkheid verlies draaien.**

Dit plan corrigeert het externe rapport op drie punten, legt vier blokkers vast die eerst dicht moeten, en zet daarna de uitvoering in zeven fasen met een gate per fase.

---

## 1 · Wat ik live heb geverifieerd

Magento REST is sinds vandaag bereikbaar (`magento_token` uit `cms_secrets` plus een browser-User-Agent). Daarmee is voor het eerst gemeten in plaats van aangenomen.

### 1.1 De integer-cast is echt en de gevolgen zijn erger dan "een ander product"

Het rapport stelt dat entity 18722 naar SKU 422292 wijst en SKU 18722 naar entity 5270. Live bevestigd:

| Sleutel | Resolveert naar | Product |
|---|---|---|
| SKU `18722` | entity **5270** | ABS 18722 Remschijf Vooras AUDI/VW 375mm geventileerd |
| entity `18722` | SKU **422292** | ABS 422292 Remklauw Achteras Rechts MERCEDES C-Serie |

Een remklauw in plaats van een remschijf. Andere categorie, ander gewicht, andere prijs. Bij een stille verkeerde levering merkt de klant het meteen en eBay ook.

### 1.2 Er staan al vier bundels in de catalogus

Niet in de vault vastgelegd, wel live aanwezig:

| SKU | entity | status | zichtbaarheid | prijs | contract-conform? |
|---|---|---|---|---|---|
| `18722-SET2` | 42225 | **enabled** | Not Visible Individually | € 113,41 | **ja** — fixed, 1 required select, child `18722` qty 2, default |
| `16880-SET2` | 42227 | disabled | Catalog, Search | € 53,90 | **ja** — zelfde vorm, child `16880` qty 2 |
| `16880-SET` | 42226 | disabled | Not Visible Individually | € 53,90 | **nee** — 0 opties, lege bundel, duplicaat van SET2 |
| `36623/1 en 16883` | 41928 | disabled | Catalog, Search | € 85,00 | **nee** — optie is `checkbox`, `required=false`, 5 selecties |

Twee opmerkingen bij de laatste: een niet-verplichte checkbox-optie met vijf selecties is precies wat Magmodules' orderimport niet deterministisch kan oplossen, en de naam noemt `16883` terwijl het child `16683` is. Bovendien mengt hij remblokken en remschijven — dat botst met de merkzuiverheid-eis uit het GPSR-dossier.

**`18722-SET2` staat enabled en heet "TEST ...".** Zodra hij in een feed belandt kan hij naar een marketplace. Dat is de eerste actie hieronder.

### 1.3 Het margemodel telt één inkoopprijs tegen een paarprijs

`v_sku_marge` rekent `verkoopprijs_bruto` (de live eBay-prijs) tegen één keer `inkoopprijs`. Maar de live listings zijn al paarlistings — het ordervoorbeeld uit de Channable Orders API heet letterlijk *"ABS 18536 2x Bremsscheibe"*. De echte kostprijs is dus tweemaal de inkoop.

| SKU | inkoop/stuk | verkoop bruto | marge in model | marge met 2 stuks inkoop |
|---|---:|---:|---:|---:|
| `16880` | € 9,85 | € 54,80 | € 12,88 · Gezond | **€ 3,03** |
| `18722` | € 32,22 | € 113,41 | € 21,02 · Gezond | **−€ 11,20** |
| `18536` | € 21,12 | € 57,46 | € 3,20 · Laag | **−€ 17,92** |

Aanname: de listing is werkelijk een paar en alle overige kosten blijven gelijk. Onder die aanname draaien twee van deze drie SKU's verlies, en staat er "Gezond" bij.

Dit raakt niet alleen bundels. Het raakt elke prijs- en selectiebeslissing die op dit model leunt, inclusief de tranche-indeling voor de uitrol.

### 1.4 Twee prijsconventies door elkaar

`16880` staat in Magento op € 26,95 per stuk met `qty_increments = 2`; de bundel op € 53,90 is exact tweemaal die prijs. Klopt.

`18722` staat in Magento op € 113,41 met `qty_increments = 0` en `min_sale_qty = 1` — en dat is exact de eBay-prijs. De losse SKU draagt dus de paarprijs. Dat is de MOQ-regressie uit de meting van 12-08, nu ook zichtbaar in de prijs en niet alleen in het minimum. De webshop verkoopt daar één schijf voor de prijs van twee.

Vóór er één bundel live gaat moet per pilot-SKU vaststaan welke conventie geldt. Anders halveer of verdubbel je prijzen zonder het te zien.

---

## 2 · Waar het externe rapport klopt, en waar niet

**Klopt en is bruikbaar:** de acht-stappen adoptiestrategie, de Verify-only dry-run als kern van de risicomitigatie, het isolatiefilter tegen de verkooplimiet, de eis dat Unique ID en Item Group ID gelijk zijn voor non-variant listings, en de diagnose van de integer-cast.

**Drie correcties:**

**a) De dubbele deling.** Het rapport stelt voor om in de Channable-regels de voorraad te delen door 2 met een floor. Dat is juist voor een simple-SKU-route, maar wij kiezen de bundelroute. Met `Enable Bundle Stock Calculation = Yes` rekent Magento de bundelvoorraad al uit als de laagste childvoorraad gedeeld door de selection qty. Doe je het daarna nog eens in Channable, dan krijg je floor(floor(15/2)/2) = 3 in plaats van 7. **Kies één laag. Wij kiezen Magento.**

**b) "Early return guards in versie 1.24".** Onze bron is de Magmodules-mail van 6 augustus: de integer-cast is bevestigd defect en niet gefixt, en er is sindsdien geen terugkoppeling van hun dev-team gekomen. Behandel de claim uit het rapport als onbevestigd. De mitigatie die wél bestaat is de externe guard van Manus — en die moet in enforce-modus staan vóór een bundel live gaat, want een nieuwe bundel betekent nieuwe entity ID's en dus een opnieuw op te bouwen mapping.

**c) De drie geslaagde items.** Het rapport concludeert dat het duplicaten zijn. Waarschijnlijk juist, maar niet bewezen, en onze eigen preview-diagnose van 20-08 wijst de andere kant op: alle 1.132 A.B.S.-items kregen `CHANNABLE_GENERATE_ERROR "Item ignored, on eBay but not sent through this API"`, wat aantoont dat kanaal 159122 de bestaande listings nooit heeft aangemaakt. Drie stuks kwamen er wél doorheen. Dat is geen theoretische vraag: als het duplicaten zijn, staan er nu dubbele listings live. **Eerst opzoeken, dan concluderen.**

---

## 3 · Vier blokkers, in deze volgorde

| # | Blokker | Waarom het eerst moet | Wie |
|---|---|---|---|
| 1 | `18722-SET2` staat enabled met "TEST" in de naam | Kan in een feed belanden en naar een marketplace gaan | CCP, vandaag |
| 2 | De drie geslaagde items zijn niet geïdentificeerd | Mogelijk live duplicaten met eigen ItemID | CCP, vandaag |
| 3 | Margemodel telt één inkoop tegen paarprijs | Elke prijs- en selectiebeslissing eronder is scheef | CCP + Supabase |
| 4 | Guard 1.2.0 blokkeert de SET2-payloadvorm niet | Een regel zonder `channel_product_id` glipt in élke modus door — precies het scenario van 4 augustus | Manus |

Blokker 4 in detail: de guard toetst de whitelist alleen op `channel_product_id`. Ontbreekt dat veld, dan wordt er gelogd en doorgelaten. Dat is exact de payloadvorm bij een leeggelopen alternative-ID-mapping, en het aanmaken van bundels is precies het moment waarop die mapping leegloopt. Zonder de twee fixes uit de review van vanochtend is de guard tijdens de bundeluitrol blind voor het enige scenario waarvoor hij bestaat.

---

## 4 · Het plan in zeven fasen

Elke fase heeft een gate. Niet door naar de volgende fase zonder dat de gate groen is.

### Fase 0 — Bloeden stoppen (vandaag, ± 1 uur)

1. Zet kanaal 159122 van **Publiceer** naar **Verify-only**. Zolang hij op publiceren staat, blijft elke run nieuwe creaties proberen en verkooplimietfouten stapelen.
2. Zoek in **Result → Successful** de eBay ItemID's van de drie geslaagde items. Open ze in het Verkäufer-Cockpit en kijk naar de aanmaakdatum en de verkoopgeschiedenis. Aanmaakdatum gelijk aan het moment van API-activatie = duplicaat; beëindig die listing.
3. Zet `18722-SET2` op **disabled** tot fase 3.

**Gate:** kanaal staat op Verify-only, de drie ItemID's zijn beoordeeld, geen enabled TEST-bundel meer.

### Fase 1 — Prijswaarheid vaststellen (½ dag)

1. Bepaal per SKU welke conventie geldt: prijs per stuk (zoals `16880`) of paarprijs op een enkelstuks-SKU (zoals `18722`). De meting van 12-08 met 80 afwijkende SKU's is het startpunt.
2. Herstel `v_sku_marge`: voeg een kolom toe voor het aantal stuks per verkochte eenheid en reken `inkoopprijs × stuks`. Zonder die correctie selecteer je de verkeerde SKU's voor de pilot.
3. Herbereken de tranches. SKU's die na correctie negatief staan gaan niet mee in de eerste tranche, of hun prijs gaat eerst omhoog.

**Gate:** voor elke pilot-SKU staat vast wat de huidige eBay-prijs representeert, en de contributiemarge is met de juiste stuksprijs positief.

### Fase 2 — Guard vóór bundels (Manus + staging)

1. Manus levert 1.2.1 met de twee fixes: whitelist toetsen op `channel_product_id` **of** `loaded_sku`, en een aparte instelling om een niet-verifieerbare regel te blokkeren. Plus `<sequence>` op `Magmodules_Channable` in `module.xml`.
2. Staging: installeren, Observe only, minimaal één echte eBay-orderdag meelezen in `var/log/connectcarparts-channable-guard.log`.
3. Daarna enforce op een whitelist van precies de pilot-SKU's.

**Gate:** guard staat op enforce voor de pilot-SKU's, en een bewust gecreëerde mismatch op een pilot-SKU wijst de order af.

### Fase 3 — Magento inrichten (½ dag)

1. Configuratie controleren en zetten: `Use Bundle Products = Only Bundle Product`, `Enable Bundle Stock Calculation = Yes`, `Bundle Products = Yes` onder *Grouped and Bundled Types Support*, stock op **Default Source / Default Stock**.
2. `16880-SET` (lege bundel) verwijderen. `36623/1 en 16883` buiten scope houden tot de enkelvoudige route staat.
3. 5 tot 10 pilotbundels bouwen naar het model van `16880-SET2`: fixed price, één required select-optie, één default selection, child qty 2, voorraad op het child, prijs = de geverifieerde paarprijs uit fase 1.
4. Zichtbaarheid bewust kiezen. `18722-SET2` staat op *Not Visible Individually*, `16880-SET2` op *Catalog, Search*. Als je later `Filter on Visibility` aanzet in de Magmodules-config valt de eerste soort uit de feed.

**Gate:** alle pilotbundels doorstaan de CLI-preflight `channable:bundle:validate <sku> --store-id=<id>` met PASS.

### Fase 4 — Channable inrichten, nog zonder publiceren (½ dag)

1. Import verversen zodat de bundels binnenkomen met `id` = Magento entity ID.
2. **Alternative ID mapping opnieuw laten opbouwen** en per pilotbundel verifiëren dat de SKU aan het juiste entity ID hangt. Controleer daarna in de order events op `Found item id based on a match on sku`.
3. **Item Group ID corrigeren.** Volgens het externe rapport staat die op `ean`; voor non-variant listings moet hij gelijk zijn aan de Unique ID, dus het SKU-veld. Dit eerst visueel verifiëren — het staat niet in onze eigen nulmeting. Het EAN-veld blijft gewoon gevuld voor GPSR en catalogusmatching.
4. **Isolatiefilter** bouwen: importeer de eBay-export van actieve listings als hulplijst en sluit alles uit wat er niet in staat. Dat houdt de verkooplimiet buiten beeld tijdens de adoptie.
5. Kanaalregels voor de bundeltranche: `C:Anzahl pro Packung = 2`, `EAN` = EAN van het child, `C:Herstellernummer` = het ABS-artikelnummer, titel met `2x` expliciet erin, en **prijs = de bundel-fixed-price uit Magento, niet ×2 in de kanaalregel**.
6. Verify-only run draaien en `Result → Errors` doorlopen op `21916270` SKU Mismatch, `21916271` No Matching SKU en `21916272` SKU in use.

**Gate:** een Verify-only run zonder fouten op de pilot-SKU's, en de mapping resolveert aantoonbaar op SKU.

### Fase 5 — SKU-wissel op de bestaande listings (½ dag)

De bestaande listings dragen het kale artikelnummer als `CustomLabel`. Channable's adoptie matcht op listing-SKU = Unique ID = Item Group ID. Zodra de bundel `<art>-SET2` heet, matcht de oude listing niet meer en maakt Channable een duplicaat naast een listing met historie.

Route A blijft de keuze: eerst een Bulk-Revise van `CustomLabel` naar `<art>-SET2` op alleen de pilot-listings, dán pas adoptie. Revise raakt het ItemID niet, dus historie en Best-Match-positie blijven. De revise-keten draait al sinds 20-08, dus dit is één extra kolom in een bestaand proces.

**Gate:** de pilot-listings dragen de nieuwe CustomLabel en zijn nog steeds actief met hun oorspronkelijke ItemID.

### Fase 6 — Adoptie en eerste publicatie

1. Adoptiescript aanvragen bij Channable Integrations, met verwijzing naar de mail van Marissa Martens van 10 augustus.
2. Uitzonderingslijst in `ccp_publish_control` bijwerken naar de nieuwe `-SET2`-SKU's.
3. Kanaal van Verify-only naar Publiceer, maar het isolatiefilter blijft staan. Verruim in batches van 5 tot 10 SKU's.
4. Na de eerste echte bundelorder controleren: parentregel qty 1, childafboeking 2, prijs gelijk aan de bundel-fixed-price, en geen guard-melding in het log.

**Gate:** één echte order end-to-end correct, inclusief voorraadafboeking van twee stuks.

### Fase 7 — Opschalen en de webshop rechtzetten

1. Tranche voor tranche verruimen, steeds met een voorraad- en prijscontrole achteraf.
2. Zodra de bundel het paargedrag draagt, `min_sale_qty` en `qty_increments` in Magento terugzetten naar 2 op de 80 SKU's uit de meting van 12-08. Dan verkoopt de webshop weer paren.
3. Vloerprijsregel activeren: inkoop × stuks plus logistiek plus eBay-commissie plus een minimale absolute marge; is de berekende prijs lager, dan optrekken naar de vloerprijs.

---

## 5 · Wat we bewust niet doen

- **Geen quantity-multiplier in de kanaallaag.** Channable heeft schriftelijk bevestigd dat die niet bestaat en niet komt. Een simple-SKU met prijs ×2 laat Magento één stuk afboeken terwijl er twee vertrekken.
- **Geen deling door 2 in Channable** zolang `Enable Bundle Stock Calculation` aan staat. Eén laag, niet twee.
- **Geen gemengde bundels** in de eerste tranche. Zodra je een schijf met een blokkenset combineert, of A.B.S. met Brembo, verlies je het EAN-argument en krijg je een GPSR-probleem met twee fabrikanten op één product.
- **Niet aan de 1.037 verborgen listings** tot de bronfix op master-regel 27809318 door eBay opnieuw is uitgescand.
- **De zes bundle-velden niet meenemen in de veldsanering.** Ze staan op de verwijderlijst omdat ze leeg zijn; ze zijn leeg omdat de bundels nog niet in de feed zitten.

---

## 6 · Open vragen en aannames

| # | Punt | Hoe opgelost |
|---|---|---|
| 1 | Staat Item Group ID werkelijk op `ean`? | Uit het externe rapport, niet in onze nulmeting. Visueel verifiëren in fase 4 vóór je iets wijzigt. |
| 2 | Zijn de drie geslaagde items duplicaten? | Niet te bepalen zonder eBay-toegang vanuit deze sessie. Fase 0, stap 2. |
| 3 | Magento-versie en Magmodules-moduleversie | 2.4.8 en 1.24.2 komen uit de config-uitlezing van 20-08 en de Magmodules-mail. REST bevestigt wel dat `Magmodules_Channable` actief is (463 modules). Versienummers blijven `[unverified]`. |
| 4 | Is de paar-aanname juist voor élke SKU? | Bewezen voor `18536` via de ordertitel en aannemelijk voor `16880` en `18722` via de prijsverhouding. Per pilot-SKU bevestigen in fase 1. |
| 5 | Verkooplimiet 21919188 | € 868.507,90 per maand; 1.660 items liepen erin. Het isolatiefilter houdt dit buiten beeld, maar bij opschalen opnieuw meten. |

Gerelateerd: `BUNDLES-remschijven-ebayDE-2026-08-20.md` · `PREVIEW-DIAGNOSE-2026-08-20.md` · `MARGEMODEL-contributiemarge-per-SKU-2026-08-20.md` · `ANTWOORD-Manus-bundleguard-1.1.0-2026-08-21.md` · `EBAY-1037-VERBORGEN-oorzaak-en-fix-2026-08-20.md`
