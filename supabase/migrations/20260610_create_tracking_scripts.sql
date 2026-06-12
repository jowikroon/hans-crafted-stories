-- tracking_scripts: referenced by apps/personal/src/lib/api/trackingScripts.ts since the
-- tracking-audit refactor, but the table was never created -> 404 + console error on every page.
-- Applied to production (pesfakewujjwkyybwaom) on 2026-06-10 via MCP apply_migration.
create table if not exists public.tracking_scripts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  script_type text not null default 'custom',
  position text not null default 'head',
  code text not null default '',
  is_active boolean not null default false,
  is_verified boolean not null default false,
  last_verified_at timestamptz,
  verification_method text not null default 'manual',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tracking_scripts enable row level security;

create policy "Anon read active tracking scripts" on public.tracking_scripts
  for select to anon using (is_active = true);

create policy "Hans reads all tracking_scripts" on public.tracking_scripts
  for select to authenticated
  using (auth.uid() = '0200ed4f-c866-4ec3-b235-541843133c1a'::uuid);

create policy "Hans writes all tracking_scripts" on public.tracking_scripts
  for all to authenticated
  using (auth.uid() = '0200ed4f-c866-4ec3-b235-541843133c1a'::uuid)
  with check (auth.uid() = '0200ed4f-c866-4ec3-b235-541843133c1a'::uuid);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists tracking_scripts_set_updated_at on public.tracking_scripts;
create trigger tracking_scripts_set_updated_at
  before update on public.tracking_scripts
  for each row execute function public.set_updated_at();
