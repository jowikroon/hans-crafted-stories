-- Data-masking layer (applied 2026-07-02 via Supabase MCP; committed for archival)
ALTER TABLE public.hvl_experience_bank
  ADD COLUMN IF NOT EXISTS client_masked text,
  ADD COLUMN IF NOT EXISTS metrics_general text,
  ADD COLUMN IF NOT EXISTS metrics_masked text;

COMMENT ON COLUMN public.hvl_experience_bank.client_masked IS 'Gegeneraliseerde klantnaam voor publieke weergave (bv. "een Europees consumentenmerk")';
COMMENT ON COLUMN public.hvl_experience_bank.metrics_general IS 'Metrics afgerond/gegeneraliseerd maar nog kwantitatief';
COMMENT ON COLUMN public.hvl_experience_bank.metrics_masked IS 'Metrics zonder cijfers, punt blijft overeind';

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS masking jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.blog_posts.masking IS 'Per-artikel data-masking: {enabled, defaults:{metric,company,agency,client,person,other}, overrides:{maskId:mode}}';
