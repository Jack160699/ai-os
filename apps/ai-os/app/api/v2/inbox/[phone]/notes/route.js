import { NextResponse } from "next/server";
import { V2_ROLES } from "@/lib/v2/rbac";
import { requireApiUser, requireRateLimit, requireRole } from "@/lib/v2/server-guard";

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

export async function POST(request, { params }) {
  try {
    const limited = requireRateLimit(request, { namespace: "v2-inbox-notes", max: 80, windowMs: 60000 });
    if (limited) return limited;

    const auth = await requireApiUser(request);
    if (auth.errorResponse) return auth.errorResponse;
    const denied = requireRole(auth.role, [V2_ROLES.SUPER_ADMIN, V2_ROLES.MANAGER, V2_ROLES.SUPPORT]);
    if (denied) return denied;
    if (!auth.supabase) {
      return NextResponse.json({ error: "setup_required", message: "Supabase is required for notes." }, { status: 503 });
    }

    const { phone } = await params;
    const digits = digitsOnly(phone);
    if (!digits) {
      return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const note = String(body?.note || "").trim();
    if (!note) {
      return NextResponse.json({ error: "note_required" }, { status: 400 });
    }

    const { error } = await auth.supabase.from("inbox_notes").insert({
      phone: digits,
      note,
      created_by: auth.user.id,
    });
    if (error) {
      return NextResponse.json({ error: error.message || "Could not add note" }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Could not add note" }, { status: 500 });
  }
}
