

## Bestaande AI-toggles laten werken met het Command Center

### Probleem
In `Portal.tsx` wordt `usePageElements("portal")` geimporteerd maar `isVisible()` wordt nergens gebruikt. De Command Center button toont altijd, ongeacht of `empire_ai_button` of `n8n_agent_button` uit staan in de Pages-tab.

### Wat er moet veranderen

**1. `src/pages/Portal.tsx`**
- Wrap de Command Center button + het chat panel met een `isVisible` check:
  - Toon de button alleen als `isVisible("empire_ai_button") || isVisible("n8n_agent_button")` true is
  - Zo kan je per element beslissen of het Command Center zichtbaar is
- Als beide uit staan, verdwijnt de Command Center button volledig

**2. Geen database-wijzigingen nodig**
De 5 bestaande page_elements (`empire_ai_button`, `n8n_agent_button`, `terminal_button`, `ai_button`, `empire_button`) staan al in de database en worden correct getoond in de Pages-tab. Het enige wat ontbreekt is de koppeling in Portal.tsx.

### Samenvatting van wat al werkt
- Navbar: Command Center button checkt al `isNavVisible("ai_button") || isNavVisible("empire_button")` (correct)
- EmpireTerminalCard: checkt al `isVisible("terminal_button")` (correct)
- Portal.tsx: **ontbreekt** - wordt nu toegevoegd

