import json
import hmac
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
)
from app.memory.store import (
    get_all_states,
    append_thread_message,
    get_conversation_state,
    get_lead_events,
    get_thread_messages,
    set_conversation_state,
)
from app.whatsapp.lead_flow import LeadFlowReply, handle_lead_message
from app.whatsapp.messaging import (
    send_interactive_buttons,
    send_interactive_list,
    send_whatsapp_text,
)


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


def _send_lead_flow_reply(settings: Settings, sender: str, reply: LeadFlowReply):
    if reply.list_menu:
        return send_interactive_list(
            settings,
            sender,
            reply.body,
            button_label=reply.list_menu.button_label,
            section_title=reply.list_menu.section_title,
            rows=reply.list_menu.rows,
        )
    if reply.buttons:
        return send_interactive_buttons(settings, sender, reply.body, reply.buttons)
    return send_whatsapp_text(settings, sender, reply.body)


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

    @app.route("/internal/followups", methods=["POST"])
    def internal_followups():
        if not settings.followup_cron_secret:
            return jsonify({"error": "followups disabled"}), 404
        got = request.headers.get("X-Followup-Cron-Secret", "")
        if not hmac.compare_digest(got, settings.followup_cron_secret):
            return jsonify({"error": "unauthorized"}), 401
        result = process_due_followups(settings)
        print(
            "[followup-cron] "
            f"checked={result['checked']} sent={result['sent']} "
            f"skipped={result['skipped']} completed={result['completed']}"
        )
        return jsonify(result), 200

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
            sender = msg_data["from"]
            wa_mid = msg_data.get("id") or ""

            st0 = get_conversation_state(sender)
            if wa_mid and st0.get("last_wa_mid") == wa_mid:
                return "ok", 200

            msg_type = msg_data.get("type")
            message = ""
            raw_interactive_id = ""
            if msg_type == "text":
                message = (msg_data.get("text") or {}).get("body") or ""
            elif msg_type == "interactive":
                inter = msg_data.get("interactive") or {}
                itype = inter.get("type")
                if itype == "button_reply":
                    br = inter.get("button_reply") or {}
                    raw_interactive_id = (br.get("id") or "").strip()
                    message = (br.get("title") or raw_interactive_id or "").strip()
                elif itype == "list_reply":
                    lr = inter.get("list_reply") or {}
                    raw_interactive_id = (lr.get("id") or "").strip()
                    message = (lr.get("title") or raw_interactive_id or "").strip()
                else:
                    return "ok", 200
            else:
                return "ok", 200

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
                return "ok", 200

            mode = "ceo" if sender == OWNER_NUMBER else "client"
            g.ai_os_mode = mode

            print("User:", inbound)

            if mode == "ceo":
                reply_text = get_ai_reply(settings, inbound, wa_user_id=sender, mode=mode)
                print("Bot:", reply_text)
                resp = send_whatsapp_text(settings, sender, reply_text)
                if wa_mid and resp.ok:
                    st1 = get_conversation_state(sender)
                    st1["last_wa_mid"] = wa_mid
                    set_conversation_state(sender, st1)
            else:
                clear_followup_on_user_inbound(sender, inbound)
                append_thread_message(sender, "user", inbound)
                profile_name = _profile_name_for_sender(value, sender)
                reply = handle_lead_message(
                    settings, sender, inbound, profile_name=profile_name
                )
                print("Bot:", reply.body)
                resp = _send_lead_flow_reply(settings, sender, reply)
                if wa_mid and resp.ok:
                    st1 = get_conversation_state(sender)
                    st1["last_wa_mid"] = wa_mid
                    set_conversation_state(sender, st1)
                    append_thread_message(sender, "assistant", reply.body)
                    arm_followup_after_bot_send(sender)
            print("STATUS:", resp.status_code)
            print("RESPONSE:", resp.text)

        except (KeyError, IndexError, TypeError) as e:
            print("Webhook parse error:", e)
        except Exception as e:
            print("Webhook error:", str(e))

        return "ok", 200

    return app
