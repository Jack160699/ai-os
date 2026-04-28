"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/app/admin/_lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export async function loginAction(formData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/v2/login?error=missing_credentials");
  }

  if (!hasSupabaseConfig()) {
    const expected = process.env.ADMIN_DASHBOARD_PASSWORD || "";
    if (!expected || password !== expected) {
      redirect("/v2/login?error=invalid_credentials");
    }
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, expected, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 12,
      path: "/",
    });
    redirect("/v2");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/v2/login?error=invalid_credentials");
  }

  redirect("/v2");
}
