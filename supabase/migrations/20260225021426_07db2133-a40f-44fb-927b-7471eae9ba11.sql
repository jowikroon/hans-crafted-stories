
-- Update constraint to include chrome-extension type
ALTER TABLE public.portal_tools DROP CONSTRAINT IF EXISTS portal_tools_tool_type_check;
ALTER TABLE public.portal_tools ADD CONSTRAINT portal_tools_tool_type_check CHECK (tool_type IN ('webhook', 'site-audit', 'keyword', 'iframe', 'workflow', 'ai-agent', 'custom', 'external', 'chrome-extension'));
