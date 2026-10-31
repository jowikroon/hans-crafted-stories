-- Artist Radar public data quality and safe double-opt-in (PR #465, 2026-10-31).
-- Sold-out shows must be represented accurately end-to-end.
ALTER TABLE public.artist_radar_concerts
  DROP CONSTRAINT IF EXISTS artist_radar_concerts_status_check;

ALTER TABLE public.artist_radar_concerts
  ADD CONSTRAINT artist_radar_concerts_status_check
  CHECK (status = ANY (ARRAY[
    'available'::text, 'announced'::text, 'rumored'::text, 'sold_out'::text
  ]));

-- Used by an atomic 1-hour reservation before any confirmation email.
-- Nullable for existing subscribers; no preference or email data is changed.
ALTER TABLE public.artist_radar_signups
  ADD COLUMN IF NOT EXISTS last_confirmation_attempt_at timestamptz;
