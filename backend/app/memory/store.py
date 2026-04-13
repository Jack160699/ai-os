import json
from datetime import datetime, timezone
from pathlib import Path

from app.config import REPO_ROOT

MEMORY_FILE = REPO_ROOT / "memory.json"


def load_memory() -> dict:
    if not MEMORY_FILE.is_file():
        return {}
    try:
        with MEMORY_FILE.open("r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, OSError):
        return {}


def save_memory(memory: dict) -> None:
    MEMORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    with MEMORY_FILE.open("w", encoding="utf-8") as f:
        json.dump(memory, f, indent=2)


def store_fix(error_key: str, fix_action: str) -> None:
    memory = load_memory()
    memory[error_key] = fix_action
    save_memory(memory)


def get_fix(error_key: str):
    return load_memory().get(error_key)


def get_conversation_state(phone_number: str) -> dict:
    """Return persisted conversation state for a WhatsApp number."""
    memory = load_memory()
    key = f"state:{phone_number}"
    state = memory.get(key, {})
    return state if isinstance(state, dict) else {}


def set_conversation_state(phone_number: str, state: dict) -> None:
    """Persist conversation state for a WhatsApp number."""
    memory = load_memory()
    memory[f"state:{phone_number}"] = state
    save_memory(memory)


def clear_conversation_state(phone_number: str) -> None:
    """Remove conversation state for a WhatsApp number."""
    memory = load_memory()
    key = f"state:{phone_number}"
    if key in memory:
        del memory[key]
        save_memory(memory)


def append_lead_event(event: dict) -> None:
    """Append one lead event into memory.json under the `lead_events` list."""
    memory = load_memory()
    events = memory.get("lead_events")
    if not isinstance(events, list):
        events = []
    events.append(event)
    memory["lead_events"] = events
    save_memory(memory)


def get_lead_events() -> list[dict]:
    """Return all stored lead events."""
    memory = load_memory()
    events = memory.get("lead_events", [])
    return events if isinstance(events, list) else []


def iter_state_phone_numbers() -> list[str]:
    """All phones with persisted conversation state (values under `state:{phone}` keys)."""
    memory = load_memory()
    out: list[str] = []
    for key in memory:
        if isinstance(key, str) and key.startswith("state:"):
            out.append(key[6:])
    return out


def get_all_states() -> dict[str, dict]:
    """Return all phone->state mappings from memory."""
    memory = load_memory()
    out: dict[str, dict] = {}
    for key, value in memory.items():
        if isinstance(key, str) and key.startswith("state:") and isinstance(value, dict):
            out[key[6:]] = value
    return out


def _thread_key(phone: str) -> str:
    return f"thread:{phone}"


def append_thread_message(phone: str, role: str, text: str) -> None:
    """Append one chat line (user / assistant) to the per-phone transcript."""
    memory = load_memory()
    key = _thread_key(phone)
    rows = memory.get(key)
    if not isinstance(rows, list):
        rows = []
    line = (text or "").strip()
    if not line:
        return
    rows.append(
        {
            "role": role,
            "text": line,
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        }
    )
    memory[key] = rows[-500:]
    save_memory(memory)


def get_thread_messages(phone: str) -> list[dict]:
    memory = load_memory()
    key = _thread_key(phone)
    rows = memory.get(key)
    return rows if isinstance(rows, list) else []
