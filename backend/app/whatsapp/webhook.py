from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
import hmac

from flask import Flask, g, jsonify, make_response, request

from app.ai.assistant import generate_lead_recommendation, get_ai_reply
from app.config import Settings
from app.leads.crm import build_lead_payload, send_to_google_sheets
from app.memory.store import (
    append_lead_event,
    get_conversation_state,
    get_lead_events,
    set_conversation_state,
)
from app.whatsapp.messaging import send_whatsapp_text

# WhatsApp Cloud API sends `from` as digits only (no +). Must match exactly.
OWNER_NUMBER = "917777812777"

WELCOME_MESSAGE = (
    "Hey 👋 Welcome to Stratxcel.\n\n"
    "We help businesses capture leads, automate workflows, and grow using AI systems.\n\n"
    "What kind of business do you run?\n\n"
    "1️⃣ Agency\n"
    "2️⃣ Local Business\n"
    "3️⃣ Online Business\n"
    "4️⃣ Other"
)

CHALLENGE_MESSAGE = (
    "What’s your biggest challenge right now?\n\n"
    "1️⃣ Getting Leads\n"
    "2️⃣ Slow Follow-ups\n"
    "3️⃣ Too Much Manual Work\n"
    "4️⃣ Scaling Operations"
)

BUSINESS_OPTIONS = {
    "1": "Agency",
    "2": "Local Business",
    "3": "Online Business",
    "4": "Other",
}

CHALLENGE_OPTIONS = {
    "1": "Getting Leads",
    "2": "Slow Follow-ups",
    "3": "Too Much Manual Work",
    "4": "Scaling Operations",
}

NO_OPTIONS_MESSAGE = (
    "No problem — what would help most right now?\n\n"
    "1️⃣ Pricing\n"
    "2️⃣ Recommendation\n"
    "3️⃣ Later"
)


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_iso(ts: str) -> datetime | None:
    try:
        if ts.endswith("Z"):
            ts = ts[:-1] + "+00:00"
        dt = datetime.fromisoformat(ts)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:
        return None


def _normalize_choice(text: str) -> str:
    cleaned = (text or "").strip().lower()
    return cleaned[0] if cleaned and cleaned[0].isdigit() else cleaned


def _is_yes(text: str) -> bool:
    t = (text or "").strip().lower()
    return t in {"yes", "y", "1"}


def _is_no(text: str) -> bool:
    t = (text or "").strip().lower()
    return t in {"no", "n", "2"}


def _is_greeting(text: str) -> bool:
    t = (text or "").strip().lower()
    return t in {"hi", "hello", "hey", "hii", "yo", "start"}


def _record_lead_event(event_type: str, phone: str, **fields) -> None:
    event = {
        "type": event_type,
        "phone": phone,
        "timestamp_utc": _utc_now_iso(),
    }
    event.update(fields)
    append_lead_event(event)


def _send_admin_hot_lead_alert(settings: Settings, sender: str, payload: dict) -> None:
    target = settings.admin_alert_number or OWNER_NUMBER
    if not target or target == sender:
        return
    alert = (
        "HOT LEAD\n"
        f"Phone: {payload.get('phone', sender)}\n"
        f"Business: {payload.get('business_type', 'Unknown')}\n"
        f"Pain point: {payload.get('pain_point', 'Unknown')}\n"
        f"Intent: {payload.get('intent', 'Unknown')}\n"
        f"Preferred time: {payload.get('preferred_time', '-')}\n"
        f"At: {payload.get('timestamp_utc', '-')}"
    )
    try:
        send_whatsapp_text(settings, target, alert)
    except Exception as e:
        print(f"[lead-alert] failed: {e}")


def _log_completed_lead(
    settings: Settings,
    sender: str,
    business_type: str,
    challenge: str,
    intent: str,
    preferred_time: str,
) -> None:
    _record_lead_event(
        "completed",
        sender,
        business_type=business_type,
        pain_point=challenge,
        intent=intent,
        preferred_time=preferred_time,
    )
    payload = build_lead_payload(
        phone=sender,
        business_type=business_type,
        pain_point=challenge,
        intent=intent,
        preferred_time=preferred_time,
    )
    send_to_google_sheets(settings, payload)

    is_hot = intent == "yes" or challenge in {"Getting Leads", "Scaling Operations"}
    if is_hot:
        _send_admin_hot_lead_alert(settings, sender, payload)


