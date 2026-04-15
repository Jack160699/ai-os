"""Smart multi-stage follow-ups for incomplete leads."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.config import Settings
from app.memory.store import append_lead_event, get_conversation_state, iter_state_phone_numbers, set_conversation_state
from app.leads.scoring import compute_lead_score
from app.whatsapp.copy_variants import (
    pick_followup_1h,
    pick_followup_24h,
    pick_followup_30d,
    pick_followup_3d,
    pick_followup_7d,
)
from app.leads.admin_alerts import send_admin_hot_lead
from app.sales import states as sales_states
from app.whatsapp.messaging import send_whatsapp_text

_STEPS_PENDING_USER = frozenset(
    {
        "await_business",
        "await_challenge",
        "await_booking_answer",
        "await_preferred_time",
        "await_no_option",
    },
)

_STOP_WORDS = ("stop", "unsubscribe", "not interested", "dont message", "don't message", "no thanks")
_ONE_DAY = 24 * 3600

# stage: 0=1h, 1=24h, 2=3d, 3=7d, 4=30d
_COLD_DELAYS_H = (1, 24, 96, 192, 720)
_WARM_DELAYS_H = (1, 24, 72, 168, 720)
_HOT_DELAYS_H = (1, 20, 60, 144, 480)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_iso(ts: str) -> datetime | None:
    try:
        if ts.endswith("Z"):
            ts = ts[:-1] + "+00:00"
        dt = datetime.fromisoformat(ts)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:
        return None


def _safe_int(value: object, default: int = 0) -> int:
    try:
        return int(value)
    except Exception:
        return default


def _norm(text: str) -> str:
    return (text or "").strip().lower()


def _intent_bucket(st: dict) -> str:
    score = _norm(str(st.get("intent_score", "")))
    if score == "hot":
        return "hot"
    if score == "cold":
        return "cold"
    return "warm"


def _stage_delays_hours(st: dict) -> tuple[int, int, int, int, int]:
    bucket = _intent_bucket(st)
    if bucket == "hot":
        return _HOT_DELAYS_H
    if bucket == "cold":
        return _COLD_DELAYS_H
    return _WARM_DELAYS_H


def _stage_message(stage: int, *, st: dict) -> str:
    name = (st.get("profile_name") or "").strip()
    business = (st.get("business_type") or "business").strip()
    pain = (st.get("challenge") or "growth").strip()
    lead_tone = _intent_bucket(st)

    opener = f"Hey {name}," if name else "Hey,"
    if stage == 0:
        base = pick_followup_1h()
        return f"{opener} {base[0].lower()}{base[1:]}" if name else base
    if stage == 1:
        base = pick_followup_24h()
        return f"{opener} {base[0].lower()}{base[1:]}" if name else base
    if stage == 2:
        return pick_followup_3d(name=name, business=business, pain_point=pain)
    if stage == 3:
        return pick_followup_7d(name=name, business=business)
    # stage 4 (final revival)
    if lead_tone == "hot":
        return (
            f"{opener} final spot check — if you are still looking to fix {pain.lower()} for your {business.lower()}, "
            "we can map an action plan this week. Reply and we will prioritize your thread."
        )
    if lead_tone == "cold":
        return pick_followup_30d(name=name, business=business, soft=True)
    return pick_followup_30d(name=name, business=business, soft=False)


def _record_followup_event(phone: str, *, stage: int, status: str) -> None:
    append_lead_event(
        {
            "type": "followup",
            "phone": phone,
            "stage": stage,
            "status": status,
            "timestamp_utc": _utc_now().isoformat(),
        }
    )


def _stop_followups(st: dict, reason: str) -> dict:
    st["followup_stopped"] = True
    st["followup_stop_reason"] = reason
    if reason == "user_opt_out":
        st["lead_status"] = "inactive"
    elif reason in {"final_followup_sent", "max_limit_reached"}:
        st["lead_status"] = "cold"
    else:
        st["lead_status"] = st.get("lead_status", "active")
    st["followup_armed_at"] = ""
    return st


def clear_followup_on_user_inbound(phone: str, inbound_text: str = "") -> None:
    """User replied: stop pending timers and reset cycle (or opt-out on explicit stop words)."""
    st = get_conversation_state(phone)
    txt = _norm(inbound_text)
    if any(w in txt for w in _STOP_WORDS):
        st = _stop_followups(st, "user_opt_out")
        set_conversation_state(phone, st)
        return

    if str(st.get("lead_status", "")) == "booked" or (
        st.get("step") == "await_preferred_time" and st.get("wants_call")
    ):
        st["last_user_reply_at"] = _utc_now().isoformat()
        st["replied_after_followup"] = bool(st.get("followup_seen", False))
        st["followup_seen"] = False
        st.pop("followup_armed_at", None)
        set_conversation_state(phone, st)
        return

    # User re-engaged: reset cycle from stage 0 (keep lifetime total_sent for max-5 cap).
    st["followup_stopped"] = False
    st["followup_stop_reason"] = ""
    st["followup_stage_sent"] = 0
    st.pop("followup_armed_at", None)
    st["last_user_reply_at"] = _utc_now().isoformat()
    st["replied_after_followup"] = bool(st.get("followup_seen", False))
    st["followup_seen"] = False
    if st.get("step") != "complete":
        st["lead_status"] = "active"
    set_conversation_state(phone, st)


def arm_followup_after_bot_send(phone: str) -> None:
    """After we send a bot message, start silence clock if funnel still expects user input."""
    st = get_conversation_state(phone)
    if str(st.get("lead_status", "")) == "booked" or str(st.get("followup_stop_reason", "")) == "booking_started":
        st["followup_armed_at"] = ""
        set_conversation_state(phone, st)
        return
    step = st.get("step", "start")
    if step not in _STEPS_PENDING_USER:
        if step == "complete":
            st["lead_status"] = "completed"
            st["followup_stopped"] = True
            st["followup_stop_reason"] = "lead_completed"
        st["followup_armed_at"] = ""
        set_conversation_state(phone, st)
        return
    now_iso = _utc_now().isoformat()
    transcript = "\n".join(st.get("transcript_lines") or [])
    intent_code = "yes" if st.get("wants_call") else (
        "no_pricing" if st.get("step") == "await_no_option" else "in_progress"
    )
    ls = compute_lead_score(
        transcript=transcript,
        wants_call=bool(st.get("wants_call")),
        intent_code=intent_code,
    )
    st["intent_score"] = ls.intent_score
    st["urgency"] = ls.urgency

    if ls.is_hot and not st.get("hot_alert_sent"):
        try:
            s = Settings.load()
            send_admin_hot_lead(
                s,
                phone,
                (st.get("profile_name") or "").strip() or "Customer",
                str(st.get("challenge", "")),
            )
            st["hot_alert_sent"] = True
            if str(st.get("sales_stage", "")) not in {sales_states.PAYMENT_PENDING, sales_states.PAID}:
                st["sales_stage"] = sales_states.HOT
        except Exception as e:
            print(f"[followup] hot admin alert failed {phone}: {e}")

    st["followup_stopped"] = bool(st.get("followup_stopped", False))
    st["followup_stop_reason"] = st.get("followup_stop_reason", "")
    st["followup_stage_sent"] = _safe_int(st.get("followup_stage_sent"), 0)
    st["followup_total_sent"] = _safe_int(st.get("followup_total_sent"), 0)
    st["followup_last_sent_at"] = st.get("followup_last_sent_at", "")
    st["followup_armed_at"] = now_iso
    st["last_bot_prompt_at"] = now_iso
    if st.get("lead_status") not in {"completed", "booked", "inactive"}:
        st["lead_status"] = "active"
    set_conversation_state(phone, st)


def process_due_followups(settings: Settings) -> dict:
    """
    Run follow-up cron safely and idempotently.
    Returns counters for observability.
    """
    counts = {"checked": 0, "sent": 0, "skipped": 0, "completed": 0}
    now = _utc_now()
    for phone in iter_state_phone_numbers():
        counts["checked"] += 1
        st = get_conversation_state(phone)
        if st.get("step") == "complete" or st.get("lead_status") in {"completed", "booked"}:
            counts["completed"] += 1
            continue
        if st.get("followup_stopped"):
            counts["skipped"] += 1
            continue
        if st.get("step") not in _STEPS_PENDING_USER:
            counts["skipped"] += 1
            continue
        armed_raw = st.get("followup_armed_at")
        if not armed_raw or not isinstance(armed_raw, str):
            counts["skipped"] += 1
            continue
        armed = _parse_iso(armed_raw)
        if not armed:
            counts["skipped"] += 1
            continue
        stage = _safe_int(st.get("followup_stage_sent"), 0)
        total_sent = _safe_int(st.get("followup_total_sent"), 0)
        if stage >= 5 or total_sent >= 5:
            st = _stop_followups(st, "max_limit_reached")
            set_conversation_state(phone, st)
            counts["skipped"] += 1
            continue

        last_sent = _parse_iso(str(st.get("followup_last_sent_at", "")))
        if last_sent and (now - last_sent).total_seconds() < _ONE_DAY:
            counts["skipped"] += 1
            continue

        delays = _stage_delays_hours(st)
        due_at = armed + timedelta(hours=delays[stage])
        if now < due_at:
            counts["skipped"] += 1
            continue

        body = _stage_message(stage, st=st)
        try:
            resp = send_whatsapp_text(settings, phone, body)
            if not resp.ok:
                counts["skipped"] += 1
                print(f"[followup] send failed {phone} stage={stage} status={resp.status_code}")
                continue
        except Exception as e:
            counts["skipped"] += 1
            print(f"[followup] send failed {phone} stage={stage} error={e}")
            continue

        counts["sent"] += 1
        st["followup_seen"] = True
        st["followup_stage_sent"] = stage + 1
        st["followup_total_sent"] = total_sent + 1
        st["followup_last_sent_at"] = now.isoformat()
        st["last_followup_stage"] = stage + 1
        st["lead_status"] = "active"
        is_final = stage + 1 >= 5
        _record_followup_event(phone, stage=stage + 1, status="final" if is_final else "sent")

        if is_final:
            st = _stop_followups(st, "final_followup_sent")

        set_conversation_state(phone, st)

    return counts


def process_payment_pending_nudges(settings: Settings) -> dict[str, int]:
    """WhatsApp nudges for abandoned / open Razorpay links (10m → 1h → 24h → 72h)."""
    counts = {"checked": 0, "sent": 0, "skipped": 0}
    now = _utc_now()
    ten_min = 600.0
    one_h = 3600.0
    day_h = 86400.0
    three_day = 259200.0
    for phone in iter_state_phone_numbers():
        counts["checked"] += 1
        st = get_conversation_state(phone)
        if str(st.get("sales_stage", "")) != "PAYMENT_PENDING":
            counts["skipped"] += 1
            continue
        since_raw = str(st.get("payment_pending_since") or "")
        since = _parse_iso(since_raw)
        if not since:
            counts["skipped"] += 1
            continue
        elapsed = (now - since).total_seconds()
        level = _safe_int(st.get("payment_nudge_level"), 0)
        body = ""
        next_level = level
        link = str(st.get("last_payment_link_url") or "").strip()
        if level == 0 and elapsed >= ten_min:
            body = "Need help completing payment? If anything blocked on the page, tell me and I will fix it."
            next_level = 1
        elif level == 1 and elapsed >= one_h:
            body = (
                "Gentle reminder — your diagnosis session slot is still open.\n\n"
                + (f"Pay securely here when ready:\n{link}\n\n" if link else "Reply “link” and I will resend the secure payment link.\n\n")
                + "No pressure — I just don’t want you to lose momentum."
            )
            next_level = 2
        elif level == 2 and elapsed >= day_h:
            body = (
                "24h check-in: if you still want the roadmap + diagnosis, here is the link again.\n\n"
                + (f"{link}\n\n" if link else "I can resend the payment link — just say yes.\n\n")
                + "If timing is wrong, reply “later” and I will pause reminders."
            )
            next_level = 3
        elif level == 3 and elapsed >= three_day:
            body = (
                "Last nudge from my side — if you want to continue, use the link below. "
                "If not, totally fine; message whenever you are ready.\n\n"
                + (f"{link}" if link else "Reply “link” for a fresh payment link.")
            )
            next_level = 4
        if not body:
            counts["skipped"] += 1
            continue
        try:
            resp = send_whatsapp_text(settings, phone, body)
            if not resp.ok:
                counts["skipped"] += 1
                print(f"[payment-nudge] send failed {phone} level={next_level} status={resp.status_code}")
                continue
        except Exception as e:
            counts["skipped"] += 1
            print(f"[payment-nudge] send failed {phone}: {e}")
            continue
        counts["sent"] += 1
        st["payment_nudge_level"] = next_level
        st["payment_last_reminder_at"] = now.isoformat()
        set_conversation_state(phone, st)
        append_lead_event(
            {
                "type": "payment_reminder",
                "phone": phone,
                "level": next_level,
                "timestamp_utc": now.isoformat(),
            }
        )
    return counts
