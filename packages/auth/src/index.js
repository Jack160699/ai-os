/** Canonical admin roles for Stratxcel OS (enforce in middleware + API). */

export const ADMIN_ROLES = ["owner", "manager", "sales", "ops", "viewer"];

export function isAdminRole(value) {
  return ADMIN_ROLES.includes(String(value || "").toLowerCase());
}
