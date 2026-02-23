
-- Category cards configuration table
CREATE TABLE public.category_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'LayoutGrid',
  description TEXT NOT NULL DEFAULT '',
  color_from TEXT NOT NULL DEFAULT 'primary/5',
  color_to TEXT NOT NULL DEFAULT 'primary/10',
  text_color TEXT NOT NULL DEFAULT 'text-primary',
  border_color TEXT NOT NULL DEFAULT 'border-primary/15',
  active_color_from TEXT NOT NULL DEFAULT 'primary/15',
  active_color_to TEXT NOT NULL DEFAULT 'primary/25',
  active_border_color TEXT NOT NULL DEFAULT 'border-primary/40',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.category_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view category cards"
ON public.category_cards FOR SELECT USING (true);

CREATE POLICY "Admins can insert category cards"
ON public.category_cards FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update category cards"
ON public.category_cards FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete category cards"
ON public.category_cards FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed the 3 writing category cards
INSERT INTO public.category_cards (page, label, value, icon, description, color_from, color_to, text_color, border_color, active_color_from, active_color_to, active_border_color, sort_order) VALUES
('writing', 'All', 'all', 'LayoutGrid', 'Everything', 'primary/5', 'primary/10', 'text-primary', 'border-primary/15', 'primary/15', 'primary/25', 'border-primary/40', 0),
('writing', 'Professional', 'professional', 'Briefcase', 'E-commerce & Strategy', 'emerald-500/5', 'emerald-600/10', 'text-emerald-700 dark:text-emerald-400', 'border-emerald-500/15', 'emerald-500/15', 'emerald-600/25', 'border-emerald-500/40', 1),
('writing', 'Personal', 'personal', 'Heart', 'Life & Reflections', 'amber-500/5', 'amber-600/10', 'text-amber-700 dark:text-amber-400', 'border-amber-500/15', 'amber-500/15', 'amber-600/25', 'border-amber-500/40', 2);
