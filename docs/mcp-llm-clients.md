# n8n-MCP voor ChatGPT, Gemini en Codex

> **Status 2026-10-09:** voorbereid, nog niet aangesloten. Het MCP-onderzoek was read-only
> (discovery-endpoints, workflowdefinities, docs.n8n.io, OpenAI- en Google-docs).
> Stappen met **[Hans]** kan alleen Hans doen (login, upgrade, consent-scherm, abonnementen).
> Registry-context: [`docs/mcp-registry.md`](./mcp-registry.md).
>
> **Publieke versie.** De exposure-lijst per workflow, versie-informatie van de instance en het
> runbook voor client-registratie staan in een private notitie van 2026-10-09, niet in deze
> (publieke) repo.

## Kort

- **Eén endpoint:** `https://n8n.srv1402218.hstgr.cloud/mcp-server/http` (instance-level MCP,
  Streamable HTTP). Auth: OAuth 2.1 met dynamic client registration, of een persoonlijke MCP-token
  als bearer.
- **Voorwaarde: n8n 2.33 of nieuwer.** Scope-keuze per client op het consent-scherm bestaat vanaf
  2.32; **Allowed callback URLs** en de dialoog "Connect a client" vanaf 2.33. Zonder die twee
  krijgt een OAuth-client dezelfde rechten als de gebruiker die toestemming geeft. Controleer de
  versie vóór het koppelen (sectie 8).
- **Advies:** sluit ChatGPT en Gemini aan met scope **Read only**, met alleen vertrouwde
  callback-URL's, en pas nadat workflows met gevoelige inhoud uit MCP zijn gehaald.
- **Uitzetten is veilig voor de runs.** "Available in MCP" regelt alleen MCP-toegang. Schedules,
  webhooks en sub-workflow-calls blijven gewoon draaien.
- **De schakelaar is gedeeld.** "Available in MCP" geldt voor alle clients tegelijk, dus ook voor
  Claude (`Hostinger_n8n`). Een workflow die je voor ChatGPT uitzet, kan Claude via MCP ook niet
  meer lezen of wijzigen. Rechten verschillen per client alleen via de OAuth-scope.

---

## 1. Endpoint en auth-model

| Wat | Waarde |
|---|---|
| MCP-endpoint | `https://n8n.srv1402218.hstgr.cloud/mcp-server/http`, methodes `GET, HEAD, POST` |
| Zonder token | `401` met `WWW-Authenticate: Bearer realm="n8n MCP Server"` (zonder `resource_metadata`) |
| Protected resource metadata | `/.well-known/oauth-protected-resource/mcp-server/http` (JSON) |
| Root-variant | `/.well-known/oauth-protected-resource` geeft de HTML van de editor, geen JSON |
| Authorization server | `https://n8n.srv1402218.hstgr.cloud`, endpoints onder `/mcp-oauth/` (authorize, token, register, revoke) |
| Grants / PKCE | `authorization_code`, `refresh_token`; alleen `code`; PKCE `S256` |
| Client-auth op token endpoint | `none` (publieke client), `client_secret_post`, `client_secret_basic` |
| Issuer in redirect (RFC 9207) | ondersteund |
| `scopes_supported` | niet geadverteerd |

Wat dit betekent per client:

- **DCR werkt**, dus ChatGPT, Gemini CLI, Codex en Claude registreren zichzelf; je vult geen client-id in.
- **Gemini Enterprise doet geen DCR**: daar maak je vooraf een client met secret aan (zie 5).
- **Discovery-risico (niet getest met ChatGPT):** de 401 noemt geen `resource_metadata` en de
  root-URL geeft HTML. Clients die RFC 9728 volgen proberen eerst het pad-specifieke document en
  vinden dan de juiste JSON; claude.ai doet dat aantoonbaar. Geeft ChatGPT een discovery-fout,
  dan is dit de eerste verdachte.

