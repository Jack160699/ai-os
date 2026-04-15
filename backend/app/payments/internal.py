"""Internal Razorpay payment processing — memory + admin WhatsApp alerts."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.config import Settings
from app.leads.admin_alerts import send_admin_payment_received
from app.memory.store import (
    append_conversion_event,
    append_lead_event,
    append_payment_event,
    append_thread_message,
    bump_revenue_total_rupees,
    get_conversation_state,
    mark_lead_payment_paid,
    normalize_phone_digits,
    set_conversation_state,
)
from app.whatsapp.messaging import send_interactive_buttons, send_whatsapp_text


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
        try:
            st_m = get_conversation_state(phone)
            cs = st_m.get("consultant_state") if isinstance(st_m, dict) else None
            if isinstance(cs, dict):
                metrics = cs.get("metrics") if isinstance(cs.get("metrics"), dict) else {}
                metrics["paid"] = int(metrics.get("paid", 0)) + 1
                cs["metrics"] = metrics
                cs["trust_phase"] = "post_payment"
                st_m["consultant_state"] = cs
                set_conversation_state(phone, st_m)
                hist = cs.get("history") if isinstance(cs.get("history"), list) else []
                append_conversion_event(
                    {
                        "date": datetime.now(timezone.utc).isoformat(),
                        "phone": phone,
                        "started": 0,
                        "cta_shown": 0,
                        "paid": 1,
                        "source": str(st_m.get("lead_source") or st_m.get("funnel_need") or cs.get("platform") or "unknown"),
                        "language": str(st_m.get("lang") or st_m.get("user_language") or "english"),
                        "path_selected": " > ".join(str(x) for x in hist[-8:]),
                    }
                )
        except Exception:
            pass

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
        body = "Payment confirmed. Thank you.\n\nYour paid diagnosis is now active."
        receipt = (
            "Receipt / Invoice\n"
            f"Payment ID: {payment_id or '-'}\n"
            f"Amount: ₹{amount_display}\n"
            "Status: SUCCESS"
        )
        welcome = (
            "Next step:\n"
            "we will identify your exact growth blocker\n"
            "and build your practical roadmap."
        )
        handoff = (
            "A senior strategist has been assigned to your case.\n"
            "You will now receive the guided handoff and session scheduling."
        )
        sched = "Quick call schedule kar lete hain —\n\naapke liye kya better hai?"
        try:
            send_whatsapp_text(settings, phone, body)
            append_thread_message(phone, "assistant", body)
            send_whatsapp_text(settings, phone, receipt)
            append_thread_message(phone, "assistant", receipt)
            send_whatsapp_text(settings, phone, welcome)
            append_thread_message(phone, "assistant", welcome)
            send_whatsapp_text(settings, phone, handoff)
            append_thread_message(phone, "assistant", handoff)
            send_interactive_buttons(
                settings,
                phone,
                sched,
                (("onb_today", "Today"), ("onb_tomorrow", "Tomorrow"), ("onb_custom", "Custom")),
            )
            append_thread_message(phone, "assistant", sched)
            st_paid = get_conversation_state(phone)
            st_paid["onboarding_step"] = "await_call_slot"
            set_conversation_state(phone, st_paid)
        except Exception as e:
            print(f"[razorpay-internal] user confirmation failed: {e}")

    print(f"[razorpay-internal] done event={event} phone={phone} payment_id={payment_id}")
    return {"ok": True, "phone": phone, "payment_id": payment_id}
