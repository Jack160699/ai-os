-- Phase D: analytics tables + CEO default permission (run on existing Supabase projects)

create index if not exists lead_events_type_created_idx
  on public.lead_events (event_type, created_at desc);

create table if not exists public.conversion_metrics (
  id bigserial primary key,
  period_start timestamptz not null,
  period_end timestamptz not null,
  scope text not null default 'global',
  metric_key text not null,
  metric_value numeric,
  dimensions jsonb,
  created_at timestamptz not null default now()
);

create index if not exists conversion_metrics_period_idx
  on public.conversion_metrics (period_start desc, metric_key);

create table if not exists public.prompt_performance (
  id bigserial primary key,
  phone text not null,
  reply_excerpt text,
  buyer_type text,
  intent_score int,
  niche text,
  language text,
  cta_used text,
  response_style text,
  is_first_reply boolean not null default false,
  source text not null default 'whatsapp_bot',
  outcome_hint text,
  created_at timestamptz not null default now()
);

create index if not exists prompt_performance_created_idx
  on public.prompt_performance (created_at desc);

-- Append weekly report permission for existing installs (text[] column)
update public.ceo_bridge_settings
set permissions = array_append(permissions, 'weekly optimization report')
where id = 'default'
  and not ('weekly optimization report' = any (permissions));
