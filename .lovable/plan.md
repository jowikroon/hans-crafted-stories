

## Dedicated `command_center_button` page element

### Wat er verandert
Een nieuw `page_elements` record wordt toegevoegd zodat de Command Center button een eigen toggle krijgt, onafhankelijk van de oude `empire_ai_button` en `n8n_agent_button`.

### Database
Insert 1 rij in `page_elements`:

| page | group | key | label | is_visible |
|------|-------|-----|-------|------------|
| portal | Header | command_center_button | Command Center | true |

### Code aanpassing

**`src/pages/Portal.tsx`**
- Vervang de huidige check `(isVisible("empire_ai_button") || isVisible("n8n_agent_button"))` door `isVisible("command_center_button")` op beide plekken (button + AnimatePresence panel).
- De oude `empire_ai_button` en `n8n_agent_button` elementen blijven in de database bestaan en togglebaar via de Pages-tab, maar hebben geen effect meer op de Command Center.

