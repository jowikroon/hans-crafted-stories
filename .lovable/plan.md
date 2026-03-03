

# Improve Progress Bar Details, User Prompt After Delivery, and /autofull Command

## 1. Richer Pipeline Progress Bar

The current pipeline bar shows 5 stages with single-word labels (TRANSMIT, INTENT, ANALYZE, SYNTHESIZE, COMPLETE). Replace these with descriptive sub-labels that explain what's actually happening at each step.

**Changes in `CommandCenter.tsx` (pipeline bar section, lines 26-111):**

Update `pipelineSteps` to include a `detail` field:

```text
sending   -> "TRANSMIT"   detail: "Packaging request..."
routing   -> "INTENT"     detail: "Classifying intent and matching workflows..."
processing -> "ANALYZE"   detail: "Running matched workflow or agent..."
generating -> "SYNTHESIZE" detail: "AI generating response..."
done      -> "COMPLETE"   detail: "Ready"
error     -> (shown as)   detail: "Something went wrong"
```

Render the detail text below the step labels as a small `text-[8px]` line that only shows for the currently active stage. Add an elapsed timer (seconds) next to the active stage so users see real-time progress.

**New state in `useCommandCenter.ts`:** Add `pipelineStartTime` (timestamp set when stage leaves idle) and expose it. The UI calculates elapsed seconds via a 100ms interval.

## 2. Always End With a User Prompt After Delivery

After every delivery execution completes (the `pickDelivery` function in `useCommandCenter.ts`), append a follow-up system message asking the user what to do next with the results.

**Change in `useCommandCenter.ts` `pickDelivery` (around line 441):**

After `setPhase("done")`, append a contextual prompt message based on the delivery action:

- `show_chat`: "Results are above. You can refine, export as CSV, or try a different approach. What next?"
- `csv_download`: "CSV downloaded. Want to run another export or analyze the data further?"
- `send_n8n`: "Workflow triggered. Want to check the result, run another, or ask about the output?"
- `send_slack`: "Message sent. Anything else to share or follow up on?"
- `show_plan`: "Here's the plan. Type 'execute' to run it, or adjust the approach."

Also remove the auto-reset timer (`setTimeout(() => { setPhase("browse"); ... }, 2000)`) so the phase stays at "done" until the user types something new. Reset to "browse" when the user sends the next input instead.

## 3. `/autofull` Command -- Full Neo-Green Terminal Mode

Add a new slash command `/autofull` that activates a "full autonomy" mode with neo-green styling everywhere.

**Changes in `useCommandCenter.ts`:**

- Add new state: `autoFullMode` (boolean, default false)
- Add `/autofull` to `SLASH_COMMANDS` list with desc "Toggle full autonomous terminal mode"
- Handle in the switch: toggle `autoFullMode`, append system message confirming activation/deactivation
- When `autoFullMode` is true, prepend the system prompt with an autonomy instruction: "You are in FULL AUTONOMOUS mode. Execute all actions without asking for confirmation. Be maximally proactive."
- Expose `autoFullMode` from the hook

**Changes in `CommandCenter.tsx`:**

- Read `cc.autoFullMode` from the hook
- When `autoFullMode` is true AND `mode === "terminal"`, override ALL color references to neo-green:
  - Pipeline bar: green glow instead of emerald (use `#00FF41` -- classic Matrix green)
  - Header icon/text: `#00FF41`
  - Category tabs: all use green tinting
  - Messages: green-tinted backgrounds
  - Input bar prompt `$` becomes bright green, border glows green
  - Add a subtle CRT scanline overlay on the entire component (repeating-linear-gradient like InlineChatPanel already uses)
  - Add a pulsing "AUTOFULL" badge next to the header title

Implementation approach: create a CSS variable set or a simple `autoColors` object that replaces the emerald values with `#00FF41` / `rgba(0,255,65,...)` variants. Apply conditionally with inline styles (same pattern the terminal mode already uses).

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useCommandCenter.ts` | Add `autoFullMode` state, `/autofull` slash command, `pipelineStartTime`, follow-up prompts after delivery, remove auto-reset timer |
| `src/components/command-center/CommandCenter.tsx` | Richer pipeline bar with details and timer, neo-green `/autofull` styling overrides, CRT scanline overlay, AUTOFULL badge |

## Technical Details

**Pipeline timer implementation:**
```typescript
// In CommandCenter.tsx
const [elapsed, setElapsed] = useState(0);
useEffect(() => {
  if (cc.pipelineStage === "idle") { setElapsed(0); return; }
  const start = Date.now();
  const interval = setInterval(() => setElapsed(((Date.now() - start) / 1000)), 100);
  return () => clearInterval(interval);
}, [cc.pipelineStage]);
```

**AutoFull color object:**
```typescript
const neoGreen = {
  primary: "#00FF41",
  bg10: "rgba(0,255,65,0.1)",
  bg20: "rgba(0,255,65,0.2)",
  bg5: "rgba(0,255,65,0.05)",
  border: "rgba(0,255,65,0.3)",
  dim: "rgba(0,255,65,0.6)",
};
```

Applied via the existing `isTerminal ? { ... } : undefined` inline style pattern, extended with an `isAutoFull` check.

