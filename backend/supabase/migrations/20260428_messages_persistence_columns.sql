-- Ensure messages persistence schema for WhatsApp chat history.
create extension if not exists pgcrypto;

alter table if exists public.messages
  add column if not exists id uuid primary key default gen_random_uuid(),
  add column if not exists phone text,
  add column if not exists text text,
  add column if not exists sender text,
  add column if not exists created_at timestamptz default now();

create index if not exists idx_messages_phone_created_at
  on public.messages (phone, created_at);
