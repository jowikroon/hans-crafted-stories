# Geïnformeerd, niet ontdekken — AI-operatie Connect Car Parts

*Voor: directie · Van: Hans · 14 juli 2026 · elk cijfer heeft een bron; aannames zijn gemarkeerd met \* · classificatie: internal*

---

## Kern

De afgelopen drie maanden is drie keer op drie verschillende disciplines gebleken dat wij fouten van onze technische leverancier zelf moesten ontdekken in plaats van erover geïnformeerd te worden — met als zwaarste geval een shipment-koppeling die twee maanden op 99,8% faalratio draaide en een productie-incident dat alle verkoopkanalen een werkdag platlegde. Het eigen team heeft elk van die problemen zelf gevonden, gediagnosticeerd en opgelost met AI-tooling die al binnen het bestaande abonnement draait, en heeft daar inmiddels dagelijkse geautomatiseerde bewaking omheen gebouwd. Dit document onderbouwt met cijfers wat de oude werkwijze heeft gekost, wat de nieuwe werkwijze aantoonbaar heeft opgeleverd, en vraagt één besluit: een vast, klein AI-budget voor CCP zodat "wij worden geïnformeerd" de standaard wordt op elk kanaal.

---

## 1 · Waarvoor Atvise is aangenomen

Het doel van de leveranciersrelatie was ontzorging: een externe partij bewaakt de techniek zodat het eigen team zich op commercie richt.

| Mandaat | Afgesproken doel |
|---|---|
| Technisch beheer Magento | Platform stabiel houden: techniek, werking, features, updates, integratie-onderhoud — inclusief de D365→Magento shipment-koppeling |
| SEA/SEO (tot april) | Rendement op advertentiebudget |

*Bron: rolverdeling zoals vastgelegd in het Atvise-dossier 11-07, §1.*

## 2 · Mandaat versus realiteit

Elke regel hieronder is een directe tegenspraak tussen wat de leverancier moest doen en wat er feitelijk gebeurde. Elke regel is door het eigen team ontdekt — niet door de leverancier gemeld.

| Afspraak | Realiteit | Bron |
|---|---|---|
| Shipment-koppeling onderhouden | 888 van 890 zendingen zonder trackingnummer (99,8%), twee maanden onopgemerkt; root cause (`tracks`-array ontbreekt in ship-call) door eigen team gevonden | Magento REST API-analyse 11-07 |
| Platform stabiel houden | Onaangekondigde wijziging op live (7 juli): alle verkoopkanalen op 0 producten, 13 order-import-errors, 1 werkdag verloren, rollback op ons verzoek | Incident-A4 08-07, Channable-API geverifieerd |
| Integraties bewaken | 17 Channable platform_failure-errors onopgemerkt opgestapeld; fulfillments leeg op vrijwel alle orders | Channable orders-log 11-07 |
| Kwaliteitscontrole bij updates | Update-checklist door bureau "groen" afgevinkt; bij Luca's eigen verificatie in Magento kwamen meerdere punten niet groen uit | Bevinding Luca, CEO-rapport 11-07 |
| Rendement op ads (mandaat tot april) | Fee-to-spend 67% (marktnorm 10–20%), ROAS 1,08 ex-brand, 64,9% van het Search-budget zonder één conversie, eigen bestseller Brembo zelf geblokkeerd | Google Ads-audit 17–20 april |
| Verantwoord beheer | Superuser-toegang zonder audit trail: activiteit tijdens het incident van 7–8 juli is niet reconstrueerbaar | Magento Users-grid 11-07 |

Het patroon is steeds hetzelfde: de fout loopt maanden door, wordt zichtbaar zodra wij zelf in de data duiken, en de rapportage van het bureau bleek geen betrouwbare bron. Dat laatste — een controle die "in orde" meldt terwijl dat aantoonbaar niet zo is — weegt het zwaarst, omdat het de basis onder elke toekomstige rapportage wegneemt.

## 3 · Wat het heeft gekost

Geverifieerde momenten van waardeverlies, met de financiële vertaling. Bedragen met \* zijn gemarkeerde aannames of berekeningen op bestaande cijfers; er staan geen verzonnen bedragen in dit document.

| Moment | Wat er gebeurde | Financiële impact |
|---|---|---|
| **mei–juli** (2 maanden) | 99,8% van de zendingen zonder tracking naar de klant | Direct risico op valid-tracking-rate en Late-Shipment-metrics (DACH-norm ≤3%) — dit raakt zichtbaarheid en **verkooprecht** op eBay/Amazon, dus potentieel 100% van de marketplace-omzet |
| **6 juli** | DE-testorders faalden op order-import (Allow Countries); door eigen team gediagnosticeerd en gefixt | Vertraging go-live-window eBay DE; diagnose-uren bij ons i.p.v. leverancier |
| **7 juli** | Feed op 0 op álle kanalen (Amazon NL, Google Shopping, Bol, eBay), 13 order-errors, één werkdag team verloren | ± €140–150 directe dagomzet at risk (run-rate YTD €18.947/19 wkn)\* + €500–750\* teamdag + go-live eBay DE in gevaar in de week vóór de stakeholdermeeting |
| **jan–apr** | 64,9% van het Search-budget zonder conversie bij ±€3.205/mnd spend | Indicatief ±€2.000\*/mnd verspilde ad-spend in de gemeten periode, plus 67% fee-to-spend |
| **doorlopend** | Consent Mode granted rate 0% (doel >80%): attributie en biedoptimalisatie blind | Gerapporteerde ROAS onbetrouwbaar; PMax-voorbeeld: €282 spend → 2 conversies |
| **doorlopend** | Beheercontract Magento | € \_\_ per maand (bedrag uit contract) zonder aantoonbare monitoring-tegenwaarde |

