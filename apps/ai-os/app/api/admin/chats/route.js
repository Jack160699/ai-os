import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/app/admin/_lib/adminApiGate";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function digitsOnly(phone) {
  return String(phone || "").replace(/\D/g, "");
}

/**
 * Lists chats from `messages` only — grouped by stored `phone` (newest-first wins per key).
 */
export async function GET(request) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e) {
    return NextResponse.json(
      {
        error: "supabase_not_configured",
        message: String(e?.message || e),
        source_used: "messages_table",
        conversations: [],
      },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from("messages")
    .select("phone, body, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("DB ERROR:", error);
    return NextResponse.json({ conversations: [] });
  }

  console.log("MESSAGES FROM DB:", data);

  const map = {};
  (Array.isArray(data) ? data : []).forEach((msg) => {
    const phone = digitsOnly(msg?.phone || "");
    if (!phone) return;
    if (!map[phone]) {
      map[phone] = {
        phone,
        last_message: msg?.body || "",
        updated_at: msg?.created_at || null,
      };
    }
  });

  return NextResponse.json({
    conversations: Object.values(map),
  });
}
