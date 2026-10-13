import { describe, it, expect } from 'vitest';
import { mayUseTool, normalizeGrant, safeToolUrl } from './portalToolPolicy';
import type { PortalTool } from './api/portal';
const tool = {id:'a',config:{member_access:'stateless'}} as unknown as PortalTool;
describe('Tool permissions',()=>{
  it('denies an unassigned member',()=>expect(mayUseTool(tool,false,[])).toBe(false));
  it('denies view-only access',()=>expect(mayUseTool(tool,false,[{tool_id:'a',can_view:true,can_use:false}])).toBe(false));
  it('allows explicit view and use',()=>expect(mayUseTool(tool,false,[{tool_id:'a',can_view:true,can_use:true}])).toBe(true));
  it('does not match another tool grant',()=>expect(mayUseTool(tool,false,[{tool_id:'b',can_view:true,can_use:true}])).toBe(false));
  it.each(['owner-only',undefined])('fails closed for unreviewed sharing %s',mode=>expect(mayUseTool({...tool,config:{member_access:mode}},false,[{tool_id:'a',can_view:true,can_use:true}])).toBe(false));
  it('lets the owner use private workspaces',()=>expect(mayUseTool({...tool,config:{member_access:'owner-only'}},true,[])).toBe(true));
  it('does not launch a disabled tool',()=>expect(mayUseTool({...tool,config:{enabled:false}},true,[])).toBe(false));
  it('use implies view',()=>expect(normalizeGrant({tool_id:'a',can_view:false,can_use:true}).can_view).toBe(true));
  it.each(['javascript:alert(1)','http://example.com','https://user:password@example.com','/relative','data:text/html,test'])('rejects unsafe launch URL %s',url=>expect(safeToolUrl(url)).toBeNull());
  it('accepts credential-free HTTPS',()=>expect(safeToolUrl('https://reverse.hansvanleeuwen.com/')).toBe('https://reverse.hansvanleeuwen.com/'));
});
