CREATE TABLE IF NOT EXISTS unhandled_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_input TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'hansai',
  fast_route_score REAL,
  llm_intent TEXT,
  llm_confidence REAL,
  user_selection TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_workflow TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE unhandled_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert unhandled intents"
  ON unhandled_intents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read unhandled intents"
  ON unhandled_intents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update unhandled intents"
  ON unhandled_intents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_unhandled_intents_resolved ON unhandled_intents (resolved);
CREATE INDEX idx_unhandled_intents_created ON unhandled_intents (created_at DESC);
