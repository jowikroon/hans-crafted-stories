

# Internal AI Wiki Page

Build a new `/wiki` page inside the Portal (admin-only) that serves as a comprehensive internal reference for all AI components, user flows, worked-out examples, and a live error log viewer.

## Structure

The Wiki page will be a new route accessible from the Portal navigation. It will be organized into 4 main sections, each rendered as a collapsible accordion panel with a clean, dark-themed design matching the existing Portal aesthetic.

---

## Section 1: AI Components Registry

A reference table/card grid documenting every AI component in the system:

| Component | Type | Location | Backend | Model |
|---|---|---|---|---|
| **Command Center** | Unified Chat Panel | Portal header | `n8n-agent` edge fn | Multi-model picker (Gemini/GPT) |
| **Hans AI** | Overlay Chat | Navbar + Portal | `hansai-chat` edge fn | Gemini 3 Flash (streaming) |
| **Empire Commander** | Overlay Chat | Portal | `n8n-agent` edge fn | Gemini 2.5 Flash |
| **n8n Agent** | Modal Chat | Portal | `n8n-agent` edge fn | Gemini 2.5 Flash |
| **Intent Router** | Classifier | Command Center | `intent-router` edge fn | Gemini 2.5 Flash |
| **AI Content Suggest** | Copy Generator | Page Content Editor | `ai-content-suggest` edge fn | Gemini 3 Flash |
| **Empire Health** | Status Monitor | Empire Dashboard | `empire-health` edge fn | N/A (HTTP checks) |
| **Context Filter Pills** | UI Component | All chat panels | Client-side | N/A |
| **Command Suggestion List** | UI Component | All chat panels | Client-side (localStorage) | N/A |
| **Fast Route** | Client Router | Intent system | Client-side keyword matching | N/A |

Each card will show: name, description, file paths, edge function, AI model used, and accent color theme.

## Section 2: User Flow Pipe Design

A visual pipeline diagram showing how a user prompt flows through the system, rendered as a styled step-by-step flow using CSS (no external diagram library needed):

```text
User Input
    |
    v
[Context Filter Pills] -- Layer 1: Category, Layer 2: Sub-context
    |
    v
[Command Suggestions] -- Layer 3: Top-10 smart prompts (usage-sorted)
    |
    v
[buildContextPrefix()] -- Prepends system hints based on selection
    |
    v
[Intent Router?] -- Optional: Compass button classifies goal
    |   |
    |   +---> fastRoute() -- Client-side keyword matching (>0.85 = direct)
    |   +---> intent-router edge fn -- LLM fallback (<0.5 confidence)
    |
    v
[Edge Function] -- hansai-chat (streaming) OR n8n-agent (non-streaming)
    |
    v
[Lovable AI Gateway] -- ai.gateway.lovable.dev/v1/chat/completions
    |
    v
[Response Rendering] -- Markdown code blocks + inline code
    |
    v
[TVA Pipeline Bar] -- Visual: TRANSMIT > ANALYZE > SYNTHESIZE > COMPLETE
```

This will be rendered as a vertical pipeline with styled nodes and connector lines, using the orange/amber TVA aesthetic.

## Section 3: Worked-Out Examples

3-4 interactive example cards showing real use cases with input/output:

1. **SEO Title Optimization** -- Category: SEO > Keywords, Prompt: "Research keywords for brake pads", Expected flow through hansai-chat
2. **Infrastructure Health Check** -- Category: Monitoring > Health, Prompt: "Run full health check", Routes via intent-router to health-check webhook
3. **Content Generation** -- Category: Content > Blog, Prompt: "Generate blog post outline for auto parts", Uses n8n-agent with context prefix
4. **Workflow Debugging** -- Opens n8n Agent modal, Prompt: "Fix Schedule trigger not firing", Auto-detects "troubleshoot" mode

Each example shows: the context selection, the prompt text, which edge function handles it, the system prompt modifications, and sample output format.

## Section 4: Live Error Log

A real-time error log panel pulling from the `empire_events` table filtered by `event_type = 'error'`. Features:
- Realtime subscription (reuses existing pattern from `EmpireAuditTrail`)
- Filter by source (edge function name)
- Timestamp, source, message, and expandable metadata JSON
- Refresh button and auto-scroll
- Red-themed accents for errors, amber for warnings

---

## Technical Implementation

### New files to create:
1. **`src/pages/Wiki.tsx`** -- Main wiki page component with 4 accordion sections
2. **`src/components/wiki/WikiComponentRegistry.tsx`** -- Component registry cards
3. **`src/components/wiki/WikiPipeDesign.tsx`** -- Visual pipeline flow
4. **`src/components/wiki/WikiExamples.tsx`** -- Worked-out examples
5. **`src/components/wiki/WikiErrorLog.tsx`** -- Live error log panel

### Files to modify:
1. **`src/components/AnimatedRoutes.tsx`** -- Add `/wiki` route (lazy loaded)
2. **`src/pages/Portal.tsx`** -- Add Wiki link/button in the Portal header (Book icon)

### Design decisions:
- Admin-only access (reuses existing `useAdmin` hook)
- Dark mode forced (same as Portal)
- No database tables needed -- all content is hardcoded reference data
- Error log reuses existing `empire_events` table with Realtime subscription
- Accordion-based layout using existing Radix `Collapsible` component
- All data is static/reference (component names, file paths, descriptions) except the error log

