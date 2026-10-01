"""Geïsoleerde PostgreSQL-integratietest voor contact_submissions v3.

Maakt een VERSE lokale cluster (alleen 127.0.0.1), bootst het productie-privilegemodel na dat read-only
uit het doelproject is opgehaald (rollen, bypassrls, default privileges, auth.uid/has_role-definities)
en voert de EXACTE draftbestanden uit (up/verify/disable) als niet-superuser-eigenaar `postgres`.
Maakt nooit verbinding met een bestaande database of met Supabase. Alleen synthetische data.

Gebruik:  python supabase/migrations-draft/test/test_contact_v3.py [resultaat.json]
Omgeving: PG_BIN (standaard C:\\Program Files\\PostgreSQL\\17\\bin), PG_TEST_PORT (standaard 55440).
"""
from pathlib import Path
import subprocess, concurrent.futures, threading, json, tempfile, os, sys, shutil

DRAFT = Path(__file__).resolve().parent.parent
UP, VERIFY, DISABLE = (DRAFT / f'contact_submissions.{n}.sql' for n in ('up', 'verify', 'disable'))
BIN = Path(os.environ.get('PG_BIN', r'C:\Program Files\PostgreSQL\17\bin'))
PORT = os.environ.get('PG_TEST_PORT', '55440')
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else None
FLAGS = getattr(subprocess, 'CREATE_NO_WINDOW', 0)
WORK = Path(tempfile.mkdtemp(prefix='contact-v3-pg-'))
DATA = WORK / 'data'
ADMIN = '00000000-0000-0000-0000-000000000001'
USER = '00000000-0000-0000-0000-000000000002'
results = []


def exe(name):
    return BIN / (name + ('.exe' if os.name == 'nt' else ''))


def cmd(args, **kw):
    # pg_ctl-kinderen erven pipe-handles op Windows; daarom bestanden i.p.v. PIPE.
    with tempfile.TemporaryFile() as out, tempfile.TemporaryFile() as err:
        r = subprocess.run([str(x) for x in args], stdout=out, stderr=err,
                           creationflags=FLAGS, timeout=120, **kw)
        out.seek(0); err.seek(0)
        return subprocess.CompletedProcess(args, r.returncode,
            out.read().decode('utf-8', errors='replace'), err.read().decode('utf-8', errors='replace'))


def sql(text, ok=True):
    fd, file = tempfile.mkstemp(suffix='.sql', dir=WORK)
    os.close(fd)
    try:
        Path(file).write_text(text, encoding='utf-8')
        r = cmd([exe('psql'), '-X', '-h', '127.0.0.1', '-p', PORT, '-U', 'contact_test', '-d', 'postgres',
                 '-v', 'ON_ERROR_STOP=1', '-At', '--set=VERBOSITY=verbose', '-f', file],
                env={**os.environ, 'PGCLIENTENCODING': 'UTF8'})
    finally:
        Path(file).unlink()
    if ok and r.returncode:
        raise RuntimeError(r.stderr)
    return r


def as_role(role, body, claims_sub=None):
    claims = f"set request.jwt.claims = '{{\"sub\":\"{claims_sub}\",\"role\":\"{role}\"}}';" if claims_sub else ''
    return f'set role {role}; {claims} {body}'


def file_sql(path, role='postgres'):
    return sql(f'set role {role};\n' + path.read_text(encoding='utf-8-sig'), ok=False)


def check(name, condition, detail=''):
    if not condition:
        raise AssertionError(f'{name} {detail}'.strip())
    results.append({'test': name, 'passed': True})


def denied(r):
    return r.returncode != 0 and '42501' in r.stderr


def rpc(email='test@example.invalid', reason='general', message='test', role='service_role'):
    return as_role(role, "select public.contact_submit('Test', '" + email + "', '" + reason + "', '" + message + "');")


def direct_insert(role):
    return as_role(role, "insert into public.contact_submissions(name,email,reason,message) "
                         "values ('Test','x@example.invalid','general','x');")


def count():
    return sql('select count(*) from public.contact_submissions').stdout.strip()


def reset():
    sql("truncate public.contact_submissions; update public.contact_rate_state set events='[]';")


def burst(n, same):
    barrier = threading.Barrier(n)

    def one(i):
        barrier.wait(timeout=60)
        return sql(rpc('same@example.invalid' if same else f'user{i}@example.invalid'), ok=False)

    with concurrent.futures.ThreadPoolExecutor(max_workers=n) as pool:
        return list(pool.map(one, range(n)))


