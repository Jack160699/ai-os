import { assertAdminRequest } from "@/app/admin/_lib/adminApiGate";
import { adminApiHeaders, backendBase } from "@/app/admin/_lib/backendFetch";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  let body = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  try {
    const res = await fetch(`${backendBase()}/api/payment-notes`, {
      method: "POST",
      headers: adminApiHeaders(),
      body: JSON.stringify({
        payment_id: body?.payment_id,
        note: body?.note,
        refund_status: body?.refund_status,
        author: "admin_ui",
      }),
      cache: "no-store",
    });
    const text = await res.text().catch(() => "");
    const payload = text ? JSON.parse(text) : {};
    if (!res.ok) {
      return Response.json({ ok: false, error: payload?.error || "refund_note_failed" }, { status: res.status });
    }
    return Response.json({ ok: true, note: payload?.note || null }, { status: 200 });
  } catch (e) {
    return Response.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

