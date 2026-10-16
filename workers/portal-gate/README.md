# portal-gate

De portal-login is de enige login voor de lab-tools. Geen Cloudflare Access-code,
geen basic auth, ook niet voor nieuwe gebruikers.

## Flow

1. Tool openen (vanuit de portal of direct): de Worker ziet geen gate-cookie en
   stuurt de browser naar `https://hansvanleeuwen.com/portal/launch?host=..&return=..`.
2. Die pagina gebruikt de bestaande portal-sessie (Supabase) en POST het
   access token naar `https://<tool>/__portal/auth`. Niet ingelogd: eerst inloggen
   (Google of e-mail), daarna automatisch door.
3. De Worker checkt het token bij Supabase en de toegang met dezelfde regels als de
   portal: `portal_launch_tool(tool_id)` voor hosts in `TOOL_HOSTS`,
   `is_portal_owner()` voor de overige hosts. Akkoord: cookie
   `__Host-portal_gate` (12 uur, alleen voor die host, HMAC-getekend), redirect
   terug naar het gevraagde pad. Verlopen cookie: dezelfde ronde, zonder klik.
4. Requests met de Claude service token (`CF-Access-Client-Id/Secret`) gaan
   direct door, zoals eerder via Cloudflare Access.

Toegang geven of intrekken blijft in de portal (gebruikers en tool-rechten).
Owner-only tools blijven alleen voor Hans; `individual-login`/`stateless` tools
werken voor leden met gebruiksrecht.

## Infra

- Origins draaien achter tunnel `lab-vps2` (alleen bereikbaar via Cloudflare).
- Cloudflare Access-apps "Lab VPS2 tools" en "Reverse (lab VPS2)" staan op een
  bypass-policy; de Worker is de poort. Terugdraaien: oude policies terugzetten
  (e-mail hansvl3@gmail.com + service token) en de Worker-routes verwijderen.
- Nieuwe tool-host: route in `wrangler.toml`, host in `TOOL_HOSTS` en in
  `apps/personal/src/lib/portalGate.ts` (`GATED_HOSTS`), tunnel-ingress + DNS.

## Deploy

```
npx wrangler deploy -c workers/portal-gate/wrangler.toml
npx wrangler secret put GATE_SECRET -c workers/portal-gate/wrangler.toml
npx wrangler secret put SERVICE_CLIENT_ID -c workers/portal-gate/wrangler.toml
npx wrangler secret put SERVICE_CLIENT_SECRET -c workers/portal-gate/wrangler.toml
```

Tests: `node --test workers/portal-gate/test/*.test.mjs`
