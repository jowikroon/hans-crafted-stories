

# Integrate System Analysis Dashboard into Status Sub-Menu

## What changes

Replace the current Status sub-menu ("All", "Healthy", "Issues", "Tracking") with a new set of sub-pages that combine the existing status cards with the 4 analysis tabs from the uploaded file. The uploaded JSX serves as a living template -- its data (test results, architecture map, issues) should update as the site evolves.

## New sub-menu structure

| Sub-filter | Content |
|------------|---------|
| **All** | The existing 5 status summary cards (System Health, Connectors, Monday, Intents, Tracking) -- unchanged |
| **Overview** | KPI grid (test pass rate, avg confidence, workflows count, edge functions count) + system summary + issue distribution |
| **Test Results** | Table of intent router test results with confidence bars and pass/fail indicators |
| **Issues** | Expandable issue cards with severity badges, impact, and fix descriptions |
| **Architecture** | Routes map, workflow registry, and tech stack grid |

## Implementation details

### 1. Update sub-menu items in Portal.tsx

Change the `status` entry in `subMenuItems` from:
```
["All", "Healthy", "Issues", "Tracking"]
```
to:
```
["All", "Overview", "Test Results", "Issues", "Architecture"]
```

### 2. Create new component: `src/components/portal/status/AnalysisDashboard.tsx`

A single component that accepts a `subFilter` prop and renders the appropriate analysis panel. This converts the uploaded JSX from inline styles to Tailwind CSS, matching the portal's dark theme.

**Data sources** (kept as module-level constants for now, designed to be swapped to live data later):
- `testResults` array -- 20 intent router test cases with prompt, expected, matched, confidence, status
- `architecture` object -- pages array, workflows array, edge function count, i18n languages
- `issues` array -- 9 items with severity, area, issue description, impact, fix

**Sub-sections:**
- **Overview**: 4 KPI cards in a responsive grid (pass rate, avg confidence, workflow count, edge function count), system summary block, issue distribution bar
- **Test Results**: Responsive table with ID, prompt, expected, matched (color-coded by workflow category), confidence bar, pass/fail icon
- **Issues**: Expandable cards sorted by severity, click to reveal impact + fix
- **Architecture**: Routes grid (public/auth/SEO badges), workflow registry (category chips + keyword counts), tech stack 3-column grid

All styled with Tailwind to match existing portal aesthetic (dark `bg-card`, `border-border`, `text-foreground`/`text-muted-foreground`).

### 3. Update `PortalStatusTab.tsx`

Add routing logic based on `subFilter`:
- `"All"` -- render existing status cards grid (current behavior)
- `"Overview"`, `"Test Results"`, `"Issues"`, `"Architecture"` -- render `AnalysisDashboard` with the active sub-filter
- Remove old "Healthy"/"Tracking" sub-filter logic since those are replaced

### Files to create
- `src/components/portal/status/AnalysisDashboard.tsx` -- The 4-panel analysis component

### Files to modify
- `src/pages/Portal.tsx` -- Update `subMenuItems.status` array (line 32)
- `src/components/portal/PortalStatusTab.tsx` -- Add conditional rendering for new sub-filters, import AnalysisDashboard

### No new dependencies needed
Uses existing: Tailwind, lucide-react, existing UI components

