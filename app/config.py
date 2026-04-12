from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
_DOTENV_PATH = REPO_ROOT / ".env"


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

    @staticmethod
    def load() -> "Settings":
        dotenv_path, dotenv_ok = load_dotenv_files()

        def req(name: str) -> str:
            v = _normalize_env_value(os.getenv(name, ""))
            if not v:
                raise RuntimeError(f"Missing required environment variable: {name}")
            return v

        openai_key = req("OPENAI_API_KEY")
        os.environ["OPENAI_API_KEY"] = openai_key

        print(
            f"[ai-os env] dotenv_path={dotenv_path} file_exists={dotenv_path.is_file()} "
            f"dotenv_loaded={dotenv_ok} (override=True, encoding=utf-8-sig)"
        )
        print(f"[ai-os env] OPENAI_API_KEY in use (masked): {_mask_secret(openai_key)}")

        wa_token = req("WHATSAPP_ACCESS_TOKEN")
        wa_phone_id = req("WHATSAPP_PHONE_NUMBER_ID")
        wa_verify = req("WHATSAPP_VERIFY_TOKEN")

        print(f"[ai-os env] WHATSAPP_PHONE_NUMBER_ID={wa_phone_id}")
        print(f"[ai-os env] WHATSAPP_ACCESS_TOKEN (masked): {_mask_secret(wa_token)}")
        print(f"[ai-os env] WHATSAPP_VERIFY_TOKEN length={len(wa_verify)}")
        print(f"[ai-os env] REPO_ROOT={REPO_ROOT} (memory.json / .env resolved here)")

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
        )
