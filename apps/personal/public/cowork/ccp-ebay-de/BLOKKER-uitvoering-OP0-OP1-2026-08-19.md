# BLOKKER — uitvoering OP-0 t/m OP-1 gestopt · 2026-08-19

Poging tot autonome uitvoering van export-hold → repoint → remblokken-uitrol. **Alle vier de routes naar de live data zijn dicht.** Hieronder exact wat faalde, met de responscode, zodat je het in één sessie kunt openzetten.

---

## 1 · Channable UI (Claude in Chrome) — renderer bevriest

| Poging | Resultaat |
|---|---|
| `/apis/159122/build` | script injection timeout na 5s, herhaald na 4s / 5s / 20s wachten |
| `/projects/314525` (lichter) | zelfde timeout |
| `get_page_text` | *"Page still loading (executeScript waited 45000ms for document_idle)"* |

Identieke failure als **24-07** (§11 van de 100pct-data-verificatie: Items-view bevroor de renderer, CDP-timeout 45s). Toen afgedaan als omgevingslimiet — het is structureel. De Channable-SPA settelt niet in de automatiseringscontext.

## 2 · Channable REST API — 403 op elk endpoint

`CHANNABLE_API_TOKEN` uit `_skill/adapters/.env`, getest op drie endpoints:

```
403  /v1/companies
403  /v1/companies/101300/projects
403  /v1/companies/101300/projects/314525/apis
→ "You are not allowed to make this request using the given token."
```

`CREDENTIAL-MAP.md` noteert dit token als *"2026-07-21 OK"*. Sindsdien vervallen of van scope veranderd.

## 3 · Supabase legacy JWT-keys — 401

`SUPABASE_ANON_KEY` (208 tekens, 3 segmenten) en `SUPABASE_SERVICE_KEY` (219, 3 segmenten) geven beide:

```
401 {"message":"Invalid API key","hint":"Double check your anon or service_role API key."}
```

Alle drie de `.env`-backups (25-07, 27-07, 07-08) bevatten dezelfde 208-teken anon-key → **nooit geroteerd sinds de 401 werd vastgelegd**. `CREDENTIAL-MAP.md` markeert `SUPABASE_ANON_KEY` al als *"2026-07-25 — 401"*. Dat is 25 dagen open.

Dit blokkeert ook de secrets-broker uit `SECRETS-MAP.md` (`ccp-secrets-broker` draait op anon-key), dus de hele K2-kluis is onbereikbaar.

**Wél werkend:** `VITE_SUPABASE_PUBLISHABLE_KEY` (`sb_p…`, 46 tekens) authenticeert correct — bewijs: PGRST205 *"Could not find the table"* in plaats van 401. Supabase's nieuwe key-formaat werkt dus; de legacy JWT's zijn uitgezet. **Rotatie-richting: vervang ANON/SERVICE door `sb_publishable_` / `sb_secret_`.**

## 4 · CCP-dataproject onvindbaar

`VITE_SUPABASE_URL` = `https://oejeojzaakfhculcoqdh.supabase.co` → **geen DNS-record** (curl exit 6). Project bestaat niet meer onder die ref, of de ref in `.env` is fout.

Het bereikbare project `pesfakewujjwkyybwaom` is de HansOS/dashboard-instantie. `ccp_sku_attributes` en `v_channable_import` staan daar **niet** in (PGRST205, suggesties: `tool_attributes`, `v_dash_channable_templates`). Wel aanwezig: `v_dash_channable_templates`, `v_dash_channable_views`, `channable_rule_log`, `ccp_price_files`.

→ **Open vraag:** de 19-08-verificatie las `v_channable_import` live uit. Onder welke project-ref? Die ref ontbreekt in `.env`.

---

## Wat dit betekent voor de opdracht

De repoint-spec (OP-0.5) is inhoudelijk klaar en ligt in `PROMPT-OP-0.5-repoint-remschijven-2026-08-19.md`. Hij is **niet uitvoerbaar** zolang bovenstaande dicht staat — en uitvoeren zonder export-hold is expliciet onverantwoord, want `compatibility_k_type` gaat leeg mee op alle 229 rijen en kan de handmatige KTypes overschrijven.

**De remblokken-uitrol naar 100% vulgraad kan niet worden voorbereid** zonder leestoegang tot `v_channable_import`: zonder die view is niet vast te stellen welke van de ~3.400 remblok-SKU's binnen de 398-masterfile vallen, wat de feitelijke vulgraad per item-specific is, en of de titel-/omschrijvingsregels output produceren. Dat inschatten zonder data zou gokken zijn.

---

## Wat jij moet doen — 3 handelingen, ~10 minuten

1. **Supabase keys roteren naar het nieuwe formaat.** Dashboard → Settings → API keys → genereer `sb_publishable_…` + `sb_secret_…` voor het CCP-project. Zet in `_skill/adapters/.env` als `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_KEY` (of nieuwe namen, dan geef ik door welke scripts mee moeten).
2. **Juiste CCP-project-ref opzoeken** (Supabase dashboard → project → Reference ID) en `VITE_SUPABASE_URL` corrigeren. De huidige ref resolvet niet.
3. **Channable API-token vernieuwen.** Channable → Settings → API tokens → nieuw token met leesrechten op company 101300 / project 314525.

Voor OP-0 zelf: zet de **export-schema's op het eBay-kanaal 159122 handmatig op hold** in je eigen browser. Dat is één klik en het haalt de tijdsdruk van de rest — zolang niets gepland pusht, kan de mismap geen verdere schade doen.

Zodra 1-3 open staan: ik draai de repoint via de API in plaats van de UI (geen renderer-afhankelijkheid), meet de vulgraad per remblok-SKU uit de view, en lever de push-ready set met titels en omschrijvingen.

---

Gerelateerd: `PROMPT-OP-0.5-repoint-remschijven-2026-08-19.md` · `_skill/adapters/CREDENTIAL-MAP.md` · `_skill/adapters/SECRETS-MAP.md` · [[eBay-DE-Launch]] · [[eBay-DE-KType-Compatibiliteit]]
