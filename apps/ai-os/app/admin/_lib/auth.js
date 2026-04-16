import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const AUTH_COOKIE = "sx_site_admin_auth";

export async function getAdminAuthState() {
  const expectedPassword = process.env.ADMIN_DASHBOARD_PASSWORD || "";
  const cookieStore = await cookies();
  const authed = !expectedPassword || cookieStore.get(AUTH_COOKIE)?.value === expectedPassword;
  return { expectedPassword, authed };
}

export async function requireAdminAuth() {
  const { authed } = await getAdminAuthState();
  if (!authed) redirect("/admin");
}

export async function loginAction(formData) {
  "use server";
  const expected = process.env.ADMIN_DASHBOARD_PASSWORD || "";
  const submitted = String(formData.get("password") || "").trim();
  if (expected && submitted === expected) {
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, expected, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 12,
      path: "/",
    });
  }
  redirect("/admin");
}

export async function logoutAction() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, "", { maxAge: 0, path: "/" });
  redirect("/admin");
}
