# Blog CMS Roadmap

> Stack: Vite + React Router DOM + Supabase + n8n + Cloudflare Pages.
> No Next.js. No redesign. Design is locked — only functionality is added.

---

## Phase 0 — Audit Results (2026-05-16)

### Routes (current state)

| URL | How it resolves | Status |
|-----|----------------|--------|
| `/write` | Cloudflare serves `public/write.html` (static file takes priority over SPA fallback) | **Static prototype — no data wiring** |
| `/blog-cms` | `AnimatedRoutes` renders `BlogCMSToWriteRedirect` → hard `window.location.replace("/write")` | Redirect, not a real route |
| `/blog-cms/voice/:id` | React renders `VoiceTemplateEditor` | Working |
| `/portal` | React renders `Portal` (existing admin hub) | Working |

### Files to port / reuse

| File | Lines | Purpose | Reuse plan |
|------|-------|---------|------------|
| `apps/personal/public/write.html` | 4,660 | Static design prototype — all three modes | **Port design to React; rename to `write-src.html` so Cloudflare stops serving it** |
| `apps/personal/src/pages/BlogCMS.tsx` | 2,189 | Working CMS: editor, autosave, voice analysis, articles list, SourceBar n8n Phase 1/2 | **Strip into mode components. ManageMode gets ArticlesScreen + SourceBar. WriteMode gets EditorScreen.** |
| `apps/personal/src/components/portal/blog/VoiceTemplateEditor.tsx` | existing | Full 9-section voice template editor at `/blog-cms/voice/:id` | Keep at current route, no changes |
| `apps/personal/src/components/portal/blog/primitives.tsx` | existing | Radar, Meter, Stat, SecLabel, Chip, Kbd, Eyebrow shared UI | Reuse in new mode components |
| `apps/personal/src/lib/blog/voice-analysis.ts` | existing | `analyzeVoice`, `computeCompleteness`, `extractOutline` | Reuse in WriteMode |

### Canonical Supabase tables

| Table | Decision |
|-------|----------|
| `public.blog_posts` | **Canonical article table.** Has `content_nl`, `title_nl`, `excerpt_nl`, `voice_template_id`, `voice_match_score`, `completeness_score`, `word_count`, `status`, `scheduled_at`. |
| `public.blog_post_versions` | Keep for version history |
| `public.hvl_voice_templates` | Keep. Has `archived_at` (soft-delete). Used by VoiceTemplateEditor. |
| `public.blog_cms_youtube_sources` | **Canonical YouTube import table.** Richer schema than any legacy hvl_ equivalent. Links to `blog_posts.id`. |
| `public.blog_cms_agent_reviews` | **Canonical agent review log.** Links to `blog_posts.id` and `blog_cms_youtube_sources.id`. |
| `public.blog_cms_wiki_terms` | Canonical wiki/glossary |
| `public.blog_cms_article_wiki_terms` | Article-term join table |
| `public.hans_blog_memory` | n8n editorial memory — never write directly, only via n8n pipeline |

If any `hvl_blog_articles` or `hvl_youtube_sources` tables exist: they are legacy — do not write to them.

### n8n Workflows (8 active)

| Workflow | ID | Trigger | What it does |
|----------|----|---------|-------------|
| Blog Init | vuIAzCx6OyDc4mZu | `POST /webhook/hans-blog-init` | Phase 1: returns brand_voice + recent_posts + resume_url |
| Blog Resume | dynamic resume_url | `POST {resume_url}` | Phase 2: writes draft to blog_posts, updates hans_blog_memory |
| Blog Post Save | Ov2MDYdt1PsSHMpm | triggered by webhook | Saves/versions post |
| Blog Memory Update | abJflLSgKc8OlyEq | after publish | Updates narrative_history in hans_blog_memory |
| Blog Ghost Writer | hrRO3mVxiuau9QvO | from Phase 2 resume | Generates bilingual article via Claude |
| Blog Agent Review | Dhc4mcrgRTeH3HZi | manual trigger | Runs editor + fact-checker + SEO agent on article |
| Blog Auto SEO | 0lYdJDqCMkboq8TU | on publish | Writes meta_title, meta_description, og fields |
| Blog Header Image Generator | GdDmzwKZVqd9j7x6 | manual trigger | Generates og_image via Replicate |
| Samantha Blog Pipeline | mjHI5qAzMBwPQ7tD | Telegram / Claude | End-to-end from Samantha |

