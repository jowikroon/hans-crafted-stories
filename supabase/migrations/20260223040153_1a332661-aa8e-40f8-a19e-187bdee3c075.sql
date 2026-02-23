
-- Page elements visibility table
CREATE TABLE public.page_elements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page text NOT NULL,
  element_key text NOT NULL,
  element_label text NOT NULL,
  element_group text NOT NULL DEFAULT '',
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(page, element_key)
);

-- Enable RLS
ALTER TABLE public.page_elements ENABLE ROW LEVEL SECURITY;

-- Anyone can read (needed for frontend visibility checks)
CREATE POLICY "Anyone can view page elements"
ON public.page_elements FOR SELECT
USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert page elements"
ON public.page_elements FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update page elements"
ON public.page_elements FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete page elements"
ON public.page_elements FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_page_elements_updated_at
BEFORE UPDATE ON public.page_elements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default elements per page
-- Writing page
INSERT INTO public.page_elements (page, element_key, element_label, element_group, is_visible, sort_order) VALUES
  ('writing', 'breadcrumb', 'Breadcrumb Navigation', 'Navigation', true, 1),
  ('writing', 'category_cards', 'Category Filter Cards (All / Professional / Personal)', 'Filters', false, 2),
  ('writing', 'search_bar', 'Search Bar', 'Filters', true, 3),
  ('writing', 'tag_filters', 'Tag Filters', 'Filters', true, 4),
  ('writing', 'sort_button', 'Sort Button', 'Filters', true, 5),
  ('writing', 'post_count', 'Post Count Label', 'Content', true, 6),
  ('writing', 'page_header', 'Page Title & Subtitle', 'Content', true, 7);

-- About page
INSERT INTO public.page_elements (page, element_key, element_label, element_group, is_visible, sort_order) VALUES
  ('about', 'profile_photo', 'Profile Photo', 'Header', true, 1),
  ('about', 'bio_section', 'Bio Text', 'Header', true, 2),
  ('about', 'contact_details', 'Contact Details (Email, LinkedIn, Location)', 'Header', true, 3),
  ('about', 'cv_downloads', 'CV Download Buttons', 'Header', true, 4),
  ('about', 'skills_section', 'Core Competencies / Skills', 'Content', true, 5),
  ('about', 'experience_section', 'Work Experience Timeline', 'Content', true, 6),
  ('about', 'education_section', 'Education Section', 'Content', true, 7),
  ('about', 'stargate_decorations', 'Stargate Visual Elements', 'Design', true, 8);

-- Work page
INSERT INTO public.page_elements (page, element_key, element_label, element_group, is_visible, sort_order) VALUES
  ('work', 'page_header', 'Page Title & Subtitle', 'Content', true, 1),
  ('work', 'case_study_grid', 'Case Study Cards Grid', 'Content', true, 2);

-- Home page
INSERT INTO public.page_elements (page, element_key, element_label, element_group, is_visible, sort_order) VALUES
  ('home', 'hero_section', 'Hero Section', 'Content', true, 1);
