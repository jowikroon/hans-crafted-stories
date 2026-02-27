

# Dark-by-default Portal + Remove Tooltips + AI Agent Hover Glow

## Overview
Three changes: (1) force dark mode as default, move the toggle to the header, (2) remove all `InfoTooltip` usage from the portal, (3) replace AI agent button tooltips with a 1-second delay hover description + glow effect (50% on hover, 100% on click/active).

## Changes

### 1. Default to dark mode
**File: `src/pages/Portal.tsx`**
- Change the `useState` initializer for `isDark` to default to `true` instead of `false` when no localStorage value exists.
- The Light/Dark toggle button is already in the header (line 191-197) — no move needed, it stays.

### 2. Remove all InfoTooltip usage from Portal
**Files affected:**
- `src/pages/Portal.tsx` — Remove `InfoTooltip` import and all 4 usages:
  - Line 209: Empire AI button tooltip
  - Line 222: n8n Agent button tooltip  
  - Line 302: Tab navigation tooltips (inside the tabs loop)
- `src/components/portal/PortalToolsTab.tsx` — Remove `InfoTooltip` import and usage on line 289 (Edit Layout button)
- `src/components/portal/SortableToolCard.tsx` — Remove `InfoTooltip` import and usage on the tool card header (the `?` icon next to tool names)

### 3. AI Agent buttons: hover description + glow effect
**File: `src/pages/Portal.tsx`**

Replace the Empire AI and n8n Agent buttons with enhanced versions that:

- **Hover description (1s delay)**: On mouse enter, after 1 second, show a small description text below/beside the button:
  - Empire AI: "Build, automate & manage your AI infrastructure"
  - n8n Agent: "Build, fix & troubleshoot automation workflows"
- Use `onMouseEnter`/`onMouseLeave` with a `setTimeout` (1000ms) pattern and local state for each button.
- **Glow states**:
  - Default: no glow
  - Hover: 50% glow — `shadow-[0_0_12px_hsl(160_80%_45%/0.15)]` (emerald) / `shadow-[0_0_12px_hsl(270_80%_55%/0.15)]` (purple)
  - Active/clicked: 100% glow — `shadow-[0_0_16px_hsl(160_80%_45%/0.35)]` (emerald) / `shadow-[0_0_16px_hsl(270_80%_55%/0.35)]` (purple), plus existing active styles
- The description appears as a small absolutely-positioned tooltip-like element with fade-in animation.

## Technical Details

### Hover description component pattern
```text
const [empireHover, setEmpireHover] = useState(false);
const empireTimerRef = useRef<NodeJS.Timeout>();

onMouseEnter -> setTimeout(1000) -> setEmpireHover(true)
onMouseLeave -> clearTimeout + setEmpireHover(false)
```

A small `<span>` or `<div>` with `absolute` positioning appears below the button with `animate-fade-in` when the hover state is true.

### Glow CSS classes
- Hover (50%): `hover:shadow-[0_0_12px_...]` with half-opacity color
- Active (100%): existing `empireOpen` / `n8nOpen` conditional already applies the border + bg; extend with stronger shadow

### Files changed

| File | Action |
|---|---|
| `src/pages/Portal.tsx` | Default dark, remove InfoTooltips, add hover descriptions + glow to AI buttons |
| `src/components/portal/PortalToolsTab.tsx` | Remove InfoTooltip import + usage |
| `src/components/portal/SortableToolCard.tsx` | Remove InfoTooltip import + usage |

