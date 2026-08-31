---
type: analyse + actieplan
scope: CCP · remschijven als paar op eBay DE · Magento bundle vs kanaallaag
status: advies · Magento-config NIET live geverifieerd deze sessie
created: 2026-08-20
last_reviewed: 2026-08-20
bron: Magmodules-thread 06-07 aug 2026 · Channable-support 03/10 aug 2026 · HUIDIGE-STAAT.md (tier 1, 20-08 06:07) · 2026-08-20-magmodules-feedomvang-en-bundels.md · ebay-revise-ALLE-1167-2026-08-20.csv
---

# Bundels voor remschijven op eBay DE — wat er moet gebeuren

**Kern: het GTIN-probleem uit de eerdere analyse is geen blokker. Jullie eigen 1.167 live remblok-listings bewijzen het al — die draaien op de artikel-EAN met `C:Anzahl pro Packung = 4`. Dezelfde constructie werkt voor een 2-schijvenbundel. De echte blokker is de SKU-wissel: die breekt de Channable-adoptie van de 118 live remschijf-listings.**

---

## 1 · Wat er schriftelijk is toegezegd

### Magmodules (Frank Tiggelman, 6 + 7 aug 2026)

| Onderwerp | Uitspraak |
|---|---|
| Experimental-status | Blijft formeel staan op M2.4.8 / module 1.24.x, **maar** "fixed price met één default selection is precies waarvoor de import is ontwikkeld en draait bij meerdere merchants in productie" |
| Randvoorwaarden | bundle op **fixed price** · elke verplichte optie een **default selection** · voorraad op de **child-producten** |
| Selection qty 2 | Wordt gerespecteerd |
| MSI | Ondersteund. Salability + reserveringen lopen via de childs. Meest geteste config = **Default Source / Default Stock** |
| Prijs (bevestigd 7 aug) | **Orderregelprijs uit Channable is altijd leidend.** Wordt als custom price op het quote item gezet; bij bundles op het parent-item met geforceerde fixed price. Childs tellen niet los mee |
| Enige correctie | btw-instelling van de module (incl./excl.) — module rekent terug naar het Channable-eindbedrag |
| Integer-cast | **Bevestigd defect, nog niet gefixt.** Import verwacht Magento entity ID in `id`, valideert niet op SKU. Onopgeloste alfanumerieke waarde → stil verkeerd product |

### Channable (Marissa Martens, 10 aug 2026)

| Onderwerp | Uitspraak |
|---|---|
| Order-multiplier (qty 1 → 2) | **Bestaat niet en staat niet op de roadmap.** Channable geeft qty 1:1 door. Moet aan de Magento-kant opgelost worden |
| Adoptie 182 bestaande listings | Kan via backend-adoptiescript van hun Integrations-team |
| Matchvoorwaarde single-variant | eBay listing-SKU moet gelijk zijn aan **zowel Unique ID als Item Group ID** in Channable |
| Default gedrag zonder adoptie | Listing wordt genegeerd + `CHANNABLE_GENERATE_ERROR` (bescherming tegen verwijderen/relisting fees) |
| Veiligheid | Testrun zonder push naar eBay vóór activering |

### Channable (Miguel Martin, 3 aug 2026) — opgelost, maar relevant
Twee verschillende Magento-connections (241541 in de import vs 240631 in de orderconnection) hadden de alternative ID mapping leeg getrokken. Foute connection verwijderd, mapping herbouwd, orders resolven weer op `Found item id based on a match on sku`. **Dit gaat opnieuw spelen zodra je nieuwe bundle-producten aanmaakt** — nieuwe entity ID's, dus mapping moet opnieuw opgebouwd zijn vóór de eerste bundelorder binnenkomt.

---

## 2 · Waarom Channable's advies en Magmodules' advies elkaar tegenspreken

Channable zegt: los de ×2 op in de Magento API-laag met een custom plugin.
Magmodules zegt: gebruik een fixed-price bundel met child qty 2.

**Magmodules' route is de juiste** en Channable's advies is achterhaald door de bundel:

- Bij een bundel is er geen multiplier nodig. eBay levert qty 1 (= 1 bundel), de bundel bevat 2 childs, Magento schrijft 2 schijven af. Klaar.
- Bij de kanaallaag-route (simple SKU, prijs ×2 in de kanaalregel) komt de order terug als qty 1 → Magento boekt 1 schijf af terwijl er 2 de deur uit gaan. Structurele voorraaddrift, plus een custom plugin die niemand onderhoudt.

Dat maakt de architectuurkeuze: **bundel, geen kanaalregel-multiplier.**

---

## 3 · De GTIN-vraag — opgelost met bewijs uit de eigen account

De eerdere analyse (`2026-08-20-magmodules-feedomvang-en-bundels.md` §3) noemde EAN de harde blokker: een Magento-bundel heeft geen fabrikants-EAN, eigen GS1-GTIN's aanschaffen.

