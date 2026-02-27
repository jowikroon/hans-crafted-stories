

## Add Professional Contact Form to the About Page

### Overview
Add a clean, minimalist contact form at the bottom of the About page (before the education section ends) that stores submissions in a new database table. The form includes Name, Email, Reason for Contact (dropdown with contextually relevant options), and a Message text field.

---

### 1. Create `contact_submissions` Database Table

A new table to store form submissions:

- `id` (uuid, primary key)
- `name` (text, not null)
- `email` (text, not null)
- `reason` (text, not null)
- `message` (text, not null)
- `created_at` (timestamptz, default now())

RLS: Enable RLS with an INSERT policy for anonymous users (public-facing form) and a SELECT policy for authenticated admins only.

### 2. Contact Reason Options

Contextually relevant to the site (e-commerce portfolio + blog):

- **Freelance / Project Inquiry** -- Interested in working together on a project
- **Job Opportunity** -- Full-time or contract role discussion
- **Speaking / Collaboration** -- Event, podcast, or content collaboration
- **General Question** -- Anything else

### 3. Create `ContactForm` Component

New file: `src/components/ContactForm.tsx`

A self-contained component with:

- **Inputs**: Name (text), Email (email), Reason (Select dropdown using Radix Select), Message (Textarea)
- **Validation**: Client-side with zod schema (name required max 100 chars, valid email, reason required, message required max 2000 chars)
- **Submission**: Inserts directly into `contact_submissions` table via the client SDK
- **Feedback**: Success toast via sonner, form reset on success, error handling with toast
- **Styling**: Matches the site's minimalist aesthetic -- clean borders, subtle focus rings, consistent with existing card/section styling. Uses existing UI primitives (Input, Textarea, Select, Button, Label)
- **Animation**: Framer Motion fade-in on scroll, consistent with the rest of the About page

### 4. Integrate into About Page

Add the contact form as a new section at the bottom of `src/pages/About.tsx`:

- Wrapped in `isVisible("contact_form")` for portal toggle support
- Section header with icon (Mail) matching the Experience/Education section headers
- Positioned after the Education section

### 5. Bilingual Support

Add contact form labels to the translations file for both EN and NL.

---

### Technical Details

**New files:**
- `src/components/ContactForm.tsx`

**Modified files:**
- `src/pages/About.tsx` -- import and render ContactForm section
- `src/data/translations.ts` -- add contact form translation strings

**Database migration:**
- Create `contact_submissions` table with RLS policies

