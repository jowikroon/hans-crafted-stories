

# Full NL/ENG Translation for All Pages

## Current State
- Only the **About** page uses the `translations.ts` system via `useLang()`
- All other pages (Home/Hero, Writing, Work, Privacy, Footer, Cookie Consent, 404) have hardcoded English or Dutch strings
- The NL/ENG toggle in the navbar works (context is shared), but switching has no effect on most pages

## Plan

### 1. Expand `src/data/translations.ts` with all site-wide strings

Add translation keys for every page and component:

**Hero (Home page)**
- Subtitle, heading, description, button labels ("View my work" / "Bekijk mijn werk")
- Expertise section: titles, descriptions
- Quick-links text

**Writing page**
- Page header ("Writing" / "Artikelen"), subtitle, search placeholder, sort labels, post count text, empty state messages

**Work page**
- Page header ("Portfolio & Case Studies" / "Portfolio & Cases"), subtitle, description, result count, empty state

**Privacy page**
- Full Dutch and English versions of the privacy policy (7 sections)

**Footer**
- "Privacy" link label (stays same in both languages)

**Cookie Consent**
- Title, description text, button labels ("Accepteren" / "Accept", "Weigeren" / "Decline"), privacy link text

**404 page**
- "Page not found" / "Pagina niet gevonden", return link

**Navbar**
- Nav link labels: Home, Work/Werk, Writing/Artikelen, About/Over mij
- Search placeholder, Login/Portal labels

**Breadcrumbs** (used across Writing, Work, About)
- "Home" label

### 2. Update each component to use `useLang()` + translations

Each file will:
1. Import `useLang` from Navbar
2. Import the relevant translation keys
3. Replace all hardcoded strings with `t.keyName`

**Files to modify:**
- `src/data/translations.ts` -- add all new keys
- `src/components/Hero.tsx` -- use translations for all text
- `src/pages/Writing.tsx` -- page header, search, sort, empty states
- `src/pages/Work.tsx` -- page header, descriptions, empty states
- `src/pages/Privacy.tsx` -- full bilingual privacy policy
- `src/pages/NotFound.tsx` -- 404 text
- `src/components/Footer.tsx` -- link labels
- `src/components/CookieConsent.tsx` -- banner text and buttons
- `src/components/Navbar.tsx` -- nav labels, search placeholder

### 3. Translation Quality

All translations will be professional Dutch, consistent with the existing `translations.ts` tone:
- Formal but approachable ("wij" / "je")
- Industry-accurate e-commerce terminology
- Consistent with existing NL translations on the About page

### Technical Notes

- No new dependencies needed -- uses existing `useLang()` context
- The `translations.ts` type will be expanded with new fields (all typed for safety)
- Blog post and case study content from the database stays as-is (those are managed via the portal CMS)
- Navigation labels in `Navbar.tsx` will become dynamic based on language
- SEO meta tags will also be translated per language for each page

