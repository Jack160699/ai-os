"""Owner / admin WhatsApp alerts for captured leads."""

from __future__ import annotations

from app.config import Settings
from app.leads.scoring import action_label_for_alert
from app.whatsapp.messaging import send_whatsapp_text


def _unique_recipients(owner_number: str, admin_number: str, sender_phone: str) -> list[str]:
    """Numbers to notify (owner + optional admin), excluding the lead sender."""
    out: list[str] = []
    for raw in (owner_number, admin_number):
        n = (raw or "").strip()
        if not n or n == sender_phone:
            continue
        if n not in out:
            out.append(n)
    return out


def format_lead_alert(payload: dict) -> str:
    """Structured single-message lead alert for WhatsApp."""
    name = payload.get("name") or "Unknown"
    phone = payload.get("phone", "")
    business = payload.get("business_type", "-")
    budget = payload.get("budget", "Not stated")
    urgency = payload.get("urgency", "Low")
    intent = payload.get("intent", "-")
    score = payload.get("intent_score", "Cold")
    summary = (payload.get("summary") or "-").strip()
    action_raw = payload.get("action", "Nurture later")
    action = action_label_for_alert(str(action_raw))

    return (
        "🔥 New Lead\n"
        f"👤 Name: {name}\n"
        f"📱 Number: {phone}\n"
        f"🏢 Business: {business}\n"
        f"💰 Budget: {budget}\n"
        f"⚡ Urgency: {urgency}\n"
        f"🎯 Intent: {intent}\n"
        f"📊 Score: {score}\n"
        f"📝 Summary: {summary}\n\n"
        f"Action: {action}"
    )


def send_lead_owner_alerts(
    settings: Settings,
    owner_number: str,
    sender_phone: str,
    payload: dict,
    *,
    is_hot: bool,
) -> None:
    """Notify owner + admin with full lead context."""
    recipients = _unique_recipients(owner_number, settings.admin_alert_number, sender_phone)
    body = format_lead_alert(payload)
    for to in recipients:
        try:
            send_whatsapp_text(settings, to, body)
            if is_hot:
                send_whatsapp_text(settings, to, "🚨 HOT LEAD - Contact now")
        except Exception as e:
            print(f"[lead-alert] send failed to {to}: {e}")
