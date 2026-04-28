export function validateLaunchEnv() {
  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const required = hasSupabase
    ? ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "BACKEND_DASHBOARD_PASSWORD"]
    : ["BACKEND_DASHBOARD_PASSWORD"];
  const missing = required.filter((key) => !process.env[key]);
  return {
    ok: missing.length === 0,
    missing,
    mode: hasSupabase ? "supabase" : "legacy_admin_cookie",
  };
}
