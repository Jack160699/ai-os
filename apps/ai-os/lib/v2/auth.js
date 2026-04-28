import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/app/admin/_lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/v2/rbac";

const MIGRATION_ADMIN_EMAIL = (process.env.V2_LEGACY_ADMIN_EMAIL || "shriyanshchandrakar@gmail.com").toLowerCase();

export function getUserRole(user) {
  return normalizeRole(user?.app_metadata?.role || user?.user_metadata?.role);
}

async function getLegacyAuthContext() {
  const expectedPassword = process.env.ADMIN_DASHBOARD_PASSWORD || "";
  const cookieStore = await cookies();
  const legacyAuthed = !expectedPassword || cookieStore.get(AUTH_COOKIE)?.value === expectedPassword;
  return {
    user: legacyAuthed
      ? { id: "legacy-admin", email: MIGRATION_ADMIN_EMAIL, app_metadata: { role: "super_admin" } }
      : null,
    role: "super_admin",
    degraded: true,
  };
}

export async function getAuthContext() {
  if (!hasSupabaseConfig()) {
    return getLegacyAuthContext();
  }

  try {
    const supabase = await createClient();
    let user = null;
    const resp = await supabase.auth.getUser();
    user = resp?.data?.user || null;
    if (!user) {
      return getLegacyAuthContext();
    }
    return {
      user,
      role: getUserRole(user),
    };
  } catch (error) {
    console.error("[v2][auth] supabase auth fallback", { message: error?.message || String(error) });
    return getLegacyAuthContext();
  }
}

export async function requireAuth() {
  const auth = await getAuthContext();

  if (!auth.user) {
    redirect("/v2/login");
  }

  return auth;
}
