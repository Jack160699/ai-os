import { AppShell } from "@/components/v2/app-shell";
import { requireAuth } from "@/lib/v2/auth";
import { getRoleNavItems } from "@/lib/v2/rbac";
import { logoutAction } from "@/app/v2/(protected)/actions";

export default async function V2ProtectedLayout({ children }) {
  const { user, role } = await requireAuth();
  const navItems = getRoleNavItems(role);

  return (
    <AppShell user={user} role={role} navItems={navItems} logoutAction={logoutAction}>
      {children}
    </AppShell>
  );
}
