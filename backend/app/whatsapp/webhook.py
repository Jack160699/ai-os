import os
from datetime import datetime, timezone

from flask import Flask, request

from app.config import Settings
from app.memory.store import normalize_phone_digits
from app.whatsapp.lead_flow import handle_lead_message
from app.whatsapp.messaging import send_whatsapp_text

_WA_MESSAGE_ID_CACHE: set[str] = set()
_WA_MESSAGE_ID_CACHE_MAX = 5000


def _cache_message_id(message_id: str) -> bool:
    mid = str(message_id or "").strip()
    if not mid:
        return False
    if mid in _WA_MESSAGE_ID_CACHE:
        return True
    _WA_MESSAGE_ID_CACHE.add(mid)
    if len(_WA_MESSAGE_ID_CACHE) > _WA_MESSAGE_ID_CACHE_MAX:
        _WA_MESSAGE_ID_CACHE.clear()
    return False


def _wa_timestamp_iso(msg_data: dict) -> str | None:
    ts = msg_data.get("timestamp")
    if ts is None:
        return None
    try:
        sec = int(str(ts).strip())
        return datetime.fromtimestamp(sec, tz=timezone.utc).isoformat()
    except (TypeError, ValueError, OSError):
        return None


def _extract_message_payload(msg_data: dict) -> str:
    msg_type = str(msg_data.get("type") or "").strip().lower()
    if msg_type == "text":
        txt = (msg_data.get("text") or {}).get("body") or ""
        return str(txt).strip()
    if msg_type == "interactive":
        inter = msg_data.get("interactive") or {}
        itype = str(inter.get("type") or "").strip()
        if itype == "button_reply":
            br = inter.get("button_reply") or {}
            return str(br.get("title") or br.get("id") or "").strip()
        if itype == "list_reply":
            lr = inter.get("list_reply") or {}
            return str(lr.get("title") or lr.get("id") or "").strip()
        return ""
    return ""


def send_whatsapp_message(settings: Settings, phone: str, reply: str):
    return send_whatsapp_text(settings, phone, reply)


def create_app(settings: Settings) -> Flask:
    app = Flask(__name__)

    @app.route("/", methods=["GET"])
    def home():
        return "ok", 200

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
        except (KeyError, IndexError, TypeError):
            return "ok", 200

        messages = value.get("messages") or []
        if not isinstance(messages, list):
            return "ok", 200

        for msg_data in messages:
            if not isinstance(msg_data, dict):
                continue
            message_id = str(msg_data.get("id") or "").strip()
            print("Incoming message:", message_id)
            if _cache_message_id(message_id):
                print("[wa-webhook] duplicate message ignored:", message_id)
                continue

            phone = normalize_phone_digits(str(msg_data.get("from") or "").strip())
            if not phone:
                continue

            message = _extract_message_payload(msg_data)
            message = (message or "").strip()
            if not message:
                continue

            reply = handle_lead_message(phone, message)
            if reply is None:
                return "", 200

            send_whatsapp_message(settings, phone, reply)
            return "", 200

        return "", 200

    return app