Dat is niet nodig. Uit `ebay-revise-ALLE-1167-2026-08-20.csv` (live listings, 20 aug):

| ItemID | CustomLabel | Marke | Produktart | Anzahl pro Packung | EAN |
|---|---|---|---|---|---|
| 257637849010 | 36784 | A.B.S. | Bremsbelagsatz | **4** | 8717109048087 |
| 257637849012 | 37307 | A.B.S. | Bremsbelagsatz | **4** | 8717109253504 |
| 257637849014 | 36712 | A.B.S. | Bremsbelagsatz | **4** | 8717109045840 |

Een remblokkenset is al een multipack (4 blokken) die live draait op de **artikel-EAN** met `C:Anzahl pro Packung = 4`. eBay valideert de GTIN op checksum + merk/MPN-consistentie, niet op verpakkingseenheid. Voor een 2-schijvenbundel geldt exact dezelfde constructie:

- `EAN` = de EAN van het child-artikel (de bundel heeft één child, dus geen ambiguïteit)
- `C:Anzahl pro Packung` = **2**
- `C:Herstellernummer` = het ABS-artikelnummer van de schijf
- `C:Marke` / `C:Hersteller` = A.B.S.

EAN-vulgraad op de bron is 100% (ABS-assortiment: EAN, gewicht, MOQ, doosaantal allemaal 100%), dus er is geen datagat.

⚠ Eén nuance: dit werkt omdat de bundel **merk- en artikelzuiver** is (2× hetzelfde artikel). Zodra je gemengde sets bouwt (schijf + blokken, of A.B.S. + Brembo) valt dit argument weg en heb je wél een eigen GTIN én een GPSR-probleem. Houd de eerste tranche daarom strikt op 2× dezelfde schijf.

---

## 4 · De echte blokker: SKU-wissel breekt de adoptie

118 remschijven staan live op eBay DE. Hun `CustomLabel` (seller SKU) is nu het kale artikelnummer, bv. `36784`.

Channable's adoptiescript matcht **listing-SKU = Unique ID = Item Group ID**. Zodra Channable de bundel `36784-SET2` gaat pushen:

- de bestaande listing `36784` matcht niet meer → wordt genegeerd + `CHANNABLE_GENERATE_ERROR`
- Channable maakt een **nieuwe** listing aan voor `36784-SET2` → duplicaat naast de bestaande, verkoopgeschiedenis en Best-Match-positie op de oude

Dit staat los van de §4-kanaalregel in de feedomvang-analyse (die redt de 144 niet-remblok-listings tegen beëindiging bij de eerste push, en blijft nodig).

**Twee uitwegen, kies er één:**

| | Route | Wat je doet | Risico |
|---|---|---|---|
| **A** | Revise CustomLabel eerst | Bulk-Revise op de 118 live schijf-listings: `CustomLabel` → `<art>-SET2`. Dan pas Channable-adoptie aanvragen | Laag. Revise raakt geen ItemID, historie blijft. Wel één extra uploadronde |
| **B** | Bundel krijgt de kale SKU | Bundel = `36784`, simple hernoemen naar `36784-STK` | Hoog. Je hernoemt 118 bestaande simples in Magento — raakt webshop-URL's, ABS-koppeling, alternative ID mapping en de MOQ-meting. Afgeraden |

**Route A.** De eBay Bulk-Revise-keten is al operationeel (1.167 listings gerevised op 20 aug), dus dit is één extra kolom in een bestaand proces.

---

## 5 · Wat er in Magento moet staan (Magmodules Channable Connect 1.24.2)

⚠ **Niet live geverifieerd deze sessie** — de admin op `connectcarparts.nl/atvise/admin` vroeg om login en de REST-API zit achter Cloudflare bot-protection voor niet-browsersessies. Onderstaande waarden komen uit de config-uitlezing van 20 aug in `2026-08-20-magmodules-feedomvang-en-bundels.md`. Hercontroleren voordat je bouwt.

| Instelling | Nu | Moet | Waarom |
|---|---|---|---|
| `Enable Bundle Stock Calculation` | **No** | **Yes** | Zonder dit wordt bundelvoorraad niet berekend uit laagste childvoorraad × selection_qty → overselling |
| `Use Bundle Products` | te controleren | **Only Bundle Product** | Exporteert alleen het bundelartikel; 1 bundel = 1 Channable-itemslot, de simple wordt niet apart geëxporteerd |
| Bundle `Price Type` (op het product) | n.v.t. | **Fixed** | Harde eis Magmodules. Dynamic wordt niet ondersteund in de orderimport |
| Verplichte optie | n.v.t. | **1 optie, required, met default selection, qty 2** | Harde eis Magmodules |
| Voorraad | n.v.t. | **op de child** (de simple), niet op de bundel | Harde eis Magmodules |
| Stock config | te controleren | **Default Source / Default Stock** | Meest geteste MSI-configuratie. Multi-source volgt SSA — niet in de pilot mengen |
| Module btw-instelling (incl./excl.) | te controleren | vastleggen | Enige plek waar de module de Channable-prijs nog omrekent |
| `Minimum Sales QTY` in Inventory Data | aan | **aan laten** | Kanaalregel kan erop sturen |

