// Local Vite-only design fixture. Not a production entrypoint or real account.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { portalApi, type PortalTool } from '@/lib/api/portal';
import { usersApi } from '@/lib/api/users';
import { invitesApi, attemptsApi } from '@/lib/api/portalAccess';
import { toolReviewsApi } from '@/lib/api/toolReviews';
import PortalToolsTab from '@/components/portal/PortalToolsTab';
import PortalUsersManager from '@/components/portal/PortalUsersManager';
import { Toaster } from '@/components/ui/toaster';
import catalog from './catalog.json';
import '@/index.css';
let isOwner = true;
const tools = catalog.map(t=>({...t,id:t.config.repo_slug,user_id:'owner',created_at:'2026-10-13'})) as PortalTool[];
const grants=[{tool_id:'notes',can_view:true,can_use:true},{tool_id:'reverse',can_view:true,can_use:false}];
portalApi.getTools = async()=>isOwner?tools:tools.filter(t=>grants.some(g=>g.tool_id===t.id));
usersApi.getToolAccess = async()=>grants as never;
usersApi.getProfiles = async()=>[{id:'owner',user_id:'owner',display_name:'Hans van Leeuwen',email:'Eigenaar',is_active:true},{id:'friend',user_id:'friend',display_name:'Voorbeeldgebruiker',email:'Ontwerpvoorbeeld',is_active:true}] as never;
invitesApi.list=async()=>[];
attemptsApi.list=async()=>[];
toolReviewsApi.get=async()=>null;
toolReviewsApi.save=async()=>{};
function Preview(){
 const [mode,setMode]=useState('owner');
 return <><div className="border-b border-border bg-card px-5 py-3 text-sm"><span className="mr-6 text-muted-foreground">Ontwerpcontrole · voorbeeldgegevens</span>{['owner','member','users'].map(m=><button key={m} onClick={()=>{isOwner=m!=='member';setMode(m);}} className="mr-2 rounded-lg border border-border px-3 py-1.5">{m==='owner'?'Hans':m==='member'?'Vriend':'Users'}</button>)}</div><main className="mx-auto max-w-6xl px-5 py-10 sm:px-8"><h1 className="font-display text-3xl font-semibold">{mode==='owner'?'Welkom terug, Hans':mode==='member'?'Mijn tools':'Toegang beheren'}</h1><p className="mb-8 mt-2 text-muted-foreground">{mode==='member'?'Welkom. Open een tool of bekijk wat je ermee kunt doen.':'Jouw tools, projecten en mensen op één plek.'}</p>{mode==='users'?<PortalUsersManager adminUserId="owner"/>:<PortalToolsTab key={mode} userId={mode==='owner'?'owner':'friend'} isAdmin={mode==='owner'}/>}</main><Toaster/></>;
}
createRoot(document.getElementById('root')!).render(<BrowserRouter><AuthProvider><Preview/></AuthProvider></BrowserRouter>);
