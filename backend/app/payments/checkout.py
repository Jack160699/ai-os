"""Razorpay checkout order creation + signature verification."""

from __future__ import annotations

import hmac
import os
from hashlib import sha256
from typing import Any

_CONFIG_LOGGED = False


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


def _is_production_env() -> bool:
    candidates = (
        os.getenv("APP_ENV", ""),
        os.getenv("DEPLOY_ENV", ""),
        os.getenv("FLASK_ENV", ""),
        os.getenv("NODE_ENV", ""),
        os.getenv("VERCEL_ENV", ""),
        os.getenv("ENVIRONMENT", ""),
    )
    normalized = {str(v).strip().lower() for v in candidates if str(v).strip()}
    return bool(normalized.intersection({"prod", "production", "live"}))


def _mask_secret(value: str, head: int = 8, tail: int = 3) -> str:
    if not value:
        return "(empty)"
    if len(value) <= head + tail + 3:
        return f"(set,len={len(value)})"
    return f"{value[:head]}...{value[-tail:]} (len={len(value)})"


def _log_checkout_config_once() -> None:
    global _CONFIG_LOGGED
    if _CONFIG_LOGGED:
        return
    _CONFIG_LOGGED = True
    live_id = os.getenv("RAZORPAY_LIVE_KEY_ID", "").strip()
    live_secret = os.getenv("RAZORPAY_LIVE_KEY_SECRET", "").strip()
    fallback_id = os.getenv("RAZORPAY_KEY_ID", "").strip()
    fallback_secret = os.getenv("RAZORPAY_KEY_SECRET", "").strip()
    key_id, key_secret = _keys()
    id_source = "RAZORPAY_LIVE_KEY_ID" if live_id else ("RAZORPAY_KEY_ID" if fallback_id else "(missing)")
    secret_source = (
        "RAZORPAY_LIVE_KEY_SECRET" if live_secret else ("RAZORPAY_KEY_SECRET" if fallback_secret else "(missing)")
    )
    print(
        "[razorpay-checkout-config] "
        f"id_source={id_source} secret_source={secret_source} mode={razorpay_mode()} "
        f"key_id={_mask_secret(key_id)} key_secret={_mask_secret(key_secret)}"
    )


def public_key_id() -> str:
    ensure_safe_mode()
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
    is_production = _is_production_env()
    if is_production and mode != "live":
        raise RuntimeError("Unsafe Razorpay config: non-live key detected in production env.")


def _razorpay_client():
    _log_checkout_config_once()
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
