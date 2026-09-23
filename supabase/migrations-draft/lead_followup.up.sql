-- DRAFT v1 — lead-opvolging voor contactaanvragen (additief). NIET automatisch uitvoeren.
-- Doelproject (expliciet): pesfakewujjwkyybwaom. Vereist dat contact_submissions.up.sql (v3) al is toegepast.
-- Zie supabase/migrations-draft/LEAD-FOLLOWUP-README.md.
--
-- Ontwerp:
--  * contact_submissions wordt NIET gewijzigd (geen nieuwe kolommen/triggers). Opvolging staat in een 1:1-tabel.
--  * Handmatige businessflow: new → reviewed → call_planned → proposal → won | lost. Niets wordt afgeleid uit GA4.
--  * 'qualified' is NULL tot Hans beoordeelt (NULL = nog niet beoordeeld, nooit stilzwijgend false).
--  * 'excluded_reason' (spam/test/duplicate) sluit een aanvraag uit van alle KPI's; de rij blijft bewaard.
--  * 'requester_type' alleen zoals Hans het bevestigt; NULL = onbekend. Geen afleiding uit e-maildomein/IP.
--  * Enige schrijfroute: RPC public.contact_set_status (SECURITY DEFINER, search_path=pg_catalog), die zelf
--    public.has_role(auth.uid(),'admin') controleert en elke wijziging logt. Actor = auth.uid(), nooit een parameter.
--  * Default privileges in het doelproject geven nieuwe objecten automatisch aan API-rollen: expliciete REVOKEs.
--  * Tweede run faalt bewust (CREATE TABLE zonder IF NOT EXISTS).
begin;

do $guard$
begin
  if to_regclass('public.contact_submissions') is null then
    raise exception 'lead_followup vereist public.contact_submissions (voer eerst contact_submissions.up.sql uit)';
  end if;
end
$guard$;

create table public.contact_followups (
  submission_id   uuid primary key references public.contact_submissions(id) on delete cascade,
  status          text not null default 'new',
  qualified       boolean,
  excluded_reason text,
  requester_type  text,
  next_action_at  timestamptz,
  note            text,
  updated_at      timestamptz not null default now(),
  updated_by      uuid,
  constraint followup_status_enum   check (status in ('new', 'reviewed', 'call_planned', 'proposal', 'won', 'lost')),
  constraint followup_excluded_enum check (excluded_reason is null or excluded_reason in ('spam', 'test', 'duplicate')),
  constraint followup_requester_enum check (requester_type is null or requester_type in ('brand', 'retailer', 'agency', 'recruiter', 'other')),
  constraint followup_note_len      check (note is null or char_length(note) <= 2000),
  -- beoordeeld/verder betekent: Hans heeft gekwalificeerd of uitgesloten; 'new' mag nog geen kwalificatie hebben
  constraint followup_new_unjudged  check (status <> 'new' or qualified is null)
);
alter table public.contact_followups enable row level security;

create table public.contact_status_log (
  id              uuid primary key default gen_random_uuid(),
  submission_id   uuid not null references public.contact_submissions(id) on delete cascade,
  from_status     text,
  to_status       text not null,
  qualified       boolean,
  excluded_reason text,
  changed_by      uuid not null,
  changed_at      timestamptz not null default clock_timestamp(),
  note            text,
  constraint status_log_note_len check (note is null or char_length(note) <= 2000)
);
create index contact_status_log_submission_idx on public.contact_status_log (submission_id, changed_at);
alter table public.contact_status_log enable row level security;

create function public.contact_set_status(
  p_submission_id uuid,
  p_status text,
  p_qualified boolean default null,
  p_excluded_reason text default null,
  p_requester_type text default null,
  p_note text default null,
  p_next_action_at timestamptz default null
) returns void language plpgsql security definer
set search_path = pg_catalog
as $fn$
declare
  actor uuid := auth.uid();
  prev text;
begin
  if actor is null or not public.has_role(actor, 'admin') then
    raise exception using errcode = '42501', message = 'alleen admin mag leadstatus wijzigen';
  end if;
  -- Serialiseer wijzigingen per aanvraag (lock op de bronrij).
  perform 1 from public.contact_submissions where id = p_submission_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'onbekende aanvraag';
  end if;
  select status into prev from public.contact_followups where submission_id = p_submission_id;
  insert into public.contact_followups as f
    (submission_id, status, qualified, excluded_reason, requester_type, next_action_at, note, updated_at, updated_by)
  values (p_submission_id, p_status, p_qualified, p_excluded_reason, p_requester_type, p_next_action_at, p_note, clock_timestamp(), actor)
  on conflict (submission_id) do update set
    status = excluded.status, qualified = excluded.qualified, excluded_reason = excluded.excluded_reason,
    requester_type = excluded.requester_type, next_action_at = excluded.next_action_at, note = excluded.note,
    updated_at = excluded.updated_at, updated_by = excluded.updated_by;
  insert into public.contact_status_log (submission_id, from_status, to_status, qualified, excluded_reason, changed_by, note)
  values (p_submission_id, coalesce(prev, 'new'), p_status, p_qualified, p_excluded_reason, actor, p_note);
end;
$fn$;

-- Operationele leadweergave voor admins (security_invoker: RLS van de basistabellen geldt).
create view public.contact_leads_admin with (security_invoker = true) as
  select s.id, s.created_at, s.name, s.email, s.reason, s.message,
         coalesce(f.status, 'new') as status, f.qualified, f.excluded_reason, f.requester_type,
         f.next_action_at, f.note, f.updated_at
    from public.contact_submissions s
    left join public.contact_followups f on f.submission_id = s.id;

-- ── Rechten: alles dicht voor iedere rol, daarna minimaal openzetten ─────────────────────────
do $grants$
declare r text;
begin
  foreach r in array array['anon', 'authenticated', 'service_role', 'hansos_agent', 'inbox_triage_writer'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on table public.contact_followups from %I', r);
      execute format('revoke all on table public.contact_status_log from %I', r);
      execute format('revoke all on table public.contact_leads_admin from %I', r);
      execute format('revoke all on function public.contact_set_status(uuid, text, boolean, text, text, text, timestamptz) from %I', r);
    end if;
  end loop;
end
$grants$;
revoke all on table public.contact_followups, public.contact_status_log, public.contact_leads_admin from public;
revoke all on function public.contact_set_status(uuid, text, boolean, text, text, text, timestamptz) from public;

grant select on table public.contact_followups, public.contact_status_log, public.contact_leads_admin to authenticated;
create policy "followups: admins read" on public.contact_followups for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "status log: admins read" on public.contact_status_log for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
grant execute on function public.contact_set_status(uuid, text, boolean, text, text, text, timestamptz) to authenticated;

commit;
