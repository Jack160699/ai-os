"""Conversation sales stages (parallel to legacy funnel `step`)."""

from __future__ import annotations

# Funnel stages for analytics + automation (do not replace `step` keys in lead_flow).
NEW = "NEW"
ENGAGED = "ENGAGED"
QUALIFYING = "QUALIFYING"
QUALIFIED = "QUALIFIED"
PRICING_PENDING = "PRICING_PENDING"
PRICING_OFFERED = "PRICING_OFFERED"
HOT = "HOT"
PAYMENT_PENDING = "PAYMENT_PENDING"
PAID = "PAID"
CALL_INTENT = "CALL_INTENT"
CALL_BOOKED = "CALL_BOOKED"
HUMAN_REQUIRED = "HUMAN_REQUIRED"
CLOSED = "CLOSED"


def sync_sales_stage_from_step(state: dict) -> str:
    """Best-effort map legacy step → sales_stage when not overridden."""
    step = str(state.get("step", "start"))
    ls = str(state.get("lead_status", "") or "").lower()
    if ls == "paid" or state.get("sales_stage") == PAID:
        return PAID
    if state.get("human_required"):
        return HUMAN_REQUIRED
    if step == "start":
        return NEW
    if step == "await_business":
        return QUALIFYING
    if step == "await_challenge":
        return QUALIFYING
    if step in {"await_booking_answer", "await_preferred_time"}:
        return ENGAGED
    if step == "await_no_option":
        return QUALIFIED
    if step == "complete":
        if ls == "booked":
            return CALL_BOOKED
        return CLOSED
    return state.get("sales_stage") or ENGAGED


def merge_sales_stage(state: dict, explicit: str | None = None) -> dict:
    out = {**state}
    out["sales_stage"] = explicit or sync_sales_stage_from_step(out)
    return out
