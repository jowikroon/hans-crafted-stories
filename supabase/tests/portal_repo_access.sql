
begin;
select set_config('portal_test.uid',gen_random_uuid()::text,true),set_config('portal_test.other',gen_random_uuid()::text,true);
insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,aud,role)
values(current_setting('portal_test.uid')::uuid,'portal-test-'||current_setting('portal_test.uid')||'@example.invalid',now(),'{}','{}',now(),now(),'authenticated','authenticated'),
(current_setting('portal_test.other')::uuid,'portal-test-'||current_setting('portal_test.other')||'@example.invalid',now(),'{}','{}',now(),now(),'authenticated','authenticated');
insert into portal_invites(email,display_name,tool_grants)
select 'portal-test-'||current_setting('portal_test.uid')||'@example.invalid','Disposable RLS test',jsonb_build_array(jsonb_build_object('tool_id',id,'can_view',true,'can_use',false)) from portal_tools where name='Site Audit' limit 1;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('portal_test.uid'),'role','authenticated')::text,true);
set local role authenticated;
do $$ declare tid uuid; denied boolean:=false; begin
 if public.is_portal_owner() then raise exception 'member became owner'; end if;
 if not public.claim_portal_invite() then raise exception 'invite not claimed'; end if;
 if public.claim_portal_invite() then raise exception 'invite reused'; end if;
 if jsonb_array_length(public.portal_tool_catalog())<>1 then raise exception 'invitation overgrants'; end if;
 if exists(select 1 from portal_tools) then raise exception 'raw config exposed'; end if;
 if exists(select 1 from tool_attributes) then raise exception 'raw attributes exposed'; end if;
 tid:=(public.portal_tool_catalog()->0->>'id')::uuid;
 if (public.portal_tool_catalog()->0->'config') ? 'external_url' then raise exception 'URL leaked'; end if;
 begin perform public.portal_launch_tool(tid); exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'view only launched'; end if;
 denied:=false;
 begin perform public.portal_save_tool_grants(auth.uid(),'[]'); exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'member writes grants'; end if;
 denied:=false;
 begin insert into user_roles(user_id,role) values(auth.uid(),'admin'); exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'member can escalate'; end if;
 insert into portal_tool_reviews(user_id,tool_id,rating,notes) values(auth.uid(),tid,4,'Own review');
 if (select count(*) from portal_tool_reviews)<>1 then raise exception 'own review unreadable'; end if;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('portal_test.other'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
 if jsonb_array_length(public.portal_tool_catalog())<>0 then raise exception 'unassigned sees tools'; end if;
 if exists(select 1 from portal_tool_reviews) then raise exception 'other user review leaked'; end if;
end $$;
reset role;
update portal_profiles set is_active=false where user_id=current_setting('portal_test.uid')::uuid;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('portal_test.uid'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
 if jsonb_array_length(public.portal_tool_catalog())<>0 then raise exception 'paused user sees tools'; end if;
 if exists(select 1 from portal_tool_reviews) then raise exception 'paused user reads reviews'; end if;
end $$;
reset role;
select json_build_object('passed',true,'checks',13,'fixtures','transaction rolled back') as verification;
rollback;
