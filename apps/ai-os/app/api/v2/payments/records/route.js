import { NextResponse } from "next/server";
import { adminApiHeaders, backendBase } from "@/app/admin/_lib/backendFetch";
import { V2_ROLES } from "@/lib/v2/rbac";
import { requireApiUser, requireRateLimit, requireRole } from "@/lib/v2/server-guard";

export async function GET(request) {
  try {
    const limited = requireRateLimit(request, { namespace: "v2-payments-records", max: 45, windowMs: 60000 });
    if (limited) return limited;

    const auth = await requireApiUser(request);
    if (auth.errorResponse) return auth.errorResponse;
    const denied = requireRole(auth.role, [V2_ROLES.SUPER_ADMIN, V2_ROLES.MANAGER, V2_ROLES.FINANCE]);
    if (denied) return denied;

    const response = await fetch(`${backendBase()}/dashboard.json`, {
      cache: "no-store",
      headers: adminApiHeaders(),
      signal: AbortSignal.timeout(2500),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json({ error: payload?.error || "Could not load payment records" }, { status: 502 });
    }

    const events = Array.isArray(payload?.payment_events_recent) ? payload.payment_events_recent : [];
    const records = events.slice(0, 100).map((row) => ({
      payment_id: row?.payment_id || row?.order_id || "",
      status: String(row?.status || "unknown"),
      amount_rupees: Number(row?.amount_rupees || 0),
      reason: row?.reason || "",
      recorded_at_utc: row?.recorded_at_utc || null,
      customer_phone: row?.phone || row?.customer_phone || "",
      customer_name: row?.name || row?.customer_name || "",
      source: row?.source || (String(row?.channel || "").toLowerCase().includes("whatsapp") ? "whatsapp" : "website"),
      purpose: row?.purpose || row?.description || "Consultation",
      paid_at: row?.paid_at || null,
      created_by: row?.created_by || "system",
      link: row?.payment_link || row?.short_url || "",
    }));

    return NextResponse.json({ records }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "service_unavailable", message: error?.message || "Could not load payment records" },
      { status: 503 },
    );
  }
}
