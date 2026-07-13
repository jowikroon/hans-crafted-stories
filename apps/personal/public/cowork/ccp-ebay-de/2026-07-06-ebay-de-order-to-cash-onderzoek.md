# eBay DE — wat er écht nodig is per klantorder (order-to-cash onderzoek)

*CCP / A.B.S. · 2026-07-06 · onderzoek voor Hans van Leeuwen · scope: klantfactuur/mail, retouren, gemiste marketplace-manager randzaken · bron: eBay-hulppagina's + IT-Recht Kanzlei + easybill/Billbee (zie bronnen)*
*Let op: btw/factuur is finance/legal — feitelijk weergegeven, laat het finale oordeel over factuurplicht + OSS-tarief door Sjoerd/belastingadviseur bevestigen.*

## Kernconclusie (beslissingsrelevant)

**Voor de klant-facing kant van een eBay DE-order heb je Magento, ABS of DPD niet strikt nodig om een mail/factuur te sturen. eBay dekt zelf de verplichte klantcommunicatie:**

- **Bestelbevestiging** naar de koper → **eBay stuurt die automatisch** (met verzendkosten + verwachte leverdatum). IT-Recht Kanzlei bevestigt dat de automatische eBay-bevestiging juridisch volstaat als orderbevestiging.
- **Verzend-/trackinginfo** naar de koper → **eBay mailt de koper zodra jij het trackingnummer aan de eBay-order koppelt.** Dat trackingnummer is precies de T&T-terugflow (ABS API → Magento → Channable) — of als fallback handmatig in Seller Hub.
- **Klantfactuur** → **voor B2C (particulier) is een factuur in Duitsland NIET wettelijk verplicht.** Voor B2B (zakelijke koper) wél, binnen 6 maanden op verzoek. Kleinunternehmer-status maakt niet uit.
- **Retour** → **eBay orchestreert label + RMA + refund;** wij ontvangen het pakket fysiek en verwerken/refunden, net als een webshopretour.

**Gevolg:** de Magento-DE-storefront + DE-facturatie is nodig voor ónze eigen orderverwerking en een CCP-eigen (DE) factuur, maar blokkeert **niet** de mogelijkheid om maandag klanten correct te bedienen op eBay DE. De klantfactuur kun je bovendien loskoppelen van Magento via een eBay-gekoppelde factuurtool (zie onder) — precies zoals Bolmate dat voor Bol doet.

---

## 1 · Wat gebeurt er per klantorder — wie stuurt wat

| Stap | Wie stuurt / doet het | Nodig van ons? | Status in onze setup |
|---|---|---|---|
| Bestelbevestiging naar koper | **eBay** (automatisch) | Niets | ✔ Automatisch |
| Betaling innen | **eBay Managed Payments** (koper betaalt eBay, eBay betaalt uit naar onze bank) | Bankrekening + payout-instelling gekoppeld | Check payout-config |
| Order naar onze administratie | Channable → Magento (→ D365) | Order-sync "Complete" actief + Magento accepteert DE (Allow Countries) | 🔄 Hans/Luca (zelf, Magento-admin) |
| Verzendlabel (DPD) | Wij (DPD DE-label) | DPD-tarief + label werkend | 🔄 Hans / Sjoerd |
| Verzend-/trackingmail naar koper | **eBay** (zodra trackingnr. op de eBay-order staat) | Tracking terug naar eBay: ABS API→Magento (Niek) → Channable→eBay (Hans) | 🔄 Niek (ABS) + Hans |
| Klantfactuur | Optioneel: eBay-factuurtool / Magento / ABS | **B2C: niet verplicht.** B2B: verplicht | Zie §2 |
| Retour + refund | **eBay-managed** (label + RMA) + wij fysiek verwerken | Retourbeleid + retouradres ingesteld | 🔄 Zie §3 |

---

## 2 · Klantfactuur — verplicht? En hoe zonder Magento?

**Wettelijk (DE):**
- **B2C / particulier: geen factuurplicht.** Een consument heeft geen recht op een (btw-)factuur; de eBay-bestelbevestiging volstaat als bewijs van de koop.
- **B2B / zakelijke koper: factuurplicht**, uit te reiken binnen 6 maanden (meestal op verzoek). Geen controleplicht of de koper zakelijk is.
- Kleinunternehmer-regeling verandert de factuurplicht niet (voor CCP niet relevant — CCP is btw-plichtig, OSS-traject loopt).

