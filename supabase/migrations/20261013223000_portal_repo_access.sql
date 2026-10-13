-- Owner-only administration; explicit grants, sanitized member catalogue, private reviews.
create or replace function public.is_portal_owner() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from auth.users u join public.user_roles r on r.user_id=u.id
 where u.id=auth.uid() and lower(u.email)='hansvl3@gmail.com' and u.email_confirmed_at is not null and r.role='admin'); $$;
revoke all on function public.is_portal_owner() from public;
grant execute on function public.is_portal_owner() to authenticated;

alter table public.portal_invites add column if not exists tool_grants jsonb not null default '[]';
alter table public.portal_profiles alter column tab_access set default array['tools']::text[];
alter table public.user_tool_access add constraint tool_use_requires_view check(not can_use or can_view) not valid;

-- Restrictive policies close older permissive owner/role policies without dropping them.
create policy "Portal catalog owner only" on public.portal_tools as restrictive for select to authenticated using(public.is_portal_owner());
create policy "Portal attributes owner only" on public.tool_attributes as restrictive for select to authenticated using(public.is_portal_owner());
do $$ declare t text; begin
  foreach t in array array['portal_tools','tool_attributes','portal_profiles','portal_invites','user_tool_access','user_roles'] loop
    execute format('create policy "Portal owner inserts" on public.%I as restrictive for insert to authenticated with check(public.is_portal_owner())',t);
    execute format('create policy "Portal owner updates" on public.%I as restrictive for update to authenticated using(public.is_portal_owner()) with check(public.is_portal_owner())',t);
    execute format('create policy "Portal owner deletes" on public.%I as restrictive for delete to authenticated using(public.is_portal_owner())',t);
  end loop;
end $$;

-- Do not allow a portal write (including service role) to mint another administrator.
create or replace function public.guard_portal_admin_role() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.role='admin' and not exists(select 1 from auth.users where id=new.user_id and lower(email)='hansvl3@gmail.com' and email_confirmed_at is not null) then
    raise exception 'Alleen Hans kan beheerder zijn' using errcode='42501';
  end if;
  return new;
end $$;
create trigger portal_admin_owner_guard before insert or update on public.user_roles for each row execute function public.guard_portal_admin_role();

create or replace function public.portal_has_tool(_tool uuid, _use boolean default false) returns boolean
language sql stable security definer set search_path = '' as $$
 select public.is_portal_owner() or exists(select 1 from public.user_tool_access a join public.portal_profiles p using(user_id)
 join public.portal_tools t on t.id=a.tool_id where a.user_id=auth.uid() and a.tool_id=_tool and p.is_active
 and a.can_view and (not _use or a.can_use) and coalesce(t.config->>'enabled','true') <> 'false');
$$;
revoke all on function public.portal_has_tool(uuid,boolean) from public;
grant execute on function public.portal_has_tool(uuid,boolean) to authenticated;

create or replace function public.portal_tool_catalog() returns jsonb
language sql stable security definer set search_path = '' as $$
 select coalesce(jsonb_agg(case when public.is_portal_owner() then to_jsonb(t) else
 jsonb_build_object('id',t.id,'name',t.name,'description',t.description,'tool_type',t.tool_type,'icon',t.icon,'color',t.color,'sort_order',t.sort_order,'category',t.category,'features',t.features,'created_at',t.created_at,
 'config',jsonb_strip_nulls(jsonb_build_object('repo_slug',t.config->'repo_slug','repository_url',t.config->'repository_url','try_prompt',t.config->'try_prompt','limitations',t.config->'limitations','release_status',t.config->'release_status','member_access',coalesce(t.config->'member_access','"owner-only"'::jsonb)))) end order by t.sort_order),'[]'::jsonb)
 from public.portal_tools t where auth.uid() is not null and public.portal_has_tool(t.id);
$$;
revoke all on function public.portal_tool_catalog() from public;
grant execute on function public.portal_tool_catalog() to authenticated;

