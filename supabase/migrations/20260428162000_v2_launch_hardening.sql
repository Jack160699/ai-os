-- Phase 3 launch hardening: audit logs + notifications.

create extension if not exists "pgcrypto";

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_action_idx on public.audit_logs (action);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  type text not null check (type in ('inbox_new_message', 'payment_pending', 'task_assigned', 'system')),
  title text not null,
  body text,
  meta jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_read_idx on public.notifications (user_id, is_read, created_at desc);

alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;

create policy "audit_logs_authenticated_read"
  on public.audit_logs for select
  to authenticated
  using (true);

create policy "audit_logs_service_insert"
  on public.audit_logs for insert
  to authenticated
  with check (true);

create policy "notifications_authenticated_all"
  on public.notifications for all
  to authenticated
  using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid() or user_id is null);
