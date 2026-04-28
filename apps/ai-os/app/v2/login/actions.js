"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { isOwnerCredentialsMatch, setOwnerSessionCookie } from "@/lib/v2/owner-session";

export async function loginAction(formData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/v2/login?error=missing_credentials");
  }

  if (isOwnerCredentialsMatch(email, password)) {
    const cookieStore = await cookies();
    const ok = await setOwnerSessionCookie(cookieStore);
    if (!ok) {
      redirect("/v2/login?error=invalid_credentials");
    }
    redirect("/v2");
  }

  if (!hasSupabaseConfig()) {
    redirect("/v2/login?error=invalid_credentials");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      redirect("/v2/login?error=invalid_credentials");
    }
    redirect("/v2");
  } catch {
    redirect("/v2/login?error=invalid_credentials");
  }
}
