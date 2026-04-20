import { NextResponse } from "next/server";
import { getResetBatchId } from "@/lib/batch";
import { runInboxAssistant, type InboxAiMode } from "@/lib/ai/inbox-assistant";
import type { Message } from "@/lib/models";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const conversationId = typeof body === "object" && body && "conversationId" in body ? String((body as { conversationId: unknown }).conversationId) : "";
  const mode = typeof body === "object" && body && "mode" in body ? String((body as { mode: unknown }).mode) : "";
  if (!conversationId || !mode) {
    return NextResponse.json({ error: "conversationId and mode are required" }, { status: 400 });
  }

  const allowed: InboxAiMode[] = ["summarize", "suggest_reply", "hot_detection"];
  if (!allowed.includes(mode as InboxAiMode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const batchId = await getResetBatchId();
  const { data: conv, error: cErr } = await supabase
    .from("conversations")
    .select("id, reset_batch_id, lead_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
  if (!conv || conv.reset_batch_id !== batchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: lead, error: lErr } = await supabase.from("leads").select("full_name").eq("id", conv.lead_id).maybeSingle();
  if (lErr) return NextResponse.json({ error: lErr.message }, { status: 500 });
  const leadName = String(lead?.full_name ?? "Lead");

  const { data: messages, error: mErr } = await supabase
    .from("messages")
    .select("*")
    .eq("reset_batch_id", batchId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

  const result = await runInboxAssistant({
    mode: mode as InboxAiMode,
    leadName,
    messages: (messages ?? []) as Message[],
  });

  return NextResponse.json({
    text: result.text,
    temperature: result.temperature ?? null,
    rationale: result.rationale ?? null,
  });
}
