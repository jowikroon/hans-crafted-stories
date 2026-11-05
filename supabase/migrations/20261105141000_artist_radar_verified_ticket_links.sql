-- Artist Radar ticket deep links are evidence, never an order or a payment.
-- All columns are nullable so existing public concerts and subscribers remain unchanged.
ALTER TABLE public.artist_radar_concerts
  ADD COLUMN IF NOT EXISTS source_event_id text,
  ADD COLUMN IF NOT EXISTS source_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS official_ticket_url text,
  ADD COLUMN IF NOT EXISTS ticket_seller text,
  ADD COLUMN IF NOT EXISTS ticket_verified_source text,
  ADD COLUMN IF NOT EXISTS ticket_verified_at timestamptz;

-- Importers must supply an HTTPS source citation and a verification timestamp
-- together with a seller URL. The public Edge Function applies the stricter
-- seller/venue domain allowlist, status and seven-day freshness gate.
ALTER TABLE public.artist_radar_concerts
  DROP CONSTRAINT IF EXISTS artist_radar_ticket_link_metadata_check;
ALTER TABLE public.artist_radar_concerts
  ADD CONSTRAINT artist_radar_ticket_link_metadata_check CHECK (
    official_ticket_url IS NULL OR (
      length(official_ticket_url) <= 2048
      AND official_ticket_url ~* '^https://[^/?#[:space:]]+'
      AND length(trim(coalesce(ticket_seller, ''))) > 0
      AND length(trim(coalesce(ticket_verified_source, ''))) > 0
      AND ticket_verified_source ~* '^https://[^/?#[:space:]]+'
      AND ticket_verified_at IS NOT NULL
      AND source_checked_at IS NOT NULL
    )
  );

COMMENT ON COLUMN public.artist_radar_concerts.official_ticket_url IS
  'Verified external seller/venue event link, not an in-app checkout or purchased ticket.';
COMMENT ON COLUMN public.artist_radar_concerts.ticket_verified_source IS
  'HTTPS source URL checked by the ingest/review process before a seller link is activated.';
