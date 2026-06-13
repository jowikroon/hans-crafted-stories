-- Phase E — Analytics live (GA4 + Search Console + Haiku insights)
--
-- Adds three additive tables. No changes to blog_posts data. RLS enabled.
-- Connector jobs (separate n8n workflows) populate these tables; the
-- AnalyticsMode UI reads from them and falls back to blog_posts aggregates
-- if they're empty.

create table if not exists public.analytics_daily (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('ga4', 'gsc')),
  date date not null,
  post_id uuid references public.blog_posts(id) on delete set null,
  sessions integer,
  pageviews integer,
  impressions integer,
  clicks integer,
  ctr numeric(6,4),
  avg_position numeric(6,2),
  inserted_at timestamptz not null default now(),
  synced_at timestamptz not null default now()
);

create unique index if not exists analytics_daily_unique
  on public.analytics_daily (source, date, coalesce(post_id::text, '__site__'));

create index if not exists analytics_daily_post_idx
  on public.analytics_daily (post_id);

create index if not exists analytics_daily_date_idx
  on public.analytics_daily (date desc);

comment on table public.analytics_daily is
  'Per-day per-(site|post) metrics from GA4 (sessions/pageviews) and Search Console (impressions/clicks/ctr/avg_position). NULL post_id = site-wide row.';

create table if not exists public.analytics_search_terms (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.blog_posts(id) on delete set null,
  query text not null,
  period_start date not null,
  period_end date not null,
  impressions integer not null default 0,
  clicks integer not null default 0,
  ctr numeric(6,4) not null default 0,
  avg_position numeric(6,2) not null default 0,
  synced_at timestamptz not null default now()
);

create index if not exists analytics_search_terms_period_idx
  on public.analytics_search_terms (period_end desc);
create index if not exists analytics_search_terms_query_idx
  on public.analytics_search_terms (query);

comment on table public.analytics_search_terms is
  'Per-period (typically 7/30/90 day) top queries from Search Console with impressions, clicks, CTR, avg position.';

create table if not exists public.analytics_insights (
  id uuid primary key default gen_random_uuid(),
  period text not null check (period in ('7d', '30d', '90d')),
  kind text not null check (kind in ('up', 'warn', 'idea')),
  headline text not null,
  body text,
  model text not null default 'claude-haiku-4-5',
  created_at timestamptz not null default now(),
  superseded_at timestamptz
);

create index if not exists analytics_insights_current_idx
  on public.analytics_insights (period, created_at desc)
  where superseded_at is null;

comment on table public.analytics_insights is
  '3-card AI-generated summary of the current period. New rows supersede old ones via superseded_at.';

alter table public.analytics_daily enable row level security;
alter table public.analytics_search_terms enable row level security;
alter table public.analytics_insights enable row level security;

-- Read-only access for the CMS app (uses anon key).
drop policy if exists "analytics_daily public read" on public.analytics_daily;
create policy "analytics_daily public read"
  on public.analytics_daily for select using (true);

drop policy if exists "analytics_search_terms public read" on public.analytics_search_terms;
create policy "analytics_search_terms public read"
  on public.analytics_search_terms for select using (true);

drop policy if exists "analytics_insights public read" on public.analytics_insights;
create policy "analytics_insights public read"
  on public.analytics_insights for select using (true);

-- Writes restricted to service role (n8n syncs use the service-role key).
drop policy if exists "analytics_daily admin write" on public.analytics_daily;
create policy "analytics_daily admin write"
  on public.analytics_daily for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "analytics_search_terms admin write" on public.analytics_search_terms;
create policy "analytics_search_terms admin write"
  on public.analytics_search_terms for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "analytics_insights admin write" on public.analytics_insights;
create policy "analytics_insights admin write"
  on public.analytics_insights for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
