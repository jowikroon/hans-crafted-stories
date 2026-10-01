# Meetplan hansvanleeuwen.com — 8 KPI-groepen (batch 3, 2026-09-23)

Status: **voorstel**. Nulmetingen zijn nog niet vastgelegd; ontbrekende data blijft *onbekend*, nooit 0.
Targets zijn werkhypothesen voor 1 december 2026, geen forecasts (bron: strategie-F6-F7-en-planning.md).
Vergelijk altijd gelijke perioden, land en device. Bij lage aantallen: absolute aantallen + onzekerheid, geen %-claims.

| # | KPI | Definitie / bron | Eigenaar | Meetperiode | Nulmeting | Werkhypothese 1 dec |
|---|---|---|---|---|---|---|
| 1 | GSC-impressies merk / non-merk | Twee series; merkfilter `hans van leeuwen\|hansvanleeuwen\|jowikroon` (regex, GSC) | Hans | 28 dagen | onbekend — vastleggen W40 | non-merk +25%, merk +15% (bij voldoende volume) |
| 2 | AI-citaties | 10 vaste prompts × 3 systemen, nieuwe sessie, bron-URL bewaren. Registreer **pogingen**, **geslaagde antwoorden** en **correcte sitecitaties** apart; 429/quota = *ontbrekende meting*, niet 0 | Hans / Cowork | maandelijks | onbekend | ≥3 van 30 antwoorden met correcte sitecitatie (geen garantie) |
| 3 | Domain Rating | Eén tool, zelfde index en datum; diagnostisch | Hans | maandelijks | onbekend | baseline behouden, geen DR-sturing |
| 4 | Referring domains | Nieuwe relevante redactionele domeinen, exclusief spam | Hans | maandelijks | onbekend | +3 relevante |
| 5 | Contactconversie | `contact_form_submit` met `result=sent` (unieke sessies) ÷ relevante publieke sessies; agenda (Calendly `book_call`) apart en gededupliceerd | Hans | 28 dagen | **onbekend — kan pas na migratie contact_submissions** | 5 gekwalificeerde gesprekken cumulatief |
| 6 | LCP | Mobiel p75, 28 dagen, per routegroep (CrUX/Search Console CWV); labwaarden apart | Hans / dev | 28 dagen | onbekend | ≤2,5 s bij voldoende velddata |
| 7 | Blogsessies | Landingen op `/writing/*`, 28 dagen, intern + bots uitgesloten (GA4) | Hans | 28 dagen | onbekend | +25% bij vergelijkbare consentdekking |
| 8 | LinkedIn-profielweergaven | Profielanalytics, zelfde periode | Hans | 28/90 dagen | onbekend | +25% |

## Lead-events (gebouwd in deze branch)
Alle events gaan via `window.dataLayer` naar GTM (Consent Mode v2 regelt opslag; `index.html` laadt GTM alleen op
`hansvanleeuwen.com`, dus previews/localhost meten niet mee).

| Event | Wanneer | Parameters (whitelist) | Telt als lead? |
|---|---|---|---|
| `contact_cta_click` | klik op link naar `#contact` of `mailto:` | `cta_id` (`hero_primary`, `nav_desktop`, `nav_mobile`, `service_page`, `rates`, `case_detail`, `about_header`, anders `unlabeled`), `cta_target` (`contact_form`\|`email`), `page_path`, `lang` | nee (intentie) |
| `contact_form_start` | eerste focus in het formulier | `page_path`, `lang` | nee |
| `contact_form_submit` | na verzendpoging | `result` (`sent`\|`error`\|`invalid`\|`preview`), `reason_category` (alleen bij `sent`: `freelance`\|`job`\|`collaboration`\|`general`), `page_path`, `lang` | **alleen `result=sent`** |

Nooit in events: naam, e-mail, berichttekst, query strings. De whitelist in `src/lib/analytics/leadEvents.ts`
dwingt dat af (unit-test).

### GTM-configuratie (handmatig door Hans, niet uitgevoerd)
1. Variabelen: Data Layer Variables `cta_id`, `cta_target`, `page_path`, `lang`, `result`, `reason_category`.
2. Triggers: Custom Event `contact_cta_click`, `contact_form_start`, `contact_form_submit`.
3. Tags: GA4 Event per trigger met bovenstaande parameters; registreer ze als custom dimensions in GA4.
4. Key event in GA4: `contact_form_submit` **met conditie `result = sent`** (maak een afgeleid event
   `generate_lead` via GA4 → Events → Create event, conditie `event_name = contact_form_submit` en `result = sent`).
5. Test in GTM Preview op productie ná de contact-migratie; `result=preview` hoort in productie niet voor te komen.

## Route-audits EN én NL (voorstel, n8n niet gewijzigd)
De SEO-audit-workflow (n8n `h8BLbQBENtfmi2MQ`, Paginalijst) is volgens de vault al aangepast voor
`/nl/bol-com-consultant`. Voorstel: dezelfde paginalijst uitbreiden met de NL-tegenhangers
`/nl`, `/nl/about`, `/nl/work`, `/nl/rates`, `/nl/amazon-nl-specialist`, `/nl/interim-ecommerce-manager`,
`/nl/ai-ecommerce-automation`, `/nl/writing` en de nieuwe case `/work/marketplace-product-data-automation` (+ `/nl/…`).
Eerst de bestaande Bol-wijziging valideren; niet dubbel doorvoeren. Wijzigen in n8n = Hans.

## Redactioneel: lange blogtitels (werkgrens 60 tekens, geen harde regel)
| Slug | Getoonde titel | Tekens | Voorstel |
|---|---|---:|---|
| wat-kost-een-interim-ecommerce-manager-2026 | Wat kost een interim e-commerce manager in 2026? Tarieven en rekensom | 69 | "Interim e-commerce manager: tarieven 2026 en rekensom" (54) |
| designing-with-llms | Designing with LLMs: A UX Framework for E-commerce \| Hans van Leeuwen | 69 | merknaam weglaten in meta_title (template voegt die al toe) → 50 |
| waarom-marketplace-listings-niet-converteren | Waarom je marketplace-listings niet converteren \| Hans van Leeuwen | 66 | idem → 47 |
| amazon-vs-bol-com-2026-nederland | Amazon vs Bol.com 2026: Kiezen als Nederlandse Verkoper | 55 | ok |
| ai-agent-verzint-succes | AI-agent verzint succes: audit van 50% valse meldingen | 54 | ok (eigen meting, geen klantcijfer) |

Relevantie en zoekintentie gaan vóór afkappen. Niet opgenomen in de CMS-patch; keuze voor Hans.

## Contentkalender W39–W50
Volgt `strategie-F6-F7-en-planning.md` (optie A: 10 stukken vóór december, 2 nazorg). Geen publicaties ingepland,
geen automatische posts aangemaakt. Elke casus: afgebakend, bron/meetperiode, geen herleidbare klantcijfers.

## Dashboard-items met ontbrekende screenshots
De zes open `seo_action_items` (echte screenshots nodig) blijven open tot er bewijs is; geen gegenereerde beelden
als bewijs gebruiken.
