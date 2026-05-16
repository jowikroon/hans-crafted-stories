# Blog CMS Full Audit — 2026-05-16

> Scope: n8n workflows, React /write app, Supabase data, pipeline integration, roadmap to full working condition.

---

## 1. Current State Summary

| Component | Status | Health |
|-----------|--------|--------|
| `/write` React shell | Phase 1 + 3 shipped | WORKING |
| Manage mode (posts table + SourceBar) | Phase 3 complete | WORKING (n8n was inactive, now fixed) |
| Write mode (editor) | Stub only | NOT STARTED |
| Analytics mode | Stub only | NOT STARTED |
| n8n workflows (8 total) | All 8 active | ALL ACTIVE |
| Supabase blog_posts | 25 rows (4 published, 21 drafts) | DATA EXISTS |
| hans_blog_memory | 6 categories seeded | HEALTHY |
| Voice templates | 3 active | HEALTHY |
| YouTube sources | 0 rows | EMPTY |
| Agent reviews | 0 rows | EMPTY |
| Header images | 0 rows | EMPTY |
| Post metrics | 0 rows | EMPTY |
| Old BlogCMS.tsx | Still exists, has features not yet ported | LEGACY |

---

## 2. n8n Workflow Audit (8 workflows)

### 2.1 Blog Init (`vuIAzCx6OyDc4mZu`) — ACTIVE
- **Webhook:** `POST /webhook/blog-init`
- **Flow:** Webhook -> Fetch Memory (Code) -> Respond to Webhook
- **What it does:** Queries `hans_blog_memory` by category, returns `brand_voice_context` + `narrative_history`
- **Response shape:** `{ success, category, brand_voice_context, narrative_history, has_memory }`
- **CRITICAL BUG:** Response does NOT include `resume_url`. The CLAUDE.md protocol says Phase 1 must return a `resume_url` for the Phase 2 wait-and-resume flow. This workflow just returns memory data synchronously — there is no n8n "Wait" node.
- **CRITICAL BUG:** Response field names don't match what `useBlogInitWorkflow.ts` expects. The hook expects `{ brand_voice, recent_posts, resume_url }` but the workflow returns `{ brand_voice_context, narrative_history, has_memory }`.
- **Frontend impact:** `useBlogInitWorkflow.ts` line 41-46 destructures `brand_voice` and `recent_posts` — these will be `undefined`.
- **Wired in:** `useBlogInitWorkflow.ts` (new write-cms), `BlogCMS.tsx` (old)

### 2.2 Blog Ghost Writer (`hrRO3mVxiuau9QvO`) — ACTIVE
- **Webhook:** `POST /webhook/blog-ghost-write`
- **Flow:** Webhook -> Process Input -> Brief Builder -> Draft Writer -> Editorial Review -> Check Score -> (Rewriter if low) -> Anti-Detection -> Generate SEO -> Save Draft -> Track Cost
- **What it does:** Full 5-stage pipeline: brief -> draft -> review -> optional rewrite -> anti-detection pass -> SEO generation -> save to blog_posts
- **11 nodes, most sophisticated workflow.** Uses Anthropic API directly with cost tracking.
- **Saves to:** `blog_posts` (via Supabase REST API)
- **NOT wired in React /write code.** Only called by Samantha Blog Pipeline.
- **Should be:** Called after Phase 2 confirm in SourceBar (the `resume_url` POST should trigger this).

### 2.3 Blog Post Save (`Ov2MDYdt1PsSHMpm`) — ACTIVE
- **Webhook:** `POST /webhook/blog-post-save`
- **Flow:** Webhook -> Build Post Payload -> Save to Supabase -> Respond
- **What it does:** Upserts full post to `blog_posts` (by ID or slug). If published, also updates `hans_blog_memory` narrative_history.
- **NOT wired in React.** WriteMode doesn't exist yet. Should be used for editor autosave.

### 2.4 Blog Memory Update (`abJflLSgKc8OlyEq`) — ACTIVE
- **Webhook:** `POST /webhook/blog-memory-update`
- **Flow:** Webhook -> Build Upsert Payload -> Upsert to Supabase -> Respond
- **What it does:** Updates `hans_blog_memory` (brand_voice_context and/or narrative_history) for a category.
- **NOT directly wired in React.** Called automatically by Blog Post Save when publishing.