def _handle_lead_flow(settings: Settings, sender: str, message: str) -> str:
    state = get_conversation_state(sender)
    step = state.get("step", "start")

    # Start on greeting / first message.
    if step == "start":
        _record_lead_event("started", sender)
        set_conversation_state(sender, {"step": "await_business"})
        return WELCOME_MESSAGE

    if step == "await_business":
        choice = _normalize_choice(message)
        business = BUSINESS_OPTIONS.get(choice)
        if not business:
            return "Please reply with 1, 2, 3, or 4 so I can tailor this correctly."

        set_conversation_state(
            sender,
            {
                "step": "await_challenge",
                "business_type": business,
            },
        )
        return CHALLENGE_MESSAGE

    if step == "await_challenge":
        choice = _normalize_choice(message)
        challenge = CHALLENGE_OPTIONS.get(choice)
        if not challenge:
            return "Please reply with 1, 2, 3, or 4 so I can recommend the right next step."

        business_type = state.get("business_type", "Business")
        recommendation = generate_lead_recommendation(settings, business_type, challenge)
        set_conversation_state(
            sender,
            {
                "step": "await_booking_answer",
                "business_type": business_type,
                "challenge": challenge,
            },
        )
        return (
            f"{recommendation}\n\n"
            "Would you like to book a quick strategy call?"
        )

    if step == "await_booking_answer":
        if _is_yes(message):
            set_conversation_state(
                sender,
                {
                    "step": "await_preferred_time",
                    "business_type": state.get("business_type"),
                    "challenge": state.get("challenge"),
                },
            )
            if settings.booking_url:
                return (
                    f"Great — book here: {settings.booking_url}\n\n"
                    "If you prefer, share a suitable time and we will schedule it for you."
                )
            return "Great. What time works best for you this week?"

        if _is_no(message):
            set_conversation_state(
                sender,
                {
                    "step": "await_no_option",
                    "business_type": state.get("business_type"),
                    "challenge": state.get("challenge"),
                },
            )
            return NO_OPTIONS_MESSAGE

        return "Please reply Yes or No."

    if step == "await_preferred_time":
        if _is_greeting(message):
            set_conversation_state(sender, {"step": "await_business"})
            return WELCOME_MESSAGE
        business_type = state.get("business_type", "Business")
        challenge = state.get("challenge", "Scaling Operations")
        _log_completed_lead(
            settings=settings,
            sender=sender,
            business_type=business_type,
            challenge=challenge,
            intent="yes",
            preferred_time=message.strip(),
        )
        set_conversation_state(
            sender,
            {
                "step": "complete",
                "business_type": business_type,
                "challenge": challenge,
            },
        )
        return "Perfect — noted. We will confirm the strategy call slot shortly."

    if step == "await_no_option":
        choice = _normalize_choice(message)
        if choice == "1":
            _log_completed_lead(
                settings=settings,
                sender=sender,
                business_type=state.get("business_type", "Business"),
                challenge=state.get("challenge", "Scaling Operations"),
                intent="no_pricing",
                preferred_time="",
            )
            set_conversation_state(
                sender,
                {
                    "step": "complete",
                    "business_type": state.get("business_type"),
                    "challenge": state.get("challenge"),
                },
            )
            return (
                "Pricing is based on system scope and workflow complexity. "
                "Share your business type and we can outline a clear range."
            )
        if choice == "2":
            business_type = state.get("business_type", "Business")
            challenge = state.get("challenge", "Scaling Operations")
            recommendation = generate_lead_recommendation(settings, business_type, challenge)
            set_conversation_state(
                sender,
                {
                    "step": "await_booking_answer",
                    "business_type": business_type,
                    "challenge": challenge,
                },
            )
            return f"{recommendation}\n\nWould you like to book a quick strategy call?"
        if choice == "3":
            _log_completed_lead(
                settings=settings,
                sender=sender,
                business_type=state.get("business_type", "Business"),
                challenge=state.get("challenge", "Scaling Operations"),
                intent="no_later",
                preferred_time="",
            )
            set_conversation_state(sender, {"step": "complete"})
            return "Absolutely. Reach out anytime when you are ready."
        return "Please reply with 1, 2, or 3."

    # Once complete, keep the CTA crisp and conversion-focused.
    if step == "complete":
        if _is_greeting(message):
            set_conversation_state(sender, {"step": "await_business"})
            return WELCOME_MESSAGE
        return "Would you like to book a quick strategy call?"

    set_conversation_state(sender, {"step": "await_business"})
    return WELCOME_MESSAGE


