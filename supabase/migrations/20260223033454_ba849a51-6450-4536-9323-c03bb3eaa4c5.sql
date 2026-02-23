
-- Add category and features columns to portal_tools
ALTER TABLE public.portal_tools ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general';
ALTER TABLE public.portal_tools ADD COLUMN IF NOT EXISTS features text[] NOT NULL DEFAULT '{}';

-- Add tab_access to portal_profiles for Layer 1 access control
ALTER TABLE public.portal_profiles ADD COLUMN IF NOT EXISTS tab_access text[] NOT NULL DEFAULT '{tools,content,status}';

-- Update existing tools with proper categories and features
UPDATE public.portal_tools SET category = 'seo', features = ARRAY['Analyze on-page SEO factors', 'Check meta tags & headings', 'Identify missing alt attributes', 'Get actionable fix suggestions'] WHERE tool_type = 'site-audit';

UPDATE public.portal_tools SET category = 'seo', features = ARRAY['AI-powered keyword analysis', 'Search intent classification', 'Content topic suggestions', 'Difficulty scoring'] WHERE tool_type = 'keyword';

UPDATE public.portal_tools SET category = 'automation', features = ARRAY['Trigger n8n workflows', 'Send custom payloads', 'Monitor execution status'] WHERE tool_type = 'webhook';

UPDATE public.portal_tools SET category = 'automation', features = ARRAY['View workflow structure', 'Download JSON configs', 'One-click import to n8n'] WHERE tool_type = 'workflow';

UPDATE public.portal_tools SET category = 'ai', features = ARRAY['Chat with AI assistant', 'Troubleshoot n8n workflows', 'Get automation suggestions'] WHERE tool_type = 'ai-agent';

UPDATE public.portal_tools SET category = 'seo', features = ARRAY['Generate SEO-optimized titles', 'A/B test title variations', 'Character count validation'] WHERE name ILIKE '%title%';

UPDATE public.portal_tools SET category = 'data', features = ARRAY['Map product attributes', 'Optimize feed performance', 'Bulk data transformations'] WHERE name ILIKE '%channable%';

UPDATE public.portal_tools SET category = 'automation', features = ARRAY['Submit data via embedded form', 'Direct workflow integration'] WHERE tool_type = 'iframe' AND name NOT ILIKE '%channable%' AND name NOT ILIKE '%title%';
