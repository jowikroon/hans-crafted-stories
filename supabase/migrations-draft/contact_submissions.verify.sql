-- Read-only verificatie van contact_submissions v3. Wijzigt niets (read only-transactie).
-- Faalt HARD (exception, exitcode != 0 met psql -v ON_ERROR_STOP=1) bij de eerste afwijking.
-- Vangt bewust geen exceptions af: een ontbrekend object of verkeerd recht mag nooit als "OK" eindigen.
begin read only;
do $verify$
declare
  r text;
  fn_submit  regprocedure := 'public.contact_submit(text, text, text, text)'::regprocedure;
  fn_limiter regprocedure := 'public.contact_submissions_rate_limit()'::regprocedure;
begin
  if not (select relrowsecurity from pg_class where oid = 'public.contact_submissions'::regclass) then
    raise exception 'FAIL: RLS uit op contact_submissions';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.contact_rate_state'::regclass) then
    raise exception 'FAIL: RLS uit op contact_rate_state';
  end if;
  foreach r in array array['anon', 'authenticated', 'hansos_agent', 'inbox_triage_writer'] loop
    continue when not exists (select 1 from pg_roles where rolname = r);
    if has_any_column_privilege(r, 'public.contact_submissions', 'INSERT')
       or has_any_column_privilege(r, 'public.contact_submissions', 'UPDATE') then
      raise exception 'FAIL: % mag inserten/updaten op contact_submissions', r;
    end if;
    if has_any_column_privilege(r, 'public.contact_rate_state', 'SELECT')
       or has_any_column_privilege(r, 'public.contact_rate_state', 'UPDATE') then
      raise exception 'FAIL: % heeft toegang tot contact_rate_state', r;
    end if;
    if has_function_privilege(r, fn_submit, 'EXECUTE') then
      raise exception 'FAIL: % mag contact_submit uitvoeren', r;
    end if;
    if has_function_privilege(r, fn_limiter, 'EXECUTE') then
      raise exception 'FAIL: % mag de limiterfunctie uitvoeren', r;
    end if;
  end loop;
  if has_function_privilege('public', fn_submit, 'EXECUTE') then
    raise exception 'FAIL: PUBLIC mag contact_submit uitvoeren';
  end if;
  if has_any_column_privilege('anon', 'public.contact_submissions', 'SELECT')
     or has_table_privilege('anon', 'public.contact_submissions', 'DELETE') then
    raise exception 'FAIL: anon kan leads lezen of verwijderen';
  end if;
  if has_any_column_privilege('service_role', 'public.contact_submissions', 'INSERT')
     or has_any_column_privilege('service_role', 'public.contact_rate_state', 'UPDATE') then
    raise exception 'FAIL: service_role heeft directe tabelrechten (alleen RPC hoort)';
  end if;
  if not exists (select 1 from pg_proc where oid = fn_submit and prosecdef
                 and proconfig @> array['search_path=pg_catalog']) then
    raise exception 'FAIL: contact_submit niet SECURITY DEFINER met search_path=pg_catalog';
  end if;
  if not exists (select 1 from pg_proc where oid = fn_limiter and prosecdef
                 and proconfig @> array['search_path=pg_catalog']) then
    raise exception 'FAIL: limiter niet SECURITY DEFINER met search_path=pg_catalog';
  end if;
  if not exists (select 1 from pg_trigger where tgrelid = 'public.contact_submissions'::regclass
                 and tgname = 'contact_submissions_rate_limit' and tgenabled = 'O') then
    raise exception 'FAIL: limitertrigger ontbreekt of staat uit';
  end if;
  if (select count(*) from public.contact_rate_state) <> 1 then
    raise exception 'FAIL: limiterstatusrij ontbreekt';
  end if;
  if (select count(*) from pg_policies where schemaname = 'public' and tablename = 'contact_submissions'
      and cmd in ('INSERT', 'UPDATE', 'ALL')) <> 0 then
    raise exception 'FAIL: onverwachte schrijf-policy op contact_submissions';
  end if;
  raise notice 'contact_submissions v3: alle checks OK (submit-status: %)',
    case when has_function_privilege('service_role', fn_submit, 'EXECUTE') then 'actief' else 'UITGESCHAKELD (disable.sql)' end;
end
$verify$;
rollback;
