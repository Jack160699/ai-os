import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/app/admin/_lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/v2/rbac";

export function getUserRole(user) {
  return normalizeRole(user?.app_metadata?.role || user?.user_metadata?.role);
}

export async function getAuthContext() {
  if (!hasSupabaseConfig()) {
    const expectedPassword = process.env.ADMIN_DASHBOARD_PASSWORD || "";
    const cookieStore = await cookies();
    const legacyAuthed = !expectedPassword || cookieStore.get(AUTH_COOKIE)?.value === expectedPassword;
    return {
      user: legacyAuthed ? { id: "legacy-admin", email: "admin@local", app_metadata: { role: "super_admin" } } : null,
      role: "super_admin",
    };
  }

  const supabase = await createClient();
  let user = null;
  try {
    const resp = await supabase.auth.getUser();
    user = resp?.data?.user || null;
  } catch {
    user = null;
  }

  return {
    user,
    role: getUserRole(user),
  };
}

export async function requireAuth() {
  const auth = await getAuthContext();

  if (!auth.user) {
    redirect("/v2/login");
  }

  return auth;
}