### 2.5 Blog Agent Review (`Dhc4mcrgRTeH3HZi`) — ACTIVE
- **Webhook:** `POST /webhook/blog-agent-review`
- **Flow:** Webhook -> Fetch Editorial Memory -> Build Claude Prompt -> Call Anthropic API -> Parse Response & Track Cost -> Log Cost to Supabase -> Respond
- **What it does:** 10-dimension editorial review via Claude Sonnet. Returns weighted score, verdict (publish-ready / revision-needed / reject), burstiness check, fabrication detection.
- **Reads:** `hans_blog_memory`, `hvl_voice_templates`
- **Writes:** `client_costs` (cost tracking)
- **BUG:** Does NOT write results to `blog_cms_agent_reviews` table. The response goes back to the webhook caller but never persists. This is why `blog_cms_agent_reviews` has 0 rows.
- **NOT wired in React /write.** Should have a "Run agents" button in WriteMode right rail.

### 2.6 Blog Auto SEO (`0lYdJDqCMkboq8TU`) — ACTIVE
- **Webhook:** `POST /webhook/blog-auto-seo`
- **Flow:** Webhook -> Fetch Post -> Generate SEO Report -> Save and Respond
- **What it does:** Full SEO audit: keyword density, readability, heading hierarchy, meta completeness, internal link suggestions, JSON-LD generation (Article + Breadcrumb + FAQ).
- **Writes:** `seo_audits` table + updates `blog_posts` (seo_score, readability_score, json_ld, word_count, reading_time)
- **NOT wired in React.** Should be triggered on publish.

### 2.7 Blog Header Image Generator (`GdDmzwKZVqd9j7x6`) — ACTIVE
- **Webhook:** `POST /webhook/blog-header-image`
- **Flow:** Webhook -> Build Visual Brief -> Build Image Prompts -> Generate Images -> Upload and Save
- **What it does:** Generates 3 header image variants using Gemini 2.5 Flash -> DALL-E 3 -> Pollinations fallback chain. Uploads to Supabase Storage.
- **Writes:** Images to Supabase Storage bucket `apps/blog-headers/`
- **Does NOT write to** `blog_header_images` table (bug — should log results there)
- **Does NOT update** `blog_posts.image_url` or `og_image` (bug — should set on the post)
- **NOT wired in React.** Should have a "Generate header image" button.

### 2.8 Samantha Blog Pipeline (`mjHI5qAzMBwPQ7tD`) — ACTIVE
- **Webhook:** `POST /webhook/samantha-blog`
- **Flow:** Webhook -> Parse Input -> Send Writing Status (Telegram) -> Call Ghost Writer -> Send Draft Result (Telegram) -> Review Taal -> Merge -> Review AI Detect -> Merge -> Review Hoofdredacteur -> Send Review Results (Telegram)
- **What it does:** End-to-end pipeline from Telegram. Calls Ghost Writer, then runs 3 sequential agent reviews (taal, ai-detectie, hoofdredacteur) via the Blog Agent Review webhook, sends results back to Telegram.
- **Integration:** Standalone pipeline via Telegram, not wired to React CMS. This is correct by design — it's the "Samantha" autonomous path.

---

## 3. React CMS Audit — Pipeline Integration Gaps

### 3.1 What `/write` currently has

| Feature | File | Status |
|---------|------|--------|
| Shell + 3-mode nav | `WriteCmsShell.tsx` | WORKING |
| Manage posts table | `ManageMode.tsx` | WORKING |
| SourceBar (YouTube + topic + angle) | `ManageSourceBar.tsx` | WORKING |
| Phase 1 POST to hans-blog-init | `useBlogInitWorkflow.ts` | WIRED (but response field mismatch) |
| Phase 2 brand voice confirm | `ManagePhaseTwoConfirm.tsx` | WIRED (but no resume_url returned) |
| Phase 2 dispatch to resume_url | `useBlogInitWorkflow.ts` | WIRED (but resume_url is always undefined) |
| Write mode editor | `WriteMode.tsx` | STUB |
| Analytics mode | `AnalyticsMode.tsx` | STUB |

### 3.2 What's NOT wired yet (from n8n to React)

| n8n Workflow | Webhook Path | React Integration | Priority |
|-------------|-------------|-------------------|----------|
| Blog Init | `/webhook/blog-init` | Wired but broken (field mismatch) | P0 |
| Blog Ghost Writer | `/webhook/blog-ghost-write` | NOT wired — should be triggered after Phase 2 | P0 |
| Blog Post Save | `/webhook/blog-post-save` | NOT wired — needed for WriteMode autosave | P1 |
| Blog Agent Review | `/webhook/blog-agent-review` | NOT wired — needs "Run agents" button | P2 |
| Blog Auto SEO | `/webhook/blog-auto-seo` | NOT wired — needs publish trigger | P2 |
| Blog Header Image | `/webhook/blog-header-image` | NOT wired — needs "Generate image" button | P2 |
| Blog Memory Update | `/webhook/blog-memory-update` | NOT wired — auto-triggered by Post Save | P3 |
| Samantha Pipeline | `/webhook/samantha-blog` | Not applicable (Telegram path) | N/A |

