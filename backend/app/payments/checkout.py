"""Razorpay checkout order creation + signature verification."""

from __future__ import annotations

import hmac
import os
from hashlib import sha256
from typing import Any


def _keys() -> tuple[str, str]:
    key_id = os.getenv("RAZORPAY_KEY_ID", "").strip()
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "").strip()
    return key_id, key_secret


def _razorpay_client():
    try:
        import razorpay
    except Exception as exc:  # pragma: no cover - import error surfaced to route
        raise RuntimeError("Razorpay SDK missing. Install `razorpay` in backend env.") from exc

    key_id, key_secret = _keys()
    if not key_id or not key_secret:
        raise RuntimeError("Razorpay keys missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.")
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
