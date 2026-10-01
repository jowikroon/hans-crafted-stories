create table public.music_artwork_assets (
  id text primary key check (id ~ '^[a-f0-9]{64}$'),
  title text not null,
  family_key text not null,
  album text not null,
  song text,
  categories text[] not null default '{}',
  channels text[] not null default '{}',
  collections text[] not null default '{}',
  origins jsonb not null default '[]'::jsonb check (jsonb_typeof(origins) = 'array'),
  format text not null,
  role text not null,
  width integer check (width > 0),
  height integer check (height > 0),
  bytes bigint not null check (bytes > 0),
  storage_path text not null unique,
  thumbnail_path text,
  is_current boolean not null default false,
  source_modified timestamptz not null,
  imported_at timestamptz not null default now()
);
comment on table public.music_artwork_assets is 'Private JOWIKROON artwork archive. SHA-256 keyed originals; origins preserve every source collection and version. Channel labels are intended use, not upload compliance.';
alter table public.music_artwork_assets enable row level security;
revoke all on public.music_artwork_assets from anon, authenticated;
grant select on public.music_artwork_assets to authenticated;
grant all on public.music_artwork_assets to service_role;
create policy "Admins read music artwork"
on public.music_artwork_assets for select to authenticated
using ((select public.is_admin()));
create index music_artwork_assets_family_idx on public.music_artwork_assets (family_key);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('music-artwork','music-artwork',false,52428800,
 array['image/jpeg','image/png','image/webp','image/svg+xml','image/gif']);
create policy "Admins read private music artwork"
on storage.objects for select to authenticated
using (bucket_id = 'music-artwork' and (select public.is_admin()));

