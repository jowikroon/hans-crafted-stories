-- Portal profiles for managed users
CREATE TABLE public.portal_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  avatar_url text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.portal_profiles ENABLE ROW LEVEL SECURITY;

-- Admins can manage all profiles
CREATE POLICY "Admins can view all portal profiles"
  ON public.portal_profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert portal profiles"
  ON public.portal_profiles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update portal profiles"
  ON public.portal_profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete portal profiles"
  ON public.portal_profiles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can view own profile
CREATE POLICY "Users can view own portal profile"
  ON public.portal_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_portal_profiles_updated_at
  BEFORE UPDATE ON public.portal_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User tool access: which tools each user can see/use
CREATE TABLE public.user_tool_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool_id uuid REFERENCES public.portal_tools(id) ON DELETE CASCADE NOT NULL,
  can_view boolean NOT NULL DEFAULT true,
  can_use boolean NOT NULL DEFAULT false,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid,
  UNIQUE(user_id, tool_id)
);

ALTER TABLE public.user_tool_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all tool access"
  ON public.user_tool_access FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own tool access"
  ON public.user_tool_access FOR SELECT
  USING (auth.uid() = user_id);

-- User content access: which content types each user can view/edit
CREATE TABLE public.user_content_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('blog_posts', 'case_studies', 'media', 'pages')),
  can_view boolean NOT NULL DEFAULT true,
  can_edit boolean NOT NULL DEFAULT false,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid,
  UNIQUE(user_id, content_type)
);

ALTER TABLE public.user_content_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all content access"
  ON public.user_content_access FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own content access"
  ON public.user_content_access FOR SELECT
  USING (auth.uid() = user_id);