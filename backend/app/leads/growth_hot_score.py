"""Numeric hot-lead score (0–100) for growth prioritization — combines funnel signals + recency."""

from __future__ import annotations

from datetime import datetime, timezone

from app.leads.analytics import parse_iso


def _metrics(st: dict) -> dict:
    cs = st.get("consultant_state")
    if isinstance(cs, dict) and isinstance(cs.get("metrics"), dict):
        return cs["metrics"]
    return {}


def compute_growth_hot_score(st: dict) -> dict[str, object]:
    """
    Higher score = more likely to convert soon.
    Factors: payment pending, CTA shown, pain known, intent label, recency, human signals.
    """
    score = 0
    factors: list[str] = []

    sales = str(st.get("sales_stage", "") or "").upper()
    if sales == "PAYMENT_PENDING":
        score += 32
        factors.append("payment_pending")
    if str(st.get("funnel_stage", "")) == "payment_pending":
        score += 8
        factors.append("funnel_payment_pending")

    m = _metrics(st)
    if int(m.get("cta_shown", 0) or 0) > 0:
        score += 14
        factors.append("cta_shown")
    if int(m.get("pain_identified", 0) or 0) > 0 or st.get("challenge") or st.get("pain_point"):
        score += 12
        factors.append("pain_identified")

    intent = str(st.get("intent_score", "") or "").strip().lower()
    if intent == "hot":
        score += 22
        factors.append("intent_hot")
    elif intent == "warm":
        score += 10
        factors.append("intent_warm")

    urgency = str(st.get("urgency", "") or "").lower()
    if any(x in urgency for x in ("high", "urgent", "asap", "today")):
        score += 10
        factors.append("urgency_high")

    if st.get("last_payment_link_url"):
        score += 6
        factors.append("has_payment_link")

    lr = parse_iso(str(st.get("last_user_reply_at", "") or ""))
    if lr:
        age_h = (datetime.now(timezone.utc) - lr).total_seconds() / 3600.0
        if age_h < 2:
            score += 14
            factors.append("replied_recent")
        elif age_h < 24:
            score += 8
            factors.append("replied_today")

    unread = int(st.get("inbox_unread", 0) or 0)
    if unread > 0:
        score += min(6, unread * 2)
        factors.append("unread_messages")

    score = max(0, min(100, int(score)))

    if score >= 72:
        label = "Blazing"
    elif score >= 52:
        label = "Hot"
    elif score >= 32:
        label = "Warm"
    else:
        label = "Nurture"

    return {"growth_score": score, "growth_label": label, "growth_factors": factors}
