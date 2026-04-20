-- StratXcel OS core schema. All domain rows are scoped by reset_batch_id for campaign resets.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- pipeline_stages
-- ---------------------------------------------------------------------------
create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  reset_batch_id uuid not null,
  stage_key text not null,
  label text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (reset_batch_id, stage_key)
);

create index if not exists pipeline_stages_batch_idx on public.pipeline_stages (reset_batch_id);

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  reset_batch_id uuid not null,
  pipeline_stage_id uuid not null references public.pipeline_stages (id) on delete restrict,
  full_name text not null,
  phone text,
  source text,
  ai_score int not null default 0 check (ai_score between 0 and 100),
  temperature text not null default 'warm' check (temperature in ('hot', 'warm', 'cold')),
  estimated_value_cents bigint not null default 0,
  has_unreplied boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_batch_idx on public.leads (reset_batch_id);
create index if not exists leads_stage_idx on public.leads (pipeline_stage_id);
create index if not exists leads_hot_idx on public.leads (reset_batch_id) where temperature = 'hot' and archived = false;

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  reset_batch_id uuid not null,
  lead_id uuid not null references public.leads (id) on delete cascade,
  channel text not null default 'whatsapp',
  archived boolean not null default false,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists conversations_batch_idx on public.conversations (reset_batch_id);
create index if not exists conversations_lead_idx on public.conversations (lead_id);
create index if not exists conversations_last_msg_idx on public.conversations (last_message_at desc);

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  reset_batch_id uuid not null,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  body text not null,
  direction text not null check (direction in ('in', 'out')),
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);
create index if not exists messages_batch_idx on public.messages (reset_batch_id);

-- ---------------------------------------------------------------------------
-- activities (AI insights, notes, system events)
-- ---------------------------------------------------------------------------
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  reset_batch_id uuid not null,
  lead_id uuid references public.leads (id) on delete set null,
  kind text not null,
  summary text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activities_batch_idx on public.activities (reset_batch_id);
create index if not exists activities_lead_idx on public.activities (lead_id);

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

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS (authenticated internal tool)
-- ---------------------------------------------------------------------------
alter table public.pipeline_stages enable row level security;
alter table public.leads enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.activities enable row level security;

create policy "pipeline_stages_authenticated_all"
  on public.pipeline_stages for all
  to authenticated
  using (true) with check (true);

create policy "leads_authenticated_all"
  on public.leads for all
  to authenticated
  using (true) with check (true);

create policy "conversations_authenticated_all"
  on public.conversations for all
  to authenticated
  using (true) with check (true);

create policy "messages_authenticated_all"
  on public.messages for all
  to authenticated
  using (true) with check (true);

create policy "activities_authenticated_all"
  on public.activities for all
  to authenticated
  using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Realtime (optional — enable in dashboard if desired)
-- ---------------------------------------------------------------------------
-- alter publication supabase_realtime add table public.messages;

-- ---------------------------------------------------------------------------
-- Seed default batch + stages (matches DEFAULT_RESET_BATCH_ID in app)
-- ---------------------------------------------------------------------------
insert into public.pipeline_stages (reset_batch_id, stage_key, label, sort_order)
values
  ('00000000-0000-0000-0000-000000000001', 'new', 'New', 10),
  ('00000000-0000-0000-0000-000000000001', 'qualified', 'Qualified', 20),
  ('00000000-0000-0000-0000-000000000001', 'proposal', 'Proposal', 30),
  ('00000000-0000-0000-0000-000000000001', 'negotiation', 'Negotiation', 40),
  ('00000000-0000-0000-0000-000000000001', 'won', 'Won', 50),
  ('00000000-0000-0000-0000-000000000001', 'lost', 'Lost', 60)
on conflict (reset_batch_id, stage_key) do nothing;
