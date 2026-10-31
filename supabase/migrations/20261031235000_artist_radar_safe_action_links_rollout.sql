-- Safe two-step confirmation and unsubscribe rollout (Artist Radar PR #465).
-- The switch stays OFF until the new public review page is deployed to the
-- production host. Supabase Edge uses its service-role client to read it.
CREATE TABLE IF NOT EXISTS public.artist_radar_runtime_flags (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false
);
ALTER TABLE public.artist_radar_runtime_flags ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.artist_radar_runtime_flags FROM anon, authenticated;
GRANT SELECT ON public.artist_radar_runtime_flags TO service_role;
INSERT INTO public.artist_radar_runtime_flags (key, enabled)
VALUES ('safe_action_links', false)
ON CONFLICT (key) DO NOTHING;
