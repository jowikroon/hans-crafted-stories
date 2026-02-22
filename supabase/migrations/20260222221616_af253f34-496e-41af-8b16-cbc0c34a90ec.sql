
-- Create portal_tools table
CREATE TABLE public.portal_tools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  tool_type TEXT NOT NULL CHECK (tool_type IN ('site-audit', 'webhook', 'keyword')),
  config JSONB DEFAULT '{}'::jsonb,
  icon TEXT DEFAULT 'Wrench',
  color TEXT DEFAULT 'text-primary',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.portal_tools ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own tools" ON public.portal_tools FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tools" ON public.portal_tools FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tools" ON public.portal_tools FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tools" ON public.portal_tools FOR DELETE USING (auth.uid() = user_id);
