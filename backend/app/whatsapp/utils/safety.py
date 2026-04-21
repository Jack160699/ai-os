import time


def is_duplicate_reply(last_reply: str, new_reply: str) -> bool:
    return (last_reply or "").strip().lower() == (new_reply or "").strip().lower()


def should_suppress_duplicate(
    last_reply: str,
    new_reply: str,
    last_mode: str,
    current_mode: str,
    last_reply_at: int,
    now: int,
    last_inbound_norm: str,
    current_inbound_norm: str,
    window_sec: int = 12,
) -> bool:
    """
    Anti double-post only: identical model text + same mode + same user text
    within a short window (e.g. webhook retry). Does not block repeated 'Hi'
    across a real conversation gap.
    """
    if (last_reply or "").strip().lower() != (new_reply or "").strip().lower():
        return False
    if (last_mode or "").strip().lower() != (current_mode or "").strip().lower():
        return False
    if (last_inbound_norm or "").strip().lower() != (current_inbound_norm or "").strip().lower():
        return False
    return (now - int(last_reply_at or 0)) <= int(window_sec)


def should_cooldown(cooldown_until: int) -> bool:
    return int(cooldown_until or 0) > int(time.time())
