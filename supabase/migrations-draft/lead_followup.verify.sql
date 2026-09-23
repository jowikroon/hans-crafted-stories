-- Read-only verificatie van lead_followup v1. Wijzigt niets; faalt HARD bij de eerste afwijking.
-- Vangt bewust geen exceptions af.
begin read only;
do $verify$
declare
  r text;
  fn regprocedure := 'public.contact_set_status(uuid, text, boolean, text, text, text, timestamptz)'::regprocedure;
begin
  if not (select relrowsecurity from pg_class where oid = 'public.contact_followups'::regclass) then
    raise exception 'FAIL: RLS uit op contact_followups';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.contact_status_log'::regclass) then
    raise exception 'FAIL: RLS uit op contact_status_log';
  end if;
  foreach r in array array['anon', 'authenticated', 'service_role', 'hansos_agent', 'inbox_triage_writer'] loop
    continue when not exists (select 1 from pg_roles where rolname = r);
    if has_any_column_privilege(r, 'public.contact_followups', 'INSERT') or has_any_column_privilege(r, 'public.contact_followups', 'UPDATE')
       or has_table_privilege(r, 'public.contact_followups', 'DELETE') then
      raise exception 'FAIL: % mag direct schrijven in contact_followups', r;
    end if;
    if has_any_column_privilege(r, 'public.contact_status_log', 'INSERT') or has_any_column_privilege(r, 'public.contact_status_log', 'UPDATE')
       or has_table_privilege(r, 'public.contact_status_log', 'DELETE') then
      raise exception 'FAIL: % mag direct schrijven in contact_status_log', r;
    end if;
  end loop;
  foreach r in array array['anon', 'service_role', 'hansos_agent', 'inbox_triage_writer'] loop
    continue when not exists (select 1 from pg_roles where rolname = r);
    if has_function_privilege(r, fn, 'EXECUTE') then
      raise exception 'FAIL: % mag contact_set_status uitvoeren', r;
    end if;
    if has_any_column_privilege(r, 'public.contact_leads_admin', 'SELECT') then
      raise exception 'FAIL: % mag de operationele leadweergave lezen', r;
    end if;
  end loop;
  if has_function_privilege('public', fn, 'EXECUTE') then
    raise exception 'FAIL: PUBLIC mag contact_set_status uitvoeren';
  end if;
  if not exists (select 1 from pg_proc where oid = fn and prosecdef and proconfig @> array['search_path=pg_catalog']) then
    raise exception 'FAIL: contact_set_status niet SECURITY DEFINER met search_path=pg_catalog';
  end if;
  if not exists (select 1 from pg_class where oid = 'public.contact_leads_admin'::regclass
                 and reloptions @> array['security_invoker=true']) then
    raise exception 'FAIL: contact_leads_admin zonder security_invoker';
  end if;
  if (select count(*) from pg_policies where schemaname = 'public'
      and tablename in ('contact_followups', 'contact_status_log') and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')) <> 0 then
    raise exception 'FAIL: onverwachte schrijf-policy op opvolgtabellen';
  end if;
  if (select count(*) from pg_constraint where contype = 'f' and confdeltype = 'c'
      and conrelid in ('public.contact_followups'::regclass, 'public.contact_status_log'::regclass)) <> 2 then
    raise exception 'FAIL: foreign keys niet beide ON DELETE CASCADE';
  end if;
  raise notice 'lead_followup v1: alle checks OK (statuswijziging: %)',
    case when has_function_privilege('authenticated', fn, 'EXECUTE') then 'actief' else 'UITGESCHAKELD (disable.sql)' end;
end
$verify$;
rollback;
