---
type: meting + bevinding
scope: CCP · eBay DE · Advertising-Cockpit · campagnemetrics
status: opgeslagen in ccp_ebay_ads_metrics
created: 2026-08-20
last_reviewed: 2026-08-20
bron: Verkäufer-Cockpit Pro → Advertising → Cockpit, afgelezen 20-08-2026
---

# eBay Advertising — alle metrics, en wat ze zeggen

**ROAS over 90 dagen is 1,38. Je geeft €395 uit om €545 omzet te maken. Dat is verlies, niet marketing.**

Vijf campagnes, alle metrics opgeslagen in `ccp_ebay_ads_metrics` (12 rijen: totalen + per campagne, voor 7 en 90 dagen).

## 1 · Totalen

| | 7 dagen | 90 dagen |
|---|---:|---:|
| Klicks | 186 | 625 |
| Verkochte stuks | 4 | 17 |
| Omzet | € 219,38 | € 544,79 |
| Advertentiekosten (ex btw) | € 85,80 | € 395,42 |
| Klikrate | 0,15% | 0,09% |
| Conversierate | 2,15% | 2,72% |
| CPC | € 0,49 | € 0,67 |
| **ROAS** | **2,56** | **1,38** |

## 2 · Per campagne

**Laatste 7 dagen**

| Campagne | Impr. | Klicks | Stuks | CPC | Omzet | Kosten | ROAS | ACOS |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| All products \| Ads Paid Per conversie | 107.609 | 47 | 3 | € 0,00 | € 140,25 | € 18,24 | **7,69** | 13,01% |
| Externe Anzeigen | 982 | 25 | 0 | € 0,26 | € 0,00 | € 6,44 | 0,00 | — |
| Remblokken ABS – Premium | 5.057 | 37 | 0 | € 0,39 | € 0,00 | € 14,58 | 0,00 | — |
| Remschijven ABS – Premium | 5.369 | 27 | 0 | € 0,35 | € 0,00 | € 9,44 | 0,00 | — |
| potentials | 0 | 0 | 0 | — | € 0,00 | € 0,00 | 0,00 | — |

**Laatste 90 dagen**

| Campagne | Impr. | Klicks | Stuks | Omzet | Kosten | ROAS | ACOS | Start |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| All products \| Ads Paid Per conversie | 547.060 | 75 | 5 | € 225,37 | € 27,60 | **8,17** | 12,25% | 20-07 |
| Externe Anzeigen | 2.786 | 82 | 7 | € 106,12 | € 18,61 | **5,70** | 17,53% | 24-07 |
| Remblokken ABS – Premium | 5.059 | 37 | 0 | € 0,00 | € 14,58 | 0,00 | — | 17-08 |
| Remschijven ABS – Premium | 5.369 | 27 | 0 | € 0,00 | € 9,44 | 0,00 | — | 17-08 |
| potentials | 12.889 | 3 | 0 | € 0,00 | € 0,00 | 0,00 | — | 04-08 |

## 3 · Drie dingen die opvallen

**Je twee beste campagnes staan niet op CPC.** *Ads Paid Per conversie* (ROAS 8,17, ACOS 12,25%) en *Externe Anzeigen* (ROAS 5,70, ACOS 17,53%) rekenen af per conversie. Ze kosten samen €46 over 90 dagen en leveren €331 op. Dat werkt.

**Je twee nieuwe Premium-campagnes verbranden geld.** Remblokken en Remschijven ABS, live sinds 17 augustus: samen 64 klikken, **nul verkopen**, €24,02 aan kosten in drie dagen. Op dat tempo is dat circa €240 per maand zonder omzet. Drie dagen is te kort voor een oordeel, maar 64 klikken zonder één conversie terwijl je andere campagnes op 2,7% converteren is een signaal — geen ruis.

**Het rekensommetje klopt niet met zichzelf.** De koptekst zegt €395,42 aan kosten over 90 dagen, de vijf zichtbare campagnes samen €70,23. Er zit dus circa €325 aan uitgaven bij campagnes die niet meer in de lijst staan — beëindigd of verwijderd. Dat is precies de historie die je wilt zien voordat je hier iets besluit. Op te halen via `Advertising → Kampagnen` met de filter op beëindigde campagnes, of via het advertentierapport onder Berichte.

## 4 · Wat dit betekent voor het margemodel

In het margemodel van vanmiddag staat `advertentie_pct` op 9,6% — overgenomen van het Anzeigentarif dat op je listings staat. **Die aanname is nu toetsbaar geworden, en op twee manieren fout.**

Te hoog, want lang niet elke verkoop komt via een advertentie. Over 90 dagen zijn er 17 stuks via advertenties verkocht; je totale verkochte aantal ligt veel hoger. Het advertentiepercentage over de héle omzet is dus lager dan 9,6%.

Te laag, want op de advertentie-omzet zelf is het aandeel veel groter: €395 kosten op €545 omzet is 72,6%.

**De juiste parameter is: totale advertentiekosten ÷ totale omzet.** Die eerste helft heb ik nu (€395,42 over 90 dagen). Voor de tweede helft heb ik je totale eBay DE-omzet over dezelfde 90 dagen nodig — die staat onder `Performance → Verkäufe` of in de maandfacturen. Zeg het getal en ik zet het percentage erin; dan verschuift het hele margeoverzicht naar iets dat klopt.

## 5 · Wat ik zou doen

Niets omzetten voordat de 90-daagse omzet bekend is. Maar één ding is nu al verdedigbaar: **zet de twee Premium-campagnes op pauze of verlaag het tarief** tot er een conversie is. Ze kosten €8 per dag en hebben in 64 klikken niets opgeleverd, terwijl je twee betaal-per-conversie-campagnes bewijzen dat het assortiment wél converteert.

Dat is jouw beslissing, niet de mijne — ik raak geen campagnes aan.

## 6 · Opgeslagen

Tabel `ccp_ebay_ads_metrics`, 12 rijen, RLS aan. Sleutel: marketplace + gemeten_op + periode + niveau + campagne, dus een tweede meting op een andere dag komt er netjes naast en je kunt over tijd vergelijken.

Volgende meting: draai dit opnieuw en de diff is meteen zichtbaar.
