-- ── workflow_runs: async n8n job tracking ────────────────────────────────────
-- Each row is created by the trigger-webhook edge function before n8n fires,
-- then updated by n8n (or the edge function on error) with the final status.

-- Status enum
DO $$ BEGIN
  CREATE TYPE public.workflow_run_status AS ENUM ('pending', 'processing', 'completed', 'error');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Main table
CREATE TABLE IF NOT EXISTS public.workflow_runs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  status        public.workflow_run_status NOT NULL DEFAULT 'pending',
  result_data   jsonb,
  error_message text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS workflow_runs_user_id_idx ON public.workflow_runs (user_id);
CREATE INDEX IF NOT EXISTS workflow_runs_status_idx  ON public.workflow_runs (status);
CREATE INDEX IF NOT EXISTS workflow_runs_created_idx ON public.workflow_runs (created_at DESC);

-- Row-Level Security
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own runs (needed for Realtime subscriptions)
CREATE POLICY "Users can view own workflow runs"
  ON public.workflow_runs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role bypasses RLS entirely, so no explicit policy is needed for
-- the trigger-webhook edge function (which uses SUPABASE_SERVICE_ROLE_KEY).

-- Enable Supabase Realtime so frontend can subscribe to row changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.workflow_runs;
