
-- Add content_type column to page_content
ALTER TABLE public.page_content
  ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'body';

-- Seed content_type for existing rows based on content_key patterns
UPDATE public.page_content SET content_type = 'heading'
WHERE content_key ILIKE '%title%' OR content_key ILIKE '%heading%' OR content_key ILIKE '%name%';

UPDATE public.page_content SET content_type = 'subheading'
WHERE content_key ILIKE '%subtitle%' OR content_key ILIKE '%tagline%';

UPDATE public.page_content SET content_type = 'button'
WHERE content_key ILIKE '%button%' OR content_key ILIKE '%cta%';

UPDATE public.page_content SET content_type = 'label'
WHERE content_key ILIKE '%label%';
