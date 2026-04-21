import time


def is_duplicate_reply(last_reply: str, new_reply: str) -> bool:
    return (last_reply or "").strip().lower() == (new_reply or "").strip().lower()


def should_cooldown(cooldown_until: int) -> bool:
    return int(cooldown_until or 0) > int(time.time())
