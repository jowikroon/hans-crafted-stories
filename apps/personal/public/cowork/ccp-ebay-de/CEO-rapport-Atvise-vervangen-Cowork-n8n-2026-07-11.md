# Magento-beheer: stoppen met huidige leverancier, vervangen door AI-automatisering

*Voor: CEO · 2026-07-11 · 1 A4 · bedragen met * zijn aannames of in te vullen uit contract*

## Feit
De shipment-koppeling van de leverancier draaide 2 maanden op 99,8% faalratio voor track & trace (888 van 890 zendingen zonder trackingnummer), onopgemerkt door de bouwer. Daarnaast op 7 juli een productie-incident door een onaangekondigde wijziging: alle verkoopkanalen op 0 producten, 1 werkdag verloren, go-live eBay DE in gevaar.

## Resultaat
Het eigen team heeft met AI-tooling (Claude Cowork) in één middag de oorzaak gevonden, de fix bewezen (tracking tot op eBay in 11 minuten) en dagelijkse monitoring ingericht. Wat de leverancier in 2 maanden niet zag, is nu intern opgelost en bewaakt.

## Impact
Tracking bepaalt op marketplaces direct zichtbaarheid en verkooprecht. De afhankelijkheid van de leverancier is op dit vlak aantoonbaar duurder dan de vervanging.

## Kosten & besparingen (per maand)

| Post | Nu | Voorstel |
|---|---|---|
| Leverancierscontract Magento | € __* (uit contract) | € 0 |
| Smal vangnet core-updates/patches (on-demand, andere partij) | — | € 150–300* |
| Claude (Cowork, bestaand abonnement) | € ~180 | € ~180 (geen extra) |
| n8n-automatisering (self-hosted op bestaande VPS) | — | € 0 |
| Incidentkosten (type 7 juli: 1+ werkdag) | € 500–750* per incident | ↓ door monitoring + change-stop |
| **Netto besparing** | | **contractbedrag − €150–300*** |

\* = aanname of invullen; contractbedrag bepaalt de businesscase — bij een gangbaar beheercontract is de besparing direct positief.

## Wat vervangt wél / niet
**Wél (bewezen):** integratie-fixes, koppelingen, monitoring, incident-diagnose, rapportage — Cowork + n8n, draait al.
**Niet:** Magento core-updates, security-patches, hosting-techniek — smal on-demand vangnet nodig (geen vast contract).

## Besluit gevraagd
1. Contract huidige leverancier opzeggen c.q. afschalen naar nul; opzegtermijn checken.
2. Akkoord op smal on-demand patch-vangnet (offerte volgt, € 150–300*/mnd equivalent).
3. Track & trace-fix draait intern als vangnet; definitieve D365-fix wordt bij de integratie-eigenaar belegd.

*Volledig bewijsdossier (tijdlijn, logins, 99,8%-analyse, verbetervoorstel) beschikbaar: Atvise-dossier 11-07.*
