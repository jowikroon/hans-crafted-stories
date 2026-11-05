-- Artist Radar: disposable standalone staging ONLY. Never apply to production.
-- A clean project has no historical site schema; this minimal source contract
-- lets the two additive Artist Radar migrations run without copying live data.
-- Apply this FIRST to a new, EMPTY, independent staging database.
-- Then apply the versioned migrations from supabase/migrations/ in order:
--   20261105140000_artist_radar_accounts.sql
--   20261105141000_artist_radar_verified_ticket_links.sql
-- No sample users, fake concert events, or real newsletter records are seeded.

CREATE TABLE IF NOT EXISTS public.artist_radar_concerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id text NOT NULL CHECK (length(artist_id) BETWEEN 1 AND 100),
  artist_name text NOT NULL CHECK (length(artist_name) BETWEEN 2 AND 100),
  venue text NOT NULL,
  city text NOT NULL,
  country text NOT NULL CHECK (country IN ('NL', 'BE')),
  event_date text NOT NULL,
  sort_key integer NOT NULL,
  status text NOT NULL CHECK (status IN ('rumored', 'announced', 'available', 'sold_out')),
  capacity text,
  urgent boolean NOT NULL DEFAULT false,
  source text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_radar_concerts ENABLE ROW LEVEL SECURITY;
-- Public browser users never query source records directly. The read-only
-- Edge Function uses service_role and returns an intentionally limited shape.
REVOKE ALL ON TABLE public.artist_radar_concerts FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.artist_radar_concerts TO service_role;

COMMENT ON TABLE public.artist_radar_concerts IS
  'STAGING-ONLY minimal source contract; NOT a copy of the live concert/import schema.';