def _compute_dashboard_metrics() -> dict:
    events = get_lead_events()
    completed = [e for e in events if e.get("type") == "completed"]
    started = [e for e in events if e.get("type") == "started"]

    now = datetime.now(timezone.utc)
    today = now.date()
    week_start = now - timedelta(days=7)
    month_start = now - timedelta(days=30)

    daily_counts = defaultdict(int)
    for e in completed:
        dt = _parse_iso(e.get("timestamp_utc", ""))
        if dt:
            daily_counts[dt.date().isoformat()] += 1

    trend = []
    for i in range(6, -1, -1):
        day = (today - timedelta(days=i)).isoformat()
        trend.append((day[5:], daily_counts.get(day, 0)))

    completed_today = 0
    completed_week = 0
    completed_month = 0
    bookings_total = 0
    bookings_today = 0
    bookings_week = 0
    bookings_month = 0
    pain_counter = Counter()
    hot_leads = []

    for e in completed:
        dt = _parse_iso(e.get("timestamp_utc", ""))
        if not dt:
            continue
        intent = str(e.get("intent", "")).lower()
        pain = e.get("pain_point", "Unknown")
        pain_counter[pain] += 1

        if dt.date() == today:
            completed_today += 1
        if dt >= week_start:
            completed_week += 1
        if dt >= month_start:
            completed_month += 1

        is_booking = intent == "yes"
        if is_booking:
            bookings_total += 1
            if dt.date() == today:
                bookings_today += 1
            if dt >= week_start:
                bookings_week += 1
            if dt >= month_start:
                bookings_month += 1

        if is_booking or pain in {"Getting Leads", "Scaling Operations"}:
            hot_leads.append(e)

    started_phones = {e.get("phone") for e in started if e.get("phone")}
    completed_phones = {e.get("phone") for e in completed if e.get("phone")}
    total_started = len(started_phones)
    total_completed = len(completed_phones)
    completion_rate = (total_completed / total_started * 100) if total_started else 0.0
    drop_off = max(total_started - total_completed, 0)

    recent_leads = sorted(
        completed,
        key=lambda e: _parse_iso(e.get("timestamp_utc", "")) or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )[:25]
    hot_leads = sorted(
        hot_leads,
        key=lambda e: _parse_iso(e.get("timestamp_utc", "")) or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )[:12]

    return {
        "daily_leads": completed_today,
        "trend_7d": trend,
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
        "hot_leads": hot_leads,
    }


def _dashboard_api_payload(metrics: dict) -> dict:
    return {
        "summary": {
            "daily_leads": metrics["daily_leads"],
            "total_30d": metrics["total_30d"],
            "hot_leads_count": metrics["hot_leads_count"],
            "bookings_total": metrics["bookings_total"],
            "booking_rate": round(metrics["booking_rate"], 2),
            "bookings_today": metrics["bookings_today"],
            "bookings_week": metrics["bookings_week"],
            "bookings_month": metrics["bookings_month"],
            "total_started": metrics["total_started"],
            "total_completed": metrics["total_completed"],
            "drop_off": metrics["drop_off"],
            "completion_rate": round(metrics["completion_rate"], 2),
        },
        "trend_7d": [{"date": d, "count": c} for d, c in metrics["trend_7d"]],
        "top_pain_points": [{"label": n, "count": c} for n, c in metrics["top_pain_points"]],
        "recent_leads": metrics["recent_leads"],
        "hot_leads": metrics["hot_leads"],
    }


