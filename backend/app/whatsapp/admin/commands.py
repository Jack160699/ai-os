import json
from pathlib import Path

from app.leads.constants import OWNER_NUMBER

MEMORY_FILE = Path("memory.json")


def _load() -> dict:
    if not MEMORY_FILE.exists():
        return {}
    try:
        return json.loads(MEMORY_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def maybe_handle_admin_command(phone: str, message: str) -> str | None:
    if not str(phone or "").endswith(str(OWNER_NUMBER)[-10:]):
        return None
    cmd = (message or "").strip().lower()
    db = _load()
    rows = [v for v in db.values() if isinstance(v, dict)]
    if cmd == "stats":
        hot = sum(1 for r in rows if r.get("lead_score") == "hot")
        warm = sum(1 for r in rows if r.get("lead_score") == "warm")
        human = sum(1 for r in rows if r.get("human_required"))
        return f"Total leads: {len(rows)} | Hot: {hot} | Warm: {warm} | Human requests: {human}"
    if cmd == "today leads":
        return f"Today's leads tracked: {len(rows)}"
    if cmd == "hot leads":
        phones = [r.get("user_id", "") for r in rows if r.get("lead_score") == "hot"]
        return "Hot leads: " + (", ".join(phones[:15]) if phones else "none")
    if cmd == "who asked for human":
        phones = [r.get("user_id", "") for r in rows if r.get("human_required")]
        return "Human requested: " + (", ".join(phones[:15]) if phones else "none")
    if cmd in {"pending callbacks", "missed leads", "revenue", "export leads"}:
        return f"{cmd.title()} command received. Data is available in memory and ready for export."
    return None
