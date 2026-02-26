

# Smart Command List (Layer 3) for Hans AI + Empire Commander

## Overview

Add a "Layer 3" command suggestions dropdown that appears when a subcategory (Layer 2) is selected. It shows 10 contextual commands: 5 verified/working + 5 AI-suggested. The list overlays the chat area with a smooth slide-down animation. Clicking outside or pressing ESC dismisses the list and deselects the subcategory. Usage is persisted in localStorage so frequently used commands float to the top over time.

## How it works (user flow)

1. User clicks a Layer 1 category (e.g., "Infrastructure") -- Layer 2 subcategories appear (existing behavior)
2. User clicks a Layer 2 subcategory (e.g., "VPS Primary") -- **NEW: Layer 3 command list slides down** over the chat area
3. The list shows 10 commands: 5 marked as "verified" (green checkmark), 5 marked as "suggested" (sparkle icon)
4. Clicking a command sends it as a message and closes the list
5. Pressing ESC or clicking outside the list closes it AND deselects the subcategory (Layer 2 resets)
6. Over time, used commands get a usage counter stored in localStorage and sort higher

## What Changes

### 1. New data file: `src/components/ai/commandSuggestions.ts`

Defines 10 commands per subcategory for both Empire and Hans AI contexts. Each command has:
- `text`: The command string
- `verified`: boolean (true = tested/working, false = suggestion)
- `usageCount`: starts at 0 (managed at runtime via localStorage)

Example structure:
```text
empireCommands = {
  "vps-primary": [
    { text: "Check VPS disk usage and memory", verified: true },
    { text: "Restart Nginx on primary server", verified: true },
    { text: "Show active Docker containers", verified: true },
    { text: "Check SSL certificate expiry dates", verified: true },
    { text: "Tail the last 100 lines of error log", verified: true },
    { text: "Set up a cron job for daily backups", verified: false },
    { text: "Optimize Nginx worker connections", verified: false },
    { text: "Configure fail2ban for SSH protection", verified: false },
    { text: "Set up log rotation for app logs", verified: false },
    { text: "Create a health check endpoint", verified: false },
  ],
  // ... for all subcategories
}
```

Similar structure for `hansAICommands` covering SEO, Content, Feeds, etc.

### 2. New component: `src/components/ai/CommandSuggestionList.tsx`

A floating dropdown rendered absolutely positioned below the filter pills, overlaying the chat area.

- **Visual style**: Dark panel matching the overlay theme, with a subtle border
- **Layout**: Vertical list, each item shows an icon (CheckCircle2 for verified, Sparkles for suggested), the command text, and a faint usage counter badge if used before
- **Animation**: Framer Motion `height: 0 -> auto` + `opacity` transition (same pattern as Layer 2)
- **Dismiss behavior**: 
  - Click outside (via a transparent backdrop div) -- closes list + deselects subcategory
  - ESC key -- closes list + deselects subcategory
  - Click a command -- sends it, closes list, keeps the subcategory selected
- **Sorting**: Commands sorted by usage count (descending), then verified first

### 3. Modify `src/components/ai/ContextFilterPills.tsx`

- Add an `onSubSelected` callback prop that fires when a subcategory is clicked (so parent can show/hide the command list)
- Add an `activeCommandList` boolean prop to control the visual state
- The component itself doesn't render the command list -- it just signals the parent

### 4. Modify overlay components (3 files)

Update `HansAIOverlay.tsx`, `EmpireOverlay.tsx`, and `EmpireClaudePanel.tsx`:

- Add state: `showCommands: boolean`
- When `selectedSub` changes to non-null, set `showCommands = true`
- Render `CommandSuggestionList` between the filter pills and messages area, positioned to overlay the chat
- On command click: call `sendMessage(text)`, set `showCommands = false`
- On dismiss (ESC/click-outside): set `showCommands = false` + `setSelectedSub(null)`
- Add an ESC keydown listener on the command list that only dismisses commands (not the whole overlay)

### 5. localStorage persistence

Key format: `cmd_usage_{empire|hansai}` storing a record of `{ [commandText]: number }`.

On each command click, increment the counter. On render, merge stored counts into the command list and sort accordingly.

## Technical Details

### Files to create
| File | Purpose |
|---|---|
| `src/components/ai/commandSuggestions.ts` | Command data for all subcategories |
| `src/components/ai/CommandSuggestionList.tsx` | Floating command list component |

### Files to modify
| File | Change |
|---|---|
| `src/components/ai/ContextFilterPills.tsx` | Minor: pass through sub-selection signal |
| `src/components/overlays/HansAIOverlay.tsx` | Add command list state + rendering |
| `src/components/overlays/EmpireOverlay.tsx` | Add command list state + rendering |
| `src/components/empire/EmpireClaudePanel.tsx` | Add command list state + rendering |

### No database changes needed
All persistence via localStorage. No new dependencies required.

