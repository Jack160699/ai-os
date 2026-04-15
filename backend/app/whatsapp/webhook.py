import json
import hmac
import os
import re
import io
import csv
from datetime import datetime, timedelta, timezone

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
    append_conversion_event,
    clear_conversation_state,
    get_conversion_events,
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


def _is_new_user_state(state: dict) -> bool:
    if not isinstance(state, dict) or not state:
        return True
    return not any(
        state.get(k)
        for k in (
            "entry_flow",
            "funnel_stage",
            "onboarding_step",
            "step",
            "lead_status",
            "last_user_seen_at",
        )
    )


def _contains_entry_greeting(inbound: str) -> bool:
    t = (inbound or "").strip().lower()
    if not t:
        return False
    return t in {"hi", "hello", "hey", "start"}


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


def _log_conversion_snapshot(phone: str, st: dict, *, started: int = 0, cta_shown: int = 0, paid: int = 0) -> None:
    cs = st.get("consultant_state") if isinstance(st, dict) else {}
    if not isinstance(cs, dict):
        cs = {}
    history = cs.get("history") if isinstance(cs.get("history"), list) else []
    path = " > ".join(str(x) for x in history[-8:])
    append_conversion_event(
        {
            "date": datetime.now(timezone.utc).isoformat(),
            "phone": phone,
            "started": int(started),
            "cta_shown": int(cta_shown),
            "paid": int(paid),
            "source": str(st.get("lead_source") or st.get("funnel_need") or cs.get("platform") or "unknown"),
            "language": str(st.get("lang") or st.get("user_language") or "english"),
            "path_selected": path,
        }
    )


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
    lang = str(state.get("lang") or state.get("user_language") or "english").strip().lower()
    if lang in {"en", "english"}:
        return "english"
    if lang in {"hi", "hindi"}:
        return "hindi"
    return "hinglish"


def get_user_lang(sender: str) -> str:
    return get_lang(sender)


def _enforce_lang_tone(text: str, lang: str) -> str:
    out = text or ""
    if not out:
        return out
    if lang == "english":
        return (
            out.replace("Samajh gaya", "Got it")
            .replace("Bilkul", "Absolutely")
            .replace("Koi tension nahi", "No worries")
            .replace("kya aa raha hai", "what is happening")
            .replace("Aap alone nahi ho", "You are not alone")
            .replace("Aap", "You")
            .replace("aap", "you")
            .replace("hai", "is")
            .replace("karna", "do")
        )
    if lang == "hindi":
        return (
            out.replace("No worries", "कोई टेंशन नहीं")
            .replace("Got it", "समझ गया")
            .replace("Simple bataun", "सिंपल बताऊं")
        )
    return out


def _localize_text(text: str, lang: str) -> str:
    if not text:
        return text
    t = text.strip()
    if lang == "hindi":
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
        return _enforce_lang_tone(mapping.get(t, t), lang)
    if lang == "english":
        return _enforce_lang_tone(t, lang)
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
    return _enforce_lang_tone(out, lang)


def _localize_buttons(buttons: tuple[tuple[str, str], ...] | None, lang: str):
    if not buttons or lang == "english":
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
            if lang == "hindi":
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
    if not menu or lang == "english":
        return menu
    if lang == "hindi":
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
            "Pick challenge": "Problem kya aa raha hai?",
        }.get(title, title)
        translated_rows.append((rid, tr[:24], desc))
    return ListMenuSpec(
        button_label={
            "Choose topic": "Kya karna hai?",
            "Pick challenge": "Problem kya aa raha hai?",
            "Pick pain point": "Problem kya aa raha hai?",
        }.get(menu.button_label or "Choose", menu.button_label or "Choose"),
        section_title={
            "Help topics": "Kya karna hai?",
            "Growth": "Problem kya aa raha hai?",
            "Start stage": "Problem kya aa raha hai?",
            "Automation": "Problem kya aa raha hai?",
        }.get(menu.section_title or "Options", menu.section_title or "Options"),
        rows=tuple(translated_rows),
    )


def _default_buttons_for_state(sender: str, text: str) -> tuple[tuple[str, str], ...] | None:
    st = get_conversation_state(sender)
    stage = str(st.get("funnel_stage") or "")
    t = (text or "").lower()
    if stage == "ask_challenge" or "biggest challenge" in t:
        return (
            ("ch_sales_low", "Sales kam hai"),
            ("ch_no_leads", "Log aa nahi rahe"),
            ("ch_marketing", "Marketing samajh nahi aa rahi"),
            ("ch_not_sure", "Samajh nahi aa raha"),
        )
    if "kaha ho" in t or "where are you" in t or "idea stage" in t:
        return (("st_idea", "Idea stage"), ("st_running", "Already running"))
    if stage == "offer_accept" or "start karna chahoge" in t:
        return (("offer_yes", "Yes Start"), ("offer_details", "Need Details"), ("offer_later", "Later"))
    return None


