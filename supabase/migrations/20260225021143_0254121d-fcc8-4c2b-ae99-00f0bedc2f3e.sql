
ALTER TABLE portal_tools DROP CONSTRAINT IF EXISTS portal_tools_tool_type_check;
ALTER TABLE portal_tools ADD CONSTRAINT portal_tools_tool_type_check CHECK (tool_type IN ('webhook', 'site-audit', 'keyword', 'iframe', 'workflow', 'ai-agent', 'custom', 'external'));
