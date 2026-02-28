

## Add consistent NL/ENG language toggle across all CMS sections

### What this does
Extract the NL/ENG language switcher (currently only in Portal > Pages) into a reusable component and add it to the Content tab and the page content editor modal. Since the toggle uses the global `useLang()` context, switching language in any location (Navbar, Pages tab, Content tab) will synchronize across the entire site.

### Current state
- The Navbar already has a global NL | ENG toggle that works site-wide
- The Portal > Pages tab has its own NL/ENG toggle (Globe icon style)
- The Portal > Content tab and editor modals have no language toggle
- All components already consume `useLang()` for translations

### Steps

**1. Create a reusable `PortalLangToggle` component**

Extract the Globe + NL/ENG button group from `PortalPagesTab.tsx` into `src/components/portal/PortalLangToggle.tsx`. This keeps the same styling (Globe icon, compact pill buttons) and uses `useLang()` under the hood.

**2. Use `PortalLangToggle` in `PortalPagesTab`**

Replace the inline NL/ENG markup in `PortalPagesTab.tsx` with the new shared component.

**3. Add `PortalLangToggle` to `PortalContentTab`**

Place the toggle in the top-right area of the Content tab, next to the section headers. This lets admins switch language context while managing blog posts, case studies, and main menu pages.

**4. Add `PortalLangToggle` to `PageContentEditorModal`**

Place the toggle in the dialog header area so admins can see which language context they're editing in. The `page_content` values from the database and their `usePageContent` fallback translations will react to the language switch.

**5. Verify global sync**

Since all toggles share the same `useLang()` React context:
- Switching in the Navbar updates the Content tab, Pages tab, Hero, Footer, etc.
- Switching in the Portal Content tab updates the Navbar and all frontend pages
- No separate state management needed -- it's already linked

### Files to create
- `src/components/portal/PortalLangToggle.tsx` (new shared component)

### Files to edit
- `src/components/portal/PortalPagesTab.tsx` (replace inline toggle with shared component)
- `src/components/portal/PortalContentTab.tsx` (add toggle to header area)
- `src/components/portal/PageContentEditorModal.tsx` (add toggle to dialog header)

### No database changes needed
The language system is purely frontend (React context + `translations.ts`). Blog posts and case studies are single-language database entries; the toggle affects the surrounding UI labels and page text, not the post content itself.

