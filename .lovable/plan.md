

# Context Filter Pills + TVA-Style Pipeline for AI Panels

## Overview

Add a 2-layer context filter pill menu to both Empire Commander and Hans AI overlays, plus restyle the tech pipeline with a vintage 1980s TVA (Loki) aesthetic using an orange/amber color palette with CRT-style typography.

## What Changes

### 1. Context Filter Pills (both overlays)

A subtle 2-layer pill menu between the header and messages area:

**Layer 1 -- Category (primary row)**
Horizontal scrollable pills that select a broad domain. Clicking a category reveals Layer 2.

*Empire Commander:*
- Infrastructure | Workflows | Security | Monitoring | Database | Docker

*Hans AI:*
- SEO | Content | Feeds | Campaigns | Analytics | Code

**Layer 2 -- Sub-context (secondary row, appears on selection)**
Smaller, more specific pills that refine the context. These prepend a system context hint to the AI prompt.

*Example for Empire > Infrastructure:*
- VPS Primary | VPS Industrial | Cloudflare | DNS | SSL

*Example for Hans AI > SEO:*
- Technical SEO | On-Page | Keywords | Meta Tags | Schema

**Behavior:**
- Selected context pill prepends a short system hint to the prompt (e.g., "Focus on: VPS Primary server infrastructure")
- Clicking "All" or deselecting resets to the default system prompt
- Pills are styled subtly with low-opacity borders, highlighting on selection
- Layer 2 animates in/out with Framer Motion (height + opacity)

### 2. TVA-Style Pipeline Progress (vintage 80s orange)

Restyle the existing `pipelineSteps` UI in `InlineChatPanel.tsx` with a retro TVA aesthetic:

**Visual treatment:**
- Orange/amber color palette (`#F97316` to `#D97706` range)
- Monospace font (`font-mono`) for all pipeline labels
- Uppercase tracking-wide text
- CRT scanline overlay effect via CSS pseudo-element
- Rounded-rectangle "badge" steps connected by dotted lines instead of arrows
- Pulsing glow on the active step
- Step labels use retro terminology: "TRANSMIT" > "ANALYZE" > "SYNTHESIZE" > "COMPLETE"

**Color scheme:**
- Background: `bg-orange-950/30` with `border-orange-500/20`
- Active step: `bg-orange-500/20 text-orange-400` with `shadow-orange-500/20`
- Done step: `bg-orange-500/10 text-orange-300`
- Inactive: `text-orange-800/40`
- Connector dots: `border-orange-500/15`

### 3. Files to Modify

| File | Changes |
|---|---|
| `src/components/overlays/HansAIOverlay.tsx` | Add 2-layer context pills between header and messages |
| `src/components/overlays/EmpireOverlay.tsx` | Add 2-layer context pills between header and messages |
| `src/components/empire/EmpireClaudePanel.tsx` | Add 2-layer context pills between header and messages |
| `src/components/portal/InlineChatPanel.tsx` | Restyle pipeline to TVA vintage, add context pills |

### 4. Technical Details

**Context data structure:**
```text
interface ContextCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  subcategories: { id: string; label: string; systemHint: string }[];
}
```

**System prompt injection:**
When a sub-context is selected, the system prompt gets a prefix:
`"[CONTEXT: Focus on ${category} > ${subcategory}. ${systemHint}]\n\n" + originalSystemPrompt`

**TVA pipeline CSS (applied via Tailwind + inline styles):**
- Scanline effect: repeating-linear-gradient overlay at 2px intervals
- Step connectors: 3 small dots (`...`) in monospace instead of arrow icons
- Active step gets `animate-pulse` with orange box-shadow glow

**No new dependencies needed** -- uses existing Framer Motion, Lucide icons, and Tailwind classes.

