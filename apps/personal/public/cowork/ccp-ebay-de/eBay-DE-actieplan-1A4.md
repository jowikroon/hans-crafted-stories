# eBay.de — Wat moet er gebeuren (1 A4)

*CCP / A.B.S. · versie 2026-07-06 · bron: [[eBay-DE-Launch]], [[Channable-D365-Integration]], [[ABS-Brand-Profile]], [[CCP]]*

## Waar we staan
eBay.de is **live sinds 11 mei 2026**, **20 SKU's**, **100/100 Quality Score**. Doel: **20 → 100 SKU's** (no-capital groeihefboom). Datastroom: **eBay → Channable (proj. 314525) → Magento 2 → D365/A.B.S.** (~5 min sync). Merk: A.B.S., ~39.684 SKU's in de feed.

## Aanpak in 3 lagen (belangrijk: in deze volgorde)
1. **Basis (nu):** elke SKU krijgt één Duitse **basisomschrijving** volgens de master rule (`MASTER-RULE-Duitse-basisomschrijving.md`). Platform-neutraal, GPSR-verplicht, geen verzonnen fitment.
2. **Brand store (Luca):** Luca bouwt de eBay-DE brand store op die basisomschrijvingen — uniforme template, huisstijl, categorie-indeling (Remmen · Stuurdelen · Wiellagersets).
3. **Verfijning (Hans):** per listing eBay-specifiek maken — titel 75/80 tekens incl. voertuigcompatibiliteit, Subtitle (€1,50, +15% CTR), Item Specifics, keywords.

## Wat er concreet moet gebeuren
| # | Actie | Eigenaar | Afhankelijk van |
|---|---|---|---|
| 1 | Master rule Duitse basisomschrijving vaststellen | Hans | — (klaar, v1) |
| 2 | Basisomschrijvingen via deterministische Channable-rule `DE - ebay_desc_de` (geen n8n, geen LLM) — draait op de VPS-browser | Hans | Master rule + Channable brondata |
| 3 | Brand store bouwen op de basisteksten | **Luca** | Stap 1–2 |
| 4 | eBay-verfijning per listing (titel/subtitle/specifics) | Hans | Brand store |
| 5 | Volgende 30 SKU's kiezen die 100/100 QS behouden | Hans | Open vraag [[eBay-DE-Launch]] |

## Compliance — must-fix vóór opschalen (4 dossiers, staan 4 weken stil)
- **Impressum + AGB** — eigenaarschap/plaatsing regelen (Sjoerd).
- **Lizenzero** — verpakkings-/WEEE-registratie DE.
- **GPSR-blok** — verplicht in elke omschrijving (zit in de master rule): A.B.S. All Brake Systems B.V., Tinbergenlaan 7, 3401 MT IJsselstein, NL.
- **DACH-programmaregels** — Late Shipment Rate ≤3%, Unique Buyer Protection >3 kopers.

## Dependencies & risico's
- **Fitment-brondata:** canonieke bron nog niet vastgelegd — D365 óf Channable? Beslis vóór bulk-generatie (anders inconsistente fitment).
- **Channable-CSV-stap:** D365↔Magento vergt handmatige CSV-validatie; ~5 min sync geeft voorraad-mismatch.
- **VAT DE:** registratie via Staxxer loopt ([[German-VAT-Bridge-Strategy]]) — nodig vóór volumegroei.

## Definitie van "klaar voor Luca"
Master rule vastgesteld ✓ · basisomschrijvingen voor de eerste batch scale-SKU's gegenereerd · categorie-indeling + GPSR-blok bevestigd. Dan start Luca met de brand store.
