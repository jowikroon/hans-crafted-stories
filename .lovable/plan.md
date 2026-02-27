

# Add "Main Menu" Content Editor to Portal

## Overview
Add a 4th sub-menu option **"Main Menu"** under the Content tab that lets you edit on-page content elements for each site page (Home, Work, Writing, About) -- similar to how Blog Posts works, but each "item" is a page with its own editable content fields.

## What You'll Get

Under **Content > Main Menu**, you'll see 4 page cards: **Home**, **Work**, **Writing**, and **About**. Clicking a page opens an editing modal where you can change the on-screen text content for that page.

### Content fields per page:

**Home**
- Subtitle (e.g. "E-commerce Manager")
- Heading
- Heading Emphasis (italic word)
- Description
- CTA Work button text
- CTA About button text
- Expertise section label + heading
- 4 expertise card titles + descriptions

**Work**
- Label (uppercase tag)
- Heading
- Description

**Writing**
- Label
- Heading
- Subtitle
- Search placeholder text

**About**
- Bio paragraph 1
- Bio paragraph 2

## Technical Plan

### 1. New database table: `page_content`
Create a table to store editable text content per page:
- `id` (uuid, primary key)
- `page` (text, e.g. "home", "work", "writing", "about")
- `content_key` (text, e.g. "hero_subtitle", "hero_heading")
- `content_value` (text, the actual content)
- `content_group` (text, for grouping in the editor, e.g. "Hero", "Expertise")
- `content_label` (text, human-readable label)
- `sort_order` (integer)
- `created_at`, `updated_at` (timestamps)

RLS: Public read for everyone, admin-only write (matching existing pattern).

### 2. Seed initial data
Insert rows for all editable content from the current translations (English defaults) for Home, Work, Writing, and About pages.

### 3. New hook: `usePageContent`
- `src/hooks/usePageContent.ts`
- Fetches `page_content` rows for a given page
- Returns a `getValue(key, fallback)` helper
- Used by front-end pages to pull dynamic content instead of hardcoded translations

### 4. New API functions: `src/lib/api/pageContent.ts`
- `getPageContent(page)` -- fetch all content for a page
- `updatePageContent(id, value)` -- update a single content value
- CRUD functions similar to the blog posts pattern

### 5. New component: `PageContentEditorModal`
- `src/components/portal/PageContentEditorModal.tsx`
- Modal that shows all editable fields for a selected page
- Fields grouped by `content_group` (Hero, Expertise, etc.)
- Each field is a labeled input or textarea
- Save button updates all changed fields
- Matches the clean UX of `BlogPostFormModal`

### 6. Update `PortalContentTab.tsx`
- Add "Main Menu" section (shown when subFilter is "All" or "Main Menu")
- Display 4 page cards (Home, Work, Writing, About) in the same list style as blog posts
- Clicking a card opens `PageContentEditorModal` for that page

### 7. Update Portal sub-menu
- In `src/pages/Portal.tsx`, add "Main Menu" to the `content` sub-menu array:
  ```
  content: ["All", "Blog Posts", "Case Studies", "Main Menu"]
  ```

### 8. Wire front-end pages to use dynamic content
- Update `Hero.tsx`, `Work.tsx`, `Writing.tsx`, `About.tsx` to use `usePageContent` hook
- Fall back to existing translation strings when no database value exists
- This makes the content editable from the portal while keeping translations as defaults

