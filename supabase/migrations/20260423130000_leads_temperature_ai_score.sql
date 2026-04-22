-- Optional columns for Node hot-lead marking (safe if table already has them)

alter table public.leads
  add column if not exists temperature text;

alter table public.leads
  add column if not exists ai_score int default 0;
