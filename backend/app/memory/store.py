import json
from datetime import datetime, timezone
from pathlib import Path

from app.config import REPO_ROOT

MEMORY_FILE = REPO_ROOT / "memory.json"


def normalize_phone_digits(phone: str) -> str:
    """E.164-ish digits only (no +), consistent thread/state keys for inbox + webhooks."""
    return "".join(c for c in (phone or "") if c.isdigit())


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
    digits = normalize_phone_digits(phone_number)
    key = f"state:{digits}"
    state = memory.get(key, {})
    return state if isinstance(state, dict) else {}


def set_conversation_state(phone_number: str, state: dict) -> None:
    """Persist conversation state for a WhatsApp number."""
    memory = load_memory()
    digits = normalize_phone_digits(phone_number)
    memory[f"state:{digits}"] = state
    save_memory(memory)


def clear_conversation_state(phone_number: str) -> None:
    """Remove conversation state for a WhatsApp number."""
    memory = load_memory()
    digits = normalize_phone_digits(phone_number)
    key = f"state:{digits}"
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
            out.append(normalize_phone_digits(key[6:]))
    return out


def get_all_states() -> dict[str, dict]:
    """Return all phone->state mappings from memory."""
    memory = load_memory()
    out: dict[str, dict] = {}
    for key, value in memory.items():
        if isinstance(key, str) and key.startswith("state:") and isinstance(value, dict):
            out[normalize_phone_digits(key[6:])] = value
    return out


def _thread_key(phone: str) -> str:
    return f"thread:{normalize_phone_digits(phone)}"


def append_thread_message(
    phone: str,
    role: str,
    text: str,
    *,
    wa_message_id: str = "",
    timestamp_utc: str | None = None,
) -> bool:
    """Append one chat line (user / assistant) to the per-phone transcript. Returns True if a new row was stored."""
    memory = load_memory()
    key = _thread_key(phone)
    rows = memory.get(key)
    if not isinstance(rows, list):
        rows = []
    line = (text or "").strip()
    if not line:
        return False
    mid = (wa_message_id or "").strip()
    if mid:
        for existing in rows:
            if str(existing.get("wa_message_id", "")) == mid:
                return False
    ts = (timestamp_utc or "").strip() or datetime.now(timezone.utc).isoformat()
    row: dict = {
        "role": role,
        "text": line,
        "timestamp_utc": ts,
    }
    if mid:
        row["wa_message_id"] = mid
    rows.append(row)
    memory[key] = rows[-500:]
    save_memory(memory)
    return True


def get_thread_messages(phone: str) -> list[dict]:
    memory = load_memory()
    key = _thread_key(phone)
    rows = memory.get(key)
    return rows if isinstance(rows, list) else []


def append_payment_event(event: dict) -> None:
    """Append a Razorpay (or other) payment event for auditing in memory.json."""
    memory = load_memory()
    events = memory.get("payment_events")
    if not isinstance(events, list):
        events = []
    evt = {**event, "recorded_at_utc": datetime.now(timezone.utc).isoformat()}
    events.append(evt)
    memory["payment_events"] = events[-400:]
    save_memory(memory)


def get_payment_events() -> list[dict]:
    memory = load_memory()
    ev = memory.get("payment_events")
    return ev if isinstance(ev, list) else []


def append_conversion_event(event: dict) -> None:
    """Append one conversion analytics row for dashboard/CSV exports."""
    memory = load_memory()
    rows = memory.get("conversion_events")
    if not isinstance(rows, list):
        rows = []
    row = {**event}
    if not row.get("date"):
        row["date"] = datetime.now(timezone.utc).isoformat()
    rows.append(row)
    memory["conversion_events"] = rows[-2000:]
    save_memory(memory)


def get_conversion_events() -> list[dict]:
    memory = load_memory()
    rows = memory.get("conversion_events")
    return rows if isinstance(rows, list) else []


def bump_revenue_total_rupees(amount_rupees: float) -> None:
    memory = load_memory()
    try:
        cur = float(memory.get("revenue_total_rupees") or 0.0)
    except (TypeError, ValueError):
        cur = 0.0
    memory["revenue_total_rupees"] = round(cur + float(amount_rupees), 2)
    save_memory(memory)


def mark_lead_payment_paid(phone: str, info: dict) -> None:
    """Set conversation lead_status to PAID and attach last_payment snapshot."""
    digits = normalize_phone_digits(phone)
    if not digits:
        return
    st = get_conversation_state(digits)
    st["lead_status"] = "PAID"
    st["sales_stage"] = "PAID"
    st["conversation_outcome"] = "WON"
    st["step"] = "complete"
    st["payment_nudge_level"] = 0
    st["payment_pending_since"] = ""
    st["followup_armed_at"] = ""
    st["followup_stopped"] = True
    st["followup_stop_reason"] = "payment_received"
    pid = str(info.get("payment_id") or "").strip()
    if pid:
        st["last_payment_id"] = pid
    st["last_payment"] = info
    set_conversation_state(digits, st)
