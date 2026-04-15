"""Dashboard analytics helpers for leads + follow-ups."""

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone

from app.leads.growth_hot_score import compute_growth_hot_score
from app.memory.store import get_conversion_events, get_payment_events, load_memory


_PENDING_STEPS = frozenset(
    {
        "await_business",
        "await_challenge",
        "await_booking_answer",
        "await_preferred_time",
        "await_no_option",
    }
)


def parse_iso(ts: str) -> datetime | None:
    try:
        if ts.endswith("Z"):
            ts = ts[:-1] + "+00:00"
        dt = datetime.fromisoformat(ts)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:
        return None


def _day_key(dt: datetime) -> str:
    return dt.date().isoformat()


def _compute_source_roi_rows() -> list[dict]:
    """Aggregate conversion_events by traffic source for ROI-style dashboard."""
    rows = get_conversion_events()
    if not rows:
        return []
    agg: dict[str, dict[str, float]] = defaultdict(lambda: {"started": 0, "cta": 0, "paid": 0, "rows": 0})
    for e in rows[-1500:]:
        src = str(e.get("source") or "unknown").strip() or "unknown"
        agg[src]["rows"] += 1
        agg[src]["started"] += float(e.get("started") or 0)
        agg[src]["cta"] += float(e.get("cta_shown") or 0)
        agg[src]["paid"] += float(e.get("paid") or 0)
    out: list[dict] = []
    for src, a in agg.items():
        started = int(a["started"])
        cta = int(a["cta"])
        paid = int(a["paid"])
        funnel = max(1, started + cta)
        conv = round((paid / funnel) * 100, 2) if funnel else 0.0
        roi_index = round(paid * 12 + cta * 3 + started * 1, 1)
        out.append(
            {
                "source": src,
                "started_signals": started,
                "cta_signals": cta,
                "paid_signals": paid,
                "conversion_index_pct": conv,
                "roi_score": roi_index,
            }
        )
    out.sort(key=lambda x: x["roi_score"], reverse=True)
    return out[:20]


