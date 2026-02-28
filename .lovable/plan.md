

# Fix Command Suggestion List in Command Center

## Problem
The top-10 command/prompt suggestions that should appear when selecting main + sub-menu filters in the Command Center are broken. The root cause is a wrong `context` prop: it says `"empire"` instead of `"unified"`, so the component looks up commands from the wrong map and most sub-categories return empty results.

## Fix

### UnifiedChatPanel.tsx (single line change)
Change line 351 from:
```tsx
context="empire"
```
to:
```tsx
context="unified"
```

This ensures `CommandSuggestionList` looks up commands from `unifiedCommands` (which merges both empire and hansAI command maps), so every sub-category filter correctly shows its 10 prompt suggestions.

## No other files need changes
- `CommandSuggestionList.tsx` -- works correctly, just receives wrong context
- `commandSuggestions.ts` -- already has `unifiedCommands` with all entries
- `HansAIOverlay.tsx` -- already uses `context="hansai"` correctly

