-- Revenue activation: proposals, payment links (Razorpay-ready), optional alert audit

create table if not exists public.proposal_templates (
  id uuid primary key default gen_random_uuid(),
  reset_batch_id uuid not null,
  name text not null,
  subject text,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists proposal_templates_batch_idx on public.proposal_templates (reset_batch_id);
create unique index if not exists proposal_templates_batch_name_uid on public.proposal_templates (reset_batch_id, name);

create table if not exists public.payment_links (
  id uuid primary key default gen_random_uuid(),
  reset_batch_id uuid not null,
  lead_id uuid not null references public.leads (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete set null,
  amount_minor bigint not null,
  currency text not null default 'INR',
  status text not null default 'pending' check (status in ('pending', 'paid', 'partially_paid', 'expired', 'cancelled')),
  provider text not null default 'razorpay',
  provider_ref text,
  checkout_url text not null,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  expires_at timestamptz,
  last_synced_at timestamptz
);

create index if not exists payment_links_batch_idx on public.payment_links (reset_batch_id);
create index if not exists payment_links_lead_idx on public.payment_links (lead_id);
create index if not exists payment_links_status_idx on public.payment_links (status);

alter table public.proposal_templates enable row level security;
alter table public.payment_links enable row level security;

create policy "proposal_templates_authenticated_all"
  on public.proposal_templates for all
  to authenticated
  using (true) with check (true);

create policy "payment_links_authenticated_all"
  on public.payment_links for all
  to authenticated
  using (true) with check (true);

insert into public.proposal_templates (reset_batch_id, name, subject, body)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'Short scope + next step',
    'Proposal — {{full_name}}',
    'Hi {{full_name}},\n\nThanks for the context. Here''s the tight scope we discussed + pricing. If this looks right, reply YES and I''ll send the payment link.\n\n— Team'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Formal proposal',
    'Proposal document — {{full_name}}',
    'Hi {{full_name}},\n\nAttached is the formal proposal (timeline, deliverables, commercials). Two open questions:\n1) Start date preference?\n2) Billing entity details?\n\nOnce confirmed, we''ll issue the invoice / payment link.\n\n— Team'
  )
on conflict (reset_batch_id, name) do nothing;
