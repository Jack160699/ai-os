from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = Path(__file__).resolve().parent.parent
REPO_ROOT = PROJECT_ROOT
_DOTENV_PATH = PROJECT_ROOT / ".env"


def load_dotenv_files() -> tuple[Path, bool]:
    """Load repo-root .env so it wins over stale shell/user env (common 401 cause)."""
    try:
        from dotenv import load_dotenv
    except ImportError:
        return _DOTENV_PATH, False

    ok = load_dotenv(
        _DOTENV_PATH,
        override=True,
        encoding="utf-8-sig",
    )
    return _DOTENV_PATH, bool(ok)


def _normalize_env_value(raw: str) -> str:
    v = raw.strip()
    if len(v) >= 2 and v[0] == v[-1] and v[0] in ("\"", "'"):
        v = v[1:-1].strip()
    return v


def _mask_secret(value: str, head: int = 10, tail: int = 4) -> str:
    if not value:
        return "(empty)"
    if len(value) <= head + tail + 3:
        return "(set, length " + str(len(value)) + ")"
    return f"{value[:head]}...{value[-tail:]} (len={len(value)})"


@dataclass(frozen=True)
class Settings:
    openai_api_key: str
    wa_access_token: str
    wa_phone_number_id: str
    wa_verify_token: str
    openai_model: str
    flask_host: str
    flask_port: int
    graph_api_version: str
    booking_url: str
    google_sheets_webhook_url: str
    admin_alert_number: str
    dashboard_password: str
    followup_cron_secret: str
    internal_payment_webhook_secret: str

    @staticmethod
    def load() -> "Settings":
        dotenv_path, dotenv_ok = load_dotenv_files()

        def req(name: str) -> str:
            v = _normalize_env_value(os.getenv(name, ""))
            if not v:
                raise RuntimeError(f"Missing required environment variable: {name}")
            return v

        def req_any(*names: str) -> str:
            for n in names:
                v = _normalize_env_value(os.getenv(n, ""))
                if v:
                    return v
            raise RuntimeError(f"Missing required environment variable (one of): {', '.join(names)}")

        openai_key = req("OPENAI_API_KEY")
        os.environ["OPENAI_API_KEY"] = openai_key

        print(
            f"[ai-os env] dotenv_path={dotenv_path} file_exists={dotenv_path.is_file()} "
            f"dotenv_loaded={dotenv_ok} (override=True, encoding=utf-8-sig)"
        )
        print(f"[ai-os env] OPENAI_API_KEY in use (masked): {_mask_secret(openai_key)}")

        wa_token = req_any("WHATSAPP_TOKEN", "WHATSAPP_ACCESS_TOKEN")
        wa_phone_id = req("WHATSAPP_PHONE_NUMBER_ID")
        wa_verify = req_any("VERIFY_TOKEN", "WHATSAPP_VERIFY_TOKEN")

        print(f"[ai-os env] WHATSAPP_PHONE_NUMBER_ID={wa_phone_id}")
        print(f"[ai-os env] WHATSAPP_ACCESS_TOKEN (masked): {_mask_secret(wa_token)}")
        print(f"[ai-os env] WHATSAPP_VERIFY_TOKEN length={len(wa_verify)}")
        print(f"[ai-os env] PROJECT_ROOT={PROJECT_ROOT} (root .env / shared paths)")
        print(f"[ai-os env] BACKEND_ROOT={BACKEND_ROOT} (backend runtime files)")

        return Settings(
            openai_api_key=openai_key,
            wa_access_token=wa_token,
            wa_phone_number_id=wa_phone_id,
            wa_verify_token=wa_verify,
            openai_model=_normalize_env_value(os.getenv("OPENAI_MODEL", "gpt-4o-mini"))
            or "gpt-4o-mini",
            flask_host=_normalize_env_value(os.getenv("FLASK_HOST", "0.0.0.0")) or "0.0.0.0",
            flask_port=int(os.getenv("FLASK_PORT", "5000")),
            graph_api_version=_normalize_env_value(
                os.getenv("WHATSAPP_GRAPH_API_VERSION", "v18.0")
            )
            or "v18.0",
            booking_url=_normalize_env_value(os.getenv("BOOKING_URL", "")),
            google_sheets_webhook_url=_normalize_env_value(
                os.getenv("GOOGLE_SHEETS_WEBHOOK_URL", "")
            ),
            admin_alert_number=_normalize_env_value(os.getenv("ADMIN_ALERT_NUMBER", "")),
            dashboard_password=_normalize_env_value(os.getenv("DASHBOARD_PASSWORD", "")),
            followup_cron_secret=_normalize_env_value(os.getenv("FOLLOWUP_CRON_SECRET", "")),
            internal_payment_webhook_secret=_normalize_env_value(
                os.getenv("INTERNAL_PAYMENT_WEBHOOK_SECRET", "")
            ),
        )
