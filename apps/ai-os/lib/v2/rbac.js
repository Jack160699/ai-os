export const V2_ROLES = {
  SUPER_ADMIN: "super_admin",
  MANAGER: "manager",
  SUPPORT: "support",
  FINANCE: "finance",
};

const ROUTE_ACCESS = {
  [V2_ROLES.SUPER_ADMIN]: ["/v2", "/v2/inbox", "/v2/payments", "/v2/team", "/v2/settings"],
  [V2_ROLES.MANAGER]: ["/v2", "/v2/inbox", "/v2/payments"],
  [V2_ROLES.SUPPORT]: ["/v2/inbox"],
  [V2_ROLES.FINANCE]: ["/v2/payments"],
};

export function normalizeRole(role) {
  const normalized = String(role || "").toLowerCase().trim();
  return Object.values(V2_ROLES).includes(normalized)
    ? normalized
    : V2_ROLES.SUPPORT;
}

export function canAccessRoute(role, pathname) {
  const normalizedRole = normalizeRole(role);
  const allowList = ROUTE_ACCESS[normalizedRole] || [];

  if (allowList.includes("*")) {
    return true;
  }

  return allowList.some((basePath) => {
    if (basePath === "/v2") {
      return pathname === "/v2" || pathname === "/v2/dashboard";
    }

    return pathname === basePath || pathname.startsWith(`${basePath}/`);
  });
}

export function getRoleNavItems(role) {
  const normalizedRole = normalizeRole(role);
  const allItems = [
    { label: "Dashboard", href: "/v2", icon: "grid" },
    { label: "Inbox", href: "/v2/inbox", icon: "chat" },
    { label: "Payments", href: "/v2/payments", icon: "coins" },
    { label: "Team", href: "/v2/team", icon: "users" },
    { label: "Settings", href: "/v2/settings", icon: "settings" },
  ];

  return allItems.filter((item) => canAccessRoute(normalizedRole, item.href));
}
