---
title: D365-veld zelf beantwoord + T&T-plan (n8n gebouwd, no-API route bewezen)
date: 2026-07-28
scope: [CCP]
topics: [eBay-DE-Launch, Channable-D365-Integration]
status: klaar voor besluit
---

# Antwoord op de Dylan-vraag, zonder Dylan

**De vraag (mail Hans → Dylan/Atvise, 22-07):** shipments worden automatisch aangemaakt ("Verzonden via API") maar track_number blijft leeg. Kan het DPD-nummer bij shipment-aanmaak in sales_shipment_track? En: waar komt dat nummer binnen aan jullie kant — welk D365-veld?

## Het zelf-afgeleide antwoord

**Het DPD-nummer staat in D365 op de pakbon, per collo (container) — niet op de order.**

Bewijsketen, zonder één vraag aan Atvise of Niek:

1. ABS' eigen klant-API bewijst waar het veld zit: `GET api.abs-bv.com/v2/packingslip/list` retourneert per pakbon `containers[].tracking.tracking_number` (+ `tracking_url`, `tracking_code`). Die API leest D365. Als de API het per pakbon-container serveert, ligt het daar in D365 vast. (ABS API v2-docs, gelezen 11-07.)
2. De pakbon linkt 1-op-1 aan onze kant: `order_reference` = Magento increment_id (144013xxx) — het "Your reference"-veld op de ABS-order.
3. De portal bevestigt het live: `abs-bv.shop/…/tracktrace/<PAKBONNR>` → redirect naar DPD met het 14-cijferige parcelNumber. Geverifieerd op 3 pakbonnen (o.a. NLPS260086224 → 05112095164869, exact het nummer dat later handmatig in Magento is gezet).
4. D365-variant: de container-structuur per pakbon past bij **Dynamics 365 F&O/SCM met warehouse-containers** — Business Central kent geen containers [sterke hypothese, niet intern geverifieerd]. Voor de fix maakt dit niet uit: de pakbon-API is de bron, welke interne tabel D365 ook gebruikt.

## Wat de Magento-forensiek vandaag bewees (volledige admin-toegang, read-only via REST)

| Vondst | Bewijs |
|---|---|
| Shipment-aanmaak is een **extern systeem**, geen Magento-module | Volledige modulelijst (462) bevat géén D365/ERP-connector; wel 10 Atvise_*-modules, geen daarvan shipment-gerelateerd |
| Draait op een **15-minuten-cron** | Alle shipments aangemaakt op :00/:15/:30/:45 (+12–20 sec) |
| Stuurt **kaal** payload: items + comment "Verzonden via API", notify=1 | Volledig shipment-record: packages [], tracks [], geen extension_attributes, geen pakbonnr |
| Heeft **nooit** tracks meegestuurd | 0 tracks op laatste 50 shipments vóór juni; 959 shipments totaal, slechts 5 met track |
| De 5 bestaande tracks = handmatige backfill | Track-timestamps dagen ná shipment; 2 stuks binnen 2 min op 11-07 19:34–19:36 (backfill-sessie) |

**Conclusie voor Dylan/Atvise, in één zin:** het nummer dat jullie nodig hebben staat op dezelfde pakbon die jullie 15-min-job al aanleiding geeft om de shipment aan te maken — per container, als tracking_number; neem het mee als `tracks[]` in dezelfde `POST /V1/order/{id}/ship`-call (`carrier_code: custom`, `title: DPD`), dan is er geen tweede systeem nodig.

---

# De drie routes — status per vandaag

## Route 1 · Atvise fixt de bron (loopt, wacht op antwoord)
Mail 22-07 verstuurd. Blijft de nette oplossing: één call, één systeem. Dit document geeft Hans het antwoord op hun wedervraag vóórdat ze hem stellen.

## Route 2 · n8n workflow — GEBOUWD (inactief)
**"CCP TT-sync — ABS API → Magento shipment-track"** — n8n workflow `cGvv59aApUdTBb5U`.

Elk uur: ABS packingslip/list (laatste 4 dagen) → DPD-nummers filteren op onze ordernummers → per track: Magento order + shipment opzoeken → **idempotent** (bestaande tracks overgeslagen) → `POST /V1/shipment/track`. Samenvatting per run in de executie-log.

Onderzoeksconclusie — is dit een oplossing? **Ja, technisch volledig.** Drie kanttekeningen:
1. **Blokkeert op hetzelfde als alles: het ABS API-token.** Aanvragen via ABS sales manager blijft stap 1 van elke API-route.
2. **Er staat al een identieke pijp in Supabase** (abs-track-harvest → magento_track_queue → magento-track-push, gebouwd 11-07, ook wachtend op datzelfde token). Kies er één, niet beide — dubbele tracks. n8n wint op observability (executie-historie, retry-UI, error-workflow); Supabase wint op bewezen Cloudflare-toegang (edge-IP werkt, VPS-IP onbekend — vandaag getest: Cloudflare blokkeert onbekende datacenter-IPs op connectcarparts.nl).
3. Activatie = 2 credentials vullen in n8n ("ABS API Token (query)" + "Magento API (Bearer)", zelfde token als cms_secrets) + 1 testrun om de echte ABS-response-envelope te bevestigen.

## Route 3 · Zonder ABS API, met huidige setup — BEWEZEN HAALBAAR, nog niet gebouwd
Vandaag getest: de ABS-portal-login is een kaal Laravel-formulier (e-mail + wachtwoord + CSRF-token uit de pagina), **zonder captcha**. Dat betekent: de portal-harvest kan als gewone n8n HTTP-flow, zonder browser, zonder Claude, zonder ABS-medewerking:

1. GET login-pagina → CSRF-token + cookie
2. POST login (portal-credentials uit n8n-credential)
3. GET pakbonlijst → pakbonnr + "Your reference" (= increment_id)
4. Per pakbon: GET `tracktrace/<PAKBONNR>` zonder redirect-follow → DPD parcelNumber uit de Location-header (URL is auth-gated, geverifieerd — dus sessie nodig, maar deterministisch)
5. Zelfde Magento-push als Route 2.

Dit is de enige route die vandaag te activeren is zonder iemand anders. Kost één beslissing: CCP-portalaccount-wachtwoord als n8n-credential opslaan. Zeg "bouw route 3" en hij staat er — als extra branch in dezelfde workflow.

---

# Besluit voor Hans

| Vraag | Advies |
|---|---|
| Wat sturen we Atvise? | Niets nieuws — antwoord op hun wedervraag ligt klaar (dit doc, sectie 1) |
| n8n of Supabase-pijp bij ABS-token? | n8n (observability); Supabase-functies dan op skip laten of crons uit |
| Nu al T&T zonder token? | Route 3 laten bouwen — enige afhankelijkheid is het portal-wachtwoord in n8n |

Gerelateerd: [[Channable-D365-Integration]] · [[eBay-DE-Launch]] · `2026-07-25-ccp-abs-tt-integratie-concepten.md` · `2026-07-21-TT-backfill-workaround-status-activatie.md`

*Opruiming: tijdelijke read-only forensic-proxy (Supabase edge function magento-forensic-ro) is geneutraliseerd (410-tombstone); mag via dashboard verwijderd.*
