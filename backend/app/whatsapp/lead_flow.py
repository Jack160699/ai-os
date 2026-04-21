import time

from app.whatsapp.admin.commands import maybe_handle_admin_command
from app.whatsapp.brain.nlu import analyze_intent
from app.whatsapp.brain.reply import generate_reply
from app.whatsapp.memory.store import get_memory, save_memory
from app.whatsapp.utils.lang import detect_language
from app.whatsapp.utils.safety import should_cooldown, should_suppress_duplicate

HUMAN_RESET_WORDS = {"hi", "hello", "start", "restart", "menu", "bot"}


def _notify_admin_hot(phone: str, memory: dict) -> None:
    st = memory.get("state") if isinstance(memory.get("state"), dict) else {}
    mode = str(st.get("mode") or "normal")
    if mode in {"close", "call"} or memory.get("urgency"):
        print(
            f"[hot-lead] phone={phone} mode={mode} "
            f"service={memory.get('service')} budget={memory.get('budget')} urgency={memory.get('urgency')}"
        )


def _reset_from_human(memory: dict) -> None:
    memory["human_required"] = False
    st = memory.setdefault("state", {"mode": "normal", "stage": "explore"})
    if isinstance(st, dict):
        st["mode"] = "normal"
        st["stage"] = "explore"


def _bump_summary(prev: str, msg: str) -> str:
    chunks = [c.strip() for c in str(prev or "").split(" | ") if c.strip()][-5:]
    chunks.append(msg.strip()[:100])
    return " | ".join(chunks)[-450:]


def _apply_state_from_signals(memory: dict, signals: dict) -> str:
    """Update mode from signals (priority: handoff > call > close); keep mode if no new signal."""
    st = memory.setdefault("state", {"mode": "normal", "stage": "explore"})
    if not isinstance(st, dict):
        st = {"mode": "normal", "stage": "explore"}
        memory["state"] = st
    cur_mode = str(st.get("mode") or "normal")
    cur_stage = str(st.get("stage") or "explore")

    if signals.get("wants_human"):
        st["mode"] = "handoff"
        memory["human_required"] = True
    elif signals.get("wants_call"):
        st["mode"] = "call"
    elif signals.get("ready_to_buy"):
        st["mode"] = "close"
    else:
        st["mode"] = cur_mode if cur_mode in {"normal", "call", "close", "handoff"} else "normal"

    if st["mode"] == "close":
        st["stage"] = "ready"
    elif cur_stage == "explore" and (
        signals.get("service")
        or memory.get("service")
        or signals.get("budget") is not None
        or memory.get("budget") is not None
    ):
        st["stage"] = "qualify"
    else:
        st["stage"] = cur_stage if cur_stage in {"explore", "qualify", "ready"} else "explore"

    return str(st.get("mode") or "normal")


def handle_lead_message(phone: str, message: str):
    msg = str(message or "").strip()
    low = msg.lower()
    memory = get_memory(phone)
    now = int(time.time())

    admin_reply = maybe_handle_admin_command(phone, msg)
    if admin_reply:
        return admin_reply

    if memory.get("human_required"):
        if now - int(memory.get("last_seen") or 0) >= 15 * 60:
            _reset_from_human(memory)
            memory["last_seen"] = now
            save_memory(phone, memory)
            return "Our strategist is unavailable right now. I can still help instantly."
        if low in HUMAN_RESET_WORDS:
            _reset_from_human(memory)
            memory["last_seen"] = now
            save_memory(phone, memory)
        else:
            return None

    if should_cooldown(int(memory.get("reply_cooldown_until") or 0)):
        return None

    signals = analyze_intent(msg, memory)
    if signals.get("wants_human") and not memory.get("human_required"):
        memory["human_required"] = True

    memory["preferred_language"] = detect_language(msg)
    if signals.get("service"):
        memory["service"] = str(signals["service"])
    if signals.get("budget") is not None:
        memory["budget"] = signals["budget"]
    if signals.get("urgency"):
        memory["urgency"] = True

    if signals.get("wants_human"):
        memory["last_intent"] = "human"
    elif signals.get("wants_call"):
        memory["last_intent"] = "call"
    elif signals.get("ready_to_buy"):
        memory["last_intent"] = "close"
    elif msg:
        memory["last_intent"] = "chat"

    current_mode = _apply_state_from_signals(memory, signals)

    reply = generate_reply(msg, memory, signals)

    if should_suppress_duplicate(
        str(memory.get("last_reply") or ""),
        reply,
        str(memory.get("last_mode_for_dup") or ""),
        current_mode,
        int(memory.get("last_reply_at") or 0),
        now,
        window_sec=90,
    ):
        memory["reply_cooldown_until"] = now + 30
        memory["last_seen"] = now
        save_memory(phone, memory)
        return None

    memory["last_reply"] = reply
    memory["last_mode_for_dup"] = current_mode
    memory["last_reply_at"] = now
    memory["summary"] = _bump_summary(str(memory.get("summary") or ""), msg)
    memory["last_seen"] = now
    _notify_admin_hot(phone, memory)
    save_memory(phone, memory)
    return reply