Wat een verbonden client kan (tools van de instance-MCP):

- **Lezen:** `search_workflows`, `get_workflow_details`, `get_workflow_history`, `get_workflow_version`,
  `search_executions`, `get_execution`, `list_credentials` (nooit secrets), `search_projects`,
  `search_folders`, `list_tags`, `search_data_tables`, plus de builder-hulpen (`search_nodes`,
  `get_node_types`, `get_sdk_reference`, `get_workflow_best_practices`, `validate_*`).
- **Schrijven of uitvoeren:** `create_workflow_from_code`, `update_workflow`, `publish_workflow`,
  `unpublish_workflow`, `archive_workflow`, `restore_workflow_version`, `execute_workflow`,
  `test_workflow`, `create_data_table`, `add_data_table_rows`, `add_data_table_column`,
  `delete_data_table_column`, `rename_data_table`, `rename_data_table_column`.
- **Let op:** `explore_node_resources` roept met een gekozen credential externe API's aan
  (bijvoorbeeld kanalen of sheets ophalen). Behandel hem als schrijf-tool.
- Nieuwere versies hernoemen een paar tools (`get_workflow_execution`, `search_workflow_executions`,
  `list_workflow_tags`) en voegen agent- en data-tabletools toe. Controleer na een upgrade de echte
  `tools/list` voordat je allow-lists overneemt.

Wat "Available in MCP" wel en niet afschermt:

- `search_workflows` toont naam, beschrijving en status van **alle** workflows, ongeacht de
  schakelaar. Houd beschrijvingen dus zakelijk.
- Volledige workflow-JSON, uitvoeren en wijzigen kan alleen op workflows die aan staan.
- `get_workflow_details` verwijdert credential-data, maar **niet** letterlijke waarden in
  node-parameters of Code-nodes. `get_workflow_version` geeft ook oudere versies terug. Een sleutel
  die ooit letterlijk in een workflow stond, is dus pas veilig na rotatie.

---

## 2. Randvoorwaarden

Kies eerst de modus voor ChatGPT en Gemini:

- **Modus A, alleen lezen (aanbevolen).** Scope "Read only" op het consent-scherm.
  Tier 1 gaat uit; tier 2 mag aan blijven zodat Claude die workflows via MCP kan blijven beheren.
  ChatGPT en Gemini kunnen dan definities en run-historie van tier 2 lezen, maar niets starten of
  wijzigen. Run-data kan bedrijfsdata bevatten (orders, mailteksten): kies bij twijfel "Custom" en
  laat executions weg.
- **Modus B, ook uitvoeren.** Uitvoeren is een scope van de client, niet van de workflow: een client
  met execute-rechten kan elke workflow starten die aan staat. Dan moeten tier 1 en tier 2 allebei
  uit, en verliest Claude ook de MCP-toegang tot die workflows.

Indeling (de lijst per workflow staat in de private notitie):

- **Tier 1, altijd uit:** workflows met een letterlijk secret in de huidige of een eerdere versie,
  tot de sleutel naar een n8n-credential is verhuisd en geroteerd.
- **Tier 2, uit in modus B:** SSH of commando-uitvoer, deploy en DNS, gateways en proxies,
  berichten (Telegram, Gmail, Slack), schrijvende workflows en betaalde API-calls.
- **Aan laten:** alleen-lezen workflows zonder secrets, berichten of writes, node voor node
  gecontroleerd.

Checklist:

- [ ] **[Hans]** Controleren dat n8n op VPS1 minimaal 2.33 is, anders upgraden. Eerst een VPS-snapshot en een export van de
      n8n-database. Bestaande OAuth-verbindingen (Claude) houden na de upgrade volle toegang.
- [ ] **[Hans of hoofdsessie]** Tier 1 uitzetten (lijst in de private notitie). Dit staat los van de
      upgrade en kan meteen. Daarna kan ook Claude die workflows niet meer via MCP repareren: zet er
      een tijdelijk aan tijdens de fix, of verhuis de secrets eerst.
