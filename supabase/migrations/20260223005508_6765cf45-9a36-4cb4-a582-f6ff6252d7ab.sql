
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS: users can only read their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Also create tool_attributes table from the approved plan
CREATE TABLE public.tool_attributes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_id uuid REFERENCES public.portal_tools(id) ON DELETE CASCADE NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tool_id, key)
);

ALTER TABLE public.tool_attributes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attributes of their own tools"
ON public.tool_attributes FOR SELECT
USING (EXISTS (SELECT 1 FROM public.portal_tools WHERE id = tool_id AND user_id = auth.uid()));

CREATE POLICY "Users can insert attributes for their own tools"
ON public.tool_attributes FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.portal_tools WHERE id = tool_id AND user_id = auth.uid()));

CREATE POLICY "Users can update attributes of their own tools"
ON public.tool_attributes FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.portal_tools WHERE id = tool_id AND user_id = auth.uid()));

CREATE POLICY "Users can delete attributes of their own tools"
ON public.tool_attributes FOR DELETE
USING (EXISTS (SELECT 1 FROM public.portal_tools WHERE id = tool_id AND user_id = auth.uid()));
