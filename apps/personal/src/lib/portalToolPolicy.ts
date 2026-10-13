import type { PortalTool } from './api/portal';

export type ToolGrant = { tool_id: string; can_view: boolean; can_use: boolean };
export function normalizeGrant(grant: ToolGrant): ToolGrant {
  return { ...grant, can_view: grant.can_view || grant.can_use };
}
export function mayUseTool(tool: PortalTool, isAdmin: boolean, grants: ToolGrant[]): boolean {
  if (tool.config.enabled === false) return false;
  if (isAdmin) return true;
  return grants.some(g => g.tool_id === tool.id && g.can_view && g.can_use)
    && ['individual-login', 'stateless'].includes(String(tool.config.member_access));
}
export function safeToolUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