def compute_dashboard_metrics(events: list[dict], states: dict[str, dict]) -> dict:
    now = datetime.now(timezone.utc)
    month_start = now - timedelta(days=30)
    payment_events = get_payment_events()
    paid_rev_roll = 0.0
    try:
        paid_rev_roll = float((load_memory() or {}).get("revenue_total_rupees") or 0.0)
    except (TypeError, ValueError):
        paid_rev_roll = 0.0

    paid_rev_30d = 0.0
    payments_count_30d = 0
    for pe in payment_events:
        dt = parse_iso(str(pe.get("recorded_at_utc") or pe.get("timestamp_utc") or ""))
        if not dt or dt < month_start:
            continue
        try:
            ar = pe.get("amount_rupees")
            if ar is None or str(ar).strip() == "":
                continue
            paid_rev_30d += float(ar)
            payments_count_30d += 1
        except (TypeError, ValueError):
            continue
    today = now.date()
    started = [e for e in events if e.get("type") == "started"]
    completed = [e for e in events if e.get("type") == "completed"]
    followups = [e for e in events if e.get("type") == "followup"]

    lead_by_day = defaultdict(int)
    followup_by_day = defaultdict(int)
    booking_by_day = defaultdict(int)
    score_counter = Counter()
    pain_counter = Counter()
    response_delays_min: list[float] = []
    hot_leads: list[dict] = []

    bookings_total = 0
    bookings_today = 0
    bookings_week = 0
    bookings_month = 0
    completed_today = 0
    completed_month = 0
    week_start = now - timedelta(days=7)

    for e in completed:
        dt = parse_iso(str(e.get("timestamp_utc", "")))
        if not dt:
            continue
        lead_by_day[_day_key(dt)] += 1
        if dt.date() == today:
            completed_today += 1
        if dt >= month_start:
            completed_month += 1

        intent = str(e.get("intent", "")).lower()
        if intent == "yes":
            bookings_total += 1
            booking_by_day[_day_key(dt)] += 1
            if dt.date() == today:
                bookings_today += 1
            if dt >= week_start:
                bookings_week += 1
            if dt >= month_start:
                bookings_month += 1

        score = str(e.get("intent_score", "Warm") or "Warm")
        score_counter[score] += 1
        pain_counter[str(e.get("pain_point", "Unknown"))] += 1
    for e in followups:
        dt = parse_iso(str(e.get("timestamp_utc", "")))
        if dt:
            followup_by_day[_day_key(dt)] += 1

    started_phones = {e.get("phone") for e in started if e.get("phone")}
    completed_phones = {e.get("phone") for e in completed if e.get("phone")}
    total_started = len(started_phones)
    total_completed = len(completed_phones)
    completion_rate = (total_completed / total_started * 100) if total_started else 0.0
    drop_off = max(total_started - total_completed, 0)

    active_leads = 0
    cold_leads = 0
    replied_after_followup = 0
    revival_conversions = 0
    recent_pipeline: list[dict] = []

    for phone, st in states.items():
        if phone in completed_phones or st.get("step") == "complete":
            continue
        step = str(st.get("step", "start"))
        stopped = bool(st.get("followup_stopped"))
        status = str(st.get("lead_status", "active"))
        if str(st.get("lead_status", "")) == "booked":
            status = "booked"
        elif step in _PENDING_STEPS and not stopped:
            active_leads += 1
            status = "active"
        elif status in {"cold", "inactive"} or (
            stopped and str(st.get("followup_stop_reason", "")) == "final_followup_sent"
        ):
            cold_leads += 1
            status = "cold" if status != "inactive" else "inactive"
        if st.get("replied_after_followup"):
            replied_after_followup += 1

        followup_last = parse_iso(str(st.get("followup_last_sent_at", "")))
        last_reply = parse_iso(str(st.get("last_user_reply_at", "")))
        if followup_last and last_reply and last_reply > followup_last:
            revival_conversions += 1
            response_delays_min.append((last_reply - followup_last).total_seconds() / 60.0)

        gh = compute_growth_hot_score(st)
        tags = st.get("inbox_tags") if isinstance(st.get("inbox_tags"), list) else []
        notes = st.get("lead_notes") if isinstance(st.get("lead_notes"), list) else []
        note_preview = ""
        if notes:
            last = notes[-1]
            if isinstance(last, dict):
                note_preview = str(last.get("text", ""))[:80]
        recent_pipeline.append(
            {
                "name": st.get("profile_name", "-"),
                "phone": phone,
                "business_type": st.get("business_type", "-"),
                "intent": st.get("intent", "-"),
                "intent_score": st.get("intent_score", "-"),
                "urgency": st.get("urgency", "-"),
                "followup_stage": st.get("followup_stage_sent", 0),
                "last_reply_time": st.get("last_user_reply_at", "-"),
                "status": status,
                "summary": st.get("summary", "-"),
                "growth_score": gh.get("growth_score"),
                "growth_label": gh.get("growth_label"),
                "growth_factors": gh.get("growth_factors"),
                "lead_tags": tags[:12],
                "note_preview": note_preview,
            }
        )

    def _recent_key(x: dict) -> datetime:
        dt = parse_iso(str(x.get("last_reply_time", "")))
        return dt or datetime.min.replace(tzinfo=timezone.utc)

    recent_pipeline = sorted(recent_pipeline, key=_recent_key, reverse=True)[:25]

    recent_leads = sorted(
        completed,
        key=lambda e: parse_iso(str(e.get("timestamp_utc", ""))) or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )[:25]

    hot_map: dict[str, dict] = {}
    for e in completed:
        intent = str(e.get("intent", "")).lower()
        pain = e.get("pain_point", "Unknown")
        if intent == "yes" or pain in {"Getting Leads", "Scaling Operations"} or str(e.get("intent_score", "")) == "Hot":
            phone = str(e.get("phone", "") or "")
            if not phone:
                continue
            prev = hot_map.get(phone)
            if not prev:
                hot_map[phone] = e
                continue
            if (parse_iso(str(e.get("timestamp_utc", ""))) or datetime.min.replace(tzinfo=timezone.utc)) >= (
                parse_iso(str(prev.get("timestamp_utc", ""))) or datetime.min.replace(tzinfo=timezone.utc)
            ):
                hot_map[phone] = e

    hot_leads = sorted(
        list(hot_map.values()),
        key=lambda e: parse_iso(str(e.get("timestamp_utc", ""))) or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )[:12]

    trend_7d = []
    leads_by_day = []
    followups_by_day = []
    bookings_by_day = []
    for i in range(6, -1, -1):
        day = (today - timedelta(days=i)).isoformat()
        short = day[5:]
        trend_7d.append((short, lead_by_day.get(day, 0)))
        leads_by_day.append({"date": short, "count": lead_by_day.get(day, 0)})
        followups_by_day.append({"date": short, "count": followup_by_day.get(day, 0)})
        bookings_by_day.append({"date": short, "count": booking_by_day.get(day, 0)})

    avg_time_to_reply_min = (
        round(sum(response_delays_min) / len(response_delays_min), 2) if response_delays_min else 0.0
    )

    total_leads = total_started
    booked_calls = bookings_total
    conversion_rate = (booked_calls / total_leads * 100) if total_leads else 0.0
    followups_sent = len([f for f in followups if f.get("status") in {"sent", "final"}])
    hot_count = score_counter.get("Hot", 0)
    warm_count = score_counter.get("Warm", 0)
    cold_count_scores = score_counter.get("Cold", 0)

    return {
        # Existing keys
        "daily_leads": completed_today,
        "trend_7d": trend_7d,
        "total_30d": completed_month,
        "hot_leads_count": len(hot_leads),
        "bookings_total": bookings_total,
        "booking_rate": (bookings_total / len(completed) * 100) if completed else 0.0,
        "bookings_today": bookings_today,
        "bookings_week": bookings_week,
        "bookings_month": bookings_month,
        "top_pain_points": pain_counter.most_common(4),
        "total_started": total_started,
        "total_completed": total_completed,
        "drop_off": drop_off,
        "completion_rate": completion_rate,
        "recent_leads": recent_leads,
        "recent_pipeline": recent_pipeline,
        "hot_leads": hot_leads,
        # New keys
        "total_leads": total_leads,
        "booked_calls": booked_calls,
        "active_leads": active_leads,
        "cold_leads": cold_leads,
        "followups_sent": followups_sent,
        "replied_after_followup": replied_after_followup,
        "revival_conversions": revival_conversions,
        "conversion_rate_pct": round(conversion_rate, 2),
        "avg_time_to_reply_min": avg_time_to_reply_min,
        "leads_by_day": leads_by_day,
        "followups_by_day": followups_by_day,
        "bookings_by_day": bookings_by_day,
        "score_pie": [
            {"label": "Hot", "count": hot_count},
            {"label": "Warm", "count": warm_count},
            {"label": "Cold", "count": cold_count_scores},
        ],
        "funnel": [
            {"label": "Chats", "count": total_started},
            {"label": "Leads", "count": total_completed},
            {"label": "Calls", "count": booked_calls},
            {"label": "Closed", "count": max(total_completed - booked_calls, 0)},
        ],
        "hot_score_count": hot_count,
        "paid_revenue_rupees": round(paid_rev_roll, 2),
        "paid_revenue_30d_rupees": round(paid_rev_30d, 2),
        "payments_count_30d": payments_count_30d,
        "source_roi": _compute_source_roi_rows(),
    }

