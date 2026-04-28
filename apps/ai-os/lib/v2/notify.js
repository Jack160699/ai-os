export async function createNotification(supabase, notification) {
  const payload = {
    user_id: notification?.user_id || null,
    type: notification?.type || "system",
    title: String(notification?.title || "Update"),
    body: notification?.body ? String(notification.body) : null,
    meta: notification?.meta || {},
  };
  await supabase.from("notifications").insert(payload);
}
