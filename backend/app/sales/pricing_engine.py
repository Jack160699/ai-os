"""Heuristic 3-tier pricing from requirement text (env-bounded)."""

from __future__ import annotations

import os
import re
from typing import Any


def _env_float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, str(default)).strip())
    except (TypeError, ValueError):
        return default


def _env_int(name: str, default: int) -> int:
    try:
        return int(float(os.getenv(name, str(default)).strip()))
    except (TypeError, ValueError):
        return default


def _complexity_score(text: str) -> str:
    t = (text or "").lower()
    score = 0
    if any(w in t for w in ("enterprise", "multi", "crm", "integration", "api", "automation", "scale")):
        score += 2
    if any(w in t for w in ("simple", "small", "starter", "basic", "one page")):
        score -= 1
    if len(t) > 220:
        score += 1
    if score >= 2:
        return "high"
    if score <= 0:
        return "low"
    return "medium"


def _intent_level(text: str) -> str:
    t = (text or "").lower()
    if any(w in t for w in ("urgent", "asap", "today", "now", "budget approved", "ready to pay")):
        return "high"
    if any(w in t for w in ("maybe", "later", "thinking", "explore")):
        return "low"
    return "medium"


def compute_tiered_quote(
    *,
    requirement: str,
    business_type: str = "",
    challenge: str = "",
    touch_count: int = 0,
) -> dict[str, Any]:
    """
    Returns basic / standard / premium rupee amounts (integers) within min/max,
    with margin applied via spread between tiers.
    """
    blob = " ".join(x for x in (requirement, business_type, challenge) if x).strip()
    if not blob:
        blob = "growth and automation"

    min_p = max(5_000, _env_int("SALES_MIN_PRICE_RUPEES", 25_000))
    max_p = max(min_p + 1_000, _env_int("SALES_MAX_PRICE_RUPEES", 250_000))
    margin_pct = max(5.0, min(45.0, _env_float("SALES_MARGIN_PCT", 18.0)))

    complexity = _complexity_score(blob)
    intent = _intent_level(blob)

    span = max_p - min_p
    if complexity == "high":
        anchor = min_p + int(span * 0.72)
    elif complexity == "low":
        anchor = min_p + int(span * 0.35)
    else:
        anchor = min_p + int(span * 0.52)

    if intent == "high":
        anchor = min(max_p, int(anchor * 1.08))
    elif intent == "low":
        anchor = max(min_p, int(anchor * 0.92))

    # Three tiers: basic < standard (recommended) < premium
    spread = max(2_000, int(anchor * (margin_pct / 100.0)))
    standard = int(max(min_p + spread, min(anchor, max_p - spread)))
    basic = max(min_p, int(standard - spread * 0.85))
    premium = min(max_p, int(standard + spread * 1.1))

    basic = max(min_p, min(basic, standard - 500))
    premium = max(standard + 500, min(premium, max_p))

    # Discount unlock (10–25%) on repeat / hesitation
    disc_lo = _env_int("SALES_DISCOUNT_MIN_PCT", 10)
    disc_hi = _env_int("SALES_DISCOUNT_MAX_PCT", 25)
    discount_pct = 0
    if touch_count >= 2 or re.search(r"\b(expensive|too much|not sure|hesitat|later|maybe)\b", blob, re.I):
        discount_pct = min(disc_hi, max(disc_lo, disc_lo + (touch_count - 1) * 3))

    def apply_disc(x: int) -> int:
        if not discount_pct:
            return x
        return max(min_p, int(round(x * (1 - discount_pct / 100.0))))

    return {
        "basic": apply_disc(basic),
        "standard": apply_disc(standard),
        "premium": apply_disc(premium),
        "complexity": complexity,
        "intent_level": intent,
        "discount_pct_applied": discount_pct,
        "currency": "INR",
    }


def format_pricing_message(q: dict[str, Any]) -> str:
    b, s, p = q["basic"], q["standard"], q["premium"]
    intro = "Here's a realistic estimate:\n\n"
    body = (
        f"Basic: ₹{b:,}\n"
        f"Standard: ₹{s:,} (Recommended)\n"
        f"Premium: ₹{p:,}\n\n"
        "Depends on how deep you want to go 👍\n\n"
        "Let me confirm exact pricing for you."
    )
    if q.get("discount_pct_applied"):
        body += f"\n\n(I can unlock a special price for you today 👍 — ~{q['discount_pct_applied']}% applied on the numbers above.)"
    return intro + body
