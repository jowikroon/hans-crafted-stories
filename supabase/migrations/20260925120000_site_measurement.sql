-- Site measurement: first-party events, daily Search Console / GA4 history,
-- a register of site changes with before/after impact, and the dashboard RPC.
--
-- Applied to production (pesfakewujjwkyybwaom) on 2026-09-25. Idempotent.
--
--   site_events           first-party, cookieless event log (no IP, no user agent, no storage)
--   contact_submissions   the contact form's table; it was never created in production,
--                         so every submission failed. Now created, plus a Telegram alert.
--   hvl_gsc_daily         Search Console per day x {site, page, query, device}
--   hvl_ga4_daily         GA4 per day x {site, page, channel, event, device}
--   site_changes          every improvement: what, where, which metric, and its measured result
--   site_dashboard()      one call for /dashboards/hvl (admin only)
--   site_metric_daily()   treated vs control daily series for the impact evaluator (service role only)

-- ---------------------------------------------------------------------------
-- 1. First-party events
-- ---------------------------------------------------------------------------
create table if not exists public.site_events (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  visit_id text not null check (char_length(visit_id) between 8 and 40),
  event text not null check (event in (
    'page_view', 'engagement', 'cta_click', 'rates_click', 'contact_form_start', 'contact_form_submit',
    'contact_form_error', 'book_call', 'email_click', 'linkedin_click', 'download', 'outbound_click',
    'lang_switch', 'blog_read_progress', 'blog_read_complete', 'blog_share', 'blog_toc_click',
    'not_found', 'js_error', 'web_vital'
  )),
  path text not null check (char_length(path) between 1 and 300),
  referrer_host text check (char_length(referrer_host) <= 120),
  utm_source text check (char_length(utm_source) <= 100),
  utm_medium text check (char_length(utm_medium) <= 100),
  utm_campaign text check (char_length(utm_campaign) <= 100),
  lang text check (char_length(lang) <= 5),
  device text check (device in ('mobile', 'tablet', 'desktop')),
  value double precision check (value is null or value between -1e9 and 1e9),
  props jsonb check (props is null or pg_column_size(props) <= 2048),
  internal boolean not null default false
);
create index if not exists site_events_ts_idx on public.site_events (ts);
create index if not exists site_events_event_ts_idx on public.site_events (event, ts);
create index if not exists site_events_visit_idx on public.site_events (visit_id);

alter table public.site_events enable row level security;
drop policy if exists "site_events insert" on public.site_events;
-- Anyone may append; nobody may backdate (ts is server time, within a small skew).
create policy "site_events insert" on public.site_events for insert to anon, authenticated
  with check (ts between now() - interval '2 minutes' and now() + interval '2 minutes');
drop policy if exists "site_events admin read" on public.site_events;
create policy "site_events admin read" on public.site_events for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 2. Contact form (lead capture)
-- ---------------------------------------------------------------------------
create table if not exists public.contact_submissions (
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  reason text not null,
  message text not null,
  created_at timestamptz not null default now()
);
alter table public.contact_submissions add column if not exists lang text;
alter table public.contact_submissions add column if not exists page text;
alter table public.contact_submissions add column if not exists visit_id text;
alter table public.contact_submissions add column if not exists notified_at timestamptz;
do $$ begin
  alter table public.contact_submissions add constraint contact_submissions_sizes check (
    char_length(name) between 1 and 100 and char_length(email) between 3 and 255
    and char_length(message) between 1 and 2000 and char_length(reason) <= 40
    and coalesce(char_length(lang), 0) <= 5 and coalesce(char_length(page), 0) <= 300
    and coalesce(char_length(visit_id), 0) <= 40);
exception when duplicate_object then null; end $$;

alter table public.contact_submissions enable row level security;
drop policy if exists "Anyone can submit contact form" on public.contact_submissions;
create policy "Anyone can submit contact form" on public.contact_submissions for insert to anon, authenticated
  with check (notified_at is null);
drop policy if exists "Admins can view contact submissions" on public.contact_submissions;
create policy "Admins can view contact submissions" on public.contact_submissions for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
drop policy if exists "Admins can delete contact submissions" on public.contact_submissions;
create policy "Admins can delete contact submissions" on public.contact_submissions for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- New lead -> site-metrics sends one Telegram message (same bot and chat as the dashboard digest).
-- The function only notifies a row younger than 10 minutes with notified_at null, so the
-- public key in this call cannot be used to send arbitrary messages.
create or replace function public.notify_contact_submission() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := 'https://pesfakewujjwkyybwaom.supabase.co/functions/v1/site-metrics',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer sb_publishable_ZeJHG3Gd8zPHPaKMKg2QAA_yI6v1gRq","apikey":"sb_publishable_ZeJHG3Gd8zPHPaKMKg2QAA_yI6v1gRq"}'::jsonb,
    body := jsonb_build_object('action', 'lead', 'id', new.id),
    timeout_milliseconds := 15000
  );
  return new;
