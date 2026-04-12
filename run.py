"""Run the WhatsApp webhook server."""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.config import load_dotenv_files, Settings

load_dotenv_files()
from app.whatsapp.webhook import create_app


def main() -> None:
    settings = Settings.load()
    app = create_app(settings)
    app.run(host=settings.flask_host, port=settings.flask_port)


if __name__ == "__main__":
    main()
