

# Auto-Submit Prompt Chips on Click

## What Changes

When a user clicks a prompt chip in the Command Center sub-menu, it will immediately send the prompt instead of just filling the input bar. This removes one unnecessary step (click chip, then press Enter) and makes the interaction feel instant.

## Technical Detail

One line change in `src/components/command-center/CommandCenter.tsx`:

- **Line 416**: Change `onClick={() => cc.setInput(prompt)}` to `onClick={() => cc.processInput(prompt)}`

The `cc.processInput()` function already handles the full send pipeline (transmit, intent routing, AI call). No other files need changes.