# Productie-privilegemodel (read-only opgehaald uit het doelproject, 2026-09-23):
#  - postgres: geen superuser, wel BYPASSRLS; eigenaar van migraties; eigenaar database -> CREATE op public
#  - service_role: BYPASSRLS; anon/authenticated: geen van beide
#  - default privileges van postgres in public: ALL op tabellen/sequences voor anon/authenticated/service_role,
#    arwd voor hansos_agent, EXECUTE op functies voor anon/authenticated/service_role
#  - auth.uid() en public.has_role(uuid, app_role) exact zoals in productie
PROD_MODEL = r"""
create role postgres nosuperuser bypassrls login;
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create role hansos_agent nologin; create role inbox_triage_writer nologin;
alter database postgres owner to postgres;
grant usage on schema public to anon, authenticated, service_role, hansos_agent, inbox_triage_writer;
create schema auth;
grant usage on schema auth to anon, authenticated, service_role, postgres;
create function auth.uid() returns uuid language sql stable as $function$
  select
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$function$;
grant execute on function auth.uid() to anon, authenticated, service_role, postgres;
set role postgres;
create type public.app_role as enum ('admin', 'user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null, role public.app_role not null);
create function public.has_role(_user_id uuid, _role app_role) returns boolean
  language sql stable security definer set search_path to 'public' as $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$function$;
insert into public.user_roles(user_id, role) values ('""" + ADMIN + """', 'admin'), ('""" + USER + """', 'user');
alter default privileges for role postgres in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant select, insert, update, delete on tables to hansos_agent;
alter default privileges for role postgres in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant execute on functions to anon, authenticated, service_role;
"""

