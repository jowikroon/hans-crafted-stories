---
type: technische review + antwoord
scope: CCP · ConnectCarParts_ChannableBundleGuard 1.1.0 · antwoord op SKU-VERIFICATION-AND-LOG-CHECK.md
status: blokkerend bevinding — niet installeren in huidige vorm
created: 2026-08-21
last_reviewed: 2026-08-21
bron: Channable Orders API live (project 314525, 62 orders / 63 orderregels, opgehaald 2026-08-21) · Magmodules-thread 06-07 aug · Channable-support 03/10 aug
methode-tier: 1 (deterministisch, live API-uitlezing)
---

# Antwoord op SKU-VERIFICATION-AND-LOG-CHECK.md (release 1.1.0)

**Niet installeren. De guard vergelijkt `reference_code` met de SKU, maar `reference_code` is bij eBay de eBay ItemID — nooit de SKU. Op 63 live orderregels is `reference_code == channel_product_id` exact 0 keer waar. Release 1.1.0 zou dus élke eBay-order blokkeren, niet alleen de foute.**

---

## 1 · De gevraagde artefacten — wat wel en niet kan

Manus vraagt om drie dingen: `bin/magento module:status`, de gefilterde loguitvoer, en de foutmelding uit Processed Orders.

**Geen van drieën is hier op te halen.** Magento draait bij Atvise; er is geen shell, geen SSH-sleutel en geen read-only serveraccount in de vault. De REST-API achter `connectcarparts.nl` zit bovendien achter Cloudflare bot-protection (HTTP 403 challenge voor niet-browsersessies) en de admin op `/atvise/admin` vraagt om login. Dit moet dus door Atvise of Luca aangeleverd worden.

**Wat wél kon:** de Channable Orders API is live uitgelezen (62 orders, 63 orderregels, project 314525). Dat levert precies het bewijs dat de guard-aanname weerlegt — zie §2. Dit is bruikbaarder dan de logs, want het toont de payload-structuur waar de guard op moet oordelen.

---

## 2 · Blokkerend: `reference_code` is niet de SKU

Manus schrijft in §5: *"De releasecontrole gebruikt de ontvangen `reference_code` als SKU-bewijs. Die waarde moet dus de parent-SKU bevatten."*

Dat klopt niet. Hier is een echte, geslaagde eBay-orderregel uit de Channable Orders API:

```json
{
  "reference_code":     "257637849192",
  "article_number":     "257637849192-10084172055006",
  "channel_product_id": "18536",
  "id":                 "5108",
  "title":              "ABS 18536 2x Bremsscheibe Vorne Belüftet Ø305 mm für u.a. MERCEDES-BENZ",
  "quantity": 1,
  "price": 57.46
}
```

| Veld | Wat het werkelijk is | Manus' aanname |
|---|---|---|
| `reference_code` | **eBay ItemID** (12-cijferig listing-nummer) | "SKU-bewijs" ❌ |
| `article_number` | `ItemID-VariationID` | — |
| `channel_product_id` | **de seller-SKU / eBay CustomLabel** = `18536` | niet gebruikt ❌ |
| `id` | **Magento entity ID** = `5108` | correct ✅ |

**Meting over alle 63 orderregels:**

| Controle | Uitkomst |
|---|---|
| `reference_code == channel_product_id` | **0 van 63** |
| `reference_code` is 12+ cijferig (ItemID-vorm) | 26 van 63 (rest = testorders met `"123"`) |
| `id` numeriek (entity ID) | 55 van 63 |
| `id` alfanumeriek | 8 — waarvan 6× `18722-SET2`, plus `Testorder#1` en `P 85 041` |
| `ean` gevuld | **4 van 63** |

**Gevolgen voor de guard:**

1. De vergelijking `reference_code` ↔ SKU faalt altijd → **volledige orderstop op het live eBay-kanaal.**
2. De guard heeft volgens §5 van de runbook **geen aan/uit-schakelaar**. Er is dus geen kill switch als dit in productie misgaat. Dat is op een kanaal met lopende orders onacceptabel.
3. `ean` als fallback-identifier valt af: 94% van de orderregels heeft geen EAN in de payload.

**De correcte controle** is: laad het product via entity `id`, en eis dat `product.sku == channel_product_id`. Dat is dezelfde grootheid aan beide kanten en dekt exact het scenario van 4 augustus (order 144013320) — een `id` die niet resolveert en stil naar een ander product cast.

