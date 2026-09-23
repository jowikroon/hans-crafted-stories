-- Rollback voor contact_submissions.up.sql (DRAFT, 2026-09-23).
-- LET OP: dropt de tabel inclusief ontvangen aanvragen. Exporteer eerst:
--   copy (select * from public.contact_submissions order by created_at) to stdout with csv header;
-- (of via Supabase Table Editor → Export). Pas daarna uitvoeren.

begin;
drop trigger if exists contact_submissions_rate_limit on public.contact_submissions;
drop function if exists public.contact_submissions_rate_limit();
drop table if exists public.contact_submissions;
commit;
