create table public.portal_tool_notes (
 user_id uuid not null references auth.users(id) on delete cascade,
 tool_id uuid not null references public.portal_tools(id) on delete cascade,
 note text not null default '' check(length(note)<=200000),
 updated_at timestamptz not null default now(), primary key(user_id,tool_id)
);
alter table public.portal_tool_notes enable row level security;
grant select,insert,update,delete on public.portal_tool_notes to authenticated;
create policy "Own notes with tool access" on public.portal_tool_notes for all to authenticated
 using(user_id=auth.uid() and public.portal_has_tool(tool_id,true))
 with check(user_id=auth.uid() and public.portal_has_tool(tool_id,true));
