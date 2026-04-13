"""WhatsApp lead capture state machine — Stratxcel intake, booking, and CRM hooks."""

from __future__ import annotations

from dataclasses import dataclass

from app.ai.assistant import generate_lead_recommendation
from app.config import Settings
from app.leads.alerts import send_lead_owner_alerts
from app.leads.classification import (
    classify_business_type,
    classify_challenge,
    classify_no_menu_choice,
)
from app.leads.crm import build_lead_payload, send_to_google_sheets
from app.leads.constants import OWNER_NUMBER
from app.leads.scoring import compute_lead_score
from app.leads.summary import build_lead_summary_line
from app.memory.store import (
    append_lead_event,
    get_conversation_state,
    set_conversation_state,
)
from app.whatsapp.copy_variants import (
    pick_booking_question,
    pick_challenge_prompt,
    pick_no_menu_nudge,
    pick_no_options_message,
    pick_welcome_message,
    pick_yes_no_nudge,
)

BOOKING_YES_NO = (("booking_yes", "Yes"), ("booking_no", "No"))


@dataclass(frozen=True)
class ListMenuSpec:
    """WhatsApp interactive list (used when more than three choices are needed)."""

    button_label: str
    section_title: str
    rows: tuple[tuple[str, str, str | None], ...]


@dataclass(frozen=True)
class LeadFlowReply:
    """Outbound lead step: plain text and/or one interactive attachment (list or buttons)."""

    body: str
    buttons: tuple[tuple[str, str], ...] | None = None
    list_menu: ListMenuSpec | None = None


def _business_type_menu() -> ListMenuSpec:
    return ListMenuSpec(
        button_label="Choose type",
        section_title="Business type",
        rows=(
            ("agency", "Agency", None),
            ("local", "Local Business", None),
            ("online", "Online Business", None),
            ("other", "Other", None),
        ),
    )


def _welcome_reply() -> LeadFlowReply:
    return LeadFlowReply(body=pick_welcome_message(), list_menu=_business_type_menu())


def _memory_greeting(name: str, business: str) -> str:
    n = (name or "").strip()
    b = (business or "").strip()
    if n and b:
        return f"Hey {n}, got it about your {b}.\n\n"
    if n:
        return f"Hey {n}.\n\n"
    if b:
        return f"Got it about your {b}.\n\n"
    return ""


def _booking_call_reply(prefix: str) -> LeadFlowReply:
    return LeadFlowReply(
        body=f"{prefix}\n\n{pick_booking_question()}",
        buttons=BOOKING_YES_NO,
    )


def _utc_now_iso() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


def _record_lead_event(event_type: str, phone: str, **fields) -> None:
    event = {
        "type": event_type,
        "phone": phone,
        "timestamp_utc": _utc_now_iso(),
    }
    event.update(fields)
    append_lead_event(event)


def _append_transcript(state: dict, message: str) -> list[str]:
    lines = state.get("transcript_lines")
    if not isinstance(lines, list):
        lines = []
    text = (message or "").strip()
    if text:
        lines.append(text)
    return lines[-30:]


def _log_completed_lead(
    settings: Settings,
    sender: str,
    *,
    business_type: str,
    challenge: str,
    intent: str,
    preferred_time: str,
    profile_name: str,
    transcript: str,
    wants_call: bool,
) -> tuple[str, str, str]:
    ls = compute_lead_score(
        transcript=transcript,
        wants_call=wants_call,
        intent_code=intent,
    )
    summary = build_lead_summary_line(
        settings,
        business_type=business_type,
        pain_point=challenge,
        transcript=transcript,
        budget=ls.budget,
        urgency=ls.urgency,
    )

    _record_lead_event(
        "completed",
        sender,
        business_type=business_type,
        pain_point=challenge,
        intent=intent,
        preferred_time=preferred_time,
        intent_score=ls.intent_score,
        urgency=ls.urgency,
        summary=summary,
    )

    payload = build_lead_payload(
        phone=sender,
        business_type=business_type,
        pain_point=challenge,
        intent=intent,
        preferred_time=preferred_time,
        name=profile_name or "Unknown",
        budget=ls.budget,
        urgency=ls.urgency,
        intent_score=ls.intent_score,
        wants_call="Yes" if wants_call else "No",
        summary=summary,
        action=ls.action,
    )
    send_to_google_sheets(settings, payload)

    send_lead_owner_alerts(
        settings,
        OWNER_NUMBER,
        sender,
        payload,
        is_hot=ls.is_hot,
    )
    return ls.intent_score, ls.urgency, summary


