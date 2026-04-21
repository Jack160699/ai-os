import json
import os
import re
from typing import Any

from openai import OpenAI

_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _limit_lines(text: str, max_lines: int = 4) -> str:
    lines = [ln.strip() for ln in (text or "").splitlines() if ln.strip()]
    if not lines:
        return "Got it 👍\nTell me what outcome you want and I will handle it."
    return "\n".join(lines[:max_lines])


def _clean_generic_questions(text: str) -> str:
    t = text or ""
    bad = [
        "can you share more details?",
        "what features do you want?",
    ]
    for b in bad:
        t = re.sub(re.escape(b), "", t, flags=re.I)
    t = re.sub(r"\n{3,}", "\n\n", t).strip()
    return t


def _buying_signal(text: str) -> bool:
    low = (text or "").lower()
    return any(
        k in low
        for k in (
            "just do it",
            "i trust you",
            "no time",
            "kar do",
            "start karo",
            "chalu karo",
            "proceed karo",
            "karna hai",
            "trust hai",
            "tum dekh lo",
            "aap sambhalo",
            "time nahi hai",
            "discuss nahi karna",
            "jaldi hai",
        )
    )


def generate_reply(message: str, memory: dict[str, Any], role: str, intent_data: dict[str, Any]) -> str:
    low = (message or "").lower()
    lang = str(memory.get("preferred_language") or "english")
    if _buying_signal(message) or bool(intent_data.get("force_close")):
        if "i trust you" in low or "trust hai" in low or "tum dekh lo" in low or "aap sambhalo" in low:
            if lang == "hinglish":
                return "Appreciate that 👍 hum proper handle karenge.\nGot it 👍\nBudget ke andar sab manage kar denge.\n\nNext step:\nAbhi start karein ya quick call?"
            return "Appreciate that 👍 we'll take care of it properly.\nGot it 👍\nWe’ll handle everything within your budget.\n\nNext step:\nStart now or quick call?"
        if lang == "hinglish":
            return "Got it 👍\nBudget ke andar sab handle kar denge.\n\nNext step:\nAbhi start karein ya quick call?"
        return "Got it 👍\nWe’ll handle everything within your budget.\n\nNext step:\nStart now or quick call?"

    tone = "guiding"
    if bool(intent_data.get("urgency")):
        tone = "fast_decisive"
    elif any(k in low for k in ("ready", "proceed", "book", "pay now", "done", "yes")):
        tone = "confident_direct"
    elif bool(intent_data.get("is_confused")):
        tone = "guiding"

    prompt = f"""
You are StratXcel AI business agent.
Role mode: {role}
Detected intent: {intent_data.get("intent")}
Service: {intent_data.get("service")}
Budget: {intent_data.get("budget")}
Urgency: {intent_data.get("urgency")}
Lead score: {memory.get("lead_score")}
Language: {memory.get("preferred_language")}
Last summary: {memory.get("last_conversation_summary")}
Next action: {memory.get("next_best_action")}
Tone: {tone}
Force close: {intent_data.get("force_close")}

User message: {message}

Rules:
- WhatsApp style only, max 2-4 short lines
- Sound like a professional human sales closer, not a bot
- Ask at most one question, only if absolutely required
- If user is ready/urgent, move directly to closing step
- Show emotional intelligence; acknowledge trust explicitly
- Match user language (English/Hindi/Hinglish)
Return JSON only: {{"reply":"...","summary":"...","objection":"...","interest":"..."}}
"""
    try:
        res = _client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.6,
            timeout=12,
            messages=[{"role": "user", "content": prompt}],
        )
        payload = json.loads((res.choices[0].message.content or "").strip())
        raw = str(payload.get("reply") or "Got it 👍\nTell me what outcome you want and I will handle it.")
        return _limit_lines(_clean_generic_questions(raw), max_lines=4)
    except Exception:
        if bool(intent_data.get("urgency")):
            return "Got it 👍\nUnderstood this is urgent.\nWe can move fast from here.\nStart now or quick call?"
        return "Got it 👍\nI can help right away.\nStart now or quick call?"
