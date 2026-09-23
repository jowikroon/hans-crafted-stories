-- Contactformulier — contact_submissions (DRAFT, 2026-09-23)
-- DRAFT migration: bewust NIET in supabase/migrations/. Handmatig draaien in de Supabase
-- SQL-editor van project pesfakewujjwkyybwaom (of eerst op een staging-project) na akkoord
-- van Hans. Rollback: contact_submissions.down.sql. Verificatie: contact_submissions.verify.sql.
--
-- Aanleiding (geverifieerd 2026-09-23, read-only):
--   - apps/personal/.env.production en de live bundle gebruiken project pesfakewujjwkyybwaom;
--   - daar bestaat in geen enkel schema een relatie `contact*`;
--   - supabase_migrations.schema_migrations bevat de migratie van 2026-02-27 niet;
--   - GET /rest/v1/contact_submissions op productie → 404 PGRST205.
--   ⇒ ContactForm.insert() faalt in productie; aanvragen via het formulier komen nergens aan.
--
-- Ontwerp:
--   - servervalidatie via CHECK-constraints (lengtes, e-mailformaat, vaste reden-waarden),
--     identiek aan de Zod-regels in ContactForm.tsx;
--   - anon/authenticated mogen alleen INSERT op de vier invoerkolommen (kolom-grants), niet lezen;
--   - lezen/verwijderen alleen voor admins (public.has_role(auth.uid(), 'admin'));
--   - misbruikbeperking in de database (BEFORE INSERT-trigger): max 3 per e-mailadres per
--     10 minuten en max 30 in totaal per 10 minuten; daarboven een fout (P0001);
--   - honeypot/captcha en e-mailnotificatie zijn bewust buiten deze migratie gehouden
--     (notificatie = n8n/pg_net-keuze van Hans; zie README in docs/growth-2026-09-23).

begin;

create table if not exists public.contact_submissions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  reason      text not null,
  message     text not null,
  created_at  timestamptz not null default now(),
  constraint contact_name_len    check (char_length(btrim(name)) between 1 and 100),
  constraint contact_email_len   check (char_length(email) between 3 and 255),
  constraint contact_email_fmt   check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint contact_reason_enum check (reason in ('freelance', 'job', 'collaboration', 'general')),
  constraint contact_message_len check (char_length(btrim(message)) between 1 and 2000)
);

create index if not exists contact_submissions_email_created_idx
  on public.contact_submissions (lower(email), created_at desc);
create index if not exists contact_submissions_created_idx
  on public.contact_submissions (created_at desc);

alter table public.contact_submissions enable row level security;

-- Rechten: standaard alles dicht, daarna minimaal openzetten.
revoke all on table public.contact_submissions from anon, authenticated, public;
grant insert (name, email, reason, message) on table public.contact_submissions to anon, authenticated;
grant select, delete on table public.contact_submissions to authenticated;

drop policy if exists "contact: anyone can submit" on public.contact_submissions;
create policy "contact: anyone can submit"
  on public.contact_submissions for insert
  to anon, authenticated
  with check (true); -- inhoudelijke validatie via CHECK-constraints + rate-limit-trigger

drop policy if exists "contact: admins can read" on public.contact_submissions;
create policy "contact: admins can read"
  on public.contact_submissions for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "contact: admins can delete" on public.contact_submissions;
create policy "contact: admins can delete"
  on public.contact_submissions for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Misbruikbeperking. SECURITY DEFINER omdat anon de tabel niet mag lezen; vaste search_path.
create or replace function public.contact_submissions_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  per_email integer;
  total     integer;
begin
  new.email := lower(btrim(new.email));
  new.name  := btrim(new.name);

  select count(*) into per_email
    from public.contact_submissions
   where lower(email) = new.email
     and created_at > now() - interval '10 minutes';
  if per_email >= 3 then
    raise exception 'contact rate limit (per email)' using errcode = 'P0001';
  end if;

  select count(*) into total
    from public.contact_submissions
   where created_at > now() - interval '10 minutes';
  if total >= 30 then
    raise exception 'contact rate limit (global)' using errcode = 'P0001';
  end if;

  return new;
end;
$fn$;

revoke all on function public.contact_submissions_rate_limit() from public, anon, authenticated;

drop trigger if exists contact_submissions_rate_limit on public.contact_submissions;
create trigger contact_submissions_rate_limit
  before insert on public.contact_submissions
  for each row execute function public.contact_submissions_rate_limit();

commit;