def handle_lead_message(
    settings: Settings,
    sender: str,
    message: str,
    *,
    profile_name: str = "",
) -> LeadFlowReply:
    state = get_conversation_state(sender)
    step = state.get("step", "start")
    lines = _append_transcript(state, message)

    if profile_name and not state.get("profile_name"):
        prev = get_conversation_state(sender)
        set_conversation_state(sender, {**prev, "profile_name": profile_name.strip()})
        state = get_conversation_state(sender)

    display_name = (state.get("profile_name") or profile_name or "").strip()

    if step == "start":
        _record_lead_event("started", sender)
        set_conversation_state(
            sender,
            {
                "step": "await_business",
                "transcript_lines": lines,
                "profile_name": display_name,
                "lead_status": "active",
                "followup_total_sent": 0,
                "followup_stage_sent": 0,
            },
        )
        return _welcome_reply()

    set_conversation_state(sender, {**state, "transcript_lines": lines})
    state = get_conversation_state(sender)
    step = state.get("step", "start")
    transcript = "\n".join(state.get("transcript_lines") or [])
    display_name = (state.get("profile_name") or profile_name or "").strip()

    if step == "await_business":
        business = classify_business_type(message)
        if not business:
            return LeadFlowReply(
                body=(
                    "A quick note — pick a type from the menu, or tell us in your own words: "
                    "agency, local business, online business, or something else."
                ),
                list_menu=_business_type_menu(),
            )
        set_conversation_state(
            sender,
            {
                **state,
                "step": "await_challenge",
                "business_type": business,
                "transcript_lines": lines,
                "lead_status": "active",
            },
        )
        body = _memory_greeting(display_name, business) + pick_challenge_prompt()
        return LeadFlowReply(body=body)

    if step == "await_challenge":
        challenge = classify_challenge(message)
        if not challenge:
            return LeadFlowReply(
                body=(
                    "Thanks — what is the biggest friction right now: leads, follow-ups, "
                    "manual work, or scaling? A short sentence works."
                ),
            )
        business_type = state.get("business_type", "Business")
        recommendation = generate_lead_recommendation(settings, business_type, challenge)
        set_conversation_state(
            sender,
            {
                **state,
                "step": "await_booking_answer",
                "business_type": business_type,
                "challenge": challenge,
                "transcript_lines": lines,
                "booking_link_sent": False,
                "lead_status": "active",
            },
        )
        return _booking_call_reply(recommendation)

    if step == "await_booking_answer":
        if _is_yes(message):
            booking = (settings.booking_url or "").strip()
            already = bool(state.get("booking_link_sent"))
            next_state = {
                **state,
                "step": "await_preferred_time",
                "wants_call": True,
                "transcript_lines": lines,
                "preferred_time_confirmed": False,
                "lead_status": "booked",
                "followup_stopped": True,
                "followup_stop_reason": "booking_started",
                "followup_armed_at": "",
            }
            if booking and not already:
                next_state["booking_link_sent"] = True
                set_conversation_state(sender, next_state)
                return LeadFlowReply(
                    body=(
                        f"Book your strategy call here: {booking}\n\n"
                        "If you prefer, reply with times that work for you this week."
                    ),
                )
            if booking and already:
                set_conversation_state(sender, next_state)
                return LeadFlowReply(body="Great. What time works best for you this week?")
            set_conversation_state(sender, next_state)
            return LeadFlowReply(body="Great. What time works best for you this week?")

        if _is_no(message):
            set_conversation_state(
                sender,
                {
                    **state,
                    "step": "await_no_option",
                    "wants_call": False,
                    "transcript_lines": lines,
                },
            )
            return LeadFlowReply(body=pick_no_options_message())

        return LeadFlowReply(
            body=pick_yes_no_nudge(),
            buttons=BOOKING_YES_NO,
        )

    if step == "await_preferred_time":
        if state.get("preferred_time_confirmed"):
            return LeadFlowReply(
                body="Thanks — we already have your time. Our team will confirm shortly.",
            )

        if _is_greeting(message):
            set_conversation_state(
                sender,
                {
                    "step": "await_business",
                    "transcript_lines": lines,
                    "profile_name": display_name,
                    "preferred_time_confirmed": False,
                    "booking_link_sent": False,
                    "lead_status": "active",
                    "followup_stopped": False,
                    "followup_stop_reason": "",
                },
            )
            return _welcome_reply()

        business_type = state.get("business_type", "Business")
        challenge = state.get("challenge", "Scaling Operations")
        pref = message.strip()

        intent_score, urgency, summary = _log_completed_lead(
            settings,
            sender,
            business_type=business_type,
            challenge=challenge,
            intent="yes",
            preferred_time=pref,
            profile_name=display_name,
            transcript=transcript,
            wants_call=True,
        )
        set_conversation_state(
            sender,
            {
                **state,
                "step": "complete",
                "business_type": business_type,
                "challenge": challenge,
                "transcript_lines": lines,
                "preferred_time_confirmed": True,
                "lead_status": "completed",
                "followup_stopped": True,
                "followup_stop_reason": "lead_completed",
                "intent": "yes",
                "intent_score": intent_score,
                "urgency": urgency,
                "summary": summary,
                "followup_armed_at": "",
            },
        )
        return LeadFlowReply(body="Perfect — noted. We will confirm the strategy call slot shortly.")

    if step == "await_no_option":
        choice = classify_no_menu_choice(message)
        if choice == "1":
            intent_score, urgency, summary = _log_completed_lead(
                settings,
                sender,
                business_type=state.get("business_type", "Business"),
                challenge=state.get("challenge", "Scaling Operations"),
                intent="no_pricing",
                preferred_time="",
                profile_name=display_name,
                transcript=transcript,
                wants_call=False,
            )
            set_conversation_state(
                sender,
                {
                    **state,
                    "step": "complete",
                    "transcript_lines": lines,
                    "lead_status": "completed",
                    "followup_stopped": True,
                    "followup_stop_reason": "lead_completed",
                    "intent": "no_pricing",
                    "intent_score": intent_score,
                    "urgency": urgency,
                    "summary": summary,
                    "followup_armed_at": "",
                },
            )
            return LeadFlowReply(
                body=(
                    "Pricing is based on system scope and workflow complexity. "
                    "Share your business type and we can outline a clear range."
                ),
            )
        if choice == "2":
            business_type = state.get("business_type", "Business")
            challenge = state.get("challenge", "Scaling Operations")
            recommendation = generate_lead_recommendation(settings, business_type, challenge)
            set_conversation_state(
                sender,
                {
                    **state,
                    "step": "await_booking_answer",
                    "business_type": business_type,
                    "challenge": challenge,
                    "transcript_lines": lines,
                    "booking_link_sent": False,
                    "lead_status": "active",
                    "followup_stopped": False,
                    "followup_stop_reason": "",
                },
            )
            return _booking_call_reply(recommendation)
        if choice == "3":
            intent_score, urgency, summary = _log_completed_lead(
                settings,
                sender,
                business_type=state.get("business_type", "Business"),
                challenge=state.get("challenge", "Scaling Operations"),
                intent="no_later",
                preferred_time="",
                profile_name=display_name,
                transcript=transcript,
                wants_call=False,
            )
            set_conversation_state(
                sender,
                {
                    **state,
                    "step": "complete",
                    "transcript_lines": lines,
                    "lead_status": "completed",
                    "followup_stopped": True,
                    "followup_stop_reason": "lead_completed",
                    "intent": "no_later",
                    "intent_score": intent_score,
                    "urgency": urgency,
                    "summary": summary,
                    "followup_armed_at": "",
                },
            )
            return LeadFlowReply(body="Absolutely. Reach out anytime when you are ready.")
        return LeadFlowReply(
            body=pick_no_menu_nudge(),
        )

    if step == "complete":
        if _is_greeting(message):
            set_conversation_state(
                sender,
                {
                    "step": "await_business",
                    "transcript_lines": _append_transcript({}, message),
                    "profile_name": state.get("profile_name", ""),
                    "preferred_time_confirmed": False,
                    "lead_status": "active",
                    "followup_stopped": False,
                    "followup_stop_reason": "",
                    "booking_link_sent": False,
                },
            )
            return _welcome_reply()
        return LeadFlowReply(
            body="Thanks — we have your details. If anything changes, message us here anytime.",
        )

    set_conversation_state(
        sender,
        {
            "step": "await_business",
            "transcript_lines": lines,
            "lead_status": "active",
        },
    )
    return _welcome_reply()


def _is_yes(text: str) -> bool:
    t = (text or "").strip().lower()
    return t in {"yes", "y", "1", "yeah", "yep", "sure", "ok", "okay"}


def _is_no(text: str) -> bool:
    t = (text or "").strip().lower()
    return t in {"no", "n", "2", "nope", "not now"}


def _is_greeting(text: str) -> bool:
    t = (text or "").strip().lower()
    return t in {"hi", "hello", "hey", "hii", "yo", "start"}
