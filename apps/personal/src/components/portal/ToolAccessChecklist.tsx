import { Checkbox } from '@/components/ui/checkbox';
import type { PortalTool } from '@/lib/api/portal';
import type { ToolGrant } from '@/lib/portalToolPolicy';
interface Props { tools: PortalTool[]; value: ToolGrant[]; onChange: (grants: ToolGrant[]) => void; disabled?: boolean }
export default function ToolAccessChecklist({ tools, value, onChange, disabled }: Props) {
  const change = (id: string, field: 'can_view'|'can_use', enabled: boolean) => {
    const old = value.find(g => g.tool_id === id) ?? { tool_id: id, can_view: false, can_use: false };
    const next = field === 'can_view' ? { ...old, can_view: enabled, can_use: enabled && old.can_use } : { ...old, can_use: enabled, can_view: enabled || old.can_view };
    onChange([...value.filter(g => g.tool_id !== id), next]);
  };
  return <div className="overflow-hidden rounded-xl border border-border">
    <div className="grid grid-cols-[1fr_72px_72px] gap-2 bg-secondary/60 px-4 py-3 text-xs font-medium"><span>Tool</span><span className="text-center">Bekijken</span><span className="text-center">Gebruiken</span></div>
    {tools.map(tool => {
      const grant = value.find(g => g.tool_id === tool.id);
      const shareable = ['individual-login','stateless'].includes(String(tool.config.member_access));
      return <div key={tool.id} className="grid grid-cols-[1fr_72px_72px] items-center gap-2 border-t border-border px-4 py-3">
        <div><p className="text-sm font-medium">{tool.name}</p>{!shareable && <p className="mt-1 text-xs text-muted-foreground">Gebruik: eigen omgeving nodig</p>}</div>
        <Checkbox className="justify-self-center" aria-label={tool.name+' bekijken'} checked={grant?.can_view ?? false} disabled={disabled} onCheckedChange={checked => change(tool.id,'can_view',checked===true)} />
        <Checkbox className="justify-self-center" aria-label={tool.name+' gebruiken'} checked={grant?.can_use ?? false} disabled={disabled || !shareable} onCheckedChange={checked => change(tool.id,'can_use',checked===true)} />
      </div>;
    })}
  </div>;
}

