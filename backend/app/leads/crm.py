from __future__ import annotations

from datetime import datetime, timezone

import requests

from app.config import Settings


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def build_lead_payload(
    phone: str,
    business_type: str,
    pain_point: str,
    intent: str,
    preferred_time: str,
    **extra: object,
) -> dict:
    payload = {
        "phone": phone,
        "business_type": business_type,
        "pain_point": pain_point,
        "intent": intent,
        "preferred_time": preferred_time,
        "timestamp_utc": utc_now_iso(),
    }
    for k, v in extra.items():
        if v is not None and v != "":
            payload[k] = v
    return payload


def send_to_google_sheets(settings: Settings, payload: dict) -> None:
    """Post lead payload to a Google Apps Script / webhook endpoint."""
    if not settings.google_sheets_webhook_url:
        print("[lead-crm] GOOGLE_SHEETS_WEBHOOK_URL not set; skipping lead sync.")
        return

    try:
        resp = requests.post(settings.google_sheets_webhook_url, json=payload, timeout=20)
        print(f"[lead-crm] sheets status={resp.status_code} body={resp.text[:300]}")
    except Exception as e:
        print(f"[lead-crm] sheets sync error: {e}")
