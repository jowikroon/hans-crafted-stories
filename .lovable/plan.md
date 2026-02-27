
# Improve Main Menu Content Editor -- Professional UX Redesign

## Overview

Redesign the Main Menu content editor from a basic modal with flat form fields into a professional, structured editing experience with logical hierarchy, collapsible content groups, change tracking, undo capability, character counts, and an AI-ready architecture.

## Current Issues

- Flat list of inputs with no visual hierarchy between groups
- No change tracking per field (only a global "has changes" flag)
- No character count or field type hints
- No undo/reset capability
- No visual distinction between short text, headings, and long descriptions
- Page cards in the list view are plain -- no visual preview of content status

## What Changes

### 1. Redesigned Page Cards in PortalContentTab

Replace the plain page buttons with richer cards showing:
- Page icon (Home, Briefcase, PenLine, User) per page
- Content group summary (e.g. "Hero, Expertise -- 14 fields")
- Last updated timestamp from the most recent content row
- Route path shown as a subtle badge (e.g. `/work`)

### 2. Redesigned PageContentEditorModal

Transform the modal into a professional content editing experience:

**Header area:**
- Page name with icon
- Unsaved changes indicator badge
- Reset All button to revert all changes

**Content groups as collapsible accordion sections:**
- Each `content_group` (Hero, Expertise, Bio, etc.) rendered as an Accordion item
- Group header shows field count and changed-field count badge
- All groups expanded by default, collapsible for focus

**Smart field rendering based on content type:**
- Short text (under 60 chars): single-line Input
- Medium text (60-150 chars): Input with character counter
- Long text (150+ chars): Textarea with character counter and row auto-sizing
- Field labels with the `content_key` shown as a subtle monospace sub-label (useful for developers/AI integration)

**Per-field change indicator:**
- A small dot or highlight on fields that have been modified
- Individual field reset button (undo icon) to revert a single field

**Footer actions:**
- Discard Changes button (resets all)
- Save and Preview button (existing)
- Save Changes button (existing, with change count badge)

### 3. AI-Ready Architecture (Future-proof)

Add a subtle, non-functional "AI Assist" button placeholder per field group:
- Sparkles icon with "AI" label, styled as a ghost button
- On click, shows a toast: "AI content generation coming soon"
- This creates the UI hook for future AI integration without any backend work now

The `content_key` sub-labels on each field serve as the machine-readable identifiers that an AI system would use to target specific fields.

### 4. Database: Add `content_type` column

Add a `content_type` text column to `page_content` to classify fields:
- Values: `heading`, `subheading`, `body`, `button`, `label`
- Default: `body`
- Seed existing rows with appropriate types based on their content_key
- This enables smarter field rendering and future AI prompting context

## Technical Changes

### Files Modified

1. **New migration** -- Add `content_type` column to `page_content`, seed types for existing rows
2. **`src/integrations/supabase/types.ts`** -- Will auto-update with new column
3. **`src/lib/api/pageContent.ts`** -- Add `content_type` to `PageContentRow` interface
4. **`src/components/portal/PageContentEditorModal.tsx`** -- Full redesign with:
   - Accordion-based grouped layout
   - Character counters on medium/long fields
   - Per-field change tracking with reset buttons
   - Unsaved changes badge in header
   - AI Assist placeholder buttons per group
   - Smart field type rendering based on `content_type` and value length
5. **`src/components/portal/PortalContentTab.tsx`** -- Enhanced page cards with icons, group summaries, last-updated info, route badges

### New Dependencies
None -- uses existing Accordion, Badge, Tooltip, and Collapsible components already in the project.

### Component Structure

```text
PageContentEditorModal
  DialogHeader (page icon + title + unsaved badge + reset all)
  Accordion (one item per content_group)
    AccordionItem
      AccordionTrigger (group name + field count + AI assist btn)
      AccordionContent
        ContentField (label + key hint + input/textarea + char count + change dot + reset)
  DialogFooter (discard + save & preview + save changes)
```