exception when others then
  return new; -- a failed alert must never lose the lead itself
end $$;
drop trigger if exists contact_submissions_notify on public.contact_submissions;
create trigger contact_submissions_notify after insert on public.contact_submissions
  for each row execute function public.notify_contact_submission();

-- ---------------------------------------------------------------------------
-- 3. Daily Search Console and GA4 history (written by the site-metrics function)
-- ---------------------------------------------------------------------------
create table if not exists public.hvl_gsc_daily (
  d date not null,
  dim text not null check (dim in ('site', 'page', 'query', 'device')),
  key text not null,
  clicks integer not null default 0,
  impressions integer not null default 0,
  ctr double precision,
  position double precision,
  primary key (d, dim, key)
);
create table if not exists public.hvl_ga4_daily (
  d date not null,
  dim text not null check (dim in ('site', 'page', 'channel', 'event', 'device')),
  key text not null,
  sessions integer not null default 0,
  users integer not null default 0,
  pageviews integer not null default 0,
  engaged_sessions integer not null default 0,
  engagement_sec double precision not null default 0,
  events integer not null default 0,
  key_events integer not null default 0,
  primary key (d, dim, key)
);
alter table public.hvl_gsc_daily enable row level security;
alter table public.hvl_ga4_daily enable row level security;
drop policy if exists "hvl_gsc_daily admin read" on public.hvl_gsc_daily;
create policy "hvl_gsc_daily admin read" on public.hvl_gsc_daily for select to authenticated using (public.has_role(auth.uid(), 'admin'));
drop policy if exists "hvl_ga4_daily admin read" on public.hvl_ga4_daily;
create policy "hvl_ga4_daily admin read" on public.hvl_ga4_daily for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 4. Site changes and their measured impact
-- ---------------------------------------------------------------------------
create table if not exists public.site_changes (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 200),
  kind text not null default 'seo' check (kind in ('seo', 'content', 'ux', 'tech', 'offsite', 'tracking')),
  linear_issue text check (linear_issue ~ '^[A-Z]+-[0-9]+$'),
  pr_number integer,
  deployed_at timestamptz,
  paths text[] not null default '{}',
  primary_metric text check (primary_metric in (
    'search_clicks', 'search_impressions', 'search_ctr', 'search_position',
    'visits', 'engaged_rate', 'leads', 'lead_rate'
  )),
  expected text not null default 'up' check (expected in ('up', 'down')),
  hypothesis text,
  baseline_days integer not null default 28 check (baseline_days between 7 and 180),
  measure_days integer not null default 28 check (measure_days between 7 and 180),
  status text not null default 'planned' check (status in ('planned', 'measuring', 'concluded', 'logged', 'abandoned')),
  result jsonb,
  result_at timestamptz,
  source text not null default 'manual' check (source in ('manual', 'pr', 'seed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists site_changes_pr_idx on public.site_changes (pr_number) where pr_number is not null;
create index if not exists site_changes_deployed_idx on public.site_changes (deployed_at);

alter table public.site_changes enable row level security;
drop policy if exists "site_changes admin all" on public.site_changes;
create policy "site_changes admin all" on public.site_changes for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.site_changes_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists site_changes_touch on public.site_changes;
create trigger site_changes_touch before update on public.site_changes for each row execute function public.site_changes_touch();

-- ---------------------------------------------------------------------------
-- 5. Helpers
-- ---------------------------------------------------------------------------
-- Client-supplied numbers arrive as JSON text; a malformed value must read as null, not break a query.
create or replace function public.site_num(t text) returns double precision language sql immutable as $$
  select case when t ~ '^-?[0-9]+(\.[0-9]+)?$' then t::double precision end
$$;

create or replace function public.site_url_path(u text) returns text language sql immutable as $$
  select coalesce(nullif(regexp_replace(regexp_replace(coalesce(u, ''), '^https?://[^/]+', ''), '[?#].*$', ''), ''), '/')
$$;

-- '/services/*' is a prefix; anything else matches exactly, ignoring a trailing slash.
-- An empty pattern list means site-wide.
create or replace function public.site_path_matches(p text, pats text[]) returns boolean language sql immutable as $$
  select coalesce(array_length(pats, 1), 0) = 0 or exists (
    select 1 from unnest(pats) x
    where case when right(x, 1) = '*'
      then starts_with(coalesce(p, ''), left(x, -1))
      else coalesce(nullif(rtrim(p, '/'), ''), '/') = coalesce(nullif(rtrim(x, '/'), ''), '/') end)
$$;

create or replace function public.site_channel(ref text, src text, med text) returns text language sql immutable as $$
  select case
    when lower(coalesce(med, '')) in ('cpc', 'ppc', 'paid', 'paidsearch', 'paid_social') then 'Betaald'
    when lower(coalesce(med, '')) = 'email' or lower(coalesce(src, '')) in ('newsletter', 'email')
      or coalesce(ref, '') ~* '^(mail|outlook|webmail)\.' then 'E-mail'
    when coalesce(ref, '') ~* '(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com|you\.com|phind\.com|poe\.com|deepseek\.com|meta\.ai|mistral\.ai)'
      or lower(coalesce(src, '')) ~ '^(chatgpt|openai|perplexity|claude|gemini|copilot|deepseek)' then 'AI-assistenten'
    when coalesce(ref, '') ~* '(^|\.)(google|bing|duckduckgo|yahoo|ecosia|startpage|qwant|yandex|baidu|brave)\.' then 'Organisch zoeken'
    when coalesce(ref, '') ~* '(linkedin\.com|lnkd\.in|facebook\.com|instagram\.com|^t\.co$|twitter\.com|^x\.com$|youtube\.com|reddit\.com|threads\.net|bsky\.app)'
      or lower(coalesce(med, '')) = 'social' then 'Social'
    when coalesce(ref, '') <> '' then 'Verwijzing'
    when coalesce(src, '') <> '' then 'Campagne'
    else 'Direct'
  end
$$;

-- One row per visit (in-memory id per tab: SPA navigation keeps it, a reload starts a new one).
-- Engaged = 10s+ engaged time, 2+ pages, or any lead action (the GA4 definition).
create or replace function public.site_visits(p_from date, p_to date)
returns table (
  visit_id text, d date, landing text, channel text, device text, lang text, paths text[],
  pageviews integer, engaged_ms double precision, max_scroll double precision,
  engaged boolean, intent boolean, lead boolean, form_start boolean, form_submit boolean,
  book boolean, email boolean, linkedin boolean
) language sql stable set search_path = public as $$
  with ev as (
    select e.* from site_events e
    where not e.internal
      and e.ts >= (p_from::timestamp at time zone 'Europe/Amsterdam')
      and e.ts < ((p_to + 1)::timestamp at time zone 'Europe/Amsterdam')
  ), first_pv as (
    select distinct on (visit_id) visit_id, ts, path, referrer_host, utm_source, utm_medium, device, lang
    from ev where event = 'page_view' order by visit_id, ts
  ), agg as (
    select visit_id,
      count(*) filter (where event = 'page_view')::int pv,
      array_agg(distinct path) filter (where event = 'page_view') paths,
      coalesce(sum(least(greatest(value, 0), 1800000)) filter (where event = 'engagement'), 0) eng,
      coalesce(max(site_num(props->>'scroll')) filter (where event = 'engagement'), 0) scroll,
      bool_or(event in ('cta_click', 'rates_click', 'contact_form_start', 'book_call', 'email_click', 'linkedin_click', 'contact_form_submit')) intent,
      bool_or(event in ('contact_form_submit', 'book_call', 'email_click', 'linkedin_click')) lead,
      bool_or(event = 'contact_form_start') fstart,
      bool_or(event = 'contact_form_submit') fsubmit,
      bool_or(event = 'book_call') book,
      bool_or(event = 'email_click') email,
      bool_or(event = 'linkedin_click') li
    from ev group by visit_id
  )
  select f.visit_id, (f.ts at time zone 'Europe/Amsterdam')::date, f.path,
    site_channel(f.referrer_host, f.utm_source, f.utm_medium), coalesce(f.device, 'desktop'), f.lang, a.paths,
    a.pv, a.eng, a.scroll,
    (a.eng >= 10000 or a.pv >= 2 or a.lead), a.intent, a.lead, a.fstart, a.fsubmit, a.book, a.email, a.li
  from first_pv f join agg a using (visit_id)
$$;

-- Daily treated-vs-control series for one change (paths empty = the whole site, no control).
-- Search metrics use Search Console page rows; visit metrics use visits that viewed a matched path.
create or replace function public.site_metric_daily(p_paths text[], p_from date, p_to date)
returns table (d date, scope text, clicks bigint, impressions bigint, pos_impr double precision,
               visits bigint, engaged bigint, leads bigint)
language sql stable security definer set search_path = public as $$
  with g as (
    select g.d, case when site_path_matches(site_url_path(g.key), p_paths) then 'treated' else 'control' end scope,
      sum(g.clicks)::bigint c, sum(g.impressions)::bigint i, sum(coalesce(g.position, 0) * g.impressions) pi
    from hvl_gsc_daily g where g.dim = 'page' and g.d between p_from and p_to group by 1, 2
  ), v as (
    select v.d, case when exists (select 1 from unnest(coalesce(v.paths, '{}')) p where site_path_matches(p, p_paths))
      then 'treated' else 'control' end scope,
      count(*)::bigint visits, count(*) filter (where v.engaged)::bigint engaged, count(*) filter (where v.lead)::bigint leads
    from site_visits(p_from, p_to) v group by 1, 2
  )
  select coalesce(g.d, v.d), coalesce(g.scope, v.scope), coalesce(g.c, 0), coalesce(g.i, 0), coalesce(g.pi, 0),
    coalesce(v.visits, 0), coalesce(v.engaged, 0), coalesce(v.leads, 0)
  from g full join v on g.d = v.d and g.scope = v.scope
$$;

-- ---------------------------------------------------------------------------
-- 6. Dashboard
-- ---------------------------------------------------------------------------
create or replace function public.site_kpis(p_from date, p_to date) returns jsonb
language sql stable set search_path = public as $$
  with v as (select * from site_visits(p_from, p_to)),
  s as (
    select sum(clicks) c, sum(impressions) i,
      case when sum(impressions) > 0 then sum(coalesce(position, 0) * impressions) / sum(impressions) end pos,
      max(d) last_day
    from hvl_gsc_daily where dim = 'site' and d between p_from and p_to
  ),
  ga as (select sum(sessions) sessions, sum(engaged_sessions) engaged, max(d) last_day
         from hvl_ga4_daily where dim = 'site' and d between p_from and p_to),
  cs as (select count(*) n from contact_submissions
         where created_at >= (p_from::timestamp at time zone 'Europe/Amsterdam')
           and created_at < ((p_to + 1)::timestamp at time zone 'Europe/Amsterdam'))
  select jsonb_build_object(
    'visits', (select count(*) from v),
    'pageviews', (select coalesce(sum(pageviews), 0) from v),
    'engaged', (select count(*) filter (where engaged) from v),
    'intent', (select count(*) filter (where intent) from v),
    'leads', (select count(*) filter (where lead) from v),
    'submissions', (select n from cs),
    'avg_engaged_s', (select round((avg(engaged_ms) / 1000)::numeric, 1) from v),
    'search_clicks', (select c from s), 'search_impressions', (select i from s),
    'search_ctr', (select case when i > 0 then round((100.0 * c / i)::numeric, 2) end from s),
    'search_position', (select round(pos::numeric, 1) from s),
    'search_last_day', (select last_day from s),
    'ga4_sessions', (select sessions from ga), 'ga4_engaged', (select engaged from ga),
    'ga4_last_day', (select last_day from ga)
  )
$$;

create or replace function public.site_dashboard(p_from date, p_to date, p_prev_from date default null, p_prev_to date default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  claims text := current_setting('request.jwt.claims', true);
  out jsonb;
begin
  -- Admins through the app, the service role, or a direct database session.
  if not (claims is null or claims = '' or auth.role() = 'service_role' or public.has_role(auth.uid(), 'admin')) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  with v as (select * from site_visits(p_from, p_to)),
  ev as (
    select e.* from site_events e where not e.internal
      and e.ts >= (p_from::timestamp at time zone 'Europe/Amsterdam')
      and e.ts < ((p_to + 1)::timestamp at time zone 'Europe/Amsterdam')
  ),
  days as (select generate_series(p_from, p_to, interval '1 day')::date d),
  series as (
    select jsonb_agg(jsonb_build_object(
      'd', days.d,
      'visits', coalesce((select count(*) from v where v.d = days.d), 0),
      'leads', coalesce((select count(*) filter (where lead) from v where v.d = days.d), 0),
      'clicks', (select clicks from hvl_gsc_daily g where g.dim = 'site' and g.d = days.d),
      'impressions', (select impressions from hvl_gsc_daily g where g.dim = 'site' and g.d = days.d),
      'position', (select round(position::numeric, 1) from hvl_gsc_daily g where g.dim = 'site' and g.d = days.d),
      'ga4_sessions', (select sessions from hvl_ga4_daily a where a.dim = 'site' and a.d = days.d)
    ) order by days.d) j from days
  ),
  pages as (
    select jsonb_agg(x order by (x->>'views')::int desc nulls last, x->>'path') j from (
      select jsonb_build_object(
        'path', coalesce(pv.path, gp.path),
        'views', coalesce(pv.views, 0), 'visits', coalesce(pv.visits, 0),
        'avg_engaged_s', pe.avg_s, 'avg_scroll', pe.avg_scroll,
        'intent_rate', case when pv.visits > 0 then round((100.0 * coalesce(pint.intent, 0) / pv.visits)::numeric, 1) end,
        'clicks', gp.clicks, 'impressions', gp.impressions, 'position', gp.position
      ) x
      from (select path, count(*) views, count(distinct visit_id) visits from ev where event = 'page_view' group by path) pv
      full join (
        select site_url_path(key) path, sum(clicks) clicks, sum(impressions) impressions,
          round((sum(coalesce(position, 0) * impressions) / nullif(sum(impressions), 0))::numeric, 1) position
        from hvl_gsc_daily where dim = 'page' and d between p_from and p_to group by 1
      ) gp using (path)
      left join (
        select path, round((avg(least(greatest(value, 0), 1800000)) / 1000)::numeric, 1) avg_s, round(avg(site_num(props->>'scroll'))::numeric) avg_scroll
        from ev where event = 'engagement' group by path
      ) pe on pe.path = coalesce(pv.path, gp.path)
      left join (
        select p path, count(*) filter (where v.intent) intent from v, unnest(coalesce(v.paths, '{}')) p group by p
      ) pint on pint.path = coalesce(pv.path, gp.path)
      order by coalesce(pv.views, 0) desc, coalesce(gp.impressions, 0) desc limit 40
    ) t
  ),
  channels as (
    select jsonb_agg(jsonb_build_object('channel', channel, 'visits', n, 'engaged', e, 'leads', l) order by n desc) j
    from (select channel, count(*) n, count(*) filter (where engaged) e, count(*) filter (where lead) l from v group by channel) c
  ),
  landing as (
    select jsonb_agg(jsonb_build_object('path', landing, 'visits', n, 'engaged', e, 'leads', l, 'avg_engaged_s', s) order by n desc) j
    from (select landing, count(*) n, count(*) filter (where engaged) e, count(*) filter (where lead) l,
            round((avg(engaged_ms) / 1000)::numeric, 1) s
          from v group by landing order by count(*) desc limit 20) c
  ),
  devices as (
    select jsonb_agg(jsonb_build_object('device', device, 'visits', n, 'engaged', e, 'leads', l) order by n desc) j
    from (select device, count(*) n, count(*) filter (where engaged) e, count(*) filter (where lead) l from v group by device) c
  ),
  queries as (
    select jsonb_agg(jsonb_build_object('query', key, 'clicks', c, 'impressions', i, 'position', pos, 'prev_position', ppos) order by i desc) j
    from (
      select q.key, sum(q.clicks) c, sum(q.impressions) i,
        round((sum(coalesce(q.position, 0) * q.impressions) / nullif(sum(q.impressions), 0))::numeric, 1) pos,
        (select round((sum(coalesce(p.position, 0) * p.impressions) / nullif(sum(p.impressions), 0))::numeric, 1)
           from hvl_gsc_daily p where p.dim = 'query' and p.key = q.key and p.d between p_prev_from and p_prev_to) ppos
      from hvl_gsc_daily q where q.dim = 'query' and q.d between p_from and p_to
      group by q.key order by sum(q.impressions) desc limit 50
    ) t
  ),
  vitals as (
    select jsonb_agg(jsonb_build_object('metric', m, 'device', device, 'p75', p75, 'n', n, 'good_pct', good) order by m, device) j
    from (
      select props->>'name' m, coalesce(device, 'desktop') device,
        round(percentile_cont(0.75) within group (order by value)::numeric, 3) p75, count(*) n,
        round((100.0 * count(*) filter (where props->>'rating' = 'good') / count(*))::numeric) good
      from ev where event = 'web_vital' and value is not null group by 1, 2
    ) t
  ),
  vitals_pages as (
    select jsonb_agg(jsonb_build_object('path', path, 'metric', m, 'p75', p75, 'n', n) order by p75 desc) j
    from (
      select path, props->>'name' m, round(percentile_cont(0.75) within group (order by value)::numeric, 3) p75, count(*) n
      from ev where event = 'web_vital' and props->>'name' in ('LCP', 'INP') group by 1, 2 having count(*) >= 3
      order by 3 desc limit 10
    ) t
  ),
  errs as (
    select jsonb_build_object(
      'not_found', (select jsonb_agg(jsonb_build_object('path', path, 'n', n) order by n desc)
                    from (select path, count(*) n from ev where event = 'not_found' group by path order by 2 desc limit 15) a),
      'js', (select jsonb_agg(jsonb_build_object('message', m, 'path', p, 'n', n) order by n desc)
             from (select props->>'message' m, min(path) p, count(*) n from ev where event = 'js_error' group by 1 order by 3 desc limit 15) b)
    ) j
  ),
  events as (
    select jsonb_object_agg(event, n) j from (select event, count(*) n from ev group by event) t
  ),
  changes as (
    select jsonb_agg(to_jsonb(c) - 'created_at' - 'updated_at' order by c.deployed_at desc nulls first, c.created_at desc) j
    from site_changes c where c.status <> 'abandoned'
  ),
  subs as (
    select jsonb_agg(jsonb_build_object('created_at', created_at, 'name', name, 'email', email, 'reason', reason,
                                        'lang', lang, 'page', page, 'message', left(message, 280)) order by created_at desc) j
    from (select * from contact_submissions order by created_at desc limit 10) s
  )
  select jsonb_build_object(
    'period', jsonb_build_object('from', p_from, 'to', p_to, 'prev_from', p_prev_from, 'prev_to', p_prev_to),
    'kpi', jsonb_build_object('cur', site_kpis(p_from, p_to),
                              'prev', case when p_prev_from is not null then site_kpis(p_prev_from, p_prev_to) end),
    'funnel', (select jsonb_build_object(
        'visits', count(*), 'engaged', count(*) filter (where engaged), 'intent', count(*) filter (where intent),
        'form_start', count(*) filter (where form_start), 'lead', count(*) filter (where lead),
        'form_submit', count(*) filter (where form_submit), 'book', count(*) filter (where book),
        'email', count(*) filter (where email), 'linkedin', count(*) filter (where linkedin)) from v),
    'series', (select j from series), 'pages', (select j from pages), 'channels', (select j from channels),
    'landing', (select j from landing), 'devices', (select j from devices), 'queries', (select j from queries),
    'vitals', (select j from vitals), 'vitals_pages', (select j from vitals_pages), 'errors', (select j from errs),
    'events', (select j from events), 'changes', (select j from changes), 'submissions', (select j from subs),
    'coverage', (select data from hvl_analytics_cache where key = 'gsc-coverage'),
    'harvest', (select jsonb_build_object('at', fetched_at, 'data', data) from hvl_analytics_cache where key = 'site-metrics:last'),
    'quality', jsonb_build_object(
      'last_event', (select max(ts) from site_events),
      'internal_events', (select count(*) from site_events e where e.internal
                           and e.ts >= (p_from::timestamp at time zone 'Europe/Amsterdam')
                           and e.ts < ((p_to + 1)::timestamp at time zone 'Europe/Amsterdam')),
      'tracking_since', (select min(ts) from site_events),
      'gsc_since', (select min(d) from hvl_gsc_daily), 'ga4_since', (select min(d) from hvl_ga4_daily)
    )
  ) into out;
  return out;
end $$;

-- Helpers stay internal: only the dashboard RPC (admin-gated) and the service role use them.
revoke execute on function public.site_visits(date, date) from public, anon, authenticated;
revoke execute on function public.site_kpis(date, date) from public, anon, authenticated;
revoke execute on function public.site_metric_daily(text[], date, date) from public, anon, authenticated;
grant execute on function public.site_metric_daily(text[], date, date) to service_role;
revoke execute on function public.site_dashboard(date, date, date, date) from public, anon;
grant execute on function public.site_dashboard(date, date, date, date) to authenticated, service_role;
revoke execute on function public.notify_contact_submission() from public, anon, authenticated;
