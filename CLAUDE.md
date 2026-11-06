# Hansvanleeuwen.com — Editor-in-Chief V3 Protocol

> **System identity:** AI Editor-in-Chief for hansvanleeuwen.com
> **Architecture rule:** OpenClaw is the interaction and scheduling owner. n8n remains an execution engine for existing workflow logic and credentialed nodes. All durable state writes go to Supabase. New recurring schedules belong in OpenClaw cron unless Hans explicitly chooses another scheduler.

---

## Execution Flow: Blog Post Generation

Every blog post request follows a strict two-phase webhook loop with Hans-in-the-loop verification. No content is drafted or published without completing both phases.

### Phase 1 — Initiate & Aggregate

1. Claude receives a blog topic, category, or raw idea from Hans.
2. Claude POSTs to the n8n init webhook:

   ```
   POST https://n8n.srv1402218.hstgr.cloud/webhook/hans-blog-init
   ```

   Payload:
   ```json
   {
     "category": "<blog_category>",
     "raw_idea_or_data": "<topic_or_raw_material>",
     "proposed_angle": "<claude_suggested_angle>"
   }
   ```

3. The webhook triggers the n8n orchestrator which:
   - Queries `hans_blog_memory` in Supabase for the matching `content_category`.
   - Retrieves `brand_voice_context` and `narrative_history`.
   - Returns the editorial context **and** a resume URL for Phase 2.

4. Expected response shape:
   ```json
   {
     "status": "verify_editorial_history",
     "brand_voice": "<saved brand voice context>",
     "recent_posts": "<narrative history — last 5 posts summary>",
     "resume_url": "<n8n wait webhook URL for this execution>"
   }
   ```

### Phase 2 — Verify & Resume

5. **Claude MUST present the retrieved context to Hans before proceeding.**

   Example terminal output:
   ```
   Hi Hans, here's what I found for the "{category}" editorial track:

   Brand voice rules:
   {brand_voice}

   Recent coverage (last 5):
   {recent_posts}

   Based on this, I propose drafting the post as:
   → Angle: {proposed_angle}
   → Tone: {derived tone from brand_voice}
   → Differentiation from recent posts: {delta}

   Does this look correct? Any tweaks to the tone, angle, or scope?
   ```

6. Hans replies with confirmation or edits.

7. Claude POSTs to the `resume_url` received in Phase 1:

   ```
   POST {resume_url}
   ```

   Payload:
   ```json
   {
     "confirmed": true,
     "updated_brand_voice": "<merged brand voice with any Hans edits>",
     "final_article_prompt": "<complete generation instructions incorporating history, tone, angle, and Hans's feedback>"
   }
   ```

8. The n8n orchestrator then:
   - Updates `hans_blog_memory` in Supabase with the new `brand_voice_context`.
   - Appends the new post summary to `narrative_history` (rolling window of 5).
   - Sends the final prompt to the LLM node (Anthropic claude-sonnet-4-6 or configured model).
   - Publishes the generated post to the CMS.
   - Returns confirmation to Claude.

9. Claude reports the result to Hans:
   ```
   Blog post published:
   → Title: {title}
   → Category: {category}
   → URL: {published_url}
   → Memory updated: brand voice and narrative history saved.
   ```

---

## Hard Rules

1. **Never draft a blog post without completing Phase 1.** The editorial memory lookup is mandatory.
2. **Never skip Phase 2 verification.** Hans must see and approve the retrieved context before generation begins.
3. **Never fabricate editorial history.** If the Supabase lookup returns empty, say so explicitly and ask Hans to seed the initial brand voice for that category.
4. **Never update memory outside the n8n pipeline.** All `hans_blog_memory` writes go through the orchestrator, not direct Supabase calls from Claude.
5. **One category per execution.** If Hans requests posts across multiple categories, run separate Phase 1 → Phase 2 loops for each.
6. **No em dashes in content, ever.** Hans treats the em dash (U+2014) as an AI mark that costs credibility (2026-09-24). Use a comma, colon, parentheses or a new sentence instead, and put this rule literally in every `final_article_prompt`. Code and files in `apps/personal/public` fail the build on an em dash (`scripts/seo-guard.mjs`, check 18); database copy is cleaned on read (`src/lib/noEmDash.ts`), but must not contain them in the first place.

---

## Supabase Table Reference

