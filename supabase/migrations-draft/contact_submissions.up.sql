-- DRAFT v3 — contact_submissions. NIET automatisch uitvoeren; staat bewust buiten supabase/migrations/.
-- Doelproject (expliciet): pesfakewujjwkyybwaom. Nooit via generieke `supabase db push` (config.toml wijst naar een ander project).
-- Zie supabase/migrations-draft/CONTACT-README.md voor volgorde, verificatie en terugval.
--
-- Ontwerp:
--  * Browserrollen (anon/authenticated) kunnen NIET inserten. Enige schrijver is de Edge Function
--    `contact-submit` (Turnstile-verificatie + validatie), die de RPC public.contact_submit aanroept
--    met een server-side sleutel. EXECUTE op die RPC alleen voor service_role.
--  * CHECK-constraints + een vergrendelde sliding-window-limiter (trigger) blijven als backstop,
--    ook als de Edge Function wordt omzeild met een servercredential.
--  * Productie heeft default privileges die anon/authenticated (en andere rollen) automatisch ALLES
--    geven op nieuwe tabellen en EXECUTE op nieuwe functies in public. Daarom hieronder expliciete
--    REVOKEs per rol; REVOKE ... FROM public alleen is niet genoeg.
--  * Als de tabel al bestaat faalt CREATE TABLE bewust: dan eerst opnieuw inventariseren.
begin;

create table public.contact_submissions (
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

create index contact_submissions_email_created_idx
  on public.contact_submissions (lower(email), created_at desc);
create index contact_submissions_created_idx
  on public.contact_submissions (created_at desc);

alter table public.contact_submissions enable row level security;

-- Sliding-window limiter: één vergrendelde, begrensde statusrij (klein contactformulier).
create table public.contact_rate_state (
  singleton boolean primary key default true check (singleton),
  events jsonb not null default '[]'::jsonb check (jsonb_typeof(events) = 'array')
);
insert into public.contact_rate_state values (true, '[]');
alter table public.contact_rate_state enable row level security;

create function public.contact_submissions_rate_limit()
returns trigger language plpgsql security definer
set search_path = pg_catalog
as $fn$
declare
  recent jsonb;
  instant timestamptz;
  same_email integer;
begin
  -- Lock blijft tot commit/rollback van de hele INSERT-transactie.
  select events into strict recent from public.contact_rate_state
    where singleton = true for update;
  instant := clock_timestamp();
  new.email := lower(btrim(new.email));
  new.name := btrim(new.name);
  select coalesce(jsonb_agg(e), '[]'::jsonb) into recent
    from jsonb_array_elements(recent) e
    where (e->>'at')::timestamptz > instant - interval '10 minutes';
  select count(*) into same_email from jsonb_array_elements(recent) e
    where e->>'email' = new.email;
  if same_email >= 3 then
    raise exception using errcode = 'P4291', message = 'contact submission limit reached';
  end if;
  if jsonb_array_length(recent) >= 30 then
    raise exception using errcode = 'P4292', message = 'contact submission limit reached';
  end if;
  update public.contact_rate_state set events = recent || jsonb_build_array(
    jsonb_build_object('email', new.email, 'at', instant)) where singleton = true;
  return new;
end;
$fn$;

create trigger contact_submissions_rate_limit before insert on public.contact_submissions
for each row execute function public.contact_submissions_rate_limit();

-- Enige schrijfroute. Retourneert niets (geen id/PII terug naar de aanroeper).
create function public.contact_submit(p_name text, p_email text, p_reason text, p_message text)
returns void language plpgsql security definer
set search_path = pg_catalog
as $fn$
begin
  insert into public.contact_submissions (name, email, reason, message)
  values (p_name, p_email, p_reason, p_message);
end;
$fn$;

-- ── Rechten: alles dicht voor iedere rol, daarna minimaal openzetten ─────────────────────────
do $grants$
declare r text;
begin
  -- Alle rollen die in dit cluster bestaan en via default privileges iets gekregen kunnen hebben.
  foreach r in array array['anon', 'authenticated', 'service_role', 'hansos_agent', 'inbox_triage_writer'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on table public.contact_submissions from %I', r);
      execute format('revoke all on table public.contact_rate_state from %I', r);
      execute format('revoke all on function public.contact_submissions_rate_limit() from %I', r);
      execute format('revoke all on function public.contact_submit(text, text, text, text) from %I', r);
    end if;
  end loop;
end
$grants$;
revoke all on table public.contact_submissions, public.contact_rate_state from public;
revoke all on function public.contact_submissions_rate_limit() from public;
revoke all on function public.contact_submit(text, text, text, text) from public;

-- Beheer: alleen admins lezen/verwijderen (RLS), nooit inserten/updaten via de API.
grant select, delete on table public.contact_submissions to authenticated;
create policy "contact: admins can read"
  on public.contact_submissions for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "contact: admins can delete"
  on public.contact_submissions for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Enige schrijver: servercontext (Edge Function met server-side sleutel).
grant execute on function public.contact_submit(text, text, text, text) to service_role;

commit;
