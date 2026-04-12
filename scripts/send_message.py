"""Send one AI-generated WhatsApp text (for manual testing)."""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.ai.assistant import get_ai_reply
from app.config import load_dotenv_files, Settings

load_dotenv_files()
from app.whatsapp.messaging import send_whatsapp_text


def main() -> None:
    import os

    settings = Settings.load()
    to = os.getenv("WHATSAPP_TEST_TO", "").strip()
    if not to:
        print("Set WHATSAPP_TEST_TO in .env to a WhatsApp-enabled phone number (E.164, no +).")
        return

    user_input = input("Enter message to answer and send: ").strip()
    if not user_input:
        return

    reply = get_ai_reply(settings, user_input, wa_user_id=to)
    resp = send_whatsapp_text(settings, to, reply)
    print("STATUS:", resp.status_code)
    print("RESPONSE:", resp.text)


if __name__ == "__main__":
    main()
