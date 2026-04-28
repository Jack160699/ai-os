"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/app/admin/_lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/server";

const MIGRATION_ADMIN_EMAIL = (process.env.V2_LEGACY_ADMIN_EMAIL || "shriyanshchandrakar@gmail.com").toLowerCase();

async function loginWithLegacyCookie(password) {
  const expected = process.env.ADMIN_DASHBOARD_PASSWORD || "";
  if (!expected || password !== expected) {
    return false;
  }
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, expected, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/",
  });
  return true;
}

export async function loginAction(formData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const normalizedEmail = email.toLowerCase();

  if (!email || !password) {
    redirect("/v2/login?error=missing_credentials");
  }

  if (!hasSupabaseConfig()) {
    const ok = await loginWithLegacyCookie(password);
    if (!ok) {
      redirect("/v2/login?error=invalid_credentials");
    }
    redirect("/v2");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const canUseMigrationFallback = normalizedEmail === MIGRATION_ADMIN_EMAIL;
    if (canUseMigrationFallback) {
      const ok = await loginWithLegacyCookie(password);
      if (ok) {
        redirect("/v2");
      }
    }
    redirect("/v2/login?error=invalid_credentials");
  }

  redirect("/v2");
}
