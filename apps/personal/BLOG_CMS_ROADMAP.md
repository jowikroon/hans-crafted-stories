# Blog CMS Roadmap — Write.html-driven Rebuild

> **Source of truth for the rebuild.** Run phases in order. Phase 0 blocks everything.

---

## Amendment (2026-05-16)

- **The new design IS `/write` (Write.html).** Do not preserve the old `/blog-cms` chrome.
- **Overwrite `/blog-cms` with Write.html as the shell.** The old React `BlogCMS.tsx` chrome is retired.
- **EXCEPTION: keep Manage functional.** Wire the existing Supabase-backed articles list (filter / sort / search / pagination / row click to open) into Write.html's Manage view. All other modes (Write, Analytics) start from Write.html's static layout and gain functionality per the phases below.
- **The 3-mode left sidebar (Write · Manage · Analytics) is the main blog navigation.** It is the canonical entry to all blog work — no separate top-nav tabs, no parallel routes.

---

## Repo + project context

- **Stack:** React + TypeScript + Vite + Tailwind, Supabase (`pesfakewujjwkyybwaom`, EU-central-1), Vercel/Cloudflare deploy from `main`.
- **Auth target:** Supabase Auth, admin role required for write.
- **Current state (2026-05-16):**
  - `/write` serves the static Write.html design (live, byte-identical to `apps/personal/public/write.html`, commit `3933b0e`).
  - `/blog-cms` still serves the old React `BlogCMS.tsx` — to be replaced.
- **Design tokens:** Bricolage Grotesque 800 (display), IBM Plex Mono (labels), cream `#F1ECDF` / dark `#14130F`, accent yellow `#F5C400`, sharp radii 4–8px, no gradients/shadows.

---

## Phase 0 · Foundation — Auth + CRUD + real data

Wire the CMS to Supabase. Nothing else works until this does.

1. **Auth gate** — `/portal/login` Supabase email/password → redirect to `/blog-cms`. Auth guard on all CMS routes. User name in topbar. Logout in profile dropdown.
2. **Fix RLS** — `Blog CMS write blog_posts` policy → `has_role(auth.uid(), 'admin')`. Verify public SELECT stays `true`.
3. **Wire posts table** — fetch all `blog_posts` ordered by `updated_at DESC`. Render real title/status/category/word_count/updated_at. Filter tabs (All/Draft/Published/Scheduled), search by title (ilike), sort toggle.
4. **Basic CRUD** — New post (status=draft, slug=uuid), row click → `/blog-cms/:id`, delete with confirm, status dropdown.
5. **DB fixes** — `updated_at = now()` trigger, drop `reading_time` (keep `read_time`), rename categories (`tech` → `technology`, `personal-brand` → `business`, `e-commerce-strategy` → `e-commerce`).

**Accept:** log in, see 24 real posts, filter/search/sort works, create/edit/delete works, RLS blocks unauth writes, `updated_at` auto-updates.

---

## Phase 1 · Write mode — the editor

Bilingual, keyboard-first, autosaving editor inside the Write panel of Write.html.

- **Editor:** CodeMirror 6, markdown highlighting, split editor/preview. Preview uses public blog typography. Editor font IBM Plex Mono 14px.
- **Bilingual:** EN | NL tabs swap between `content` / `content_nl`, independent autosave, per-language word count.
- **Autosave:** debounced 8s, status pill ("Saved 3s ago" / "Saving…" / "Unsaved"), increment `draft_version`, localStorage fallback.
- **Metadata sidebar (right rail, 280px):** title, slug (auto from title, editable), status, editorial_stage, category, tags, article_type, voice template (forbidden words as red chips + inline highlight), scheduled_at (visible only if status=scheduled), featured image drag-drop to Supabase Storage.
- **Versions:** new `blog_post_versions` table (id, post_id, version, content, content_nl, created_at). Snapshot every 10th save. List in sidebar; click for read-only diff.
- **Shortcuts:** ⌘S save, ⌘B/⌘I/⌘K bold/italic/link, ⌘⇧P toggle preview, Esc back to Manage.

**Accept:** markdown + live preview, EN/NL tabs save independently, autosave works, all metadata wired, forbidden words highlight, image upload works, version history works, shortcuts work.

---

## Phase 2 · YouTube → Article pipeline (real APIs)

Wire the 4-stage modal (analyze → review → publish → done) to real edge functions.

- **`youtube-metadata`** — input URL → YouTube Data API v3 (oEmbed fallback) → title/channel/duration/thumbnail/published/views.
- **`youtube-transcript`** — input video id → youtube-transcript-api (or TS port). No captions → download audio → Whisper. Return transcript + word count + language + segments.
- **`generate-article`** — input transcript + voice template + target langs → Claude `claude-sonnet-4-20250514` → EN 1000–1400wd, NL translation (preserve voice, keep tech terms EN), meta_title, meta_description, LinkedIn EN+NL (≤1300 chars each), primary_keyword, suggested internal_links (match published slugs), SEO + readability estimates.
- **`score-article`** — input content + primary_keyword + internal_links → keyword density, meta, h-structure, alt-text, internal links, readability (Flesch-Kincaid NL-adapted) → `seo_score`, `readability_score`, suggestions[].
- **Wire to modal:** Analyze → metadata; step 2 → transcript; review → generated content; scoring → real scores. Save inserts `blog_posts` with `source_url` (new column `ALTER TABLE blog_posts ADD COLUMN source_url text DEFAULT '';`).

**Accept:** real YouTube URL → real metadata/transcript/article in voice/scores/LinkedIn EN+NL → draft saved with all fields.

