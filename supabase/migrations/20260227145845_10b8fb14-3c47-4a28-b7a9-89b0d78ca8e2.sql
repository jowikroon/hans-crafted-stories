
-- Create version history table for page content
CREATE TABLE public.page_content_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  page text NOT NULL,
  content_key text NOT NULL,
  content_value text NOT NULL DEFAULT '',
  content_group text NOT NULL DEFAULT '',
  content_label text NOT NULL DEFAULT '',
  changed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookups by content_id
CREATE INDEX idx_page_content_versions_content_id ON public.page_content_versions(content_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.page_content_versions ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage version history
CREATE POLICY "Admins can view version history"
  ON public.page_content_versions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert version history"
  ON public.page_content_versions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete version history"
  ON public.page_content_versions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger function to auto-capture versions on update
CREATE OR REPLACE FUNCTION public.capture_page_content_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only capture if content_value actually changed
  IF OLD.content_value IS DISTINCT FROM NEW.content_value THEN
    INSERT INTO public.page_content_versions (
      content_id, page, content_key, content_value, content_group, content_label, changed_by
    ) VALUES (
      OLD.id, OLD.page, OLD.content_key, OLD.content_value, OLD.content_group, OLD.content_label, auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to page_content table
CREATE TRIGGER capture_version_before_update
  BEFORE UPDATE ON public.page_content
  FOR EACH ROW
  EXECUTE FUNCTION public.capture_page_content_version();
