import re
import time

from app.whatsapp.admin.commands import maybe_handle_admin_command
from app.whatsapp.brain.nlu import analyze_intent
from app.whatsapp.brain.reply import generate_reply
from app.whatsapp.memory.store import get_memory, save_memory
from app.whatsapp.roles.router import detect_role
from app.whatsapp.sales.pipeline import classify_lead_score, next_best_action
from app.whatsapp.utils.lang import detect_language
from app.whatsapp.utils.safety import is_duplicate_reply, should_cooldown

HUMAN_RESET_WORDS = {"hi", "hello", "start", "restart", "menu", "bot"}


def _notify_admin_hot(phone: str, memory: dict) -> None:
    if memory.get("lead_score") in {"hot", "warm"}:
        print(
            f"[hot-lead] phone={phone} score={memory.get('lead_score')} "
            f"service={memory.get('service')} budget={memory.get('budget')} urgency={memory.get('urgency')}"
        )


def _reset_from_human(memory: dict) -> None:
    memory["human_required"] = False
    memory["stage"] = "new"
    memory["next_best_action"] = "qualify_need"


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

    if re.search(r"\b(human|agent|real person|talk to human)\b", low):
        memory["human_required"] = True
        memory["stage"] = "human_required"
        memory["human_handoff_history"] = list(memory.get("human_handoff_history") or []) + [
            {"at": now, "message": msg}
        ]
        memory["last_seen"] = now
        save_memory(phone, memory)
        return "Connecting you to a strategist now. You'll get a reply shortly."

    if should_cooldown(int(memory.get("reply_cooldown_until") or 0)):
        return None

    intent_data = analyze_intent(msg, memory)
    recent = list(memory.get("previous_chats") or [])[-8:]
    budget_mentions = sum(
        1 for c in recent if re.search(r"(?:₹|rs\.?|inr|\b\d+\s*k\b|\b\d{4,7}\b)", str(c.get("in", "")).lower())
    ) + (1 if intent_data.get("budget") else 0)
    service_now = str(intent_data.get("service") or memory.get("service") or "").strip().lower()
    service_mentions = sum(
        1
        for c in recent
        if service_now
        and service_now in str(c.get("in", "")).lower()
    ) + (1 if service_now else 0)
    if budget_mentions > 1 or service_mentions > 1:
        intent_data["force_close"] = True
    if bool(intent_data.get("ready_to_buy")) or bool(intent_data.get("trust_signal")) or bool(intent_data.get("no_time_signal")):
        intent_data["force_close"] = True
    if bool(intent_data.get("no_time_signal")):
        intent_data["urgency"] = True
    if bool(intent_data.get("wants_call")):
        intent_data["ready_to_buy"] = True

    role = detect_role(phone, msg, memory)
    memory["role"] = role
    memory["preferred_language"] = detect_language(msg)
    memory["last_intent"] = str(intent_data.get("intent") or "general_chat")
    memory["service"] = str(intent_data.get("service") or memory.get("service") or "")
    if intent_data.get("budget"):
        memory["budget"] = intent_data.get("budget")
    memory["urgency"] = bool(intent_data.get("urgency") or memory.get("urgency"))
    memory["lead_score"] = classify_lead_score(memory, memory["last_intent"])
    memory["next_best_action"] = next_best_action(memory["last_intent"], memory["lead_score"])
    memory["stage"] = memory["next_best_action"]

    reply = generate_reply(msg, memory, role, intent_data)
    if is_duplicate_reply(str(memory.get("last_reply") or ""), reply):
        if (
            str(memory.get("last_intent") or "") == str(intent_data.get("intent") or "")
            and now - int(memory.get("last_seen") or 0) <= 60
        ):
            memory["reply_cooldown_until"] = now + 30
            memory["last_seen"] = now
            save_memory(phone, memory)
            return None

    memory["last_reply"] = reply
    memory["last_conversation_summary"] = str(
        intent_data.get("summary") or memory.get("last_conversation_summary") or ""
    )
    memory["last_seen"] = now
    chats = list(memory.get("previous_chats") or [])
    chats.append({"at": now, "in": msg, "out": reply, "intent": memory["last_intent"]})
    memory["previous_chats"] = chats[-30:]
    _notify_admin_hot(phone, memory)
    save_memory(phone, memory)
    return reply
