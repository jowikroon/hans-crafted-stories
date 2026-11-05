-- Artist Radar v2: private user account state, not the existing newsletter DOI.
-- Additive only. Apply in staging first; do not run against production as part
-- of a frontend deploy. No auth.users, signup, or concert record is migrated.

CREATE TABLE IF NOT EXISTS public.artist_radar_follows (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id text NOT NULL CHECK (length(artist_id) BETWEEN 1 AND 100 AND artist_id ~ '^[a-z0-9:_-]+$'),
  artist_name text NOT NULL CHECK (length(artist_name) BETWEEN 2 AND 100),
  genre text NOT NULL DEFAULT '' CHECK (length(genre) <= 80),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, artist_id)
);

CREATE INDEX IF NOT EXISTS artist_radar_follows_recent_idx
  ON public.artist_radar_follows(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.artist_radar_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  countries text[] NOT NULL DEFAULT ARRAY['NL', 'BE']::text[]
    CHECK (cardinality(countries) BETWEEN 1 AND 2 AND countries <@ ARRAY['NL','BE']::text[]),
  categories text[] NOT NULL DEFAULT ARRAY['rumored','announced','available','sold_out']::text[]
    CHECK (cardinality(categories) BETWEEN 1 AND 4 AND categories <@ ARRAY['rumored','announced','available','sold_out']::text[]),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.artist_radar_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('followed','unfollowed','preferences_updated','ticket_link_opened')),
  artist_id text CHECK (artist_id IS NULL OR length(artist_id) BETWEEN 1 AND 100),
  artist_name text CHECK (artist_name IS NULL OR length(artist_name) BETWEEN 2 AND 100),
  event_key text CHECK (event_key IS NULL OR length(event_key) <= 160),
  provider text CHECK (provider IS NULL OR length(provider) <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT artist_radar_activity_ticket_click_check CHECK (
    kind <> 'ticket_link_opened' OR (event_key IS NOT NULL AND provider IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS artist_radar_activity_recent_idx
  ON public.artist_radar_activity(user_id, created_at DESC);

-- Hard limits belong in the database: the public browser can bypass client
-- limits. Lock only the current auth.users row so simultaneous inserts for a
-- single account cannot evade the cap. The trigger owns no remote effects.
CREATE OR REPLACE FUNCTION public.artist_radar_account_write_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  -- BEFORE triggers execute before the row's RLS WITH CHECK. Never use the
  -- untrusted NEW.user_id to lock a different person's auth.users row.
  IF NEW.user_id IS DISTINCT FROM (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Artist Radar unauthorized account owner';
  END IF;
  PERFORM 1 FROM auth.users WHERE id = NEW.user_id FOR UPDATE;
  IF TG_TABLE_NAME = 'artist_radar_follows' THEN
    IF (SELECT count(*) FROM public.artist_radar_follows WHERE user_id = NEW.user_id) >= 100 THEN
      RAISE EXCEPTION 'Artist Radar follow limit reached';
    END IF;
  ELSIF TG_TABLE_NAME = 'artist_radar_activity' THEN
    IF (SELECT count(*) FROM public.artist_radar_activity
        WHERE user_id = NEW.user_id AND created_at >= now() - interval '24 hours') >= 500 THEN
      RAISE EXCEPTION 'Artist Radar activity quota reached';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.artist_radar_account_write_guard() FROM PUBLIC;
DROP TRIGGER IF EXISTS artist_radar_follows_guard ON public.artist_radar_follows;
CREATE TRIGGER artist_radar_follows_guard BEFORE INSERT ON public.artist_radar_follows
  FOR EACH ROW EXECUTE FUNCTION public.artist_radar_account_write_guard();
DROP TRIGGER IF EXISTS artist_radar_activity_guard ON public.artist_radar_activity;
CREATE TRIGGER artist_radar_activity_guard BEFORE INSERT ON public.artist_radar_activity
  FOR EACH ROW EXECUTE FUNCTION public.artist_radar_account_write_guard();

-- Only a trusted importer may add genuine status changes. This table starts
-- empty: a live/current concert feed is not proof of earlier historical state.
CREATE TABLE IF NOT EXISTS public.artist_radar_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id text NOT NULL CHECK (length(artist_id) BETWEEN 1 AND 100),
  event_key text NOT NULL CHECK (length(event_key) BETWEEN 1 AND 160),
  old_status text CHECK (old_status IS NULL OR old_status IN ('rumored','announced','available','sold_out')),
  new_status text NOT NULL CHECK (new_status IN ('rumored','announced','available','sold_out')),
  observed_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL CHECK (length(source) BETWEEN 2 AND 200)
);

CREATE INDEX IF NOT EXISTS artist_radar_status_history_artist_idx
  ON public.artist_radar_status_history(artist_id, observed_at DESC);

ALTER TABLE public.artist_radar_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_radar_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_radar_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_radar_status_history ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.artist_radar_follows,
  public.artist_radar_preferences,
  public.artist_radar_activity,
  public.artist_radar_status_history FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON public.artist_radar_follows TO authenticated;
GRANT INSERT (user_id, artist_id, artist_name, genre) ON public.artist_radar_follows TO authenticated;
GRANT SELECT ON public.artist_radar_preferences TO authenticated;
GRANT INSERT (user_id, countries, categories) ON public.artist_radar_preferences TO authenticated;
GRANT UPDATE (countries, categories) ON public.artist_radar_preferences TO authenticated;
GRANT SELECT ON public.artist_radar_activity TO authenticated;
GRANT INSERT (user_id, kind, artist_id, artist_name, event_key, provider) ON public.artist_radar_activity TO authenticated;
GRANT SELECT ON public.artist_radar_status_history TO authenticated;

-- The client cannot forge timestamps. Restricting INSERT column privileges
-- also prevents it from selecting arbitrary UUIDs as history primary keys.
CREATE OR REPLACE FUNCTION public.artist_radar_preferences_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS artist_radar_preferences_updated_at ON public.artist_radar_preferences;
CREATE TRIGGER artist_radar_preferences_updated_at BEFORE UPDATE
  ON public.artist_radar_preferences FOR EACH ROW
  EXECUTE FUNCTION public.artist_radar_preferences_touch();

CREATE POLICY artist_radar_follows_read_own ON public.artist_radar_follows
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY artist_radar_follows_insert_own ON public.artist_radar_follows
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY artist_radar_follows_delete_own ON public.artist_radar_follows
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE POLICY artist_radar_preferences_read_own ON public.artist_radar_preferences
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY artist_radar_preferences_insert_own ON public.artist_radar_preferences
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY artist_radar_preferences_update_own ON public.artist_radar_preferences
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY artist_radar_activity_read_own ON public.artist_radar_activity
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY artist_radar_activity_insert_own ON public.artist_radar_activity
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));

-- Historical changes are visible only for followed artists. The importer
-- writes with service role; users have no INSERT/UPDATE/DELETE grant.
CREATE POLICY artist_radar_status_history_read_followed ON public.artist_radar_status_history
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.artist_radar_follows AS followed
      WHERE followed.user_id = (SELECT auth.uid())
        AND followed.artist_id = artist_radar_status_history.artist_id
    )
  );

COMMENT ON TABLE public.artist_radar_follows IS 'Private signed-in Artist Radar follows; unrelated to anonymous newsletter signups.';
COMMENT ON TABLE public.artist_radar_activity IS 'Private account interaction history. ticket_link_opened is NOT a purchase, reservation or ticket entitlement.';
COMMENT ON TABLE public.artist_radar_status_history IS 'Verified externally imported event status changes only. No historical backfill inferred from current status.';
