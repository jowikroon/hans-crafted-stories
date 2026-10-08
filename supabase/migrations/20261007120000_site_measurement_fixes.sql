-- Site measurement fixes after the review of PR #371.
--
-- Applied to production (pesfakewujjwkyybwaom) on 2026-10-08. Idempotent, and it removes no object,
-- so it can be re-run safely.
--
--   hvl_analytics_cache     the key/value cache the dashboard and the site-metrics, analytics-ga4-gsc
--                           functions read and write. It was created by hand in production and never
--                           committed, so a fresh project failed with a missing relation. Same schema
--                           and RLS as the production object; reading is now limited to admins (it was
--                           any signed-in account, and the cache holds CCP Channable and dashboard data).
--                           Every reader in the app is an admin screen (/write) or a service-role function.
--   harvested_at            on hvl_gsc_daily and hvl_ga4_daily: when site-metrics last wrote a row.
--                           The harvest sets it explicitly (an upsert does not apply column defaults)
--                           and, after a fully fetched chunk, removes rows that chunk no longer returned.
--   site_dashboard()        per-page engagement: the tracker sends a fragment each time the tab is
--                           hidden and again when the page is left, so the fragments are first totalled
--                           per visit and path and only then averaged. Averaging raw fragments counted
--                           tab switchers several times with short samples and understated active time.
--                           Everything else in the function is unchanged; site_visits, site_kpis and the
--                           landing table already work per visit.
--   contact form            the insert trigger sets created_at to the insert time (a backdated row slipped
--                           past the hourly limits and into the lead retry window) and keeps visit_id empty:
--                           the privacy statement says visit statistics are not linked to a message, and a
--                           bundle cached from before this change still sends it. Existing values cleared.
--   site_metrics_try_lock() a lease row in hvl_analytics_cache so two harvests never run at once (their
--                           stale-row deletes would remove each other's fresh rows). Service role only.

-- ---------------------------------------------------------------------------
-- 1. Analytics cache
-- ---------------------------------------------------------------------------
create table if not exists public.hvl_analytics_cache (
  key text primary key,
  data jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table public.hvl_analytics_cache enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'hvl_analytics_cache' and policyname = 'auth read analytics cache'
  ) then
    create policy "auth read analytics cache" on public.hvl_analytics_cache for select to authenticated
      using (public.has_role(auth.uid(), 'admin'));
  end if;
end $$;
-- Production's policy predates this file and read using (true).
alter policy "auth read analytics cache" on public.hvl_analytics_cache using (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 2. Harvest timestamp on the daily Search Console and GA4 rows
-- ---------------------------------------------------------------------------
alter table public.hvl_gsc_daily add column if not exists harvested_at timestamptz not null default now();
alter table public.hvl_ga4_daily add column if not exists harvested_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- 3. Dashboard: page engagement per page view, not per fragment
-- ---------------------------------------------------------------------------
-- Same signature, security and grants as before (create or replace keeps the grants).
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
        -- One page view sends a fragment per visible interval: total them per visit and path
        -- (scroll is a running maximum), then average those page-view totals per path.
        select path, round((avg(ms) / 1000)::numeric, 1) avg_s, round(avg(scroll)::numeric) avg_scroll
        from (
          select visit_id, path, sum(least(greatest(value, 0), 1800000)) ms, max(site_num(props->>'scroll')) scroll
          from ev where event = 'engagement' group by visit_id, path
        ) f group by path
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

-- ---------------------------------------------------------------------------
-- 4. Contact form: the server sets created_at, visit_id stays empty
-- ---------------------------------------------------------------------------
-- Same trigger (contact_submissions_limit, BEFORE INSERT, 20260925130000) and the same limits;
-- the two assignments run first so the limits count the real insert time.
create or replace function public.contact_submissions_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.created_at := now();
  new.visit_id := null;
  if (select count(*) from contact_submissions where lower(email) = lower(new.email) and created_at > now() - interval '1 hour') >= 3
     or (select count(*) from contact_submissions where created_at > now() - interval '1 hour') >= 30 then
    return null;
  end if;
  return new;
end $$;
revoke execute on function public.contact_submissions_limit() from public, anon, authenticated;
update public.contact_submissions set visit_id = null where visit_id is not null;

-- ---------------------------------------------------------------------------
-- 5. One site-metrics harvest at a time
-- ---------------------------------------------------------------------------
-- True when the caller got the lease: no lease row yet, or the current one is older than p_ttl
-- (a worker that died without releasing it). A concurrent caller waits on the key's unique index,
-- then sees the fresh lease and gets false. site-metrics deletes the row when its harvest ends.
create or replace function public.site_metrics_try_lock(p_ttl interval default interval '10 minutes')
returns boolean language plpgsql set search_path = public as $$
declare
  got boolean;
begin
  insert into hvl_analytics_cache (key, data, fetched_at) values ('site-metrics:lock', '{}'::jsonb, now())
  on conflict (key) do update set data = excluded.data, fetched_at = excluded.fetched_at
    where hvl_analytics_cache.fetched_at < now() - p_ttl
  returning true into got;
  return coalesce(got, false);
end $$;
revoke execute on function public.site_metrics_try_lock(interval) from public, anon, authenticated;
grant execute on function public.site_metrics_try_lock(interval) to service_role;
