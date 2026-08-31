# Reactie op release 1.1.0 — herbouw naar 1.2.0

Release 1.1.0 gaat niet naar productie. De kernaanname van de guard klopt niet, en de installatie zou het live eBay-kanaal stilleggen. Hieronder het bewijs, de gevraagde correcties en de acceptatiecriteria.

---

## 1. Blokkerend: `reference_code` is niet de SKU

Je schrijft in §5: *"De releasecontrole gebruikt de ontvangen `reference_code` als SKU-bewijs. Die waarde moet dus de parent-SKU bevatten."*

Dat is onjuist. Bij eBay is `reference_code` de **eBay ItemID**. De SKU staat in `channel_product_id`.

Echte, geslaagde orderregel uit de Channable Orders API (project 314525):

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

Veldbetekenis:

| Veld | Werkelijke inhoud |
|---|---|
| `reference_code` | eBay ItemID (12-cijferig listingnummer) |
| `article_number` | `ItemID-VariationID` |
| `channel_product_id` | seller-SKU / eBay CustomLabel |
| `id` | Magento entity ID |

Meting over alle 63 orderregels in het project (62 orders, opgehaald 2026-08-21):

| Controle | Uitkomst |
|---|---|
| `reference_code == channel_product_id` | **0 van 63** |
| `reference_code` in ItemID-vorm (12+ cijfers) | 26 van 63 |
| `id` numeriek (entity ID) | 55 van 63 |
| `id` alfanumeriek | 8 — waarvan 6× `18722-SET2` |
| `ean` gevuld | 4 van 63 |

Gevolg: de vergelijking `reference_code` ↔ SKU faalt structureel. Release 1.1.0 blokkeert daarmee **elke** eBay-order, niet alleen de foute. `ean` valt af als fallback-identifier — 94% van de orderregels heeft er geen.

**Herbouw de controle als:** laad het product via entity `id`, eis `product.sku === channel_product_id`. Dat is dezelfde grootheid aan beide kanten en dekt exact het scenario van 4 augustus (order 144013320), waar een niet-resolvende `id` stil naar een ander product castte.

---

## 2. Je hebt tegen testorders gevalideerd, niet tegen echte orders

De zes `18722-SET2`-regels van 28 juli zijn testorders via Channable → Send test order. Daarin staat:

```
id             = "18722-SET2"   (de SKU, niet het entity ID)
reference_code = "123"          (dummy)
```

Een testorder zet de SKU in `id`. Een productieorder zet het entity ID in `id`. De payloadvormen verschillen aantoonbaar. Channable documenteert zelf dat de testorder de verbinding test en niet het ordergedrag.

Valideer 1.2.0 dus tegen een echte marketplaceorder of tegen een fixture die op bovenstaande productiepayload is gebaseerd. Niet tegen Send test order.

---

## 3. Geen guard zonder kill switch

§5 stelt: *"Release 1.1.0 heeft geen afzonderlijke aan/uit-schakelaar voor SKU-verificatie."*

Dat is op een kanaal met lopende orders niet acceptabel. 1.2.0 moet hebben:

- **Config-toggle** onder `Channable → Configuration → Orders`: guard aan/uit, met default **uit**.
- **Modus**: `log-only` (schrijft de bevinding weg, laat de order door) en `enforce` (blokkeert). Start in log-only, schakel pas naar enforce na bewijs uit de logs.
- **SKU-whitelist / patroon**: guard alleen actief op SKU's die aan een patroon voldoen (bv. `*-SET2`), zodat het reguliere assortiment nooit geraakt wordt door een guard-regressie.

---

## 4. Gedrag bij meerregelige orders specificeren

§5 stelt dat een fout de volledige order stopt vóór quote- of ordercreatie. Bepaal en documenteer expliciet:

- Wat er gebeurt bij een order met meerdere regels waarvan er één faalt.
- Of Channable retryt, en wat de order-status wordt.

Een niet-geïmporteerde eBay-order is een niet-verzonden order en telt mee in de eBay-Verkäuferstandards. Een hele order blokkeren omdat één regel niet resolveert is duurder dan de fout zelf. Voorkeur: regel afwijzen met expliciete fout in Processed Orders, order wél aanmaken, tenzij enforce-modus anders is ingesteld.

---

## 5. Correcties op de runbook