**Los hiervan, gelijk meenemen:** de 80 remschijf-SKU's waar `min_sale_qty` naar 1 is verlaagd om de eBay-listing te laten werken (100% correlatie met de live set, gemeten 12 aug). Zodra de bundel het paar-gedrag draagt, kan Magento terug naar `min_sale_qty = 2` / `qty_increments = 2` en verkoopt de webshop weer paren in plaats van losse schijven.

---

## 6 · Wat er in Channable moet gebeuren

Project 314525 · company 101300 · kanaal eBay (159122, actief, 32 regels).

1. **Import** — de bundelvelden staan er al: `bundle_values`, `bundle_sku_type`, `bundle_price_type` zitten in de projectvelden (cluster 3 en 7 uit de veldsanering van 19 aug). Geen nieuwe import nodig, wel controleren dat de bundel binnenkomt met `id` = Magento entity ID.
2. **Alternative ID mapping opnieuw laten opbouwen** ná het aanmaken van de bundels, en verifiëren in de order events op `Found item id based on a match on sku`. Zonder dit herhaalt het incident van 4 aug (order 144013320, verkeerd artikel geleverd door de integer-cast).
3. **Kanaalregels eBay** voor de bundeltranche:
   - `C:Anzahl pro Packung` → `2`
   - `EAN` → EAN van het child-artikel
   - `C:Herstellernummer` → ABS-artikelnummer
   - titel → `2x Bremsscheibe ...` (paar expliciet in de titel, conform de bestaande MASTER-RULE-omschrijvingen)
   - prijs → de bundel-fixed-price uit Magento, **niet** ×2 in de kanaalregel (anders reken je dubbel)
4. **De §4-uitzonderingsregel** (behoud van de 250 live SKU's, uit `ccp_publish_control`, marketplace `ebay_de`) bijwerken naar de nieuwe `-SET2`-SKU's zodra route A is uitgevoerd.
5. **Adoptiescript aanvragen** bij Channable Integrations pas ná stap 4, met verwijzing naar de mail van Marissa Martens (10 aug).

---

## 7 · Openstaande punten — geen van deze mag blijven hangen

| # | Punt | Bij wie | Status |
|---|---|---|---|
| 1 | Integer-cast guard (SKU-verificatie of hard fail i.p.v. stil ander product laden) | Magmodules dev-team, via Frank | Toegezegd overleg 6 aug, geen terugkoppeling gezien. **Naar boven halen — dit is de enige bug die stil verkeerde artikelen levert** |
| 2 | Pilot-testorder via Channable → Orders → Test Order | CCP | Gepland "volgende week" op 6 aug. Uitkomst niet vastgelegd. Verifiëren of hij gedraaid is |
| 3 | Magento-config live-check (§5) | CCP | Deze sessie niet gelukt (login + Cloudflare). Handmatig aflopen |
| 4 | Single- of multi-source? | CCP | Bepaalt of Magmodules' "meest geteste" pad geldt |
| 5 | Huidige eBay-prijs op remschijven: stuk of paar? | CCP | Bepaalt of de bundelprijs een verdubbeling of een gelijkblijver is. **Fout hierin halveert of verdubbelt 118 live prijzen** |

---

## 8 · Volgorde

1. Openstaand punt 5 beantwoorden (stuk of paar) — alles daarna hangt eraan
2. Magento-config §5 aflopen; `Enable Bundle Stock Calculation` → Yes
3. Kanaalregel §4 uit de feedomvang-analyse bouwen (redt 144 listings bij de eerste push)
4. 5-10 pilotbundels bouwen op de best verkopende schijven, fixed price, 1 required option, default selection qty 2, voorraad op de child
5. Import draaien → alternative ID mapping verifiëren
6. Test Order via Channable draaien, order-payload controleren op juiste child-afboeking én juiste prijs
7. Bulk-Revise `CustomLabel` → `-SET2` op de betreffende live listings (route A)
8. Uitzonderingslijst bijwerken, adoptiescript aanvragen bij Channable
9. Pas daarna opschalen naar de rest van de 118, en `min_sale_qty` in Magento terugzetten naar 2

Gerelateerd: `2026-08-20-magmodules-feedomvang-en-bundels.md` · `EBAY-KWALITEITSRAPPORT-analyse-2026-08-20.md` · `MARGEMODEL-contributiemarge-per-SKU-2026-08-20.md` · `channable-operator/HUIDIGE-STAAT.md`
