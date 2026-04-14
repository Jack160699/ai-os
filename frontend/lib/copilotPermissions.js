import { normalizeRole } from "@/lib/permissions";

const ROLE_ORDER = ["viewer", "agent", "manager", "finance", "admin", "owner"];

export function isOwnerRole(role) {
  return normalizeRole(role) === "owner";
}

export function isAdminLike(role) {
  const r = normalizeRole(role);
  return r === "admin" || r === "owner";
}

export function canAccessAIControl(role) {
  return isAdminLike(role);
}

export function canCopilotExecute(actionId, role) {
  const r = normalizeRole(role);
  const matrix = {
    navigate: ["viewer", "agent", "manager", "finance", "admin", "owner"],
    read_analytics: ["viewer", "agent", "manager", "finance", "admin", "owner"],
    draft_reply: ["agent", "manager", "admin", "owner"],
    manage_leads: ["agent", "manager", "admin", "owner"],
    payments: ["finance", "admin", "owner"],
    team_invite: ["manager", "admin", "owner"],
    team_delete: ["admin", "owner"],
    automation_write: ["manager", "admin", "owner"],
    branding_write: ["admin", "owner"],
    layout_change: ["manager", "admin", "owner"],
    diagnostics: ["admin", "owner"],
    custom_commands: ["admin", "owner"],
  };
  const allowed = matrix[actionId];
  if (!allowed) return isAdminLike(r);
  return allowed.includes(r);
}

export function permissionDeniedMessage(required = "Admin") {
  return `You need ${required} permission for this action.`;
}

export function roleLabel(role) {
  const r = normalizeRole(role);
  if (r === "owner") return "Owner";
  return r.charAt(0).toUpperCase() + r.slice(1);
}