def _render_dashboard(metrics: dict) -> str:
    trend_lines = "".join(
        f"<div class='trend-row'><span>{d}</span><span>{c}</span></div>" for d, c in metrics["trend_7d"]
    )
    pain_lines = "".join(
        f"<div class='trend-row'><span>{name}</span><span>{count}</span></div>"
        for name, count in (metrics["top_pain_points"] or [("No data yet", 0)])
    )
    recent_rows = "".join(
        "<tr>"
        f"<td>{e.get('phone','-')}</td>"
        f"<td>{e.get('business_type','-')}</td>"
        f"<td>{e.get('pain_point','-')}</td>"
        f"<td>{e.get('intent','-')}</td>"
        f"<td>{(e.get('timestamp_utc','') or '-')[:16].replace('T',' ')}</td>"
        "</tr>"
        for e in metrics["recent_leads"]
    ) or "<tr><td colspan='5'>No leads yet.</td></tr>"
    hot_rows = "".join(
        f"<li><strong>{e.get('phone','-')}</strong> · {e.get('business_type','-')} · "
        f"{e.get('pain_point','-')} · {e.get('intent','-')}</li>"
        for e in metrics["hot_leads"]
    ) or "<li>No hot leads yet.</li>"

    return f"""<!doctype html>
<html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>
<title>Stratxcel Bot Dashboard</title>
<style>
body{{margin:0;font-family:Inter,system-ui,Segoe UI,Arial;background:#0b1220;color:#e5e7eb}}
.wrap{{max-width:1100px;margin:0 auto;padding:22px}}
.h1{{font-size:28px;font-weight:700;letter-spacing:-.02em;margin:0 0 4px}}
.sub{{color:#94a3b8;margin:0 0 22px}}
.grid{{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(210px,1fr))}}
.card{{background:#111a2e;border:1px solid #1f2a44;border-radius:14px;padding:14px}}
.k{{color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:.08em}}
.v{{font-size:28px;font-weight:700;margin-top:4px}}
.small{{font-size:13px;color:#93a4c3}}
.section{{margin-top:14px}}
.trend-row{{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1b2741;font-size:14px}}
table{{width:100%;border-collapse:collapse;font-size:13px}}
th,td{{padding:10px;border-bottom:1px solid #1b2741;text-align:left}}
th{{color:#9fb0cf;font-weight:600}}
ul{{margin:0;padding-left:18px}} li{{margin:8px 0;color:#d1d9e6}}
@media (max-width: 640px){{.v{{font-size:23px}} .wrap{{padding:14px}}}}
</style></head><body><div class='wrap'>
<h1 class='h1'>Stratxcel Lead Dashboard</h1>
<p class='sub'>Internal analytics for AI bot lead capture and conversion.</p>

<div class='grid'>
  <div class='card'><div class='k'>Daily leads</div><div class='v'>{metrics["daily_leads"]}</div><div class='small'>30-day total: {metrics["total_30d"]}</div></div>
  <div class='card'><div class='k'>Hot leads</div><div class='v'>{metrics["hot_leads_count"]}</div><div class='small'>High intent + key pain points</div></div>
  <div class='card'><div class='k'>Bookings</div><div class='v'>{metrics["bookings_total"]}</div><div class='small'>Rate: {metrics["booking_rate"]:.1f}%</div></div>
  <div class='card'><div class='k'>Completion</div><div class='v'>{metrics["completion_rate"]:.1f}%</div><div class='small'>Drop-off: {metrics["drop_off"]}</div></div>
</div>

<div class='grid section'>
  <div class='card'><div class='k'>7-day trend</div>{trend_lines}</div>
  <div class='card'><div class='k'>Top pain points</div>{pain_lines}</div>
  <div class='card'>
    <div class='k'>Booking conversion windows</div>
    <div class='trend-row'><span>Today</span><span>{metrics["bookings_today"]}</span></div>
    <div class='trend-row'><span>7 days</span><span>{metrics["bookings_week"]}</span></div>
    <div class='trend-row'><span>30 days</span><span>{metrics["bookings_month"]}</span></div>
  </div>
  <div class='card'>
    <div class='k'>Response funnel</div>
    <div class='trend-row'><span>Conversations started</span><span>{metrics["total_started"]}</span></div>
    <div class='trend-row'><span>Completed flow</span><span>{metrics["total_completed"]}</span></div>
    <div class='trend-row'><span>Drop-off after start</span><span>{metrics["drop_off"]}</span></div>
  </div>
</div>

<div class='grid section'>
  <div class='card'>
    <div class='k'>Recent leads</div>
    <table><thead><tr><th>Phone</th><th>Business</th><th>Pain point</th><th>Intent</th><th>Time</th></tr></thead>
    <tbody>{recent_rows}</tbody></table>
  </div>
  <div class='card'>
    <div class='k'>Hot lead alerts</div>
    <ul>{hot_rows}</ul>
  </div>
</div>
</div></body></html>"""


