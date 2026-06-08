-- On-page editor (Lovable/Claude-Design-style overlay)
-- Phase 1: runtime visual override layer (style + text), keyed by stable element id (lovable-tagger data-lov-id)
-- Phase 2: structural / code-level change requests captured from the overlay -> push/dispatch pipeline
-- NOTE: already applied to project pesfakewujjwkyybwaom; committed here for traceability.

create table if not exists public.page_overrides (
  id uuid primary key default gen_random_uuid(),
  element_key text not null unique,
  page_path   text,
  selector    text,
  label       text,
  text_override text,
  style       jsonb not null default '{}'::jsonb,
  updated_by  uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.edit_change_requests (
  id uuid primary key default gen_random_uuid(),
  element_key text,
  page_path   text,
  selector    text,
  current_html text,
  instruction text not null,
  status text not null default 'open',
  created_by uuid,
  created_at timestamptz not null default now()
);

alter table public.page_overrides enable row level security;
alter table public.edit_change_requests enable row level security;

drop policy if exists "Public read page_overrides" on public.page_overrides;
create policy "Public read page_overrides" on public.page_overrides
  for select to anon, authenticated using (true);

drop policy if exists "Admin write page_overrides" on public.page_overrides;
create policy "Admin write page_overrides" on public.page_overrides
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "Admin all edit_change_requests" on public.edit_change_requests;
create policy "Admin all edit_change_requests" on public.edit_change_requests
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'admin'::app_role));

create index if not exists page_overrides_key_idx on public.page_overrides (element_key);
create index if not exists edit_change_requests_status_idx on public.edit_change_requests (status, created_at desc);
