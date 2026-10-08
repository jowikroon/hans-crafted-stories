# MCP-registry: hoe devices elkaar leren kennen

> Ontstaan uit [`docs/mcp-network-validation.md`](./mcp-network-validation.md) (2026-08-19),
> waarin bleek dat elk device zijn eigen MCP-lijst hield en het snijvlak leeg was.
> Dit document beschrijft het mechanisme dat dat oplost.
>
> **Laatst bijgewerkt: 2026-10-07** (registry v2: per server `status` en `lastVerified`,
> HansOS MCP Gateway en Hostinger API MCP toegevoegd, audit onderscheidt `ok` van
> `alive (auth required)`). Hoe je ChatGPT, Gemini en Codex aansluit staat in
> [`docs/mcp-llm-clients.md`](./mcp-llm-clients.md).

---

## Het principe

Een canoniek bestand bepaalt welke MCP-servers bestaan en welk device ze hoort te kennen:
**`ops/mcp/registry.json`**. Alle andere plekken zijn afgeleiden:

| Laag | Bestand | Rol |
|---|---|---|
| Bron van waarheid | `ops/mcp/registry.json` | Wat er moet zijn, en waar |
| Registratie | `.mcp.json` (repo-root) | Wat Claude Code op elk device laadt; reist mee met `git clone` |
| Installatie | `scripts/mcp-setup.mjs` (`npm run mcp:setup`) | Zorgt dat de stdio-servers kunnen starten |
| Cloud-sessies | `.claude/hooks/session-start.sh` | Draait `mcp:setup` bij elke sessiestart (sinds PR #372) |
| Controle | `scripts/mcp-audit.mjs` (`npm run mcp:audit`) | Bewijst per device of het klopt |

De reden dat `.mcp.json` bestaat en niet `.claude/settings.local.json`: alleen `.mcp.json`
wordt door Claude Code als project-MCP geladen en reist mee met de repo. Het `mcpServers`-blok
stond eerder in `settings.local.json` en werd daardoor op geen enkel device gelezen.

---

## Status per server (2026-10-07)

Elke server in de registry heeft een `status` en een `lastVerified`-datum:

| Status | Betekenis |
|---|---|
| `live` | Draait en is aantoonbaar bruikbaar voor minstens een client |
| `needs-auth` | Server leeft, maar de connector of client heeft geen geldige auth. Opnieuw autoriseren lost het op |
| `planned` | Gekozen maar nog niet aangesloten. Telt nooit als drift |
| `retired` | Afgevoerd; staat in `retired` zodat de URL niet stilletjes terugkeert |

| Server | Status | Transport en auth | Waar en voor wie |
|---|---|---|---|
| `workflow-orchestrator` | live | stdio, repo | 7 tools; in cloud-sessies via de SessionStart-hook (PR #372) |
| `health-guardian` | live | stdio, repo | 7 tools; vals CRITICAL-alarm opgelost in PR #394 |
| `n8n-hostinger` | live | http, OAuth of bearer | `https://n8n.srv1402218.hstgr.cloud/mcp-server/http`. Claude via claude.ai-connector `Hostinger_n8n` (OAuth). ChatGPT en Gemini: **planned**, zie [`mcp-llm-clients.md`](./mcp-llm-clients.md) |
| `hansos-mcp-gateway` | live | http, alleen bearer | n8n-workflow `30lnKzfSmeYVpSWk`, MCP Server Trigger op pad `hansos-gateway`, een tool: `svc_call`. Alleen voor bearer-clients (Claude Code, Codex, Gemini CLI) |
| `hostinger-api` | needs-auth | http, OAuth | Officiele remote MCP `https://mcp.hostinger.com`; claude.ai-connector `Hostinger_Connector` staat sinds 2026-10-06 op needs-auth |
| `supabase` | live | http, OAuth | claude.ai-account |
| `cloudflare-bindings` | live | http, OAuth | claude.ai-account (connector `Cloudflare_Developer_Platform`) |
| `github` | live | client-beheerd, OAuth | claude.ai-account |
| `vercel` | live | client-beheerd, OAuth | claude.ai-account |
| `linear` | live | client-beheerd, OAuth | claude.ai-account |
| `slack` | live | client-beheerd, OAuth | claude.ai-account |
| `monday` | needs-auth | http, OAuth | claude.ai-account (`monday_com`) zonder geldige auth; laptop via Cursor, zie [`monday-mcp-setup.md`](./monday-mcp-setup.md) |
| `n8n-cloud` | retired (2026-08-19) | | `hansvanleeuwen.app.n8n.cloud`: 404 op `/healthz`, ook op 2026-10-07 |
| `docker-mcp-gateway` | retired (2026-08-19) | | Poort 3100; draait nergens, compose-bestand verwijderd in commit `ebaea46` (2026-03-14) |

### Twee n8n-MCP's, twee doelgroepen

- **Instance-MCP (`n8n-hostinger`)**: `/mcp-server/http` op VPS1. Accepteert OAuth of een
  persoonlijke API-key als bearer (audience `mcp-server-api`, niet `public-api`). Toont alleen
  gepubliceerde workflows met een webhook-, schedule-, form- of chat-trigger die op
  "available in MCP" staan. Omdat hij OAuth spreekt, is dit de route voor claude.ai,
  ChatGPT developer mode en Gemini Enterprise.
- **HansOS MCP Gateway (`hansos-mcp-gateway`)**: een per-workflow MCP Server Trigger op
  `/mcp/hansos-gateway`, alleen bearer. Zijn enige tool `svc_call` routeert naar sub-workflow
  `acK9fcrMwAQRapgr` (channable, supabase, linear, telegram, anthropic, ollama). Lezen is de
  default; schrijven vereist `mode=write`, `confirm=true` en `writes_enabled` in `agent_control`;
  DELETE wordt nooit uitgevoerd. Clients die remote MCP alleen met OAuth of zonder auth
  accepteren (claude.ai, ChatGPT, Gemini Enterprise) kunnen hem niet gebruiken. Op 2026-10-07
  stond er geen clientconfig in de repo en geen executie in de bewaarde n8n-historie.

### Niet te verwarren

- `hostinger-api` (`mcp.hostinger.com`, hPanel-API) is iets anders dan `n8n-hostinger`
  (de n8n-instance op VPS1). De claude.ai-connectornamen lijken op elkaar:
  `Hostinger_Connector` versus `Hostinger_n8n`.
- `hansos-mcp-gateway` (n8n-workflow, live) is iets anders dan de afgevoerde
  `docker-mcp-gateway` (:3100, bestaat niet).

### Nog niet thuis te brengen (`unverified`)

- `ccp-playwright-mcp`: container op pi5 die zich in de heartbeat als `up` meldt. Endpoint,
  transport en clients staan nergens beschreven; eerst uitzoeken, dan pas naar `servers`.
- `adobe-experience-manager`: op het claude.ai-account zonder auth, nergens gedocumenteerd.
- `workos`: stond op 2026-08-19 op het account, op 2026-10-07 niet meer zichtbaar.

---

## Een nieuw device aansluiten

```sh
git clone git@github.com:jowikroon/hans-crafted-stories.git
cd hans-crafted-stories
npm run mcp:setup     # installeert de dependencies van de repo-MCP-servers
npm run mcp:audit     # bewijst dat ze starten en de verwachte tools leveren
```

Voeg het device daarna toe aan `devices` in `ops/mcp/registry.json` (id, `heartbeatHost`,
welke clients erop draaien, en of er een repo-checkout is). Zonder die regel valt de audit
terug op de ondergrens (repo-servers verplicht, de rest informatief) en zegt hij dat erbij.

---

## Wat de audit precies controleert

1. **Registratie**: staat elke repo-server in `.mcp.json`?
2. **Werkt hij echt**: de audit start de server en doet een volledige MCP-handshake
   (`initialize`, `notifications/initialized`, `tools/list`) over stdio, en vergelijkt de
   tool-namen met `expectedTools` uit de registry. Geen "het bestand bestaat dus het werkt".
3. **Endpoints**: elk HTTP-endpoint krijgt een echte JSON-RPC `initialize`-POST zonder auth.
   - `200` geeft **`ok`**.
   - Een verwachte `401`/`403` uit `expectUnauthenticated` geeft **`alive (auth required)`**:
     het endpoint leeft en dwingt auth af. Dat is gezond, maar het is niet hetzelfde als een
     werkende sessie, en de audit zegt dat nu ook apart.
   - Elke andere code geeft `afwezig`, geen antwoord geeft `onbereikbaar`.
   - Endpoints zonder `url` (door de client beheerd) staan op `handmatig`.
4. **Registry-status tegen werkelijkheid**: staat een server op `live` of `needs-auth` maar
   vindt de probe niets, dan meldt de audit dat met een `!`-regel. Dat is een waarschuwing,
   geen drift.
5. **Lokale registry**: leest `~/.claude.json` en `~/.claude/mcp-needs-auth-cache.json` zodat
   zichtbaar wordt wat dit device kent en waar de auth ontbreekt.
6. **Afgevoerde servers**: waarschuwt zodra een URL uit `retired` weer als default in een
   MCP-server opduikt. Zo komt `hansvanleeuwen.app.n8n.cloud` niet stilletjes terug.

Exitcodes zijn ongewijzigd: 1 bij drift (een server die op dit device verplicht is en niet
gezond is) of bij een teruggekeerde afgevoerde URL, anders 0. `ok`, `alive (auth required)`,
`handmatig` en `n.v.t.` zijn geen drift; een server met status `planned` is nooit drift.

### Laatste run (2026-10-07, cloud sandbox, zonder `--report`)

```
SERVER                  REGISTRY    HIER NODIG  STATUS                    DETAIL
workflow-orchestrator   live        ja          ✓ ok                      7 tools
health-guardian         live        ja          ✓ ok                      7 tools
n8n-hostinger           live        ja          ✓ alive (auth required)   HTTP 401, endpoint leeft en vraagt oauth
hansos-mcp-gateway      live        nee         ✓ alive (auth required)   HTTP 403, endpoint leeft en vraagt bearer
hostinger-api           needs-auth  nee         ✓ alive (auth required)   HTTP 401, endpoint leeft en vraagt oauth
supabase                live        nee         ✓ alive (auth required)   HTTP 401, endpoint leeft en vraagt oauth
cloudflare-bindings     live        nee         ✓ alive (auth required)   HTTP 401, endpoint leeft en vraagt oauth
github                  live        nee         · handmatig               client-beheerd endpoint
vercel                  live        nee         · handmatig               client-beheerd endpoint
monday                  needs-auth  nee         ✓ alive (auth required)   HTTP 401, endpoint leeft en vraagt oauth
linear                  live        nee         · handmatig               client-beheerd endpoint
slack                   live        nee         · handmatig               client-beheerd endpoint

Gezond: 8 van 12 (2 ok, 6 alive (auth required)); handmatig: 4
Geen drift op dit device.  (exit 0)
```

---

## Devices elkaar laten zien

```sh
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npm run mcp:audit -- --report
```

Dit schrijft per server een rij naar `infra_service_heartbeats` met
`host = <device>` en `service = mcp:<server-id>`. Dat is dezelfde tabel waar pi5, vps1 en vps2
hun containers al in melden: de enige plek waar alle devices elkaar tegenkomen. Op 2026-10-08
00:00 UTC stonden er nog geen `mcp:%`-rijen in; `--report` is dus nog nooit tegen productie
gedraaid.
`ok` en `alive (auth required)` worden allebei `status = up`; het onderscheid staat in
`detail.auditStatus` en `detail.authRequired`, met de registry-status in
`detail.registryStatus`. Daarmee wordt "kent ieder device dezelfde servers?" een query:

```sql
select host, service, status, detail->>'auditStatus' as audit, reported_at
from infra_service_heartbeats
where service like 'mcp:%'
order by service, host;
```

Zonder `SUPABASE_URL` en `SUPABASE_SERVICE_KEY` doet `--report` niets en zegt dat ook.
Er wordt nooit een sleutel afgedrukt. `--report` is een schrijfactie op de live tabel en
draait alleen met Hans' akkoord.

Aanbevolen cadans: een keer per dag per device, naast de bestaande heartbeat. Nieuwe
terugkerende schema's horen in OpenClaw cron (zie de architectuurregel in `CLAUDE.md`).

---

## Een server toevoegen of afvoeren

**Toevoegen**: zet hem in `servers` in de registry, met `status`, `lastVerified` en
`requiredOn` per device. Gebruik `planned` zolang hij nog niet is aangesloten; dan telt hij
nergens als drift. Geef `expectUnauthenticated` mee (meestal `[401]` of `[401, 403]`) als het
endpoint zonder token een auth-fout geeft. Is het een stdio-server in deze repo, voeg hem dan
ook toe aan `.mcp.json`; de audit klaagt als dat vergeten is. Optioneel: `clients` per server
(client, status, via, auth, doc) als verschillende clients verschillend zijn aangesloten.

**Status wijzigen**: pas `status` en `lastVerified` aan zodra een connector auth verliest of
terugkrijgt. De `!`-regel in de audit wijst op een registry-status die niet meer klopt.

**Afvoeren**: verplaats hem naar `retired` met `status: "retired"`, datum, reden en waar hij
nog wordt genoemd. Niet zomaar verwijderen: de `retired`-lijst is wat voorkomt dat een dode URL
terugkeert als default. `stillReferencedIn` houdt bij welke opruiming nog open staat;
`historyOnlyIn` noemt de documenten die hem bewust als geschiedenis bewaren.

---

## Wat hier bewust buiten valt

- **De SaaS-connectors op het claude.ai-account.** Die worden per account beheerd, niet per
  machine; een script op een VPS kan er niet bij. De registry noemt de belangrijkste zodat
  drift zichtbaar is, maar de audit kan ze alleen controleren vanuit een client-sessie.
- **De MCP-config van OpenClaw op VPS2 en pi5.** Die devices hebben geen repo-checkout;
  de audit markeert de repo-servers daar als `n.v.t.` in plaats van te doen alsof hij het weet.
- **ChatGPT-, Gemini- en Codex-configuratie.** Staat in
  [`docs/mcp-llm-clients.md`](./mcp-llm-clients.md); de registry noemt die clients alleen
  met hun status.

---

## Open opruimwerk (buiten de MCP-laag)

- **Docker MCP Gateway in runtime-teksten.** De systeemprompt van `hansai-chat` en de Command
  Center-UI (`contextCategories.ts`, `commandSuggestions.ts`, `EmpireStatusGrid.tsx`,
  `EmpireOverlay.tsx`, `EmpireClaudePanel.tsx`, `InlineChatPanel.tsx`, `UnifiedChatPanel.tsx`)
  noemen de gateway nog als bestaand onderdeel. Bijgehouden in
  `retired[docker-mcp-gateway].stillReferencedIn`.
- **n8n Cloud in omschrijvingen.** `apps/personal/n8n/secrets.manifest.yml` beschrijft
  `N8N_BASE_URL` nog als "n8n Cloud instance URL" en de tool `n8n_health` in
  `workflow-orchestrator` heet nog "Check if n8n cloud instance is healthy". Geen van beide
  bevat de dode host; het is tekst, geen runtime-pad.

---

## Geschiedenis

### Wat op 2026-10-07 is bijgewerkt

- Registry v2: `status` en `lastVerified` per server, `statusLegend` bovenaan, `clients` waar
  clients verschillend zijn aangesloten. Bestaande velden zijn ongewijzigd, dus
  `mcp-setup.mjs` en oudere audit-versies lezen hem nog steeds.
- Nieuw: `hansos-mcp-gateway` (live, alleen bearer), `hostinger-api` (needs-auth sinds
  2026-10-06) en `vercel` (live).
- `cloudflare-bindings` is van needs-auth naar live gegaan; `monday` staat op needs-auth.
- `n8n-hostinger`: auth is OAuth voor claude.ai, bearer blijft mogelijk.
- Audit: `alive (auth required)` apart van `ok`, registry-statuskolom, waarschuwing bij een
  registry-status die niet meer klopt. Heartbeat-mapping (`up`/`down`) en exitcodes zijn gelijk
  gebleven.
- Docs die de afgevoerde n8n Cloud-host of de Docker MCP Gateway nog als live presenteerden
  (`system-map.md`, `god-structure-architecture-v2.md`, `empire-n8n-flow.md`,
  `inventory-secrets-and-workflows.md`, `secrets-inventory.md`) zijn gemarkeerd als afgevoerd
  (2026-08-19); de oorspronkelijke tekst is als geschiedenis bewaard.

### Wat op 2026-09-05 is opgeruimd

De afgevoerde n8n Cloud-host is uit alle **runtime**-paden verdwenen: de edge functions
(`_shared/workflows.ts`, `empire-health`), de frontend-config, `.env.production`,
`.env.example`, `.env.development`, de n8n-scripts en de `.claude`-agents wijzen nu naar
`n8n.srv1402218.hstgr.cloud` (GET `/healthz` geeft 200).

Twee dingen waren daarbij aantoonbaar kapot:

1. `supabase/functions/_shared/workflows.ts` bouwde zes webhook-URL's op de dode host en wordt
   geimporteerd door `monday-webhook` en `monday-trigger-agent`. Monday-getriggerde workflows
   liepen dus in een 404, terwijl `trigger-webhook` al wel de live host gebruikte.
   `POST /webhook/autoseo` op de live host gaf 200; dat pad werkte daarna weer.
2. `health-guardian` viel terug op Supabase-project `oejeojzaakfhculcoqdh`, dat niet eens
   resolvet. Regel "alert bij n8n/supabase down" sloeg daardoor permanent vals alarm.
   Nu `pesfakewujjwkyybwaom` (401 = leeft).

#### Gemeten webhook-status op de live host (2026-09-05)

`POST https://n8n.srv1402218.hstgr.cloud/webhook/<naam>` met een lege JSON-body:

| webhook | status |
|---|---|
| `autoseo`, `product-titles`, `product-feed`, `campaign`, `site-audit`, `blog-init` | 200 |
| `scraper`, `monday-orchestrator` | **404: workflow stond niet op deze host** |

Let op: `monday-orchestrator` is precies wat `monday-webhook` aanroept. Het hostadres klopte
toen, maar die workflow moest nog op VPS1 worden aangezet voordat Monday-routing weer
rondliep. Hetzelfde gold voor `context-keeper` en `vps-alert` uit de `.claude`-agents.
Deze tabel is een momentopname van 2026-09-05 en is niet opnieuw gemeten.

`docs/mcp-network-validation.md` en dit bestand noemen de oude URL bewust: dat is het
bewijsmateriaal, niet een restant.
