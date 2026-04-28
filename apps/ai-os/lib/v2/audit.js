export async function writeAuditLog(supabase, user, entry) {
  const payload = {
    actor_user_id: user?.id || null,
    actor_email: user?.email || null,
    action: entry?.action || "unknown",
    entity_type: entry?.entity_type || "unknown",
    entity_id: entry?.entity_id ? String(entry.entity_id) : null,
    payload: entry?.payload || {},
  };

  await supabase.from("audit_logs").insert(payload);
}
