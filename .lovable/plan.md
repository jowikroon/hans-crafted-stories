
## Unified AI Command Center

### Wat er verandert
De vier losse AI-buttons (Empire AI, n8n Agent, Navbar AI, Navbar Empire) worden vervangen door **een enkele "Command Center" button** in de Portal header, in exact dezelfde stijl als de huidige Empire AI / n8n Agent buttons. Deze opent een **unified chat panel** dat alle context-categorieen combineert (Empire infra + Hans AI SEO/Content/Feeds/Campaigns/Analytics/Code).

Daarnaast komt er een **Intent button** (bijv. bliksem- of kompas-icoon) links van de chatbalk in het paneel. Als je hierop klikt, wordt je gevraagd: "Wat is het doel van je prompt?" — het antwoord wordt via webhook naar de intent router gestuurd.

### Visueel overzicht

```text
Portal Header:
  [Command Center]  [Search]  [Logout]
       |
       v
  +--------------------------------------+
  | Command Center                       |
  | [Context pills: alle categorieen]    |
  |                                      |
  | (chat berichten)                     |
  |                                      |
  | [Intent] [________input________] [>] |
  +--------------------------------------+
```

### Nieuwe bestanden

**1. `src/components/portal/UnifiedChatPanel.tsx`**
- Gebaseerd op de bestaande `InlineChatPanel.tsx` structuur
- Combineert ALLE context-categorieen: `empireCategories` + `hansAICategories` samengevoegd
- Gecombineerd system prompt dat zowel infra als marketing/SEO afdekt
- Model picker, chat history, TVA pipeline — alles hergebruikt
- Intent button links van de textarea in de input-bar

**2. `src/components/portal/IntentButton.tsx`**
- Klein component: een button met bijv. `Compass` of `Route` icoon
- Klik opent een mini-popover/modal: "Wat is het doel van je prompt?"
- Dropdown of vrij tekstveld met de bekende workflow-categorieeen (autoseo, product-titles, health-check, product-feed, campaign, scraper)
- Bij submit: POST naar de intent-router webhook URL (configureerbaar, standaard `/functions/v1/intent-router`)
- Toont kort resultaat (intent + confidence) als inline badge naast de input

### Aanpassingen bestaande bestanden

**3. `src/pages/Portal.tsx`**
- Verwijder de twee aparte buttons (Empire AI + n8n Agent) en hun state (`empireOpen`, `n8nOpen`, hover-state, timers)
- Vervang door een enkele `commandCenterOpen` state + button in dezelfde stijl (orange accent)
- Verwijder de twee aparte `InlineChatPanel` instances
- Vervang door een enkel `UnifiedChatPanel` in een `AnimatePresence` blok
- Keyboard shortcut `Cmd+E` opent het unified panel (Cmd+J kan weg of ook naar hetzelfde panel verwijzen)

**4. `src/components/Navbar.tsx`**
- Verwijder de aparte "AI" en "Empire" buttons in row 2 (desktop + mobile)
- Vervang door een enkele "Command Center" button die de `HansAIOverlay` (of een nieuwe unified overlay) opent
- Of: verwijder navbar AI/Empire buttons volledig, aangezien alles nu via Portal draait

**5. `src/components/ai/contextCategories.ts`**
- Voeg een nieuwe export toe: `unifiedCategories` — samenvoeging van `empireCategories` + `hansAICategories`
- Eventueel de-duplicatie van overlappende subcategorieen

**6. `src/components/ai/commandSuggestions.ts`**
- Voeg een `unified` context toe die commands van zowel `empire` als `hansai` combineert

**7. `src/components/portal/PortalPagesTab.tsx`**
- De bestaande 5 page_elements (`empire_ai_button`, `n8n_agent_button`, `ai_button`, `empire_button`, `terminal_button`) blijven bestaan maar worden irrelevant — optioneel opruimen of hernoemen naar 1 "command_center_button" element

### Intent Button — technische details

De Intent button in de chat input bar:
- Icoon: `Compass` of `Route` (lucide)
- Klik: opent een klein popover met een tekstveld + dropdown van bekende intents
- Submit stuurt een POST naar de intent-router edge function met `{ input: "gebruikers tekst", context: "huidige categorie" }`
- Het response (`{ intent, confidence, clarification }`) wordt getoond als een kleine badge/chip boven de input
- De intent router zelf wordt **niet** gebouwd — alleen de UI-aanroep ernaar toe

### Wat er NIET verandert
- De `InlineChatPanel` component blijft bestaan (voor eventueel hergebruik elders)
- De overlays (`HansAIOverlay`, `EmpireOverlay`) blijven bestaan als standalone components
- De intent-router edge function zelf wordt niet aangepast
- De `EmpireTerminalCard` (floating terminal button) blijft onafhankelijk togglebaar