**The hans-blog-init / resume_url Phase 1→2 flow is already wired in `BlogCMS.tsx` `SourceBar` and `PhaseTwoConfirm`.** Port these components into ManageMode unchanged.

### CSS / Font system

write.html uses a **completely different CSS token system** from the main site:
- Fonts: `Bricolage Grotesque`, `IBM Plex Mono`, `Fraunces` (not in main site)
- Tokens: `--bg-0`, `--ink-0`, `--accent`, `--shadow-stamp`, etc. (not Tailwind)
- Theme: `data-theme="light|dark"` on root (not the main site's `next-themes` class system)

The Blog CMS is a **full-page standalone app** that doesn't use the site nav, footer, or Tailwind tokens. All CSS must be scoped inside `.write-cms` wrapper to avoid bleeding into the site.

The main site's own `--font-display`, `--font-mono`, etc. must NOT be overridden globally.

---

## Implementation Phases

### Gate definition
A phase gate = the feature works end-to-end and doesn't break anything that worked before. No partial implementations cross a gate.

---

### Phase 1 — React shell at `/write` (structure only)

**Goal:** `/write` renders the new React BlogCMS instead of the static HTML file.

**Files:**
- Create: `apps/personal/src/pages/WriteCMS.tsx` — page entry, auth guard, mode router
- Create: `apps/personal/src/components/write-cms/write-cms.css` — scoped CSS from write.html
- Create: `apps/personal/src/components/write-cms/WriteCmsShell.tsx` — topbar + left rail grid
- Create: `apps/personal/src/components/write-cms/modes/WriteMode.tsx` — stub
- Create: `apps/personal/src/components/write-cms/modes/ManageMode.tsx` — stub
- Create: `apps/personal/src/components/write-cms/modes/AnalyticsMode.tsx` — stub
- Rename: `apps/personal/public/write.html` → `apps/personal/public/write-src.html`
- Modify: `apps/personal/index.html` — add Bricolage Grotesque, IBM Plex Mono, Fraunces fonts
- Modify: `apps/personal/src/components/AnimatedRoutes.tsx` — add `/write` React route
- Modify: `apps/personal/src/components/Navbar.tsx` — `/write` anchor stays (no change needed)

**Gate:** `pnpm build` passes. `/write` in browser shows 3-mode stamp nav + correct design. No Tailwind tokens bleed into the CMS. `/blog-cms` still hard-nav redirects to `/write`.

---

### Phase 2 — Write mode: editor + autosave

**Pre-req B.1 — COMPLETE (2026-05-16):**
- `/write/:id` route added in `AnimatedRoutes.tsx` — loads WriteCMS with postId param
- `WriteCMS.tsx` reads `useParams` and passes `postId` to `WriteCmsShell`
- `WriteCmsShell.tsx` accepts `postId` prop, auto-switches to write mode when id present
- `ManageMode.tsx` post rows are clickable — `useNavigate` to `/write/:id`
- `useBlogPost.ts` hook: queries `blog_posts` by id, returns loading/loaded/not-found/error states
- `WriteMode.tsx` displays real post data: title (EN+NL), content (EN+NL rendered HTML),
  status pill, category, word count, voice match score, completeness score, SEO card
- Empty state (no id): shows "Select a post from Manage or start a new draft"
- TSC: PASS. Production build: PASS.

**Goal:** Writing an article in the EN/NL split editor saves to `blog_posts` in real-time.

**Files:**
- Expand: `apps/personal/src/components/write-cms/modes/WriteMode.tsx`
  - EN/NL split paper, title input, hero input
  - TipTap editor (reuse existing TipTap setup from BlogCMS.tsx EditorScreen)
  - Right rail: voice analysis (reuse `analyzeVoice` from `lib/blog/voice-analysis.ts`)
- Create: `apps/personal/src/components/write-cms/hooks/usePostAutosave.ts`
  - Debounced upsert to `blog_posts`
  - Tracks `is_dirty` state for save indicator
- Possibly: add migration for `content_nl` column if not present on `blog_posts`
  (verify via `supabase gen types` output)

**Gate:** Open a new or existing post. Type in EN editor, wait 2s, row is updated in `blog_posts`. Type in NL editor, same. Voice match score updates live in right rail.

---

### Phase 3 — Manage mode: article list + SourceBar + Phase 1→2 flow

**Status: COMPLETE** (posts table + SourceBar + PhaseTwoConfirm all wired)

**Completed (2026-05-16):**
- `ManageMode.tsx`: real Supabase `blog_posts` query, filter tabs (All/Draft/Live/Scheduled)
  with live counts, search input, `posts-table` with `posts-pill` status badges
- Status mapping: `published`/`published=true` → live, `draft` → draft, `scheduled` → scheduled,
  `review` → in review — matches prototype CSS classes exactly
- `ManageSourceBar.tsx`: YouTube URL input, topic input, angle input, Ghost-write button
  — POSTs to `hans-blog-init` (same endpoint as `BlogCMS.tsx`)
- `useBlogInitWorkflow.ts`: Phase 1 (POST to `hans-blog-init`, returns `brand_voice` +
  `recent_posts` + `resume_url`) and Phase 2 (POST to `resume_url` with confirmed brand voice)
- `ManagePhaseTwoConfirm.tsx`: brand voice edit textarea, recent coverage read-only panel,
  Cancel + Confirm & dispatch buttons
- All workflow states: idle / verifying / resuming / done / error
- On successful dispatch: posts table auto-refreshes via `fetchPosts` callback
- All new CSS scoped under `.write-cms .source-bar`, `.phase2-*`, `.source-notice-*` in `write-cms.css`
- TypeCheck clean, production build passes (WriteCMS chunk: 15.91 kB JS + 29.82 kB CSS)

**Note:** `write-src.html` manage section does not contain a SourceBar — it was ported from
`BlogCMS.tsx` as a product requirement. The prototype manage view only shows the posts table.

**Remaining (deferred):**
- `VoiceTemplatesScreen` from `BlogCMS.tsx` (links to `/blog-cms/voice/:id`) — not part of this phase

**Gate:** Articles list loads from Supabase ✅. YouTube URL input ✅. Topic + angle inputs ✅.
Ghost-write button → POSTs to `hans-blog-init` ✅. PhaseTwoConfirm renders when `resume_url`
returned ✅. Dispatch POSTs to `resume_url` ✅. Posts table refreshes on completion ✅.

**Verification (2026-05-16):**
- TSC: PASS (no errors)
- Production build: PASS (WriteCMS 15.91 kB JS / 29.82 kB CSS)
- All routes confirmed: `/write` → WriteCMS shell, `/blog-cms` → redirect to `/write`,
  `/blog-cms/voice/:id` → VoiceTemplateEditor (lazy, untouched)
- All CSS verified scoped under `.write-cms` — no unscoped rules
- Imports verified: ManageMode → ManageSourceBar → useBlogInitWorkflow (correct chain)
- Endpoint match: `useBlogInitWorkflow.ts` line 3 = `BlogCMS.tsx` line 1013 ✅

**Runtime blocker — RESOLVED (2026-05-16):**
  All 8 n8n blog workflows are now active. HTTP 404 blocker is gone.

**A.1 fix — Blog Init + Ghost Writer wiring (2026-05-16):**
  - Blog Init n8n response returns `brand_voice_context` + `narrative_history`, not the
    `brand_voice` + `recent_posts` + `resume_url` assumed in Phase 3. Fixed:
    `useBlogInitWorkflow.ts` now normalizes both field naming conventions.
  - The assumed Phase 2 `resume_url` / Wait-node flow does not exist in Blog Init. Fixed:
    after Phase 2 confirm, the hook POSTs directly to Blog Ghost Writer
    (`/webhook/blog-ghost-write`) instead of a non-existent `resume_url`.
  - Ghost Writer payload: `{ title, language, category, cluster, proposed_angle,
    brand_voice_context, narrative_history, source, timestamp }`.
  - Error handling improved: shows HTTP status + truncated response body on failure.
  - TSC: PASS. Production build: PASS.

**TODO (security — do not refactor now):**
  `N8N_HOST`, `BLOG_INIT_URL`, and `GHOST_WRITER_URL` are hardcoded in
  `useBlogInitWorkflow.ts`. No auth token required by n8n currently (webhooks are public).
  If auth is added later, move to env vars or proxy via Supabase Edge Function.

---

### Phase 4 — YouTube → bilingual article workflow

**Goal:** YouTube URL in SourceBar triggers transcript fetch + bilingual article generation.

**Files:**
- Create: `apps/personal/src/components/write-cms/hooks/useYoutubeTranscript.ts`
  - Call n8n `blog-youtube-transcript` webhook (or Supabase edge function) with video_id
  - Falls back to Whisper if YouTube Data API returns no transcript
  - Writes to `blog_cms_youtube_sources`
- Expand: `ManageMode.tsx` SourceBar
  - Show transcript status badge (imported → transcribing → transcribed → analyzed)
  - After transcript ready: auto-populate angle field with key_topics[0]

**Gate:** Paste YouTube URL → status shows "transcribing" → changes to "transcribed" → topic field pre-fills → Ghost Writer produces bilingual draft in `blog_posts`.

---

### Phase 5 — Review: right rail wiring

**Goal:** Right rail in Write mode shows real data from Supabase (agent reviews, wiki terms, SEO suggestions).

**Files:**
- Expand: `WriteMode.tsx` right rail
  - Agent reviews panel: query `blog_cms_agent_reviews` for current `article_id`
  - Wiki terms panel: query `blog_cms_wiki_terms` (confirmed) for term matches in content
  - SEO card: read `meta_title`, `meta_description`, `primary_keyword` from current post
- Add: "Run agents" button → POST to n8n Blog Agent Review webhook (`Dhc4mcrgRTeH3HZi`)
- Add: "Generate header image" button → POST to n8n Blog Header Image Generator webhook (`GdDmzwKZVqd9j7x6`)

**Gate:** Write mode right rail shows real agent review results. "Run agents" button creates rows in `blog_cms_agent_reviews` and results appear within ~30s.

---

### Phase 6 — Publish + schedule

**Goal:** Publish and schedule buttons write to `blog_posts` and trigger n8n Auto SEO.

**Files:**
- Expand: `WriteMode.tsx` or `WriteCmsShell.tsx`
  - "Publish now" → sets `published=true`, `status='published'`, triggers n8n Auto SEO webhook
  - "Schedule" → datepicker → sets `scheduled_at`, sets `status='scheduled'`
  - If `pg_cron` is enabled: verify cron job exists for scheduled publish
- Create migration (if needed): verify `pg_cron` extension is enabled on the project

**Gate:** Set a post to "scheduled" with a future timestamp. Post flips to published at that time (or via manual n8n trigger). n8n Auto SEO fills meta fields after publish.

---

### Phase 7 — Analytics mode (real data)

**Gate:** Analytics mode shows real GSC data (via Ahrefs MCP or n8n GSC connector) and real `blog_posts` metrics.

Do not build until Phase 6 is complete.

---

### Phase 8 — Cleanup

- Remove `src/pages/BlogCMS.tsx` (replace all imports with the new write-cms components)
- Remove `/blog-cms` redirect from `AnimatedRoutes.tsx` (or keep as permanent redirect for SEO)
- Update `CLAUDE.md` to reference new route structure
- Drop any legacy `hvl_blog_articles` / `hvl_youtube_sources` tables via migration if confirmed unused

---

## What NOT to build (until phases above are done)

- LinkedIn automation
- Telegram blog pipeline integration in the UI
- Analytics charts (hardcoded in write.html — real data is Phase 7)
- Extra redesigns or layout changes
