# Lovable.dev ↔ Cursor Synergy Rules
**Last updated:** 27 Feb 2026  
**Owner:** Hans van Leeuwen (via Grok team)

## Core Philosophy
Lovable.dev = **Visual & Frontend Owner**  
Cursor = **Backend, Logic & Architecture Owner** + **Fixer after Lovable changes**

Both tools push to the same GitHub repo (`main`), but with clear ownership to prevent conflicts and double work.

## Explicit Role Division

### Lovable.dev (UI/Design/Website Control)
- All visual design & frontend polish
- Tailwind, shadcn/ui components, Framer Motion animations
- Layout, responsiveness, colors, typography
- Public pages: /, /work, /writing, /about, /privacy, /docs, /wiki
- HansAI terminal **visual appearance** (layout, styling, animations)
- Portal/Empire dashboard visuals
- Any "make it look better" work
- Small tweaks & quick publishes (direct to main via Lovable bot)

**Never touch:**
- src/lib/, src/hooks/, src/integrations/, supabase/functions/, src/pages/HansAI.tsx core logic, workflows.ts, intent logic, API calls, state management

### Cursor (Backend Developer & Logic Owner)
- All business logic, routing, state, data flow
- HansAI core (processInput, fastRoute, handleSubmit, intent-router integration)
- All Supabase Edge Functions, shared modules, _shared/prompts/
- N8N workflows, empire-health, portal-api, monday-*
- New features, performance, testing, error handling
- Architecture decisions (file structure, types, config)
- **Fixing anything after Lovable changes** (you are the first touch point on hansvanleeuwen.com after Lovable publishes)
- Backend-related frontend files: src/pages/HansAI.tsx (logic part), src/components/portal/* (functionality)

**When Lovable needs new functionality:**
Describe the visual need → Cursor implements the logic + hooks → Lovable polishes the UI.

## Git Workflow Rules (zero conflicts)
1. **Small visual change** → do it directly in Lovable → auto-commit to main → Cloudflare auto-deploy.
2. **Backend / logic / new feature / fix** → Cursor works in Cursor (or feature branch `cursor/feature-name` if >50 lines) → merge to main.
3. **After Lovable change** → Cursor always reviews the last Lovable commit (look at lovable-dev[bot]) and fixes any broken logic or adds missing functionality.
4. **Before starting work** → always `git pull origin main`.
5. **Overlapping file?** → Never both edit the same file at the same time. Use HansAI or this chat to coordinate: "Lovable, please update the terminal styling" → "Cursor, after that add the new /empire-health command".
6. **Deployment** → Always via Lovable "Share → Publish" (keeps the nice UI publish flow you love).

## File Ownership Zones (strict)
- **Lovable zone (safe for Lovable):**  
  src/components/ui/*, src/components/animations/*, most of src/pages/* (except HansAI core), public/, tailwind.config.*, most CSS-in-JS.

- **Cursor zone (never touch in Lovable):**  
  supabase/functions/**, src/lib/**, src/hooks/use*, src/integrations/**, src/lib/config/workflows.ts, src/pages/HansAI.tsx (logic), any .ts file with "router", "intent", "api", "edge".

- **Shared but coordinated:**  
  src/components/portal/*, src/components/empire/* → Lovable does visuals, Cursor does interactivity/logic.

## How we stay in sync
- Every major Cursor change → after merge, tell Lovable in the editor: "Sync latest from GitHub".
- Lovable auto-syncs back to Cursor.
- This doc is the single source of truth. Update only via Cursor after team agreement.