**Praktisch — de Bolmate-voor-eBay-vraag:**
Ja, dat bestaat. eBay-gekoppelde factuur-/administratietools maken per order automatisch een klantfactuur en mailen die naar de koper — **direct op de eBay-order, buiten Magento om.** De belangrijkste:

- **easybill** — koppelt direct aan het eBay-account, importeert orders, maakt automatisch factuur, mailt die met instelbare vertraging (1–14 dagen), aparte tekst per marketplace (Amazon/eBay/shop), bijlagen instelbaar. Ondersteunt OSS/leverdrempel-bewaking en DE-tarief.
- **Billbee** — multichannel (eBay, Amazon **én bol.com**), automatische factuur + verzending, koppelt door naar sevDesk/boekhouding. **Consolidatie-optie:** één tool voor Bol én eBay i.p.v. Bolmate + los eBay.
- **billware / sevDesk / BuchhaltungsButler** — vergelijkbare eBay-boekhoud/factuur-automatisering.

**Reviews/Bewertung:** agressieve losse "review-mails" mogen niet; eBay stuurt zelf een Bewertungserinnerung. Wel toegestaan: een nette review-uitnodiging als tekst/bijlage meesturen met de factuurmail (easybill/Billbee ondersteunen custom tekst + bijlage). Dat is het legitieme "reviewfactuur"-pad.

**Advies:** ontkoppel de klantfactuur van de Magento-NL-beperking. Kies een eBay-gekoppelde tool (Billbee als je Bol + eBay wilt bundelen; easybill als je puur eBay/DE-boekhouding wilt). Dan is de klantfactuur maandag geregeld, onafhankelijk van de DE-storefront-timing. **Besluit factuurpad ligt bij Sjoerd/finance** (CCP-eigen factuur via tool vs. ABS-factuur) — leg dat als knoop bij hem.

---

## 3 · Retouren — kunnen wij dit als webshop zelf verwerken?

**Ja.** eBay-managed returns werkt zo:
- Voldoet een retouraanvraag aan jouw ingestelde retourbeleid → **automatisch geaccepteerd.**
- **Artikelwaarde ≥ €12** → eBay stuurt de koper automatisch een **DHL- of Hermes-retourlabel** (afhankelijk van welke provider je kiest).
- **RMA = het eBay-ordernummer** (staat als tekst + barcode op het label). Eigen RMA-nummers kunnen niet meer.
- Past een pakket qua gewicht/maat niet bij DHL/Hermes (schijven >5 kg!) → **"Eigenes Etikett hochladen"**: je uploadt zelf een DPD-retourlabel.
- Retour komt fysiek bij ons binnen (NL-adres of DE-hub) → wij controleren en **refunden via eBay**. Wie de retourkosten draagt hangt af van reden + jouw beleid.

**Wat wij moeten instellen:** retourbeleid (bv. 30 dagen), retouradres, gekozen retourprovider, en iemand die fysiek verwerkt + refund fiatteert. Dit is dezelfde logica als een webshopretour — je instinct klopt.

---

## 4 · Gemiste randzaken die bij jou als marketplace manager horen

Buiten titels/omschrijvingen/listing-selectie zijn dit de zaken die nu niet of half in scope stonden voor eBay DE:

**Operationeel / account**
- **Business Policies** compleet: Shipping (handling ≤2 dgn, Kombiversand), Payment, **Return** — opgeslagen en aan álle listings gekoppeld.
- **Payout-config** (eBay Managed Payments): bankrekening, uitbetaalschema, evt. reserves voor nieuwe verkopers, valuta EUR.
- **Handling time / levertijd** realistisch (DACH Late-Shipment-Rate ≤3%).
- **Voorraad/out-of-stock-control** — voorkom verkoop van niet-leverbaar door de ~5 min sync-mismatch (Magento-config: Hans/Luca zelf; puur technisch/integratie → Atvise).

**Klantinteractie / metrics**
- **eBay Messages**: reactietijd bewaken (telt mee voor serviceniveau/Verkäufer-Cockpit).
- **Cases**: "Artikel nicht erhalten" (INR) en "Nicht wie beschrieben" (SNAD), annuleringen, refunds — proces + eigenaar.
- **Tracking-upload-discipline**: geldig trackingnr. tijdig op elke order (beschermt Late-Shipment-Rate + valid-tracking-rate). Hangt op de T&T-flow.
- **Verkäufer-Cockpit / seller level** monitoren: defect rate, cases zonder oplossing, verzendstiptheid.

