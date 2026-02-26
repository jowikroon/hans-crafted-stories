
-- Table for per-user AI model access
CREATE TABLE public.user_ai_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ai_model text NOT NULL,
  can_access boolean NOT NULL DEFAULT false,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  granted_by uuid,
  UNIQUE (user_id, ai_model)
);

ALTER TABLE public.user_ai_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all AI access"
  ON public.user_ai_access FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own AI access"
  ON public.user_ai_access FOR SELECT
  USING (auth.uid() = user_id);