create or replace function public.portal_launch_tool(_tool uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare t public.portal_tools%rowtype; target text;
begin
 if not public.portal_has_tool(_tool,true) then raise exception 'Geen gebruikstoegang' using errcode='42501'; end if;
 select * into strict t from public.portal_tools where id=_tool;
 if coalesce(t.config->>'enabled','true')='false' then raise exception 'Tool is niet beschikbaar'; end if;
 if not public.is_portal_owner() and coalesce(t.config->>'member_access','owner-only') not in ('individual-login','stateless') then
  raise exception 'Voor deze tool moet Hans eerst een eigen omgeving klaarzetten' using errcode='42501';
 end if;
 target := t.config->>'external_url';
 if target is null or target !~ '^https://[^/@[:space:]]+([/?#]|$)' then raise exception 'Geen geldige tool-link'; end if;
 return target;
end $$;
revoke all on function public.portal_launch_tool(uuid) from public;
grant execute on function public.portal_launch_tool(uuid) to authenticated;

create or replace function public.claim_portal_invite() returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid:=auth.uid(); v_email text; v_invite public.portal_invites%rowtype;
begin
 select lower(email) into v_email from auth.users where id=v_uid and email_confirmed_at is not null;
 if v_email is null then return false; end if;
 select * into v_invite from public.portal_invites where email=v_email and accepted_at is null and revoked_at is null limit 1 for update;
 if not found then return false; end if;
 if exists(select 1 from public.portal_profiles where user_id=v_uid and not is_active) then return false; end if;
 insert into public.portal_profiles(user_id,display_name,email,is_active,tab_access)
 values(v_uid,coalesce(v_invite.display_name,split_part(v_email,'@',1)),v_email,true,array['tools'])
 on conflict(user_id) do nothing;
 insert into public.user_tool_access(user_id,tool_id,can_view,can_use,granted_by)
 select v_uid,t.id,true,coalesce((g->>'can_use')::boolean,false),v_invite.invited_by
 from jsonb_array_elements(v_invite.tool_grants) g join public.portal_tools t on t.id::text=g->>'tool_id'
 where coalesce((g->>'can_view')::boolean,false) or coalesce((g->>'can_use')::boolean,false)
 on conflict(user_id,tool_id) do nothing;
 update public.portal_invites set accepted_at=now(),accepted_user_id=v_uid where id=v_invite.id;
 return true;
end $$;

create table public.portal_tool_reviews (
 user_id uuid not null references auth.users(id) on delete cascade,
 tool_id uuid not null references public.portal_tools(id) on delete cascade,
 rating integer not null default 0 check(rating between 0 and 5),
 verdict text not null default 'untested' check(verdict in('untested','useful','explore','not-for-me')),
 notes text not null default '' check(length(notes)<=4000),
 updated_at timestamptz not null default now(), primary key(user_id,tool_id)
);
alter table public.portal_tool_reviews enable row level security;
grant select,insert,update,delete on public.portal_tool_reviews to authenticated;
create policy "Own tool reviews" on public.portal_tool_reviews for all to authenticated
 using(user_id=auth.uid() and public.portal_has_tool(tool_id))
 with check(user_id=auth.uid() and public.portal_has_tool(tool_id));

create or replace function public.portal_save_tool_grants(_user uuid, _grants jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_portal_owner() then raise exception 'Alleen Hans beheert toegang' using errcode='42501'; end if;
 if _user=auth.uid() then raise exception 'Eigenaarstoegang kan niet worden gewijzigd'; end if;
 if not exists(select 1 from public.portal_profiles where user_id=_user) then raise exception 'Gebruiker niet gevonden'; end if;
 if jsonb_typeof(_grants)<>'array' then raise exception 'Ongeldige rechten'; end if;
 delete from public.user_tool_access where user_id=_user;
 insert into public.user_tool_access(user_id,tool_id,can_view,can_use,granted_by)
 select _user,t.id,true,coalesce((g->>'can_use')::boolean,false),auth.uid()
 from jsonb_array_elements(_grants) g join public.portal_tools t on t.id::text=g->>'tool_id'
 where coalesce((g->>'can_view')::boolean,false) or coalesce((g->>'can_use')::boolean,false);
 update public.portal_profiles set tab_access=array['tools'] where user_id=_user;
end $$;
revoke all on function public.portal_save_tool_grants(uuid,jsonb) from public;
grant execute on function public.portal_save_tool_grants(uuid,jsonb) to authenticated;
