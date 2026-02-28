

## Losse UI-elementen toevoegen als togglebare page elements

### Overzicht
5 extra elementen toevoegen aan de `page_elements` tabel onder een nieuwe pagina **"portal"**, zodat je ze vanuit de Pages-tab in het portal aan en uit kunt zetten.

### Nieuwe elementen

| Page | Group | Key | Label |
|------|-------|-----|-------|
| portal | Header | empire_ai_button | Empire AI Button |
| portal | Header | n8n_agent_button | n8n Agent Button |
| portal | Floating | terminal_button | Terminal Button |
| navbar | Admin | ai_button | Navbar AI Button |
| navbar | Admin | empire_button | Navbar Empire Button |

---

### Aanpassingen

**1. Database migration**
- 5 rijen invoegen in `page_elements` met `is_visible = true` als default.

**2. Portal.tsx**
- `usePageElements("portal")` importeren en gebruiken.
- Empire AI button wrappen in `isVisible("empire_ai_button")`.
- n8n Agent button wrappen in `isVisible("n8n_agent_button")`.

**3. EmpireTerminalCard.tsx**
- `usePageElements("portal")` toevoegen.
- Floating button verbergen als `isVisible("terminal_button")` false is.

**4. Navbar.tsx**
- `usePageElements("navbar")` toevoegen.
- AI button (admin row) wrappen in `isVisible("ai_button")`.
- Empire button (admin row) wrappen in `isVisible("empire_button")`.
- Zelfde logica toepassen op de mobiele versie van die buttons.

**5. PortalPagesTab.tsx**
- `pageLabels` uitbreiden met `portal: "Portal"` en `navbar: "Navbar"` zodat de nieuwe pagina's correct worden weergegeven in de UI.

### Technische details

Elke conditional check volgt het bestaande patroon:
```tsx
{isVisible("empire_ai_button") && (
  <button onClick={...}>Empire AI</button>
)}
```

De `usePageElements` hook heeft al een fallback: als een key niet gevonden wordt, returned `isVisible` standaard `true`. Hierdoor werkt alles direct zonder breaking changes.

