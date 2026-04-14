const ROLE_ORDER = ["admin", "manager", "agent", "finance", "viewer"];

const NAV_ACCESS = {
  "/admin": ["admin", "manager"],
  "/admin/chats": ["admin", "manager", "agent"],
  "/admin/leads": ["admin", "manager", "agent"],
  "/admin/pipeline": ["admin", "manager"],
  "/admin/analytics": ["admin", "manager", "viewer"],
  "/admin/automation": ["admin", "manager"],
  "/admin/payments": ["admin", "finance"],
  "/admin/team": ["admin", "manager"],
  "/admin/partners": ["admin", "manager"],
  "/admin/branding": ["admin"],
  "/admin/settings": ["admin"],
  "/admin/billing": ["admin", "finance"],
};

export function normalizeRole(value) {
  const role = String(value || "").toLowerCase().trim();
  return ROLE_ORDER.includes(role) ? role : "admin";
}

export function canAccessNavPath(role, path) {
  const normalized = normalizeRole(role);
  const allow = NAV_ACCESS[path];
  if (!allow) return normalized === "admin";
  return allow.includes(normalized);
}

export function getVisibleAdminNavByPermissions(navItems, role) {
  const normalized = normalizeRole(role);
  return (Array.isArray(navItems) ? navItems : []).filter((item) => canAccessNavPath(normalized, item.href));
}

