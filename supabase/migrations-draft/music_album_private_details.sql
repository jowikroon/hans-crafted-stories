-- REVIEW DRAFT, not applied. Contains no private seed or media URLs.
-- Apply after verifying public.is_portal_owner() in the target project.
begin;
create table public.music_album_private_details (
  album_key text primary key check (album_key in ('neon-the-signal-between', 'iets-moois')),
  details jsonb not null check (jsonb_typeof(details) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.music_album_private_details enable row level security;
alter table public.music_album_private_details force row level security;
revoke all on public.music_album_private_details from public, anon, authenticated;
grant select on public.music_album_private_details to authenticated;
grant all on public.music_album_private_details to service_role;
create policy "Only the portal owner reads album development details"
  on public.music_album_private_details for select to authenticated
  using ((select public.is_portal_owner()));
commit;
