

## Add 3 More Wiki Examples + AI "Generate More" Button

### What We're Doing
Expanding the WikiExamples component from 4 static examples to 7, all showing the "2nd filter layer" flow (Category then Sub-category then prompt). Adding a "Generate 5 More" button at the bottom that calls the existing `hansai-chat` edge function to produce 5 AI-generated, context-relevant examples.

### Changes

**1. Add 3 new static examples to WikiExamples.tsx**
New examples that demonstrate the 2nd-layer filter flow (selecting a subcategory before typing):

- **"Optimize your Channable product feed"** (pink) -- Feeds > Channable > prompt
- **"Audit your Google Ads campaigns"** (amber) -- Campaigns > Google Ads > prompt  
- **"Track keyword position changes"** (sky) -- Analytics > Search Console > prompt

Each follows the same card format: icon, color, goal, 3 steps (with the sub-category selection as step 2), and an outcome block.

**2. Convert WikiExamples to a stateful component**
- Add `useState` for `extraExamples` (array of AI-generated examples) and `loading` state
- Render the 7 static examples in the grid, then any AI-generated extras below them

**3. Add "Generate 5 More" button**
- Placed after the grid of example cards
- Styled as an outline button with a Sparkles icon
- On click: calls the `hansai-chat` edge function with a prompt asking for 5 more examples in the same JSON structure (title, goal, steps, result)
- Shows a loading spinner while generating
- Appends the 5 new examples to the grid with a subtle fade-in animation
- Uses `supabase.functions.invoke('hansai-chat', ...)` -- non-streaming, since we need structured JSON back

**4. AI prompt design**
The prompt sent to `hansai-chat` will include:
- The 10 command center categories and their subcategories as context
- Instructions to return exactly 5 examples in a specific JSON format
- Each example must reference a specific Category > Sub-category > prompt flow
- The edge function already uses the Lovable AI gateway with `LOVABLE_API_KEY`

### Technical Details

**Files to modify:**
- `src/components/wiki/WikiExamples.tsx` -- Add 3 examples, convert to stateful component, add generate button + AI call

**Files to read (already done):**
- `src/components/command-center/commandCenterData.ts` -- category/action data for AI context
- `src/components/ai/contextCategories.ts` -- subcategory structure for AI context
- `supabase/functions/hansai-chat/index.ts` -- existing edge function (already uses Lovable AI)

**No new dependencies needed.** Uses existing supabase client and hansai-chat edge function.

**Color assignments for new cards:**
- pink, amber, sky (extending the existing emerald/violet/orange/cyan palette)

**Error handling:**
- If AI generation fails, show a toast error via sonner
- Button becomes disabled while loading
- Generated examples get a subtle `motion.div` fade-in

