import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/v2/rbac";
import { isValidOwnerSessionToken, OWNER_SESSION_COOKIE } from "@/lib/v2/owner-session";

const OWNER_EMAIL = String(process.env.ADMIN_EMAIL || "owner@local").trim().toLowerCase();

export function getUserRole(user) {
  return normalizeRole(user?.app_metadata?.role || user?.user_metadata?.role);
}

async function getLegacyAuthContext() {
  const cookieStore = await cookies();
  const ownerSession = cookieStore.get(OWNER_SESSION_COOKIE)?.value || "";
  const ownerAuthed = await isValidOwnerSessionToken(ownerSession);
  return {
    user: ownerAuthed
      ? { id: "owner-admin", email: OWNER_EMAIL, app_metadata: { role: "super_admin" } }
      : null,
    role: "super_admin",
  };
}

export async function getAuthContext() {
  const ownerContext = await getLegacyAuthContext();
  if (ownerContext.user) {
    return ownerContext;
  }

  if (!hasSupabaseConfig()) {
    return ownerContext;
  }

  try {
    const supabase = await createClient();
    let user = null;
    const resp = await supabase.auth.getUser();
    user = resp?.data?.user || null;
    return {
      user,
      role: getUserRole(user),
    };
  } catch (error) {
    console.error("[v2][auth] supabase auth fallback", { message: error?.message || String(error) });
    return ownerContext;
  }
}

export async function requireAuth() {
  const auth = await getAuthContext();

  if (!auth.user) {
    redirect("/v2/login");
  }

  return auth;
}
