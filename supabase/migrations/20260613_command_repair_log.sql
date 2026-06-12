-- command_repair_log — audit trail voor repair-acties vanuit /command
create table if not exists public.command_repair_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor text not null,
  action text,
  status text not null,
  detail text
);

alter table public.command_repair_log enable row level security;

-- Alleen admins lezen; insert gebeurt server-side met service role (bypassed RLS)
create policy "command_repair_log_admin_read"
  on public.command_repair_log for select
  using (public.has_role(auth.uid(), 'admin'));
