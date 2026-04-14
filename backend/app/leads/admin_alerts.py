"""Structured admin WhatsApp alerts for sales automation."""

from __future__ import annotations

from typing import Any

from app.config import Settings
from app.leads.constants import OWNER_NUMBER
from app.memory.store import normalize_phone_digits
from app.whatsapp.messaging import send_whatsapp_text


def _recipients(settings: Settings, exclude_phone: str) -> list[str]:
    out: list[str] = []
    owner = normalize_phone_digits(OWNER_NUMBER)
    admin = normalize_phone_digits(settings.admin_alert_number or "")
    ex = normalize_phone_digits(exclude_phone)
    for raw in (owner, admin):
        if not raw or raw == ex:
            continue
        if raw not in out:
            out.append(raw)
    return out


def _send(settings: Settings, exclude_phone: str, body: str) -> None:
    for to in _recipients(settings, exclude_phone):
        try:
            send_whatsapp_text(settings, to, body)
        except Exception as e:
            print(f"[admin-alerts] send failed to {to}: {e}")


def send_admin_new_lead(settings: Settings, phone: str, name: str, stage: str, snippet: str) -> None:
    body = (
        "NEW LEAD:\n"
        f"Phone: +{normalize_phone_digits(phone)}\n"
        f"Intent: first contact\n"
        f"Stage: {stage}\n"
        f"Name: {name}\n"
        f"Message:\n{snippet[:400]}"
    )
    _send(settings, phone, body)


def send_admin_qualified_lead(settings: Settings, phone: str, name: str, challenge: str, stage: str) -> None:
    body = (
        "QUALIFIED LEAD:\n"
        f"Phone: +{normalize_phone_digits(phone)}\n"
        f"Name: {name}\n"
        f"Intent: qualified\n"
        f"Stage: {stage}\n"
        f"Challenge:\n{challenge[:400]}"
    )
    _send(settings, phone, body)


def send_admin_hot_lead(settings: Settings, phone: str, name: str, challenge: str) -> None:
    body = (
        "HOT LEAD:\n"
        f"Phone: +{normalize_phone_digits(phone)}\n"
        f"Name: {name}\n"
        f"Stage: HOT\n"
        f"Challenge:\n{challenge[:400]}"
    )
    _send(settings, phone, body)


def send_admin_human_required(settings: Settings, phone: str, name: str, stage: str, message: str) -> None:
    body = (
        "HUMAN REQUESTED:\n"
        f"Phone: +{normalize_phone_digits(phone)}\n"
        f"Name: {name}\n"
        f"Stage: {stage}\n"
        f"Message:\n{message[:400]}"
    )
    _send(settings, phone, body)


def send_admin_pricing_offered(
    settings: Settings,
    phone: str,
    name: str,
    requirement: str,
    quote: dict[str, Any],
) -> None:
    body = (
        "PRICING APPROVAL:\n"
        f"User: +{normalize_phone_digits(phone)} ({name})\n"
        f"Requirement:\n{requirement[:320]}\n\n"
        "AI estimate:\n"
        f"Basic ₹{quote.get('basic'):,} · Standard ₹{quote.get('standard'):,} · Premium ₹{quote.get('premium'):,}\n"
        f"Complexity: {quote.get('complexity')} · Intent: {quote.get('intent_level')}\n\n"
        "Reply from owner phone:\nAPPROVE <10-15digitphone> <rupees>\n"
        "Example: APPROVE 919876543210 49999"
    )
    _send(settings, phone, body)


def send_admin_payment_received(
    settings: Settings,
    phone: str,
    amount_display: str,
    service: str,
) -> None:
    body = (
        "PAYMENT:\n"
        f"User: +{normalize_phone_digits(phone)}\n"
        f"Amount: ₹{amount_display}\n"
        f"Service: {service}\n"
        "Status: SUCCESS"
    )
    _send(settings, phone, body)