- [ ] **[Hans]** Modus kiezen. Bij modus B ook tier 2 uitzetten.
- [ ] **[Hans, vanaf 2.33]** Settings > Instance-level MCP > Access > **Allowed callback URLs** >
      **Only trusted URLs**, met alleen de callbacks die je echt gebruikt:
  - ChatGPT: `https://chatgpt.com/connector_platform_oauth_redirect` (n8n ondersteunt RFC 9207,
    dus ChatGPT gebruikt deze vaste URI; toont ChatGPT een andere callback, neem die over)
  - Gemini Enterprise: `https://vertexaisearch.cloud.google.com/oauth-redirect`
  - Claude.ai, Gemini CLI, Codex: neem de exacte `redirect_uri` over uit een eerste geslaagde
    koppeling (staat bij de client in Connected clients). Geef Gemini CLI en Codex een vaste poort
    (zie 4 en 6), anders wisselt de localhost-URL per login.
- [ ] **[Hans]** Weten waar de noodknop zit (sectie 9) voordat er een tweede LLM bij kan.
- [ ] Vervolgtaak: resterende secrets naar n8n-credentials verhuizen en alle eerder letterlijke
      sleutels roteren. Daarna kan tier 1 terug naar tier 2.

### 2.1 Klikpaden in n8n **[Hans]**

- **Per workflow (editor):** workflow openen > **Workflow menu** (`...`, rechtsboven) > **Settings**
  > schakelaar **Available in MCP** uit > opslaan.
- **Per workflow (lijst):** **Workflows** > menu op de kaart > **Disable MCP access**. Bij een deel van
  de installaties staat er direct een schakelaar op de kaart.
- **Vanuit MCP-instellingen:** **Settings > Instance-level MCP** > lijst met blootgestelde workflows
  (**Workflows exposed**, vanaf 2.42 **Workflows enabled**) > actiemenu op de rij > toegang intrekken.
- **Alles in een keer (vanaf 2.24):** project openen > **Workflows** > **Options**-menu (`...`) naast
  de projectnaam > **Manage MCP access** > **Disable MCP**. Daarna de "aan laten"-workflows weer per
  stuk aanzetten. Dit raakt het hele persoonlijke project, ook alles wat Claude via MCP beheert.
  Niet getest of het persoonlijke project dit menu toont.
- **Labels verschillen per versie.** De namen **Connection details**, **Access** en **Connected
  clients** gelden vanaf 2.33; oudere versies hebben een MCP-pagina met tabbladen.

---

## 3. ChatGPT (developer mode)

Voorwaarden: n8n minimaal 2.33, tier 1 uit, callback-allowlist gezet. Developer mode en custom MCP
hangen af van je ChatGPT-abonnement; in een Business- of Enterprise-workspace moet een admin het
toestaan.

1. **[Hans]** Ga naar `https://chatgpt.com/plugins` > plusknop > **Add custom MCP server**.
   (Oudere UI: Settings > Apps & Connectors > Advanced > Developer mode aan > Create.)
   Vanaf n8n 2.35 kan het ook via n8n: Settings > Instance-level MCP > **Connect** > **Your client**:
   ChatGPT > **Add to ChatGPT**.
2. Naam `n8n HansOS`, beschrijving bijvoorbeeld "Leest n8n-workflows en run-historie van Hans".
3. **Connection:** public endpoint `https://n8n.srv1402218.hstgr.cloud/mcp-server/http`.
4. **Authentication:** OAuth, client-id leeg laten (ChatGPT registreert zich via DCR).
5. Risicowaarschuwing lezen > **I understand and want to continue** > **Create as a plugin**.
6. **[Hans]** n8n opent het consent-scherm: inloggen als Hans, scope **Read only** kiezen
   (of **Custom**, zie modus A/B), goedkeuren.
