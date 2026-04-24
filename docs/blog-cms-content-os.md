# BlogCMS Content Operating System

This document defines the intended product model for the BlogCMS inside `apps/personal/src/pages/BlogCMS.tsx`.

The BlogCMS is not only a blog editor. It is an editorial intelligence layer for Hans van Leeuwen's e-commerce and AI content system.

## Product intent

BlogCMS should let Hans:

1. Write and manage articles.
2. Confirm and maintain a wiki of e-commerce and AI terms.
3. Attach confirmed wiki terms to articles as visible pills/badges.
4. Import YouTube videos by dropping a URL.
5. Generate or store transcripts from those videos.
6. Analyze the context of a video.
7. Turn video context into an article draft using a selected voice template.
8. See all YouTube sources in a friendly thumbnail grid.
9. Review every AI agent action per article with full logs.

## CMS tabs

| Tab | Purpose | Product status |
|---|---|---|
| Articles | Overview of all posts, status, search, filters and edit entry points | Existing base |
| Editor | Write, preview, metadata, voice template, save/autosave | Existing base |
| Wiki | Manage confirmed e-commerce and AI terms | To build |
| YouTube | URL import, transcript, context analysis, source grid | To build |
| Voice Templates | Manage writing voices used by articles and YouTube conversions | Existing base |
| Agent Reviews | Audit trail for agents used during article creation/review | To build |

## Wiki tab

The Wiki tab is the terminology layer for e-commerce, AI, marketplace operations and internal concepts.

### Core use cases

- Add a new term such as `Buy Box`, `A+ Content`, `RAG`, `embeddings`, `feed optimisation`, `Bol.com SEO`.
- Store short and long definitions.
- Categorize terms.
- Add synonyms and related terms.
- Mark a term as confirmed by Hans.
- Attach confirmed terms to articles as pills.
- Let agents suggest terms, but require Hans to confirm them.

### Suggested fields

| Field | Description |
|---|---|
| term | Human readable term |
| slug | Stable key/URL fragment |
| category | ecommerce, ai, marketplace, automation, internal |
| short_definition | One sentence definition |
| long_definition | Full explanation |
| synonyms | Search aliases |
| related_terms | Manual or suggested relationships |
| status | draft, review, confirmed, archived |
| confirmed_by | User id of the confirmer |
| confirmed_at | Timestamp |

## Article wiki pills

The article editor should include a `Wiki terms` section in the article management sidebar or metadata panel.

Expected UX:

```txt
Linked wiki terms:
[Buy Box] [Amazon SEO] [A+ Content] [Conversion Rate]

Suggested by Wiki Agent:
[CTR] [Product Feed] [Marketplace Ranking]
```

Hans confirms which suggestions become linked terms. Linked terms can be rendered as pills on article pages or used only internally depending on SEO strategy.

## YouTube tab

The YouTube tab is a source importer.

### Primary UX

A single input field should accept a YouTube URL:

```txt
Paste YouTube URL
https://youtube.com/watch?v=...
```

### Processing flow

1. Store the URL.
2. Resolve video metadata: title, channel, thumbnail, duration.
3. Fetch an existing transcript or generate one.
4. Analyze the transcript.
5. Extract topics, claims, summary, article opportunities and suggested wiki terms.
6. Select a voice template.
7. Create a draft article from the source.
8. Link the generated draft back to the YouTube source.

### Grid view

Every imported video should appear in a friendly grid card:

| Card element | Description |
|---|---|
| thumbnail_url | Visual recognition |
| short_name | AI-generated friendly name |
| source title | Original YouTube title |
| status | imported, transcribing, transcribed, analyzed, used, failed |
| voice template | Selected voice, if used |
| linked article | Article generated from the source |
| imported date | Created timestamp |

## Voice linkage

YouTube sources can be transformed into drafts using an existing `hvl_voice_templates` row.

Expected action:

```txt
Use this source as:
[Hans Professional Voice]
[Marketplace Expert Voice]
[Personal Story Voice]
[Technical AI Voice]
```

## Agent Reviews tab

Agent Reviews is the audit trail for all AI work done on articles and sources.

### Core use cases

- See all agents involved in article creation or review.
- Filter by article, source, agent, status and date.
- Open a full run log for each agent.
- Compare input snapshot and output.
- See scores, warnings and publish blockers.

### Example article view

```txt
Article: Amazon SEO for Dutch sellers

Agents run:
✓ SEO Agent — completed
✓ Voice Agent — completed
⚠ Fact Check Agent — needs review
✓ Wiki Term Agent — suggested 6 terms
✕ Publish Guard — blocked: missing meta description
```

### Required log fields

| Field | Description |
|---|---|
| agent_key | Stable agent identifier |
| agent_label | Human readable agent name |
| article_id | Related blog post |
| youtube_source_id | Optional video source |
| task | What the agent was asked to do |
| prompt | Prompt or instruction snapshot |
| input_snapshot | Article/source content seen by the agent |
| output | Agent result |
| score | Optional quality score |
| status | queued, running, completed, needs_review, failed |
| error_message | Failure reason |
| model | Model/provider used |
| duration_ms | Runtime |
| created_by | User id |
| created_at | Timestamp |

## Governance rules

1. Agents may suggest terms, edits, titles and outlines.
2. Agents may create drafts.
3. Agents must not publish without explicit human confirmation.
4. Wiki terms should not become confirmed without Hans or an admin confirming them.
5. Every agent action must create an audit record.
6. Every YouTube-derived article must remain linked to its source.
7. BlogCMS should prefer visible status over hidden automation.

## Recommended build order

1. Add database schema for wiki terms, article-term links, YouTube sources and agent reviews.
2. Add TypeScript types and API helpers.
3. Replace the `OutOfScopeStub` for Wiki with a functional Wiki screen.
4. Add Wiki term pills to the Editor sidebar.
5. Replace the YouTube stub with URL intake and source grid.
6. Add transcript/analyze edge function or n8n workflow.
7. Replace the Agent Reviews stub with a log table and detail drawer.
8. Add publish guard checks before status can become `published`.

## Success definition

BlogCMS is complete when Hans can write or generate an article, link confirmed wiki terms, use a YouTube video as source material, apply a selected voice, and review exactly which agents did what before publishing.
