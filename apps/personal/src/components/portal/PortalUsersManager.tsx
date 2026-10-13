import { useEffect, useRef, useState } from 'react';
import { UserPlus, ShieldCheck, ChevronRight, Copy, Loader2 } from 'lucide-react';
import { usersApi, type PortalProfile } from '@/lib/api/users';
import { portalApi, type PortalTool } from '@/lib/api/portal';
import { invitesApi, type PortalInvite } from '@/lib/api/portalAccess';
import type { ToolGrant } from '@/lib/portalToolPolicy';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ToolAccessChecklist from './ToolAccessChecklist';
import PortalLoginAttemptsSection from './PortalLoginAttemptsSection';

export default function PortalUsersManager({ adminUserId, subFilter }: { adminUserId: string; subFilter?: string }) {
  const { toast } = useToast();
  const [profiles,setProfiles] = useState<PortalProfile[]>([]);
  const [invites,setInvites] = useState<PortalInvite[]>([]);
  const [tools,setTools] = useState<PortalTool[]>([]);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [editing,setEditing] = useState<PortalProfile | null>(null);
  const [showAdd,setShowAdd] = useState(false);
  const [name,setName] = useState('');
  const [email,setEmail] = useState('');
  const [grants,setGrants] = useState<ToolGrant[]>([]);
  const accessRequest = useRef(0);
  const [accessLoading,setAccessLoading] = useState(false);
  const fail = (e: unknown) => toast({ title: 'Wijziging niet opgeslagen', description: e instanceof Error ? e.message : 'Probeer opnieuw.', variant: 'destructive' });
  const load = async () => {
    try { const [p,t,i] = await Promise.all([usersApi.getProfiles(),portalApi.getTools(),invitesApi.list()]); setProfiles(p);setTools(t);setInvites(i); }
    catch(e) { fail(e); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const edit = async (profile: PortalProfile) => {
    const request = ++accessRequest.current;
    setEditing(profile);setGrants([]);setAccessLoading(true);
    try { const result = await usersApi.getToolAccess(profile.user_id); if(request===accessRequest.current) setGrants(result); }
    catch(e) { if(request===accessRequest.current){fail(e);setEditing(null);} } finally { if(request===accessRequest.current) setAccessLoading(false); }
  };
  const save = async () => {
    setBusy(true);
    try {
      if (editing) {
        const { error } = await supabase.rpc('portal_save_tool_grants' as never, { _user: editing.user_id, _grants: grants } as never);
        if(error) throw error;
        toast({ title: 'Toegang opgeslagen', description: 'Deze gebruiker ziet alleen de toegewezen tools.' });
      } else {
        await invitesApi.create(email,name,adminUserId,grants);
        toast({ title: 'Gebruiker klaargezet', description: 'Deel de portallink zelf. Er is geen e-mail verstuurd.' });
      }
      setEditing(null);setShowAdd(false);await load();
    } catch(e) { fail(e); } finally { setBusy(false); }
  };
  const toggleActive = async (profile: PortalProfile) => {
    setBusy(true);
    try { await usersApi.updateProfile(profile.id,{is_active:!profile.is_active}); await load(); }
    catch(e) { fail(e); } finally { setBusy(false); }
  };
  const revoke = async (invite: PortalInvite) => {
    setBusy(true);
    try { await invitesApi.revoke(invite.id); await load(); } catch(e) { fail(e); } finally { setBusy(false); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText('https://hansvanleeuwen.com/portal');toast({title:'Portallink gekopieerd'}); } catch { toast({title:'Kopiëren mislukt',variant:'destructive'}); }
  };
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-display text-xl font-semibold">Mensen & toegang</h2><p className="mt-1 max-w-xl text-sm text-muted-foreground">Geef vrienden hun eigen overzicht met tools. Jij blijft de enige beheerder.</p></div><Button onClick={() => {setEditing(null);setName('');setEmail('');setGrants([]);setShowAdd(true);}} className="gap-2"><UserPlus size={15}/>Gebruiker toevoegen</Button></div>
    {loading ? <p>Gebruikers laden…</p> : <div className="space-y-3">{profiles.filter(p => subFilter==='Admins' ? p.user_id===adminUserId : subFilter==='Members' ? p.user_id!==adminUserId : true).map(profile => <div key={profile.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-semibold">{profile.display_name.charAt(0)}</div><div className="min-w-0 flex-1"><p className="font-medium">{profile.display_name}</p><p className="break-all text-xs text-muted-foreground">{profile.email}</p></div>
      {profile.user_id===adminUserId ? <span className="flex items-center gap-1.5 text-xs text-primary"><ShieldCheck size={15}/>Eigenaar · alle tools</span> : <><span className="text-xs text-muted-foreground">{profile.is_active?'Actief':'Toegang gepauzeerd'}</span><Button variant="ghost" size="sm" disabled={busy} onClick={() => toggleActive(profile)}>{profile.is_active?'Pauzeren':'Activeren'}</Button><Button variant="outline" size="sm" onClick={() => edit(profile)}>Tools kiezen<ChevronRight size={14}/></Button></>}
    </div>)}</div>}
    {invites.filter(i=>!i.accepted_at&&!i.revoked_at).length>0 && <section className="rounded-2xl border border-border p-5"><h3 className="mb-4 text-sm font-semibold">Klaar om in te loggen</h3><div className="space-y-3">{invites.filter(i=>!i.accepted_at&&!i.revoked_at).map(i=><div key={i.id} className="flex flex-wrap items-center gap-3 text-sm"><span className="flex-1 break-all">{i.display_name || i.email}<span className="block text-xs text-muted-foreground">{i.email} · {(i.tool_grants || []).filter(g=>g.can_view).length} tools</span></span><Button size="sm" variant="ghost" onClick={copy}><Copy size={13}/>Portallink</Button><Button size="sm" variant="ghost" disabled={busy} onClick={()=>revoke(i)}>Intrekken</Button></div>)}</div></section>}
    <details className="rounded-2xl border border-border p-5"><summary className="cursor-pointer text-sm font-medium">Inloggeschiedenis</summary><div className="mt-4"><PortalLoginAttemptsSection/></div></details>
    <Dialog open={showAdd||!!editing} onOpenChange={open=>{if(!open&&!busy){accessRequest.current++;setAccessLoading(false);setShowAdd(false);setEditing(null);}}}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{editing?'Tools voor '+editing.display_name:'Gebruiker toevoegen'}</DialogTitle><DialogDescription>Alleen toegang tot de portal met geselecteerde tools. Geen beheerrechten.</DialogDescription></DialogHeader>
      {!editing&&<div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-medium">Naam<Input className="mt-1.5" value={name} onChange={e=>setName(e.target.value)} placeholder="Naam van je vriend"/></label><label className="text-xs font-medium">Google-e-mailadres<Input className="mt-1.5" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="naam@gmail.com"/></label><p className="sm:col-span-2 text-xs text-muted-foreground">Inloggen gaat met het eigen Google-account. Je deelt daarna zelf de portallink.</p></div>}
      {accessLoading?<p>Rechten laden…</p>:<ToolAccessChecklist tools={tools} value={grants} onChange={setGrants} disabled={busy}/>}
      <div className="flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{grants.filter(g=>g.can_view).length} tools zichtbaar</p><Button onClick={save} disabled={busy||accessLoading||(!editing&&(!name.trim()||!/^\S+@\S+\.\S+$/.test(email.trim())))}>{busy?<Loader2 className="animate-spin" size={15}/>:editing?'Toegang opslaan':'Gebruiker klaarzetten'}</Button></div>
    </DialogContent></Dialog>
  </div>;
}
