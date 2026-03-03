

# Command Center Panel UX Improvements

## Problem
The Command Center panel on the Portal page has no click-outside-to-close behavior, no Escape key dismissal, and the backdrop overlay blocks interaction with the toggle button. This makes the panel feel "sticky" and hard to dismiss.

## Changes (all in `src/pages/Portal.tsx`)

### 1. Make backdrop clickable to close
Change the backdrop `motion.div` (line 334-342) from `pointerEvents: "none"` to a clickable element that calls `setCommandCenterOpen(false)` on click. This gives users the expected "click outside to dismiss" behavior.

### 2. Add Escape key listener
Add an `useEffect` that listens for the `Escape` key when `commandCenterOpen` is true, and closes the panel. This complements the existing `Ctrl+E` / `Ctrl+J` toggle shortcut.

### 3. Keep toggle button above backdrop
Ensure the Command Center toggle button (line 236-253) has a `z-index` higher than the backdrop (`z-30`) so it remains clickable even when the panel is open. This lets users toggle the panel off by clicking the same button they used to open it.

## Technical Details

- **Backdrop**: Remove `pointerEvents: "none"`, add `onClick={() => setCommandCenterOpen(false)}` and `cursor-pointer` to the backdrop div
- **Escape handler**: New `useEffect` watching `commandCenterOpen`, adds a `keydown` listener for `Escape` that sets `commandCenterOpen(false)`
- **Button z-index**: Add `relative z-40` to the Command Center toggle button wrapper so it sits above the `z-30` backdrop
- **Click propagation**: Add `onClick={e => e.stopPropagation()}` on the command center panel `motion.div` to prevent clicks inside it from closing via the backdrop

