

## Navbar and Typography Refresh -- Match Reference Aesthetic

### What We're Doing
Redesigning the navbar to match the reference image's clean, editorial style and applying the same refined font approach across all pages. The reference shows a **flat, full-width navbar** (not a floating pill), with generous spacing, serif logo, well-spaced sans-serif nav links, and a single rounded CTA pill on the right.

### Key Changes

**1. Navbar Redesign (Navbar.tsx)**
The current floating rounded pill navbar will be replaced with a flat, full-width bar that matches the reference:
- Full-width with a subtle bottom border (no floating pill, no rounded corners on the bar itself)
- Logo on the left using the existing Playfair Display serif font
- Center-aligned nav links with wider letter-spacing (`tracking-widest`) and lighter weight (`font-normal`)
- Right side: theme toggle icon + Portal/Login as a rounded pill CTA (like "Join Now" in the reference)
- Remove the search icon and Command Center button from the navbar (keep `Cmd+K` keyboard shortcut working)
- Simpler, cleaner height (`h-16`) with more horizontal padding
- Remove scroll-aware shadow behavior -- the reference navbar is static and clean
- Remove the emerald/dark variant color logic from nav links -- use simple foreground/muted-foreground

**2. Font and Typography Consistency (index.css)**
- Keep the existing Playfair Display + Inter pairing (it already matches the reference's serif heading / sans body approach)
- Increase base letter-spacing on body text slightly for a more editorial feel
- Ensure heading font weights are `font-medium` rather than `font-bold` for that softer, premium look
- Soften section label text: reduce uppercase tracking from `0.2em` to `0.15em`

**3. Hero Section Adjustments (Hero.tsx)**
- Adjust top padding to work with the new flat navbar height
- Soften CTA button styles: reduce `font-bold` to `font-semibold`, slightly larger padding

**4. Footer Alignment (Footer.tsx)**
- Match the navbar's full-width style with consistent horizontal padding
- Keep the current max-width for content alignment

**5. About Page (About.tsx)**
- Adjust `pt-28` to match new navbar clearance

### Technical Details

**Files to modify:**
- `src/components/Navbar.tsx` -- Full redesign: flat bar, wider spacing, cleaner right cluster, remove floating pill wrapper
- `src/index.css` -- Minor typography tweaks: body letter-spacing, softer heading weights
- `src/components/Hero.tsx` -- Adjust `pt-28` for new navbar height
- `src/pages/About.tsx` -- Adjust section top padding
- `src/components/Footer.tsx` -- Align padding with navbar

**No new dependencies.** All changes use existing Tailwind classes and the current Playfair Display + Inter font stack.

### What Stays the Same
- `Cmd+K` search overlay functionality (just removed the icon from navbar)
- Mobile hamburger menu (restyled to match flat aesthetic)
- Language switcher (stays in navbar)
- Theme toggle (stays, repositioned)
- All page content and routing
- Portal/Login pill button concept (restyled to match reference "Join Now" shape)

