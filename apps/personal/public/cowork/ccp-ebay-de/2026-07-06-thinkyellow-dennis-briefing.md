# Briefing voor Dennis (Thinkyellow) — eBay DE livegang & Channable-setup review

*CCP / A.B.S. · 2026-07-06 · opgesteld voor Hans van Leeuwen · bron: [[eBay-DE-Launch]], [[Channable-D365-Integration]], vault `_cowork/ccp-ebay-de/`, `_cowork/channable-operator/`*

## Doel van deze briefing
Drie concrete hulpvragen aan Thinkyellow rondom de eBay.de-livegang (orders + T&T) komende week, plus een review van onze bestaande Channable/Magento-inrichting. Bedoeld als voorwerk zodat Dennis meteen kan meedenken — niet als volledige documentatie.

---

## Onze setup in het kort (context voor de review)

**Datastroom (bron van waarheid: D365 → marketplaces):**
`D365 (ERP/PIM) → Magento 2 → Channable (project 314525, company 101300) → Amazon DE · eBay DE · Bol.com`
Voor orders loopt het terug: `marketplace → Channable → Magento (→ D365)`, sync-delay ~5 min.

**Kerncijfers:**
- ~39.684 SKU's in de feed, merk A.B.S. (All Brake Systems).
- Channable-kosten ~€300-400/mnd.
- eBay DE live sinds 11 mei 2026, 20 SKU's, 100/100 Quality Score. Doel: opschalen 20 → 100 SKU's.
- Categorieën in scope: Remmen (remschijven/remblokken) · Stuurdelen · Wiellagersets.

**Bekende frictiepunten die we zelf al zien:**
- D365 ↔ Magento-export vraagt handmatige CSV-validatie (geen volledig geautomatiseerde push).
- ~5 min sync geeft voorraad-/order-mismatch-risico.
- Productverrijking (fitment, OE, voertuigcompatibiliteit) leeft in meerdere systemen zonder één single source of truth.
- Import-kwaliteit: ~1.185 items met lege `additional_imagelinks` (mandatory-issue op image-strenge kanalen), plus dubbele kolomnaam "EAN code" in import "Aanvullende productdata ABS".

---

## Punt 1 — Track & Trace automatisch naar de marketplaces

**Wat er moet gebeuren:**
DPD-trackingnummers moeten automatisch in het eBay DE-verkoopaccount komen (en breder in de marketplaces), zodat de koper het trackingnummer ziet en we de DACH Late-Shipment-Rate ≤3% beschermen.

**De keten die we willen:**
1. **ABS API → Magento generieke velden.** Niek zet de koppeling op die de T&T (van DPD) vanuit de ABS API naar generieke Magento-velden mapt, die bij updates automatisch gevuld worden.
2. **Magento → Channable.** Zodra de T&T-velden in Magento gevuld zijn, moet Channable automatisch geüpdatet worden met die gegevens.
3. **Channable → marketplaces.** Channable deelt de tracking terug naar eBay DE (en overige kanalen) via de order-sync-connectie (type "Complete": order in + verzendstatus/tracking terug). Add-on ~€49/mnd per connectie.

**Status nu:** stap 1 (ABS API → Magento) is in ontwikkeling bij Niek. Stappen 2 en 3 (Magento → Channable → marketplace) zijn nog niet bevestigd werkend — dit is het gat dat nog dicht moet vóór livegang.

**Vraag aan Dennis:** meedenken over de Channable-kant — hoe stellen we de order-sync/verzendstatus-terug het robuustst in zodat de T&T-velden uit Magento correct doorstromen naar eBay (en later Amazon/Bol)?

**Praktisch:** Hans heeft morgen (di) **11:00–11:30 een meeting met Niek** over precies deze koppeling. Optie: Dennis haakt daar even bij aan, of anders los daarvan meedenken op de Channable-kant.

---

## Punt 2 — Channable image tool: main images op marketplace-dimensies

**Het probleem:**
De main images lijken vierkant, maar zó worden ze niet doorgestuurd — bij export hebben ze niet de vereiste afmetingen. Voor Magento lijkt dit geen probleem, maar marketplaces eisen een minimum (indicatief **500×500 px**, te bevestigen per kanaal).

**Wat we willen:**
Met de **image tool in Channable** zorgen dat alle main images bij export voldoen aan de minimale dimensies voor de marketplaces (bijbewerken/padden naar vierkant + minimale px zonder de bron in Magento te hoeven aanpassen).

**Vraag aan Dennis:** met ons meekijken **dinsdag of woensdag** — of ons in elk geval ondersteunen — bij het correct inrichten van de image tool hiervoor.

**Aangrenzend (handig om mee te nemen):** de openstaande `additional_imagelinks`-kwaliteitsissue (~1.185 items leeg) raakt dezelfde image-strenge kanalen (Amazon DE, Kaufland).

---

## Punt 3 — Review van de volledige Channable/Magento-inrichting

Hans wil de complete setup (alles rond Channable + Magento) met Dennis delen voor zijn feedback: **hoe is het ingesteld, hoe werkt het, en waarom zijn bepaalde keuzes gemaakt** — is de opzet robuust en klopt dit, of moeten we dingen anders doen?

**Specifieke punten die we willen toetsen:**
- **Magento SKU vs EAN matching** — op welke sleutel matchen we producten door de keten, en is die keuze robuust bij opschalen naar 100+ / uiteindelijk ~39.684 SKU's?
- **Bol "alternative" mapping** — hoe de Bol-kanaalmapping nu is opgezet, en of dat de juiste aanpak is.
- Master rules / channel rules-structuur (o.a. `Categories_clean`, `Inbouwplaats_clean`, GPSR-blok, DE-omschrijvingsrules) — logisch en onderhoudbaar?
- De handmatige CSV-stap tussen D365 en Magento — is er een API-push-pad dat die handmatige validatie kan vervangen?

**Vraag aan Dennis:** review op robuustheid + advies waar we het anders/beter kunnen inrichten.

---

## Samengevat — waar we Dennis voor vragen
| # | Onderwerp | Concrete vraag | Timing |
|---|---|---|---|
| 1 | T&T DPD → Magento → Channable → marketplaces | Meedenken Channable order-sync/tracking-terug | Evt. aanhaken bij Niek-meeting di 11:00–11:30 |
| 2 | Channable image tool, main images ≥500×500 | Meekijken/ondersteunen inrichting | Di of wo |
| 3 | Review hele Channable/Magento-setup (SKU/EAN, Bol mapping) | Feedback op robuustheid + advies | In overleg |

*Openstaand / [unverified]: exacte huidige matching-sleutel (SKU vs EAN) en de precieze Bol "alternative" mapping-config staan niet in de vault gedocumenteerd — Hans licht die mondeling toe. Marketplace-minimum 500×500 px per kanaal nog te bevestigen.*
