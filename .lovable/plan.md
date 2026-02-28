

# Wire Up AI Terminals Visibility Filters

## Problem
The Portal Pages tab shows toggle switches for AI terminal elements (Empire AI Button, n8n Agent Button, Terminal Button, Navbar AI Button, Navbar Command Center), but toggling them on/off has no effect -- the actual UI components don't check these visibility flags.

Only `command_center_button` is currently wired up in Portal.tsx and Navbar.tsx. The remaining element keys (`empire_ai_button`, `n8n_agent_button`, `terminal_button`, `ai_button`) exist in the database but are never referenced in component code.

## What Changes

### 1. Portal.tsx -- Gate remaining AI buttons with isVisible()
The portal header currently renders the Command Center button conditionally (already works). We need to also check:
- `empire_ai_button` -- if a separate Empire AI button exists in the header
- `n8n_agent_button` -- if a separate n8n Agent button exists in the header

Since the Portal currently only shows the unified Command Center button (the old separate buttons were consolidated), we need to verify which buttons still render independently and wrap them with `isVisible()` checks.

### 2. Navbar.tsx -- Gate AI/Empire navbar buttons with isVisible()
The navbar has `isNavVisible("command_center_button")` already working. We need to add:
- `isNavVisible("ai_button")` -- to control the Navbar AI Button visibility
- `isNavVisible("empire_button")` -- to control the Navbar Empire Button visibility (if rendered)

Currently the navbar only renders the Command Center button for admins. If the AI button and Empire button are separate links/buttons in the navbar (like `/hansai` or `/empire` links), those need to be gated too.

### 3. PortalFloatingDock.tsx or other floating elements
The `terminal_button` element (page: portal, group: Floating) should control the floating terminal/dock button visibility. We need to pass `isVisible("terminal_button")` from Portal.tsx down to PortalFloatingDock or conditionally render it.

## Implementation Details

### Portal.tsx
- Already uses `usePageElements("portal")` and `isVisible()`
- Wrap the PortalFloatingDock render with `isVisible("terminal_button")`
- Confirm if `empire_ai_button` and `n8n_agent_button` map to any currently visible standalone buttons in the header (if the Command Center replaced them, these toggles may just need to remain as "legacy" controls or be repurposed)

### Navbar.tsx  
- Already uses `usePageElements("navbar")` and `isNavVisible()`
- The admin nav links to `/empire` and `/hansai` (if any) need to be wrapped with the corresponding visibility checks
- The Command Center button is already gated -- no changes needed there

### PortalFloatingDock.tsx
- Accept a new `visible` prop (or handle the check in Portal.tsx by conditionally rendering the component)
- When `terminal_button` is toggled off, hide the entire floating dock

## Files to Modify
- `src/pages/Portal.tsx` -- add isVisible checks for floating dock and any remaining header buttons
- `src/components/Navbar.tsx` -- add isNavVisible checks for AI-related nav elements  
- `src/components/portal/PortalFloatingDock.tsx` -- (possibly) accept visibility prop

