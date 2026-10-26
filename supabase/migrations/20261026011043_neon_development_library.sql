-- Private catalogue only. HTML and media remain at their original PC locations.
-- Additive: preserve every existing master, selection and artwork record.
create table public.music_development_pages (
  id text primary key,
  title text not null,
  category text not null,
  status text not null,
  project text not null,
  local_path text not null,
  source_modified timestamptz not null,
  source_sha256 text check (source_sha256 is null or source_sha256 ~ '^[a-f0-9]{64}$'),
  source_origin text not null,
  hosted_url text check (hosted_url is null or hosted_url like 'https://%')
);
alter table public.music_development_pages enable row level security;
revoke all on public.music_development_pages from public, anon, authenticated;
grant select on public.music_development_pages to authenticated;
grant all on public.music_development_pages to service_role;
create policy "Admin reads private NEON development catalogue"
  on public.music_development_pages for select to authenticated
  using ((select public.is_admin()));
