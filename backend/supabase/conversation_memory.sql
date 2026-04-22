-- Persistent memory for Node WhatsApp webhook (run in Supabase SQL editor or CLI)

-- Message ordering for fetchRecentMessages (default created_at)
alter table public.messages
  add column if not exists created_at timestamptz default now();

create index if not exists messages_phone_created_desc_idx
  on public.messages (phone, created_at desc);

-- Rolling summary cache (reduces tokens in main prompt)
alter table public.leads
  add column if not exists memory_summary text;

alter table public.leads
  add column if not exists memory_summary_at timestamptz;

-- Payment webhook event trail (used by Node payment domain route)
create table if not exists public.payment_events (
  id bigserial primary key,
  event text not null,
  phone text,
  amount_paise bigint,
  amount_rupees numeric,
  payment_id text,
  payment_link_id text,
  raw_event_id text,
  created_at timestamptz not null default now()
);

create index if not exists payment_events_phone_idx on public.payment_events (phone);

-- Lead timeline events
create table if not exists public.lead_events (
  id bigserial primary key,
  phone text not null,
  event_type text not null,
  event_value text,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index if not exists lead_events_phone_idx on public.lead_events (phone, created_at desc);

-- Sales opportunity state machine snapshot
create table if not exists public.sales_opportunities (
  id bigserial primary key,
  phone text unique not null,
  stage text not null default 'new',
  qualification_state text not null default 'unqualified',
  service text,
  budget numeric,
  urgency boolean default false,
  hot boolean default false,
  proposal_id text,
  source text,
  next_followup_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists sales_opportunities_followup_idx
  on public.sales_opportunities (next_followup_at);

-- Proposal records
create table if not exists public.proposals (
  id bigserial primary key,
  phone text not null,
  lead_phone text,
  title text not null,
  service text,
  scope text,
  timeline_days int,
  amount_inr numeric,
  status text not null default 'sent',
  generated_from text,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists proposals_phone_idx on public.proposals (phone, created_at desc);

-- Payment links generated from proposals or direct closes
create table if not exists public.payment_links (
  id bigserial primary key,
  phone text,
  proposal_id text,
  provider text not null default 'razorpay',
  provider_link_id text,
  short_url text,
  amount_paise bigint,
  status text not null default 'created',
  payment_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payment_links_provider_link_idx
  on public.payment_links (provider_link_id);

-- Closed/won clients and delivery kickoff projects
create table if not exists public.clients (
  id bigserial primary key,
  phone text unique not null,
  name text,
  source text,
  converted_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id bigserial primary key,
  client_id bigint,
  phone text,
  project_type text not null default 'website',
  status text not null default 'kickoff',
  started_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists projects_phone_idx on public.projects (phone, updated_at desc);

-- CEO WhatsApp bridge settings
create table if not exists public.ceo_bridge_settings (
  id text primary key,
  owner_numbers text[] not null default '{}',
  permissions text[] not null default '{}',
  updated_at timestamptz not null default now()
);

insert into public.ceo_bridge_settings (id, owner_numbers, permissions)
values (
  'default',
  '{}',
  '{"today stats","hot leads","revenue","pending followups","create task","assign lead","start ads"}'
)
on conflict (id) do nothing;

-- CEO command audit log
create table if not exists public.ceo_command_logs (
  id bigserial primary key,
  source_phone text,
  command text not null,
  intent text not null,
  status text not null,
  response_text text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ceo_command_logs_created_idx
  on public.ceo_command_logs (created_at desc);
