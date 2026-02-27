
CREATE TABLE public.unhandled_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_input TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'hansai',
  fast_route_score NUMERIC,
  llm_intent TEXT,
  llm_confidence NUMERIC,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_workflow TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.unhandled_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to unhandled_intents"
  ON public.unhandled_intents FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.empire_events
  ADD COLUMN monday_item_id TEXT;