7. Controleer de lijst ontdekte tools: in modus A mag geen enkele tool uit "Schrijven of
   uitvoeren" (sectie 1) erin staan, en ook `explore_node_resources` niet.
8. Plugin installeren, nieuw gesprek, `@` typen en de plugin kiezen.

---

## 4. Gemini CLI

OAuth met DCR werkt automatisch, maar vraagt een lokale browser (niet op een headless VPS).
Zet een vaste `redirectUri` zodat je hem in n8n kunt allowlisten, en beperk de tools aan clientzijde.
`includeTools` is een allow-list: een onbekende naam valt weg, dus dit faalt veilig. Het is hygiëne,
geen beveiliging; de echte grens is de OAuth-scope.

`~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "n8n": {
      "httpUrl": "https://n8n.srv1402218.hstgr.cloud/mcp-server/http",
      "timeout": 120000,
      "trust": false,
      "oauth": {
        "enabled": true,
        "redirectUri": "http://localhost:7777/oauth/callback"
      },
      "includeTools": [
        "search_workflows",
        "get_workflow_details",
        "get_workflow_history",
        "get_workflow_version",
        "search_executions",
        "get_execution",
        "search_projects",
        "search_folders",
        "list_tags",
        "search_data_tables"
      ]
    }
  }
}
```

Of via de CLI: `gemini mcp add --transport http n8n https://n8n.srv1402218.hstgr.cloud/mcp-server/http`
(en daarna `includeTools` toevoegen).

**[Hans]** Start `gemini`, voer `/mcp auth n8n` uit, log in bij n8n, kies **Read only**. Tokens staan in
`~/.gemini/mcp-oauth-tokens.json`. Na een upgrade: `/mcp` tonen en de toolnamen in `includeTools`
gelijktrekken.

Headless alternatief (VPS, CI): bearer met de persoonlijke MCP-token, via een omgevingsvariabele:
`"headers": { "Authorization": "Bearer $N8N_MCP_TOKEN" }`. Let op: die token heeft de volle rechten
van Hans; de docs noemen geen scopes voor de MCP-token.

---

## 5. Gemini Enterprise

Gemini Enterprise koppelt remote MCP via een **Custom MCP Server**-datastore. Alleen Streamable HTTP,
geldig publiek TLS-certificaat (klopt hier), OAuth of geen auth. Geen DCR: de client met secret maak
je zelf aan.

Voorwaarden **[Hans]**: editie Standard, Plus, Pay-as-you-go of Frontline (Business heeft een eigen
traject); rol **Discovery Engine Editor**; de organisatiebeleidsregel die Custom MCP-datastores
blokkeert uitzetten voor het project; egress-domein `n8n.srv1402218.hstgr.cloud` toestaan
(`allowedEgressFqdns`, alleen domeinnamen).

1. **[Hans of hoofdsessie, pas als de callback-allowlist aan staat]** Een OAuth-client
   registreren met de Gemini Enterprise-callback als enige redirect-URI (stappen in de private
   notitie). Het `client_secret` direct in de wachtwoordmanager, nooit in de repo of chat.
2. **[Hans]** Google Cloud console > Gemini Enterprise > **Data stores** > **Create data store** >
   zoek **Custom MCP Server** > **Add MCP server**.
3. **Authentication settings** > **OAuth 2.0**:
   - **MCP Server URL:** het endpoint uit sectie 1
   - **Authorization URL / Token URL:** de `authorize`- en `token`-endpoints onder `/mcp-oauth/`
   - **Client ID / Client Secret:** uit stap 1
   - **Enable PKCE Support:** aan (n8n ondersteunt `S256`)
   - **Scopes:** verplicht veld, maar n8n adverteert geen scopes. Niet getest welke waarde n8n
     accepteert; probeer wat het consent-scherm laat zien.
4. **Verify Auth** > inloggen bij n8n > scope **Read only** > **Continue** > multi-region kiezen,
   naam `n8n-hansos` > **Create**, wachten tot de status **Active** is.
