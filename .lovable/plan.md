
# Add Empire AI and n8n Agent Buttons to Portal Header

## What Changes
Add two separate buttons in the Portal header (next to the existing Command Center button) that are controlled by the `empire_ai_button` and `n8n_agent_button` visibility toggles in the Pages tab.

## Implementation

### Portal.tsx
1. Import `EmpireOverlay` from `@/components/overlays/EmpireOverlay` and `N8nAgentModal` from `@/components/portal/N8nAgentModal`
2. Add two new state variables: `empireOpen` and `n8nOpen`
3. In the header button row (line 183), add two new buttons gated by `isVisible()`:
   - **Empire AI Button** (`isVisible("empire_ai_button")`): violet-themed button with a Zap icon, toggles `empireOpen`
   - **n8n Agent Button** (`isVisible("n8n_agent_button")`): cyan-themed button with a Wrench icon, toggles `n8nOpen`
4. Render `EmpireOverlay` and `N8nAgentModal` at the bottom of the component, passing the open/close state

### Button styling
Each button follows the same pattern as the existing Command Center button (border, icon, label, active glow) but with distinct color themes:
- Empire AI: violet accent (`border-violet-500`, `text-violet-500`, violet glow)
- n8n Agent: cyan accent (`border-cyan-500`, `text-cyan-500`, cyan glow)

### No other files change
The `EmpireOverlay` and `N8nAgentModal` components already exist and accept `open` / `onClose` props. No modifications needed there.

## Result
Toggling "Empire AI Button" or "n8n Agent Button" off in the Pages > AI Terminals section will hide the corresponding button from the Portal header. Toggling them on makes them visible and functional.
