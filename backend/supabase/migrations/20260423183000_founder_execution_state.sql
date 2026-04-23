create extension if not exists pgcrypto;

create table if not exists public.founder_execution_state (
  id uuid primary key default gen_random_uuid(),
  owner_phone text unique not null,
  active_focus text,
  selected_direction text,
  plan jsonb,
  progress_percent int not null default 0,
  waiting_for_update boolean not null default false,
  last_action_at timestamptz not null default now(),
  next_reminder_at timestamptz,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists founder_execution_state_updated_idx
  on public.founder_execution_state (updated_at desc);

create index if not exists founder_execution_state_reminder_idx
  on public.founder_execution_state (next_reminder_at)
  where waiting_for_update = true;
