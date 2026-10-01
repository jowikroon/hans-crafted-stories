-- Extend the private archive without widening its existing admin-only policies.
alter table public.music_artwork_assets
  add column media_type text not null default 'image' check (media_type in ('image','video')),
  add column duration_seconds double precision check (duration_seconds >= 0),
  add column playback_path text,
  add column original_parts text[] not null default '{}';

-- Originals exceeding the project's 50 MiB object limit are stored losslessly
-- in ordered parts; playback is a separate, smaller MP4. No plan change needed.
update storage.buckets set allowed_mime_types = array[
  'image/jpeg','image/png','image/webp','image/svg+xml','image/gif',
  'video/mp4','video/webm','video/quicktime','video/x-matroska',
  'application/octet-stream','application/json'
] where id = 'music-artwork' and public = false;
