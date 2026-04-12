from flask import Flask, g, request

from app.ai.assistant import get_ai_reply
from app.config import Settings
from app.whatsapp.messaging import send_whatsapp_text

# WhatsApp Cloud API sends `from` as digits only (no +). Must match exactly.
OWNER_NUMBER = "917777812777"


def create_app(settings: Settings) -> Flask:
    app = Flask(__name__)

    @app.route("/", methods=["GET"])
    def home():
        return "WhatsApp AI assistant is running."

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

            reply = get_ai_reply(settings, message, wa_user_id=sender, mode=mode)
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
