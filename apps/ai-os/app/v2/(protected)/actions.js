"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/app/admin/_lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export async function logoutAction() {
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, "", { maxAge: 0, path: "/" });
  redirect("/v2/login");
}
