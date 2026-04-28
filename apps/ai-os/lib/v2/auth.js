import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/v2/rbac";

export function getUserRole(user) {
  return normalizeRole(user?.app_metadata?.role || user?.user_metadata?.role);
}

export async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
