"""High-priority sales intercepts (human, pricing, payment) before standard lead_flow steps."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from app.leads.admin_alerts import send_admin_human_required, send_admin_pricing_offered
from app.memory.store import normalize_phone_digits, set_conversation_state
from app.sales import states as S
from app.sales.intent import wants_buy, wants_call_phrase, wants_human, wants_pricing
from app.sales.pricing_engine import compute_tiered_quote, format_pricing_message
from app.sales.razorpay_link import create_payment_link_http

if TYPE_CHECKING:
    from app.config import Settings
    from app.whatsapp.lead_flow import LeadFlowReply


def _bump_touch(state: dict) -> dict:
    n = int(state.get("sales_touch_count") or 0) + 1
    return {**state, "sales_touch_count": n}


def try_handle(
    settings: "Settings",
    sender: str,
    message: str,
    state: dict,
    display_name: str,
) -> "LeadFlowReply | None":
    """Return a LeadFlowReply to short-circuit lead_flow, or None to continue."""
    from app.whatsapp.lead_flow import LeadFlowReply

    step = str(state.get("step", "start"))
    txt = (message or "").strip()
    print("INTERCEPT ACTIVE:", txt[:500] if txt else "(empty)")
    if not txt:
        return None

    digits = normalize_phone_digits(sender)
    name = (display_name or "Customer").strip() or "Customer"
    st = {**state}

    if wants_call_phrase(txt) and not wants_human(txt) and (state.get("business_type") or "").strip():
        booking = (settings.booking_url or "").strip()
        st["sales_stage"] = S.CALL_INTENT
        st = _bump_touch(st)
        set_conversation_state(sender, st)
        if booking:
            return LeadFlowReply(
                body=(
                    "Book your strategy call:\n"
                    f"{booking}\n\n"
                    "Pick a slot that works — I'll keep this thread open for any quick questions."
                ),
            )
        return LeadFlowReply(
            body=(
                "Happy to get you on a strategy call — share 2–3 times that work this week "
                "and we'll coordinate from here."
            ),
        )

    if wants_human(txt):
        st["human_required"] = True
        st["sales_stage"] = S.HUMAN_REQUIRED
        st = _bump_touch(st)
        set_conversation_state(sender, st)
        send_admin_human_required(settings, digits, name, step, txt)
        return LeadFlowReply(
            body=(
                "I've flagged our team — a human will join this thread shortly. "
                "Until then, tell me anything useful (timeline, budget band, must-haves) and I'll pass it along."
            ),
        )

    # Do not treat booking yes/no as payment intent.
    if wants_buy(txt) and step in {"await_challenge", "await_no_option", "complete"}:
        quote = st.get("last_quote") or {}
        amount = quote.get("standard") if isinstance(quote, dict) else None
        if not amount:
            q = compute_tiered_quote(
                requirement=txt,
                business_type=str(st.get("business_type", "")),
                challenge=str(st.get("challenge", "")),
                touch_count=int(st.get("sales_touch_count") or 0),
            )
            amount = q["standard"]
        try:
            link = create_payment_link_http(
                amount_rupees=float(amount),
                name=name,
                phone_digits=digits,
                description=f"StratXcel — {st.get('business_type', 'Service')}",
                email="",
            )
            short = str(link.get("short_url") or "")
            st["sales_stage"] = S.PAYMENT_PENDING
            st["payment_pending_since"] = datetime.now(timezone.utc).isoformat()
            st["payment_nudge_level"] = 0
            st["pending_payment_link_id"] = str(link.get("id") or "")
            st["last_payment_link_url"] = short
            st = _bump_touch(st)
            set_conversation_state(sender, st)
            return LeadFlowReply(
                body=(
                    "Here's your secure payment link:\n"
                    f"🔗 {short}\n\n"
                    "Once done, I'll confirm instantly 🚀"
                ),
            )
        except Exception as e:
            return LeadFlowReply(
                body=(
                    "I can generate a secure payment link — our payments service is finishing setup on this line. "
                    "Meanwhile, say **book a strategy call** and we'll lock scope quickly.\n\n"
                    f"(detail: {str(e)[:120]})"
                ),
            )

    if wants_pricing(txt) and st.get("business_type") and step in {
        "await_challenge",
        "await_booking_answer",
        "await_preferred_time",
        "await_no_option",
        "complete",
    }:
        touch = int(st.get("sales_touch_count") or 0)
        q = compute_tiered_quote(
            requirement=txt,
            business_type=str(st.get("business_type", "")),
            challenge=str(st.get("challenge", "")),
            touch_count=touch,
        )
        st["last_quote"] = q
        st["sales_stage"] = S.PRICING_PENDING
        st = _bump_touch(st)
        set_conversation_state(sender, st)
        send_admin_pricing_offered(settings, digits, name, txt, q)
        return LeadFlowReply(body=format_pricing_message(q))

    return None
