

# Redesign Status Dashboard -- Summary-First, Detail-on-Demand

## What changes

Replace the current dense, scrolling `PortalStatusTab` (719 lines) with a clean dashboard that shows 3-4 summary cards on the main screen. Each card is clickable and opens a detail drawer. Users understand system state in 5 seconds; full detail is one click away.

## Information architecture

| Section | Purpose | Default view | Detail view (drawer) |
|---------|---------|--------------|----------------------|
| **System Health** | Are services running? | Single summary card: green/amber/red chip + "5/5 online" | Drawer with per-service tiles, latency, error messages |
| **Connectors** | External integrations status | Card: "3/4 linked" with status chip | Drawer with each connector and connected/not-linked state |
| **Monday.com** | Incoming tasks needing action | Card: badge count of to-do items | Drawer with to-do list + done history, approve actions |
| **Unhandled Intents** | AI routing gaps | Card: count of unresolved intents | Drawer with intent list, assign-to-workflow actions |

Tracking Scripts manager stays as-is but moves behind a "Tracking Scripts" card that opens it in a drawer too.

## Primary screen layout

```text
+--------------------------------------------------+
|  Status           [Healthy / Issues / ...]  [Refresh] |
+--------------------------------------------------+
|                                                    |
|  +------------------+  +------------------+       |
|  | System Health    |  | Connectors       |       |
|  | [green chip]     |  | 3/4 linked       |       |
|  | 5/5 online       |  | [amber chip]     |       |
|  +------------------+  +------------------+       |
|                                                    |
|  +------------------+  +------------------+       |
|  | Monday.com       |  | Unhandled Intents|       |
|  | 2 pending        |  | 0 unresolved     |       |
|  | [amber chip]     |  | [green chip]     |       |
|  +------------------+  +------------------+       |
|                                                    |
|  +------------------+                              |
|  | Tracking Scripts |                              |
|  | 3 active         |                              |
|  +------------------+                              |
+--------------------------------------------------+
```

2-column grid (1-col on mobile). Each card is ~80px tall, clickable. On click, a right-side drawer slides in with full details.

## Core components

### 1. StatusSummaryCard (reusable)
- **Default**: Icon, title, one-line summary text, status chip (OK/Warning/Critical)
- **On click**: Opens a Drawer with the full detail panel for that section
- Uses existing Card component + Drawer from vaul

### 2. StatusChip (reusable)
- Three states: OK (emerald), Warning (amber), Critical (red)
- Pill shape, icon + label, ~20px height
- Replaces the scattered StatusDot logic

### 3. Detail Drawers (one per section)
- **HealthDetailDrawer**: The existing 5-tile grid with latency, endpoints, errors
- **ConnectorDetailDrawer**: Connector list with plug/unplug icons
- **MondayDetailDrawer**: To-do/Done submenu with approve actions, trigger agent URL
- **IntentsDetailDrawer**: Unhandled intents list with assign/dismiss actions
- **TrackingDetailDrawer**: Wraps existing TrackingScriptsManager

### 4. StatusOverviewBar
- A single-line bar at the top showing overall system state: total online count + last-checked timestamp + refresh button
- Replaces current scattered header logic

## Progressive disclosure pattern

**Drawer** is the right pattern here because:
- Content is secondary/diagnostic -- not a primary workflow
- Users want to glance and close, not navigate away
- Drawers maintain context (user sees they're still on Status)
- All existing section content fits naturally in a drawer panel

## Status visual language

| Level | Color | Icon | When |
|-------|-------|------|------|
| OK | `emerald-500` | `CheckCircle2` | All services up, 0 issues |
| Warning | `amber-500` | `AlertTriangle` | Some degraded, items pending |
| Critical | `red-500` | `XCircle` | Service(s) down |
| Checking | `muted-foreground/40` | pulse animation | During health check |

- Minimal color use: chips use 8% opacity background + full icon
- No sparklines or charts (no historical data to justify them)
- Latency numbers only shown in detail drawers, not on summary cards

## Technical implementation

### Files to modify
- **`src/components/portal/PortalStatusTab.tsx`** -- Complete rewrite. Split into:
  - Main component: 5 `StatusSummaryCard` components in a grid
  - State management stays (health checks, connectors, Monday, intents)
  - Each drawer content is a section of the current code, extracted

### New files to create
- **`src/components/portal/status/StatusSummaryCard.tsx`** -- Reusable card component
- **`src/components/portal/status/StatusChip.tsx`** -- OK/Warning/Critical chip
- **`src/components/portal/status/HealthDetailDrawer.tsx`** -- Service tiles detail
- **`src/components/portal/status/ConnectorDetailDrawer.tsx`** -- Connectors detail
- **`src/components/portal/status/MondayDetailDrawer.tsx`** -- Monday events detail
- **`src/components/portal/status/IntentsDetailDrawer.tsx`** -- Unhandled intents detail

### No files deleted
- `TrackingScriptsManager.tsx` stays as-is, rendered inside a drawer

### Dependencies used
- Existing: `vaul` (Drawer), `lucide-react`, `framer-motion`, Tooltip, Card
- No new dependencies needed

### Sub-filter behavior
- "All": shows all 5 cards
- "Healthy": shows only cards with OK status
- "Issues": shows only cards with Warning/Critical status  
- "Tracking": shows only the Tracking Scripts card (opened automatically)

## Verification checklist
- [ ] Main view has max 5 cards visible -- no scrolling walls of data
- [ ] Each card communicates status in under 2 seconds (chip + number)
- [ ] Full detail is accessible in exactly 1 click (drawer open)
- [ ] Drawer can be closed with Escape, click outside, or close button
- [ ] Mobile: cards stack to 1 column, drawers use full-width bottom sheet
- [ ] Color contrast meets WCAG AA on dark background
- [ ] Refresh button is always visible (overview bar), not buried
- [ ] No tooltips or info icons on the summary view (clean surface)
- [ ] Keyboard: cards are focusable, Enter opens drawer

