# Magento SMTP Blacklist Audit — 15 juli 2026

**Scope:** Amasty SMTP Email Settings v2.3.0 op connectcarparts.nl  
**Doel:** Verificatie dat eBay-alias-adressen (`*@members.ebay.com/de/nl`) geblokkeerd worden door de Amasty blacklist  
**Methode:** Directe browser-inspectie Magento admin (`/atvise/admin/`) als user "hans"  
**Status:** Configuratie correct — effectiviteit nog niet 100% bewezen

---

## 1. Bevindingen

### A. SMTP Transport (volledig geverifieerd)

| Setting | Waarde |
|---|---|
| Extension | Amasty SMTP Email Settings v2.3.0 |
| Enable SMTP For E-mail | **Yes** |
| Provider | Office365 |
| Server | smtp.office365.com |
| Port | 587 |
| Auth | OAUTH2 Client ID (Microsoft) |
| Sender (SMTP auth) | info1@abs-bv.nl |
| Application (Client) ID | 13446a06-3d51-4d2d-9fa9-4dfd39854394 |
| Directory (Tenant) ID | 4c9e03cd-bd60-4a51-9d9e-da5bab7e4ed6 |
| Connection Security | TLS |
| Sender in verzonden mail | info@connectcarparts.com (Magento Store Email) |

**Conclusie:** Alle Magento transactional email loopt via Amasty SMTP → Office365. Niet via sendmail. De native Magento transport config (sendmail/localhost:25) wordt overruled door Amasty.

### B. Blacklist configuratie

| Setting | Waarde |
|---|---|
| Enable Blacklist | **Yes** ✅ |
| Aantal entries | 3 |

**Blacklist entries:**

| ID | Pattern |
|---|---|
| 1 | `*@members.ebay.com` |
| 2 | `*@members.ebay.de` |
| 3 | `*@members.ebay.nl` |

**Conclusie:** Blacklist staat AAN met correcte wildcard-patronen voor alle drie eBay-domeinen.

### C. Effectiviteitsbewijs — ONVOLLEDIG

De Sent Emails Log toont **1 record**:

| Veld | Waarde |
|---|---|
| Datum | Jul 15, 2026 11:45:14 AM |
| Subject | Uw Connect Car Parts BV bestelling is verzonden |
| Recipient | 23dba13d7aac8523ba97@members.ebay.com |
| Sender | info@connectcarparts.com |
| Status | **Successfully Sent** ❌ |

**Interpretatie:** Dit is een shipment notification die succesvol is verzonden naar een `@members.ebay.com` adres ondanks de actieve blacklist. Er zijn twee mogelijke verklaringen:

1. **Timing:** De mail is verzonden om 11:45 AM, mogelijk VÓÓRDAT Hans de blacklist activeerde (hij heeft "Enable Blacklist" van Off naar On gezet tijdens een eerdere sessie vandaag). Als de blacklist pas daarna is ingeschakeld, is dit verwacht gedrag.
2. **Config cache:** Magento cached configuratiewaarden. Hoewel Cache Management 18 caches toont die allemaal ENABLED (groen) zijn en geen INVALIDATED status hebben, is het mogelijk dat de blacklist-wijziging nog niet door de config cache is gepropageerd.

**Er is nog geen bewijs dat de blacklist daadwerkelijk een e-mail heeft GEBLOKKEERD.** Dat bewijs komt pas als een nieuwe eBay-order binnenkomt en de bijbehorende e-mail NIET in de Sent Emails Log verschijnt.

### D. Debug & Log status

| Setting | Waarde | Opmerking |
|---|---|---|
| Log Outgoing Mail | Yes | ✅ Goed voor monitoring |
| Enable Debug Mode | **Yes** | ⚠️ **Moet OFF op productie** |
| Debug Log entries | 43 pagina's | Bevat `amsmtp/transport::sendMessage()` entries |
| Clear Sent Emails Log After | 30 dagen | OK |
| Clear Debug Log After | 30 dagen | OK |
| Send Test E-mail To | ict@atvise.nl | Atvise test-adres |

### E. Cache Management

