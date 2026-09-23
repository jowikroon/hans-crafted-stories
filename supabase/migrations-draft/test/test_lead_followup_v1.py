"""Geïsoleerde PostgreSQL-integratietest voor lead_followup v1 (bovenop contact_submissions v3).

Zelfde harnas als test_contact_v3.py: verse lokale cluster (127.0.0.1), productie-privilegemodel nagebootst,
EXACTE draftbestanden uitgevoerd als niet-superuser `postgres`. Nooit Supabase of productie. Synthetische data.

Gebruik:  python supabase/migrations-draft/test/test_lead_followup_v1.py [resultaat.json]
Omgeving: PG_BIN (standaard C:\\Program Files\\PostgreSQL\\17\\bin), PG_TEST_PORT (standaard 55441).
"""
from pathlib import Path
import subprocess, concurrent.futures, threading, json, tempfile, os, sys, shutil

DRAFT = Path(__file__).resolve().parent.parent
C_UP = DRAFT / 'contact_submissions.up.sql'
UP, VERIFY, DISABLE = (DRAFT / f'lead_followup.{n}.sql' for n in ('up', 'verify', 'disable'))
BIN = Path(os.environ.get('PG_BIN', r'C:\Program Files\PostgreSQL\17\bin'))
PORT = os.environ.get('PG_TEST_PORT', '55441')
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else None
FLAGS = getattr(subprocess, 'CREATE_NO_WINDOW', 0)
WORK = Path(tempfile.mkdtemp(prefix='lead-v1-pg-'))
DATA = WORK / 'data'
ADMIN = '00000000-0000-0000-0000-000000000001'
USER = '00000000-0000-0000-0000-000000000002'
FN = 'public.contact_set_status(uuid, text, boolean, text, text, text, timestamptz)'
results = []


def exe(name):
    return BIN / (name + ('.exe' if os.name == 'nt' else ''))


def cmd(args, **kw):
    with tempfile.TemporaryFile() as out, tempfile.TemporaryFile() as err:
        r = subprocess.run([str(x) for x in args], stdout=out, stderr=err, creationflags=FLAGS, timeout=120, **kw)
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


def as_role(role, body, sub=None):
    claims = f"set request.jwt.claims = '{{\"sub\":\"{sub}\",\"role\":\"{role}\"}}';" if sub else ''
    return f'set role {role}; {claims} {body}'


def file_sql(path, role='postgres'):
    return sql(f'set role {role};\n' + path.read_text(encoding='utf-8-sig'), ok=False)


def check(name, condition, detail=''):
    if not condition:
        raise AssertionError(f'{name} {detail}'.strip())
    results.append({'test': name, 'passed': True})


def denied(r):
    return r.returncode != 0 and '42501' in r.stderr


def set_status(sid, status, qualified='null', excluded='null', role='authenticated', sub=ADMIN, note='null'):
    return as_role(role, f"select public.contact_set_status('{sid}', '{status}', {qualified}, {excluded}, null, {note}, null);", sub)


