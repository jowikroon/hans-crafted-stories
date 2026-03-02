-- Store Google OAuth tokens for Command Center google-agent (Gmail, Sheets, Drive).
-- Callback (google-oauth-callback) uses service role to insert/upsert.
-- Users can only SELECT own row (for status checks).

CREATE TABLE public.user_google_tokens (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  scopes text[] DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_google_tokens ENABLE ROW LEVEL SECURITY;

-- Users can read own row only (for "connected" status; agent uses service role)
CREATE POLICY "Users can view own google tokens"
  ON public.user_google_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE by user; callback uses service role (bypasses RLS)
CREATE TRIGGER update_user_google_tokens_updated_at
  BEFORE UPDATE ON public.user_google_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
