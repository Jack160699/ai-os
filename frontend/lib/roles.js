import { canAccessNavPath, normalizeRole } from "@/lib/permissions";

export function getCurrentRole() {
  return normalizeRole(process.env.NEXT_PUBLIC_ADMIN_ROLE || process.env.ADMIN_ROLE || "admin");
}

export function getAllowedNavPathsForRole(role) {
  const normalized = normalizeRole(role);
  const all = [
    "/admin",
    "/admin/chats",
    "/admin/leads",
    "/admin/pipeline",
    "/admin/analytics",
    "/admin/automation",
    "/admin/payments",
    "/admin/team",
    "/admin/partners",
    "/admin/branding",
    "/admin/settings",
    "/admin/billing",
  ];
  return all.filter((path) => canAccessNavPath(normalized, path));
}

export function canAccessPath(role, path) {
  return canAccessNavPath(role, path);
}

export function getVisibleAdminNav(navItems, role) {
  const allow = new Set(getAllowedNavPathsForRole(role));
  return (Array.isArray(navItems) ? navItems : []).filter((item) => allow.has(item.href));
}

