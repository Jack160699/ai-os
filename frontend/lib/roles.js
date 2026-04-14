const ROLE_ORDER = ["admin", "manager", "agent", "viewer"];

const ADMIN_NAV_BY_ROLE = {
  admin: ["/admin", "/admin/chats", "/admin/leads", "/admin/pipeline", "/admin/analytics", "/admin/automation", "/admin/settings"],
  manager: ["/admin", "/admin/chats", "/admin/leads", "/admin/pipeline", "/admin/analytics", "/admin/automation"],
  agent: ["/admin/chats", "/admin/leads", "/admin/pipeline"],
  viewer: ["/admin/analytics"],
};

function normalizeRole(value) {
  const role = String(value || "").toLowerCase().trim();
  return ROLE_ORDER.includes(role) ? role : "admin";
}

export function getCurrentRole() {
  return normalizeRole(process.env.NEXT_PUBLIC_ADMIN_ROLE || process.env.ADMIN_ROLE || "admin");
}

export function getAllowedNavPathsForRole(role) {
  const normalized = normalizeRole(role);
  return ADMIN_NAV_BY_ROLE[normalized] || ADMIN_NAV_BY_ROLE.admin;
}

export function canAccessPath(role, path) {
  return getAllowedNavPathsForRole(role).includes(path);
}

export function getVisibleAdminNav(navItems, role) {
  const allow = new Set(getAllowedNavPathsForRole(role));
  return (Array.isArray(navItems) ? navItems : []).filter((item) => allow.has(item.href));
}

