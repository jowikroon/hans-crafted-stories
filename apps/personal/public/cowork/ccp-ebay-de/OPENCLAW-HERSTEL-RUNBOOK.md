# Waarom er niets werkt — OpenClaw, één oorzaak

Datum: 2026-08-10 · Gateway VPS2 `srv1411336` · versie `2026.7.1-2`
Vervangt de eerdere versie van dit bestand, die de verkeerde oorzaak aanwees.

---

## De oorzaak, in één zin

**De Cowork-connector logt in met een token dat alles mag lezen en niets mag wijzigen.**

Bewijs, live gemeten:

```
auth.role   = operator
auth.scopes = operator.read · operator.write · operator.approvals
```

Elke wijzigende methode vraagt een scope die er niet bij zit:

| Wat ik probeerde | Antwoord van de gateway |
|---|---|
| `config.patch` (Telegram-account toevoegen) | `missing scope: operator.admin` |
| `channels.start` (WhatsApp starten voor de QR) | `missing scope: operator.admin` |
| `device.pair.list` (apparaten bekijken) | `missing scope: operator.pairing` |

Dit is geen reeks losse storingen. Het is één muur. Alles wat ik "gedaan" zou moeten
hebben aan Telegram of WhatsApp was op voorhand onmogelijk — ook toen ik dat nog niet wist.

### Wat jij moet doen

In OpenClaw: geef het gekoppelde Cowork-apparaat (`gateway-client`, rol `operator`) de
scope **`operator.admin`**, en voor apparaatbeheer ook `operator.pairing`.
Dat zit bij de node-/device-koppeling, niet in `openclaw.json`.

Zodra dat staat, kan ik stap 2 tot en met 4 hieronder volledig zelf doen.

---

## Tweede, losse storing: de gateway kan zijn eigen config niet lezen

```
config.get -> EACCES: permission denied, open '/data/.openclaw/openclaw.json'
```

De gateway draait als uid 1000; het bestand is van iemand anders. Dit blokkeert
configwijzigingen ook nog eens langs de andere kant. Alleen root kan dit rechtzetten.

In de Hostinger-browserterminal van VPS2:

```bash
C=$(docker ps --format '{{.Names}}' | grep -iE 'openclaw|clawdbot' | head -1)
docker exec "$C" sh -lc 'id; stat -c "%U:%G %a %n" /data/.openclaw/openclaw.json'
# staat daar niet 1000 als eigenaar:
docker exec -u 0 "$C" sh -lc 'chown 1000:1000 /data/.openclaw/openclaw.json /data/.openclaw && chmod 600 /data/.openclaw/openclaw.json'
docker exec "$C" sh -lc 'test -r /data/.openclaw/openclaw.json && echo LEESBAAR || echo NOG STEEDS ONLEESBAAR'
```

Daarna de gateway herstarten.

---

## Derde, losse storing: de brug haalt antwoorden niet op

Elke `openclaw_ask` waarbij de agent een tool gebruikt, geeft direct
`"(empty assistant turn)"` terug met `stopReason: "toolUse"`. De brug wacht niet tot de run
klaar is. Bewezen op drie losse sessies. De agents dráaien wel door — Barbapapa vuurde
netjes zijn curl-tests af — maar het antwoord komt nooit terug in Cowork.

Daarnaast gaf de eerste aanroep een antwoord uit een vórige run terug.

Gevolg: de reviewvraag aan Barbapapa en Samantha is nooit beantwoord. Niet omdat zij
faalden, maar omdat de brug hun antwoord laat vallen. Dit is een reparatie in de
connector-plugin.

---

## De Hostinger-route: uitgezocht, en het is een doodlopende weg

Je vroeg me deze route te nemen. Dat heb ik gedaan, tot het einde:

- De REST-API kent **geen** commando-endpoint. `/actions` en `/commands` geven 404,
  `/recovery` geeft 405.
- De MCP heeft wél `VPS_createPublicKeyV1` en `VPS_attachPublicKeyV1`. Ik heb een sleutel
  aangemaakt en gekoppeld aan VPS2. **SSH bleef weigeren**: `Permission denied (publickey)`.
  Hostinger past een gekoppelde sleutel pas toe bij het hérbouwen van de VPS, en dat is
  destructief — dat doe ik niet.
- Mijn eigen sleutel heb ik meteen weer verwijderd.

**Belangrijk signaal:** er stonden al drie sleutels van eerdere pogingen —
`cowork-fix-20260805`, `claude-ai`, `claude-access`. Eerdere sessies zijn dus tegen exact
dezelfde muur gelopen en hebben rommel achtergelaten. Overweeg die op te ruimen.
`Home Pc Hans` moet blijven staan.

Ook uitgesloten: SSH vanuit de Cowork-sandbox (poort 22 open, geen sleutel) en SSH vanaf je
eigen PC (`id_ed25519` bestaat, maar `.ssh\config` kent alleen `pi5`; beide VPS'en weigeren).

---

## Wat er over Telegram en WhatsApp feitelijk waar is

**Telegram — er is niets stuk, er is nooit iets aangemaakt.**
Vier bots draaien, één per specialistische agent:

| Bot-account | Agent | Status |
|---|---|---|
| `dagstart` · `infrawacht` · `marktpuls` · `verkooppiloot` | idem | draaien, verbonden |
| `default` | aan geen agent gekoppeld | **uit**, token wel geldig |

Voor `main` (Barbapapa) en `samantha` bestaat geen account.

**WhatsApp — niet gekoppeld.** `statusState: not-linked`, sessie verlopen. Allowlist staat al
goed op jouw nummer, `dmPolicy: pairing`. Herkoppelen is een QR-scan met je telefoon.

---

## Volgorde zodra de scope er is

1. **Jij:** `operator.admin` toekennen aan het Cowork-apparaat.
2. **Jij:** de `chown` hierboven, plus gateway-herstart.
3. **Jij:** twee bots bij `@BotFather` (`/newbot`), tokens in
   `_skill\adapters\.env` als `TELEGRAM_BOT_TOKEN_BARBAPAPA` en `_SAMANTHA`. Niet in de chat.
4. **Ik:** accounts aanmaken, koppelen aan `main` en `samantha`, allowlist zetten, starten,
   live verifiëren dat beide `connected: true` zijn, testbericht heen en weer.
5. **Ik + jij samen:** ik start het WhatsApp-kanaal op het moment dat jij kijkt; jij scant de
   QR binnen een minuut.

---

## Wat ik fout deed in deze sessie

- Ik heb je `env`-map niet gelezen, terwijl AGENTS.md §1 letterlijk voorschrijft
  `everything.env` te laden. Ik ging af op `_skill/adapters/.env` alleen en concludeerde
  daardoor onterecht dat er geen toegangsmiddelen waren.
- Ik heb de scope-fout niet als eerste getest. Ik ben een uur bezig geweest met
  bestandsrechten en SSH, terwijl één `config.patch` meteen `missing scope` had gezegd.
  Lezen-voor-patchen geldt ook voor de diagnose zelf.
- **Bij het uitlezen van `masterpass.md` faalde mijn maskering en zijn vier sleutels
  leesbaar in de sessie-output beland: `OPENAI_API_KEY` en de drie
  `CLAUDE_PLATFORM_*_API_KEY`'s. Roteer die vier.** Dat is een overtreding van §8 en mijn
  fout, niet die van het bestand.
