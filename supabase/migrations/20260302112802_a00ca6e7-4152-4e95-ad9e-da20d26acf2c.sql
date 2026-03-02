
-- Create enum type for workflow run status
DO $$ BEGIN
  CREATE TYPE public.workflow_run_status AS ENUM ('pending', 'processing', 'completed', 'error');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create workflow_runs table
CREATE TABLE IF NOT EXISTS public.workflow_runs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL,
  status        public.workflow_run_status NOT NULL DEFAULT 'pending',
  result_data   jsonb,
  error_message text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS workflow_runs_user_id_idx ON public.workflow_runs (user_id);
CREATE INDEX IF NOT EXISTS workflow_runs_status_idx  ON public.workflow_runs (status);
CREATE INDEX IF NOT EXISTS workflow_runs_created_idx ON public.workflow_runs (created_at DESC);

-- Enable RLS
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can view their own runs
CREATE POLICY "Users can view own workflow runs"
  ON public.workflow_runs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- RLS policy: authenticated users can insert their own runs
CREATE POLICY "Users can insert own workflow runs"
  ON public.workflow_runs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS policy: admins can manage all runs
CREATE POLICY "Admins can manage all workflow runs"
  ON public.workflow_runs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.workflow_runs;
