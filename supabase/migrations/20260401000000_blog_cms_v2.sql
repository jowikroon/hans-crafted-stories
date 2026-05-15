-- Blog CMS v2 — additive schema changes
--
-- The bulk of what the v2 redesign needs is already present in prod:
--   * blog_posts.voice_template_id (FK → hvl_voice_templates.id ON DELETE SET NULL) exists
--   * blog_posts.voice_match_score / completeness_score / word_count exist
--   * hvl_voice_templates has formality / humor / respectfulness / enthusiasm,
--     target_reading_level, max_sentence_words, passive_voice_max_pct,
--     preferred_terms / pending_terms / banned_words, writing_style_rules jsonb,
--     opening/transition/closing_examples, short_code, description, language,
--     inclusivity_rules, content_rules, seo_guidelines.
--
-- This migration adds the one missing column required by the redesign:
-- soft-delete support for voice templates. Per product rule, voice templates
-- are never hard-deleted — the UI hides archived rows instead.

ALTER TABLE public.hvl_voice_templates
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS hvl_voice_templates_active_idx
  ON public.hvl_voice_templates (updated_at DESC)
  WHERE archived_at IS NULL;

COMMENT ON COLUMN public.hvl_voice_templates.archived_at IS
  'Soft-delete timestamp. Non-null rows are hidden from pickers but retained for historical reference (blog_posts may still point at them via voice_template_id).';
