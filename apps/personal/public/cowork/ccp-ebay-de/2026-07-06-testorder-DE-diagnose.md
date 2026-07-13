# eBay DE testorder — diagnose van de faalde import

*CCP / A.B.S. · 2026-07-06 · live gecheckt in Channable (proj. 314525) door Cowork · scope: waarom DE-order faalt + fix in huidige Magento*

## Wat ik live zag in Channable (Orders → Mislukte bestellingen)
- Alle **DE-vlag testorders van vandaag (6 juli)** falen; de NL-vlag orders van 16 april faalden los daarvan (ander/ouder issue).
- Order 106030924 — verzendadres bevestigd **DE**: Kurfürstenstraße 43 bis, 56821 Ellenz-Poltersdorf, Nordrhein-Westfalen (NW).
- Status-log van de order:
  1. Order placed on eBay
  2. Order retrieved by Channable
  3. **Fouten:** *"Could not import order 106030924: Some addresses can't be used due to the configurations for specific countries."*

## Wat de fout betekent
De order komt correct van eBay bij Channable binnen. Het gaat mis bij het **wegschrijven naar Magento**: Magento weigert het DE-adres omdat **Duitsland niet in de toegestane landen (Allow Countries) staat** voor de store/website waar de order in landt. Vandaar dat het met leverland NL wél lukt en met DE niet.

## De fix — binnen de huidige Magento-omgeving (geen nieuwe storefront nodig)
1. **Stores → Configuration → General → General → Country Options → "Allow Countries"**: voeg **Duitsland** (en eventuele andere doel-landen) toe. Let op de **scope** (rechtsboven "Store View"): zet het op de website/store view waar de Channable-koppeling in importeert, niet alleen op Default.
2. **Verzendmethode(n)**: bij de gebruikte shipping method "Ship to Applicable Countries" = *All Allowed Countries* of expliciet DE toevoegen.
3. Optioneel/controle: DE-belastingregel (19% / OSS) en verzendtarief DE — raakt de order-import niet, maar wil je wel goed hebben.

Dit is een **config-toggle van ~5 min die Hans of Luca zelf kunnen** (jullie zijn volledig admin in Magento) — geen Atvise of Niek nodig. Atvise pas inschakelen als het na de config alsnog technisch hapert. Daarna DE-testorder opnieuw versturen via "Verzend alle mislukte orders opnieuw".

## Conclusie op de storefront-vraag
Een aparte **Duitse storefront puur om facturen te sturen is overkill.** De import-blocker is niet "geen DE-storefront", maar "DE niet in Allow Countries". Een aparte DE-storefront/website heb je pas nodig als je een DE-taal frontend, DE-specifieke tax-scope of DE-factuursjablonen in Magento zelf wilt — niet om een eBay DE-order te kunnen verwerken.

## Facturatie — advies (sluit aan bij order-to-cash onderzoek)
Haal klantfacturatie **volledig weg bij Magento/ABS** en doe het extern op de eBay-order (easybill / Billbee), of stuur voor B2C niets (niet verplicht). Minder koppelingen = minder faalpunten. Magento/D365 blijft dan puur voor voorraad + orderadministratie/fulfilment.

*Live-check beperkt tot Channable (ingelogd als Luca). Magento-admin niet benaderd — geen URL/sessie beschikbaar; fix hierboven is de standaard Magento-oorzaak voor deze exacte Channable-foutmelding.*
