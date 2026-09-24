-- Edit overlay write-back (2026-09-24)
-- On-page text edits are (1) applied live via page_overrides and (2) written
-- back to their source: code via a GitHub PR (n8n worker "Overlay Source Sync
-- (HansOS)"), or the page_content row for CMS-backed copy.
-- Additive only: new nullable columns, a new admin-only job table, two
-- service_role-only RPCs and an insert trigger that pings the n8n worker.

-- 1) page_overrides: language + source metadata for text overrides (HAN-177)
alter table public.page_overrides add column if not exists lang text;
alter table public.page_overrides add column if not exists data_src text;
alter table public.page_overrides add column if not exists original_text text;
do $$ begin
  alter table public.page_overrides add constraint page_overrides_lang_chk check (lang is null or lang in ('nl', 'en'));
exception when duplicate_object then null; end $$;

-- 2) job table
create table if not exists public.overlay_source_edits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  status text not null default 'queued',
  mode text not null default 'auto_merge',
  page_path text not null,
  lang text,
  element_key text,
  data_src text,
  old_text text not null,
  new_text text not null,
  patch jsonb,
  target text,
  pr_number integer,
  pr_url text,
  branch text,
  merge_sha text,
  live_sha text,
  attempts integer not null default 0,
  error text,
  log jsonb not null default '[]'::jsonb,
  constraint overlay_source_edits_status_chk check (status in ('queued', 'processing', 'committed', 'live', 'done', 'needs_manual', 'failed', 'cancelled')),
  constraint overlay_source_edits_mode_chk check (mode in ('auto_merge', 'pr_only', 'dry_run')),
  constraint overlay_source_edits_lang_chk check (lang is null or lang in ('nl', 'en')),
  constraint overlay_source_edits_len_chk check (char_length(new_text) <= 4000 and char_length(old_text) <= 4000)
);
create index if not exists overlay_source_edits_status_idx on public.overlay_source_edits (status, created_at);

alter table public.overlay_source_edits enable row level security;
drop policy if exists "Admin all overlay_source_edits" on public.overlay_source_edits;
create policy "Admin all overlay_source_edits" on public.overlay_source_edits
  for all to authenticated
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create or replace function public.overlay_source_edits_touch() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists overlay_source_edits_touch on public.overlay_source_edits;
create trigger overlay_source_edits_touch before update on public.overlay_source_edits
  for each row execute function public.overlay_source_edits_touch();

-- 3) event-driven worker ping (no polling schedule). The webhook only receives
--    a job id; the worker re-reads the job with its own service credential and
--    only processes rows in status 'queued' (which only admins can create).
create or replace function public.overlay_source_edits_notify() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform net.http_post(
    url := 'https://n8n.srv1402218.hstgr.cloud/webhook/overlay-source-sync',
    body := jsonb_build_object('job_id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json'),
    timeout_milliseconds := 5000
  );
  return new;
exception when others then
  return new; -- never block the insert; the job stays queued
end $$;
drop trigger if exists overlay_source_edits_notify on public.overlay_source_edits;
create trigger overlay_source_edits_notify after insert on public.overlay_source_edits
  for each row when (new.status = 'queued') execute function public.overlay_source_edits_notify();

-- 4) worker RPCs (service_role only)
create or replace function public.claim_overlay_source_edit(p_id uuid default null)
returns setof public.overlay_source_edits
language plpgsql security definer set search_path = public as $$
begin
  return query
  update public.overlay_source_edits e
     set status = 'processing', attempts = e.attempts + 1
   where e.id = (
     select x.id from public.overlay_source_edits x
      where x.status = 'queued' and (p_id is null or x.id = p_id)
      order by x.created_at
      limit 1
      for update skip locked)
  returning e.*;
end $$;

create or replace function public.finish_overlay_source_edit(p_id uuid, p_status text, p_fields jsonb default '{}'::jsonb)
returns public.overlay_source_edits
language plpgsql security definer set search_path = public as $$
declare
  r public.overlay_source_edits;
begin
  update public.overlay_source_edits e set
    status    = p_status,
    target    = coalesce(p_fields->>'target', e.target),
    pr_number = coalesce((p_fields->>'pr_number')::int, e.pr_number),
    pr_url    = coalesce(p_fields->>'pr_url', e.pr_url),
    branch    = coalesce(p_fields->>'branch', e.branch),
    merge_sha = coalesce(p_fields->>'merge_sha', e.merge_sha),
    live_sha  = coalesce(p_fields->>'live_sha', e.live_sha),
    error     = case when p_fields ? 'error' then p_fields->>'error' else e.error end,
    log       = e.log || jsonb_build_array(jsonb_build_object('at', now(), 'status', p_status, 'note', p_fields->>'note'))
  where e.id = p_id
  returning e.* into r;

  -- The source now renders the new text: retire the runtime override, but only
  -- if it still holds exactly this edit (a newer edit keeps its override).
  if r.id is not null and p_status = 'live' and r.element_key is not null then
    delete from public.page_overrides o
     where o.element_key = r.element_key and o.text_override = r.new_text
       and coalesce(o.style, '{}'::jsonb) = '{}'::jsonb;
    update public.page_overrides o
       set text_override = null, original_text = null
     where o.element_key = r.element_key and o.text_override = r.new_text;
  end if;
  return r;
end $$;

revoke all on function public.claim_overlay_source_edit(uuid) from public, anon, authenticated;
revoke all on function public.finish_overlay_source_edit(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.claim_overlay_source_edit(uuid) to service_role;
grant execute on function public.finish_overlay_source_edit(uuid, text, jsonb) to service_role;

-- 5) realtime for the overlay status line
do $$ begin
  alter publication supabase_realtime add table public.overlay_source_edits;
exception when duplicate_object then null; end $$;

notify pgrst, 'reload schema';