### 3.3 Old BlogCMS.tsx features NOT yet ported

From the 2,189-line `BlogCMS.tsx`:
- **EditorScreen:** TipTap rich text editor with EN/NL split, title input, hero image URL
- **Autosave:** Debounced upsert to `blog_posts` via direct Supabase client
- **Voice analysis:** Live voice match scoring using `analyzeVoice` from `lib/blog/voice-analysis.ts`
- **VoiceTemplatesScreen:** CRUD for voice templates, links to `/blog-cms/voice/:id`
- **Version history:** Save/restore from `blog_post_versions`
- **Keyboard shortcuts:** Ctrl+S save, Ctrl+Shift+P preview

---

## 4. Supabase Data Health

### 4.1 blog_posts (25 rows)

| Metric | Value | Issue |
|--------|-------|-------|
| Total posts | 25 | OK |
| Published | 4 | Low — 21 drafts sitting |
| Has EN content | 24 | OK |
| Has NL content | 18 | 7 posts missing NL translation |
| Has voice template | 25 | All linked |
| Has SEO score | 0 | ZERO — Auto SEO never ran |
| Has meta_title | 25 | All populated |
| Has OG image | 0 | ZERO — Header Image Generator never ran |
| Has JSON-LD | 15 | 10 posts missing structured data |
| Has word count | 19 | 6 posts with word_count = 0 |

### 4.2 hans_blog_memory (6 categories)

| Category | Voice (chars) | History (chars) | Last Updated |
|----------|---------------|-----------------|-------------|
| professional | 4,717 | 886 | 2026-04-06 |
| general | 0 | 0 | 2026-03-31 |
| personal-brand | 4,194 | 0 | 2026-03-30 |
| ai-infrastructure | 1,448 | 171 | 2026-03-30 |
| e-commerce | 4,717 | 67 | 2026-03-30 |
| e-commerce-strategy | 4,717 | 0 | 2026-03-30 |

**Issues:**
- `general` category has EMPTY brand voice (0 chars) — Phase 1 returns nothing for this category
- `personal-brand`, `e-commerce-strategy` have no narrative_history — new posts in these categories won't get deduplication context
- Last update was 2026-04-06 — over a month stale. Memory hasn't been updated since.

### 4.3 Empty pipeline tables

| Table | Rows | Expected use |
|-------|------|-------------|
| blog_cms_youtube_sources | 0 | YouTube transcript pipeline |
| blog_cms_agent_reviews | 0 | Agent review results (not being persisted) |
| blog_header_images | 0 | Generated header images (not being persisted) |
| blog_post_metrics_daily | 0 | Analytics data (Phase 7) |
| blog_distribution_log | 0 | LinkedIn/social distribution tracking |
| blog_related_posts | 0 | Related post suggestions |

### 4.4 Legacy tables (should drop)

| Table | Rows | Decision |
|-------|------|---------|
| hvl_blog_articles | 0 | DROP — replaced by blog_posts |
| hvl_blog_revisions | 0 | DROP — replaced by blog_post_versions |
| hvl_youtube_sources | 0 | DROP — replaced by blog_cms_youtube_sources |
| hvl_blog_agent_reviews | 0 | DROP — replaced by blog_cms_agent_reviews |
| hvl_knowledge_base | 0 | DROP — replaced by blog_cms_wiki_terms |

---

## 5. Critical Bugs Found

### BUG-1: Blog Init response field mismatch (P0)
- **n8n returns:** `{ brand_voice_context, narrative_history, has_memory }`
- **React expects:** `{ brand_voice, recent_posts, resume_url }`
- **Impact:** Phase 1 "works" (HTTP 200) but brand voice and recent posts show as undefined. Phase 2 cannot dispatch because resume_url is undefined.
- **Fix:** Either update n8n to return the expected field names + add a Wait node for resume_url, OR update `useBlogInitWorkflow.ts` to match actual response + call Ghost Writer directly.

