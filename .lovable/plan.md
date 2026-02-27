

## Redesign Blog Post Page + Smooth Filtering

### Overview
Redesign the individual blog post page (`BlogPostPage.tsx`) to match the reference design -- featuring a full-width hero image, category badge with date/read time, large serif title, excerpt subtitle, author section with social share icons, and clean article body. Also fix the Writing page filtering so cards animate smoothly when filters change instead of abruptly popping in/out.

---

### 1. Redesign `BlogPostPage.tsx`

Rebuild the layout to match the reference:

- **Hero image**: Full-width cover image at top (from `post.image_url`) with dark gradient overlay, or a subtle gradient fallback if no image
- **Meta row**: Category badge (colored pill) + date + read time, positioned over/below the hero
- **Title**: Large display font (`font-display text-4xl md:text-5xl lg:text-6xl`), white text over the hero image
- **Excerpt/subtitle**: Lighter muted text beneath the title
- **Author bar**: Hans van Leeuwen's profile image (from `src/assets/hans-profile.jpg`) with name and a short tagline, plus social share icons (copy link, Twitter/X, Facebook, LinkedIn) on the right side
- **Article body**: Centered `max-w-3xl` prose content, same markdown renderer as current
- **Breadcrumb**: Keep existing breadcrumb but move above the hero

### 2. Social Share Icons

Add share functionality with four icon buttons:
- **Copy link**: Copies current URL to clipboard with toast feedback
- **Twitter/X**: Opens share intent URL in new tab
- **Facebook**: Opens Facebook sharer URL
- **LinkedIn**: Opens LinkedIn share URL

Use Lucide icons (`Link2`, `Twitter`, `Facebook`, `Linkedin`).

### 3. Smooth Filtering on Writing Page

Current issue: `AnimatePresence mode="popLayout"` causes abrupt transitions when filtering. Fix by:

- Change to `mode="popLayout"` with `layout` prop on `BlogPostCard` motion elements
- Add `layout` and `layoutId` props to the card's `motion.article` so cards smoothly reposition when filtered
- Use `layoutId={post.id}` on each card so Framer Motion can track and animate position changes
- This ensures cards slide into their new positions when a filter is applied rather than just fading

### 4. Smooth Page Transition (Writing to Blog Post)

The existing `PageTransition` + `AnimatePresence mode="wait"` in `AnimatedRoutes` already handles cross-page transitions. No changes needed there -- the fade-up/fade-out is already smooth. The blog post page redesign will inherit the same transition wrapper.

---

### Technical Details

**Files to modify:**
- `src/pages/BlogPostPage.tsx` -- full redesign with hero image, author bar, share icons
- `src/components/BlogPostCard.tsx` -- add `layout` and `layoutId` for smooth filtering
- `src/pages/Writing.tsx` -- minor adjustment to `AnimatePresence` mode if needed

**No database changes needed.** All fields (`image_url`, `category`, `excerpt`, `read_time`, `tags`) already exist.

**Author info:** Hardcoded to "Hans van Leeuwen" with the existing `hans-profile.jpg` asset and a tagline like "E-commerce Manager & Marketplace Specialist".

