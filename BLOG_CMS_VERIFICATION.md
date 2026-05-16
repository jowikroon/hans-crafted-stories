# Blog CMS Verification Report

**Date:** 2026-05-16
**Commit tested:** `da16ceb` (HEAD of main)
**Scope:** Static verification of recently shipped features — B.2 autosave/versions,
publish/unpublish/schedule, agent reviews, header image button, analytics mode.

> This verification is static-only: code review, type-check, production build, schema
> alignment, and webhook URL audit. Runtime checks against the live app, Supabase, and
> n8n endpoints were not executed in this pass (no browser session was available).
> Anything that requires a live POST is marked "DEFERRED — needs browser session".

---

## Verification commands run

```
git status                                                 → clean
git log --oneline -12                                      → da16ceb at HEAD
npx tsc --noEmit --project apps/personal/tsconfig.json     → exit 0
npm run --prefix apps/personal build                       → exit 0
```

Build output included the usual pre-existing SSR warnings (`useLayoutEffect does nothing
on the server`, framer-motion/radix React 18 SSR notes). These are pre-existing in the
codebase and not caused by this work. Final line: `[prerender] Done.` `BUILD_EXIT=0`.

---

## 1. Routing — PASS (static)

| Route | Wiring | Verified |
|-------|--------|----------|
| `/write` | `AnimatedRoutes.tsx:58` → lazy `WriteCMS` | ✅ |
| `/write/:id` | `AnimatedRoutes.tsx:59` → lazy `WriteCMS` with `useParams` id | ✅ |
| `/blog-cms` | `AnimatedRoutes.tsx:60` → `BlogCMSToWriteRedirect` (`window.location.replace("/write")`) | ✅ |
| `/blog-cms/voice/:id` | `AnimatedRoutes.tsx:61` → `VoiceTemplateEditor` | ✅ |
| Cloudflare `_redirects` | `/blog-cms` → `/write` 302, `/blog-cms/voice/*` 200 | ✅ |
| `ManageMode` row click | `ManageMode.tsx:176` `navigate(`/write/${p.id}`)` | ✅ |
| `WriteCMS.tsx` `useParams` | reads `id`, passes to `WriteCmsShell` | ✅ |
| `WriteCmsShell` auto-switch to write mode when `postId` present | line 50 effect | ✅ |

**Reload `/write/:id`** loads the same post — `useBlogPost` keys its `useEffect` on `postId`
from the URL, so a hard reload re-fetches the row. ✅

**Code smell (not a bug):** `WriteCmsShell.tsx:46` initial state
`useState<CmsMode>(postId ? "write" : "write")` is a tautology (both branches return
`"write"`). It's harmless — render still works — but the conditional has no effect. The
existing `useEffect` at line 50 already handles the auto-switch to write mode when
`postId` is present. Not fixing in this pass to honor "no redesign" — flagged for later
cleanup as a 1-line simplification.

---

## 2. Manage SourceBar / n8n — PARTIAL (static PASS, live deferred)

Static checks:
- `ManageMode.tsx` includes `ManageSourceBar` (line 113) with `useBlogInitWorkflow` ✅
- `useBlogInitWorkflow.ts` POSTs to `https://n8n.srv1402218.hstgr.cloud/webhook/hans-blog-init` ✅
- Response normalization handles both new (`brand_voice_context`/`narrative_history`) and
  legacy (`brand_voice`/`recent_posts`) shapes — lines 70–75 ✅
- Phase 2 dispatch POSTs to `/webhook/blog-ghost-write` with the full payload ✅
- Error handling shows HTTP status + truncated body (`describeError`, lines 34–38) ✅
- `fetchPosts` is passed as `onDispatched` callback so the table refreshes after
  Ghost Writer dispatch ✅

**DEFERRED — needs browser session:**
- Submit a harmless YouTube URL through the live UI.
- Confirm Blog Init returns non-undefined `brand_voice` after normalization.
- Confirm Phase 2 confirm produces a new row in `blog_posts` within ~30s.

If the live test fails, the `error` state in `useBlogInitWorkflow` will display the exact
HTTP status + body. No additional logging is needed in code — capture from the UI.

---

## 3. Autosave + versions — PASS (static)

