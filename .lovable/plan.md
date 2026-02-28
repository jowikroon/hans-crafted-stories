

## Fix: Navbar Command Center koppelen aan `command_center_button`

### Probleem
De Navbar (`src/components/Navbar.tsx`) gebruikt op twee plekken nog de oude visibility check `isNavVisible("ai_button") || isNavVisible("empire_button")` om de Command Center button te tonen/verbergen. Dit betekent dat de nieuwe dedicated `command_center_button` toggle geen effect heeft op de navbar.

### Oplossing
Omdat `command_center_button` in de database is opgeslagen onder `page: "portal"`, maar de Navbar leest alleen `page: "navbar"` elementen via `usePageElements("navbar")`, zijn er twee opties:

**Gekozen aanpak:** Een tweede `command_center_button` record toevoegen aan de database met `page: "navbar"`, zodat de bestaande `usePageElements("navbar")` hook het automatisch oppikt. Dit houdt de architectuur consistent (elke page heeft zijn eigen element keys).

### Database
Insert 1 rij in `page_elements`:

| page | group | key | label | is_visible |
|------|-------|-----|-------|------------|
| navbar | Admin | command_center_button | Navbar Command Center | true |

### Code aanpassing

**`src/components/Navbar.tsx`** (2 wijzigingen)
- **Regel 264**: Vervang `(isNavVisible("ai_button") || isNavVisible("empire_button"))` door `isNavVisible("command_center_button")`
- **Regel 305**: Zelfde vervanging voor de mobiele menu variant

De oude `ai_button` en `empire_button` navbar elementen blijven bestaan in de database maar hebben dan geen effect meer op de Command Center visibility.

### Resultaat
Na deze fix stuurt 1 toggle ("Navbar Command Center" onder AI Terminals) de zichtbaarheid van de Command Center button in de navbar, onafhankelijk van de Portal header toggle.
