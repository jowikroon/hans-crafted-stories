-- Music Releases CMS — de discografie-timeline op /music (ReleaseTimeline).
-- Beheerd vanuit de Music CMS (/music-cms → mode "Releases"). Canonical-table
-- regel: nieuwe music_* tabel, geen hvl_* hergebruik. Zelfde RLS-model als
-- music_songs / de Blog CMS: ingelogde (admin) beheert alles, anon leest enkel
-- zichtbare, niet-gearchiveerde releases (voor de publieke /music timeline).
--
-- Additief en omkeerbaar (drop table volstaat). Draai in de Supabase SQL editor
-- of verplaats naar supabase/migrations/ zodra akkoord.

create table if not exists public.music_releases (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null default '',              -- koppelt aan /music/:slug detailpagina (leeg = geen link)
  title         text not null default '',
  type          text not null default 'Single' check (type in ('Single', 'EP', 'Album')),
  release_date  date not null default current_date,    -- bepaalt positie op de timeline
  genre         text not null default '',
  cover         text,                                  -- optionele cover-URL
  dur           text,                                  -- lengte, bv "4:46"
  tracks        integer,                               -- aantal tracks (EP/Album)
  video         boolean not null default false,        -- heeft een music video
  note          text,                                  -- korte omschrijving onder de titel
  visible       boolean not null default true,         -- de hidden/visible toggle
  sort_order    integer not null default 0,            -- tie-break bij gelijke datum
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  archived_at   timestamptz                            -- soft-delete (nooit hard deleten)
);

comment on table public.music_releases is 'Discografie-releases voor de publieke /music timeline (ReleaseTimeline), beheerd via de Music CMS mode "Releases". visible = hidden/visible toggle; archived_at = soft-delete.';

create index if not exists music_releases_date_idx    on public.music_releases (release_date);
create index if not exists music_releases_visible_idx on public.music_releases (visible) where archived_at is null;

-- updated_at bijhouden
create or replace function public.music_releases_set_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists music_releases_set_updated_at on public.music_releases;
create trigger music_releases_set_updated_at
  before update on public.music_releases
  for each row execute function public.music_releases_set_updated_at();

-- RLS
alter table public.music_releases enable row level security;

drop policy if exists "music_releases_authenticated_all" on public.music_releases;
create policy "music_releases_authenticated_all"
  on public.music_releases
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "music_releases_public_read_visible" on public.music_releases;
create policy "music_releases_public_read_visible"
  on public.music_releases
  for select
  to anon
  using (visible = true and archived_at is null);

-- Seed: de 6 BASE_RELEASES uit ReleaseTimeline.tsx. De 4 concept/SoundCloud
-- tracks komen op visible=false (nog niet officieel uit); de 2 officiele
-- Spotify-singles blijven zichtbaar. Idempotent op slug.
-- Seed alleen wanneer de tabel nog leeg is (idempotent, geen unique-constraint nodig).
insert into public.music_releases (slug, title, type, release_date, genre, dur, video, note, visible, sort_order)
select v.slug, v.title, v.type, v.release_date, v.genre, v.dur, v.video, v.note, v.visible, v.sort_order
from (values
  ('new-level',           'New Level (Main Menu)',                        'Single', date '2025-09-01', 'Electronic', null::text,   false, 'Where it started, a menu-screen loop that refused to stay background music.'::text, false, 0),
  ('beat-between',        'Beat Between Our Years × Layer Cake Universe',  'Single', date '2025-10-01', 'Mashup',     null,         false, null,                                                                          false, 0),
  ('hanging-on',          'Hanging On (Remastered)',                      'Single', date '2025-11-01', 'Electronic', null,         false, null,                                                                          false, 0),
  ('teacher-leave',       'Teacher Leave (Remastered x2)',                'Single', date '2025-12-01', 'Electronic', null,         false, null,                                                                          false, 0),
  ('beat-drop',           'Beat Drop',                                    'Single', date '2026-01-01', 'Electronic', null,         true,  'The first official single, out on Spotify as Jowikroon.',                     true,  0),
  ('neon-house-of-glass', 'Neon House of Glass',                          'Single', date '2026-07-03', 'Electronic', '4:46',       false, 'Second official single, out on Spotify.',                                     true,  0)
) as v(slug, title, type, release_date, genre, dur, video, note, visible, sort_order)
where not exists (select 1 from public.music_releases);
