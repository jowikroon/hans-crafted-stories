create table public.cowork_attachments (
 name text primary key, size bigint not null check(size >= 0),
 modified timestamptz not null, sha256 text not null,
 storage_path text not null, synced_at timestamptz not null default now()
);
alter table public.cowork_attachments enable row level security;
revoke all on public.cowork_attachments from anon, authenticated;
grant select on public.cowork_attachments to authenticated;
grant all on public.cowork_attachments to service_role;
create policy "Owner reads cowork attachments" on public.cowork_attachments
 for select to authenticated using ((select public.is_portal_owner()));
insert into storage.buckets(id,name,public) values ('cowork-attachments','cowork-attachments',false);
create policy "Owner downloads cowork attachments" on storage.objects
 for select to authenticated using (bucket_id='cowork-attachments' and (select public.is_portal_owner()));