started = False
try:
    r = cmd([exe('initdb'), '-D', DATA, '-U', 'contact_test', '--auth=trust', '--encoding=UTF8', '--no-locale'])
    if r.returncode: raise RuntimeError(r.stderr)
    r = cmd([exe('pg_ctl'), '-D', DATA, '-l', WORK / 'server.log', '-o', f'-h 127.0.0.1 -p {PORT}', '-w', 'start'])
    if r.returncode: raise RuntimeError(r.stderr + r.stdout)
    started = True
    version = sql('show server_version').stdout.strip()
    sql(PROD_MODEL)

    # Negatieve controle op de omgeving: default privileges geven een nieuwe tabel/functie écht aan anon.
    sql('set role postgres; create table public.acl_probe(x int); create function public.fn_probe() returns int language sql as $$select 1$$;')
    probe = sql("select has_table_privilege('anon','public.acl_probe','INSERT')::text || has_function_privilege('anon','public.fn_probe()','EXECUTE')::text").stdout.strip()
    sql('set role postgres; drop table public.acl_probe; drop function public.fn_probe();')
    check('env: productie-default-privileges nagebootst (anon krijgt insert/execute op nieuwe objecten)', probe == 'truetrue', probe)

    r = file_sql(UP)
    check('migratie draait als niet-superuser postgres', r.returncode == 0, r.stderr)
    r = file_sql(VERIFY)
    check('verify.sql slaagt na migratie', r.returncode == 0 and 'alle checks OK' in r.stderr, r.stderr)
    check('verify.sql laat geen data achter (read only + rollback)', count() == '0')

    # Geen omzeilbare directe inserts
    for role in ('anon', 'authenticated', 'hansos_agent', 'inbox_triage_writer', 'service_role'):
        check(f'{role}: directe INSERT geweigerd (42501)', denied(sql(direct_insert(role), False)))
    for role in ('anon', 'authenticated', 'hansos_agent'):
        check(f'{role}: RPC contact_submit geweigerd (42501)', denied(sql(rpc(role=role), False)))
    check('anon: limiterstatus onleesbaar', denied(sql(as_role('anon', 'select * from public.contact_rate_state'), False)))
    check('authenticated: limiterstatus niet wijzigbaar',
          denied(sql(as_role('authenticated', "update public.contact_rate_state set events='[]'"), False)))
    check('anon: limiterfunctie niet direct uitvoerbaar',
          denied(sql(as_role('anon', 'select public.contact_submissions_rate_limit()'), False)))

    # Enige schrijfroute
    r = sql(rpc(), False)
    check('service_role: RPC schrijft een lead', r.returncode == 0 and count() == '1', r.stderr)
    check('anon: leads onleesbaar', denied(sql(as_role('anon', 'select * from public.contact_submissions'), False)))
    check('niet-admin ziet 0 leads',
          sql(as_role('authenticated', 'select count(*) from public.contact_submissions;', USER)).stdout.strip().endswith('0'))
    check('admin (has_role via JWT-claims) ziet leads',
          sql(as_role('authenticated', 'select count(*) from public.contact_submissions;', ADMIN)).stdout.strip().endswith('1'))
    check('niet-admin kan niet verwijderen',
          sql(as_role('authenticated', 'delete from public.contact_submissions;', USER)).stdout.strip().endswith('DELETE 0'))
    check('niet-admin kan niet updaten', denied(sql(as_role('authenticated', "update public.contact_submissions set name='x'", USER), False)))

    # Servervalidatie (CHECK) via de RPC
    check('ongeldige reden geweigerd (23514)', '23514' in sql(rpc(reason='bad-reason'), False).stderr)
    check('ongeldig e-mailadres geweigerd (23514)', '23514' in sql(rpc(email='geen-adres'), False).stderr)
    check('te lang bericht geweigerd (23514)', '23514' in sql(rpc(message='x' * 2001), False).stderr)
    check('leeg bericht geweigerd (23514)', '23514' in sql(rpc(message='   '), False).stderr)

    # Limiter per e-mail (genormaliseerd) + negatieve controle
    reset()
    for e in ('same@example.invalid', ' SAME@example.invalid ', 'Same@Example.invalid'):
        sql(rpc(e))
    r = sql(rpc('same@example.invalid'), False)
    check('vierde inzending zelfde (genormaliseerde) e-mail geweigerd (P4291)', r.returncode != 0 and 'P4291' in r.stderr, r.stderr)
    sql('alter table public.contact_submissions disable trigger contact_submissions_rate_limit')
    try:
        r = sql(rpc('same@example.invalid'), False)
        check('negatieve controle: zonder trigger komt de vierde erdoor', r.returncode == 0, r.stderr)
    finally:
        sql('alter table public.contact_submissions enable trigger contact_submissions_rate_limit')

    reset()
    rs = burst(20, True)
    check('20 parallel zelfde e-mail via RPC: precies 3 geaccepteerd', sum(x.returncode == 0 for x in rs) == 3)
    check('17 parallelle weigeringen zijn P4291', sum('P4291' in x.stderr for x in rs) == 17)
    check('na burst precies 3 leads opgeslagen', count() == '3')
    reset()
    rs = burst(40, False)
    check('40 parallel verschillende e-mails via RPC: precies 30 geaccepteerd', sum(x.returncode == 0 for x in rs) == 30)
    check('10 parallelle weigeringen zijn P4292', sum('P4292' in x.stderr for x in rs) == 10)
    sql("update public.contact_rate_state set events=(select jsonb_agg(jsonb_set(e,'{at}',"
        "to_jsonb((clock_timestamp()-interval '11 minutes')::text))) from jsonb_array_elements(events)e)")
    sql(rpc('fresh@example.invalid'))
    check('verlopen venster geeft capaciteit vrij',
          sql('select jsonb_array_length(events) from public.contact_rate_state').stdout.strip() == '1')
    reset()
    sql('begin; ' + rpc() + ' rollback;')
    check('rollback verbruikt geen quota',
          sql('select jsonb_array_length(events) from public.contact_rate_state').stdout.strip() == '0')

    # verify.sql moet een fout recht aantoonbaar detecteren (R2: geen vals succes)
    sql('grant insert (name) on public.contact_submissions to anon')
    r = file_sql(VERIFY)
    check('negatieve controle verify: anon-insertrecht -> verify faalt', r.returncode != 0 and 'FAIL' in r.stderr, r.stderr)
    sql('revoke insert (name) on public.contact_submissions from anon')
    sql('grant execute on function public.contact_submit(text,text,text,text) to authenticated')
    r = file_sql(VERIFY)
    check('negatieve controle verify: authenticated-execute -> verify faalt', r.returncode != 0 and 'FAIL' in r.stderr, r.stderr)
    sql('revoke execute on function public.contact_submit(text,text,text,text) from authenticated')
    sql('alter table public.contact_submissions disable trigger contact_submissions_rate_limit')
    r = file_sql(VERIFY)
    check('negatieve controle verify: trigger uit -> verify faalt', r.returncode != 0 and 'FAIL' in r.stderr, r.stderr)
    sql('alter table public.contact_submissions enable trigger contact_submissions_rate_limit')

    # Niet-destructieve terugval
    reset()
    sql(rpc())
    r = file_sql(DISABLE)
    check('disable.sql draait als postgres', r.returncode == 0, r.stderr)
    check('na disable: service_role-RPC geweigerd', denied(sql(rpc(), False)))
    check('na disable: ontvangen lead bewaard', count() == '1')
    r = file_sql(VERIFY)
    check('verify na disable: OK en meldt UITGESCHAKELD', r.returncode == 0 and 'UITGESCHAKELD' in r.stderr, r.stderr)
    r = file_sql(UP)
    check('herhaald up.sql faalt bewust (tabel bestaat) en wijzigt niets', r.returncode != 0 and count() == '1', r.stderr)

    report = {
        'engine': f'local PostgreSQL {version}', 'supabaseTouched': False, 'productionTouched': False,
        'files': [str(p.relative_to(DRAFT.parent.parent)).replace('\\', '/') for p in (UP, VERIFY, DISABLE)],
        'executedAs': 'postgres (NOSUPERUSER, BYPASSRLS) — zoals in doelproject',
        'passed': len(results), 'tests': results,
        'limitations': [
            'Geen PostgREST/Supabase-gateway: rolwissel via SET ROLE i.p.v. JWT/API-key',
            'Edge Function apart getest (Deno, geïnjecteerde fetch); geen echte Turnstile-call',
            'Globale limiet (30/10 min) blijft bewust uitputbaar; Turnstile is de primaire drempel',
        ],
    }
    text = json.dumps(report, indent=2, ensure_ascii=False)
    if OUT:
        OUT.write_text(text, encoding='utf-8')
    print(json.dumps({'passed': len(results), 'engine': report['engine']}))
finally:
    if started:
        r = cmd([exe('pg_ctl'), '-D', DATA, '-m', 'fast', '-w', 'stop'])
        if r.returncode:
            print('WAARSCHUWING: testcluster niet gestopt: ' + r.stderr, file=sys.stderr)
    if started or DATA.exists():
        shutil.rmtree(WORK, ignore_errors=True)
