import json
import os
import re
from typing import Any

from openai import OpenAI

_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _extract_budget(text: str) -> int | None:
    t = (text or "").lower()
    m = re.search(r"(?:₹|rs\.?|inr)?\s*([0-9]{2,7})(?:\s*(k|lakh|lac|l))?", t)
    if not m:
        return None
    n = int(m.group(1))
    mul = (m.group(2) or "").lower()
    if mul == "k":
        n *= 1000
    elif mul in {"l", "lakh", "lac"}:
        n *= 100000
    return n


def analyze_intent(message: str, memory: dict[str, Any]) -> dict[str, Any]:
    fallback = {
        "intent": "general_chat",
        "service": "",
        "budget": _extract_budget(message),
        "urgency": bool(re.search(r"\b(urgent|asap|today|immediately)\b", (message or "").lower())),
        "wants_human": bool(re.search(r"\b(human|agent|real person|talk to human)\b", (message or "").lower())),
        "wants_pricing": bool(re.search(r"\b(price|pricing|cost)\b", (message or "").lower())),
        "wants_proposal": bool(re.search(r"\b(proposal|quote|estimate)\b", (message or "").lower())),
        "wants_call": bool(re.search(r"\b(call|meeting|talk)\b", (message or "").lower())),
        "is_confused": False,
        "is_support": bool(re.search(r"\b(issue|not working|help|support)\b", (message or "").lower())),
        "summary": str(memory.get("last_conversation_summary") or ""),
    }
    prompt = f"""
Classify this WhatsApp message for a business agent.
Return strict JSON only with keys:
intent, service, budget, urgency, wants_human, wants_pricing, wants_proposal, wants_call, is_confused, is_support, summary.

Allowed intent:
website_inquiry, app_inquiry, marketing_inquiry, consulting_inquiry, support_request, general_chat, random_chat, existing_customer, confused_lead

Message: {message}
Memory summary: {memory.get("last_conversation_summary","")}
"""
    try:
        res = _client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.2,
            timeout=12,
            messages=[{"role": "user", "content": prompt}],
        )
        parsed = json.loads((res.choices[0].message.content or "").strip())
        out = {**fallback, **(parsed if isinstance(parsed, dict) else {})}
        if not out.get("budget"):
            out["budget"] = fallback["budget"]
        return out
    except Exception:
        return fallback
