"""Create Razorpay payment links from Flask (same account as Next.js integration)."""

from __future__ import annotations

import base64
import json
import os
from typing import Any

import requests


def _keys() -> tuple[str, str]:
    kid = os.getenv("RAZORPAY_KEY_ID", "").strip()
    sec = os.getenv("RAZORPAY_KEY_SECRET", "").strip()
    return kid, sec


def create_payment_link_http(
    *,
    amount_rupees: float,
    name: str,
    phone_digits: str,
    description: str,
    email: str,
) -> dict[str, Any]:
    kid, sec = _keys()
    if not kid or not sec:
        raise RuntimeError("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set on bot host")

    paise = max(100, int(round(float(amount_rupees) * 100)))
    auth = base64.b64encode(f"{kid}:{sec}".encode()).decode()
    contact = f"+{phone_digits}" if not phone_digits.startswith("+") else phone_digits

    em = (email or os.getenv("RAZORPAY_CUSTOMER_EMAIL_FALLBACK", "") or "").strip()
    if "@" not in em:
        raise RuntimeError("Customer email required: set RAZORPAY_CUSTOMER_EMAIL_FALLBACK for bot-side links")

    body = {
        "amount": paise,
        "currency": "INR",
        "accept_partial": False,
        "description": (description or "StratXcel")[:250],
        "customer": {"name": name[:120], "contact": contact, "email": em},
        "notify": {"sms": True, "email": os.getenv("RAZORPAY_NOTIFY_EMAIL", "").strip() == "1"},
        "reminder_enable": True,
        "notes": {"stratxcel_phone": phone_digits, "stratxcel_name": name[:80]},
    }

    r = requests.post(
        "https://api.razorpay.com/v1/payment_links",
        headers={"Authorization": f"Basic {auth}", "Content-Type": "application/json"},
        data=json.dumps(body),
        timeout=30,
    )
    if not r.ok:
        raise RuntimeError((r.text or r.reason or "razorpay_error")[:500])
    data = r.json()
    return {"short_url": data.get("short_url"), "id": data.get("id"), "amount_paise": paise}
