
# Constrain Command Suggestions to Chat Area

## Problem
The `CommandSuggestionList` uses `position: absolute; left: 0; right: 0` which makes it stretch to 100% of the nearest positioned ancestor. Since it sits directly inside the UnifiedChatPanel root (which fills the full-width Command Center panel), the suggestions span the entire screen width instead of staying within the chat/message area.

## Fix

### CommandSuggestionList.tsx
Change the positioning from `absolute` to `relative`. This keeps the suggestion list in the normal document flow, sitting neatly below the filter pills and above the messages area, constrained to the chat column width.

- Line 90: Remove `absolute left-0 right-0` from the className
- Replace with `relative` so it flows naturally within the layout
- Keep `z-30`, border styling, and shadow as-is

### Single-line change
```tsx
// Before
className={`absolute left-0 right-0 z-30 overflow-hidden rounded-b-lg border-b border-x ${colors.bg} shadow-xl`}

// After
className={`relative z-30 overflow-hidden rounded-b-lg border-b border-x ${colors.bg} shadow-xl`}
```

No other files need changes. This keeps the component working identically in the HansAI and Empire overlays (which are narrower panels where the issue wasn't noticeable).