Voor `-SET2` komt daar bovenop: als `channel_product_id` eindigt op `-SET2`, moet het geladen product type `bundle` zijn, fixed price, één required option met één default selection, child-SKU = `channel_product_id` minus het `-SET2`-suffix, selection qty 2.

---

## 3 · De testorders verklaren waar de verwarring vandaan komt

De zes `18722-SET2`-regels van 28 juli zijn **testorders** via Channable → Send test order. Daar staat:

```
id = "18722-SET2"     (de SKU, niet het entity ID)
reference_code = "123" (dummy)
```

Een testorder zet de SKU in `id`. Een echte order zet het entity ID in `id`. Wie de guard alleen tegen testorders valideert, ziet dus een payload-vorm die in productie niet bestaat. **De guard moet tegen een echte order gevalideerd worden, niet tegen Send test order** — Channable zegt dat zelf ook in hun documentatie ([3] in Manus' referentielijst): de testorder test de verbinding, niet het ordergedrag.

Dit verklaart ook waarom de integer-cast juist bij testorders toesloeg.

---

## 4 · Openstaande vraag uit het vorige stuk is hiermee beantwoord

Vorige analyse, openstaand punt 5: *"Huidige eBay-prijs op remschijven: stuk of paar?"*

**Paar.** Bewijs uit de live orderregels:

| SKU (`channel_product_id`) | entity `id` | qty | prijs | titel |
|---|---|---|---|---|
| 18536 | 5108 | 1 | € 57,46 | ABS 18536 **2x** Bremsscheibe Vorne Belüftet Ø305 mm |
| 18539 | 35581 | 1 | € 79,13 | ABS 18539 **2x** Bremsscheibe Hinten Massiv Ø300 mm |
| 16876 | 35233 | 1 | € 36,40 | ABS 16876 **2x** Bremsscheibe Massiv Ø247 mm |
| 18722 | 18722 | 1 | € 113,41 | ABS 18722 **2x** Bremsscheibe Vorne Belüftet Ø375 mm |
| 18462 | 18462 | 1 | € 85,70 | ABS 18462 **2x** Bremsscheibe Hinten Belüftet Ø278 mm |

De listings zijn dus **nu al paarlistings**: `2x` in de titel, paarprijs, seller-SKU = het kale artikelnummer, marketplace quantity 1.

**Dat betekent dat de voorraaddrift nú al loopt.** Elke verkochte paarlisting boekt in Magento 1 schijf af terwijl er 2 de deur uit gaan. Dat is niet een risico van de toekomstige bundelarchitectuur — dat is een lopend defect. Gecombineerd met de MOQ-regressie (80 remschijf-SKU's op `min_sale_qty = 1`, 100% correlatie met de live eBay-set) is dit de duurste openstaande post van het hele eBay-traject.

⚠ Twee van de vijf regels hierboven (`18722`, `18462`) hebben `id` gelijk aan de SKU in plaats van een entity ID. Dat is dezelfde alfanumeriek/gelijk-aan-SKU-vorm als bij de testorders en verdient controle: staat de alternative ID mapping voor die SKU's wel goed?

---

## 5 · Architectuurkeuze die Manus overslaat

De runbook gaat er impliciet vanuit dat `-SET2` de gekozen route is. Nu de listings al paarlistings op de kale SKU zijn, zijn er twee routes en verandert de kosten/batenverhouding:

| | Route A — `-SET2` bundel | Route B — qty-multiplier |
|---|---|---|
| Magento | Nieuw bundleproduct per SKU, fixed price, 1 required option, default selection qty 2 | Geen nieuwe producten. Plugin verdubbelt qty op orderregels waarvan de SKU als paarlisting gemarkeerd is |
| eBay | **Bulk-Revise `CustomLabel` → `<art>-SET2` op alle live paarlistings**, anders stuurt Channable `channel_product_id = 18536` en resolveert de guard naar de simple | Geen wijziging |
| Channable | Alternative ID mapping herbouwen op de nieuwe entity ID's; adoptiescript aanvragen ná de revise | Geen wijziging |
| Voorraad | Native: 1 bundel = 2 childs afgeboekt | Plugin-afhankelijk |
| Leverancierssteun | Magmodules ondersteunt dit expliciet (mail 6+7 aug) | Channable adviseert het (mail 10 aug), Magmodules ondersteunt het niet |
| Prijs | Fixed parent price; **niet ×2 in de kanaalregel** | Ongewijzigd, staat al goed |
| Risico | SKU-wissel raakt 118 live listings, historie en Best-Match | Permanente custom fork; stille regressie bij module-update |
| Doorlooptijd | Weken | Dagen |

**Beide routes hebben dezelfde plugin nodig** voor de entity-ID/SKU-guard — dat werk is niet verloren. Het verschil zit in of Manus daarnaast een bundelcontract afdwingt of een qty-multiplier bouwt.

Mijn advies: **laat Manus release 1.2.0 eerst uitsluitend de guard leveren** (entity ID ↔ `channel_product_id`, met config-toggle en whitelist), zonder bundellogica. Die is los deploybaar, lost het incident van 4 augustus op en blokkeert niets legitiems. De bundel-vs-multiplier-keuze kan daarna, op basis van wat de Bulk-Revise van 118 listings praktisch kost.

---

## 6 · Overige correcties op de runbook

| § | Punt | Correctie |
|---|---|---|
| 3 | `Enable Bundle Stock Calculation` staat vermeld onder **Catalog → Inventory** | Dit is een **Magmodules Channable Connect**-instelling, niet Magento core. Pad verifiëren vóór de wijzigingsronde |
| 3 | Alleen de **order**-kant van bundles is geconfigureerd | De **feed/export**-kant ontbreekt: `Use Bundle Products` in de productconfiguratie bepaalt of de bundel überhaupt geëxporteerd wordt. Zonder die instelling bestaat er niets om een order op te ontvangen |
| 2 | `setup:di:compile` + `cache:flush`, geen static content deploy | De runbook voegt een adminhtml-grid toe (**Bundle Pilot**). In production mode is `setup:static-content:deploy -f adminhtml` dan nodig, anders is het scherm stuk |
| 2 | `maintenance:enable` op de live shop | Venster afstemmen; nu geen tijdstip of duur genoemd. Webshop staat er tijdens de deploy uit |
| — | Geen rollback | `module:disable` + `setup:upgrade` + `cache:flush` als expliciete terugweg opnemen, met wie hem mag trekken |
| — | Geen staging | Atvise beheert Magento-config en -onderhoud. Een custom module rechtstreeks op productie is exact het patroon van het storeview-incident van 7 juli |
| 6 | Acceptatiecriteria stoppen bij de order | Voeg toe: wat gebeurt er bij een **meerregelige order** waarvan één regel faalt? De guard stopt volgens §5 de volledige order. Op eBay betekent een niet-geïmporteerde order een niet-verzonden order → Verkäuferstandards-defect |

---

## 7 · Wat er nu al fout staat en niets met de guard te maken heeft

**Order 108598869 (13 augustus, eBay).** Twee remklauwen ABS 630851 + 630852, € 94,58, betaald, `status_shipped: awaiting_confirmation`, `platform_id: null` — **nooit in Magento geland**. `error_reason: platform_failure`.

Dat is het bekende Magento-patroon: DE-orders falen omdat **Allow Countries** op de betreffende scope alleen NL toestaat. Los dit los van het bundeltraject op; het kost nu een openstaande, betaalde, niet-verzonden eBay-order.

Van de 7 foutorders zijn er 6 testorders (28 juli / 4 augustus). Deze is de enige echte.

---

## 8 · Wat je terugstuurt naar Manus

1. `reference_code` is de eBay ItemID, niet de SKU — bewijs in §2. Guard herbouwen op `id` (entity ID) ↔ `channel_product_id` (SKU).
2. Er moet een config-toggle én een SKU-whitelist komen. Geen guard zonder kill switch op een live kanaal.
3. Valideren tegen een echte order, niet tegen Send test order — de payloadvorm verschilt aantoonbaar (§3).
4. `ean` valt af als fallback-identifier: gevuld op 4 van 63 orderregels.
5. Feed/export-kant van bundles ontbreekt in de runbook (§6).
6. Rollbackpad, staging en het deployvenster met Atvise vastleggen vóór installatie.
7. Gedrag bij meerregelige orders specificeren: hele order blokkeren is op eBay duurder dan de fout zelf.

**Wat Manus van jou nodig heeft en wat je pas na §1 kunt leveren:** `module:status`, de gefilterde logs en de Processed Orders-foutmelding. Vraag Atvise om read-only toegang tot `var/log/` en de admin, anders blijft elke iteratie blind.

Gerelateerd: `BUNDLES-remschijven-ebayDE-2026-08-20.md` · `2026-08-20-magmodules-feedomvang-en-bundels.md` · `channable-operator/HUIDIGE-STAAT.md`
