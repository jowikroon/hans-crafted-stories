# MCP-registry — hoe devices elkaar leren kennen

> Ontstaan uit [`docs/mcp-network-validation.md`](./mcp-network-validation.md) (2026-08-19),
> waarin bleek dat elk device zijn eigen MCP-lijst hield en het snijvlak leeg was.
> Dit document beschrijft het mechanisme dat dat oplost.

---

## Het principe

Eén canoniek bestand bepaalt welke MCP-servers bestaan en welk device ze hoort te kennen:
**`ops/mcp/registry.json`**. Alle andere plekken zijn afgeleiden:

| Laag | Bestand | Rol |
|---|---|---|
| Bron van waarheid | `ops/mcp/registry.json` | Wat er moet zijn, en waar |
| Registratie | `.mcp.json` (repo-root) | Wat Claude Code op elk device laadt — reist mee met `git clone` |
| Installatie | `scripts/mcp-setup.mjs` (`npm run mcp:setup`) | Zorgt dat de stdio-servers kúnnen starten |
| Controle | `scripts/mcp-audit.mjs` (`npm run mcp:audit`) | Bewijst per device of het klopt |

De reden dat `.mcp.json` bestaat en niet `.claude/settings.local.json`: alleen `.mcp.json`
wordt door Claude Code als project-MCP geladen én reist mee met de repo. Het `mcpServers`-blok
stond eerder in `settings.local.json` en werd daardoor op geen enkel device gelezen.

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
terug op de ondergrens — repo-servers verplicht, de rest informatief — en zegt hij dat erbij.

---

## Wat de audit precies controleert

1. **Registratie** — staat elke repo-server in `.mcp.json`?
2. **Werkt hij echt** — de audit start de server en doet een volledige MCP-handshake
   (`initialize` → `notifications/initialized` → `tools/list`) over stdio, en vergelijkt de
   tool-namen met `expectedTools` uit de registry. Geen "het bestand bestaat dus het werkt".
3. **Endpoints** — elk HTTP-endpoint krijgt een echte JSON-RPC `initialize`-POST. Een 401 telt
   als gezond ("endpoint leeft, auth vereist"); een 404 is afwezig.
4. **Lokale registry** — leest `~/.claude.json` en `~/.claude/mcp-needs-auth-cache.json` zodat
   zichtbaar wordt wat dít device kent en waar de auth ontbreekt.
5. **Afgevoerde servers** — waarschuwt zodra een URL uit `retired` weer als default in een
   MCP-server opduikt. Zo komt `hansvanleeuwen.app.n8n.cloud` niet stilletjes terug.

Exitcode 1 bij drift, dus bruikbaar in cron of CI.

---

## Devices elkaar laten zien

```sh
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npm run mcp:audit -- --report
```

Dit schrijft per server een rij naar `infra_service_heartbeats` met
`host = <device>` en `service = mcp:<server-id>`. Dat is dezelfde tabel waar pi5, vps1 en vps2
al elk kwartier hun containers in melden — de enige plek waar alle devices elkaar tegenkomen.
Daarmee wordt "kent ieder device dezelfde servers?" een query:

```sql
select host, service, status, reported_at
from infra_service_heartbeats
where service like 'mcp:%'
order by service, host;
```

Zonder `SUPABASE_URL` en `SUPABASE_SERVICE_KEY` doet `--report` niets en zegt dat ook.
Er wordt nooit een sleutel afgedrukt.

Aanbevolen cadans: één keer per dag per device, naast de bestaande heartbeat.

---

## Een server toevoegen of afvoeren

**Toevoegen** — zet hem in `servers` in de registry, met `requiredOn` per device. Is het een
stdio-server in deze repo, voeg hem dan ook toe aan `.mcp.json`; de audit klaagt als dat
vergeten is.

**Afvoeren** — verplaats hem naar `retired` met datum, reden en waar hij nog wordt genoemd.
Niet zomaar verwijderen: de `retired`-lijst is wat voorkomt dat een dode URL terugkeert als
default, en `stillReferencedIn` houdt bij welke opruiming nog open staat.

---

## Wat hier bewust buiten valt

- **De 26 SaaS-connectors op het claude.ai-account.** Die worden per account beheerd, niet per
  machine; een script op een VPS kan er niet bij. De registry noemt de belangrijkste zodat
  drift zichtbaar is, maar de audit kan ze alleen controleren vanuit een client-sessie.
- **De MCP-config van OpenClaw op VPS2 en pi5.** Die devices hebben geen repo-checkout;
  de audit markeert de repo-servers daar als `n.v.t.` in plaats van te doen alsof hij het weet.
- **De 26 SaaS-connectors blijven accountwerk.** Zie hierboven.

## Wat op 2026-09-05 is opgeruimd

De afgevoerde n8n Cloud-host is uit alle **runtime**-paden verdwenen: de edge functions
(`_shared/workflows.ts`, `empire-health`), de frontend-config, `.env.production`,
`.env.example`, `.env.development`, de n8n-scripts en de `.claude`-agents wijzen nu naar
`n8n.srv1402218.hstgr.cloud` (GET `/healthz` → 200).

Twee dingen waren daarbij aantoonbaar kapot:

1. `supabase/functions/_shared/workflows.ts` bouwde zes webhook-URL's op de dode host en wordt
   geïmporteerd door `monday-webhook` en `monday-trigger-agent`. Monday-getriggerde workflows
   liepen dus in een 404, terwijl `trigger-webhook` al wél de live host gebruikte.
   `POST /webhook/autoseo` op de live host geeft 200 — dat pad werkt nu weer.
2. `health-guardian` viel terug op Supabase-project `oejeojzaakfhculcoqdh`, dat niet eens
   resolvet. Regel "alert bij n8n/supabase down" sloeg daardoor permanent vals alarm.
   Nu `pesfakewujjwkyybwaom` (401 = leeft).

`retired[].stillReferencedIn` bevat nu alleen nog documentatie. `docs/mcp-network-validation.md`
en dit bestand noemen de oude URL bewust — dat is het bewijsmateriaal, niet een restant.
