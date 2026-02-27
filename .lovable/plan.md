

## Transform Blog List to Visual Card Grid with Image Upload

### Overview
Redesign the Writing page from a text-based list layout into a modern card grid (matching the reference design), and add image upload capability to the blog post CMS editor. Each card will feature a cover image, category badge, date, post number, title, and an arrow link icon.

### 1. Database: Add `image_url` Column to `blog_posts`

Add a nullable `image_url` text column to the `blog_posts` table to store the cover image URL for each post.

```sql
ALTER TABLE public.blog_posts
  ADD COLUMN image_url text DEFAULT '' NOT NULL;
```

### 2. Update Type Definitions

Add `image` (or `imageUrl`) to the `BlogPost` interface in `src/data/types.ts` and update `BlogPostRow` in `src/lib/api/content.ts` to include `image_url`.

### 3. Redesign `BlogPostCard` Component

Replace the current horizontal list-item layout with a visual card matching the reference:

- Full-bleed cover image as card background with dark gradient overlay
- Category badge (colored pill, top-left)
- Date badge (top-right)
- Post number (small monospace text, e.g. "001")
- Large display title (bottom-left, white text over gradient)
- Arrow-link icon (bottom-right)
- Responsive grid: 1 column on mobile, 2 on tablet, 3 on desktop
- Aspect ratio ~4:3 for each card
- Hover effect: slight scale + overlay shift

### 4. Update Writing Page Grid Layout

Change the post list container in `Writing.tsx` from a vertical stack to a CSS grid:

```text
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6
```

Pass the `imageUrl` through the mapped posts data.

### 5. Add Image Upload to Blog Post CMS Form

Update `BlogPostFormModal.tsx` to include:

- An image upload field with drag-and-drop or click-to-browse
- Upload to the existing `bucket` storage bucket (path: `blog-images/{slug}.{ext}`)
- Preview thumbnail of the current/uploaded image
- Store the public URL in `image_url`

### 6. Update Content API

Update `BlogPostRow` interface and ensure `createBlogPost` / `updateBlogPost` pass `image_url` through.

---

### Technical Details

**Files to modify:**
- `supabase/migrations/` -- new migration for `image_url` column
- `src/data/types.ts` -- add `imageUrl` to `BlogPost`
- `src/lib/api/content.ts` -- add `image_url` to `BlogPostRow`
- `src/components/BlogPostCard.tsx` -- full redesign to visual card
- `src/pages/Writing.tsx` -- switch to grid layout, pass image data
- `src/components/portal/BlogPostFormModal.tsx` -- add image upload field

**Storage:** Uses the existing public `bucket` storage bucket. Images uploaded to `blog-images/` path. Public URL constructed via `supabase.storage.from('bucket').getPublicUrl()`.

**Fallback:** Cards without an image will show a subtle gradient placeholder background.