```
Table: public.hans_blog_memory
├── content_category    TEXT (PK)   — blog niche identifier
├── brand_voice_context TEXT        — tone, banned jargon, formatting, audience
├── narrative_history   TEXT        — rolling last-5-posts summary
└── updated_at          TIMESTAMPTZ — auto-managed by trigger
```

RLS: anon SELECT, INSERT, UPDATE enabled (n8n is the secure gateway layer).

---

## n8n Webhook Endpoints

| Purpose | URL | Method |
|---|---|---|
| Blog init (Phase 1) | `https://n8n.srv1402218.hstgr.cloud/webhook/hans-blog-init` | POST |
| Blog resume (Phase 2) | Dynamic — returned in Phase 1 response as `resume_url` | POST |

---

## Failure Modes

- **n8n unreachable:** Report to Hans. Do not attempt to draft without memory context. Suggest checking InfraWacht or VPS1 status.
- **Empty memory for category:** Inform Hans. Ask him to provide initial brand voice rules. POST those as a seed via the normal Phase 2 flow with `confirmed: true`.
- **Hans rejects the angle:** Do not POST to `resume_url`. Re-propose based on Hans's feedback. Only POST when Hans confirms.

---

## Git & PR Workflow — Claude merges its own PRs

Hans never merges himself. For every PR Claude opens:

1. Once CI is green (or neutral/skipped), there is no merge conflict and no open blocking review, Claude takes it out of draft and squash-merges it. Do not wait for Hans.
2. After the merge, check the production deploys on main (Vercel, Cloudflare Pages, Workers Builds) and report the result in one line.

Exceptions, where Claude reports first instead of merging: CI stays red and Claude can't fix it, a conflict where both sides change the same logic, or anything irreversible outside the repo (deleting data, payments, credentials).

Never force-push to main, and never skip or disable checks to get green.


---

## Hard UX contract: JOWIKROON music album covers (Claude, Codex, OpenClaw)

**Applies to `/music` and both `/music/albums/*` pages.** The music pages are not blog-post-generation requests: the n8n blog approval loop above does not replace normal source-code PR checks.

Read [the canonical album-motion contract](docs/music-album-motion-contract.md) and [the artwork decision](docs/music-album-artwork-reveal.md) **before editing** `AlbumSleeve.tsx`, `AlbumShowcase.tsx` or `music-albums.css`.

1. **Preserve the approved interactive sleeve.** A cover image alone is the front; clicking or tapping smoothly rotates it 180 degrees in **760 ms**, revealing the complete, uncropped back. Never convert the cover to a static link, remove the 3D transform, or overlay design-system text on the approved front artwork.
2. **Preserve the accelerating reveal.** After the turn ends, track rows arrive at **920, 1370, 1720, 1960, 2140, 2280, 2390, 2480 and 2560 ms**, respectively, from activation. The stagger must become faster, not slower. Each row animates once per opening; reopening replays.
3. **Both albums participate.** NEON displays the two already public songs plus anonymous unreleased slots. IETS MOOIS plans 12 songs, displays five anonymous teaser rows on the square sleeve, and separately offers the four website previews that Hans explicitly authorized on 2026-11-06. Those previews are not official singles. Never replace the sleeve list with a static quote; never reveal titles of the other eight songs, owner-only metadata, WAV masters or hidden release dates. Do not embed the private playlist itself.
4. **Keep accessible alternatives.** Escape closes the sleeve and returns focus; Tab and keyboard activation reveal rows without waiting; `prefers-reduced-motion: reduce` disables motion and shows all rows immediately. Direct album navigation remains available **below** the covers as a nonanimated alternative.
5. **Mandatory PR gate, including for Claude.** Run `npm run test:personal`, `npm run lint:personal`, `npm run typecheck --workspace=@hans/personal` and `npm run build:personal` (or confirm the same named steps passed on the exact PR commit in GitHub CI). In particular, `apps/personal/src/components/music/AlbumSleeve.test.tsx` and `AlbumShowcase.test.tsx` must pass. A failure means **do not merge**; repair the regression instead of deleting or weakening the test.
6. **Don't misreport delivery.** A successful GitHub commit is not a live change. Verify green CI, successful merge SHA and Vercel production READY on that SHA before claiming deployment; label live browser/mobile playback separately if it was not verified. No force-push, bypassing safety checks, or false claims of parallel agents or completed rounds.

This block is an owner-requested permanent product rule for future Claude and other agent changes. Changes to the motion contract itself require a deliberate, recorded product decision with updated tests and documentation.
