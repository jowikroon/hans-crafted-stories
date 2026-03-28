-- Migration: Create hans_blog_memory table
-- Date: 2026-03-27
-- Purpose: Stateful editorial memory for the n8n Content Orchestrator.
--          Stores per-category brand voice context and a rolling narrative
--          history so the AI Editor-in-Chief can prevent duplicate coverage
--          and maintain Hans's personal tone across all blog output.

BEGIN;

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.hans_blog_memory (
    content_category    TEXT        PRIMARY KEY,
    brand_voice_context TEXT        NOT NULL DEFAULT '',
    narrative_history   TEXT        NOT NULL DEFAULT '',
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.hans_blog_memory IS 'Per-category editorial memory for the hansvanleeuwen.com AI blog pipeline.';
COMMENT ON COLUMN public.hans_blog_memory.content_category    IS 'Blog category or niche (e.g. "ai-infrastructure", "e-commerce-strategy"). Primary key.';
COMMENT ON COLUMN public.hans_blog_memory.brand_voice_context IS 'Hans''s personal tone rules, banned jargon, formatting preferences, and target audience for this category.';
COMMENT ON COLUMN public.hans_blog_memory.narrative_history   IS 'Rolling summary of the last 5 published posts in this category — used to prevent duplicate angles.';
COMMENT ON COLUMN public.hans_blog_memory.updated_at          IS 'Timestamp of the last memory update (auto-set by trigger).';

-- 2. Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION public.fn_hans_blog_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hans_blog_memory_updated_at ON public.hans_blog_memory;
CREATE TRIGGER trg_hans_blog_memory_updated_at
    BEFORE UPDATE ON public.hans_blog_memory
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_hans_blog_memory_updated_at();

-- 3. Enable Row Level Security
ALTER TABLE public.hans_blog_memory ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies — anon read + update (n8n application layer is the secure gateway)
CREATE POLICY "anon_select_hans_blog_memory"
    ON public.hans_blog_memory
    FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "anon_insert_hans_blog_memory"
    ON public.hans_blog_memory
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "anon_update_hans_blog_memory"
    ON public.hans_blog_memory
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

-- 5. Enable Realtime (consistent with existing Supabase patterns)
ALTER PUBLICATION supabase_realtime ADD TABLE public.hans_blog_memory;

COMMIT;
