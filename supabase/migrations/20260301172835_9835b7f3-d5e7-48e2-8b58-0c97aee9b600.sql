
-- Create system_issues table for managing portal issues
CREATE TABLE public.system_issues (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  severity text NOT NULL DEFAULT 'medium',
  area text NOT NULL DEFAULT '',
  issue text NOT NULL DEFAULT '',
  impact text NOT NULL DEFAULT '',
  fix text NOT NULL DEFAULT '',
  is_resolved boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_issues ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view issues
CREATE POLICY "Authenticated users can view system issues"
  ON public.system_issues FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can manage issues
CREATE POLICY "Admins can insert system issues"
  ON public.system_issues FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update system issues"
  ON public.system_issues FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete system issues"
  ON public.system_issues FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_system_issues_updated_at
  BEFORE UPDATE ON public.system_issues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed existing issues
INSERT INTO public.system_issues (severity, area, issue, impact, fix, sort_order) VALUES
  ('critical', 'Build', 'App.js chunk 1.25MB — needs code splitting', 'Slow initial load, poor Core Web Vitals', 'Dynamic imports for Portal, HansAI, Empire, Wiki pages', 1),
  ('critical', 'SEO', 'SPA with client-side rendering only', 'Search engines may not index dynamic content', 'SSR/prerendering via Cloudflare Pages Functions or static injection', 2),
  ('high', 'Router', '3 of 20 e-commerce prompts failed initial routing', 'Users hitting AI fallback for valid workflow requests', 'Expanded keywords for scraper + autoseo (FIXED in this session)', 3),
  ('high', 'Deploy', 'Gap between workflow design and deployment', 'n8n instances showing empty despite designs existing', 'Automated workflow import via n8n API on deploy', 4),
  ('medium', 'UX', 'No CTA on homepage for backend dashboard', 'Visitors can''t discover the Command Center', 'Add subtle ''Login'' or ''Dashboard'' entry point', 5),
  ('medium', 'Perf', 'Logo PNG 1.4MB, profile JPG 716KB unoptimized', 'Slow hero section load', 'WebP conversion, responsive srcset, lazy loading', 6),
  ('medium', 'Intent', 'LLM fallback uses Lovable gateway (external dependency)', 'Single point of failure for intent classification', 'Route through Ollama on VPS2 when deployed', 7),
  ('low', 'Test', 'Only 51 tests — no integration or E2E coverage', 'Regressions in portal/auth/content flows', 'Add Playwright E2E for critical paths', 8),
  ('low', 'DX', 'Both .cjs and .js versions of scripts maintained', 'Maintenance overhead', 'Consolidate to ESM-only with proper package.json type:module', 9);
