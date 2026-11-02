-- Draft only (#468): no masters, uploads, invitations or enabled previews.
-- Existing site Supabase Auth is reused; invited rights are separate from login.
-- A dedicated private, size-restricted bucket avoids reusing public music storage.
-- IMPORTANT: before deployment, audit ALL storage.objects SELECT policies for
-- broad grants that could expose this bucket despite buckets.public=false.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('neon-first-listen', 'neon-first-listen', false, 3000000, array['audio/mpeg']);

create table public.neon_studio_previews (
  slug text primary key check (slug = 'clarity-control-v2'),
  -- Opaque verified SoundCloud track identifier; never a secret audio link.
  source_reference text not null check (length(source_reference) between 5 and 160),
  source_sha256 text not null check (source_sha256 ~ '^[a-f0-9]{64}$'),
  source_verified_by uuid not null references auth.users(id),
  source_verified_at timestamptz not null,
  preview_sha256 text not null check (preview_sha256 ~ '^[a-f0-9]{64}$'),
  object_key text not null unique
    check (object_key ~ '^previews/clarity-control-v2/[a-f0-9]{64}[.]mp3$'),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 3000000),
  duration_seconds numeric not null check (duration_seconds > 0 and duration_seconds <= 30),
  status text not null default 'disabled' check (status in ('disabled', 'approved')),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint preview_approval_required check (
    status <> 'approved' or (approved_by is not null and approved_at is not null)
  )
);

create table public.neon_studio_preview_invites (
  preview_slug text not null references public.neon_studio_previews(slug),
  user_id uuid not null references auth.users(id),
  invited_by uuid not null references auth.users(id),
  invited_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  primary key (preview_slug, user_id),
  constraint valid_expiry check (expires_at is null or expires_at > invited_at)
);

alter table public.neon_studio_previews enable row level security;
alter table public.neon_studio_preview_invites enable row level security;
revoke all on public.neon_studio_previews from public, anon, authenticated;
revoke all on public.neon_studio_preview_invites from public, anon, authenticated;
grant select, insert, update, delete on public.neon_studio_previews to service_role;
grant select, insert, update, delete on public.neon_studio_preview_invites to service_role;
-- No grants or policies for anon/authenticated, and no seed rows.
-- Deployment only after source verification and storage-policy audit.
