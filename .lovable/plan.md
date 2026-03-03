

# Unified Command Center — 1 Component, 3 Modes

## Overview

Build a single `CommandCenter` component that combines the best of all three existing implementations into one reusable component that works in 3 rendering modes:

1. **Popup** (overlay from Navbar/Portal) — replaces current `HansAIOverlay`
2. **Inline** (embedded panel in Portal) — replaces current `UnifiedChatPanel`
3. **Terminal** (full-page at `/hansai`) — replaces current `HansAI.tsx`

All three modes share the same state, categories, actions, AI chat, intent pipeline, and delivery picker — only the chrome (wrapper) changes.

---

## Architecture

```text
CommandCenter (single component)
  ├── mode: "popup" | "inline" | "terminal"
  ├── Layer 1: Category Tabs (10 categories from V3)
  ├── Layer 2: Action Drawer (2 hero + 4 compact + 4 history)
  ├── Layer 3: Delivery Picker (inline replace)
  ├── Chat/Terminal output (AI streaming, workflow results)
  ├── Input bar (slash commands + natural language)
  └── Shared hooks: useCommandCenter() for all state
```

---

## What gets merged from each source

| Feature | Source | Kept |
|---|---|---|
| 10 category tabs + actions + delivery picker | CommandCenterV3.tsx (uploaded) | Yes — full V3 data structure |
| AI streaming chat with intent pipeline | UnifiedChatPanel.tsx | Yes — sendToAI, runIntentPipeline, model picker |
| Slash commands (/help, /task, /idea, /run, /voice) | HansAI.tsx | Yes — all slash command handlers |
| TVA pipeline progress bar | UnifiedChatPanel.tsx | Yes |
| Context filter pills | UnifiedChatPanel.tsx | Yes — as alternative to V3 tabs |
| Hierarchy controls (Layer 1-3) | HansAI.tsx | Replaced by V3 category tabs |
| Command sidebar / history | HansAI.tsx | Merged into V3 history per category |
| Voice personas | HansAI.tsx | Yes — kept |
| n8n filter + advanced bar | UnifiedChatPanel.tsx | Yes |
| Google OAuth connect | UnifiedChatPanel.tsx | Yes |

---

## Implementation Plan

### Step 1: Create shared hook — `useCommandCenter.ts`

New file: `src/hooks/useCommandCenter.ts`

Extracts all shared state and logic from HansAI.tsx and UnifiedChatPanel.tsx into one hook:
- Messages state + append/update helpers
- AI streaming (via `hansai-chat` edge function for terminal, `n8n-agent` for inline/popup)
- Slash command routing
- Intent pipeline integration
- Workflow execution
- Task/idea management
- Voice persona management
- Model selection
- Chat history persistence
- V3 category/action/delivery state

### Step 2: Create unified component — `CommandCenter.tsx`

New file: `src/components/command-center/CommandCenter.tsx`

Single component accepting `mode` prop:

```typescript
interface CommandCenterProps {
  mode: "popup" | "inline" | "terminal";
  onClose?: () => void; // only for popup mode
}
```

**Mode differences:**
- `terminal`: Full-screen, dark bg, monospace font, JetBrains Mono, `$ ` prompt prefix, green accent, no close button
- `popup`: Fixed overlay with backdrop blur, max-w-2xl, orange accent, close button + "Full Terminal" link
- `inline`: Flex panel (no fixed positioning), orange accent, minimal chrome

**Shared UI layers:**
1. **Header**: Category tabs (horizontal scroll), model picker, history toggle
2. **Action drawer**: Animates open when category selected — shows hero cards, compact rows, verified history
3. **Delivery picker**: Replaces action drawer when action is picked
4. **Output area**: Terminal lines (terminal mode) or chat bubbles (popup/inline)
5. **Input bar**: Unified input with slash autocomplete, `$` or send button based on mode

### Step 3: Create V3 data module — `commandCenterData.ts`

New file: `src/components/command-center/commandCenterData.ts`

Move all V3 constants (categories `C`, actions `A`, delivery options `D`) from the uploaded `CommandCenterV3.jsx` into a typed TypeScript module. Add proper types for categories, actions, history items, and delivery options.

### Step 4: Update page wrappers

- **`src/pages/HansAI.tsx`**: Gut to a thin wrapper rendering `<CommandCenter mode="terminal" />`
- **`src/components/overlays/HansAIOverlay.tsx`**: Render `<CommandCenter mode="popup" onClose={onClose} />` inside the overlay chrome
- **`src/components/portal/UnifiedChatPanel.tsx`**: Render `<CommandCenter mode="inline" />`
- **`src/pages/CommandV3.tsx`**: Remove (no longer needed as separate page)

### Step 5: Fix existing build errors

Fix as part of the rewrite:
- `HansAI.tsx`: Remove `voiceStandardEditName` / `setVoiceStandardEditName` references (move to hook or add missing state)
- `CommandCenterV3.tsx`: Cast `e.target` to `HTMLElement` for `.style` access
- `App.tsx`: Fix `StaticRouter` type mismatch with proper type assertion
- `main.tsx`: Fix `PreloadedData` type cast

---

## Technical Details

### Category tabs rendering

The 10 V3 categories render as a horizontal scrolling tab bar at the top of all 3 modes. Terminal mode uses inline styles (monospace dark theme). Popup/inline modes use Tailwind classes with orange accent.

### Action drawer

When a category is selected, the drawer slides open below the tabs showing:
- 2 hero cards (grid, 2 columns)
- 4 compact action rows
- Separator with "LAST RUN — VERIFIED" label
- 4 history items (re-runnable)

Clicking an action opens the delivery picker (same area, animated replace).

### Chat output

- Terminal mode: monospace green-on-black, `hans@hq:~$` prefix, code blocks with dark bg
- Popup/inline: Clean card-style messages, markdown rendering, orange accent

### Input processing

Single `processInput()` function that handles:
1. Slash commands (exact match)
2. Natural language mapping (task/idea/clear shortcuts)
3. V3 category matching (`/pricing`, `/seo`, etc.) — opens category + auto-matches best action
4. Intent pipeline (workflow match / clarify / fallback)
5. AI chat fallback

---

## Files Created/Modified

| File | Action |
|---|---|
| `src/hooks/useCommandCenter.ts` | **Create** — shared state hook |
| `src/components/command-center/commandCenterData.ts` | **Create** — V3 categories, actions, delivery data |
| `src/components/command-center/CommandCenter.tsx` | **Create** — unified component |
| `src/pages/HansAI.tsx` | **Rewrite** — thin wrapper |
| `src/components/overlays/HansAIOverlay.tsx` | **Edit** — use new component |
| `src/components/portal/UnifiedChatPanel.tsx` | **Rewrite** — thin wrapper |
| `src/pages/CommandV3.tsx` | **Delete** |
| `src/components/command-center/CommandCenterV3.tsx` | **Delete** (data moves to commandCenterData.ts) |
| `src/App.tsx` | **Fix** — StaticRouter type |
| `src/main.tsx` | **Fix** — PreloadedData type |