Code paths verified in `apps/personal/src/components/write-cms/hooks/usePostAutosave.ts`:

| Behaviour | Code reference | Verified |
|-----------|----------------|----------|
| Hydrates `fields` from loaded post (one-shot per post id) | lines 51–67, `postIdRef` guard | ✅ |
| `setField` marks dirty | lines 69–73 | ✅ |
| Debounced autosave (1500ms) | lines 129–141 | ✅ |
| Duplicate-content guard | line 80 (`serialized === lastSavedContentRef.current`) | ✅ |
| `word_count` recalculated (EN + NL combined, HTML stripped) | lines 84–86, `countWords` lines 23–27 | ✅ |
| `updated_at` set on each save | line 96 | ✅ |
| Save status machine: idle → dirty → saving → saved/error | lines 41, 71, 82, 105, 121 | ✅ |
| `saveNow()` clears debounce + forces save | lines 143–146 | ✅ |
| Version snapshot on manual save: always | lines 108–109 (`manual || …`) | ✅ |
| Version snapshot on autosave: throttled 60s per post | line 109 + `VERSION_THROTTLE` constant | ✅ |
| Version fields written: `post_id`, `title`, `content`, `excerpt`, `changed_by`, `change_summary` | lines 110–117 | ✅ — all 6 fields exist in `blog_post_versions` schema (types.ts:196–227) |
| No `dangerouslySetInnerHTML` for editable content | `WriteMode.tsx` content uses `<textarea>` only | ✅ confirmed |

**Schema alignment** with generated types (`apps/personal/src/integrations/supabase/types.ts`):
- `blog_posts.title`, `title_nl`, `content`, `content_nl`, `word_count`, `updated_at` — all present ✅
- `blog_post_versions.post_id`, `title`, `content`, `excerpt`, `changed_by`, `change_summary` — all present ✅
- The `excerpt` field is required in versions Insert? Schema shows `excerpt?: string` —
  optional with default. Our insert passes a value (first 200 chars stripped). ✅

**DEFERRED — needs browser session:**
- Open a real `/write/:id`, edit title + EN + NL, wait 2s, reload → confirm persistence.
- Click manual Save → confirm a new `blog_post_versions` row.
- Rapid edits over 60s should produce ≤1 autosave version row.

---

## 4. Publish / unpublish / schedule — PASS (static), AUTO-PUBLISH NOT CLAIMED

Code paths verified in `apps/personal/src/components/write-cms/hooks/usePublish.ts`:

| Operation | Update payload | Side-effect | Verified |
|-----------|---------------|-------------|----------|
| `publish(postId)` | `published=true, status='published', updated_at=now` | fire-and-forget POST to `/webhook/blog-auto-seo` | ✅ |
| `unpublish(postId)` | `published=false, status='draft', scheduled_at=null, updated_at=now` | none | ✅ |
| `schedule(postId, scheduledAt)` | `status='scheduled', scheduled_at=ISO, published=false, updated_at=now` | none | ✅ |
| `onDone` callback triggers `state.refetch()` in WriteMode line 35 | post row reloads → status pill flips | ✅ |

**Schema alignment:** `blog_posts.published` (bool), `status` (string), `scheduled_at`
(string \| null) — all present in generated types. ✅

**Auto-publish:** NOT claimed to work. There is no client code that promotes a
`status='scheduled'` row to `status='published'` at the appointed time. This requires
either pg_cron in Supabase or an n8n cron node; neither is verified active in this pass.
Documented in roadmap as a known limitation.

**Auto SEO trigger:** The publish call hits `/webhook/blog-auto-seo` as fire-and-forget
(`.catch(() => {})` swallows failures silently). The UI will not show whether Auto SEO
succeeded. If it failed, the user would have to inspect n8n logs or `seo_audits` table to
know. This is documented behaviour — not a regression.

**DEFERRED — needs browser session:**
- Publish a draft → confirm `blog_posts.published=true` and `status='published'` in Supabase.
- Check n8n execution log for `/webhook/blog-auto-seo` ~2s after publish.
- Unpublish → confirm row is back to `status='draft'` and `scheduled_at=null`.
- Schedule with a future timestamp → confirm `scheduled_at` is the ISO timestamp.

---

