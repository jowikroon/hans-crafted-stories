-- Phase F — Drop legacy hvl_ tables
--
-- These tables are listed as "legacy — replaced by blog_posts / blog_cms_*"
-- in BLOG_FULL_AUDIT.md §4.4 (all reported with 0 rows on 2026-05-16):
--
--   hvl_blog_articles       — replaced by blog_posts
--   hvl_blog_revisions      — replaced by blog_post_versions
--   hvl_youtube_sources     — replaced by blog_cms_youtube_sources
--   hvl_blog_agent_reviews  — replaced by blog_cms_agent_reviews
--   hvl_knowledge_base      — replaced by blog_cms_wiki_terms
--
-- The drops are guarded with IF EXISTS so the migration is idempotent on
-- environments where some tables were never created. CASCADE handles any
-- residual FKs that might have been left behind in old environments.
--
-- IMPORTANT: hvl_voice_templates is NOT in this drop list. It is the
-- canonical voice template table and is actively used by the Phase D
-- Voice mode plus the legacy VoiceTemplateEditor.
--
-- ROLLBACK NOTE: this migration is destructive. To restore, re-run the
-- original creation migrations from git history. No backup is taken
-- automatically — verify table contents via the Supabase dashboard
-- before running:
--   SELECT 'hvl_blog_articles' AS table, count(*) FROM public.hvl_blog_articles
--   UNION ALL
--   SELECT 'hvl_blog_revisions', count(*) FROM public.hvl_blog_revisions
--   UNION ALL
--   SELECT 'hvl_youtube_sources', count(*) FROM public.hvl_youtube_sources
--   UNION ALL
--   SELECT 'hvl_blog_agent_reviews', count(*) FROM public.hvl_blog_agent_reviews
--   UNION ALL
--   SELECT 'hvl_knowledge_base', count(*) FROM public.hvl_knowledge_base;
-- If any return >0, abort and migrate the rows to the canonical tables first.

drop table if exists public.hvl_blog_articles cascade;
drop table if exists public.hvl_blog_revisions cascade;
drop table if exists public.hvl_youtube_sources cascade;
drop table if exists public.hvl_blog_agent_reviews cascade;
drop table if exists public.hvl_knowledge_base cascade;

-- All confirmed dropped via:
--   select tablename from pg_tables where schemaname='public' and tablename like 'hvl\_%' escape '\';
-- should now return only `hvl_voice_templates`.
