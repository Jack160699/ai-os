"""
Application entry for ai-os.

- Gunicorn: `gunicorn -c gunicorn.conf.py run:app` (expects module-level `app`).
- Development: `python run.py` (Flask dev server).
"""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.config import load_dotenv_files, Settings  # noqa: E402
from app.whatsapp.webhook import create_app  # noqa: E402

# Load .env before Settings (override=True so file wins over stale shell env).
load_dotenv_files()
settings = Settings.load()
app = create_app(settings)


def main() -> None:
    """Flask development server; production should use Gunicorn + Nginx."""
    app.run(host=settings.flask_host, port=settings.flask_port)


if __name__ == "__main__":
    main()