---

## Phase 3 · Manage mode — complete

Make Write.html's Manage view fully operational on real data.

- **Sort/filter:** clickable headers (title, word_count, updated_at, status) with arrow indicator. Filter tabs query Supabase (`status =`). Search debounced 300ms ilike. Pagination 20/page with "1–20 of 42". State in URL params (`?status=draft&sort=updated_at&page=2`).
- **Bulk actions:** checkbox + shift-range. Bar appears with ≥1 selected: Re-index (call `score-article` per row), Queue AI rewrite (insert into `samantha_tasks`), Change status (batch update), Delete (confirm → batch DELETE). Progress bar. Deselect on complete.
- **Scheduling:** `status='scheduled'` requires `scheduled_at`. pg_cron every minute: posts where `scheduled_at <= now() AND status = 'scheduled'` → `status = 'published'`, `published = true`. Show "Scheduled · Tue 09:00" in date column. Calendar icon → upcoming view.
- **Editorial stage pipeline:** colored dot next to status pill. Filter by `editorial_stage` (dropdown, not tabs). Status → 'published' auto-sets `editorial_stage = 'published'`.

**Accept:** sort/filter/search on real data, pagination, bulk select+delete+status, scheduled auto-publish, editorial stage visible+filterable, URL is shareable.

---

## Phase 4 · AI editorial pipeline

Inline annotations while writing + pre-publish gate.

- **`technical-editor` edge function** — code blocks (syntax valid? language tag?), unsubstantiated claims (numbers without source), comment quality, jargon density (>40% technical). Return annotations with line numbers, severity, message.
- **`tone-specialist` edge function** — forbidden words (exact + near-synonym via Claude), per-paragraph voice fit, audience fit, hedging (Technical), missing vulnerability (Personal). Return annotations + `voice_fit_score`.
- **Inline in CodeMirror:** red underline (errors/forbidden), amber (warnings/drift/hedging), blue (suggestions/links). Tooltip + one-click fix. Sidebar count "3 errors · 5 warnings · 2 suggestions". "Fix all" applies auto-fixable.
- **Editorial memory:** new `editorial_memory` table (id, pattern, context, created_at, active). Surface relevant memories by category/tags as sticky note in editor sidebar. After AI review, suggest saving newly detected recurring patterns.
- **Pre-publish checklist** (gate before status → 'published'): fact-check (confirm sources), alt-text on all images, ≥2 internal links, `voice_fit_score` ≥ 75, `seo_score` ≥ 70, meta description 155–280 chars. Auto-checks as met. "Publish anyway" override is the non-default path.

**Accept:** forbidden words underlined red with one-click fix, technical editor flags missing language tags, tone specialist scores voice fit, memories surface, pre-publish gate blocks until met or explicit override.

---

## Phase 5 · Analytics mode

The third left-rail tab.

- **Dashboard:** 4 tiles (total articles, avg SEO, avg readability, voice consistency %). Two charts: SEO distribution by category (bar), publishing cadence last 12 weeks (bar). Bottom table sorted worst-quality first.
- **Per-article SEO audit:** click → SEO breakdown gauges (keyword density, meta, h-structure, internal links, alt-text), specific fixes with Apply (links to editor with annotation active), historical score chart.
- **Voice consistency:** % of articles ≥ 80% voice match. Heatmap (articles × voice dimensions: tone, forbidden, structure, audience). Red = drift, green = consistent. Click cell → jump to drifting paragraph.
- **Quality scores:** populate `quality_score` jsonb on every save via `score-article`. Trend over time. Category breakdown.
- **Editorial kanban:** column per `editorial_stage`, cards show title + age in stage + blocking issues. Drag to advance (triggers stage change + required checks).
- **Charts:** Chart.js or Recharts. Line + bar only. Design system colors. No 3D, no animation, no decoration.

**Accept:** real metrics, SEO distribution + cadence render, drill-down with fix suggestions, voice heatmap identifies drift, kanban shows pipeline stages.

---

## Phase 6 · Polish

- **Global shortcuts:** ⌘K global search (posts/commands/settings), ⌘N new post, ⌘S save (editor), ⌘⇧P command palette, ⌘1/2/3 switch Write/Manage/Analytics, Esc close/back.
- **Compact navbar:** h-12 (from h-16), hide breadcrumbs in compact, auto-compact on scroll down, expand on up, localStorage preference.
- **Mobile:** sidebar → bottom tab bar, table → cards <640px, editor full-screen (metadata to bottom sheet), tap targets ≥44px.
- **Performance:** virtualize table >50 rows (`@tanstack/react-virtual`), lazy-load CodeMirror, prefetch adjacent posts on row hover, React Query 30s stale time.
- **Telegram:** `hansai-chat` `/blog` commands — `list drafts`, `publish [slug]`, `score [slug]`. Parse edge-function output, execute CMS action.

**Accept:** shortcuts work globally, command palette lists actions, table smooth at 100+ rows, mobile actually usable, Telegram `/blog` works.

---

## Working notes for Claude Code

1. Feed one phase at a time. Verify before moving on.
2. CLAUDE.md in repo root must include the design principles + DB schema + voice template rules.
3. Edge functions: `supabase functions new <name>` / `deploy <name>`. CLI must be set up locally.
4. Design source of truth: `apps/personal/public/write.html` — match its typography/colors/components exactly.
5. Migrations: write SQL, review before running. RLS change is security-critical.
6. Voice templates: store as JSON/TS config (editable without redeploy), not inline in prompts.
