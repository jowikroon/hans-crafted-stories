ALTER TABLE empire_events
  ADD COLUMN IF NOT EXISTS monday_item_id TEXT;

CREATE INDEX IF NOT EXISTS idx_empire_events_monday_item
  ON empire_events (monday_item_id)
  WHERE monday_item_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_empire_events_source
  ON empire_events (source);