def _localize_reply_for_sender(sender: str, reply: LeadFlowReply) -> LeadFlowReply:
    lang = get_user_lang(sender)
    dynamic_buttons = reply.buttons
    if not dynamic_buttons and not reply.list_menu:
        dynamic_buttons = _default_buttons_for_state(sender, reply.body)
    body = _localize_text(reply.body, lang)
    # Hard language gate at final output layer for English mode.
    if lang == "english" and re.search(r"[\u0900-\u097F]|(?:\baap\b|\bhai\b|\bka\b|\bhai\b)", body, re.I):
        body = "I understand your situation.\n\nLet's continue step by step."
    if lang == "english":
        body = _strip_or_limit_emoji(body, keep_one=False)
    elif lang == "hindi":
        body = _strip_or_limit_emoji(body, keep_one=False)
    else:
        body = _strip_or_limit_emoji(body, keep_one=True)
    return LeadFlowReply(
        body=body,
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
_FUNNEL_PITCH = (
    "I understand your situation.\n\n"
    "In your case, guesswork will cost time and money.\n\n"
    "It is better to get exact clarity now,\n"
    "instead of repeating the same problem.\n\n"
    "1:1 Strategy Session mein:\n\n"
    "• identify root problem\n"
    "• give exact fix\n"
    "• share growth roadmap\n"
    "• clarify next best step\n\n"
    f"Intro fee ₹{SESSION_PRICE} hai.\n\n"
    "Would you like to start? 😊"
)


def _is_yesish(text: str) -> bool:
    t = (text or "").strip().lower()
    return t in {"yes", "y", "haan", "ha", "ok", "okay", "sure", "start", "go", "go ahead", "yes start"}


def _is_explicit_human_request(text: str) -> bool:
    t = (text or "").lower()
    return any(x in t for x in ("human", "agent", "expert", "consultant", "support", "real person"))


def _dynamic_challenge_question(need: str) -> LeadFlowReply:
    if need == "grow":
        return LeadFlowReply(
            body="I understand.\n\nWhat type of business do you run?",
            list_menu=ListMenuSpec(
                button_label="Type choose karo",
                section_title="Business type",
                rows=(
                    ("bt_service", "Service (agency/freelance)", None),
                    ("bt_product", "Product (clothes/ecom)", None),
                    ("bt_local", "Local shop", None),
                    ("bt_other", "Other", None),
                ),
            ),
        )
    if need == "automate":
        return LeadFlowReply(
            body="I understand.\n\nWhat do you want to automate first?",
            buttons=(("am_leads", "Leads"), ("am_followup", "Follow-up"), ("am_support", "Support")),
        )
    return LeadFlowReply(
        body="Nice 🚀 starting a business is exciting.\n\nWhat stage are you currently at?",
        buttons=(("st_idea", "Idea hai"), ("st_plan", "Soch raha hoon"), ("st_ready", "Ready to start")),
    )


def _problem_question_for_need(need: str) -> LeadFlowReply:
    if need == "grow":
        return LeadFlowReply(
            body="Abhi sabse bada problem kya aa raha hai?",
            buttons=(
                ("ch_sales_low", "Sales kam hai"),
                ("ch_no_leads", "Log aa nahi rahe"),
                ("ch_marketing", "Marketing samajh nahi aa rahi"),
            ),
        )
    if need == "automate":
        return LeadFlowReply(
            body="Abhi sabse bada problem kya aa raha hai?",
            buttons=(
                ("ch_followups", "Follow-up slow"),
                ("ch_manual", "Manual kaam zyada"),
                ("ch_support", "Support late"),
            ),
        )
    return LeadFlowReply(
        body="Kis type ka business start karna hai?",
        buttons=(("sb_online", "Online"), ("sb_shop", "Shop"), ("sb_service", "Service")),
    )


def _flow_buttons(lang: str, ids: tuple[str, ...]) -> tuple[tuple[str, str], ...]:
    labels = {
        "english": {
            "st_explore": "Just exploring",
            "st_idea": "I have an idea",
            "st_ready": "Ready to start",
            "bt_online": "Online",
            "bt_offline": "Offline",
            "bt_notsure": "Not sure",
            "sc_instagram": "Instagram",
            "sc_youtube": "YouTube",
            "sc_dropship": "Dropshipping",
            "sc_products": "Selling products",
            "sc_course": "Course / services",
            "sc_notsure": "Not sure",
            "of_running_shop": "Already have shop",
            "of_start_new": "Start new",
            "of_no_clarity": "No clarity",
            "of_need_customers": "Need customers",
            "of_other": "Other",
            "yt_channel": "I already have a channel",
            "yt_no_audience": "Not getting audience",
            "yt_no_understanding": "Don’t understand anything",
            "yt_content_confused": "Content confusion",
            "yt_other": "Other",
            "ig_page_exists": "Page already exists",
            "ig_no_growth": "No growth",
            "ig_no_leads": "No leads/sales",
            "ig_content_confused": "Content confusion",
            "ig_other": "Other",
            "dp_store_not_set": "Store not set",
            "dp_no_sales": "No sales",
            "dp_ads_fail": "Ads not working",
            "dp_confused_sell": "Confused what to sell",
            "dp_other": "Other",
            "pb_sales_low": "Sales low",
            "pb_no_customers": "No customers",
            "pb_marketing": "Marketing issue",
            "pb_not_sure": "Not sure",
            "offer_yes": "Yes Start",
            "offer_details": "Need Details",
            "offer_later": "Later",
        },
        "hinglish": {
            "st_explore": "Bas explore kar raha",
            "st_idea": "Idea hai",
            "st_ready": "Start ke liye ready",
            "bt_online": "Online",
            "bt_offline": "Offline",
            "bt_notsure": "Not sure",
            "sc_instagram": "Instagram",
            "sc_youtube": "YouTube",
            "sc_dropship": "Dropshipping",
            "sc_products": "Products sell",
            "sc_course": "Course / service",
            "sc_notsure": "Not sure",
            "of_running_shop": "Shop already hai",
            "of_start_new": "Naya start karna",
            "of_no_clarity": "Clarity nahi",
            "of_need_customers": "Customers chahiye",
            "of_other": "Other",
            "yt_channel": "Channel already hai",
            "yt_no_audience": "Audience nahi aa rahi",
            "yt_no_understanding": "Kuch samajh nahi aa raha",
            "yt_content_confused": "Content confusion",
            "yt_other": "Other",
            "ig_page_exists": "Page already hai",
            "ig_no_growth": "Growth nahi",
            "ig_no_leads": "Leads/sales nahi",
            "ig_content_confused": "Content confusion",
            "ig_other": "Other",
            "dp_store_not_set": "Store set nahi",
            "dp_no_sales": "Sales nahi",
            "dp_ads_fail": "Ads kaam nahi kar rahe",
            "dp_confused_sell": "Kya sell karun confused",
            "dp_other": "Other",
            "pb_sales_low": "Sales kam",
            "pb_no_customers": "Customers nahi aa rahe",
            "pb_marketing": "Marketing issue",
            "pb_not_sure": "Not sure",
            "offer_yes": "Yes Start",
            "offer_details": "Need Details",
            "offer_later": "Later",
        },
        "hindi": {
            "st_explore": "अभी देख रहा हूँ",
            "st_idea": "मेरे पास आइडिया है",
            "st_ready": "शुरू करने के लिए तैयार",
            "bt_online": "ऑनलाइन",
            "bt_offline": "ऑफलाइन",
            "bt_notsure": "पक्का नहीं",
            "sc_instagram": "इंस्टाग्राम",
            "sc_youtube": "यूट्यूब",
            "sc_dropship": "ड्रॉपशिपिंग",
            "sc_products": "प्रोडक्ट बेचना",
            "sc_course": "कोर्स / सर्विस",
            "sc_notsure": "पक्का नहीं",
            "of_running_shop": "दुकान पहले से है",
            "of_start_new": "नया शुरू करना है",
            "of_no_clarity": "कोई स्पष्टता नहीं",
            "of_need_customers": "कस्टमर चाहिए",
            "of_other": "अन्य",
            "yt_channel": "मेरा चैनल पहले से है",
            "yt_no_audience": "ऑडियंस नहीं आ रही",
            "yt_no_understanding": "कुछ समझ नहीं आ रहा",
            "yt_content_confused": "कंटेंट कन्फ्यूजन",
            "yt_other": "अन्य",
            "ig_page_exists": "पेज पहले से है",
            "ig_no_growth": "ग्रोथ नहीं",
            "ig_no_leads": "लीड्स/सेल्स नहीं",
            "ig_content_confused": "कंटेंट कन्फ्यूजन",
            "ig_other": "अन्य",
            "dp_store_not_set": "स्टोर सेट नहीं",
            "dp_no_sales": "सेल्स नहीं",
            "dp_ads_fail": "ऐड्स काम नहीं कर रहे",
            "dp_confused_sell": "क्या बेचना है कन्फ्यूजन",
            "dp_other": "अन्य",
            "pb_sales_low": "सेल्स कम",
            "pb_no_customers": "कस्टमर नहीं आ रहे",
            "pb_marketing": "मार्केटिंग समस्या",
            "pb_not_sure": "पक्का नहीं",
            "offer_yes": "हाँ, शुरू करें",
            "offer_details": "और जानकारी",
            "offer_later": "बाद में",
        },
    }
    lk = lang if lang in labels else "english"
    table = labels[lk]
    return tuple((i, table.get(i, i)[:24]) for i in ids)


def _flow_text(lang: str, key: str) -> str:
    text = {
        "english": {
            "ask_stage": "What stage are you currently at?",
            "ask_business_type": "What type of business are you planning?",
            "ask_online_sub": "What exactly are you planning online?",
            "ask_offline_sub": "What are you planning offline?",
            "ask_problem": "What is the biggest problem right now?",
            "understand": "I understand.\n\nAt this stage, most people struggle with clarity or execution.\n\nThis can be solved.",
            "failsafe": "I understand.\n\nLet’s continue.\n\nWhat feels most difficult right now?",
        },
        "hinglish": {
            "ask_stage": "Aap abhi kis stage pe ho?",
            "ask_business_type": "Aap kis type ka business plan kar rahe ho?",
            "ask_online_sub": "Online mein exactly kya plan kar rahe ho?",
            "ask_offline_sub": "Offline mein kya plan hai?",
            "ask_problem": "Abhi sabse bada problem kya aa raha hai?",
            "understand": "Samajh gaya.\n\nIs stage pe clarity ya execution issue aata hai.\n\nYe solve ho sakta hai.",
            "failsafe": "Samajh gaya.\n\nChalo continue karte hain.\n\nAbhi sabse bada problem kya lag raha hai?",
        },
        "hindi": {
            "ask_stage": "आप अभी किस स्टेज पर हैं?",
            "ask_business_type": "आप किस प्रकार का बिजनेस प्लान कर रहे हैं?",
            "ask_online_sub": "ऑनलाइन में आप क्या प्लान कर रहे हैं?",
            "ask_offline_sub": "ऑफलाइन में आप क्या प्लान कर रहे हैं?",
            "ask_problem": "अभी सबसे बड़ी समस्या क्या आ रही है?",
            "understand": "मैं समझ गया।\n\nइस स्टेज पर ज्यादातर लोगों को clarity या execution की समस्या होती है।\n\nइसे ठीक किया जा सकता है।",
            "failsafe": "मैं समझ गया।\n\nचलिए आगे बढ़ते हैं।\n\nअभी सबसे बड़ी समस्या क्या लग रही है?",
        },
    }
    lk = lang if lang in text else "english"
    return text[lk].get(key, key)


def _next_step(current_step: str) -> str | None:
    chain = {
        "ask_stage": "ask_business_type",
        "ask_business_type": "ask_subcategory",
        "ask_subcategory": "ask_subcategory_detail",
        "ask_subcategory_detail": "ask_challenge",
        "ask_behavior_regular": "ask_behavior_niche",
        "ask_behavior_niche": "ask_challenge",
        "ask_challenge": "ask_lead_source",
        "ask_lead_source": "offer_accept",
        "offer": None,
        "offer_accept": "payment_pending",
        "payment_pending": "onboarding",
        "onboarding": None,
    }
    return chain.get(current_step)


def _init_consultant_state() -> dict:
    return {
        "stage": None,
        "intent": None,
        "mode": None,
        "platform": None,
        "problem": None,
        "sub_problem": None,
        "history": [],
        "steps_completed": [],
        "locked_steps": [],
        "current_step": None,
        "awaiting_other_for": "",
        "last_step_input": "",
        "pain_questions_asked": 0,
        "trust_phase": "comfort",
        "metrics": {
            "greeted": 0,
            "pain_identified": 0,
            "cta_shown": 0,
            "paid": 0,
        },
    }


def _append_step_done(state: dict, step: str) -> None:
    steps = state.get("steps_completed")
    if not isinstance(steps, list):
        steps = []
    if step not in steps:
        steps.append(step)
    state["steps_completed"] = steps


def _lock_step(state: dict, step: str) -> None:
    locks = state.get("locked_steps")
    if not isinstance(locks, list):
        locks = []
    if step and step not in locks:
        locks.append(step)
    state["locked_steps"] = locks


def _is_locked(state: dict, step: str) -> bool:
    return step in (state.get("locked_steps") or [])


def _normalize_user_input(raw_interactive_id: str, inbound: str) -> str:
    return (raw_interactive_id or inbound or "").strip().lower()


def _extract_entities(text: str) -> tuple[dict, float]:
    t = (text or "").lower()
    out: dict[str, str] = {}
    hits = 0
    if any(x in t for x in ("explore", "just exploring", "learn", "understand", "confused", "don't understand", "dont understand")):
        out["stage"] = "exploring"
        hits += 1
    elif any(x in t for x in ("start", "begin", "launch", "new")):
        out["stage"] = "starting"
        out["intent"] = "start"
        hits += 2
    elif any(x in t for x in ("scale", "grow", "increase", "expand")):
        out["stage"] = "scaling"
        out["intent"] = "scale"
        hits += 2

    if any(x in t for x in ("online", "social", "digital", "ads", "website")):
        out["mode"] = "online"
        hits += 1
    elif any(x in t for x in ("offline", "shop", "store", "local")):
        out["mode"] = "offline"
        hits += 1

    platform_map = {
        "youtube": ("youtube",),
        "instagram": ("instagram", "insta", "ig"),
        "dropshipping": ("dropshipping", "drop shipping"),
        "ecommerce": ("ecommerce", "e-commerce", "shopify store", "online store"),
        "agency": ("agency",),
        "coaching": ("coach", "coaching"),
        "freelancer": ("freelancer", "freelance"),
        "local shop": ("local shop", "retail", "shop"),
        "facebook": ("facebook", "fb"),
        "whatsapp": ("whatsapp", "wa"),
        "amazon": ("amazon",),
        "shopify": ("shopify",),
    }
    for key, needles in platform_map.items():
        if any(n in t for n in needles):
            out["platform"] = key
            if not out.get("mode"):
                out["mode"] = "offline" if key == "local shop" else "online"
            hits += 2
            break

    if any(x in t for x in ("views", "reach", "audience", "followers")):
        out["problem"] = "audience growth"
        hits += 1
    elif any(x in t for x in ("sales", "no order", "orders", "revenue", "customers", "leads")):
        out["problem"] = "sales conversion"
        hits += 1
    elif any(x in t for x in ("content", "what to post", "niche", "clarity", "idea")):
        out["problem"] = "content clarity"
        hits += 1
    elif any(x in t for x in ("ad", "ads", "cpc", "roas")):
        out["problem"] = "ads performance"
        hits += 1

    if any(x in t for x in ("consistent", "regular", "posting")):
        out["sub_problem"] = "consistency gap"
        hits += 1
    elif any(x in t for x in ("setup", "technical", "profile", "channel setup")):
        out["sub_problem"] = "setup confusion"
        hits += 1
    elif any(x in t for x in ("don't know", "dont know", "no idea", "confused")):
        out["sub_problem"] = "execution confusion"
        hits += 1

    # Lightweight confidence scoring based on matched semantic signals.
    confidence = min(1.0, hits / 4.0)
    return out, confidence


def _meaningful_interactions_count(state: dict) -> int:
    count = 0
    for k in ("stage", "intent", "mode", "platform", "problem", "sub_problem"):
        if state.get(k):
            count += 1
    return count


def _resolve_next_decision(state: dict) -> str:
    if not state.get("platform"):
        return "platform"
    if not state.get("problem"):
        return "problem"
    if not state.get("sub_problem"):
        return "sub_problem"
    if not state.get("stage"):
        return "stage"
    if not state.get("mode"):
        return "mode"
    if _meaningful_interactions_count(state) >= 4:
        return "insight"
    return "problem"


def generate_dynamic_options(context: dict) -> list[str]:
    platform = str(context.get("platform") or "").lower()
    step = str(context.get("current_step") or "")
    if step == "stage":
        return ["Exploring", "Starting now", "Scaling", "Other"]
    if step == "mode":
        return ["Online", "Offline", "Other"]
    if step == "platform":
        return ["YouTube", "Instagram", "Ecommerce", "Agency", "Coaching", "Freelancer", "Local Shop", "Other"]
    if step in {"problem", "sub_problem"}:
        if step == "sub_problem" and platform == "youtube":
            return ["Yes", "No", "Sometimes", "Other"]
        if platform == "youtube":
            return [
                "Not getting views",
                "Don't know what content to make",
                "Not consistent",
                "Channel setup confusion",
                "Other",
            ]
        if platform == "instagram":
            return [
                "No reach",
                "No followers",
                "No sales",
                "Content confusion",
                "Other",
            ]
        if platform == "dropshipping":
            return [
                "No sales",
                "Product confusion",
                "Ads not working",
                "Store setup issue",
                "Other",
            ]
        if platform == "facebook":
            return [
                "Ads not performing",
                "No leads",
                "No sales",
                "Targeting confusion",
                "Other",
            ]
        if str(context.get("mode") or "").lower() == "offline":
            return ["Need customers", "Location issue", "Pricing issue", "Setup issue", "Other"]
        return ["No clarity", "No traction", "No sales", "Execution issue", "Other"]
    if step == "offer":
        return ["Yes Start", "Need Details", "Later", "Other"]
    return ["No clarity", "No sales", "No reach", "Other"]


def _map_other_to_problem(free_text: str) -> str:
    t = (free_text or "").strip().lower()
    if "content" in t:
        return "content clarity issue"
    if "view" in t or "reach" in t:
        return "audience growth issue"
    if "sale" in t or "customer" in t or "lead" in t:
        return "customer acquisition issue"
    if "ad" in t:
        return "ad performance issue"
    return "execution clarity issue"


def _strict_lang_render(lang: str, english_text: str, hinglish_text: str, hindi_text: str) -> str:
    if lang == "english":
        out = _strip_or_limit_emoji(english_text, keep_one=False)
        if re.search(r"[\u0900-\u097F]|(?:\baap\b|\bhai\b|\bka\b|\bhai\b)", out, re.I):
            out = "I understand your situation.\n\nLet's continue step by step."
        return out
    if lang == "hindi":
        return _strip_or_limit_emoji(hindi_text, keep_one=False)
    return _strip_or_limit_emoji(hinglish_text, keep_one=True)


def _ctx_insight_text(lang: str, ctx: dict) -> str:
    stage = str(ctx.get("stage") or "")
    platform = str(ctx.get("platform") or "")
    problem = str(ctx.get("problem") or "")
    if not platform or not problem:
        return _strict_lang_render(
            lang,
            "I'd like to understand your situation better.",
            "Main aapki situation better samajhna chahta hoon.",
            "मैं आपकी स्थिति को बेहतर समझना चाहता हूं।",
        )
    en = (
        f"I understand your situation.\n\n"
        f"Since you are at '{stage}' and working on {platform},\n"
        f"the core issue looks like {problem}.\n\n"
        "This can definitely be improved."
    )
    hi = (
        f"मैं आपकी स्थिति समझ गया।\n\n"
        f"आप '{stage}' स्टेज पर हैं और {platform} पर काम कर रहे हैं,\n"
        f"इसलिए मुख्य समस्या {problem} दिख रही है।\n\n"
        "इसे निश्चित रूप से बेहतर किया जा सकता है।"
    )
    hing = (
        f"Samajh gaya.\n\n"
        f"Aap '{stage}' stage pe ho aur {platform} pe kaam kar rahe ho,\n"
        f"toh core issue {problem} lag raha hai.\n\n"
        "Ye improve ho sakta hai 😊"
    )
    return _strict_lang_render(lang, en, hing, hi)


def _warm_welcome_text(lang: str) -> str:
    return _strict_lang_render(
        lang,
        "Welcome. You are in the right place.\n\nI will guide you step by step, no pressure.",
        "Welcome. Aap bilkul sahi jagah aaye ho.\n\nMain step by step guide karunga, no pressure.",
        "स्वागत है। आप सही जगह आए हैं।\n\nमैं आपको एक-एक कदम में गाइड करूंगा, बिना किसी दबाव के।",
    )


def _mirror_pain_text(lang: str, ctx: dict) -> str:
    platform = str(ctx.get("platform") or "your business")
    problem = str(ctx.get("problem") or "this challenge")
    return _strict_lang_render(
        lang,
        f"I hear you. Managing {problem} on {platform} can feel frustrating.",
        f"Samajh sakta hoon. {platform} pe {problem} manage karna frustrating lag sakta hai.",
        f"मैं समझ सकता हूं। {platform} पर {problem} संभालना frustrating लग सकता है।",
    )


def _partial_insight_open_loop(lang: str, ctx: dict) -> str:
    platform = str(ctx.get("platform") or "your channel")
    return _strict_lang_render(
        lang,
        f"I can already see one hidden gap in your {platform} flow.\n\n"
        "It is fixable, but we should confirm one more thing before I give the exact diagnosis.",
        f"Mujhe abhi se aapke {platform} flow mein ek hidden gap dikh raha hai.\n\n"
        "Fix ho sakta hai, but exact diagnosis dene se pehle ek cheez confirm karni hogi.",
        f"मुझे अभी से आपके {platform} फ्लो में एक hidden gap दिख रहा है।\n\n"
        "इसे ठीक किया जा सकता है, लेकिन सटीक निदान देने से पहले एक चीज़ कन्फर्म करनी होगी।",
    )


def _gentle_urgency_text(lang: str) -> str:
    return _strict_lang_render(
        lang,
        "If this stays unresolved, it often leads to weeks of guesswork and slow growth.",
        "Agar ye unresolved raha to aksar weeks ki guesswork aur slow growth hoti hai.",
        "अगर यह unresolved रहा, तो अक्सर कई हफ्तों की guesswork और slow growth होती है।",
    )


def _credibility_line(lang: str) -> str:
    return _strict_lang_render(
        lang,
        "We see this pattern across many early and growth-stage businesses, so the diagnosis is usually fast and precise.",
        "Ye pattern hum bahut early aur growth-stage businesses mein dekhte hain, isliye diagnosis fast aur precise hota hai.",
        "यह pattern हमें कई early और growth-stage businesses में दिखता है, इसलिए diagnosis तेज़ और सटीक होता है।",
    )


def _context_response_text(lang: str, ctx: dict) -> str:
    stage = str(ctx.get("stage") or "your current stage")
    platform = str(ctx.get("platform") or "your channel")
    problem = str(ctx.get("problem") or "the current issue")
    templates_en = (
        f"Thanks for sharing this. Since you're in {stage} and focused on {platform}, we should solve {problem} first.",
        f"That helps. For {platform} at your current stage ({stage}), {problem} is usually the bottleneck.",
        f"Understood. Your {platform} journey is currently getting blocked by {problem}.",
        f"Got it. At this stage ({stage}), fixing {problem} on {platform} gives the fastest progress.",
        f"Clear. For {platform}, {problem} is the key gap right now.",
        f"I see where you're coming from. {problem} on {platform} is the right place to focus next.",
        f"Good context. Since you're in {stage}, we can simplify the path and remove {problem} first.",
        f"You're not alone here. {problem} is common on {platform}, and we can work through it step by step.",
        f"Helpful input. Let's make {platform} easier by resolving {problem} first.",
        f"Thanks, this gives clarity. In your case, {problem} is the most important fix now.",
        f"That makes sense. On {platform}, this stage usually needs sharper execution around {problem}.",
        f"Perfect, now I understand. We'll prioritize {problem} and then unlock growth on {platform}.",
    )
    templates_hi = (
        f"जानकारी देने के लिए धन्यवाद। आप {stage} स्टेज पर हैं और {platform} पर फोकस कर रहे हैं, इसलिए पहले {problem} ठीक करना सही रहेगा।",
        f"समझ गया। {platform} पर इस स्टेज में अक्सर {problem} ही मुख्य रुकावट होती है।",
        f"ठीक है। आपकी स्थिति में {platform} के लिए {problem} पर काम करना सबसे जरूरी है।",
    )
    templates_hing = (
        f"Thanks for sharing. Aap {stage} stage pe ho aur {platform} pe focus kar rahe ho, to pehle {problem} solve karte hain.",
        f"Got it. {platform} pe iss stage mein usually {problem} hi main bottleneck hota hai.",
        f"Samajh gaya. Aapke case mein {problem} fix hoga to progress fast hoga 🙂",
    )
    idx = len(ctx.get("history") or []) % max(1, len(templates_en))
    if lang == "english":
        return _strict_lang_render(lang, templates_en[idx], templates_hing[idx % len(templates_hing)], templates_hi[idx % len(templates_hi)])
    if lang == "hindi":
        return _strict_lang_render(lang, templates_en[idx], templates_hing[idx % len(templates_hing)], templates_hi[idx % len(templates_hi)])
    return _strict_lang_render(lang, templates_en[idx], templates_hing[idx % len(templates_hing)], templates_hi[idx % len(templates_hi)])


def _resolve_button_value(cs: dict, user_input: str) -> str:
    ui = (user_input or "").strip().lower()
    m = re.match(r"^dyn_([a-z_]+)_(\d+|other)$", ui)
    if not m:
        return user_input
    step = m.group(1)
    idx_or_other = m.group(2)
    opts = generate_dynamic_options({**cs, "current_step": step})
    if idx_or_other == "other":
        return "other"
    try:
        idx = int(idx_or_other)
        if 0 <= idx < len(opts):
            return str(opts[idx]).strip().lower()
    except ValueError:
        pass
    return user_input


def _buttons_from_options(lang: str, options: list[str], prefix: str) -> tuple[tuple[str, str], ...]:
    # Keep WA button limit (3). We rotate top 3 while always including "Other" when present.
    opts = [o for o in options if o]
    if "Other" in opts and len(opts) > 3:
        core = [o for o in opts if o != "Other"][:2] + ["Other"]
    else:
        core = opts[:3]
    btns = []
    for i, label in enumerate(core):
        bid = f"{prefix}_{i}"
        if label.lower() == "other":
            bid = f"{prefix}_other"
        btns.append((bid, label[:20]))
    return tuple(btns)


def _next_question_for_step(lang: str, step: str, ctx: dict) -> str:
    if step == "stage":
        return _strict_lang_render(
            lang,
            "What stage are you currently at?",
            "Aap abhi kis stage pe ho?",
            "आप अभी किस स्टेज पर हैं?",
        )
    if step == "mode":
        return _strict_lang_render(
            lang,
            "Are you planning this online or offline?",
            "Aap isko online karna chahte ho ya offline?",
            "आप इसे ऑनलाइन करना चाहते हैं या ऑफलाइन?",
        )
    if step == "platform":
        mode = str(ctx.get("mode") or "")
        if mode.lower() == "offline":
            return _strict_lang_render(
                lang,
                "What’s your focus offline?",
                "Offline mein aapka focus kya hai?",
                "ऑफलाइन में आपका फोकस क्या है?",
            )
        return _strict_lang_render(
            lang,
            "What platform are you focusing on right now?",
            "Abhi kis platform pe focus kar rahe ho?",
            "अभी आप किस प्लेटफॉर्म पर फोकस कर रहे हैं?",
        )
    if step == "problem":
        plat = str(ctx.get("platform") or "this platform")
        return _strict_lang_render(
            lang,
            f"What is your biggest challenge in {plat}?",
            f"{plat} mein sabse bada challenge kya aa raha hai?",
            f"{plat} में आपकी सबसे बड़ी चुनौती क्या है?",
        )
    if step == "sub_problem":
        if str(ctx.get("platform") or "").lower() == "youtube":
            return _strict_lang_render(
                lang,
                "Are you posting regularly?",
                "Kya aap regularly post kar rahe ho?",
                "क्या आप नियमित रूप से पोस्ट कर रहे हैं?",
            )
        return _strict_lang_render(
            lang,
            "Let me understand one thing—what is happening most often?",
            "Ek cheez samjhoon—sabse zyada kya ho raha hai?",
            "एक चीज़ समझूं—सबसे ज़्यादा क्या हो रहा है?",
        )
    if step == "insight":
        return _ctx_insight_text(lang, ctx)
    return _strict_lang_render(
        lang,
        "Would you like to start with a guided strategy session?",
        "Kya aap guided strategy session se start karna chahoge?",
        "क्या आप गाइडेड स्ट्रेटेजी सेशन से शुरू करना चाहेंगे?",
    )


def _run_dynamic_consultant_step(sender: str, inbound: str, raw_interactive_id: str, st_sales: dict) -> LeadFlowReply:
    lang = get_user_lang(sender)
    cs = st_sales.get("consultant_state")
    if not isinstance(cs, dict):
        cs = _init_consultant_state()

    user_input = _normalize_user_input(raw_interactive_id, inbound)
    user_input = _resolve_button_value(cs, user_input)
    if not isinstance(cs.get("history"), list):
        cs["history"] = []
    if user_input:
        cs["history"].append(user_input)
    if not isinstance(cs.get("metrics"), dict):
        cs["metrics"] = {"greeted": 0, "pain_identified": 0, "cta_shown": 0, "paid": 0}

    # Graceful return path after "Later".
    if cs.get("trust_phase") == "nurture" and user_input in {"start", "resume", "continue"}:
        cs["trust_phase"] = "comfort"
        st_sales["consultant_state"] = cs
        set_conversation_state(sender, st_sales)
        return LeadFlowReply(
            body=_strict_lang_render(
                lang,
                "Welcome back. We will continue from where we paused.\n\nWhat feels most urgent for you right now?",
                "Welcome back. Jahan pause kiya tha wahi se continue karte hain.\n\nAbhi aapke liye sabse urgent kya lag raha hai?",
                "Welcome back। हम वहीं से continue करेंगे जहां pause किया था।\n\nअभी आपके लिए सबसे urgent क्या लग रहा है?",
            ),
            buttons=_buttons_from_options(lang, generate_dynamic_options({**cs, "current_step": "problem"}), "dyn_problem"),
        )

    # Offer interaction handling in dynamic engine.
    if str(cs.get("current_step") or "") == "offer":
        if user_input in {"book diagnosis", "yes start", "yes"}:
            try:
                link = create_payment_link_http(
                    amount_rupees=float(SESSION_PRICE),
                    name=(st_sales.get("profile_name") or "Customer"),
                    phone_digits=sender,
                    description="StratXcel Paid Diagnosis Session",
                    email="",
                )
                short = str(link.get("short_url") or "")
                st_sales["consultant_state"] = cs
                st_sales["funnel_stage"] = "payment_pending"
                st_sales["stage"] = "payment_pending"
                st_sales["sales_stage"] = sales_states.PAYMENT_PENDING
                st_sales["pending_payment_link_id"] = str(link.get("id") or "")
                st_sales["last_payment_link_url"] = short
                st_sales["payment_pending_since"] = datetime.now(timezone.utc).isoformat()
                set_conversation_state(sender, st_sales)
                return LeadFlowReply(
                    body=_strict_lang_render(
                        lang,
                        f"Great. Here is your secure payment link:\n{short}\n\nOnce done, I will guide your exact next plan.",
                        f"Perfect. Yahan aapka secure payment link hai:\n{short}\n\nPayment ke baad main exact next plan guide karunga.",
                        f"बहुत बढ़िया। यह आपका secure payment link है:\n{short}\n\nपेमेंट के बाद मैं आपका exact next plan गाइड करूंगा।",
                    )
                )
            except Exception:
                return LeadFlowReply(
                    body=_strict_lang_render(
                        lang,
                        "Payment link is taking a moment. Please type 'start' and I will retry immediately.",
                        "Payment link banne mein thoda time lag raha hai. 'start' type karo, main turant retry karta hoon.",
                        "पेमेंट लिंक बनने में थोड़ा समय लग रहा है। 'start' टाइप करें, मैं तुरंत फिर से कोशिश करूंगा।",
                    )
                )
        if user_input == "need details":
            return LeadFlowReply(
                body=_strict_lang_render(
                    lang,
                    f"This is a focused paid diagnosis session (₹{SESSION_PRICE}).\n"
                    "Outcome: identify the exact issue + build your clear action roadmap.\n\n"
                    "Would you like to book it?",
                    f"Ye focused paid diagnosis session (₹{SESSION_PRICE}) hai.\n"
                    "Outcome: exact issue identify hoga + clear action roadmap banega.\n\n"
                    "Book karna chahoge?",
                    f"यह focused paid diagnosis session (₹{SESSION_PRICE}) है।\n"
                    "Outcome: exact issue identify होगा + clear action roadmap बनेगा।\n\n"
                    "क्या आप इसे बुक करना चाहेंगे?",
                ),
                buttons=_buttons_from_options(lang, ["Book Diagnosis", "Later", "Other"], "offer"),
            )
        if user_input == "later":
            cs["trust_phase"] = "nurture"
            cs["followup_due_at"] = (datetime.now(timezone.utc) + timedelta(hours=6)).isoformat()
            st_sales["consultant_state"] = cs
            set_conversation_state(sender, st_sales)
            return LeadFlowReply(
                body=_strict_lang_render(
                    lang,
                    "Absolutely, no pressure.\nI will check in later with one simple next step.\nYou can also message 'start' anytime.",
                    "Bilkul, no pressure.\nMain baad mein ek simple next step ke saath check-in karunga.\nAap kabhi bhi 'start' message kar sakte ho.",
                    "बिल्कुल, कोई दबाव नहीं।\nमैं बाद में एक simple next step के साथ check-in करूंगा।\nआप कभी भी 'start' मैसेज कर सकते हैं।",
                )
            )

    extracted, confidence = _extract_entities(user_input)
    for k, v in extracted.items():
        # Step lock: once explicitly selected/set, ignore overwriting with repeated clicks.
        if not _is_locked(cs, k):
            cs[k] = v

    if cs.get("awaiting_other_for"):
        mapped = _map_other_to_problem(user_input)
        slot = str(cs.get("awaiting_other_for"))
        if slot in {"stage", "intent", "mode", "platform", "problem", "sub_problem"} and not _is_locked(cs, slot):
            cs[slot] = mapped
            _lock_step(cs, slot)
        cs["awaiting_other_for"] = ""
        cs["last_step_input"] = user_input
    else:
        decision = _resolve_next_decision(cs)
        cs["current_step"] = decision
        if confidence < 0.35 and not raw_interactive_id:
            st_sales["consultant_state"] = cs
            set_conversation_state(sender, st_sales)
            print("STATE:", cs)
            print("NEXT DECISION:", f"clarify_{decision}")
            print("STEP:", cs.get("current_step"))
            clarifier = _strict_lang_render(
                lang,
                "I want to avoid assumptions. Which option fits you best right now?",
                "Assumption na karu, isliye batao abhi aapke liye sabse sahi option kaunsa hai?",
                "मैं अनुमान नहीं लगाना चाहता। अभी आपके लिए सबसे सही विकल्प कौन सा है?",
            )
            return LeadFlowReply(body=clarifier, buttons=_buttons_from_options(lang, generate_dynamic_options({**cs, "current_step": decision}), f"dyn_{decision}"))
        if user_input == "other" or user_input.endswith("other"):
            cs["awaiting_other_for"] = decision
            cs["last_step_input"] = user_input
            st_sales["consultant_state"] = cs
            set_conversation_state(sender, st_sales)
            print("STATE:", cs)
            print("NEXT DECISION:", decision)
            print("STEP:", cs.get("current_step"))
            return LeadFlowReply(
                body=_strict_lang_render(
                    lang,
                    "Can you explain a bit more?",
                    "Thoda detail mein bata sakte ho?",
                    "क्या आप थोड़ा विस्तार से बता सकते हैं?",
                )
            )

        # Apply direct user input to the current decision field if missing.
        if decision in {"stage", "intent", "mode", "platform", "problem", "sub_problem"} and user_input:
            if not cs.get(decision) and not _is_locked(cs, decision):
                cs[decision] = user_input
                _append_step_done(cs, decision)
                _lock_step(cs, decision)
            elif cs.get(decision) and user_input and user_input == cs.get("last_step_input"):
                # anti-repeat click/input
                pass
        cs["last_step_input"] = user_input

    # Re-resolve dynamically after updates (no fixed order).
    next_step = _resolve_next_decision(cs)
    cs["current_step"] = next_step

    # Emotional funnel pacing: ask only 2-3 soft pain questions before offer.
    if next_step in {"problem", "sub_problem"} and cs.get("pain_questions_asked", 0) < 3:
        cs["pain_questions_asked"] = int(cs.get("pain_questions_asked", 0)) + 1
    if int(cs.get("pain_questions_asked", 0)) >= 3 and cs.get("problem") and cs.get("sub_problem"):
        next_step = "offer"
        cs["current_step"] = "offer"

    # Offer control.
    enough_for_offer = bool(cs.get("problem") and cs.get("sub_problem") and _meaningful_interactions_count(cs) >= 3)
    if next_step == "insight" and enough_for_offer:
        next_step = "offer"
        cs["current_step"] = "offer"
    elif next_step == "insight" and not enough_for_offer:
        next_step = "sub_problem" if not cs.get("sub_problem") else "problem"
        cs["current_step"] = next_step

    st_sales["consultant_state"] = cs
    set_conversation_state(sender, st_sales)
    print("STATE:", cs)
    print("NEXT DECISION:", next_step)
    print("STEP:", cs.get("current_step"))

    # Always answer + next options.
    warm = _warm_welcome_text(lang) if len(cs.get("history") or []) <= 2 else ""
    if warm:
        cs["metrics"]["greeted"] = int(cs["metrics"].get("greeted", 0)) + 1
    mirror = _mirror_pain_text(lang, cs) if cs.get("problem") else _context_response_text(lang, cs)
    if cs.get("problem"):
        cs["metrics"]["pain_identified"] = 1
    partial = _partial_insight_open_loop(lang, cs) if cs.get("problem") else ""
    q = _strict_lang_render(
        lang,
        "\n\n".join([x for x in [warm, mirror, partial, _next_question_for_step(lang, next_step, cs)] if x]),
        "\n\n".join([x for x in [warm, mirror, partial, _next_question_for_step(lang, next_step, cs)] if x]),
        "\n\n".join([x for x in [warm, mirror, partial, _next_question_for_step(lang, next_step, cs)] if x]),
    )
    if next_step == "offer":
        cs["metrics"]["cta_shown"] = int(cs["metrics"].get("cta_shown", 0)) + 1
        st_sales["consultant_state"] = cs
        set_conversation_state(sender, st_sales)
        _log_conversion_snapshot(sender, st_sales, started=0, cta_shown=1, paid=0)
        q = _strict_lang_render(
            lang,
            f"{_mirror_pain_text(lang, cs)}\n\n"
            f"{_partial_insight_open_loop(lang, cs)}\n\n"
            f"{_credibility_line(lang)}\n\n"
            f"{_gentle_urgency_text(lang)}\n\n"
            f"If you want, we can do a paid diagnosis session (₹{SESSION_PRICE}) to identify the core issue and give you a clear roadmap.",
            f"{_mirror_pain_text(lang, cs)}\n\n"
            f"{_partial_insight_open_loop(lang, cs)}\n\n"
            f"{_credibility_line(lang)}\n\n"
            f"{_gentle_urgency_text(lang)}\n\n"
            f"Agar aap chaho, hum paid diagnosis session (₹{SESSION_PRICE}) kar sakte hain jisme core issue identify karke clear roadmap denge.",
            f"{_mirror_pain_text(lang, cs)}\n\n"
            f"{_partial_insight_open_loop(lang, cs)}\n\n"
            f"{_credibility_line(lang)}\n\n"
            f"{_gentle_urgency_text(lang)}\n\n"
            f"अगर आप चाहें, तो हम paid diagnosis session (₹{SESSION_PRICE}) कर सकते हैं, जिसमें core issue identify करके clear roadmap देंगे।",
        )
        return LeadFlowReply(body=q, buttons=_buttons_from_options(lang, ["Book Diagnosis", "Need Details", "Later", "Other"], "offer"))

    # No dead-end fallback.
    if next_step not in {"stage", "mode", "platform", "problem", "sub_problem", "insight"}:
        fallback_body = _strict_lang_render(
            lang,
            "Let me understand this better—what is your biggest challenge right now?",
            "Thoda better samjhta hoon—abhi sabse bada challenge kya hai?",
            "इसे बेहतर समझता हूं—अभी आपकी सबसे बड़ी चुनौती क्या है?",
        )
        return LeadFlowReply(body=fallback_body, buttons=_buttons_from_options(lang, generate_dynamic_options({"current_step": "problem", **cs}), "dyn_problem"))

    st_sales["consultant_state"] = cs
    set_conversation_state(sender, st_sales)
    return LeadFlowReply(body=q, buttons=_buttons_from_options(lang, generate_dynamic_options(cs), f"dyn_{next_step}"))
def _insight_for_profile(answers: dict, lang: str) -> str:
    platform = str(answers.get("platform", "")).lower()
    sub_problem = str(answers.get("sub_problem", "")).lower()
    if lang == "english":
        if "youtube" in platform and ("no_audience" in sub_problem or "views" in sub_problem):
            return (
                "I understand your situation.\n\n"
                "Since you're struggling with audience on YouTube,\n"
                "the issue is usually content positioning or consistency.\n\n"
                "This can definitely be improved."
            )
        return (
            "I understand your situation.\n\n"
            "At this stage, most people struggle with clarity or execution.\n\n"
            "This can definitely be improved."
        )
    if lang == "hindi":
        return (
            "मैं आपकी स्थिति समझ गया।\n\n"
            "इस स्टेज पर ज्यादातर लोग clarity या execution में अटकते हैं।\n\n"
            "इसे निश्चित रूप से बेहतर किया जा सकता है।"
        )
    return (
        "Samajh gaya.\n\n"
        "Is stage pe zyada log clarity ya execution mein atakte hain.\n\n"
        "Ye definitely improve ho sakta hai."
    )


def generate_options(context: dict) -> tuple[tuple[str, str], ...]:
    stage = str(context.get("funnel_stage") or "")
    platform = str(context.get("platform") or context.get("subcategory") or "").lower()
    mode = str(context.get("funnel_mode") or "").lower()
    if stage == "ask_subcategory_detail" and "youtube" in platform:
        return (
            ("yt_no_views", "Not getting views"),
            ("yt_content_confused", "Don’t know content"),
            ("yt_not_consistent", "Not consistent"),
            ("yt_setup_confused", "Channel setup confusion"),
            ("yt_other", "Other"),
        )
    if stage == "ask_subcategory_detail" and "instagram" in platform:
        return (
            ("ig_no_reach", "No reach"),
            ("ig_no_followers", "No followers"),
            ("ig_no_sales", "No sales"),
            ("ig_content_confused", "Content confusion"),
            ("ig_other", "Other"),
        )
    if stage == "ask_subcategory_detail" and mode == "offline":
        return (
            ("of_need_customers", "Need customers"),
            ("of_location_issue", "Location issue"),
            ("of_pricing_issue", "Pricing issue"),
            ("of_setup_issue", "Setup issue"),
            ("of_other", "Other"),
        )
    return (
        ("pb_sales_low", "Sales low"),
        ("pb_no_customers", "No customers"),
        ("pb_marketing", "Marketing issue"),
        ("pb_execution", "Execution issue"),
        ("pb_other", "Other"),
    )


def _strip_or_limit_emoji(text: str, *, keep_one: bool) -> str:
    emoji_re = re.compile(r"[😊⚠📈🎯🚀👍👌👀]")
    if not keep_one:
        return emoji_re.sub("", text or "").strip()
    seen = False
    out = []
    for ch in text or "":
        if emoji_re.match(ch):
            if seen:
                continue
            seen = True
        out.append(ch)
    return "".join(out).strip()


def _exploration_question(mode: str) -> LeadFlowReply:
    if mode == "online":
        return LeadFlowReply(
            body="What exactly are you planning online?",
            buttons=(
                ("ex_insta", "Instagram"),
                ("ex_youtube", "YouTube"),
                ("ex_drop", "Dropshipping"),
                ("ex_selling", "Selling products"),
                ("ex_course", "Course / services"),
                ("ex_notsure", "Not sure"),
            ),
        )
    return LeadFlowReply(
        body="What’s your focus offline?",
        buttons=(
            ("ex_shop_running", "Already have a shop"),
            ("ex_shop_new", "Want to start something new"),
            ("ex_no_clarity", "No clarity yet"),
            ("ex_need_customers", "Need customers"),
            ("ex_other", "Other"),
        ),
    )


def _second_level_question(selection: str, mode: str) -> LeadFlowReply:
    s = (selection or "").lower()
    if "youtube" in s:
        return LeadFlowReply(
            body="I understand.\n\nWhat exactly are you facing on YouTube?",
            buttons=generate_options({"funnel_stage": "ask_subcategory_detail", "subcategory": "youtube"}),
        )
    if "insta" in s:
        return LeadFlowReply(
            body="Got it. What’s your current situation with Instagram?",
            buttons=generate_options({"funnel_stage": "ask_subcategory_detail", "subcategory": "instagram"}),
        )
    if any(x in s for x in ("drop", "selling", "product")):
        return LeadFlowReply(
            body="Got it. What’s your current situation with products?",
            buttons=(
                ("pr_store_not_set", "Store not set"),
                ("pr_no_sales", "No sales"),
                ("pr_ads_fail", "Ads not working"),
                ("pr_confused_sell", "Confused what to sell"),
                ("pr_other", "Other"),
            ),
        )
    if mode == "offline":
        return LeadFlowReply(
            body="Got it. What’s your current offline situation?",
            buttons=(
                ("of_running", "Already running shop"),
                ("of_start_new", "Want to start new"),
                ("of_no_clarity", "No clarity"),
                ("of_need_customers", "Need customers"),
                ("of_other", "Other"),
            ),
        )
    return LeadFlowReply(
        body="Got it. What feels most difficult right now?",
        buttons=generate_options({"funnel_stage": "ask_subcategory_detail", "funnel_mode": mode}),
    )


def _is_leads_like(challenge: str) -> bool:
    c = (challenge or "").lower()
    return any(x in c for x in ("lead", "no_leads", "log aa nahi", "customers"))


def _micro_explain_copy(challenge: str) -> str:
    c = (challenge or "").lower()
    if "follow" in c:
        return (
            "I understand.\n\n"
            "When follow-up is slow, leads are often lost ⚠️\n\n"
            "Usually this happens due to weak systems\n"
            "or delayed response.\n\n"
            "This is common.\n"
            "It can be fixed."
        )
    if _is_leads_like(c):
        return (
            "I understand.\n\n"
            "When customers are not coming in, growth slows down.\n\n"
            "Usually this is a marketing or offer clarity issue.\n\n"
            "You are not alone.\n"
            "It can be improved."
        )
    if "sales" in c:
        return (
            "I understand.\n\n"
            "When sales do not convert, confidence drops.\n\n"
            "This is common.\n"
            "There is a clear fix."
        )
    return (
        "I understand.\n\n"
        "This is a common issue.\n"
        "It can be solved."
    )


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

    @app.route("/dashboard/conversion.json", methods=["GET"])
    def dashboard_conversion_json():
        if settings.dashboard_password and not _is_dashboard_authed(settings):
            return jsonify({"error": "unauthorized"}), 401
        return jsonify({"rows": get_conversion_events()}), 200

    @app.route("/dashboard/conversion.csv", methods=["GET"])
    def dashboard_conversion_csv():
        if settings.dashboard_password and not _is_dashboard_authed(settings):
            return jsonify({"error": "unauthorized"}), 401
        rows = get_conversion_events()
        out = io.StringIO()
        writer = csv.DictWriter(
            out,
            fieldnames=["date", "started", "cta_shown", "paid", "source", "language", "path_selected"],
        )
        writer.writeheader()
        for r in rows:
            writer.writerow(
                {
                    "date": r.get("date", ""),
                    "started": r.get("started", 0),
                    "cta_shown": r.get("cta_shown", 0),
                    "paid": r.get("paid", 0),
                    "source": r.get("source", ""),
                    "language": r.get("language", ""),
                    "path_selected": r.get("path_selected", ""),
                }
            )
        csv_text = out.getvalue()
        resp = make_response(csv_text, 200)
        resp.headers["Content-Type"] = "text/csv; charset=utf-8"
        resp.headers["Content-Disposition"] = "attachment; filename=conversion_analytics.csv"
        return resp

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

                st_entry_check = get_conversation_state(sender)
                if _contains_entry_greeting(inbound):
                    if inbound.strip().lower() == "start" and str(st_entry_check.get("stage") or "") == "offer_shown":
                        set_conversation_state(sender, {**st_entry_check, "funnel_stage": "offer_accept"})
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
                    clear_conversation_state(sender)
                    print("ENTRY FLOW TRIGGERED")
                    tl_entry = build_preview_state_for_sales({}, inbound)["transcript_lines"]
                    set_conversation_state(
                        sender,
                        {
                            "entry_flow": "language_select",
                            "stage": "",
                            "step": "start",
                            "lang": "en",
                            "transcript_lines": tl_entry,
                            "last_user_seen_at": datetime.now(timezone.utc).isoformat(),
                        },
                    )
                    welcome_lang = LeadFlowReply(
                        body="Welcome to StratXcel 🚀\n\nChoose your language:",
                        buttons=_ENTRY_LANG_BUTTONS,
                    )
                    _finalize_wa_auto_reply(settings, sender, welcome_lang, wa_mid)
                    return "", 200
                if _is_new_user_state(st_entry_check):
                    clear_conversation_state(sender)
                    print("ENTRY FLOW TRIGGERED")
                    tl_entry = build_preview_state_for_sales({}, inbound)["transcript_lines"]
                    set_conversation_state(
                        sender,
                        {
                            "entry_flow": "language_select",
                            "stage": "",
                            "step": "start",
                            "lang": "en",
                            "transcript_lines": tl_entry,
                            "last_user_seen_at": datetime.now(timezone.utc).isoformat(),
                        },
                    )
                    welcome_lang = LeadFlowReply(
                        body="Welcome to StratXcel 🚀\n\nChoose your language:",
                        buttons=_ENTRY_LANG_BUTTONS,
                    )
                    _finalize_wa_auto_reply(settings, sender, welcome_lang, wa_mid)
                    return "", 200

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
                        lang = "english"
                    elif rid == "lang_hi":
                        lang = "hindi"
                    elif rid == "lang_hinglish":
                        lang = "hinglish"
                    else:
                        low = inbound.lower()
                        if low in ("english", "en", "inglish") or "english" in low:
                            lang = "english"
                        elif low in ("hindi", "hi", "हिंदी") or "hindi" in low:
                            lang = "hindi"
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
                            "stage": "language_selected",
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
                            "stage": "menu_selected",
                            "menu_choice": rid,
                            "step": "await_business",
                            "funnel_need": need,
                            "funnel_stage": "ask_stage",
                            "funnel_answers": {},
                            "consultant_state": _init_consultant_state(),
                            "transcript_lines": tl3,
                        },
                    )
                    _log_conversion_snapshot(
                        sender,
                        get_conversation_state(sender),
                        started=1,
                        cta_shown=0,
                        paid=0,
                    )
                    lang_now = get_user_lang(sender)
                    cs_boot = _init_consultant_state()
                    _finalize_wa_auto_reply(
                        settings,
                        sender,
                        LeadFlowReply(
                            body=_next_question_for_step(lang_now, "stage", cs_boot),
                            buttons=_buttons_from_options(lang_now, generate_dynamic_options(cs_boot), "dyn_stage"),
                        ),
                        wa_mid,
                    )
                    return "", 200

                st_sales = get_conversation_state(sender)
                if (st_sales.get("entry_flow") or "").strip() != "ready":
                    print("ENTRY FLOW INCOMPLETE — skip intercept/lead")
                    if wa_mid:
                        st_inc = get_conversation_state(sender)
                        st_inc["last_wa_mid"] = wa_mid
                        set_conversation_state(sender, st_inc)
                    return "", 200

                if isinstance(st_sales.get("consultant_state"), dict):
                    try:
                        dyn_reply = _run_dynamic_consultant_step(sender, inbound, raw_interactive_id, st_sales)
                        _finalize_wa_auto_reply(settings, sender, dyn_reply, wa_mid)
                        return "", 200
                    except Exception:
                        print("[wa-webhook] dynamic consultant fallback")

                funnel_stage = str(st_sales.get("funnel_stage") or "").strip()
                if funnel_stage:
                    print("CURRENT STEP:", funnel_stage)
                    print("NEXT STEP:", _next_step(funnel_stage))
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
                    lang_now = get_user_lang(sender)
                    if funnel_stage == "ask_stage":
                        answers["stage"] = raw_interactive_id or inbound
                        st_next = {
                            **st_sales,
                            "funnel_stage": "ask_business_type",
                            "funnel_answers": answers,
                            "last_funnel_button_id": raw_interactive_id or "",
                            "last_funnel_stage": funnel_stage,
                        }
                        set_conversation_state(sender, st_next)
                        _finalize_wa_auto_reply(
                            settings,
                            sender,
                            LeadFlowReply(
                                body=_flow_text(lang_now, "ask_business_type"),
                                buttons=_flow_buttons(lang_now, ("bt_online", "bt_offline", "bt_notsure")),
                            ),
                            wa_mid,
                        )
                        return "", 200
                    if funnel_stage == "ask_business_type":
                        choice = raw_interactive_id or inbound
                        answers["business_type"] = choice
                        mode = "offline" if choice == "bt_offline" else "online"
                        st_next = {
                            **st_sales,
                            "funnel_stage": "ask_subcategory",
                            "funnel_mode": mode,
                            "funnel_answers": answers,
                            "last_funnel_button_id": raw_interactive_id or "",
                            "last_funnel_stage": funnel_stage,
                        }
                        set_conversation_state(sender, st_next)
                        if mode == "online":
                            _finalize_wa_auto_reply(
                                settings,
                                sender,
                                LeadFlowReply(
                                    body=_flow_text(lang_now, "ask_online_sub"),
                                    buttons=_flow_buttons(lang_now, ("sc_instagram", "sc_youtube", "sc_dropship")),
                                ),
                                wa_mid,
                            )
                        else:
                            _finalize_wa_auto_reply(
                                settings,
                                sender,
                                LeadFlowReply(
                                    body=_flow_text(lang_now, "ask_offline_sub"),
                                    buttons=_flow_buttons(lang_now, ("of_running_shop", "of_start_new", "of_no_clarity")),
                                ),
                                wa_mid,
                            )
                        return "", 200
                    if funnel_stage == "ask_subcategory":
                        sub = raw_interactive_id or inbound
                        answers["subcategory"] = sub
                        st_next = {
                            **st_sales,
                            "funnel_stage": "ask_subcategory_detail",
                            "funnel_answers": answers,
                            "last_funnel_button_id": raw_interactive_id or "",
                            "last_funnel_stage": funnel_stage,
                        }
                        set_conversation_state(sender, st_next)
                        _finalize_wa_auto_reply(settings, sender, _second_level_question(sub, str(st_sales.get("funnel_mode", "online"))), wa_mid)
                        return "", 200
                    if funnel_stage == "ask_subcategory_detail":
                        detail = raw_interactive_id or inbound
                        if detail.endswith("other") or detail == "Other":
                            st_next = {
                                **st_sales,
                                "funnel_stage": "ask_other_detail",
                                "funnel_answers": answers,
                                "last_funnel_button_id": raw_interactive_id or "",
                                "last_funnel_stage": funnel_stage,
                            }
                            set_conversation_state(sender, st_next)
                            _finalize_wa_auto_reply(
                                settings,
                                sender,
                                LeadFlowReply(body="Can you explain a bit more?"),
                                wa_mid,
                            )
                            return "", 200
                        answers["subcategory_detail"] = detail
                        if detail == "yt_no_audience":
                            st_next = {
                                **st_sales,
                                "funnel_stage": "ask_behavior_regular",
                                "funnel_answers": answers,
                                "last_funnel_button_id": raw_interactive_id or "",
                                "last_funnel_stage": funnel_stage,
                            }
                            set_conversation_state(sender, st_next)
                            _finalize_wa_auto_reply(
                                settings,
                                sender,
                                LeadFlowReply(
                                    body=(
                                        "I understand.\n\n"
                                        "If views are low, this is usually positioning or consistency.\n\n"
                                        "Let me understand one thing—\n\n"
                                        "Are you posting regularly?"
                                    ),
                                    buttons=(("bh_yes", "Yes"), ("bh_no", "No"), ("bh_unsure", "Not sure")),
                                ),
                                wa_mid,
                            )
                            return "", 200
                        st_next = {
                            **st_sales,
                            "funnel_stage": "ask_challenge",
                            "funnel_answers": answers,
                            "last_funnel_button_id": raw_interactive_id or "",
                            "last_funnel_stage": funnel_stage,
                        }
                        set_conversation_state(sender, st_next)
                        _finalize_wa_auto_reply(
                            settings,
                            sender,
                            LeadFlowReply(
                                body=f"{_flow_text(lang_now, 'understand')}\n\n{_flow_text(lang_now, 'ask_problem')}",
                                buttons=_flow_buttons(lang_now, ("pb_sales_low", "pb_no_customers", "pb_marketing")),
                            ),
                            wa_mid,
                        )
                        return "", 200
                    if funnel_stage == "ask_other_detail":
                        problem_text = (inbound or "").strip()
                        mapped = "content_clarity" if "content" in problem_text.lower() else "execution_issue"
                        answers["sub_problem"] = mapped
                        st_next = {
                            **st_sales,
                            "funnel_stage": "ask_challenge",
                            "funnel_answers": answers,
                            "last_funnel_button_id": raw_interactive_id or "",
                            "last_funnel_stage": funnel_stage,
                        }
                        set_conversation_state(sender, st_next)
                        _finalize_wa_auto_reply(
                            settings,
                            sender,
                            LeadFlowReply(
                                body=(
                                    "Got it.\n\n"
                                    f"So you are facing {mapped.replace('_', ' ')} issue.\n\n"
                                    f"{_flow_text(lang_now, 'ask_problem')}"
                                ),
                                buttons=generate_options({"funnel_stage": "ask_challenge", "platform": answers.get('subcategory', '')}),
                            ),
                            wa_mid,
                        )
                        return "", 200
                    if funnel_stage == "ask_behavior_regular":
                        answers["posting_regular"] = raw_interactive_id or inbound
                        st_next = {
                            **st_sales,
                            "funnel_stage": "ask_behavior_niche",
                            "funnel_answers": answers,
                            "last_funnel_button_id": raw_interactive_id or "",
                            "last_funnel_stage": funnel_stage,
                        }
                        set_conversation_state(sender, st_next)
                        _finalize_wa_auto_reply(
                            settings,
                            sender,
                            LeadFlowReply(
                                body="Got it.\n\nDo you have a clear niche?",
                                buttons=(("ni_yes", "Yes"), ("ni_no", "No"), ("ni_unsure", "Not sure")),
                            ),
                            wa_mid,
                        )
                        return "", 200
                    if funnel_stage == "ask_behavior_niche":
                        answers["clear_niche"] = raw_interactive_id or inbound
                        st_next = {
                            **st_sales,
                            "funnel_stage": "ask_challenge",
                            "funnel_answers": answers,
                            "last_funnel_button_id": raw_interactive_id or "",
                            "last_funnel_stage": funnel_stage,
                        }
                        set_conversation_state(sender, st_next)
                        _finalize_wa_auto_reply(
                            settings,
                            sender,
                            LeadFlowReply(
                                body=(
                                    "I understand your context.\n\n"
                                    "With low views, the root issue is often niche clarity + consistency.\n\n"
                                    "What is the biggest problem right now?"
                                ),
                                buttons=_flow_buttons(get_user_lang(sender), ("pb_sales_low", "pb_no_customers", "pb_marketing")),
                            ),
                            wa_mid,
                        )
                        return "", 200
                    if funnel_stage == "ask_challenge":
                        challenge = raw_interactive_id if raw_interactive_id else inbound
                        if challenge.endswith("other") or challenge == "Other":
                            st_next = {
                                **st_sales,
                                "funnel_stage": "ask_other_detail",
                                "funnel_answers": answers,
                                "last_funnel_button_id": raw_interactive_id or "",
                                "last_funnel_stage": funnel_stage,
                            }
                            set_conversation_state(sender, st_next)
                            _finalize_wa_auto_reply(settings, sender, LeadFlowReply(body="Can you explain a bit more?"), wa_mid)
                            return "", 200
                        answers["challenge"] = challenge
                        st_next = {**st_sales, "funnel_answers": answers, "last_funnel_button_id": raw_interactive_id or "", "last_funnel_stage": funnel_stage}
                        if _is_leads_like(challenge):
                            st_next["funnel_stage"] = "ask_lead_source"
                            st_next["stage"] = "question_1_done"
                            set_conversation_state(sender, st_next)
                            _finalize_wa_auto_reply(
                                settings,
                                sender,
                                LeadFlowReply(
                                    body=(
                                        f"{_micro_explain_copy(challenge)}\n\n"
                                        "Leads ka issue usually alag-alag jagah se aata hai.\n\n"
                                        "Aapka zyada focus kaha hai?"
                                    ),
                                    list_menu=ListMenuSpec(
                                        button_label="Source choose karo",
                                        section_title="Lead source",
                                        rows=(
                                            ("src_insta", "Instagram / Social media", None),
                                            ("src_youtube", "YouTube", None),
                                            ("src_ads", "Ads (Facebook/Google)", None),
                                            ("src_local", "Local customers", None),
                                            ("src_notsure", "Not sure", None),
                                        ),
                                    ),
                                ),
                                wa_mid,
                            )
                            return "", 200
                        st_next["funnel_stage"] = "offer_accept"
                        st_next["stage"] = "question_1_done"
                        set_conversation_state(sender, st_next)
                        _finalize_wa_auto_reply(
                            settings,
                            sender,
                            LeadFlowReply(
                                body=(
                                    f"{_micro_explain_copy(challenge)}\n\n"
                                    "Agar abhi clarity mil jaye,\n"
                                    "toh kaafi time bach sakta hai.\n"
                                    "Most log guesswork mein months waste kar dete hain.\n\n"
                                    f"{_FUNNEL_PITCH}"
                                ),
                                buttons=(("offer_yes", "Yes Start"), ("offer_details", "Need Details"), ("offer_later", "Later")),
                            ),
                            wa_mid,
                        )
                        return "", 200
                    if funnel_stage == "ask_lead_source":
                        answers["lead_source"] = raw_interactive_id or inbound
                        st_next = {
                            **st_sales,
                            "funnel_stage": "offer_accept",
                            "funnel_answers": answers,
                            "last_funnel_button_id": raw_interactive_id or "",
                            "last_funnel_stage": funnel_stage,
                            "stage": "offer_shown",
                        }
                        set_conversation_state(sender, st_next)
                        _finalize_wa_auto_reply(
                            settings,
                            sender,
                            LeadFlowReply(
                                body=(
                                    "Sahi baat hai.\n"
                                    "Ye common hai.\n"
                                    "Aap alone nahi ho.\n"
                                    "Iska solution hota hai.\n\n"
                                    "Ye clarity early mil jaaye toh time aur paisa dono bachta hai.\n\n"
                                    f"{_FUNNEL_PITCH}"
                                ),
                                buttons=(("offer_yes", "Yes Start"), ("offer_details", "Need Details"), ("offer_later", "Later")),
                            ),
                            wa_mid,
                        )
                        return "", 200
                    if funnel_stage == "offer_accept":
                        rid = (raw_interactive_id or "").strip()
                        if rid == "offer_details" or "detail" in inbound.lower():
                            detail_body = (
                                "Simple bataun 👍\n\n"
                                "Session ke baad aapko clear ho jayega:\n\n"
                                "• abhi kya galat ho raha hai\n"
                                "• kya improve karna hai\n"
                                "• kaise grow karna hai\n"
                                "• next step kya hona chahiye\n\n"
                                "Taaki random try na karna pade.\n\n"
                                f"Session ₹{SESSION_PRICE} ka hi hai.\n\n"
                                "Start karna hai? 😊"
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
                                "stage": "offer_shown",
                                "last_funnel_button_id": rid or "offer_later",
                                "last_funnel_stage": funnel_stage,
                            }
                            set_conversation_state(sender, st_later)
                            _finalize_wa_auto_reply(
                                settings,
                                sender,
                                LeadFlowReply(body="Theek hai 👍 jab ready ho, bas 'start' likh dena"),
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
                                    "stage": "payment_pending",
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
                    # Failsafe only when flow cannot resolve next step.
                    next_step = _next_step(funnel_stage)
                    if next_step is None:
                        _finalize_wa_auto_reply(
                            settings,
                            sender,
                            LeadFlowReply(
                                body=_flow_text(get_user_lang(sender), "failsafe"),
                                buttons=generate_options({"funnel_stage": "ask_challenge", "platform": str(answers.get("subcategory", ""))}),
                            ),
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
