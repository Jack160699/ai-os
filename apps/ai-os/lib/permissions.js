const ROLE_ORDER = ["owner", "admin", "manager", "agent", "finance", "viewer"];

const NAV_ACCESS = {
  "/admin": ["owner", "admin", "manager"],
  "/admin/chats": ["owner", "admin", "manager", "agent"],
  "/admin/leads": ["owner", "admin", "manager", "agent"],
  "/admin/pipeline": ["owner", "admin", "manager"],
  "/admin/analytics": ["owner", "admin", "manager", "viewer"],
  "/admin/automation": ["owner", "admin", "manager"],
  "/admin/payments": ["owner", "admin", "finance"],
  "/admin/team": ["owner", "admin", "manager"],
  "/admin/partners": ["owner", "admin", "manager"],
  "/admin/branding": ["owner", "admin"],
  "/admin/settings": ["owner", "admin"],
  "/admin/billing": ["owner", "admin", "finance"],
  "/admin/my-ai": ["owner", "admin", "manager", "agent", "finance", "viewer"],
  "/admin/ai-control": ["owner", "admin"],
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

