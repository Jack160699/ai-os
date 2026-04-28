const REQUIRED_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "BACKEND_DASHBOARD_PASSWORD",
];

export function validateLaunchEnv() {
  const missing = REQUIRED_ENV_KEYS.filter((key) => !process.env[key]);
  return {
    ok: missing.length === 0,
    missing,
  };
}
