"""Curated WhatsApp quick-reply templates for admin / owner use."""

from __future__ import annotations

from typing import Any

TEMPLATES: list[dict[str, Any]] = [
    {
        "id": "qr_payment_nudge",
        "title": "Payment gentle nudge",
        "body": "Hi — just checking in. If the payment link didn’t open, I can resend it. Want me to send it again?",
    },
    {
        "id": "qr_book_call",
        "title": "Book strategy call",
        "body": "Happy to lock a short strategy call. What time window works best for you today or tomorrow?",
    },
    {
        "id": "qr_clarify_need",
        "title": "Clarify biggest bottleneck",
        "body": "To help fast: what is the single biggest bottleneck in your growth right now — traffic, conversion, or operations?",
    },
    {
        "id": "qr_social_proof",
        "title": "Light social proof",
        "body": "We’ve helped similar businesses tighten their funnel and recover stalled revenue. Want a quick diagnosis session to map your next step?",
    },
    {
        "id": "qr_followup_value",
        "title": "Value follow-up",
        "body": "Following up with one useful thought: small improvements in offer clarity usually lift conversions before you spend more on ads. Want me to review yours?",
    },
    {
        "id": "qr_human_handoff",
        "title": "Human handoff",
        "body": "I’m looping in a senior strategist to take this forward personally. Expect a tailored reply shortly.",
    },
]


def get_quick_reply_templates() -> list[dict[str, Any]]:
    return list(TEMPLATES)


def template_body_by_id(template_id: str) -> str | None:
    tid = (template_id or "").strip()
    for t in TEMPLATES:
        if str(t.get("id")) == tid:
            return str(t.get("body") or "").strip() or None
    return None