### BUG-2: Blog Init has no Phase 2 wait/resume mechanism (P0)
- **CLAUDE.md says:** Phase 1 returns a `resume_url` (n8n wait webhook). Phase 2 POSTs to that URL to resume execution.
- **Reality:** Blog Init is a simple 3-node workflow (Webhook -> Fetch Memory -> Respond). There is no Wait node. There is no resume_url. The two-phase flow described in CLAUDE.md is NOT implemented in n8n.
- **Impact:** The entire Phase 1 -> 2 flow as designed doesn't work. The frontend correctly implements the protocol, but the backend doesn't.
- **Fix options:**
  - **Option A (Recommended):** Simplify. Phase 1 = Blog Init (returns memory). Phase 2 = separate POST to Blog Ghost Writer with the confirmed voice + topic. No wait/resume needed. Frontend calls two separate webhooks.
  - **Option B:** Add Wait node to Blog Init, return execution ID as resume_url, add resume webhook path. More complex, matches CLAUDE.md spec exactly.

### BUG-3: Agent Review doesn't persist results (P1)
- **Blog Agent Review** returns scores via webhook response but never writes to `blog_cms_agent_reviews`.
- **Impact:** No review history. `blog_cms_agent_reviews` stays at 0 rows forever.
- **Fix:** Add a Supabase INSERT to `blog_cms_agent_reviews` in the "Log Cost to Supabase" node.

### BUG-4: Header Image Generator doesn't persist results (P1)
- **Blog Header Image Generator** uploads to Supabase Storage but never writes to `blog_header_images` table and never updates `blog_posts.image_url` or `og_image`.
- **Impact:** Images are generated and uploaded but no record exists. Posts stay with `og_image = null`.
- **Fix:** Add INSERT to `blog_header_images` + PATCH to `blog_posts` with image URL.

### BUG-5: 25 posts, 0 SEO scores (P1)
- Blog Auto SEO workflow exists and works, but has never been called for any post.
- **Fix:** Run Auto SEO on all 25 posts (batch job), then wire it to publish flow.

### BUG-6: `general` category has empty brand voice (P2)
- SourceBar defaults `category` to `"general"`. Blog Init returns empty voice for this category.
- **Fix:** Seed `hans_blog_memory` for `general` with a brand voice context.

---

## 6. Security Issues

| Issue | Severity | Location |
|-------|----------|----------|
| Supabase anon key hardcoded in all 8 n8n workflows | Medium | All workflow Code nodes |
| Anthropic API key plaintext in Blog Agent Review | High | n8n node `Call Anthropic API` |
| OpenAI API key plaintext in Header Image Generator | High | n8n `Generate Images` node |
| Gemini API key plaintext in Header Image Generator | High | n8n `Generate Images` node |
| Telegram bot token plaintext in Samantha Pipeline | High | Multiple n8n nodes |
| All webhooks are public (no auth required) | Medium | All 8 webhooks |
| `BLOG_INIT_URL` hardcoded in frontend JS | Low | `useBlogInitWorkflow.ts` |

**Recommendation:** Move all API keys to n8n Credentials store. Add webhook auth (header token or basic auth).

---

## 7. Unified Roadmap to Full Working Condition

### Recent History (completed)
- 2026-03-28: All 8 n8n workflows created
- 2026-03-30: Voice templates, header image generator, Samantha pipeline
- 2026-04-06: Last blog_memory update (professional category)
- 2026-05-16: Phase 0+1 shipped (React shell at /write)
- 2026-05-16: Phase 3 shipped (ManageMode + SourceBar + Phase 1/2 UI)
- 2026-05-16: All 8 n8n workflows confirmed ACTIVE

### Phase A — Fix the Pipeline (make existing features actually work)

**A.1 Fix Blog Init response + Ghost Writer integration (P0) — DONE (2026-05-16)**
- `useBlogInitWorkflow.ts`: normalizes n8n response fields (`brand_voice_context` -> `brand_voice`, `narrative_history` -> `recent_posts`) with legacy fallbacks
- Removed `resume_url` dependency. Phase 2 confirm now POSTs directly to `/webhook/blog-ghost-write`
- Ghost Writer payload: `{ title, language, category, cluster, proposed_angle, brand_voice_context, narrative_history, source, timestamp }`
- Error handling: shows HTTP status + truncated response body on failure
- `ManagePhaseTwoConfirm.tsx` unchanged (field names match normalized InitResponse)
- TSC: PASS. Production build: PASS.
- Remaining runtime dependency: Ghost Writer workflow must be active (confirmed active 2026-05-16)

**A.2 Fix Agent Review persistence (P1)**
- Update n8n `Blog Agent Review` workflow: add INSERT to `blog_cms_agent_reviews` after Parse Response
- Fields: `agent_key`, `agent_label`, `article_id`, `task`, `output` (JSON), `score`, `status`, `model`, `duration_ms`

**A.3 Fix Header Image persistence (P1)**
- Update n8n `Blog Header Image Generator`: add INSERT to `blog_header_images` + PATCH `blog_posts.og_image`
- Use first successful image URL

