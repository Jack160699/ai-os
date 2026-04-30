/**
 * Phone + messages helpers for admin APIs (mirrors backend/services/supabase.js matching rules).
 */

export function normalizePhoneForMatch(value) {
  return String(value || "").replace(/\D/g, "");
}

export function phoneMatchesTarget(storedPhone, requestedPhone) {
  const a = normalizePhoneForMatch(storedPhone);
  const b = normalizePhoneForMatch(requestedPhone);
  if (!a || !b) return false;
  if (a === b) return true;
  const a10 = a.slice(-10);
  const b10 = b.slice(-10);
  return Boolean(a10 && b10 && a10 === b10);
}

export function canonicalPhoneKey(phone) {
  const d = normalizePhoneForMatch(phone);
  return d.length >= 10 ? d.slice(-10) : d;
}

export function messagesOrderColumn() {
  return (process.env.SUPABASE_MESSAGES_ORDER || "created_at").trim() || "created_at";
}

export function messageBodyFromRow(row) {
  return String(row?.body ?? row?.text ?? "");
}

/**
 * Newest-first rows from `messages` (bounded) for building the conversation list.
 */
export async function fetchRecentMessageRows(supabase, limit = 5000) {
  const col = messagesOrderColumn();
  const n = Math.min(5000, Math.max(1, Number.parseInt(String(limit), 10) || 5000));
  const { data, error } = await supabase
    .schema("public")
    .from("messages")
    .select("phone, body, sender, direction, created_at, id")
    .order(col, { ascending: false, nullsFirst: false })
    .limit(n);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * One row per canonical phone (last 10 digits), using first hit in desc-ordered feed = latest message.
 */
export function aggregateConversationsFromMessages(rows) {
  const byKey = new Map();
  for (const row of rows) {
    const key = canonicalPhoneKey(row.phone);
    if (!key) continue;
    if (byKey.has(key)) continue;
    byKey.set(key, {
      phone: key,
      name: key,
      temperature: "warm",
      unread: 0,
      last_message: messageBodyFromRow(row),
      last_time: row.created_at || new Date().toISOString(),
    });
  }
  const conversations = Array.from(byKey.values());
  conversations.sort((a, b) => {
    const ta = Date.parse(String(a.last_time));
    const tb = Date.parse(String(b.last_time));
    return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
  });
  return conversations;
}

/**
 * Thread for one logical number (matches stored `phone` variants).
 */
export async function fetchMessagesForPhoneThread(supabase, phoneDigits, limit = 500) {
  console.log("READ TARGET DB:", process.env.NEXT_PUBLIC_SUPABASE_URL);

  const digits = normalizePhoneForMatch(phoneDigits);
  const last10 = digits.slice(-10);
  const phoneVariants = [...new Set([phoneDigits, digits, digits ? `+${digits}` : ""].filter(Boolean))];
  const col = messagesOrderColumn();
  const n = Math.min(500, Math.max(1, Number.parseInt(String(limit), 10) || 500));

  let query = supabase
    .schema("public")
    .from("messages")
    .select("id, phone, body, sender, direction, created_at")
    .order(col, { ascending: false, nullsFirst: false })
    .limit(n);

  if (phoneVariants.length && last10) {
    query = query.or([...phoneVariants.map((v) => `phone.eq.${v}`), `phone.like.%${last10}`].join(","));
  } else if (phoneVariants.length) {
    query = query.in("phone", phoneVariants);
  }

  const { data, error } = await query;
  if (error) throw error;
  const rows = (Array.isArray(data) ? data : []).filter((r) => phoneMatchesTarget(r?.phone, digits));
  return rows.sort((a, b) => {
    const ta = Date.parse(String(a?.created_at || ""));
    const tb = Date.parse(String(b?.created_at || ""));
    const aTs = Number.isFinite(ta) ? ta : 0;
    const bTs = Number.isFinite(tb) ? tb : 0;
    return aTs - bTs;
  });
}