## 5. Agent review persistence — PASS (static), RESPONSE SHAPE TO VERIFY

Code paths verified in `apps/personal/src/components/write-cms/hooks/useReviews.ts`:

| Behaviour | Reference | Verified |
|-----------|-----------|----------|
| Initial fetch from `blog_cms_agent_reviews` by `article_id` | lines 38–47 | ✅ |
| `runAgents` POSTs to `/webhook/blog-agent-review` with `{ post_id }` | lines 63–67 | ✅ |
| HTTP error captures status + 200-char body | lines 68–71 | ✅ |
| Response parsed as JSON, inserted into `blog_cms_agent_reviews` from React (workaround for known n8n persistence bug — BUG-3 in audit) | lines 73–94 | ✅ |
| Insert fields: `article_id`, `agent_key`, `agent_label`, `task`, `output`, `score`, `status`, `model` | lines 80–90 | ✅ — all 8 fields exist in `AgentReviewRun` interface (features/blog-cms/types.ts:58–76) |
| Right rail re-fetches and displays | line 96 → `fetchReviews` → state.reviews | ✅ |
| Empty-state and error-state UI present in WriteMode rail | WriteMode.tsx 343–362 | ✅ |
| `generateImage` POSTs to `/webhook/blog-header-image` | lines 104–117 | ✅ |

**Tables not in generated types:** `blog_cms_agent_reviews` and `blog_cms_wiki_terms` are
NOT in `types.ts`. The hook uses `as unknown as { from: ... }` cast pattern (lines 39, 79).
Same approach as the existing `blogPostVersions.ts` API helper. TSC passes.

**Response shape risk (not a fix, just a flag):**
- `runAgents` reads `result.overall_score ?? result.score` for the inserted score.
- If n8n returns `[{...}]` (array wrapper), `result.overall_score` is `undefined` and the
  inserted score will be `null`. The insert still happens (with output blob), so the
  display falls back to "completed" without a numeric score. Graceful degradation.
- The hook always inserts `agent_key="editorial"` / `agent_label="Editorial Review"` —
  losing any per-agent breakdown if the n8n response contains multiple agents. Documented
  for follow-up; not changing here because we don't know the actual response shape until
  a live POST is made.

**DEFERRED — needs browser session:**
- Click "Run agents" on a real post → capture network response body.
- Confirm `blog_cms_agent_reviews` row is created (it should be, even with null score).
- If response shape is `[{...}]` or different from expected, that's the only small-fix
  candidate — change `result.overall_score` to `(Array.isArray(result) ? result[0] : result).overall_score`.

---

## 6. Header image — PASS (static), PERSISTENCE GAP DOCUMENTED

Code paths verified:
- `generateImage` POSTs to `/webhook/blog-header-image` with `{ post_id }` ✅
- `imageStatus` machine: idle → generating → done / error ✅
- Button label reflects state (`Generating...`, `Image done`, `Header image`) ✅

**Known persistence gap (audit BUG-4, NOT a regression from this work):**
The n8n Header Image Generator workflow uploads to Supabase Storage but does **NOT**:
- Insert into `blog_header_images`
- Update `blog_posts.og_image` or `blog_posts.image_url`

The React hook just fires the webhook. Even on success, there is no row in
`blog_header_images` and no `og_image` set on the post.

**Recommendation for next phase (not this pass):** either
1. Have the n8n workflow persist the result, OR
2. Have the webhook return the uploaded image URL and have React update `blog_posts.og_image`.

This is too large a change for the "small fixes only" rule. Logged.

**DEFERRED — needs browser session:**
- Click "Header image" on a real post → check Supabase Storage bucket `apps/blog-headers/`.
- Confirm (or refute) that nothing is written to `blog_header_images` or `og_image`.

---

## 7. Analytics — PASS

`AnalyticsMode.tsx` verified:
- ✅ All metrics are computed from a real `supabase.from("blog_posts").select(...)` query (lines 22–29).
- ✅ Status counts (`total`, `live`, `drafts`, `scheduled`) computed from real `status`/`published` columns.
- ✅ `totalWords` / `avgWords` from real `word_count` column.
- ✅ Avg voice/completeness/SEO computed only from posts where the score is non-zero (avoids skew from unscored posts).
- ✅ Category breakdown with horizontal bars.
- ✅ "Updated this week" filtered by `updated_at > now − 7d`.
- ✅ GSC/Ahrefs visibly deferred — the placeholder card reads
  `"GSC / Ahrefs integration — connect via n8n or MCP"` (line 158).