5. **Actions** > **Reload custom actions** > alleen de leestools aanvinken (zelfde lijst als bij
   Gemini CLI) > **Enable actions**. Alles staat standaard uit; dit is een echte allow-list aan
   Gemini-kant (max 100 per keer).
6. Datastore koppelen aan de Gemini Enterprise-app; gebruikers autoriseren bij eerste gebruik.

---

## 6. Codex

`~/.codex/config.toml`:

```toml
# Vaste callback-poort zodat de redirect in n8n te allowlisten is
mcp_oauth_callback_port = 5555

[mcp_servers.n8n]
url = "https://n8n.srv1402218.hstgr.cloud/mcp-server/http"
tool_timeout_sec = 120
enabled_tools = [
  "search_workflows", "get_workflow_details", "get_workflow_history", "get_workflow_version",
  "search_executions", "get_execution", "search_projects", "search_folders", "list_tags",
  "search_data_tables",
]
```

Oudere Codex-builds hebben ook `[features]` met `experimental_use_rmcp_client = true` nodig.
**[Hans]** Daarna `codex mcp login n8n`, inloggen bij n8n, **Read only** kiezen.

Bearer-variant (headless): in hetzelfde blok `bearer_token_env_var = "N8N_MCP_TOKEN"` en de token
alleen in de omgeving zetten. Zelfde kanttekening als bij Gemini CLI: volle rechten van Hans.

---

## 7. Claude (al verbonden)

- claude.ai-connector **`Hostinger_n8n`**: OAuth op dit endpoint, als gebruiker Hans, met alle tools.
  Claude Code in deze repo gebruikt dezelfde connector. Na een upgrade houdt deze verbinding volle
  toegang; niets te doen.
- Alles wat je voor ChatGPT of Gemini uitzet, is ook voor Claude via MCP onbereikbaar
  (`get_workflow_details` en `update_workflow` weigeren dan). Daarom is modus A de standaard.
- De HansOS MCP Gateway (een MCP Server Trigger met bearer-auth) is een apart endpoint en hangt
  niet af van deze instellingen.

---

## 8. Verificatie

Zonder credentials (kan iedereen, ook een agent):

```bash
B=https://n8n.srv1402218.hstgr.cloud
curl -s $B/.well-known/oauth-protected-resource/mcp-server/http   # JSON met resource en authorization_servers
curl -s $B/.well-known/oauth-authorization-server                 # issuer, /mcp-oauth/* endpoints, S256
curl -sI $B/mcp-server/http                                       # 401 + WWW-Authenticate: Bearer
```

De n8n-versie staat in de editor onder **Help > About n8n** **[Hans]**.

Na het koppelen **[Hans]**:

1. Settings > Instance-level MCP > **Connected clients**: de nieuwe client staat erbij met de
   verwachte scope (Read only).
2. In de client: lijst de tools. Er mag geen tool uit "Schrijven of uitvoeren" (sectie 1) tussen
   staan, en ook geen `explore_node_resources`.
3. Vraag de client `get_workflow_details` op een workflow die uit MCP staat: moet weigeren. Op een
   "aan laten"-workflow moet het lukken.
4. `search_workflows` geeft alle workflownamen terug. Dat is normaal gedrag, geen lek in de exposure.
5. Vraag in modus A om `execute_workflow` op een "aan laten"-workflow: moet geweigerd worden.

---

## 9. Intrekken

- **Een OAuth-client:** **[Hans]** Settings > Instance-level MCP > **Connected clients** > client >
  **Revoke access**. Werkt direct; de client moet opnieuw inloggen. Op versies voor 2.33 staat de
  lijst met OAuth-clients op de oude MCP-pagina.
