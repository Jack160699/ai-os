-- V2 production tables for team management and inbox metadata.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- team_members: internal role + active status mapped to auth.users
-- ---------------------------------------------------------------------------
create table if not exists public.team_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'support' check (role in ('super_admin', 'manager', 'support', 'finance')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists team_members_role_idx on public.team_members (role);
create index if not exists team_members_active_idx on public.team_members (is_active);

-- ---------------------------------------------------------------------------
-- inbox_assignments: current owner per WhatsApp phone
-- ---------------------------------------------------------------------------
create table if not exists public.inbox_assignments (
  phone text primary key,
  assigned_user_id uuid references auth.users (id) on delete set null,
  assigned_name text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- inbox_tags: lightweight tags per conversation
-- ---------------------------------------------------------------------------
create table if not exists public.inbox_tags (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  tag text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (phone, tag)
);

create index if not exists inbox_tags_phone_idx on public.inbox_tags (phone, created_at desc);

-- ---------------------------------------------------------------------------
-- inbox_notes: internal notes per conversation
-- ---------------------------------------------------------------------------
create table if not exists public.inbox_notes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  note text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists inbox_notes_phone_idx on public.inbox_notes (phone, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists team_members_set_updated_at on public.team_members;
create trigger team_members_set_updated_at
before update on public.team_members
for each row execute function public.set_updated_at();

drop trigger if exists inbox_assignments_set_updated_at on public.inbox_assignments;
create trigger inbox_assignments_set_updated_at
before update on public.inbox_assignments
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.team_members enable row level security;
alter table public.inbox_assignments enable row level security;
alter table public.inbox_tags enable row level security;
alter table public.inbox_notes enable row level security;

create policy "team_members_authenticated_all"
  on public.team_members for all
  to authenticated
  using (true) with check (true);

create policy "inbox_assignments_authenticated_all"
  on public.inbox_assignments for all
  to authenticated
  using (true) with check (true);

create policy "inbox_tags_authenticated_all"
  on public.inbox_tags for all
  to authenticated
  using (true) with check (true);

create policy "inbox_notes_authenticated_all"
  on public.inbox_notes for all
  to authenticated
  using (true) with check (true);
