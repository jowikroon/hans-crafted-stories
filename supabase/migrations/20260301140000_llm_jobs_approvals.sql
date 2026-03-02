-- ── llm_jobs: track LLM invocations that may require model fallback ─────────
-- When primary (Claude) fails, status = needs_choice; user picks Codex or OpenAI via approvals.

DO $$ BEGIN
  CREATE TYPE public.llm_job_status AS ENUM (
    'queued', 'running', 'needs_choice', 'succeeded', 'failed', 'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.llm_job_purpose AS ENUM (
    'tool_spec', 'fix_patch', 'classify', 'summarize', 'chat'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.llm_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_id          uuid REFERENCES public.workflow_runs(id) ON DELETE SET NULL,
  purpose         public.llm_job_purpose NOT NULL DEFAULT 'chat',
  prompt_ref      text,
  status          public.llm_job_status NOT NULL DEFAULT 'queued',
  requested_model text NOT NULL DEFAULT 'claude',
  allowed_models  jsonb DEFAULT '["codex", "openai"]'::jsonb,
  error_code      text,
  cost_estimate   numeric(10, 4),
  result_data     jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS llm_jobs_user_id_idx ON public.llm_jobs (user_id);
CREATE INDEX IF NOT EXISTS llm_jobs_status_idx ON public.llm_jobs (status);
CREATE INDEX IF NOT EXISTS llm_jobs_created_idx ON public.llm_jobs (created_at DESC);

ALTER TABLE public.llm_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own llm_jobs"
  ON public.llm_jobs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own llm_jobs"
  ON public.llm_jobs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own llm_jobs"
  ON public.llm_jobs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.llm_jobs;

-- ── approvals: explicit user decisions (model switch, publish, execute_write) ─

DO $$ BEGIN
  CREATE TYPE public.approval_type AS ENUM (
    'model_switch', 'publish', 'execute_write'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.approval_status AS ENUM ('approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.approvals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id       uuid REFERENCES public.workflow_runs(id) ON DELETE SET NULL,
  llm_job_id   uuid REFERENCES public.llm_jobs(id) ON DELETE CASCADE,
  type         public.approval_type NOT NULL,
  payload      jsonb DEFAULT '{}'::jsonb,
  approved_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approved_at  timestamptz NOT NULL DEFAULT now(),
  status       public.approval_status NOT NULL DEFAULT 'approved'
);

CREATE INDEX IF NOT EXISTS approvals_llm_job_id_idx ON public.approvals (llm_job_id);
CREATE INDEX IF NOT EXISTS approvals_approved_by_idx ON public.approvals (approved_by);

ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own approvals"
  ON public.approvals FOR SELECT TO authenticated
  USING (auth.uid() = approved_by);

CREATE POLICY "Users can insert own approvals"
  ON public.approvals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = approved_by);