**A.4 Backfill SEO scores for all 25 posts (P1)**
- Create a one-shot n8n workflow or script that calls `/webhook/blog-auto-seo` for each of the 25 `blog_posts.id` values
- This populates `seo_score`, `readability_score`, `json_ld`, `word_count`, `reading_time` on all posts

**A.5 Seed `general` category memory (P2)**
- POST to `/webhook/blog-memory-update` with `{ category: 'general', brand_voice_updates: '<voice text>' }`

### Phase B — Write Mode (editor + autosave)

**B.1 TipTap editor with EN/NL split**
- Port EditorScreen from BlogCMS.tsx into `WriteMode.tsx`
- Reuse existing TipTap setup, title input, hero image URL input
- EN paper left, NL paper right (or tabbed on mobile)

**B.2 Autosave hook**
- Create `usePostAutosave.ts`: debounced POST to `/webhook/blog-post-save`
- Track `is_dirty` state for save indicator in shell topbar
- On save success, update local state

**B.3 Right rail — voice analysis**
- Wire `analyzeVoice` from `lib/blog/voice-analysis.ts` to show live voice match score
- Show `completeness_score` meter

**B.4 Right rail — agent review panel**
- "Run agents" button -> POST to `/webhook/blog-agent-review` with current post content
- Poll or realtime subscribe to `blog_cms_agent_reviews` for results
- Show 10-dimension scores + verdict

**B.5 Right rail — SEO card**
- Show current `seo_score`, `readability_score`, `meta_title`, `meta_description`
- "Run SEO audit" button -> POST to `/webhook/blog-auto-seo`

**B.6 Right rail — header image**
- "Generate header image" button -> POST to `/webhook/blog-header-image`
- Show 3 variants, click to select -> updates `blog_posts.og_image`

### Phase C — Publish + Schedule

**C.1 Publish button**
- Sets `published = true`, `status = 'published'`, `published_at = now()`
- Triggers Auto SEO webhook
- Triggers Memory Update webhook
- Updates posts table in ManageMode

**C.2 Schedule button**
- Datepicker -> sets `scheduled_at`, `status = 'scheduled'`
- Needs a cron mechanism (pg_cron or n8n schedule trigger) to flip scheduled -> published

### Phase D — Post row click -> open in editor

**D.1 ManageMode post click navigation**
- Click a post row in the table -> navigate to WriteMode with that post loaded
- URL: `/write?post=<id>` or mode state

**D.2 New post button**
- "New post" button in ManageMode -> navigate to WriteMode with empty editor
- Creates a new draft row in `blog_posts` on first autosave

### Phase E — Analytics Mode (Phase 7 from original roadmap)

- Wire `blog_post_metrics_daily` to analytics charts
- Connect GSC data via Ahrefs MCP or n8n connector
- Show per-post traffic, search performance, engagement

### Phase F — Cleanup

- Remove `BlogCMS.tsx` once all features are ported
- Drop legacy `hvl_blog_articles`, `hvl_blog_revisions`, `hvl_youtube_sources`, `hvl_blog_agent_reviews`, `hvl_knowledge_base` tables
- Move n8n API keys to Credentials store
- Add webhook authentication

---

## 8. Recommended Execution Order

| Step | What | Effort | Unblocks |
|------|------|--------|----------|
| **A.1** | Fix Blog Init + Ghost Writer integration | Small (frontend only) | SourceBar end-to-end |
| **A.4** | Backfill SEO scores on 25 posts | Small (one script) | ManageMode data quality |
| **A.5** | Seed general memory | Trivial (one POST) | Default category flow |
| **A.2** | Fix Agent Review persistence | Small (n8n update) | Review history |
| **A.3** | Fix Header Image persistence | Small (n8n update) | OG images |
| **B.1** | TipTap editor in WriteMode | Medium | Editing posts |
| **B.2** | Autosave hook | Medium | Saving changes |
| **D.1** | Post click -> editor | Small | Post editing workflow |
| **B.3** | Voice analysis right rail | Small | Quality checks |
| **B.4** | Agent review panel | Medium | AI review in CMS |
| **B.5** | SEO card | Small | SEO in CMS |
| **B.6** | Header image panel | Small | Image generation in CMS |
| **C.1** | Publish button | Medium | Publishing from CMS |
| **C.2** | Schedule button | Medium | Scheduled publishing |
| **E** | Analytics mode | Large | Performance tracking |
| **F** | Cleanup legacy code + tables | Medium | Technical debt |

**Critical path to "working CMS":** A.1 -> B.1 -> B.2 -> D.1 -> C.1 = 5 steps to a CMS that can create, edit, and publish posts with the n8n pipeline.
