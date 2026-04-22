alter table public.lead_memory
  add column if not exists last_followup_sent_at timestamptz;
