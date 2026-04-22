-- Phase A: structured lead memory for WhatsApp bot (phone = WhatsApp id)

create table if not exists public.lead_memory (
  phone text primary key,
  name text,
  business_type text,
  city text,
  budget_range text,
  service_interest text,
  stage text not null default 'new',
  buyer_type text,
  intent_score int not null default 0,
  last_summary text,
  last_contacted_at timestamptz,
  next_followup_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lead_memory_next_followup_idx
  on public.lead_memory (next_followup_at)
  where next_followup_at is not null;

create index if not exists lead_memory_updated_idx
  on public.lead_memory (updated_at desc);