- **Clientzijde:**
  - ChatGPT: de plugin verwijderen op `https://chatgpt.com/plugins`.
  - Gemini CLI: `gemini mcp remove n8n` (let op `-s user` als hij user-scope is) en de n8n-regel uit
    `~/.gemini/mcp-oauth-tokens.json` halen.
  - Codex: het blok `[mcp_servers.n8n]` verwijderen; de OAuth-token staat in de credential-store van
    Codex (niet geverifieerd of er een `codex mcp logout` is).
  - Gemini Enterprise: de datastore verwijderen en de client intrekken in n8n.
- **De MCP-token (bearer):** Connect a client > **API key** > nieuwe token genereren. De oude is dan
  ingetrokken; elke bearer-client moet de nieuwe krijgen. Bearer-clients staan niet in Connected
  clients.
- **Noodknop, alles tegelijk (ook Claude):** Settings > Instance-level MCP > **MCP status** >
  **Disable**. Via de omgeving van de n8n-container (vanaf 2.20): `N8N_MCP_MANAGED_BY_ENV=true` en
  `N8N_MCP_ACCESS_ENABLED=false`, of `N8N_DISABLED_MODULES=mcp` om de module helemaal weg te halen.
  De HansOS MCP Gateway valt hier niet onder (eigen MCP Server Trigger met bearer): zet die
  workflow op inactief of vervang de bearer-credential om ook hem af te sluiten.

---

## 10. Alternatief: eigen MCP Server Trigger

Een eigen workflow met een **MCP Server Trigger** (versie 2) en authenticatie **n8n OAuth2** (bestaat
sinds n8n 2.27). De token geldt dan alleen voor het endpoint van die workflow, en de client ziet
alleen de tools die je daar zelf aan hangt: geen builder-tools, geen toegang tot andere workflows.
Op een n8n-versie zonder scope-keuze is dat de veiligste manier om ChatGPT of Gemini iets te laten doen. Het is wel een
tweede endpoint (`/mcp/<pad>`) naast de instance-MCP, en het vraagt een nieuwe workflow
(hoofdsessie). De bestaande HansOS MCP Gateway gebruikt bearer en is hiervoor niet geschikt zonder
ombouw.

---

## Niet geverifieerd

- Of ChatGPT de discovery accepteert (root-metadata is HTML, geen `resource_metadata`).
- Welke waarde Gemini Enterprise in **Scopes** moet sturen, en of n8n bij DCR een `client_secret`
  teruggeeft voor `client_secret_post` (de metadata adverteert het wel).
- Exacte scope-namen in de "Custom"-modus en of "Read only" executions omvat.
- Of het bulkmenu **Manage MCP access** ook op het persoonlijke project verschijnt.
- De exacte callback-URL's van claude.ai, Gemini CLI en Codex.

## Bronnen

- n8n: [Connect to n8n MCP server](https://docs.n8n.io/connect/connect-to-n8n-mcp-server),
  [MCP client connection examples](https://docs.n8n.io/connect/connect-to-n8n-mcp-server/mcp-client-examples),
  [MCP server tools reference](https://docs.n8n.io/connect/connect-to-n8n-mcp-server/mcp-server-tools-reference),
  [MCP via omgevingsvariabelen](https://docs.n8n.io/deploy/host-n8n/configure-n8n/manage-settings-using-environment-variables),
  [release notes](https://docs.n8n.io/changelog/release-notes) (2.27 MCP Trigger OAuth2, 2.32 scope-keuze,
  2.33 nieuwe MCP-instellingen, 2.35 ChatGPT one-click).
- OpenAI: [Connect from ChatGPT](https://developers.openai.com/apps-sdk/deploy/connect-chatgpt),
  [Authentication](https://developers.openai.com/apps-sdk/build/auth),
  [Codex MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli).
- Google: [Gemini CLI MCP servers](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md),
  [Gemini Enterprise custom MCP server](https://docs.cloud.google.com/gemini/enterprise/docs/connectors/custom-mcp-server/set-up-custom-mcp-server).
