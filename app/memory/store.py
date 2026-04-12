import json
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
