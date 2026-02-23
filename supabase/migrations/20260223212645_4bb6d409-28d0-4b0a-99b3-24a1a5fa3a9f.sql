
CREATE TABLE public.empire_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL DEFAULT 'info',
  source text NOT NULL DEFAULT 'system',
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.empire_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage empire events"
  ON public.empire_events FOR ALL
  USING (has_role(auth.uid(), 'admin'));
