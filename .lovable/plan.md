

# Bigger Pipeline Bar + Staggered Prompt Chips (BJ Fogg UX)

## 1. Visually Larger Pipeline Bar

The current pipeline is a cramped single-line row with `text-[9px]` labels. Replace it with a taller, more dramatic component that commands attention when running.

**Changes in `CommandCenter.tsx` (lines 126-161):**

- Increase height: `py-2` becomes `py-3.5` with a min-height of ~56px
- Step labels go from `text-[9px]` to `text-[11px]`, detail text from `text-[8px]` to `text-[10px]`
- Each step gets a **progress segment bar** underneath -- a horizontal strip that fills with color as stages complete (like a segmented progress bar across the full width)
- Active step gets a stronger glow: `shadow-[0_0_12px_...]` and scale-up (`scale-110`) via framer-motion
- Timer text goes from `text-[8px]` to `text-[11px]` with monospace tabular-nums styling
- Add a subtle pulsing gradient border on the bottom edge when active
- The done step icon grows briefly (scale animation) for a satisfying "complete" moment

```text
Visual layout (when running):

+----------------------------------------------------------------+
|  [*] TRANSMIT   ··· [ ] INTENT   ··· [ ] ANALYZE   ··· [...]   |
|  Packaging request...                              2.3s         |
|  ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░             |
+----------------------------------------------------------------+
```

The segmented bar is built with a simple `<div>` row of 5 segments, each colored when its stage is done/active.

## 2. Staggered Delayed Prompt Chips (BJ Fogg: Reduce Overwhelm)

**Problem:** All sub-menu pills and prompt chips appear at once -- overwhelming for an e-commerce manager scanning 6+ options.

**Solution:** Apply BJ Fogg's "simplicity" principle -- show less, stagger the reveal.

**Changes in `CommandCenter.tsx` (lines 273-330):**

- Sub-item pills: fade in with a staggered delay (50ms per pill) using framer-motion `variants` with `staggerChildren`
- Prompt chips: appear one-by-one with 80ms delay each, using `motion.button` with `initial={{ opacity: 0, y: 6 }}` and `animate={{ opacity: 1, y: 0 }}`
- Limit visible prompts to **3 max** by default (down from 6). Show a subtle "+N more" button to expand
- When switching sub-items, old prompts exit quickly (150ms), new ones stagger in fresh
- Add a very subtle "typewriter" feel -- each chip slides up gently as if being typed out

**Implementation pattern:**
```text
<motion.div variants={{ show: { transition: { staggerChildren: 0.08 } } }}>
  {prompts.slice(0, showAll ? prompts.length : 3).map((p, i) => (
    <motion.button
      key={p}
      variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
      ...
    />
  ))}
  {prompts.length > 3 && !showAll && <button onClick={toggleShowAll}>+{N} more</button>}
</motion.div>
```

## 3. Sub-Menu Pills: Cleaner, Less Dense

- Increase pill padding slightly: `px-2.5 py-1` becomes `px-3 py-1.5`
- Add a subtle icon dot (colored circle) before each active pill label instead of just color change
- When no sub-item is selected, show a gentle "Pick a focus" hint text in `text-[9px]` muted, which disappears once any pill is clicked

## Files to Modify

| File | Change |
|------|--------|
| `src/components/command-center/CommandCenter.tsx` | Larger pipeline bar with segmented progress, staggered prompt chips with motion, 3-prompt default limit, cleaner sub-pills |

No hook changes needed -- this is purely visual/UX.

## Technical Approach

**Pipeline segmented bar:**
```typescript
const stageIndex = pipelineSteps.findIndex(s => s.key === cc.pipelineStage);
// Render 5 segment divs, colored if index <= stageIndex
```

**Stagger animation:**
```typescript
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };
```

**Prompt limit state:**
```typescript
const [showAllPrompts, setShowAllPrompts] = useState(false);
// Reset to false when selectedSubItem or activeCat changes
useEffect(() => setShowAllPrompts(false), [cc.selectedSubItem, cc.activeCat]);
```

