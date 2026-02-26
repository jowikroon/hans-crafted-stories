

# Portal UX Overhaul: Professional Menu, Better Filtering, More White Space

## Current Issues
- Category filter pills are cramped in a single scrollable row with no visual hierarchy
- Tool cards have duplicated category badges (one in the card header, one at the bottom) -- redundant
- The grid has tight `gap-4` spacing with minimal breathing room
- The tab navigation bar (Tools/Content/Pages/Users/Status) feels dense and pill-like
- Header area has many action buttons crowded together
- The "Edit Layout" button sits inline with filters, creating visual clutter

## Design Changes

### 1. Remove duplicate category badge from card bottom
The category badge already appears in the card header (top-right). The bottom badge added in the last edit is redundant. Remove it and let the card breathe with natural whitespace at the bottom instead.

### 2. Clean up unused mock run history code
The `showHistory` state, `runs` state, `generateMockRuns` function, and the entire history overlay are dead code. Removing them reduces the component by ~80 lines and keeps things clean.

### 3. Redesign category filter bar
Replace the flat pill row with a spaced, professional filter section:
- Add a subtle section header: "Filter by category" in muted text
- Increase pill padding and spacing (`gap-3`, `px-5 py-2`)
- Add tool count badges inside each pill (e.g., "SEO (3)")
- Add a subtle bottom border separator between filters and grid

### 4. Increase white space throughout
- Portal section: increase horizontal padding from `px-4 sm:px-6` to `px-5 sm:px-8`
- Header bottom margin: `mb-5` to `mb-8`
- Filter bar bottom margin: `mb-5` to `mb-8`
- Grid gap: `gap-4` to `gap-5 sm:gap-6`
- Tab navigation bottom margin: `mb-5` to `mb-8`

### 5. Refine tab navigation
- Increase tab pill padding for more touch space and breathing room
- Add a subtle divider line below the tabs (via a wrapper border-b)

### 6. Separate Edit Layout from filter bar
Move the "Edit Layout" button to its own row below the filters or make it right-aligned with more visual separation using a vertical divider.

## Files Modified

| File | What Changes |
|------|-------------|
| `src/components/portal/SortableToolCard.tsx` | Remove bottom category badge, remove all mock run history code (state, generator, overlay) |
| `src/components/portal/PortalToolsTab.tsx` | Redesign filter bar with counts, increase grid gap and spacing |
| `src/pages/Portal.tsx` | Increase white space: padding, margins between header/tabs/content |

## Technical Details

**SortableToolCard.tsx changes:**
- Delete lines 51-58 (generateMockRuns function)
- Remove `showHistory` and `runs` state (lines 77-78)
- Remove the bottom category badge div (lines 209-213)
- Delete the entire History Overlay block (lines 216-279)
- Remove unused imports: `Clock`, `X`, `AnimatePresence`

**PortalToolsTab.tsx changes:**
- Count tools per category for badge display
- Add filter section with count badges: `All (11)`, `SEO (3)`, etc.
- Increase grid gap to `gap-5 sm:gap-6`
- Add margin-bottom of `mb-8` to filters section
- Add a subtle separator (`border-b border-border/50 pb-6 mb-8`) below filters

**Portal.tsx changes:**
- Section padding: `px-5 sm:px-8 lg:px-12`
- Header margin: `mb-8 sm:mb-10`
- Tab nav margin: `mb-8`
- Add `pb-2` to tab wrapper for breathing room

