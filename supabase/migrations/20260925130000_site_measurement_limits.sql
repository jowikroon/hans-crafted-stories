-- Abuse limits on the two tables the public site writes to with the publishable key
-- (applied to production 2026-10-06). Rows over a limit are dropped silently (the trigger
-- returns NULL), so a flood costs the sender requests, not our storage or inbox.

create or replace function public.site_events_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- one visit (one tab) never needs more than 400 events
  if (select count(*) from site_events where visit_id = new.visit_id) >= 400 then return null; end if;
  -- site-wide ceiling: ~100x today's peak traffic
  if (select count(*) from site_events where ts > now() - interval '1 minute') >= 3000 then return null; end if;
  return new;
end $$;
drop trigger if exists site_events_limit on public.site_events;
create trigger site_events_limit before insert on public.site_events for each row execute function public.site_events_limit();

create or replace function public.contact_submissions_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from contact_submissions where lower(email) = lower(new.email) and created_at > now() - interval '1 hour') >= 3
     or (select count(*) from contact_submissions where created_at > now() - interval '1 hour') >= 30 then
    return null;
  end if;
  return new;
end $$;
drop trigger if exists contact_submissions_limit on public.contact_submissions;
create trigger contact_submissions_limit before insert on public.contact_submissions for each row execute function public.contact_submissions_limit();

revoke execute on function public.site_events_limit() from public, anon, authenticated;
revoke execute on function public.contact_submissions_limit() from public, anon, authenticated;
