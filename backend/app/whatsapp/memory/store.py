import json
import time
import threading
from pathlib import Path
from typing import Any

MEMORY_FILE = Path("memory.json")
_LOCK = threading.RLock()


def normalize_phone(phone: str) -> str:
    p = str(phone or "").replace("+", "").strip()
    return p[-10:]


def _default_memory(user_id: str) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "name": "",
        "role": "unknown",
        "business_type": "",
        "previous_chats": [],
        "budget": None,
        "urgency": False,
        "interests": [],
        "objections": [],
        "preferred_language": "english",
        "lead_score": "cold",
        "human_required": False,
        "human_handoff_history": [],
        "last_conversation_summary": "",
        "next_best_action": "qualify_need",
        "last_intent": "unknown",
        "stage": "new",
        "last_seen": int(time.time()),
        "last_reply": "",
        "reply_cooldown_until": 0,
        "service": "",
    }


def _load_db() -> dict[str, dict[str, Any]]:
    with _LOCK:
        if not MEMORY_FILE.exists():
            return {}
        try:
            with MEMORY_FILE.open("r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, dict) else {}
        except Exception:
            return {}


def _save_db(db: dict[str, dict[str, Any]]) -> None:
    with _LOCK:
        tmp = MEMORY_FILE.with_suffix(".tmp")
        with tmp.open("w", encoding="utf-8") as f:
            json.dump(db, f, indent=2, ensure_ascii=False)
        tmp.replace(MEMORY_FILE)


def get_memory(phone: str) -> dict[str, Any]:
    key = normalize_phone(phone)
    with _LOCK:
        db = _load_db()
        memory = db.get(key)
        if not isinstance(memory, dict):
            memory = _default_memory(key)
            db[key] = memory
            _save_db(db)
        return memory


def save_memory(phone: str, memory: dict[str, Any]) -> None:
    key = normalize_phone(phone)
    with _LOCK:
        db = _load_db()
        memory["last_seen"] = int(time.time())
        db[key] = memory
        _save_db(db)


def update_memory(phone: str, **fields: Any) -> dict[str, Any]:
    with _LOCK:
        memory = get_memory(phone)
        memory.update(fields)
        save_memory(phone, memory)
        return memory
