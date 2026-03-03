

# Dynamic Sub-Menu Per Category with Prompt Suggestions

## What Changes

When a user clicks one of the 10 category tabs (PRICING, SEO, PRODUCT, etc.), a **contextual sub-menu row** appears directly below the tabs. Each category gets its own set of sub-items that filter/scope the context. Each sub-item shows **quick prompt chips** the user can click to instantly populate the input.

Additionally, Claude is added as a tool/contact reference across relevant categories.

---

## 1. Add Category Sub-Items Data to `commandCenterData.ts`

New export: `CATEGORY_SUBS` -- a mapping from each category key to its sub-items, each with a label, icon, and array of prompt suggestions.

```text
pricing:
  - Competitor Monitor  -> "Compare my prices vs autodoc right now", "Set up daily price tracking for top 50 SKUs"
  - Margin Analysis     -> "Show margin breakdown by category", "Which products have the lowest margin?"
  - Price Alerts        -> "Alert me when competitors drop below my price", "Price history for brake pads 90 days"

seo:
  - Rankings            -> "How am I ranking today?", "Which keywords did I lose this week?"
  - Technical Audit     -> "Run a full technical SEO audit", "Find all broken links"
  - Content SEO         -> "Generate SEO titles for new SKUs", "Which pages need better meta descriptions?"
  - Backlinks           -> "Compare my backlinks vs autodoc", "Find new link building opportunities"

product:
  - Titles & Descriptions -> "Generate SEO titles for 500 products", "Find products with thin descriptions"
  - Catalog Management    -> "Audit category structure", "Bulk update vehicle compatibility"
  - Content Generation    -> "AI descriptions for new stock", "Create product images with AI"

research:
  - Competitors     -> "Who's winning in my niche?", "Deep-dive autodoc.nl strategy"
  - Market Gaps     -> "Find underserved keywords in brake parts", "NL vs DE market comparison"
  - Trends          -> "What's trending in car parts Q1?", "Seasonal demand forecast for winter tires"

automate:
  - Workflow Status  -> "Show status of all running workflows", "Execution logs for pricing monitor"
  - Build & Schedule -> "Create a new automation", "Schedule SEO brain every Monday 6AM"
  - Chains & Alerts  -> "Chain pricing -> repricing -> notifications", "Stock level alerts for top 50"

infra:
  - System Health    -> "Is everything running?", "Show recent errors across all services"
  - Deploy           -> "Push latest to production", "List all edge functions"
  - Database & DNS   -> "Database health check", "Show DNS records for hansvanleeuwen.com"
  - Claude CLI       -> "Start a Claude Code session", "Ask Claude to review infrastructure"

report:
  - Weekly/Monthly   -> "This week's performance overview", "Traffic sources last 30 days"
  - Rankings         -> "Compare rankings vs competitors", "Keyword position changes this week"
  - Custom           -> "Build custom KPI dashboard", "Top 50 pages by traffic"

comms:
  - Email & Drafts   -> "Draft supplier email about Q2 pricing", "Draft response to customer complaint"
  - Calendar         -> "What's on my calendar today?", "Find meeting time for team sync"
  - Claude Contact   -> "Ask Claude to draft a professional message", "Get Claude's help writing a brief"

manage:
  - Sprint & Tasks   -> "Where's my sprint at?", "Create high-priority task"
  - Boards & Briefs  -> "Create project board for Q2", "Write project brief for German launch"
  - Workload         -> "Team workload overview", "Update task status"

ailab:
  - Image Generation -> "Generate product images", "Run background removal on photos"
  - Models & Research -> "Find models on HuggingFace", "Search AI research papers"
  - Claude AI        -> "Ask Claude to analyze this data", "Use Claude for code generation"
```

Each sub-item has: `{ id, label, prompts: string[] }`

## 2. Update `CommandCenter.tsx` -- Render Sub-Menu Row

Between the category tabs nav and the action drawer, add a new section that appears when `activeCat` is set:

- A horizontal scrollable row of **sub-item pills** (styled like the existing category tabs but smaller)
- Below the pills, show **prompt suggestion chips** for the selected sub-item (or for the first sub-item by default)
- Clicking a prompt chip sets `cc.input` to the prompt text and optionally auto-submits it

The sub-menu has two states:
1. **Sub-item selected**: shows that sub-item's prompts
2. **No sub-item selected** (default): shows all prompts from all sub-items of the active category, limited to 4-6

Visual style:
- Sub-item pills: small rounded buttons, colored with the category accent color when active
- Prompt chips: `text-[10px]` rounded-full buttons with a subtle border, clicking them fills the input
- Follows existing terminal/autoFull color overrides

## 3. Add State for Selected Sub-Item

In `useCommandCenter.ts`, add:
- `selectedSubItem: string | null` state
- `setSelectedSubItem` setter
- Reset `selectedSubItem` to `null` when `activeCat` changes

## 4. Claude Contact Integration

Add "Claude" as a tool reference in relevant ACTIONS entries (infra, comms, ailab, automate). This means updating the `tools` arrays in specific actions within `commandCenterData.ts` to include "Claude" where appropriate -- some already have it (like `a-build` which lists "Claude").

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/command-center/commandCenterData.ts` | Add `CATEGORY_SUBS` data structure with sub-items and prompt arrays per category; add "Claude" to tool lists where missing |
| `src/hooks/useCommandCenter.ts` | Add `selectedSubItem` state, reset logic on category change, expose via return |
| `src/components/command-center/CommandCenter.tsx` | Render sub-menu pills row + prompt suggestion chips between category tabs and action drawer |

## UX Flow (Step by Step)

1. User clicks a category tab (e.g. "SEO")
2. Sub-menu pills appear: `Rankings | Technical Audit | Content SEO | Backlinks`
3. First sub-item is auto-highlighted, showing its prompts below as clickable chips
4. User clicks a prompt chip like "How am I ranking today?" -- it fills the input bar
5. User can edit the prompt or hit Enter to send
6. The action drawer (hero cards + compact actions) still shows below, unchanged
7. User can click a different sub-item pill to see different prompts
8. Switching categories resets the sub-item selection

This keeps the existing action drawer intact while adding a discovery-friendly layer of contextual prompts on top.
