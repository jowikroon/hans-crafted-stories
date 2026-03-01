
# Clean Dashboard UI Redesign for Command Center

## Overview

Replace the current terminal-style Command Center (`/hansai`) with a calm, dashboard-style interface following "summary-first, detail-on-demand" principles. The terminal input remains the core interaction, but it sits inside a clean, card-based layout instead of a full-screen terminal.

---

## 1. Information Architecture

| Section | Purpose |
|---|---|
| **Status Strip** | 5-second scan: are systems healthy? One horizontal bar with colored dots. |
| **Quick Actions** | 3-4 primary action cards (Run Workflow, Write Prompt, Launch Campaign, AI Chat) |
| **Terminal** | The core input/output, but sized to ~50% of viewport, not 100% |
| **Recent Activity** | Last 5 commands with type icons, replaces the full sidebar |

Four sections, nothing more. Everything else is behind a click.

---

## 2. Primary Screen Layout

```text
+----------------------------------------------------------+
| Status Strip (single row, inline)                        |
| [DB *] [Auth *] [Functions *] [Storage *] [API *]  5/5  |
+----------------------------------------------------------+
|                                                          |
|  Quick Actions (2x2 grid of cards)                       |
|  +-------------+  +-------------+                        |
|  | Run Workflow |  | AI Chat     |                        |
|  +-------------+  +-------------+                        |
|  +-------------+  +-------------+                        |
|  | Write Prompt |  | Campaign    |                        |
|  +-------------+  +-------------+                        |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  Terminal (compact, ~40vh)                                |
|  > Ready.                                                |
|  $ _                                                     |
|                                                          |
+----------------------------------------------------------+
|  Recent Activity (horizontal scroll, last 5 commands)    |
+----------------------------------------------------------+
```

- No left sidebar by default. The `CommandSidebar` becomes a slide-out drawer triggered by a small icon.
- The `HierarchyControls` collapse into a single-line dropdown showing the current goal, expandable on click.
- Mobile: stack everything vertically, quick actions become 1-column.

---

## 3. Core Components

### A. Status Strip (refactored from PortalStatusTab header)
- **Default**: Single row of 5 small dots with labels. Green = OK, amber = slow, red = down.
- **On click**: Opens a drawer from the right showing full PortalStatusTab content (latencies, connectors, unhandled intents).

### B. Quick Action Card (new reusable component)
- **Default**: Icon + label + one-line description. Muted border, subtle hover glow.
- **On click**: Either opens inline form (Campaign, Prompt) or focuses the terminal with pre-filled slash command (`/run`, `/ai`).

### C. Compact Terminal (refactored from current HansAI)
- **Default**: Shows last ~15 lines of output, input bar at bottom. Max height 40vh with scroll.
- **On click/focus**: Expands to full-height mode (current behavior) with a "minimize" button to return.

### D. Recent Activity Row (refactored from CommandSidebar)
- **Default**: Horizontal row of the last 5 command chips (type icon + truncated text).
- **On click chip**: Replays the command in terminal.
- **On "View all"**: Opens the full CommandSidebar as a right drawer.

### E. Detail Drawer (new, replaces modals where possible)
- Right-side slide-in panel (using existing Sheet component).
- Used for: Status details, full command history, hierarchy controls.
- Why drawer over modal: maintains spatial context, doesn't block the terminal, consistent with mobile patterns.

---

## 4. Progressive Disclosure Pattern

| Interaction | Pattern | Reason |
|---|---|---|
| System status details | **Right drawer** | Non-blocking, user can glance and close |
| Command history | **Right drawer** | Same pattern as status, consistent |
| Hierarchy controls | **Collapsible inline** | Needs to stay near terminal for context |
| Campaign/Prompt forms | **Inline expansion** | Already works well, keep it |
| Workflow clarification | **Inline chips** | Already works well, keep it |

Never use a modal for information display. Modals are only for destructive confirmations.

---

## 5. Status and Visual Language

### Status Levels
| Level | Color | Icon | Use |
|---|---|---|---|
| OK | `emerald-500` | Filled circle | Service online, latency < 200ms |
| Warning | `amber-500` | Filled circle | Online but slow (200-500ms) |
| Critical | `destructive` | Filled circle | Offline or > 500ms |
| Unknown | `muted-foreground/30` | Pulsing circle | Still checking |

### Diagram Usage
- **No charts on the main view.** The activity matrix (GitHub-style heatmap) moves into the command history drawer -- it's interesting but not scan-critical.
- **Sparklines**: Only if we add latency history later (not in this iteration).
- **Status bar**: The existing 5-dot horizontal bar stays as the only "diagram" -- it's the right abstraction.

### Interaction Behavior
- Status dots: hover shows tooltip with label + latency. Click opens full status drawer.
- Quick action cards: hover shows subtle border glow (existing pattern). Click triggers action.
- Terminal lines: hover reveals timestamp (existing pattern, keep it).

---

## 6. Technical Implementation

### Files to Create
- `src/components/command-center/StatusStrip.tsx` -- Compact horizontal status bar with drawer trigger
- `src/components/command-center/QuickActionCard.tsx` -- Reusable action card component
- `src/components/command-center/RecentActivityRow.tsx` -- Horizontal recent commands
- `src/components/command-center/StatusDrawer.tsx` -- Right drawer wrapping PortalStatusTab content

### Files to Modify
- `src/pages/HansAI.tsx` -- Major refactor: replace full-screen terminal with dashboard layout. Extract terminal into a contained component. Add StatusStrip, QuickActions, RecentActivity sections.
- `src/components/hansai/CommandSidebar.tsx` -- Convert from always-available sidebar to drawer-triggered panel
- `src/components/command-center/HierarchyControls.tsx` -- Collapse into single-line summary with expand-on-click

### No database changes needed.

---

## 7. Verification Checklist

| Check | How the design handles it |
|---|---|
| Can user understand system state in 5 seconds? | Status strip is the first thing visible, single row of dots |
| Is the default view calm? | Only 4 sections, no charts, no dense tables |
| Is detail still complete? | Everything is one click away in drawers |
| Are there too many charts? | Zero charts on main view. Heatmap is in drawer only. |
| Is mobile usable? | Stack layout, touch targets >= 44px, drawer instead of sidebar |
| Is contrast accessible? | Reusing existing Tailwind tokens which are contrast-safe |
| Can user navigate by keyboard? | Tab order: status -> actions -> terminal -> recent. Focus states on all interactive elements |
| Common failure: too many cards | Avoided: exactly 4 quick actions, not configurable |
| Common failure: information overload | Avoided: hierarchy controls collapsed by default |
| Common failure: unclear CTAs | Avoided: each quick action card has a clear verb label |
