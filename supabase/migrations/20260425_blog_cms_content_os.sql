-- BlogCMS Content Operating System
-- Adds Wiki terms, article-term links, YouTube source imports and agent review logs.
-- This migration is intentionally additive and does not modify existing blog_posts or hvl_voice_templates columns.

create table if not exists public.blog_cms_wiki_terms (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  slug text not null unique,
  category text not null default 'ecommerce' check (category in ('ecommerce', 'ai', 'marketplace', 'automation', 'internal')),
  short_definition text not null default '',
  long_definition text,
  synonyms text[] not null default '{}',
  related_terms text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'review', 'confirmed', 'archived')),
  confirmed_by uuid references auth.users(id) on delete set null,
  confirmed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_cms_article_wiki_terms (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.blog_posts(id) on delete cascade,
  wiki_term_id uuid not null references public.blog_cms_wiki_terms(id) on delete cascade,
  source text not null default 'manual' check (source in ('manual', 'agent_suggested')),
  confirmed boolean not null default false,
  confirmed_by uuid references auth.users(id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(article_id, wiki_term_id)
);

create table if not exists public.blog_cms_youtube_sources (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  video_id text unique,
  title text,
  short_name text,
  channel_name text,
  thumbnail_url text,
  duration_seconds integer,
  transcript text,
  transcript_language text,
  context_summary text,
  key_topics text[] not null default '{}',
  suggested_wiki_terms text[] not null default '{}',
  article_opportunities text[] not null default '{}',
  status text not null default 'imported' check (status in ('imported', 'transcribing', 'transcribed', 'analyzed', 'used', 'failed')),
  linked_article_id uuid references public.blog_posts(id) on delete set null,
  voice_template_id uuid references public.hvl_voice_templates(id) on delete set null,
  error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_cms_agent_reviews (
  id uuid primary key default gen_random_uuid(),
  agent_key text not null,
  agent_label text not null,
  article_id uuid references public.blog_posts(id) on delete cascade,
  youtube_source_id uuid references public.blog_cms_youtube_sources(id) on delete cascade,
  task text not null,
  prompt text,
  input_snapshot jsonb,
  output jsonb,
  score numeric,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'needs_review', 'failed')),
  error_message text,
  model text,
  duration_ms integer,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_blog_cms_wiki_terms_status on public.blog_cms_wiki_terms(status);
create index if not exists idx_blog_cms_wiki_terms_category on public.blog_cms_wiki_terms(category);
create index if not exists idx_blog_cms_article_wiki_terms_article on public.blog_cms_article_wiki_terms(article_id);
create index if not exists idx_blog_cms_youtube_sources_status on public.blog_cms_youtube_sources(status);
create index if not exists idx_blog_cms_youtube_sources_article on public.blog_cms_youtube_sources(linked_article_id);
create index if not exists idx_blog_cms_agent_reviews_article on public.blog_cms_agent_reviews(article_id);
create index if not exists idx_blog_cms_agent_reviews_status on public.blog_cms_agent_reviews(status);
create index if not exists idx_blog_cms_agent_reviews_agent on public.blog_cms_agent_reviews(agent_key);

alter table public.blog_cms_wiki_terms enable row level security;
alter table public.blog_cms_article_wiki_terms enable row level security;
alter table public.blog_cms_youtube_sources enable row level security;
alter table public.blog_cms_agent_reviews enable row level security;

-- Public read only for confirmed wiki terms. Article pages may later use this for term pills.
drop policy if exists "Confirmed wiki terms are publicly readable" on public.blog_cms_wiki_terms;
create policy "Confirmed wiki terms are publicly readable"
  on public.blog_cms_wiki_terms
  for select
  using (status = 'confirmed');

-- Admin access. Requires existing has_role(user_id, role) RPC used elsewhere in the app.
drop policy if exists "Admins manage wiki terms" on public.blog_cms_wiki_terms;
create policy "Admins manage wiki terms"
  on public.blog_cms_wiki_terms
  for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins manage article wiki links" on public.blog_cms_article_wiki_terms;
create policy "Admins manage article wiki links"
  on public.blog_cms_article_wiki_terms
  for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins manage youtube sources" on public.blog_cms_youtube_sources;
create policy "Admins manage youtube sources"
  on public.blog_cms_youtube_sources
  for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins manage agent reviews" on public.blog_cms_agent_reviews;
create policy "Admins manage agent reviews"
  on public.blog_cms_agent_reviews
  for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Updated-at trigger helper. Safe if an equivalent function already exists.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_blog_cms_wiki_terms_updated_at on public.blog_cms_wiki_terms;
create trigger set_blog_cms_wiki_terms_updated_at
  before update on public.blog_cms_wiki_terms
  for each row execute function public.set_updated_at();

drop trigger if exists set_blog_cms_youtube_sources_updated_at on public.blog_cms_youtube_sources;
create trigger set_blog_cms_youtube_sources_updated_at
  before update on public.blog_cms_youtube_sources
  for each row execute function public.set_updated_at();

drop trigger if exists set_blog_cms_agent_reviews_updated_at on public.blog_cms_agent_reviews;
create trigger set_blog_cms_agent_reviews_updated_at
  before update on public.blog_cms_agent_reviews
  for each row execute function public.set_updated_at();