| § | Punt | Correctie |
|---|---|---|
| 3 | `Enable Bundle Stock Calculation` staat vermeld onder **Catalog → Inventory** | Dit is een **Magmodules Channable Connect**-instelling, niet Magento core. Pad corrigeren |
| 3 | Alleen de order-kant van bundles is geconfigureerd | De feed/export-kant ontbreekt. `Use Bundle Products` in de productconfiguratie bepaalt of de bundel überhaupt geëxporteerd wordt. Zonder die instelling is er geen listing en dus geen order om te ontvangen |
| 2 | `setup:di:compile` + `cache:flush`, geen static content deploy | De module voegt een adminhtml-grid toe (**Bundle Pilot**). In production mode is `setup:static-content:deploy -f adminhtml` nodig, anders is dat scherm stuk |
| 2 | `maintenance:enable` zonder venster | Deployvenster, duur en afstemming met Atvise vastleggen. De webshop staat er tijdens de deploy uit |
| — | Geen rollbackpad | Opnemen: `module:disable` → `setup:upgrade` → `cache:flush`, plus wie die mag trekken |
| — | Geen staging | Magento-config en -onderhoud liggen bij Atvise. Een custom module rechtstreeks op productie is het patroon dat op 7 juli al een keer de import brak. Eerst staging |

---

## 6. Context die je architectuurkeuze raakt

De live eBay-remschijflistings zijn **nu al paarlistings**: `2x` in de titel, paarprijs, marketplace quantity 1, en de seller-SKU is het **kale artikelnummer** — niet `-SET2`.

| SKU (`channel_product_id`) | entity `id` | qty | prijs | titel |
|---|---|---|---|---|
| 18536 | 5108 | 1 | € 57,46 | ABS 18536 2x Bremsscheibe Vorne Belüftet Ø305 mm |
| 18539 | 35581 | 1 | € 79,13 | ABS 18539 2x Bremsscheibe Hinten Massiv Ø300 mm |
| 16876 | 35233 | 1 | € 36,40 | ABS 16876 2x Bremsscheibe Massiv Ø247 mm |
| 18722 | 18722 | 1 | € 113,41 | ABS 18722 2x Bremsscheibe Vorne Belüftet Ø375 mm |
| 18462 | 18462 | 1 | € 85,70 | ABS 18462 2x Bremsscheibe Hinten Belüftet Ø278 mm |

Twee consequenties:

1. **Het `-SET2`-contract werkt pas nadat de eBay CustomLabel is gerevised.** Zolang de listing `18536` heet, stuurt Channable `channel_product_id = 18536` en resolveert je guard naar de simple, niet naar de bundel. De SKU-wissel raakt 118 live listings inclusief historie en Best-Match-positie. Dat is een aparte, niet-triviale operatie die vóór jouw bundelcontract moet landen.
2. **De voorraaddrift loopt nu al.** Elke verkochte paarlisting boekt in Magento 1 schijf af terwijl er 2 verzonden worden. Dat is geen risico van de toekomstige architectuur maar een lopend defect.

⚠ Let op de regels waar `id` gelijk is aan de SKU (`18722`, `18462`) in plaats van een entity ID. Neem dat mee als testcase: je guard moet dat als niet-resolvende identifier behandelen, niet als toevallige match.

---

## 7. Wat ik van je wil in 1.2.0

Lever **alleen de guard**, zonder bundellogica. Die is los deploybaar, lost het incident van 4 augustus op en blokkeert niets legitiems. Het bundelcontract komt in een aparte release nadat de SKU-wissel op eBay besloten is.

Scope 1.2.0:

1. Controle `id` → product → `product.sku === channel_product_id`.
2. Config-toggle met modi `off` / `log-only` / `enforce`, default `off`.
3. SKU-patroon-whitelist.
4. Expliciet gedrag bij meerregelige orders, gedocumenteerd.
5. Duidelijke, doorzoekbare logregel per bevinding met `order_id`, `channable_order_item_id`, `id`, `channel_product_id`, gevonden SKU.
6. Rollbackpad in de runbook.
7. Unit-/integratietests op de productiepayloadvorm uit §1, plus de niet-resolvende cases uit §6.

**Acceptatiecriteria vóór enforce:**

| Controlepunt | Vereiste |
|---|---|
| Guard in `log-only` op productie | Minimaal 20 echte orders zonder valse positief |
| Bekende foutcase | Niet-bestaande/alfanumerieke `id` wordt gelogd als mismatch |
| Reguliere order | Geen enkele guard-melding op een correct resolvende regel |
| Rollback | `module:disable` getest op staging, shop blijft werkend |

---

## 8. Wat ik nog niet kan aanleveren

`bin/magento module:status`, de gefilterde logs uit `var/log/` en de foutmelding uit Processed Orders zijn er nog niet. Magento draait bij een externe partij; ik heb geen shell en de REST-API zit achter Cloudflare bot-protection. Ik vraag read-only toegang tot `var/log/` en de admin aan. Ga er tot die tijd niet vanuit dat je installatie geverifieerd is.

Los daarvan staat er één echte foutorder open die niets met jouw module te maken heeft: **108598869** (13 augustus, 2× ABS remklauw, € 94,58, `error_reason: platform_failure`, `platform_id: null`, nooit in Magento geland). Die pak ik apart op — meld het als je hem in de logs tegenkomt, maar bouw er geen guard-logica omheen.
