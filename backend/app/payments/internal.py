"""Internal Razorpay payment processing — memory + admin WhatsApp alerts."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.config import Settings
from app.leads.admin_alerts import send_admin_payment_received
from app.memory.store import (
    append_lead_event,
    append_payment_event,
    append_thread_message,
    bump_revenue_total_rupees,
    get_conversation_state,
    mark_lead_payment_paid,
    normalize_phone_digits,
)
from app.whatsapp.messaging import send_whatsapp_text


def process_razorpay_internal(settings: Settings, data: dict[str, Any]) -> dict[str, Any]:
    phone = normalize_phone_digits(str(data.get("phone") or ""))
    payment_id = str(data.get("payment_id") or "")
    plink = str(data.get("payment_link_id") or "")
    event = str(data.get("event") or "")
    amount_rupees = data.get("amount_rupees")

    try:
        if amount_rupees is not None and str(amount_rupees).strip() != "":
            amount_display = f"{float(amount_rupees):.2f}".rstrip("0").rstrip(".")
            amt_f = float(amount_rupees)
        else:
            amount_display = "-"
            amt_f = 0.0
    except (TypeError, ValueError):
        amount_display = str(amount_rupees)
        amt_f = 0.0

    info: dict[str, Any] = {
        "payment_id": payment_id,
        "payment_link_id": plink,
        "amount_rupees": amount_rupees,
        "event": event,
    }

    service = "StratXcel"
    if phone:
        st0 = get_conversation_state(phone)
        service = f"StratXcel — {st0.get('business_type', 'Service')}"

    if phone:
        mark_lead_payment_paid(phone, info)
        print(f"[razorpay-internal] lead_status=PAID phone={phone}")

    append_payment_event({"phone": phone or None, **info})

    if phone and amt_f > 0:
        bump_revenue_total_rupees(amt_f)

    if phone:
        append_lead_event(
            {
                "type": "payment_captured",
                "phone": phone,
                "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                "amount_rupees": amt_f,
                "payment_id": payment_id,
                "payment_link_id": plink,
                "event": event,
            }
        )

    send_admin_payment_received(settings, phone or "", amount_display, service)

    if phone:
        body = (
            "Payment received successfully ✅\n\n"
            "Welcome onboard 🚀"
        )
        try:
            send_whatsapp_text(settings, phone, body)
            append_thread_message(phone, "assistant", body)
        except Exception as e:
            print(f"[razorpay-internal] user confirmation failed: {e}")

    print(f"[razorpay-internal] done event={event} phone={phone} payment_id={payment_id}")
    return {"ok": True, "phone": phone, "payment_id": payment_id}
