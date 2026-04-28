"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { clearOwnerSessionCookie } from "@/lib/v2/owner-session";

export async function logoutAction() {
  if (hasSupabaseConfig()) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore Supabase signout failures and clear local session regardless.
    }
  }
  const cookieStore = await cookies();
  clearOwnerSessionCookie(cookieStore);
  redirect("/v2/login");
}