Alle 18 cache types staan op ENABLED (groen). Geen INVALIDATED caches gedetecteerd. Dit is ambigue — het kan betekenen dat de config clean is, of dat er nog geen flush heeft plaatsgevonden na de blacklist-wijziging.

---

## 2. Actiepunten

### URGENT — Verificatie blacklist

**Optie A (passief, aanbevolen):** Wacht op de volgende eBay DE order. Check daarna de Sent Emails Log:
- Verschijnt er GEEN mail naar `*@members.ebay.*` → blacklist werkt ✅
- Verschijnt er WEL een mail → blacklist werkt niet, escaleer

**Optie B (actief):** Stuur een test-email vanuit Magento naar een `test@members.ebay.com` adres via de "Send Test E-mail" functie in Amasty SMTP:
- Mail geblokkeerd → bevestigd werkend
- Mail verzonden → config cache flushen nodig

### SHOULD — Config cache flush

Flush de Magento config cache als extra zekerheid dat de blacklist-wijziging actief is:
- **Pad:** System → Cache Management → Selecteer "Configuration" → Actions: Flush → Submit
- **Risico:** Laag. Config cache flush is safe op productie. Geen downtime.
- **Let op:** Magento productie = RED zone per Hans's regels. Hans moet dit zelf doen of expliciet "go" geven.

### SHOULD — Debug Mode uitzetten

`Enable Debug Mode: Yes` staat aan op productie. Dit:
- Schrijft extra logging die performance kost
- Heeft 43 pagina's aan debug entries opgebouwd
- Hoort op productie **UIT** te staan

**Actie:** Amasty → SMTP Email Settings → Configuration → Enable Debug Mode → **No** → Save Config

### NICE TO HAVE — Monitoring

Zet een dagelijkse check op de Sent Emails Log (via n8n of scheduled task) die controleert of er mails naar `*@members.ebay.*` adressen zijn verstuurd. Alert als dat het geval is.

---

## 3. Relatie met Problem B (Track & Trace)

De T&T injection chain draait autonoom elke 30 minuten sinds 11 juli. De volledige keten is bewezen:

```
Magento track injection → Channable fulfillment sync → eBay tracking update (11 min)
```

Dit staat los van de e-mail blacklist, maar is relevant omdat:
- De shipment notification ("bestelling is verzonden") die in de Sent Emails Log staat, is het directe gevolg van een shipment creation in Magento
- Als de blacklist werkt, voorkomt die dat deze mails naar eBay-klanten gaan — eBay stuurt zelf al tracking-notificaties
- Het dubbel-notificeren stopt dus op twee fronten: (1) blacklist blokkeert Magento-mails, (2) eBay stuurt eigen tracking-mails met de geïnjecteerde T&T

---

## 4. Channable bevestiging

Per de Channable plugin audit (9 juli 2026): **"Order-e-mail naar klant: Nee"** — Channable stuurt zelf geen order-emails. De dubbele notificaties komen uitsluitend doordat Magento's Sales Emails naar eBay-alias-adressen gaan. De blacklist is de juiste fix.

---

## 5. Samenvatting risico

| Risico | Kans | Impact | Mitigatie |
|---|---|---|---|
| Blacklist werkt niet (bug/cache) | Medium | Hoog — eBay policy violation | Test bij volgende order, cache flush |
| Debug mode op productie | Zeker | Laag — performance | Uitzetten |
| Nieuwe eBay-domeinen niet gedekt | Laag | Medium | Monitoring op Sent Emails Log |
| Config cache niet geflushed | Medium | Hoog — blacklist inactief | Cache flush |

---

*Audit uitgevoerd door Cowork via Chrome browser tools op Magento admin (user: hans).*  
*Gerelateerde documenten:*
- `2026-07-06-ebay-de-order-to-cash-onderzoek.md`
- `Atvise-dossier-feiten-impact-verbetervoorstel-2026-07-11.md`
- `Channable-Magento-plugin-audit-2026-07-09.html`
- `AI-operatie-CCP-geinformeerd-niet-ontdekken-2026-07-14.md`
