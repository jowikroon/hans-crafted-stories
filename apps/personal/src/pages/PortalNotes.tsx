import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Save, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useForcedTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { portalApi } from '@/lib/api/portal';
import { usersApi } from '@/lib/api/users';
import { mayUseTool } from '@/lib/portalToolPolicy';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
export default function PortalNotes() {
  useForcedTheme('light');
  const {user,loading:authLoading}=useAuth();
  const {isAdmin,loading:adminLoading}=useAdmin();
  const {toast}=useToast();
  const [toolId,setToolId]=useState<string|null>(null);
  const [ownerId,setOwnerId]=useState<string|null>(null);
  const [note,setNote]=useState('');
  const [saved,setSaved]=useState('');
  const [query,setQuery]=useState('');
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>{
    if(authLoading||adminLoading)return;
    let live=true;setToolId(null);setOwnerId(null);setNote('');setSaved('');setError('');setLoading(true);
    if(!user){setError('Log in op de portal om je notities te openen.');setLoading(false);return;}
    const load=async()=>{
      try{
        const [tools,grants]=await Promise.all([portalApi.getTools(),isAdmin?Promise.resolve([]):usersApi.getToolAccess(user.id)]);
        const tool=tools.find(t=>t.config.repo_slug==='notes');
        if(!tool||!mayUseTool(tool,isAdmin,grants))throw new Error('Je hebt geen gebruikstoegang tot deze tool.');
        const {data,error:readError}=await supabase.from('portal_tool_notes' as never).select('note').eq('user_id',user.id).eq('tool_id',tool.id).maybeSingle();
        if(readError)throw readError;
        if(live){const value=(data as {note:string}|null)?.note||'';setNote(value);setSaved(value);setToolId(tool.id);setOwnerId(user.id);}
      }catch(e){if(live)setError(e instanceof Error?e.message:'Notities konden niet worden geladen.');}
      finally{if(live)setLoading(false);}
    };void load();return()=>{live=false;};
  },[user?.id,authLoading,adminLoading,isAdmin]);
  useEffect(()=>{
    if(note===saved)return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
    window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
  },[note,saved]);
  const save=async()=>{
    if(!user||!toolId||ownerId!==user.id)return;setBusy(true);
    try{
      const {error:writeError}=await supabase.from('portal_tool_notes' as never).upsert({user_id:user.id,tool_id:toolId,note,updated_at:new Date().toISOString()} as never,{onConflict:'user_id,tool_id'});
      if(writeError)throw writeError;setSaved(note);toast({title:'Notities opgeslagen'});
    }catch{toast({title:'Opslaan mislukt',description:'Je tekst blijft staan. Controleer je toegang en probeer opnieuw.',variant:'destructive'});}finally{setBusy(false);}
  };
  const download=()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,note,exportedAt:new Date().toISOString()},null,2)],{type:'application/json;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='mijn-notities.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const matches=query?note.toLowerCase().split(query.toLowerCase()).length-1:0;
  const ready=!!user&&ownerId===user.id&&!!toolId&&!loading&&!error;
  return <section className="section-container max-w-4xl px-5 py-12 sm:px-8"><Link to="/portal" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft size={15}/>Mijn tools</Link><h1 className="font-display text-3xl font-semibold">Mijn notities</h1><p className="mt-2 mb-7 text-sm text-muted-foreground">Jouw eigen werkblad. Bewaar ideeën, zoek iets terug of download je notities.</p>
    {loading?<p>Je notities laden…</p>:error?<p role="alert" className="rounded-xl border border-border bg-card p-5">{error}</p>:ready&&<><div className="mb-3 flex flex-wrap items-center gap-3"><label className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"><Search size={15}/><span className="sr-only">Zoeken in notities</span><input className="min-w-0 flex-1 bg-transparent text-sm outline-none" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Zoeken in je notities"/>{query&&<span className="text-xs text-muted-foreground" role="status">{matches} gevonden</span>}</label><Button variant="outline" onClick={download} className="gap-2"><Download size={14}/>JSON exporteren</Button><Button onClick={save} disabled={busy||note===saved} className="gap-2"><Save size={14}/>{busy?'Opslaan…':'Opslaan'}</Button></div><label><span className="sr-only">Notities</span><textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={200000} className="min-h-[55vh] w-full resize-y rounded-2xl border border-border bg-card p-5 text-base leading-relaxed outline-none focus:ring-2 focus:ring-primary/30" placeholder="Schrijf hier je ideeën…"/></label><p className="mt-3 text-xs text-muted-foreground" role="status">{note===saved?'Alles opgeslagen':'Niet-opgeslagen wijzigingen'} · Alleen zichtbaar voor jou</p></>}
  </section>;
}
