"""WhatsApp lead capture state machine — Stratxcel intake, booking, and CRM hooks."""

from __future__ import annotations

from dataclasses import dataclass

from app.ai.assistant import extract_lead_qualification, generate_lead_recommendation, get_ai_reply
from app.config import Settings
from app.leads.admin_alerts import send_admin_new_lead, send_admin_qualified_lead
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
from app.sales import states as S
from app.sales.intent import wants_human
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

    msg = (message or "").strip()
    lower_msg = msg.lower()
    if wants_human(msg):
        set_conversation_state(
            sender,
            {
                **state,
                "human_required": True,
                "sales_stage": S.HUMAN_REQUIRED,
                "step": state.get("step", "start"),
                "transcript_lines": lines,
            },
        )
        return LeadFlowReply(body="Connecting you to a strategist now. You'll get a reply shortly.")

    # AI-first sales strategist mode: acknowledge intent fast and always push to next conversion step.
    try:
        qual = extract_lead_qualification(
            settings,
            latest_message=msg,
            transcript_excerpt="\n".join(lines[-12:]),
        )
    except Exception:
        qual = {}

    budget = qual.get("budget_inr") if isinstance(qual, dict) else None
    timeline = str((qual or {}).get("timeline") or "").strip() if isinstance(qual, dict) else ""
    need = str((qual or {}).get("need_summary") or "").strip() if isinstance(qual, dict) else ""
    proposal_intent = bool((qual or {}).get("proposal_intent")) if isinstance(qual, dict) else False
    payment_intent = bool((qual or {}).get("payment_intent")) if isinstance(qual, dict) else False
    call_intent = bool((qual or {}).get("book_call_intent")) if isinstance(qual, dict) else False
    urgent = ("urgent" in lower_msg) or ("asap" in lower_msg) or ("today" in lower_msg) or ("immediately" in lower_msg)
    has_service_intent = any(k in lower_msg for k in ("website", "marketing", "ads", "seo", "automation", "funnel", "growth"))

    if step == "start":
        _record_lead_event("started", sender)
        set_conversation_state(
            sender,
            {
                "step": "ai_active",
                "transcript_lines": lines,
                "profile_name": display_name,
                "lead_status": "active",
                "followup_total_sent": 0,
                "followup_stage_sent": 0,
                "sales_stage": S.QUALIFYING,
                "budget_inr": budget,
                "timeline_hint": timeline[:120],
            },
        )

    st_after = get_conversation_state(sender)
    set_conversation_state(
        sender,
        {
            **st_after,
            "step": "ai_active",
            "transcript_lines": lines,
            "budget_inr": budget if budget else st_after.get("budget_inr"),
            "timeline_hint": timeline[:120] if timeline else st_after.get("timeline_hint", ""),
            "lead_status": "active",
            "sales_stage": S.QUALIFIED if (budget or has_service_intent or need) else S.QUALIFYING,
        },
    )

    if payment_intent:
        return LeadFlowReply(body="Perfect. I can send the payment link right away and start immediately.\nReply 'Send payment link' to confirm, or share your preferred start time.")
    if proposal_intent:
        return LeadFlowReply(body="Done. I can share a focused proposal with scope, timeline, and pricing today.\nReply 'Send proposal' or book a quick call for final alignment.")
    if call_intent:
        return LeadFlowReply(body="Great call. A 10-minute strategy call will lock scope fast.\nShare your preferred slot, or reply 'Book call' and I'll confirm it now.")

    if budget:
        if urgent:
            return LeadFlowReply(body=f"Got it — urgent and clear. We can execute fast within {int(budget):,} INR with a conversion-focused plan.\nWant a quick proposal now or should I lock a strategist call immediately?")
        return LeadFlowReply(body=f"Perfect, {int(budget):,} INR is workable for a high-conversion build with clear milestones.\nWant the quick plan as a proposal, or should I schedule a strategist call now?")

    if urgent and (has_service_intent or need):
        return LeadFlowReply(body="Understood — this is priority. We'll skip delays and move straight to execution with a clear action plan.\nShould I send the quick proposal now or connect you to a strategist call right away?")

    if has_service_intent or need:
        return LeadFlowReply(body="Got it. We can solve this with a focused execution plan tied to leads and conversion outcomes.\nWant a quick proposal first, or should I connect you to a strategist now?")

    return LeadFlowReply(
        body="Understood. Share your goal and budget, and I'll map the fastest plan.\nWant to move ahead with a quick call or proposal?"
    )

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
                "sales_stage": S.NEW,
            },
        )
        try:
            send_admin_new_lead(
                settings,
                sender,
                display_name or "Customer",
                S.NEW,
                (message or "").strip()[:400],
            )
        except Exception as e:
            print(f"[lead-flow] new lead admin alert failed: {e}")
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
                "sales_stage": S.QUALIFYING,
            },
        )
        body = _memory_greeting(display_name, business) + pick_challenge_prompt()
        return LeadFlowReply(body=body)

    if step == "await_challenge":
        challenge = classify_challenge(message)
        if not challenge:
            ai_line = ""
            try:
                ai_line = (
                    get_ai_reply(
                        settings,
                        f"User message: {message}\nReply naturally in one short sentence, then ask their core business pain.",
                        wa_user_id=sender,
                        mode="client",
                    )
                    .strip()
                    .split("\n")[0][:180]
                )
            except Exception:
                ai_line = ""
            return LeadFlowReply(
                body=(
                    (f"{ai_line}\n\n" if ai_line else "")
                    + "What is the biggest friction right now: leads, follow-ups, manual work, or scaling?"
                ),
            )
        try:
            qual = extract_lead_qualification(
                settings,
                latest_message=message,
                transcript_excerpt=transcript,
            )
        except Exception:
            qual = {}
        business_type = state.get("business_type", "Business")
        recommendation = generate_lead_recommendation(settings, business_type, challenge)
        if not state.get("qualified_alert_sent"):
            try:
                send_admin_qualified_lead(
                    settings,
                    sender,
                    display_name or "Customer",
                    challenge,
                    S.QUALIFIED,
                )
            except Exception as e:
                print(f"[lead-flow] qualified admin alert failed: {e}")
        set_conversation_state(
            sender,
            {
                **state,
                "step": "await_booking_answer",
                "business_type": business_type,
                "challenge": challenge,
                "transcript_lines": lines,
                "budget_inr": qual.get("budget_inr") if isinstance(qual, dict) else None,
                "timeline_hint": str(qual.get("timeline") or "")[:120] if isinstance(qual, dict) else "",
                "booking_link_sent": False,
                "lead_status": "active",
                "qualified_alert_sent": True,
                "sales_stage": S.QUALIFIED,
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
                "sales_stage": S.CALL_INTENT,
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
                "sales_stage": S.CALL_BOOKED,
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
                    "sales_stage": S.CLOSED,
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
                    "sales_stage": S.QUALIFIED,
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
                    "sales_stage": S.CLOSED,
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
        return LeadFlowReply(body="Thanks for your message — a strategist will assist you shortly.")

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


# --- Production state-machine override (authoritative implementation) ---
from datetime import datetime, timezone
import re
from typing import Any

_LEAD_STATE_STORE: dict[str, dict[str, Any]] = {}

STAGE_NEW = "new"
STAGE_INTENT_CAPTURED = "intent_captured"
STAGE_PROPOSAL_REQUESTED = "proposal_requested"
STAGE_PAYMENT_READY = "payment_ready"
STAGE_CALL_READY = "call_ready"
STAGE_HUMAN_REQUIRED = "human_required"
STAGE_CONVERTED = "converted"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _default_state() -> dict[str, Any]:
    return {
        "stage": STAGE_NEW,
        "human_required": False,
        "service": None,
        "budget": None,
        "urgency": False,
        "last_updated": _now_iso(),
    }


def get_state(phone: str) -> dict[str, Any]:
    key = str(phone or "").strip()
    if not key:
        return _default_state()
    if key not in _LEAD_STATE_STORE:
        _LEAD_STATE_STORE[key] = _default_state()
    return dict(_LEAD_STATE_STORE[key])


def save_state(phone: str, state: dict[str, Any]) -> None:
    key = str(phone or "").strip()
    if not key:
        return
    merged = {**_default_state(), **(state or {})}
    merged["last_updated"] = _now_iso()
    _LEAD_STATE_STORE[key] = merged


def _detect_service(text: str) -> str:
    t = (text or "").lower()
    if any(k in t for k in ("website", " web ", "web")):
        return "website"
    if any(k in t for k in ("android", "ios", " app ", "app")):
        return "app"
    if any(k in t for k in ("marketing", "ads", "meta")):
        return "marketing"
    if any(k in t for k in ("seo", "google ranking")):
        return "seo"
    return ""


def _detect_budget(text: str) -> int | None:
    t = (text or "").lower().replace(",", "")
    mk = re.search(r"\b(\d{1,3})\s*k\b", t)
    if mk:
        return int(mk.group(1)) * 1000
    m = re.search(r"(?:₹|rs\.?|inr)?\s*(\d{4,7})\b", t)
    if m:
        return int(m.group(1))
    return None


def _detect_urgency(text: str) -> bool:
    t = (text or "").lower()
    return any(k in t for k in ("urgent", "asap", "today", "immediately"))


def _contains_any(text: str, words: tuple[str, ...]) -> bool:
    t = (text or "").lower()
    return any(w in t for w in words)


def notify_admin(phone: str, state: dict[str, Any]) -> None:
    print(f"🚨 {phone} → {state['stage']}")


def handle_final_stage(state: dict[str, Any], message: str) -> LeadFlowReply | None:
    if bool(state.get("human_required")):
        return None
    stage = str(state.get("stage") or "")
    low = (message or "").strip().lower()
    if stage == STAGE_PAYMENT_READY:
        if "upi" in low:
            return LeadFlowReply(body="Done. Sharing UPI payment link now.")
        if "bank" in low:
            return LeadFlowReply(body="Sharing bank transfer details now.")
        return LeadFlowReply(body="Want UPI, bank transfer, or payment link?")
    if stage == STAGE_CALL_READY:
        return LeadFlowReply(body=f"Confirmed for {message}. Our strategist will call you.")
    return None


def _handle_lead_message_state_machine(phone: str, message: str) -> LeadFlowReply | None:
    state = get_state(phone)
    msg = (message or "").strip()
    low = msg.lower()

    # FINAL STAGES LOCK: never fall back to generic routing once in final stages.
    if str(state.get("stage") or "") in {STAGE_PAYMENT_READY, STAGE_CALL_READY, STAGE_HUMAN_REQUIRED}:
        return handle_final_stage(state, msg)

    if state.get("human_required"):
        return None

    if _contains_any(low, ("talk to human", "human", "real person", "agent")):
        state["human_required"] = True
        state["stage"] = STAGE_HUMAN_REQUIRED
        save_state(phone, state)
        notify_admin(phone, state)
        return LeadFlowReply(body="Connecting you to a strategist now. You'll get a reply shortly.")

    service = _detect_service(low)
    budget = _detect_budget(low)
    urgency = _detect_urgency(low)
    if service:
        state["service"] = service
    if budget is not None:
        state["budget"] = int(budget)
    if urgency:
        state["urgency"] = True

    if _contains_any(low, ("proposal", "quote", "pricing", "estimate")):
        state["stage"] = STAGE_PROPOSAL_REQUESTED
        svc = state.get("service") or "service"
        b = state.get("budget")
        budget_text = f"₹{int(b)}" if isinstance(b, int) else "₹0"
        body = f"Proposal ready for your {svc}. We’ll structure scope, timeline, and pricing around {budget_text}. Reply 'pay now' or 'book call'."
        save_state(phone, state)
        return LeadFlowReply(body=body)

    if _contains_any(low, ("pay", "payment", "advance")):
        state["stage"] = STAGE_PAYMENT_READY
        notify_admin(phone, state)
        save_state(phone, state)
        body = "Perfect. I’ll arrange payment details today. Want UPI, bank transfer, or payment link?"
        return LeadFlowReply(body=body)

    if _contains_any(low, ("call", "meeting", "talk now")):
        state["stage"] = STAGE_CALL_READY
        notify_admin(phone, state)
        save_state(phone, state)
        body = "Great. A strategist can speak with you today. Share your preferred time slot."
        return LeadFlowReply(body=body)

    state["stage"] = STAGE_INTENT_CAPTURED
    b = state.get("budget")
    u = bool(state.get("urgency"))
    if isinstance(b, int) and u:
        body = f"Got it — urgent and clear. We can deliver fast within ₹{b}. Want a quick proposal or strategist call now?"
    elif isinstance(b, int):
        body = f"₹{b} is workable. Want proposal or quick call?"
    else:
        body = "Got it. We can help. Want proposal or quick call?"
    save_state(phone, state)
    return LeadFlowReply(body=body)


def handle_lead_message(*args, **kwargs) -> LeadFlowReply | None:
    """
    Compatibility wrapper:
    - handle_lead_message(phone, message)
    - handle_lead_message(settings, sender, message, profile_name=...)
    """
    if len(args) >= 3:
        phone = str(args[1] or "").strip()
        message = str(args[2] or "")
        return _handle_lead_message_state_machine(phone, message)
    if len(args) >= 2:
        phone = str(args[0] or "").strip()
        message = str(args[1] or "")
        return _handle_lead_message_state_machine(phone, message)
    raise TypeError("handle_lead_message expects (phone, message) or (settings, sender, message)")
