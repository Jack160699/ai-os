"""Optional SMTP digests for daily summary + weekly conversion report."""

from __future__ import annotations

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any


def _smtp_config() -> dict[str, str] | None:
    host = (os.getenv("SMTP_HOST") or "").strip()
    user = (os.getenv("SMTP_USER") or "").strip()
    password = (os.getenv("SMTP_PASSWORD") or "").strip()
    port = (os.getenv("SMTP_PORT") or "587").strip()
    mail_from = (os.getenv("SMTP_FROM") or user).strip()
    if not host or not mail_from:
        return None
    return {"host": host, "user": user, "password": password, "port": port, "from": mail_from}


def _recipients() -> list[str]:
    raw = (os.getenv("OWNER_DIGEST_EMAIL") or os.getenv("SUMMARY_EMAIL_TO") or "").strip()
    if not raw:
        return []
    return [x.strip() for x in raw.split(",") if x.strip()]


def build_daily_digest(metrics: dict[str, Any]) -> tuple[str, str, str]:
    """metrics = output of compute_dashboard_metrics (flat keys)."""
    subj = "StratXcel — Daily growth summary"
    lines = [
        f"Leads today: {metrics.get('daily_leads', 0)}",
        f"Active pipeline: {metrics.get('active_leads', 0)}",
        f"Bookings today: {metrics.get('bookings_today', 0)}",
        f"Conversion rate: {metrics.get('conversion_rate_pct', 0)}%",
        f"Revenue (roll): ₹{metrics.get('paid_revenue_rupees', 0)}",
        f"Payments (30d): {metrics.get('payments_count_30d', 0)}",
    ]
    text = "StratXcel daily summary\n\n" + "\n".join(lines)
    html = (
        "<html><body style='font-family:system-ui,sans-serif;background:#0b1220;color:#e2e8f0;padding:24px'>"
        "<h2 style='margin:0 0 12px'>Daily growth summary</h2>"
        "<ul style='line-height:1.7'>"
        + "".join(f"<li>{line}</li>" for line in lines)
        + "</ul><p style='color:#94a3b8;font-size:13px'>Sent automatically from your StratXcel bot.</p></body></html>"
    )
    return subj, html, text


def build_weekly_digest(metrics: dict[str, Any]) -> tuple[str, str, str]:
    subj = "StratXcel — Weekly conversion report"
    lines = [
        f"Total leads (workspace): {metrics.get('total_leads', 0)}",
        f"Completed / qualified: {metrics.get('total_completed', 0)}",
        f"Booked calls: {metrics.get('booked_calls', 0)}",
        f"Hot leads count: {metrics.get('hot_leads_count', 0)}",
        f"Cold / inactive: {metrics.get('cold_leads', 0)}",
        f"Follow-ups sent: {metrics.get('followups_sent', 0)}",
        f"30d revenue: ₹{metrics.get('paid_revenue_30d_rupees', metrics.get('paid_revenue_rupees', 0))}",
    ]
    text = "StratXcel weekly conversion report\n\n" + "\n".join(lines)
    html = (
        "<html><body style='font-family:system-ui,sans-serif;background:#0b1220;color:#e2e8f0;padding:24px'>"
        "<h2 style='margin:0 0 12px'>Weekly conversion report</h2>"
        "<ul style='line-height:1.7'>"
        + "".join(f"<li>{line}</li>" for line in lines)
        + "</ul><p style='color:#94a3b8;font-size:13px'>Review /admin/analytics for charts and source ROI.</p></body></html>"
    )
    return subj, html, text


def send_smtp_html(subject: str, html_body: str, text_body: str) -> dict[str, Any]:
    cfg = _smtp_config()
    tos = _recipients()
    if not cfg or not tos:
        return {"ok": False, "skipped": True, "reason": "smtp_or_recipients_not_configured"}

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = cfg["from"]
    msg["To"] = ", ".join(tos)
    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    port = int(cfg["port"] or "587")
    try:
        with smtplib.SMTP(cfg["host"], port, timeout=30) as server:
            server.starttls()
            if cfg["user"] and cfg["password"]:
                server.login(cfg["user"], cfg["password"])
            server.sendmail(cfg["from"], tos, msg.as_string())
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "to": tos}