def _is_dashboard_authed(settings: Settings) -> bool:
    password = settings.dashboard_password
    if not password:
        return True
    header_value = request.headers.get("X-Dashboard-Password", "")
    if header_value and hmac.compare_digest(header_value, password):
        return True
    cookie_value = request.cookies.get("sx_admin_auth", "")
    return hmac.compare_digest(cookie_value, password)


def create_app(settings: Settings) -> Flask:
    app = Flask(__name__)

    @app.route("/", methods=["GET"])
    def home():
        return "WhatsApp AI assistant is running."

    @app.route("/dashboard.json", methods=["GET"])
    def dashboard_json():
        if settings.dashboard_password and not _is_dashboard_authed(settings):
            return jsonify({"error": "unauthorized"}), 401
        metrics = _compute_dashboard_metrics()
        return jsonify(_dashboard_api_payload(metrics)), 200

    @app.route("/dashboard", methods=["GET", "POST"])
    @app.route("/admin", methods=["GET", "POST"])
    def dashboard():
        if request.args.get("logout") == "1":
            resp = make_response("Logged out")
            resp.set_cookie("sx_admin_auth", "", max_age=0, httponly=True, samesite="Lax")
            return resp

        if settings.dashboard_password and not _is_dashboard_authed(settings):
            if request.method == "POST":
                submitted = (request.form.get("password") or "").strip()
                if hmac.compare_digest(submitted, settings.dashboard_password):
                    resp = make_response("", 302)
                    resp.headers["Location"] = request.path
                    resp.set_cookie(
                        "sx_admin_auth",
                        settings.dashboard_password,
                        max_age=60 * 60 * 12,
                        httponly=True,
                        samesite="Lax",
                    )
                    return resp
            return (
                "<html><body style='font-family:Inter,system-ui;background:#0b1220;color:#e5e7eb;"
                "display:flex;align-items:center;justify-content:center;min-height:100vh'>"
                "<form method='post' style='background:#111a2e;border:1px solid #1f2a44;padding:20px;border-radius:12px;min-width:280px'>"
                "<h3 style='margin:0 0 12px'>Stratxcel Admin Login</h3>"
                "<input name='password' type='password' placeholder='Password' style='width:100%;padding:10px;"
                "border-radius:8px;border:1px solid #2a3a5f;background:#0f172a;color:#e5e7eb' />"
                "<button type='submit' style='margin-top:10px;width:100%;padding:10px;border:0;border-radius:8px;"
                "background:#2563eb;color:white;font-weight:600'>Open Dashboard</button></form></body></html>",
                401,
            )

        metrics = _compute_dashboard_metrics()
        return _render_dashboard(metrics), 200, {"Content-Type": "text/html; charset=utf-8"}

    @app.route("/webhook", methods=["GET"])
    def verify():
        token = request.args.get("hub.verify_token")
        challenge = request.args.get("hub.challenge")
        if token == settings.wa_verify_token and challenge:
            return challenge, 200
        return "Invalid token", 403

    @app.route("/webhook", methods=["POST"])
    def webhook():
        data = request.get_json(silent=True) or {}

        try:
            value = data["entry"][0]["changes"][0]["value"]

            if "messages" not in value:
                return "ok", 200

            msg_data = value["messages"][0]
            if "text" not in msg_data:
                return "ok", 200

            message = msg_data["text"]["body"]
            sender = msg_data["from"]

            mode = "ceo" if sender == OWNER_NUMBER else "client"
            g.ai_os_mode = mode

            print("User:", message)

            if mode == "ceo":
                reply = get_ai_reply(settings, message, wa_user_id=sender, mode=mode)
            else:
                reply = _handle_lead_flow(settings, sender, message)
            print("Bot:", reply)

            resp = send_whatsapp_text(settings, sender, reply)
            print("STATUS:", resp.status_code)
            print("RESPONSE:", resp.text)

        except (KeyError, IndexError, TypeError) as e:
            print("Webhook parse error:", e)
        except Exception as e:
            print("Webhook error:", str(e))

        return "ok", 200

    return app
