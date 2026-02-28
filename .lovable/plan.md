

# UX Overhaul: AI Wiki Page

## Design Philosophy

Applying BJ Fogg's Behavior Model (Motivation + Ability + Prompt), the current Wiki fails on **Ability** -- it's written for developers, not users. Terms like "edge function", "fastRoute()", "buildContextPrefix()", and "localStorage" create friction. A user doesn't care *how* it works internally -- they care *what they can do* and *how to do it*.

## Current Problems

1. **Developer jargon everywhere** -- "Edge Function", "Client-side keyword matching", "LLM fallback", "system prompt modifications"
2. **Section titles sound like documentation** -- "AI Components Registry", "User Flow Pipe Design"
3. **Cards show file paths and backend names** -- users don't need `UnifiedChatPanel.tsx` or `n8n-agent`
4. **Pipeline uses function names** -- `buildContextPrefix()`, `fastRoute()` mean nothing to a user
5. **Examples explain internals** -- "Context prefix adds: [SEO > Keywords] focus" is developer logic, not a user benefit
6. **Page subtitle says "system architecture"** -- immediately signals "not for me" to non-technical users

## Redesigned Structure

### Page Header
- Title: "AI Guide" (not "AI Wiki")
- Subtitle: "Everything you can do with AI in your portal -- and how to get the best results."

### Section 1: "What Can I Use?" (was: AI Components Registry)
Rewrite each component card to answer: **What does this do for me?**

| Current | Redesigned |
|---|---|
| Name: "Command Center" / Type: "Unified Chat Panel" | Name: "Command Center" / Tagline: "Your main AI assistant" |
| "Central chat interface with 12 context categories, TVA pipeline bar, and intent classification" | "Ask anything -- from SEO advice to content writing. Pick a topic first to get smarter answers." |
| Shows: Backend, Model, Files | Shows: Where to find it, What it's best for, Pro tip |

Remove: file paths, edge function names, model names, "Client-side (localStorage)"
Add: "Where to find it" (plain language), "Best for" (use cases), one-line pro tip

### Section 2: "How It Works" (was: User Flow Pipe Design)
Replace function names with plain-language steps a user actually experiences:

| Current Step | Redesigned Step |
|---|---|
| "User Input" / "Raw text prompt typed into any chat panel" | "Type your question" / "Open any AI chat and type what you need" |
| "Context Filter Pills" / "Layer 1: Category -- Layer 2: Sub-context" | "Pick a topic" / "Choose a category (like SEO or Content) to help the AI focus" |
| "Command Suggestions" / "Layer 3: Top-10 smart prompts (usage-sorted, localStorage)" | "Try a suggested prompt" / "Pick from your most-used prompts to save time" |
| "buildContextPrefix()" / "Prepends system hints..." | **Remove entirely** -- invisible to user |
| "Intent Router" / branches with fastRoute() | "Smart routing" / "The system figures out the best way to handle your request" (no branches shown) |
| "Edge Function" / "hansai-chat OR n8n-agent" | **Merge into previous** -- invisible to user |
| "Lovable AI Gateway" | **Remove** -- invisible to user |
| "Response Rendering" | "Get your answer" / "Results appear as formatted text with highlights and code blocks" |
| "TVA Pipeline Bar" | "Progress indicator" / "The orange bar shows your request moving through: Transmit, Analyze, Synthesize, Complete" |

Reduce from 9 steps to 5 user-visible steps.

### Section 3: "Try These Examples" (was: Worked-Out Examples)
Rewrite each example as a simple recipe card:

| Current | Redesigned |
|---|---|
| Context/Prompt/Edge Function/System Modification/Expected Output | **Goal** (what you want) / **Steps** (1-2-3) / **What you'll get** (result) |

Remove: edge function names, system modification details, context prefix internals
Add: Numbered steps the user follows, clear outcome description

Example card redesign:
- **Goal**: "Find the best keywords for your product pages"
- **Steps**: 1. Open Hans AI, 2. Select SEO > Keywords, 3. Type "Research keywords for brake pads"
- **What you'll get**: "A table of keywords with search volume and ready-to-use title suggestions"

### Section 4: "System Health" (was: Live Error Log)
- Keep as-is (it's admin-facing and appropriately technical)
- Only rename the section title to "System Health" and add a small intro line: "Real-time errors and warnings from your AI services."

## Technical Changes

### Files to modify:

1. **`src/pages/Wiki.tsx`**
   - Change page title to "AI Guide"
   - Change subtitle
   - Rename accordion section labels and swap icons

2. **`src/components/wiki/WikiComponentRegistry.tsx`**
   - Rewrite the `components` data array: remove `edgeFn`, `model`, `files` fields; add `findIt`, `bestFor`, `tip` fields
   - Simplify card rendering: show icon + name + tagline + "Where to find it" + "Best for" + pro tip
   - Remove file path code tags and backend/model rows

3. **`src/components/wiki/WikiPipeDesign.tsx`**
   - Replace the `steps` array with 5 user-facing steps (removing internal steps)
   - Remove branches (fastRoute/intent-router detail)
   - Keep the visual vertical timeline but with simpler, friendlier copy

4. **`src/components/wiki/WikiExamples.tsx`**
   - Restructure the `examples` data to use `goal`, `steps[]`, `result` instead of `context`, `edgeFn`, `systemMod`
   - Render as numbered step cards with a clear "What you'll get" outcome box

5. **`src/components/wiki/WikiErrorLog.tsx`**
   - Add an intro line below the section heading
   - No other changes (already appropriately functional for admins)

