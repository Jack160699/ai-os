import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/app/admin/_lib/adminApiGate";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e) {
    console.error(e);
    return NextResponse.json({ conversations: [] });
  }

  const { data, error } = await supabase
    .from("messages")
    .select("phone, body, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json({ conversations: [] });
  }

  const map = {};
  (Array.isArray(data) ? data : []).forEach((msg) => {
    if (!msg?.phone) return;
    if (!map[msg.phone]) {
      map[msg.phone] = {
        phone: msg.phone,
        last_message: msg.body,
        updated_at: msg.created_at,
      };
    }
  });

  const conversations = Object.values(map);
  console.log("API DATA:", { conversations: conversations.length });

  return NextResponse.json({
    conversations,
  });
}
