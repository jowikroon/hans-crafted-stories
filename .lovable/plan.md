

# Add Live Command Center Workflow to Wiki

## What It Does

Adds an interactive workflow visualization directly inside the **Command Center** card in the Wiki's "What Can I Use?" section. It shows a live flow diagram of what happens when you use the Command Center, populated with your most recent commands from chat history.

## Design

The Command Center card in the component registry gets expanded with a collapsible "See how it works" section containing:

1. **A visual flow diagram** (CSS-based, matching the Mermaid reference) showing the steps:
   - **Your Request** -- what you typed
   - **Understand Intent** -- AI analyzes your goal
   - **Preview Action** -- shows what will happen, with 3 possible paths:
     - **Execute** -- runs a workflow or action
     - **Modify** -- adjusts your input for better results
     - **Clarify** -- asks a follow-up question
   - **Live Result** -- the answer appears
   - **Saved to History** -- stored for next time

2. **Live recent commands** pulled from `localStorage` (`portal_chat_history_unified`) showing your last 3 commands as real data inside the flow nodes. If no history exists, placeholder examples are shown instead.

## Technical Plan

### New file: `src/components/wiki/WikiCommandFlow.tsx`
- Renders a vertical CSS flow diagram with connecting lines (same style as WikiPipeDesign)
- Reads `portal_chat_history_unified` from localStorage to extract recent user prompts
- Shows the 3 branch paths (Execute / Modify / Clarify) as a horizontal row
- Each node is a styled card with orange accent theming
- The top "Your Request" node shows the most recent actual command (live data)
- Animates in with framer-motion stagger

### Modified file: `src/components/wiki/WikiComponentRegistry.tsx`
- Import and render `WikiCommandFlow` inside the Command Center card only
- Add a small "See how it works" toggle button below the existing card content
- When expanded, shows the `WikiCommandFlow` component
- Other tool cards remain unchanged

### No database changes needed
- All data comes from existing localStorage chat history
- No new tables, no new edge functions

