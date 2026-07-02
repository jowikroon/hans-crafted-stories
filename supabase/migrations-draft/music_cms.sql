-- Music CMS — songs voor het songwriter Command Center op /music-cms.
-- DRAFT migration: bewust NIET in supabase/migrations/ geplaatst; handmatig
-- draaien in de Supabase SQL editor (of verplaatsen naar migrations/ zodra
-- akkoord). Canonical-table regel: nieuwe music_* tabel, geen hvl_* hergebruik.

create table if not exists public.music_songs (
  id            uuid primary key default gen_random_uuid(),
  title         text not null default '',
  template_id   text,                       -- voice template id (max_martin … master_prompt); templates leven in de app
  theme         text not null default '',   -- thema / opdracht van het nummer
  source_notes  text not null default '',   -- persoonlijke context: vault-fragmenten, technical builds, chats
  lyrics        text not null default '',
  deep_analysis text not null default '',   -- bewaarde <deep_analysis> van de gegenereerde versie
  status        text not null default 'draft' check (status in ('draft', 'published')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.music_songs is 'Songwriter-werkbladen van de Music CMS (/music-cms): lyrics, thema, voice template en status.';

create index if not exists music_songs_updated_at_idx on public.music_songs (updated_at desc);
create index if not exists music_songs_status_idx on public.music_songs (status);

-- updated_at bijhouden
create or replace function public.music_songs_set_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists music_songs_set_updated_at on public.music_songs;
create trigger music_songs_set_updated_at
  before update on public.music_songs
  for each row execute function public.music_songs_set_updated_at();

-- RLS: zelfde model als de Blog CMS — ingelogde (admin) gebruiker beheert,
-- anon mag uitsluitend gepubliceerde songs lezen (voor een eventuele publieke
-- weergave op /music later).
alter table public.music_songs enable row level security;

drop policy if exists "music_songs_authenticated_all" on public.music_songs;
create policy "music_songs_authenticated_all"
  on public.music_songs
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "music_songs_public_read_published" on public.music_songs;
create policy "music_songs_public_read_published"
  on public.music_songs
  for select
  to anon
  using (status = 'published');
