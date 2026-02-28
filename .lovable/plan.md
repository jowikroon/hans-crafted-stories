

# Add Multilingual (NL/ENG) Support to Blog Posts

## Current State
Blog posts are stored in the `blog_posts` table with single-language fields (`title`, `excerpt`, `content`). Unlike the `page_content` table which uses a `_nl` key-suffix pattern, blog posts have no Dutch translation capability.

## Approach
Add dedicated `_nl` columns to the `blog_posts` table and update the CMS editor + frontend to support both languages.

## Steps

### 1. Database Migration
Add three new nullable columns to `blog_posts`:
- `title_nl` (text, default `''`)
- `excerpt_nl` (text, default `''`)
- `content_nl` (text, default `''`)

These are nullable/empty-defaulted so existing posts continue working without Dutch content.

### 2. Update BlogPostFormModal (CMS Editor)
Add a language tab or collapsible section showing:
- **Title (NL)** -- text input
- **Excerpt (NL)** -- textarea
- **Content (NL)** -- markdown editor with the same Write/Preview toggle

The existing English fields stay as-is. The NL fields appear below each English counterpart (or in a separate "Dutch" section), labeled with an "(NL)" suffix to match the page content editor pattern.

Save will include the new `_nl` fields in the payload.

### 3. Update Content API Types
Add `title_nl`, `excerpt_nl`, `content_nl` to the `BlogPostRow` interface in `src/lib/api/content.ts`.

### 4. Update Frontend Pages to Be Language-Aware
- **BlogPostPage.tsx**: Use `useLang()` hook. When `lang === "nl"`, display `post.title_nl || post.title`, `post.excerpt_nl || post.excerpt`, and `post.content_nl || post.content` (falling back to English if NL is empty).
- **BlogPostCard.tsx**: Same language-aware title/excerpt rendering.
- **Writing.tsx** (blog index): Same pattern for card display.

### 5. Case Studies (Same Pattern)
Optionally extend the same approach to `case_studies` table with `title_nl`, `description_nl`, `content_nl` columns and update `CaseStudyFormModal` similarly.

## Technical Details

```text
blog_posts table
+------------------+------------------+
| English (exists) | Dutch (new)      |
+------------------+------------------+
| title            | title_nl         |
| excerpt          | excerpt_nl       |
| content          | content_nl       |
+------------------+------------------+
```

The frontend fallback logic in components:
```
const displayTitle = (lang === "nl" && post.title_nl) ? post.title_nl : post.title;
```

Files to modify:
- `src/lib/api/content.ts` -- add NL fields to BlogPostRow interface
- `src/components/portal/BlogPostFormModal.tsx` -- add NL input fields
- `src/pages/BlogPostPage.tsx` -- language-aware rendering
- `src/components/BlogPostCard.tsx` -- language-aware title/excerpt
- `src/pages/Writing.tsx` -- language-aware card display

