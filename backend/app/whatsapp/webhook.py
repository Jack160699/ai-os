import json
import hmac
import os
import re
from datetime import datetime, timezone

from flask import Flask, g, jsonify, make_response, request

from app.ai.assistant import get_ai_reply
from app.config import Settings
from app.leads.analytics import compute_dashboard_metrics, parse_iso
from app.leads.classification import map_business_interactive_id
from app.leads.constants import OWNER_NUMBER
from app.leads.followups import (
    arm_followup_after_bot_send,
    clear_followup_on_user_inbound,
    process_due_followups,
    process_payment_pending_nudges,
)
from app.inbox.service import (
    apply_inbox_action,
    build_inbox_detail,
    build_inbox_list,
    bump_inbox_unread,
    mark_inbox_read,
)
from app.payments.internal import process_razorpay_internal
from app.memory.store import (
    clear_conversation_state,
    get_all_states,
    append_thread_message,
    get_conversation_state,
    get_lead_events,
    get_thread_messages,
    normalize_phone_digits,
    set_conversation_state,
)
from app.sales import states as sales_states
from app.sales.intercept import build_preview_state_for_sales, try_handle
from app.sales.razorpay_link import create_payment_link_http
from app.whatsapp.lead_flow import LeadFlowReply, ListMenuSpec, handle_lead_message
from app.whatsapp.messaging import (
    send_interactive_buttons,
    send_interactive_list,
    send_whatsapp_text,
)


def _wa_timestamp_iso(msg_data: dict) -> str | None:
    ts = msg_data.get("timestamp")
    if ts is None:
        return None
    try:
        sec = int(str(ts).strip())
        return datetime.fromtimestamp(sec, tz=timezone.utc).isoformat()
    except (TypeError, ValueError, OSError):
        return None


def _inbound_auto_reply_enabled() -> bool:
    return os.getenv("WHATSAPP_INBOUND_AUTO_REPLY", "1").strip().lower() not in ("0", "false", "no", "off")


_SESSION_RESET_GREETINGS = {"hi", "hello", "start", "restart"}


def _should_reset_session(state: dict, inbound: str, msg_type: str) -> bool:
    text = (inbound or "").strip().lower()
    if msg_type == "text" and text in _SESSION_RESET_GREETINGS:
        return True
    last_seen = parse_iso(str(state.get("last_user_seen_at", "")))
    if not last_seen:
        return False
    return (datetime.now(timezone.utc) - last_seen).total_seconds() > 30 * 60


def _extract_message_payload(msg_data: dict) -> tuple[str, str, str]:
    """Return (display_text, raw_interactive_id, msg_type)."""
    msg_type = str(msg_data.get("type") or "unknown")
    raw_interactive_id = ""
    message = ""
    if msg_type == "text":
        message = (msg_data.get("text") or {}).get("body") or ""
    elif msg_type == "interactive":
        inter = msg_data.get("interactive") or {}
        itype = inter.get("type")
        if itype == "button_reply":
            br = inter.get("button_reply") or {}
            raw_interactive_id = (br.get("id") or "").strip()
            message = (br.get("title") or raw_interactive_id or "[Button reply]").strip()
        elif itype == "list_reply":
            lr = inter.get("list_reply") or {}
            raw_interactive_id = (lr.get("id") or "").strip()
            message = (lr.get("title") or raw_interactive_id or "[List reply]").strip()
        else:
            message = f"[interactive:{itype or 'unknown'}]"
    elif msg_type == "image":
        cap = (msg_data.get("image") or {}).get("caption") or ""
        message = cap.strip() or "[Image]"
    elif msg_type == "video":
        message = (msg_data.get("video") or {}).get("caption") or "[Video]"
    elif msg_type == "audio":
        message = "[Audio]"
    elif msg_type == "document":
        doc = msg_data.get("document") or {}
        cap = (doc.get("caption") or "").strip()
        fname = (doc.get("filename") or "file").strip()
        message = cap or f"[Document: {fname}]"
    elif msg_type == "sticker":
        message = "[Sticker]"
    elif msg_type == "location":
        loc = msg_data.get("location") or {}
        lat, lon = loc.get("latitude"), loc.get("longitude")
        message = f"[Location {lat},{lon}]" if lat is not None and lon is not None else "[Location]"
    elif msg_type == "contacts":
        message = "[Contacts shared]"
    elif msg_type == "button":
        btn = msg_data.get("button") or {}
        message = (btn.get("text") or btn.get("payload") or "[Button]").strip()
    else:
        message = f"[{msg_type}]"
    return (message or "").strip(), raw_interactive_id, msg_type


def _profile_name_for_sender(value: dict, sender: str) -> str:
    contacts = value.get("contacts") or []
    sender_s = str(sender)
    for c in contacts:
        wid = str(c.get("wa_id", "") or c.get("waId", "") or "")
        if wid and wid != sender_s:
            continue
        name = (c.get("profile") or {}).get("name")
        if name:
            return str(name).strip()
    if len(contacts) == 1:
        name = (contacts[0].get("profile") or {}).get("name")
        if name:
            return str(name).strip()
    return ""


def _compute_dashboard_metrics() -> dict:
    return compute_dashboard_metrics(get_lead_events(), get_all_states())


def _try_ceo_pricing_approve(settings: Settings, inbound: str) -> str | None:
    """Owner WhatsApp: APPROVE <10–16 digit phone> <rupees> — push final price to buyer."""
    m = re.match(r"^\s*APPROVE\s+(\d{10,16})\s+₹?\s*(\d+)\s*$", (inbound or "").strip(), re.I)
    if not m:
        return None
    target = m.group(1)
    rupees = int(m.group(2))
    st = get_conversation_state(target)
    spread = max(2000, int(rupees * 0.12))
    floor = 5000
    q = {
        "basic": max(floor, rupees - spread),
        "standard": rupees,
        "premium": rupees + int(spread * 1.05),
        "complexity": "medium",
        "intent_level": "medium",
        "discount_pct_applied": 0,
        "currency": "INR",
    }
    st["last_quote"] = q
    st["admin_approved_rupees"] = rupees
    st["sales_stage"] = sales_states.PRICING_OFFERED
    set_conversation_state(target, st)
    msg = (
        f"Confirmed pricing for you: ₹{rupees:,}. "
        "Say **go ahead** when you want the secure payment link 👍"
    )
    send_whatsapp_text(settings, target, msg)
    append_thread_message(target, "assistant", msg)
    return f"Approved ₹{rupees:,} for +{target} — buyer notified on WhatsApp."


def _dashboard_api_payload(metrics: dict) -> dict:
    payload = {
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
        "recent_pipeline": metrics["recent_pipeline"],
        "hot_leads": metrics["hot_leads"],
    }
    payload["summary"].update(
        {
            "total_leads": metrics["total_leads"],
            "booked_calls": metrics["booked_calls"],
            "active_leads": metrics["active_leads"],
            "cold_leads": metrics["cold_leads"],
            "followups_sent": metrics["followups_sent"],
            "replied_after_followup": metrics["replied_after_followup"],
            "revival_conversions": metrics["revival_conversions"],
            "conversion_rate_pct": metrics["conversion_rate_pct"],
            "avg_time_to_reply_min": metrics["avg_time_to_reply_min"],
            "hot_score_count": metrics["hot_score_count"],
            "paid_revenue_rupees": metrics.get("paid_revenue_rupees", 0.0),
            "payments_count_30d": metrics.get("payments_count_30d", 0),
        }
    )
    payload.update(
        {
            "leads_by_day": metrics["leads_by_day"],
            "followups_by_day": metrics["followups_by_day"],
            "bookings_by_day": metrics["bookings_by_day"],
            "score_pie": metrics["score_pie"],
            "funnel": metrics["funnel"],
        }
    )
    return payload