- ✅ No fake sessions/position/indexed-pages metrics remain (the previous stub had
  hardcoded `–` placeholders; those are gone, replaced by real data).

---

## 8. Security / config — INVENTORY ONLY (no refactor)

### Hardcoded webhook URLs in shipped code

| File | URL | Method |
|------|-----|--------|
| `apps/personal/src/components/write-cms/manage/useBlogInitWorkflow.ts` | `https://n8n.srv1402218.hstgr.cloud/webhook/hans-blog-init` | POST |
| `apps/personal/src/components/write-cms/manage/useBlogInitWorkflow.ts` | `https://n8n.srv1402218.hstgr.cloud/webhook/blog-ghost-write` | POST |
| `apps/personal/src/components/write-cms/hooks/usePublish.ts` | `https://n8n.srv1402218.hstgr.cloud/webhook/blog-auto-seo` | POST |
| `apps/personal/src/components/write-cms/hooks/useReviews.ts` | `https://n8n.srv1402218.hstgr.cloud/webhook/blog-agent-review` | POST |
| `apps/personal/src/components/write-cms/hooks/useReviews.ts` | `https://n8n.srv1402218.hstgr.cloud/webhook/blog-header-image` | POST |

All five live webhooks are **public** (no auth header), hardcoded in client bundle.
This matches the existing pattern in the rest of the app (`lib/config/workflows.ts`
already exposes a `N8N_BASE` const + per-tool webhook URLs).

**TODO (logged, not fixed here):** When webhook auth or per-user tokens are introduced,
move these URLs and the auth header into one of:
1. `VITE_N8N_WEBHOOK_*` env vars (build-time injection), or
2. A Supabase Edge Function that proxies the request server-side and signs it.

Since the webhooks are already public and the app is single-user (Hans), this is **not a
P0 issue**. Documented for later.

---

## Summary

| Section | Result |
|---------|--------|
| Type-check | ✅ PASS (exit 0) |
| Production build | ✅ PASS (exit 0, prerender done) |
| Routing | ✅ PASS (static) |
| Manage / n8n wiring | ✅ PASS static, ⚠️ live POST deferred |
| Autosave + versions | ✅ PASS static, ⚠️ live edit deferred |
| Publish / unpublish / schedule | ✅ PASS static, auto-publish not claimed |
| Agent review persistence | ✅ PASS static, response shape unknown until live POST |
| Header image | ✅ PASS static, persistence gap documented as known limitation |
| Analytics | ✅ PASS — real data only, no fake metrics |
| Security inventory | ⚠️ 5 public webhook URLs hardcoded — TODO logged |

### Checks failed
None at the static level. All TS, build, schema, and routing checks pass.

### Exact blockers
None identified by static verification. The shipped code matches:
- the Supabase generated types for `blog_posts` and `blog_post_versions`
- the documented `AgentReviewRun` interface in `features/blog-cms/types.ts`
- the route map in `AnimatedRoutes.tsx`

Blockers can only be confirmed by a browser session against the live app.

### Small fixes made in this pass
None. No code changed.

### Code smell flagged but NOT fixed (per "no redesign" rule)
- `WriteCmsShell.tsx:46`: `useState<CmsMode>(postId ? "write" : "write")` tautology.
  Replace with `useState<CmsMode>("write")`. Pure cleanup; effect at line 50 already
  handles the `postId`-aware behaviour.

### Next recommended phase
**Live verification session.** Open `/write` in a browser against production, walk
through sections 2–6 above, capture any failing HTTP responses, and apply small fixes
(response-shape mapping, missing refetch, status-label correction) one at a time.

Only after live verification, the next build phase should be **either**:
- **TipTap rich editor** (Phase 2 follow-up — replace the plaintext textarea), **or**
- **n8n-side fixes** for BUG-3 (agent review persistence) and BUG-4 (header image
  persistence) so the React-side workaround in `useReviews.ts` can be simplified.

Neither is in scope for this pass.
