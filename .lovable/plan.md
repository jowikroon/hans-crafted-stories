

# Embed Command Center as Inline Panel on AI Hub Page

## What Changes

The Command Center currently only appears as a floating overlay (popup) or full-page terminal. This change embeds it directly on the `/ai` page as a visible, always-present panel below the AI cards grid -- no click required to open it.

## Layout

Below the existing cards grid, add a new section with a bordered container housing the `CommandCenter` component in `inline` mode. It sits naturally in the page flow, styled to match the dark theme, with a fixed height (~50vh) so it doesn't overwhelm the page.

```text
+------------------------------------------+
|  AI Interfaces (hero + pills + cards)    |
+------------------------------------------+
|                                          |
|  +------------------------------------+  |
|  | COMMAND CENTER (inline mode)       |  |
|  | Category tabs | Model picker       |  |
|  | Action drawer / messages area      |  |
|  | Input bar                          |  |
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
```

## Changes

### `src/pages/AIHub.tsx`

1. Import `CommandCenter` from `@/components/command-center/CommandCenter`
2. After the cards grid `</div>`, add a new section:
   - A section header: "Command Center" with the terminal icon
   - A bordered container (`rounded-xl border border-orange-500/20 bg-[hsl(220,20%,8%)]`) with a fixed height of `50vh`
   - Inside it, render `<CommandCenter mode="inline" />`
3. Remove the "Command Center Popup" card from the cards array (since it's now visible on the page), or keep it but change its action to scroll down to the embedded panel

### No other files need to change

The `CommandCenter` component already supports `mode="inline"` -- it renders without the overlay wrapper, no close button, and fits its parent container.

## Technical Details

- The `CommandCenter` already handles `inline` mode styling (no terminal background, orange accent, border-based layout)
- The container uses `overflow-hidden` and the CommandCenter's internal `flex flex-col h-full` fills it
- On mobile, the panel stacks naturally below the cards at full width
- The existing popup overlay (`HansAIOverlay`) state and the "Command Center Popup" card can remain as-is for users who prefer the floating version, or be removed to avoid redundancy