def _render_dashboard(metrics: dict) -> str:
    crm_rows: list[dict] = []
    for r in metrics.get("recent_pipeline") or []:
        crm_rows.append(r)
    for e in metrics.get("recent_leads") or []:
        crm_rows.append(
            {
                "name": e.get("name", "-"),
                "phone": e.get("phone", "-"),
                "business_type": e.get("business_type", "-"),
                "intent_score": e.get("intent_score", "-"),
                "urgency": e.get("urgency", "-"),
                "followup_stage": "-",
                "last_reply_time": e.get("timestamp_utc", "-"),
                "status": "completed",
            }
        )

    def _row_time(x: dict) -> datetime:
        return parse_iso(str(x.get("last_reply_time", ""))) or datetime.min.replace(tzinfo=timezone.utc)

    crm_rows = sorted(crm_rows, key=_row_time, reverse=True)[:30]

    pain_lines = "".join(
        f"<div class='trend-row'><span>{name}</span><span>{count}</span></div>"
        for name, count in (metrics["top_pain_points"] or [("No data yet", 0)])
    )

    def _esc(x: object) -> str:
        s = str(x) if x is not None else ""
        return (
            s.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")[:120]
        )

    recent_rows = "".join(
        "<tr>"
        f"<td>{_esc(e.get('name','-'))}</td>"
        f"<td>{_esc(e.get('phone','-'))}</td>"
        f"<td>{_esc(e.get('business_type','-'))}</td>"
        f"<td>{_esc(e.get('intent_score','-'))}</td>"
        f"<td>{_esc(e.get('urgency','-'))}</td>"
        f"<td>{_esc(e.get('followup_stage','-'))}</td>"
        f"<td>{_esc(e.get('last_reply_time','-'))}</td>"
        f"<td>{_esc(e.get('status','-'))}</td>"
        "</tr>"
        for e in crm_rows
    ) or "<tr><td colspan='8'>No leads yet.</td></tr>"
    hot_rows = "".join(
        f"<li><strong>{_esc(e.get('phone','-'))}</strong> · {_esc(e.get('business_type','-'))} · "
        f"{_esc(e.get('pain_point','-'))} · {_esc(e.get('intent','-'))} · "
        f"{_esc(e.get('intent_score','-'))} · {_esc(e.get('summary','-'))}</li>"
        for e in metrics["hot_leads"]
    ) or "<li>No hot leads yet.</li>"

    chart_data = json.dumps(
        {
            "leads_by_day": metrics["leads_by_day"],
            "followups_by_day": metrics["followups_by_day"],
            "bookings_by_day": metrics["bookings_by_day"],
            "score_pie": metrics["score_pie"],
            "funnel": metrics["funnel"],
        }
    )

    return f"""<!doctype html>
<html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>
<title>Stratxcel Bot Dashboard</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<style>
body{{margin:0;font-family:Inter,system-ui,Segoe UI,Arial;background:#0b1220;color:#e5e7eb}}
.wrap{{max-width:1200px;margin:0 auto;padding:22px}}
.h1{{font-size:28px;font-weight:700;letter-spacing:-.02em;margin:0 0 4px}}
.sub{{color:#94a3b8;margin:0 0 22px}}
.grid{{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(190px,1fr))}}
.card{{background:#111a2e;border:1px solid #1f2a44;border-radius:14px;padding:14px}}
.k{{color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:.08em}}
.v{{font-size:26px;font-weight:700;margin-top:4px}}
.small{{font-size:12px;color:#93a4c3}}
.section{{margin-top:14px}}
.trend-row{{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1b2741;font-size:14px}}
.chartbox{{position:relative;height:260px;width:100%}}
table{{width:100%;border-collapse:collapse;font-size:12px}}
th,td{{padding:8px;border-bottom:1px solid #1b2741;text-align:left;vertical-align:top}}
th{{color:#9fb0cf;font-weight:600}}
ul{{margin:0;padding-left:18px}} li{{margin:8px 0;color:#d1d9e6}}
@media (max-width: 640px){{.v{{font-size:22px}} .wrap{{padding:14px}}}}
</style></head><body><div class='wrap'>
<h1 class='h1'>Stratxcel Lead Dashboard</h1>
<p class='sub'>Internal analytics for AI bot lead capture, follow-ups, and conversion.</p>

<div class='grid'>
  <div class='card'><div class='k'>Total leads</div><div class='v'>{metrics["total_leads"]}</div><div class='small'>Unique chats started</div></div>
  <div class='card'><div class='k'>Booked calls</div><div class='v'>{metrics["booked_calls"]}</div><div class='small'>Completed booking intent</div></div>
  <div class='card'><div class='k'>Active leads</div><div class='v'>{metrics["active_leads"]}</div><div class='small'>In funnel + listening</div></div>
  <div class='card'><div class='k'>Cold leads</div><div class='v'>{metrics["cold_leads"]}</div><div class='small'>Final / inactive pool</div></div>
  <div class='card'><div class='k'>Follow-ups sent</div><div class='v'>{metrics["followups_sent"]}</div><div class='small'>Automated nudges</div></div>
  <div class='card'><div class='k'>Replied after follow-up</div><div class='v'>{metrics["replied_after_followup"]}</div><div class='small'>Re-engaged contacts</div></div>
  <div class='card'><div class='k'>Revival conversions</div><div class='v'>{metrics["revival_conversions"]}</div><div class='small'>Reply after a nudge</div></div>
  <div class='card'><div class='k'>Conversion rate</div><div class='v'>{metrics["conversion_rate_pct"]:.1f}%</div><div class='small'>Calls / total leads</div></div>
  <div class='card'><div class='k'>Avg time to reply</div><div class='v'>{metrics["avg_time_to_reply_min"]}</div><div class='small'>Minutes (post follow-up)</div></div>
  <div class='card'><div class='k'>Hot leads (score)</div><div class='v'>{metrics["hot_score_count"]}</div><div class='small'>Heuristic Hot count</div></div>
  <div class='card'><div class='k'>Paid revenue (₹)</div><div class='v'>{metrics.get("paid_revenue_rupees", 0):,.0f}</div><div class='small'>Razorpay captured (running total)</div></div>
  <div class='card'><div class='k'>Payments (30d)</div><div class='v'>{metrics.get("payments_count_30d", 0)}</div><div class='small'>Successful captures</div></div>
</div>

<div class='grid section'>
  <div class='card'><div class='k'>Leads by day (7d)</div><div class='chartbox'><canvas id='cLeads'></canvas></div></div>
  <div class='card'><div class='k'>Follow-ups by day (7d)</div><div class='chartbox'><canvas id='cFollowups'></canvas></div></div>
  <div class='card'><div class='k'>Bookings by day (7d)</div><div class='chartbox'><canvas id='cBookings'></canvas></div></div>
</div>

<div class='grid section'>
  <div class='card'><div class='k'>Hot / warm / cold</div><div class='chartbox'><canvas id='cPie'></canvas></div></div>
  <div class='card'><div class='k'>Funnel</div><div class='chartbox'><canvas id='cFunnel'></canvas></div></div>
  <div class='card'>
    <div class='k'>Top pain points</div>
    {pain_lines}
    <div class='small section'>Legacy: daily leads {metrics["daily_leads"]} · 30d {metrics["total_30d"]} · completion {metrics["completion_rate"]:.1f}%</div>
  </div>
</div>

<div class='grid section'>
  <div class='card' style='grid-column:1/-1'>
    <div class='k'>Pipeline snapshot</div>
    <div class='trend-row'><span>Bookings today</span><span>{metrics["bookings_today"]}</span></div>
    <div class='trend-row'><span>Bookings (7d)</span><span>{metrics["bookings_week"]}</span></div>
    <div class='trend-row'><span>Bookings (30d)</span><span>{metrics["bookings_month"]}</span></div>
    <div class='trend-row'><span>Started chats</span><span>{metrics["total_started"]}</span></div>
    <div class='trend-row'><span>Completed leads</span><span>{metrics["total_completed"]}</span></div>
    <div class='trend-row'><span>Drop-off</span><span>{metrics["drop_off"]}</span></div>
  </div>
</div>

<div class='grid section'>
  <div class='card' style='grid-column:1/-1'>
    <div class='k'>Recent leads</div>
    <table><thead><tr><th>Name</th><th>Phone</th><th>Business</th><th>Intent score</th><th>Urgency</th><th>Follow-up stage</th><th>Last reply</th><th>Status</th></tr></thead>
    <tbody>{recent_rows}</tbody></table>
  </div>
  <div class='card' style='grid-column:1/-1'>
    <div class='k'>Hot lead preview</div>
    <ul>{hot_rows}</ul>
  </div>
</div>

<script type="application/json" id="sx-chart-data">{chart_data}</script>
<script>
const SX = JSON.parse(document.getElementById('sx-chart-data').textContent);
const labelColor = '#9fb0cf';
const gridColor = '#1b2741';
function lineChart(id, rows, label) {{
  const labels = rows.map(r => r.date);
  const data = rows.map(r => r.count);
  new Chart(document.getElementById(id), {{
    type: 'line',
    data: {{ labels, datasets: [{{ label, data, borderColor: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.15)', tension: 0.35, fill: true }}]}},
    options: {{
      responsive: true,
      maintainAspectRatio: false,
      plugins: {{ legend: {{ labels: {{ color: labelColor }} }} }},
      scales: {{
        x: {{ ticks: {{ color: labelColor }}, grid: {{ color: gridColor }} }},
        y: {{ ticks: {{ color: labelColor }}, grid: {{ color: gridColor }}, beginAtZero: true }}
      }}
    }}
  }});
}}
lineChart('cLeads', SX.leads_by_day, 'Leads');
lineChart('cFollowups', SX.followups_by_day, 'Follow-ups');
lineChart('cBookings', SX.bookings_by_day, 'Bookings');
new Chart(document.getElementById('cPie'), {{
  type: 'doughnut',
  data: {{
    labels: SX.score_pie.map(x => x.label),
    datasets: [{{ data: SX.score_pie.map(x => x.count), backgroundColor: ['#f97316','#38bdf8','#94a3b8'] }}]
  }},
  options: {{ responsive: true, maintainAspectRatio: false, plugins: {{ legend: {{ position: 'bottom', labels: {{ color: labelColor }} }} }} }}
}});
new Chart(document.getElementById('cFunnel'), {{
  type: 'bar',
  data: {{
    labels: SX.funnel.map(x => x.label),
    datasets: [{{ label: 'Count', data: SX.funnel.map(x => x.count), backgroundColor: '#6366f1' }}]
  }},
  options: {{
    responsive: true,
    maintainAspectRatio: false,
    plugins: {{ legend: {{ display: false }} }},
    scales: {{
      x: {{ ticks: {{ color: labelColor }}, grid: {{ color: gridColor }} }},
      y: {{ ticks: {{ color: labelColor }}, grid: {{ color: gridColor }}, beginAtZero: true }}
    }}
  }}
}});
</script>
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


def get_lang(sender: str) -> str:
    state = get_conversation_state(sender)
    lang = str(state.get("lang") or state.get("user_language") or "en").strip().lower()
    return lang if lang in {"en", "hi", "hinglish"} else "en"


def _localize_text(text: str, lang: str) -> str:
    if not text or lang == "en":
        return text
    t = text.strip()
    if lang == "hi":
        mapping = {
            "Welcome to StratXcel 🚀\n\nChoose your language:": "StratXcel में आपका स्वागत है 🚀\n\nकृपया अपनी भाषा चुनें:",
            "Please choose your language using the buttons below 👆": "कृपया नीचे दिए गए बटनों से अपनी भाषा चुनें 👆",
            "What would you like help with?": "आपको किस चीज़ में मदद चाहिए?",
            "Pick one option below so we can route you correctly 👇": "सही दिशा में ले जाने के लिए नीचे से एक विकल्प चुनें 👇",
            "Thanks for your message — a strategist will assist you shortly.": "आपके संदेश के लिए धन्यवाद — हमारी रणनीतिक टीम जल्द ही मदद करेगी।",
            "I've flagged our team — a human will join this thread shortly. Until then, tell me anything useful (timeline, budget band, must-haves) and I'll pass it along.": "मैंने हमारी टीम को सूचित कर दिया है — एक एक्सपर्ट जल्द ही इस चैट में जुड़ेंगे। तब तक आप अपनी टाइमलाइन, बजट और ज़रूरी बातें साझा करें।",
            "Need help completing payment?": "पेमेंट पूरा करने में मदद चाहिए?",
            "Slots are limited today — want me to reserve this?": "आज स्लॉट सीमित हैं — क्या मैं आपके लिए रिज़र्व कर दूँ?",
        }
        return mapping.get(t, t)
    mapping_hinglish = {
        "Welcome to StratXcel 🚀\n\nChoose your language:": "Welcome to StratXcel 🚀\n\nLanguage choose kar lo 😊",
        "Please choose your language using the buttons below 👆": "No worries 😊\nNeeche se language button tap kar do 👆",
        "What would you like help with?": "Kis cheez mein help chahiye? 😊",
        "Pick one option below so we can route you correctly 👇": "Perfect 👍\nNeeche se ek option pick kar lo,\nmain sahi direction mein le jaata hoon 👇",
        "Thanks for your message — a strategist will assist you shortly.": "Got it 👌\nAapka message mil gaya.\nStrategist abhi connect karega.",
        "I've flagged our team — a human will join this thread shortly. Until then, tell me anything useful (timeline, budget band, must-haves) and I'll pass it along.": "Perfect 👍 team ko bata diya hai — ek expert abhi connect karega.\n\nTab tak bas thoda idea de do —\nidea stage pe ho ya already business chal raha hai?\nBudget ka rough range bhi bata do 👌",
        "Need help completing payment?": "Payment complete karne mein help chahiye? 😊",
        "Slots are limited today — want me to reserve this?": "Aaj slots limited hain 👀\nChaaho to main aapke liye reserve kar doon 👍",
    }
    out = mapping_hinglish.get(t, t)
    out = (
        out.replace("कृपया", "Please")
        .replace("मैंने", "Maine")
        .replace("आप", "aap")
        .replace("आपको", "aapko")
        .replace("धन्यवाद", "thanks")
        .replace("सहायता", "help")
        .replace("साझा करें", "bata do")
        .replace("share karo", "bata do")
        .replace("must-haves", "must-have cheezein")
        .replace("Kindly", "Please")
    )
    if out == t:
        # Dynamic lines (including AI-style lines): keep it short, friendly, and naturally Hinglish.
        out = (
            out.replace("Please ", "")
            .replace("please ", "")
            .replace("Could you", "Kya aap")
            .replace("would you like", "chaahoge")
            .replace("assist", "help")
            .replace("share", "bata")
            .replace("details", "details")
        )
        if "\n" not in out and len(out) > 90:
            out = out.replace(". ", ".\n")
        if not any(x in out for x in ("👍", "👌", "😊")):
            out = f"{out} 👍"
    return out


def _localize_buttons(buttons: tuple[tuple[str, str], ...] | None, lang: str):
    if not buttons or lang == "en":
        return buttons
    out = []
    for bid, title in buttons:
        if bid == "lang_en":
            label = "English"
        elif bid == "lang_hi":
            label = "Hindi"
        elif bid == "lang_hinglish":
            label = "Hinglish"
        else:
            if lang == "hi":
                label = {
                    "Start Business": "बिज़नेस शुरू करें",
                    "Grow Business": "बिज़नेस बढ़ाएँ",
                    "Automate": "ऑटोमेट करें",
                    "Automate Business": "ऑटोमेट करें",
                    "Talk to Expert": "एक्सपर्ट से बात",
                }.get(title, title)
            else:
                label = {
                    "Start Business": "Business start karna",
                    "Grow Business": "Business grow karna",
                    "Automate": "Business automate",
                    "Automate Business": "Business automate karna",
                    "Talk to Expert": "Talk to Expert",
                }.get(title, title)
        out.append((bid, label[:20]))
    return tuple(out)


def _localize_list_menu(menu: ListMenuSpec | None, lang: str):
    if not menu or lang == "en":
        return menu
    if lang == "hi":
        translated_rows = []
        for rid, title, desc in menu.rows:
            tr = {
                "Start Business": "बिज़नेस शुरू करें",
                "Grow Business": "बिज़नेस बढ़ाएँ",
                "Automate": "ऑटोमेट करें",
                "Automate Business": "ऑटोमेट करें",
                "Sales low": "सेल्स कम",
                "No leads": "लीड्स नहीं",
                "No marketing system": "मार्केटिंग सिस्टम नहीं",
                "Team issue": "टीम इश्यू",
                "Idea not clear": "आइडिया क्लियर नहीं",
                "Launch plan missing": "लॉन्च प्लान नहीं",
                "No team / support": "टीम / सपोर्ट नहीं",
                "Too much manual work": "मैन्युअल काम ज़्यादा",
                "Follow-ups slow": "फॉलो-अप धीमे",
                "No proper system": "सिस्टम नहीं",
                "Something else": "कुछ और",
            }.get(title, title)
            translated_rows.append((rid, tr[:24], desc))
        return ListMenuSpec(
            button_label="विकल्प चुनें",
            section_title="मदद विषय",
            rows=tuple(translated_rows),
        )
    translated_rows = []
    for rid, title, desc in menu.rows:
        tr = {
            "Something else": "Something else",
            "No marketing system": "Marketing issue",
            "Choose topic": "Kya karna hai?",
            "Start Business": "Business start karna",
            "Grow Business": "Business grow karna",
            "Automate Business": "Business automate karna",
            "Pick challenge": "Sabse bada issue kya lag raha hai?",
        }.get(title, title)
        translated_rows.append((rid, tr[:24], desc))
    return ListMenuSpec(
        button_label={
            "Choose topic": "Kya karna hai?",
            "Pick challenge": "Issue choose karo",
            "Pick pain point": "Issue choose karo",
        }.get(menu.button_label or "Choose", menu.button_label or "Choose"),
        section_title={
            "Help topics": "Kya karna hai?",
            "Growth": "Sabse bada issue kya lag raha hai?",
            "Start stage": "Sabse bada issue kya lag raha hai?",
            "Automation": "Sabse bada issue kya lag raha hai?",
        }.get(menu.section_title or "Options", menu.section_title or "Options"),
        rows=tuple(translated_rows),
    )


def _default_buttons_for_state(sender: str, text: str) -> tuple[tuple[str, str], ...] | None:
    st = get_conversation_state(sender)
    stage = str(st.get("funnel_stage") or "")
    t = (text or "").lower()
    if stage == "ask_challenge" or "biggest challenge" in t:
        return (
            ("ch_sales_low", "Sales low"),
            ("ch_no_leads", "No leads"),
            ("ch_marketing", "Marketing issue"),
            ("ch_not_sure", "Not sure"),
        )
    if "kaha ho" in t or "where are you" in t or "idea stage" in t:
        return (("st_idea", "Idea stage"), ("st_running", "Already running"))
    if stage == "ask_stage" or "abhi kaha ho" in t:
        return (("st_idea", "Idea stage"), ("st_running", "Already running"))
    if stage == "offer_accept" or "start karna chahoge" in t:
        return (("offer_yes", "Yes Start"), ("offer_details", "Need Details"), ("offer_later", "Later"))
    return None


def _localize_reply_for_sender(sender: str, reply: LeadFlowReply) -> LeadFlowReply:
    lang = get_lang(sender)
    dynamic_buttons = reply.buttons
    if not dynamic_buttons and not reply.list_menu:
        dynamic_buttons = _default_buttons_for_state(sender, reply.body)
    return LeadFlowReply(
        body=_localize_text(reply.body, lang),
        buttons=_localize_buttons(dynamic_buttons, lang),
        list_menu=_localize_list_menu(reply.list_menu, lang),
    )


def _send_lead_flow_reply(settings: Settings, sender: str, reply: LeadFlowReply):
    localized = _localize_reply_for_sender(sender, reply)
    if localized.list_menu:
        return send_interactive_list(
            settings,
            sender,
            localized.body,
            button_label=localized.list_menu.button_label,
            section_title=localized.list_menu.section_title,
            rows=localized.list_menu.rows,
        )
    if localized.buttons:
        return send_interactive_buttons(settings, sender, localized.body, localized.buttons)
    return send_whatsapp_text(settings, sender, localized.body)


def _finalize_wa_auto_reply(settings: Settings, sender: str, reply: LeadFlowReply, wa_mid: str) -> None:
    resp = _send_lead_flow_reply(settings, sender, reply)
    if wa_mid and resp.ok:
        st1 = get_conversation_state(sender)
        st1["last_wa_mid"] = wa_mid
        st1["last_bot_inbound_mid"] = wa_mid
        set_conversation_state(sender, st1)
        append_thread_message(sender, "assistant", _localize_reply_for_sender(sender, reply).body or "")
        arm_followup_after_bot_send(sender)


_ENTRY_LANG_BUTTONS = (("lang_en", "English"), ("lang_hi", "Hindi"), ("lang_hinglish", "Hinglish"))
_ENTRY_MENU_LIST = ListMenuSpec(
    button_label="Choose topic",
    section_title="Help topics",
    rows=(
        ("menu_start", "Start Business", None),
        ("menu_grow", "Grow Business", None),
        ("menu_auto", "Automate Business", None),
    ),
)
_ENTRY_MENU_INBOUND = {
    "menu_start": "I want to start a new business",
    "menu_grow": "I want to grow my existing business",
    "menu_auto": "I want to automate my business operations",
}

SESSION_PRICE = 499
_FUNNEL_Q_STAGE = "Aap abhi kaha ho?"
_FUNNEL_PITCH = (
    "Perfect 👍 ab clear hai.\n\n"
    "Main aapko ek complete plan de sakta hoon jisme:\n"
    "• roadmap\n"
    "• execution steps\n"
    "• growth strategy\n\n"
    "Isse aap directly start kar paoge.\n\n"
    f"Intro session fee: ₹{SESSION_PRICE}\n\n"
    "Start karna chahoge?"
)


def _is_yesish(text: str) -> bool:
    t = (text or "").strip().lower()
    return t in {"yes", "y", "haan", "ha", "ok", "okay", "sure", "start", "go", "go ahead", "yes start"}


def _is_explicit_human_request(text: str) -> bool:
    t = (text or "").lower()
    return any(x in t for x in ("human", "agent", "expert", "consultant", "support", "real person"))


def _dynamic_challenge_question(need: str) -> LeadFlowReply:
    if need == "start":
        return LeadFlowReply(
            body="Nice 🚀 start karna exciting hai.\n\nAbhi biggest challenge kya lag raha hai?",
            list_menu=ListMenuSpec(
                button_label="Pick challenge",
                section_title="Start stage",
                rows=(
                    ("ch_idea_clear", "Idea not clear", None),
                    ("ch_launch_plan", "Launch plan missing", None),
                    ("ch_no_team", "No team / support", None),
                    ("ch_other", "Something else", None),
                ),
            ),
        )
    if need == "automate":
        return LeadFlowReply(
            body="Got it 👌 automation pe focus karte hain.\n\nAbhi sabse bada pain point kya hai?",
            list_menu=ListMenuSpec(
                button_label="Pick pain point",
                section_title="Automation",
                rows=(
                    ("ch_manual_work", "Too much manual work", None),
                    ("ch_followups", "Follow-ups slow", None),
                    ("ch_no_system", "No proper system", None),
                    ("ch_other", "Something else", None),
                ),
            ),
        )
    return LeadFlowReply(
        body="Nice 👍 growth pe focus karte hain.\n\nAbhi biggest challenge kya lag raha hai?",
        list_menu=ListMenuSpec(
            button_label="Pick challenge",
            section_title="Growth",
            rows=(
                ("ch_sales_low", "Sales low", None),
                ("ch_no_leads", "No leads", None),
                ("ch_marketing", "No marketing system", None),
                ("ch_team_issue", "Team issue", None),
            ),
        ),
    )


def _dynamic_level_options(challenge_text: str) -> tuple[tuple[str, str], ...]:
    t = (challenge_text or "").lower()
    if "sales" in t or "lead" in t:
        return (("lvl_start", "Just starting"), ("lvl_growth", "Serious growth"), ("lvl_scale", "Full scale setup"))
    if "manual" in t or "system" in t or "automation" in t:
        return (("lvl_start", "Basic setup"), ("lvl_growth", "Serious growth"), ("lvl_scale", "Full scale setup"))
    return (("lvl_start", "Just starting"), ("lvl_growth", "Serious growth"), ("lvl_scale", "Full scale setup"))


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

    @app.route("/lead/<path:phone>", methods=["GET"])
    def lead_transcript(phone: str):
        if settings.dashboard_password and not _is_dashboard_authed(settings):
            return jsonify({"error": "unauthorized"}), 401
        digits = "".join(c for c in (phone or "") if c.isdigit())
        if not digits:
            return jsonify({"error": "invalid phone"}), 400
        rows = get_thread_messages(digits)
        return jsonify({"phone": digits, "transcript": rows}), 200

    @app.route("/inbox.json", methods=["GET"])
    def inbox_json():
        if settings.dashboard_password and not _is_dashboard_authed(settings):
            return jsonify({"error": "unauthorized"}), 401
        q = request.args.get("q", "") or ""
        temperature = request.args.get("temperature", "all") or "all"
        unread_only = str(request.args.get("unread_only", "")).lower() in ("1", "true", "yes")
        return jsonify(build_inbox_list(q=q, temperature=temperature, unread_only=unread_only)), 200

    @app.route("/api/chats", methods=["GET"])
    def api_chats():
        """Stable JSON path for hosted bot (e.g. Vercel admin proxies here; reads memory.json on server)."""
        if settings.dashboard_password and not _is_dashboard_authed(settings):
            return jsonify({"error": "unauthorized"}), 401
        q = request.args.get("q", "") or ""
        temperature = request.args.get("temperature", "all") or "all"
        unread_only = str(request.args.get("unread_only", "")).lower() in ("1", "true", "yes")
        return jsonify(build_inbox_list(q=q, temperature=temperature, unread_only=unread_only)), 200

    @app.route("/inbox/lead/<path:phone>", methods=["GET"])
    def inbox_lead_detail(phone: str):
        if settings.dashboard_password and not _is_dashboard_authed(settings):
            return jsonify({"error": "unauthorized"}), 401
        detail = build_inbox_detail(phone)
        if not detail:
            return jsonify({"error": "not_found"}), 404
        return jsonify(detail), 200

    @app.route("/inbox/mark-read", methods=["POST"])
    def inbox_mark_read_route():
        if settings.dashboard_password and not _is_dashboard_authed(settings):
            return jsonify({"error": "unauthorized"}), 401
        data = request.get_json(silent=True) or {}
        if mark_inbox_read(str(data.get("phone", ""))):
            return jsonify({"ok": True}), 200
        return jsonify({"ok": False}), 400

    @app.route("/inbox/action", methods=["POST"])
    def inbox_action_route():
        if settings.dashboard_password and not _is_dashboard_authed(settings):
            return jsonify({"error": "unauthorized"}), 401
        data = request.get_json(silent=True) or {}
        out = apply_inbox_action(str(data.get("phone", "")), str(data.get("action", "")), data.get("payload"))
        return jsonify(out), (200 if out.get("ok") else 400)

    @app.route("/inbox/reply", methods=["POST"])
    def inbox_reply_route():
        if settings.dashboard_password and not _is_dashboard_authed(settings):
            return jsonify({"error": "unauthorized"}), 401
        data = request.get_json(silent=True) or {}
        text = (data.get("text") or "").strip()
        digits = "".join(c for c in str(data.get("phone", "") or "") if c.isdigit())
        if not digits or not text or len(text) > 4000:
            return jsonify({"ok": False, "error": "invalid_body"}), 400
        resp = send_whatsapp_text(settings, digits, text)
        if not resp.ok:
            return jsonify({"ok": False, "error": (resp.text or "")[:500]}), 502
        append_thread_message(digits, "assistant", text)
        return jsonify({"ok": True}), 200

    @app.route("/inbox/suggest", methods=["POST"])
    def inbox_suggest_route():
        if settings.dashboard_password and not _is_dashboard_authed(settings):
            return jsonify({"error": "unauthorized"}), 401
        data = request.get_json(silent=True) or {}
        detail = build_inbox_detail(str(data.get("phone", "")))
        if not detail:
            return jsonify({"suggestions": []}), 404
        return jsonify({"suggestions": detail.get("suggestions") or []}), 200

    @app.route("/internal/followups", methods=["POST"])
    def internal_followups():
        if not settings.followup_cron_secret:
            return jsonify({"error": "followups disabled"}), 404
        got = request.headers.get("X-Followup-Cron-Secret", "")
        if not hmac.compare_digest(got, settings.followup_cron_secret):
            return jsonify({"error": "unauthorized"}), 401
        result = process_due_followups(settings)
        pay = process_payment_pending_nudges(settings)
        out = {**result, "payment_nudges": pay}
        print(
            "[followup-cron] "
            f"checked={result['checked']} sent={result['sent']} "
            f"skipped={result['skipped']} completed={result['completed']} "
            f"pay_nudge_sent={pay.get('sent', 0)}"
        )
        return jsonify(out), 200

    @app.route("/internal/razorpay-payment", methods=["POST"])
    def internal_razorpay_payment():
        exp = (settings.internal_payment_webhook_secret or "").strip()
        if not exp:
            return jsonify({"error": "disabled"}), 404
        got = request.headers.get("X-Internal-Payment-Secret", "")
        if len(got) != len(exp) or not hmac.compare_digest(got.encode("utf-8"), exp.encode("utf-8")):
            return jsonify({"error": "unauthorized"}), 401
        data = request.get_json(silent=True) or {}
        try:
            out = process_razorpay_internal(settings, data)
            return jsonify(out), 200
        except Exception as e:
            print("[internal/razorpay-payment] error:", e)
            return jsonify({"ok": False, "error": str(e)}), 500

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
        except (KeyError, IndexError, TypeError) as e:
            print("[wa-webhook] parse error (no entry/changes/value):", e)
            return "ok", 200

        metadata = value.get("metadata") or {}
        phone_number_id = str(metadata.get("phone_number_id") or "").strip()
        messages = value.get("messages") or []
        print(
            "[wa-webhook] received messages=",
            len(messages) if isinstance(messages, list) else 0,
            "phone_number_id=",
            phone_number_id or "(none)",
            "has_statuses=",
            bool(value.get("statuses")),
        )

        if not isinstance(messages, list) or not messages:
            return "ok", 200

        owner_digits = normalize_phone_digits(OWNER_NUMBER)
        auto_reply = _inbound_auto_reply_enabled()

        for msg_data in messages:
            if not isinstance(msg_data, dict):
                continue
            try:
                raw_from = str(msg_data.get("from") or "").strip()
                # Prevent webhook echo loops: ignore our own outbound messages.
                if raw_from and (
                    raw_from == str(getattr(settings, "phone_number_id", "") or "").strip()
                    or raw_from == str(settings.wa_phone_number_id or "").strip()
                    or (phone_number_id and raw_from == phone_number_id)
                ):
                    print("[wa-webhook] skip self/echo message from=", raw_from)
                    continue
                sender = normalize_phone_digits(raw_from)
                wa_mid = str(msg_data.get("id") or "")
                ts_iso = _wa_timestamp_iso(msg_data)

                if not sender:
                    print("[wa-webhook] skip empty sender id=", wa_mid)
                    continue

                st0 = get_conversation_state(sender)

                message, raw_interactive_id, msg_type = _extract_message_payload(msg_data)
                if msg_type not in {
                    "text",
                    "interactive",
                    "image",
                    "video",
                    "audio",
                    "document",
                    "location",
                    "contacts",
                    "button",
                }:
                    print("[wa-webhook] skip non-user message type=", msg_type, "id=", wa_mid)
                    continue
                step = st0.get("step", "start")
                inbound = (message or "").strip()
                if raw_interactive_id:
                    if step == "await_business":
                        mapped = map_business_interactive_id(raw_interactive_id)
                        if mapped:
                            inbound = mapped
                    elif step == "await_booking_answer" and raw_interactive_id in (
                        "booking_yes",
                        "booking_no",
                    ):
                        inbound = "yes" if raw_interactive_id == "booking_yes" else "no"

                if not inbound:
                    print("[wa-webhook] skip empty inbound type=", msg_type, "id=", wa_mid)
                    continue

                if phone_number_id:
                    try:
                        st_meta = get_conversation_state(sender)
                        if st_meta.get("wa_phone_number_id") != phone_number_id:
                            st_meta["wa_phone_number_id"] = phone_number_id
                            set_conversation_state(sender, st_meta)
                            print("[wa-webhook] workspace sender=", sender, "phone_number_id=", phone_number_id)
                    except Exception as e:
                        print("[wa-webhook] workspace map error:", e)

                mode = "ceo" if sender == owner_digits else "client"
                g.ai_os_mode = mode

                print("[wa-webhook] inbound type=", msg_type, "from=", sender, "text=", inbound[:120])

                if mode == "ceo":
                    if wa_mid and get_conversation_state(sender).get("last_wa_mid") == wa_mid:
                        print("[wa-webhook] ceo dedupe wa_mid=", wa_mid)
                        continue
                    approve_note = _try_ceo_pricing_approve(settings, inbound)
                    if approve_note:
                        print("[wa-webhook] ceo pricing approve:", approve_note[:120])
                        resp = send_whatsapp_text(settings, sender, approve_note)
                        if wa_mid and resp.ok:
                            st_ap = get_conversation_state(sender)
                            st_ap["last_wa_mid"] = wa_mid
                            set_conversation_state(sender, st_ap)
                        continue
                    if not auto_reply:
                        if wa_mid:
                            st_skip = get_conversation_state(sender)
                            st_skip["last_wa_mid"] = wa_mid
                            set_conversation_state(sender, st_skip)
                        print("[wa-webhook] ceo inbound skipped (auto-reply off)")
                        continue
                    reply_text = get_ai_reply(settings, inbound, wa_user_id=sender, mode=mode)
                    print("[wa-webhook] bot reply (ceo):", (reply_text or "")[:200])
                    resp = send_whatsapp_text(settings, sender, reply_text)
                    if wa_mid and resp.ok:
                        st1 = get_conversation_state(sender)
                        st1["last_wa_mid"] = wa_mid
                        set_conversation_state(sender, st1)
                    print("[wa-webhook] STATUS:", getattr(resp, "status_code", "?"))
                    continue

                st_live = get_conversation_state(sender)
                if _should_reset_session(st_live, inbound, msg_type):
                    clear_conversation_state(sender)
                    print("STATE RESET")

                st_seen = get_conversation_state(sender)
                st_seen["last_user_seen_at"] = datetime.now(timezone.utc).isoformat()
                set_conversation_state(sender, st_seen)

                clear_followup_on_user_inbound(sender, inbound)
                added = append_thread_message(
                    sender,
                    "user",
                    inbound,
                    wa_message_id=wa_mid,
                    timestamp_utc=ts_iso,
                )
                if added:
                    bump_inbox_unread(sender)
                    print("[wa-webhook] saved message sender=", sender, "wa_mid=", wa_mid)
                else:
                    print("[wa-webhook] duplicate inbound storage wa_mid=", wa_mid, "sender=", sender)

                profile_name = _profile_name_for_sender(value, sender)
                st_profile = get_conversation_state(sender)
                if profile_name and not (st_profile.get("profile_name") or "").strip():
                    st_profile["profile_name"] = profile_name.strip()
                    set_conversation_state(sender, st_profile)

                if not auto_reply:
                    if wa_mid:
                        st_done = get_conversation_state(sender)
                        st_done["last_wa_mid"] = wa_mid
                        set_conversation_state(sender, st_done)
                    print("[wa-webhook] conversation updated (client, auto-reply off — inbox only)")
                    continue

                if wa_mid and get_conversation_state(sender).get("last_bot_inbound_mid") == wa_mid:
                    print("[wa-webhook] skip bot already sent for wa_mid=", wa_mid)
                    continue

                st_paid_onb = get_conversation_state(sender)
                onb_step = str(st_paid_onb.get("onboarding_step") or "").strip()
                if onb_step:
                    rid = (raw_interactive_id or "").strip()
                    if onb_step == "await_call_slot":
                        slot = ""
                        if rid == "onb_today":
                            slot = "Today"
                        elif rid == "onb_tomorrow":
                            slot = "Tomorrow"
                        elif rid == "onb_custom":
                            slot = "Custom"
                        elif inbound:
                            slot = inbound
                        if slot:
                            st_next = {**st_paid_onb, "onboarding_step": "await_business_type", "preferred_call_slot": slot}
                            set_conversation_state(sender, st_next)
                            ask_bt = "Call se pehle thoda bata do —\naapka business kis type ka hai?"
                            _finalize_wa_auto_reply(settings, sender, LeadFlowReply(body=ask_bt), wa_mid)
                            return "", 200
                    elif onb_step == "await_business_type":
                        st_next = {**st_paid_onb, "onboarding_step": "await_current_challenge", "onboarding_business_type": inbound}
                        set_conversation_state(sender, st_next)
                        ask_ch = "Got it 👌\nAbhi current biggest challenge kya chal raha hai?"
                        _finalize_wa_auto_reply(settings, sender, LeadFlowReply(body=ask_ch), wa_mid)
                        return "", 200
                    elif onb_step == "await_current_challenge":
                        st_next = {**st_paid_onb, "onboarding_step": "await_main_goal", "onboarding_current_challenge": inbound}
                        set_conversation_state(sender, st_next)
                        ask_goal = "Nice 👍\nIs session ka main goal kya rakhna chahoge?"
                        _finalize_wa_auto_reply(settings, sender, LeadFlowReply(body=ask_goal), wa_mid)
                        return "", 200
                    elif onb_step == "await_main_goal":
                        st_next = {**st_paid_onb, "onboarding_step": "done", "onboarding_main_goal": inbound}
                        set_conversation_state(sender, st_next)
                        done = "Perfect 👍 noted.\nTeam aapko call details share karegi."
                        _finalize_wa_auto_reply(settings, sender, LeadFlowReply(body=done), wa_mid)
                        return "", 200

                st_onb = get_conversation_state(sender)
                entry_flow = (st_onb.get("entry_flow") or "").strip()
                if entry_flow and entry_flow not in ("language_select", "menu", "ready"):
                    set_conversation_state(sender, {**st_onb, "entry_flow": ""})
                    st_onb = get_conversation_state(sender)
                    entry_flow = (st_onb.get("entry_flow") or "").strip()

                flow_inbound = inbound

                if not entry_flow:
                    print("FIRST MESSAGE FLOW")
                    tl = build_preview_state_for_sales(st_onb, inbound)["transcript_lines"]
                    set_conversation_state(
                        sender,
                        {
                            **st_onb,
                            "entry_flow": "language_select",
                            "step": "start",
                            "lang": st_onb.get("lang", "en"),
                            "transcript_lines": tl,
                        },
                    )
                    welcome_lang = LeadFlowReply(
                        body="Welcome to StratXcel 🚀\n\nChoose your language:",
                        buttons=_ENTRY_LANG_BUTTONS,
                    )
                    _finalize_wa_auto_reply(settings, sender, welcome_lang, wa_mid)
                    return "", 200

                if entry_flow == "language_select":
                    rid = (raw_interactive_id or "").strip()
                    lang: str | None = None
                    if rid == "lang_en":
                        lang = "en"
                    elif rid == "lang_hi":
                        lang = "hi"
                    elif rid == "lang_hinglish":
                        lang = "hinglish"
                    else:
                        low = inbound.lower()
                        if low in ("english", "en", "inglish") or "english" in low:
                            lang = "en"
                        elif low in ("hindi", "hi", "हिंदी") or "hindi" in low:
                            lang = "hi"
                        elif low in ("hinglish", "hin-glish") or "hinglish" in low:
                            lang = "hinglish"
                    if not lang:
                        retry = LeadFlowReply(
                            body="Please choose your language using the buttons below 👆",
                            buttons=_ENTRY_LANG_BUTTONS,
                        )
                        _finalize_wa_auto_reply(settings, sender, retry, wa_mid)
                        return "", 200
                    st_lang = get_conversation_state(sender)
                    tl2 = build_preview_state_for_sales(st_lang, inbound)["transcript_lines"]
                    set_conversation_state(
                        sender,
                        {
                            **st_lang,
                            "entry_flow": "menu",
                            "lang": lang,
                            "user_language": lang,
                            "transcript_lines": tl2,
                        },
                    )
                    menu_reply = LeadFlowReply(
                        body="What would you like help with?",
                        list_menu=_ENTRY_MENU_LIST,
                    )
                    _finalize_wa_auto_reply(settings, sender, menu_reply, wa_mid)
                    return "", 200

                if entry_flow == "menu":
                    rid = (raw_interactive_id or "").strip()
                    if rid not in _ENTRY_MENU_INBOUND:
                        retry_m = LeadFlowReply(
                            body="Pick one option below so we can route you correctly 👇",
                            list_menu=_ENTRY_MENU_LIST,
                        )
                        _finalize_wa_auto_reply(settings, sender, retry_m, wa_mid)
                        return "", 200
                    st_menu = get_conversation_state(sender)
                    tl3 = build_preview_state_for_sales(st_menu, inbound)["transcript_lines"]
                    need = "start" if rid == "menu_start" else "grow" if rid == "menu_grow" else "automate"
                    set_conversation_state(
                        sender,
                        {
                            **st_menu,
                            "entry_flow": "ready",
                            "menu_choice": rid,
                            "step": "await_business",
                            "funnel_need": need,
                            "funnel_stage": "ask_challenge",
                            "funnel_answers": {},
                            "transcript_lines": tl3,
                        },
                    )
                    _finalize_wa_auto_reply(settings, sender, _dynamic_challenge_question(need), wa_mid)
                    return "", 200

                st_sales = get_conversation_state(sender)
                if (st_sales.get("entry_flow") or "").strip() != "ready":
                    print("ENTRY FLOW INCOMPLETE — skip intercept/lead")
                    if wa_mid:
                        st_inc = get_conversation_state(sender)
                        st_inc["last_wa_mid"] = wa_mid
                        set_conversation_state(sender, st_inc)
                    return "", 200

                funnel_stage = str(st_sales.get("funnel_stage") or "").strip()
                if funnel_stage:
                    if funnel_stage == "offer_closed":
                        print("[wa-webhook] offer already closed, waiting for restart")
                        return "", 200
                    # Explicit user human request is always allowed.
                    if _is_explicit_human_request(inbound):
                        preview_h = build_preview_state_for_sales(st_sales, inbound)
                        h_ok, h_reply = try_handle(settings, sender, inbound, preview_h, profile_name or "")
                        if h_ok and h_reply is not None:
                            _finalize_wa_auto_reply(settings, sender, h_reply, wa_mid)
                            return "", 200
                    answers = dict(st_sales.get("funnel_answers") or {})
                    if raw_interactive_id and st_sales.get("last_funnel_button_id") == raw_interactive_id and st_sales.get("last_funnel_stage") == funnel_stage:
                        print("[wa-webhook] duplicate funnel button ignored:", raw_interactive_id)
                        return "", 200
                    if funnel_stage == "ask_challenge":
                        challenge = raw_interactive_id if (raw_interactive_id or "").startswith("ch_") else inbound
                        answers["challenge"] = challenge
                        st_next = {
                            **st_sales,
                            "funnel_stage": "ask_stage",
                            "funnel_answers": answers,
                            "last_funnel_button_id": raw_interactive_id or "",
                            "last_funnel_stage": funnel_stage,
                        }
                        set_conversation_state(sender, st_next)
                        _finalize_wa_auto_reply(
                            settings,
                            sender,
                            LeadFlowReply(
                                body=_FUNNEL_Q_STAGE,
                                buttons=(("st_idea", "Idea stage"), ("st_running", "Already running")),
                            ),
                            wa_mid,
                        )
                        return "", 200
                    if funnel_stage == "ask_stage":
                        stage_answer = inbound
                        if raw_interactive_id == "st_idea":
                            stage_answer = "Idea stage"
                        elif raw_interactive_id == "st_running":
                            stage_answer = "Already running"
                        answers["stage"] = stage_answer
                        answers["need"] = st_sales.get("funnel_need", "grow")
                        st_next = {
                            **st_sales,
                            "funnel_stage": "offer_accept",
                            "funnel_answers": answers,
                            "last_funnel_button_id": raw_interactive_id or "",
                            "last_funnel_stage": funnel_stage,
                        }
                        set_conversation_state(sender, st_next)
                        _finalize_wa_auto_reply(
                            settings,
                            sender,
                            LeadFlowReply(
                                body=_FUNNEL_PITCH,
                                buttons=(("offer_yes", "Yes Start"), ("offer_details", "Need Details"), ("offer_later", "Later")),
                            ),
                            wa_mid,
                        )
                        return "", 200
                    if funnel_stage == "offer_accept":
                        rid = (raw_interactive_id or "").strip()
                        if rid == "offer_details" or "detail" in inbound.lower():
                            detail_body = (
                                "Isme aapko:\n"
                                "• complete roadmap\n"
                                "• exact next steps\n"
                                "• clarity milegi\n\n"
                                f"Session fee ₹{SESSION_PRICE} hi rahega 👍"
                            )
                            st_det = {
                                **st_sales,
                                "last_funnel_button_id": rid or "",
                                "last_funnel_stage": funnel_stage,
                            }
                            set_conversation_state(sender, st_det)
                            _finalize_wa_auto_reply(
                                settings,
                                sender,
                                LeadFlowReply(body=detail_body, buttons=(("offer_yes", "Yes Start"), ("offer_later", "Later"))),
                                wa_mid,
                            )
                            return "", 200
                        if rid == "offer_later" or "later" in inbound.lower() or "baad" in inbound.lower():
                            st_later = {
                                **st_sales,
                                "funnel_stage": "offer_closed",
                                "last_funnel_button_id": rid or "offer_later",
                                "last_funnel_stage": funnel_stage,
                            }
                            set_conversation_state(sender, st_later)
                            _finalize_wa_auto_reply(
                                settings,
                                sender,
                                LeadFlowReply(body="No worries 😊 jab ready ho, bas 'start' likh dena. Main yahin hoon 👍"),
                                wa_mid,
                            )
                            return "", 200
                        if rid == "offer_yes" or _is_yesish(inbound):
                            try:
                                link = create_payment_link_http(
                                    amount_rupees=float(SESSION_PRICE),
                                    name=(st_sales.get("profile_name") or "Customer"),
                                    phone_digits=sender,
                                    description="StratXcel Intro Strategy Session",
                                    email="",
                                )
                                short = str(link.get("short_url") or "")
                                st_next = {
                                    **st_sales,
                                    "funnel_stage": "payment_pending",
                                    "last_quote": {"basic": SESSION_PRICE, "standard": SESSION_PRICE, "premium": SESSION_PRICE, "currency": "INR"},
                                    "sales_stage": sales_states.PAYMENT_PENDING,
                                    "pending_payment_link_id": str(link.get("id") or ""),
                                    "last_payment_link_url": short,
                                    "payment_pending_since": datetime.now(timezone.utc).isoformat(),
                                    "payment_nudge_level": 0,
                                    "last_funnel_button_id": rid or "offer_yes",
                                    "last_funnel_stage": funnel_stage,
                                }
                                set_conversation_state(sender, st_next)
                                pay_body = (
                                    "Great 👍 yahan se secure payment kar sakte ho:\n\n"
                                    f"{short}\n\n"
                                    "Payment hote hi onboarding start ho jayega 🚀"
                                )
                                _finalize_wa_auto_reply(settings, sender, LeadFlowReply(body=pay_body), wa_mid)
                                return "", 200
                            except Exception:
                                _finalize_wa_auto_reply(
                                    settings,
                                    sender,
                                    LeadFlowReply(body="No worries 😊 payment link create kar raha hoon — ek sec, try karo 'Yes Start' again."),
                                    wa_mid,
                                )
                                return "", 200

                print("WEBHOOK HIT:", flow_inbound[:500])
                display_sales = (st_sales.get("profile_name") or profile_name or "").strip()
                preview_sales = build_preview_state_for_sales(st_sales, flow_inbound)
                handled, sales_reply = try_handle(settings, sender, flow_inbound, preview_sales, display_sales)
                print("HANDLED =", handled)
                if handled:
                    print("INTERCEPT OVERRIDE HIT")
                    merged_sales = {**get_conversation_state(sender), "transcript_lines": preview_sales["transcript_lines"]}
                    set_conversation_state(sender, merged_sales)
                    if sales_reply is not None:
                        print("[wa-webhook] sales intercept path:", (sales_reply.body or "")[:200])
                        resp = _send_lead_flow_reply(settings, sender, sales_reply)
                        if wa_mid and resp.ok:
                            st_sales_done = get_conversation_state(sender)
                            st_sales_done["last_wa_mid"] = wa_mid
                            st_sales_done["last_bot_inbound_mid"] = wa_mid
                            set_conversation_state(sender, st_sales_done)
                            append_thread_message(
                                sender,
                                "assistant",
                                _localize_reply_for_sender(sender, sales_reply).body,
                            )
                            arm_followup_after_bot_send(sender)
                            print("[wa-webhook] conversation updated + sales intercept assistant appended")
                        else:
                            print(
                                "[wa-webhook] sales intercept outbound failed STATUS=",
                                getattr(resp, "status_code", "?"),
                            )
                    return "", 200

                reply = handle_lead_message(settings, sender, flow_inbound, profile_name=profile_name)
                print("[wa-webhook] bot reply (client):", (reply.body or "")[:200])
                resp = _send_lead_flow_reply(settings, sender, reply)
                if wa_mid and resp.ok:
                    st1 = get_conversation_state(sender)
                    st1["last_wa_mid"] = wa_mid
                    st1["last_bot_inbound_mid"] = wa_mid
                    set_conversation_state(sender, st1)
                    append_thread_message(
                        sender,
                        "assistant",
                        _localize_reply_for_sender(sender, reply).body,
                    )
                    arm_followup_after_bot_send(sender)
                    print("[wa-webhook] conversation updated + assistant appended")
                else:
                    print("[wa-webhook] outbound failed STATUS=", getattr(resp, "status_code", "?"), "body=", getattr(resp, "text", "")[:300])
            except Exception as e:
                print("[wa-webhook] message loop error:", e)

        return "ok", 200

    return app
