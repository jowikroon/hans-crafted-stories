
-- Tracking scripts table for managing external code injections (GA, GTM, Ads, pixels, etc.)
CREATE TABLE public.tracking_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  script_type text NOT NULL DEFAULT 'custom',
  position text NOT NULL DEFAULT 'head',
  code text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,
  last_verified_at timestamp with time zone,
  verification_method text NOT NULL DEFAULT 'manual',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tracking_scripts ENABLE ROW LEVEL SECURITY;

-- Only admins can manage tracking scripts
CREATE POLICY "Admins can manage tracking scripts"
  ON public.tracking_scripts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can read active scripts (needed for the injector component on public pages)
CREATE POLICY "Anyone can view active tracking scripts"
  ON public.tracking_scripts FOR SELECT
  USING (is_active = true);

-- Update trigger for updated_at
CREATE TRIGGER update_tracking_scripts_updated_at
  BEFORE UPDATE ON public.tracking_scripts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