**Compliance (deels Sjoerd, maar jij moet checken dat listings kloppen)**
- **GPSR** (verplicht sinds 13-12-2024): Responsible Person + fabrikantgegevens op **elke listing én verpakking** — A.B.S. All Brake Systems B.V., Tinbergenlaan 7, 3401 MT IJsselstein. Check de **eBay Compliance Dashboard** in Seller Hub op geflagde listings (grace periods zijn in 2026 grotendeels verlopen).
- **OSS vs lokale btw**: verzenden we alleen vanuit NL → OSS volstaat en je rekent **19% DE-btw** op listing + factuur. Zodra er voorraad in DE ligt → apart DE-btw-nummer nodig. (Finance/Staxxer-traject.)
- **VerpackG/LUCID + Lizenzero** (Sjoerd). Brake parts: geen WEEE/batterij-registratie nodig (geen elektronica).

**Groei (na live)**
- **Promoted Listings (Anzeigen)** — start ~2–5% ad-rate, pas ná content-check.

---

## 5 · Advies / beslispunten voor deze week

1. **Klant-facing is maandag haalbaar zonder de DE-storefront**: eBay dekt bevestiging + trackingmail; factuur is B2C niet verplicht. Zet dat vast; de Magento-config (Allow Countries) kunnen Hans/Luca zelf, dus dat is geen externe go-live-blocker voor de klantkant.
2. **Kies een factuurtool** (Billbee = Bol + eBay in één, of easybill = eBay/DE-focus) en leg het factuurpad-besluit bij Sjoerd. Dit haalt de klantfactuur weg bij de Magento-NL-beperking.
3. **Zet retouren op**: beleid + retouradres + provider; wij verwerken fysiek als webshopretour, refund via eBay.
4. **Sluit de account-randzaken**: Business Policies volledig gekoppeld, payout-config, GPSR-check in het Compliance Dashboard, tracking-upload-discipline.
5. **Ownership scherp**: Magento-config (Allow Countries / DE-verzending) doen **Hans/Luca zelf** (jullie zijn admin) — geen externe afhankelijkheid. **Atvise** = shop online/technische werking/features/updates. **Niek = alleen ABS API** (T&T uit ABS API → Magento-velden). De klantfactuur haal je liever extern (tool), niet via Magento/ABS.

---

## Bronnen
- [eBay.de Rechtsportal — gewerbliche Verkäufer](https://pages.ebay.de/rechtsportal/gewerbliche_vk_3.html)
- [IT-Recht Kanzlei — Automatische Bestellbestätigung durch eBay ausreichend](https://www.it-recht-kanzlei.de/Kommentar/15869/Automatische_Bestellbestaetigung_durch_Ebay_ausreichend.php)
- [IT-Recht Kanzlei — Rechnung meistens nicht erforderlich (B2C)](https://www.it-recht-kanzlei.de/Kommentar/918/Rechnung_ist_meistens_ueberhaupt_nicht_erforderlich..php)
- [eBay — Sendungsverfolgung für verschickte Artikel hinzufügen](https://www.ebay.de/help/selling/shipping-items/verschickte-artikel-verfolgen?id=4088)
- [eBay — Rücksendungen für Verkäufer](https://www.ebay.de/help/selling/managing-returns-refunds/return-shipping-sellers?id=4703)
- [eBay Verkäuferportal — Automatische Abwicklung von Rückgaben](https://www.ebay.de/verkaeuferportal/rueckgaben/rueckgabeprozess)
- [easybill — eBay Rechnungen automatisch erstellen & versenden](https://www.easybill.de/en/ecommerce/marketplace/ebay/)
- [Billbee — eBay-Rechnungen automatisch + multichannel (incl. bol.com)](https://www.billbee.io/en/invoices/ebay)
- [GPSR Requirements for eBay Sellers 2026](https://eugpsr.eu/blog/gpsr-ebay-sellers)
- [eBay Seller Center — General Product Safety Regulation](https://www.ebay.com/sellercenter/resources/general-product-safety-regulation)
- [German VAT Registration Guide 2026 (OSS vs local stock)](https://www.vatai.com/blog/germany-vat-registration-guide-2026)
