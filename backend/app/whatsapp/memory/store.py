import json
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

MEMORY_FILE = Path("memory.json")
_LOCK = threading.RLock()


def normalize_phone(phone: str) -> str:
    p = str(phone or "").replace("+", "").strip()
    return p[-10:]


def _default_state() -> dict[str, str]:
    return {"mode": "normal", "stage": "explore"}


def _default_memory(user_id: str) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "name": "",
        "service": "",
        "budget": None,
        "urgency": False,
        "last_intent": "",
        "summary": "",
        "state": _default_state(),
        "last_reply": "",
        "last_mode_for_dup": "",
        "last_reply_at": 0,
        "updated_at": "",
        "human_required": False,
        "last_seen": int(time.time()),
        "reply_cooldown_until": 0,
        "preferred_language": "english",
    }


def _migrate_record(raw: dict[str, Any], user_id: str) -> dict[str, Any]:
    """Merge legacy memory.json rows into the new schema."""
    base = _default_memory(user_id)
    st = raw.get("state")
    if isinstance(st, dict) and "mode" in st and "stage" in st:
        base["state"] = {
            "mode": str(st.get("mode") or "normal"),
            "stage": str(st.get("stage") or "explore"),
        }
    else:
        base["state"] = _default_state()
    base["name"] = str(raw.get("name") or "")
    svc = raw.get("service")
    base["service"] = str(svc) if svc is not None else ""
    b = raw.get("budget")
    if b is not None and b != "":
        try:
            base["budget"] = int(b) if not isinstance(b, str) else (int(b) if str(b).isdigit() else None)
        except (TypeError, ValueError):
            base["budget"] = None
    base["urgency"] = bool(raw.get("urgency"))
    base["last_intent"] = str(raw.get("last_intent") or "")
    base["summary"] = str(raw.get("summary") or raw.get("last_conversation_summary") or "")
    base["last_reply"] = str(raw.get("last_reply") or "")
    base["last_mode_for_dup"] = str(raw.get("last_mode_for_dup") or "")
    base["last_reply_at"] = int(raw.get("last_reply_at") or 0)
    base["human_required"] = bool(raw.get("human_required"))
    base["last_seen"] = int(raw.get("last_seen") or int(time.time()))
    base["reply_cooldown_until"] = int(raw.get("reply_cooldown_until") or 0)
    base["preferred_language"] = str(raw.get("preferred_language") or "english")
    return base


def _load_db() -> dict[str, dict[str, Any]]:
    if not MEMORY_FILE.exists():
        return {}
    try:
        with MEMORY_FILE.open("r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _save_db(db: dict[str, dict[str, Any]]) -> None:
    tmp = MEMORY_FILE.with_suffix(".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(db, f, indent=2, ensure_ascii=False)
    tmp.replace(MEMORY_FILE)


def get_memory(phone: str) -> dict[str, Any]:
    key = normalize_phone(phone)
    with _LOCK:
        db = _load_db()
        raw = db.get(key)
        if not isinstance(raw, dict):
            memory = _default_memory(key)
            db[key] = memory
            _save_db(db)
            return memory
        memory = _migrate_record(raw, key)
        if memory != raw:
            db[key] = memory
            _save_db(db)
        return memory


def save_memory(phone: str, memory: dict[str, Any]) -> None:
    key = normalize_phone(phone)
    with _LOCK:
        db = _load_db()
        memory["last_seen"] = int(time.time())
        memory["updated_at"] = datetime.now(timezone.utc).isoformat()
        db[key] = memory
        _save_db(db)


def update_memory(phone: str, **fields: Any) -> dict[str, Any]:
    with _LOCK:
        memory = get_memory(phone)
        memory.update(fields)
        save_memory(phone, memory)
        return memory
