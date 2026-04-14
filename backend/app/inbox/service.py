"""Build inbox payloads from memory.json threads + conversation state."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.leads.analytics import parse_iso
from app.memory.store import (
    get_all_states,
    get_conversation_state,
    get_thread_messages,
    load_memory,
    set_conversation_state,
)

def _normalize_phone(phone: str) -> str:
    return "".join(c for c in (phone or "") if c.isdigit())


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _all_inbox_phones(memory: dict) -> list[str]:
    phones: set[str] = set()
    for k in memory:
        if not isinstance(k, str):
            continue
        if k.startswith("thread:"):
            d = _normalize_phone(k[7:])
            if d:
                phones.add(d)
        elif k.startswith("state:"):
            d = _normalize_phone(k[6:])
            if d:
                phones.add(d)
    return list(phones)


def _last_thread_ts(rows: list[dict]) -> datetime | None:
    if not rows:
        return None
    last = rows[-1]
    return parse_iso(str(last.get("timestamp_utc", "")))


def _temperature_from_state(st: dict) -> str:
    raw = str(st.get("intent_score", "") or "Warm").strip()
    low = raw.lower()
    if "hot" in low:
        return "hot"
    if "cold" in low:
        return "cold"
    return "warm"


def _sentiment_from_text(text: str) -> dict[str, Any]:
    t = (text or "").lower()
    pos = ("great", "thanks", "thank", "love", "good", "yes", "perfect", "awesome", "interested", "book")
    neg = ("no", "not", "expensive", "bad", "angry", "frustrat", "stop", "unsubscribe", "later", "busy")
    score = 0
    for w in pos:
        if w in t:
            score += 1
    for w in neg:
        if w in t:
            score -= 1
    if score > 0:
        label, tone = "Positive", "positive"
    elif score < 0:
        label, tone = "Cooling", "negative"
    else:
        label, tone = "Neutral", "neutral"
    return {"label": label, "tone": tone, "score": max(-1, min(1, score))}


def _recommended_action(st: dict) -> str:
    step = str(st.get("step", "start"))
    booked = str(st.get("lead_status", "")) == "booked"
    if booked:
        return "Lead marked booked — confirm time on calendar and log outcome in CRM."
    hints: dict[str, str] = {
        "start": "Send a short greeting and invite them to share their business type.",
        "await_business": "Surface business-type options or confirm what they typed.",
        "await_challenge": "Clarify their main challenge before pushing toward booking.",
        "await_booking_answer": "Handle yes/no on the call; if yes, capture preferred time.",
        "await_preferred_time": "Lock a time window and confirm timezone.",
        "await_no_option": "Offer a softer path or resource if they declined the main CTA.",
        "complete": "Conversation marked complete — archive or trigger a nurture sequence.",
    }
    return hints.get(step, "Review transcript and send one clear, helpful next message.")


def _heuristic_suggestions(last_user: str) -> list[str]:
    t = (last_user or "").strip()
    low = t.lower()
    if not t:
        return [
            "Hey — just saw your message. What would help most right now?",
            "Happy to walk you through how this works for your business.",
            "If you share your biggest bottleneck, I can suggest the next step.",
        ]
    if any(w in low for w in ("price", "cost", "fee", "how much")):
        return [
            "Pricing depends on volume—what does your monthly lead flow look like?",
            "I can share ranges once I know your team size and channels.",
            "Want a quick call to map scope so we quote accurately?",
        ]
    if any(w in low for w in ("book", "call", "schedule", "meeting", "time")):
        return [
            "Great — what day parts usually work best for a 15-min call?",
            "I’ll send a booking link—does mornings or afternoons fit better?",
            "Locked—confirm your timezone and I’ll hold the slot.",
        ]
    if any(w in low for w in ("hello", "hi", "hey")):
        return [
            "Hi there — what kind of business are you running today?",
            "Hey! What prompted you to reach out?",
            "Hello — want a quick overview or to jump straight to your use case?",
        ]
    return [
        "Thanks for the detail — what outcome would make this week a win for you?",
        "Got it. Want me to outline how we’d automate this part of your funnel?",
        "Makes sense. Should we explore booking a short strategy call?",
    ]


def build_inbox_list(q: str = "", temperature: str = "all", unread_only: bool = False) -> dict[str, Any]:
    memory = load_memory()
    states = get_all_states()
    qn = (q or "").strip().lower()
    temp_key = (temperature or "all").strip().lower()
    rows_out: list[dict[str, Any]] = []

    for phone in _all_inbox_phones(memory):
        digits = _normalize_phone(phone)
        if not digits:
            continue
        st = states.get(digits)
        if st is None:
            st = {}
        thread = get_thread_messages(digits)
        last_ts = _last_thread_ts(thread)
        lr = parse_iso(str(st.get("last_user_reply_at", "")))
        sort_dt = max(
            [x for x in (last_ts, lr) if x is not None],
            default=datetime.min.replace(tzinfo=timezone.utc),
        )
        last_text = ""
        if thread:
            last_text = str(thread[-1].get("text", "") or "")
        preview = (last_text[:140] + "…") if len(last_text) > 140 else last_text
        name = (st.get("profile_name") or "").strip() or "WhatsApp lead"
        unread = int(st.get("inbox_unread", 0) or 0)
        temp = _temperature_from_state(st)
        if temp_key in ("hot", "warm", "cold") and temp != temp_key:
            continue
        if unread_only and unread <= 0:
            continue
        if qn and qn not in name.lower() and qn not in digits and qn not in preview.lower():
            continue

        last_iso = ""
        if last_ts:
            last_iso = last_ts.isoformat()
        elif lr:
            last_iso = lr.isoformat()

        rows_out.append(
            {
                "phone": digits,
                "name": name,
                "last_message": preview or "—",
                "last_time": last_iso,
                "sort_key": sort_dt.timestamp(),
                "unread": unread,
                "temperature": temp,
                "intent_score": st.get("intent_score", "Warm"),
                "status": str(st.get("lead_status", "active")),
            }
        )

    rows_out.sort(key=lambda r: r.get("sort_key", 0), reverse=True)
    for r in rows_out:
        r.pop("sort_key", None)

    return {"conversations": rows_out, "updated_at": _iso_now()}


def build_inbox_detail(phone: str) -> dict[str, Any] | None:
    digits = _normalize_phone(phone)
    if not digits:
        return None
    st = get_conversation_state(digits)
    thread = get_thread_messages(digits)
    last_user = ""
    for row in reversed(thread):
        if str(row.get("role", "")).lower() == "user":
            last_user = str(row.get("text", ""))
            break
    sent = _sentiment_from_text(last_user)
    rec = _recommended_action(st)
    summary = (st.get("summary") or "").strip()
    if not summary:
        parts = [
            st.get("business_type"),
            st.get("pain_point") or st.get("challenge"),
        ]
        summary = " · ".join(str(p) for p in parts if p) or "No summary captured yet."

    return {
        "phone": digits,
        "transcript": thread,
        "state": {
            "profile_name": st.get("profile_name"),
            "business_type": st.get("business_type"),
            "intent_score": st.get("intent_score"),
            "urgency": st.get("urgency"),
            "step": st.get("step"),
            "lead_status": st.get("lead_status"),
            "summary": st.get("summary"),
            "followup_stage_sent": st.get("followup_stage_sent"),
            "tags": st.get("inbox_tags") if isinstance(st.get("inbox_tags"), list) else [],
        },
        "intelligence": {
            "summary": summary,
            "sentiment": sent,
            "intent_score": st.get("intent_score", "Warm"),
            "recommended_next_action": rec,
        },
        "suggestions": _heuristic_suggestions(last_user),
        "updated_at": _iso_now(),
    }


def mark_inbox_read(phone: str) -> bool:
    digits = _normalize_phone(phone)
    if not digits:
        return False
    st = get_conversation_state(digits)
    st["inbox_unread"] = 0
    st["inbox_last_read_at"] = _iso_now()
    set_conversation_state(digits, st)
    return True


def apply_inbox_action(phone: str, action: str, payload: dict | None = None) -> dict[str, Any]:
    digits = _normalize_phone(phone)
    if not digits:
        return {"ok": False, "error": "invalid_phone"}
    st = get_conversation_state(digits)
    payload = payload or {}
    action = (action or "").strip().lower()

    if action == "mark_booked":
        st["lead_status"] = "booked"
    elif action == "add_tags":
        tags = payload.get("tags")
        if isinstance(tags, list):
            cur = st.get("inbox_tags")
            if not isinstance(cur, list):
                cur = []
            for t in tags:
                s = str(t).strip()
                if s and s not in cur:
                    cur.append(s[:40])
            st["inbox_tags"] = cur[:20]
    elif action == "remove_tag":
        tag = str(payload.get("tag", "")).strip()
        cur = st.get("inbox_tags")
        if isinstance(cur, list) and tag in cur:
            st["inbox_tags"] = [x for x in cur if x != tag]
    else:
        return {"ok": False, "error": "unknown_action"}

    set_conversation_state(digits, st)
    return {"ok": True, "state": st}


def bump_inbox_unread(phone: str) -> None:
    digits = _normalize_phone(phone)
    if not digits:
        return
    st = get_conversation_state(digits)
    st["inbox_unread"] = int(st.get("inbox_unread", 0) or 0) + 1
    set_conversation_state(digits, st)
