"""Razorpay checkout order creation + signature verification."""

from __future__ import annotations

import hmac
import os
from hashlib import sha256
from typing import Any


def _first_non_empty(*names: str) -> str:
    for name in names:
        value = os.getenv(name, "").strip()
        if value:
            return value
    return ""


def _keys() -> tuple[str, str]:
    # Prefer explicit live credentials; fallback keeps older env names working.
    key_id = _first_non_empty("RAZORPAY_LIVE_KEY_ID", "RAZORPAY_KEY_ID")
    key_secret = _first_non_empty("RAZORPAY_LIVE_KEY_SECRET", "RAZORPAY_KEY_SECRET")
    return key_id, key_secret


def public_key_id() -> str:
    key_id, _ = _keys()
    return key_id


def razorpay_mode() -> str:
    key_id, _ = _keys()
    if key_id.startswith("rzp_live_"):
        return "live"
    if key_id.startswith("rzp_test_"):
        return "test"
    return "unknown"


def ensure_safe_mode() -> None:
    mode = razorpay_mode()
    app_env = os.getenv("APP_ENV", "").strip().lower()
    deployment_env = os.getenv("DEPLOY_ENV", "").strip().lower()
    is_production = app_env in {"prod", "production", "live"} or deployment_env in {"prod", "production", "live"}
    if is_production and mode != "live":
        raise RuntimeError("Unsafe Razorpay config: non-live key detected in production env.")


def _razorpay_client():
    try:
        import razorpay
    except Exception as exc:  # pragma: no cover - import error surfaced to route
        raise RuntimeError("Razorpay SDK missing. Install `razorpay` in backend env.") from exc

    key_id, key_secret = _keys()
    if not key_id or not key_secret:
        raise RuntimeError(
            "Razorpay keys missing. Set RAZORPAY_LIVE_KEY_ID and RAZORPAY_LIVE_KEY_SECRET."
        )
    ensure_safe_mode()
    return razorpay.Client(auth=(key_id, key_secret))


def create_checkout_order(amount_rupees: int) -> dict[str, Any]:
    if amount_rupees <= 0:
        raise ValueError("Amount must be greater than zero.")
    client = _razorpay_client()
    return client.order.create(
        {
            "amount": int(amount_rupees) * 100,
            "currency": "INR",
            "payment_capture": 1,
        }
    )


def verify_checkout_signature(*, order_id: str, payment_id: str, signature: str) -> bool:
    _, key_secret = _keys()
    if not key_secret:
        return False
    payload = f"{order_id}|{payment_id}".encode("utf-8")
    expected = hmac.new(key_secret.encode("utf-8"), payload, sha256).hexdigest()
    return hmac.compare_digest(expected, signature or "")
