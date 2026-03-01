-- v6.1: n8n filter presets in user_preferences (assumes user_preferences exists)
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS n8n_filter_presets JSONB DEFAULT '{}'::jsonb;
