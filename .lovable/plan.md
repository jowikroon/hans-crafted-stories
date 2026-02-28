
## Migrate hardcoded blog content to the database

### Problem
All 5 blog posts in the database have an empty `content` field. The frontend falls back to hardcoded content in `src/data/blogContent.ts`, meaning the CMS markdown editor has no effect on what visitors see.

### Solution
Run a single SQL migration that copies the markdown content from the hardcoded file into the corresponding `blog_posts` rows, matched by slug. This makes the CMS the single source of truth.

### Steps

1. **Database migration**: Execute an UPDATE statement for each of the 8 slugs in `blogContent.ts`, setting `blog_posts.content` to the full markdown string where `slug` matches. Posts not yet in the DB will be skipped (only existing rows are updated).

2. **Verify**: After migration, confirm that `content` is no longer empty for the matched posts.

3. **Optional cleanup**: Once confirmed, the `blogContent.ts` fallback file can be left in place (as a safety net) or removed entirely so there's only one source of truth.

### Technical details

Slugs to migrate (8 entries in `blogContent.ts`):
- `hidden-cost-dark-patterns`
- `designing-with-llms`
- `cycling-dutch-countryside`
- `cro-design-problem`
- `ai-search-ux-lessons`
- `bookshelf-2024`
- `ux-unit-economics`
- `sourdough-products`

Only 5 of these currently exist in the database. The UPDATE will match on `slug` so non-existent rows are safely ignored.

No code changes are needed — the existing `BlogPostPage.tsx` already reads `post.content` first.