def one(q):
    return sql(q).stdout.strip().splitlines()[-1]


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

    r = file_sql(UP)
    check('dependency guard: up.sql faalt zonder contact_submissions', r.returncode != 0 and 'vereist public.contact_submissions' in r.stderr, r.stderr)
    check('contact v3 draait', file_sql(C_UP).returncode == 0)
    r = file_sql(UP)
    check('lead_followup.up.sql draait als niet-superuser postgres', r.returncode == 0, r.stderr)
    r = file_sql(VERIFY)
    check('verify.sql slaagt na migratie', r.returncode == 0 and 'alle checks OK' in r.stderr, r.stderr)

    # Synthetische aanvragen via de enige contact-schrijfroute
    for i in range(3):
        sql(as_role('service_role', f"select public.contact_submit('Test {i}', 'lead{i}@example.invalid', 'freelance', 'bericht {i}');"))
    ids = sql("select id from public.contact_submissions order by email").stdout.split()
    ids = [x for x in ids if len(x) == 36]
    check('drie synthetische aanvragen aanwezig', len(ids) == 3, str(ids))
    a, b, c = ids

    # Geen directe schrijfroute voor enige API-rol
    for role in ('anon', 'authenticated', 'service_role', 'hansos_agent', 'inbox_triage_writer'):
        check(f'{role}: directe INSERT in contact_followups geweigerd',
              denied(sql(as_role(role, f"insert into public.contact_followups(submission_id,status) values ('{a}','won');", ADMIN), False)))
        check(f'{role}: directe INSERT in contact_status_log geweigerd',
              denied(sql(as_role(role, f"insert into public.contact_status_log(submission_id,to_status,changed_by) values ('{a}','won','{ADMIN}');", ADMIN), False)))
    check('anon: RPC geweigerd', denied(sql(set_status(a, 'reviewed', 'true', role='anon', sub=None), False)))
    check('service_role: RPC geweigerd (alleen ingelogde admin)', denied(sql(set_status(a, 'reviewed', 'true', role='service_role', sub=None), False)))
    r = sql(set_status(a, 'reviewed', 'true', sub=USER), False)
    check('niet-admin: RPC geweigerd door has_role-check', denied(r), r.stderr)
    check('anon: operationele leadweergave onleesbaar', denied(sql(as_role('anon', 'select * from public.contact_leads_admin;'), False)))

    # Admin-flow + log
    sql(set_status(a, 'reviewed', 'true', note="'relevante marketplace-opdracht'"))
    sql(set_status(a, 'call_planned', 'true'))
    sql(set_status(b, 'reviewed', 'false'))
    sql(set_status(c, 'reviewed', 'null', "'test'"))
    check('admin: status + kwalificatie opgeslagen',
          one(as_role('authenticated', f"select status||'/'||qualified::text from public.contact_followups where submission_id='{a}';", ADMIN)) == 'call_planned/true')
    check('log: twee overgangen met from→to-keten en actor = admin',
          one(as_role('authenticated', f"select string_agg(from_status||'>'||to_status||'@'||(changed_by='{ADMIN}')::text, ',' order by changed_at) from public.contact_status_log where submission_id='{a}';", ADMIN))
          == 'new>reviewed@true,reviewed>call_planned@true')
    check('weergave: onbeoordeelde aanvraag blijft status new, kwalificatie NULL (geen stille false)',
          one(as_role('authenticated', "select count(*) from public.contact_leads_admin where status='new' and qualified is null;", ADMIN)) == '0'
          and one(as_role('authenticated', "select count(*) from public.contact_leads_admin;", ADMIN)) == '3')
    check('niet-admin ziet 0 opvolgrijen en 0 logregels',
          one(as_role('authenticated', "select (select count(*) from public.contact_followups)+(select count(*) from public.contact_status_log);", USER)) == '0')
    check('niet-admin ziet 0 leads in de weergave (RLS via security_invoker)',
          one(as_role('authenticated', "select count(*) from public.contact_leads_admin;", USER)) == '0')

    # Validatie
    check('ongeldige status geweigerd (23514)', '23514' in sql(set_status(a, 'hot_lead'), False).stderr)
    check('ongeldige uitsluitreden geweigerd (23514)', '23514' in sql(set_status(a, 'reviewed', 'null', "'boring'"), False).stderr)
    check("status 'new' met kwalificatie geweigerd (23514)", '23514' in sql(set_status(b, 'new', 'true'), False).stderr)
    check('onbekende aanvraag geweigerd (P0002)', 'P0002' in sql(set_status('00000000-0000-0000-0000-00000000dead', 'reviewed'), False).stderr)
    check('mislukte wijziging laat geen logregel achter',
          one(as_role('authenticated', f"select count(*) from public.contact_status_log where submission_id='{a}';", ADMIN)) == '2')

    # Parallelle wijzigingen blijven één keten (lock op bronrij)
    def burst(n):
        barrier = threading.Barrier(n)
        def go(i):
            barrier.wait(timeout=60)
            return sql(set_status(b, ['proposal', 'lost', 'won', 'call_planned'][i % 4], 'true'), ok=False)
        with concurrent.futures.ThreadPoolExecutor(max_workers=n) as pool:
            return list(pool.map(go, range(n)))
    rs = burst(12)
    check('12 parallelle statuswijzigingen slagen allemaal', all(x.returncode == 0 for x in rs), ' | '.join(x.stderr for x in rs if x.returncode)[:400])
    chain = sql(as_role('authenticated', f"select from_status, to_status from public.contact_status_log where submission_id='{b}' order by changed_at;", ADMIN)).stdout.strip().splitlines()
    chain = [ln.split('|') for ln in chain if '|' in ln]
    check('logketen sluit: iedere from_status = vorige to_status',
          all(chain[i][0] == chain[i - 1][1] for i in range(1, len(chain))) and len(chain) == 13, str(chain))

    # AVG: admin verwijdert aanvraag → opvolging en log verdwijnen mee
    sql(as_role('authenticated', f"delete from public.contact_submissions where id='{c}';", ADMIN))
    check('admin-delete van aanvraag cascadeert naar opvolging en log',
          one("select (select count(*) from public.contact_followups where submission_id='" + c + "')+(select count(*) from public.contact_status_log where submission_id='" + c + "');") == '0')

    # verify-negatieve controles
    for grant, revoke, name in [
        ('grant insert on public.contact_status_log to anon', 'revoke insert on public.contact_status_log from anon', 'anon-insert op log'),
        (f'grant execute on function {FN} to anon', f'revoke execute on function {FN} from anon', 'anon-execute op RPC'),
        ('alter view public.contact_leads_admin set (security_invoker = false)', 'alter view public.contact_leads_admin set (security_invoker = true)', 'security_invoker uit'),
    ]:
        sql('set role postgres; ' + grant)
        r = file_sql(VERIFY)
        check(f'negatieve controle verify: {name} -> verify faalt', r.returncode != 0 and 'FAIL' in r.stderr, r.stderr)
        sql('set role postgres; ' + revoke)
    check('verify weer groen na herstel', 'alle checks OK' in file_sql(VERIFY).stderr)

    # Niet-destructieve terugval
    before = one("select count(*) from public.contact_status_log;")
    check('disable.sql draait', file_sql(DISABLE).returncode == 0)
    check('na disable: admin-RPC geweigerd', denied(sql(set_status(a, 'won', 'true'), False)))
    check('na disable: opvolgdata en log bewaard', one("select count(*) from public.contact_status_log;") == before)
    r = file_sql(VERIFY)
    check('verify na disable meldt UITGESCHAKELD', r.returncode == 0 and 'UITGESCHAKELD' in r.stderr, r.stderr)
    r = file_sql(UP)
    check('herhaald up.sql faalt bewust en wijzigt niets', r.returncode != 0 and one("select count(*) from public.contact_status_log;") == before, r.stderr)

    report = {
        'engine': f'local PostgreSQL {version}', 'supabaseTouched': False, 'productionTouched': False,
        'files': [str(p.relative_to(DRAFT.parent.parent)).replace('\\', '/') for p in (C_UP, UP, VERIFY, DISABLE)],
        'executedAs': 'postgres (NOSUPERUSER, BYPASSRLS) zoals in doelproject',
        'passed': len(results), 'tests': results,
        'limitations': ['Geen PostgREST/gateway: rolwissel via SET ROLE + JWT-claims', 'Dashboard-UI apart getest (vitest, gemockte client)'],
    }
    if OUT:
        OUT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
    print(json.dumps({'passed': len(results), 'engine': report['engine']}))
finally:
    if started:
        r = cmd([exe('pg_ctl'), '-D', DATA, '-m', 'fast', '-w', 'stop'])
        if r.returncode:
            print('WAARSCHUWING: testcluster niet gestopt: ' + r.stderr, file=sys.stderr)
    shutil.rmtree(WORK, ignore_errors=True)