De grootste post staat niet in euro's in de tabel: twee maanden lang wisten wij niet wat onze eigen klanten meemaakten. Geen trackingmail, geen signaal, geen rapportage. Wij kwamen erachter — de klant en de marketplace-metrics wisten het eerder dan wij.

## 4 · Wat intern al bewezen is

Geen plan, maar een gedraaid resultaat. Alles hieronder is gebouwd met de bestaande AI-tooling (Claude Cowork + eigen server), zonder extra investering, en is gedocumenteerd in het vault-logboek.

| Datum | Resultaat |
|---|---|
| 7 juli (middag) | Oorzaak storeview-incident + tracking-faalratio gevonden; wat het bureau in 2 maanden niet zag, in één middag gediagnosticeerd |
| 11 juli | Fix 3× bewezen tot op de eBay-order: tracking van injectie tot zichtbaar bij de koper in **11 minuten** |
| 11 juli | Automatische track-injectie-keten live: elke 30 minuten worden open shipments gecontroleerd en aangevuld; tracking-bron bij ABS-portal aangetoond en geautomatiseerd geoogst |
| sinds 10 juli | Dagelijkse go-live-audit eBay DE (07:25) met append-only bewijslog — elke checklist-status is verifieerbaar, het omgekeerde van een afgevinkt lijstje |
| doorlopend | Dagelijkse infra-health-check + watchdog met alerts naar WhatsApp/Slack; ochtend-brief; wekelijkse CEO-statusdeck; concurrentie-radar |
| doorlopend | Channable-verrijking (technische specs, geïsoleerd van bestaande mappings), Bol-titelregels actief op 2.207 van 2.228 producten |

## 5 · Het verschil in werkwijze

Dit is de kern van het voorstel, in één regel: **wij worden geïnformeerd — wij ontdekken niet meer achteraf.** Elk verkoopkanaal en elke koppeling krijgt een dagelijkse geautomatiseerde controle met alert. Concreet betekent dat het einde van zes dingen die we dit kwartaal wél hebben meegemaakt:

| Nooit meer | In plaats daarvan |
|---|---|
| Twee maanden onopgemerkte faalratio | Dagelijkse check "shipments zonder track > 24 uur" met alert — draait |
| Kanalen op 0 zonder dat iemand het merkt | Dagelijkse feed- en kanaalcontrole (Amazon, eBay, Bol, Google Shopping, webshop) |
| Fouten die zich stil opstapelen | Channable-errorteller met drempel-alert |
| Checklists "groen" zonder bewijs | Elke controle schrijft een bewijslog; status zonder bron telt niet |
| Wijzigingen op live zonder aankondiging | Change-stop + audit trail op admin-activiteit |
| Rapportages die we niet kunnen verifiëren | Elk cijfer herleidbaar naar bron — zoals in dit document |

## 6 · Kosten en besluit

| Post | Nu | Voorstel |
|---|---|---|
| Beheercontract Atvise (Magento) | € \_\_ (uit contract) | € 0 |
| **AI-operatiebudget CCP** (bestaand abonnement ~€180 + marge API-verbruik monitoring-agents) | € ~180 | **€ 250\*** vast per maand |
| Vangnet core-updates/security-patches (on-demand, andere partij) | — | € 150–300\* equivalent |
| Automatisering op eigen server (n8n, Supabase) | — | € 0 |
| Incidentkosten (type 7 juli) | € 650–900\* per incident | ↓ structureel door dagelijkse bewaking |
| **Netto** | | **besparing = contractbedrag − €400–550\*** |

**Besluit gevraagd:**

1. **AI-operatiebudget CCP bevestigen als vaste post: €250\*/mnd** — gedekt uit het te beëindigen/af te schalen Atvise-contract; bij een gangbaar beheercontract per direct netto positief.
2. **Monitoring-standaard vaststellen:** geen kanaal of koppeling zonder dagelijkse geautomatiseerde controle met alert en bewijslog. De eerste controles draaien al; de rest wordt binnen het budget uitgebouwd.
3. **Smal on-demand vangnet** voor Magento core-updates en security-patches bij een andere partij (offerte volgt); geen vast contract.

---

*Volledig bewijsdossier beschikbaar: Atvise-dossier 11-07 (tijdlijn, logins, 99,8%-analyse), CEO-rapport 11-07 (incl. Google Ads-auditcijfers april en checklist-vergelijking), Incident-A4 08-07, Channable/Magento API-analyses, vault-logboek. Elk genoemd cijfer is daarin herleidbaar; bedragen met \* zijn aannames of berekeningen op die cijfers.*
