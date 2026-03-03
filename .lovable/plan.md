

# Auto-Suggest in All Terminal Inputs

## What It Does

As users type in any terminal input (Command Center, Empire Overlay), a subtle ghost-text autocomplete appears inline -- showing the best matching suggestion in faded text after the cursor. Press **Tab** to accept, keep typing to refine.

## How It Works

### 1. Create `AutoSuggestInput` Component

New file: `src/components/command-center/AutoSuggestInput.tsx`

A drop-in replacement for `<input>` that layers a ghost suggestion over the typed text:

- Takes same props as a standard input (`value`, `onChange`, `onKeyDown`, `placeholder`, etc.)
- Accepts a `suggestions: string[]` prop -- the pool of completable strings
- As the user types, finds the first suggestion that starts with the current input (case-insensitive)
- Renders the "remainder" of the match as faded ghost text positioned after the typed characters
- **Tab key** accepts the suggestion (fills the input with the full match)
- Ghost text uses the same font but at ~25% opacity
- Implementation: a `<div>` wrapper with `position: relative`, containing the real `<input>` and an absolutely-positioned `<span>` overlay for the ghost text, both sharing identical font/padding so they align perfectly

### 2. Build Suggestion Pool

The suggestion pool for each terminal context combines:

- **Slash commands**: `/help`, `/run`, `/clear`, `/autofull`, etc. (from `SLASH_COMMANDS` in `useCommandCenter.ts`)
- **Category sub-item prompts**: All prompts from `CATEGORY_SUBS` for the currently active category (from `commandCenterData.ts`)
- **Recent user messages**: Last 10 unique user messages from the current session (from `cc.messages`)

For **Empire Overlay**: the pool is the `SUGGESTIONS` array texts plus the `commandSuggestions` from the active sub-category.

### 3. Integrate into Command Center (`CommandCenter.tsx`)

Replace the `<input>` at line 601 with `<AutoSuggestInput>`:

- Pass `suggestions` built from slash commands + active category prompts + recent messages
- Forward all existing props (value, onChange, onKeyDown, placeholder, disabled, style, ref)
- Ghost text color adapts to mode: emerald for terminal, neo-green for autofull, neutral for popup

### 4. Integrate into Empire Overlay (`EmpireOverlay.tsx`)

Replace the `<input>` at line ~240 with `<AutoSuggestInput>`:

- Suggestions pool: `SUGGESTIONS` texts + active sub-category commands
- Ghost text in violet tint to match Empire's color scheme

### 5. Keyboard Behavior

- **Tab**: Accept the ghost suggestion, fill input
- **Right Arrow** (when cursor at end): Also accepts suggestion
- **Escape**: Dismiss ghost (already handled for overlay close -- only dismiss ghost if suggestion is showing)
- All other keys: Continue typing normally, ghost updates in real-time

## Visual Style

The ghost text is intentionally very subtle:
- Same font family and size as the input
- Opacity 0.2 (barely visible, just enough to notice)
- No background, no border -- pure inline text continuation
- Positioned exactly where the cursor ends using a hidden measuring span

## Files to Create/Modify

| File | Change |
|------|--------|
| `src/components/command-center/AutoSuggestInput.tsx` | **New** -- reusable auto-suggest input component |
| `src/components/command-center/CommandCenter.tsx` | Replace `<input>` with `<AutoSuggestInput>`, build suggestion pool from slash commands + category prompts + history |
| `src/components/overlays/EmpireOverlay.tsx` | Replace `<input>` with `<AutoSuggestInput>`, build suggestion pool from SUGGESTIONS + sub-commands |

## Technical Approach

The component uses a hidden `<span>` that mirrors the typed text to measure its pixel width, then positions the ghost text starting at that offset. This avoids canvas measurement and works with any font:

```text
[  $ |typed text|ghost remainder          ]
      ^real input    ^faded span overlay
```

No external dependencies needed -- pure React + CSS positioning.
