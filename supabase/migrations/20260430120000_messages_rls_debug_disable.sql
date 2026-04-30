-- DEBUG ONLY: if rows never appear for non-service-role clients, RLS may be blocking.
-- Supabase service_role JWT bypasses RLS; this still helps anon/authenticated or misconfigured keys.
-- Re-enable RLS and add proper policies before production.
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;
