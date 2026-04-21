import re
from typing import Any

# Lightweight NLU only — no GPT here. Same signals for English + Hinglish.


def _extract_budget(text: str) -> int | None:
    t = (text or "").lower()
    m = re.search(r"(?:₹|rs\.?|inr)?\s*([0-9]{2,7})(?:\s*(k|lakh|lac|l))?", t)
    if not m:
        m2 = re.search(r"\b(\d{2,3})k\s*(?:me|tak|mai|mein)?\b", t)
        if m2:
            return int(m2.group(1)) * 1000
        return None
    n = int(m.group(1))
    mul = (m.group(2) or "").lower()
    if mul == "k":
        n *= 1000
    elif mul in {"l", "lakh", "lac"}:
        n *= 100000
    return n


def _extract_service(text: str) -> str | None:
    low = (text or "").lower()
    if re.search(r"\b(website|web site|site)\b", low):
        return "website"
    if re.search(r"\b(app|android|ios|mobile app)\b", low):
        return "app"
    if re.search(r"\b(marketing|ads|meta|facebook ads|google ads|seo)\b", low):
        return "marketing"
    if re.search(r"\b(consult|consulting|strategy|advisory)\b", low):
        return "consulting"
    return None


def _frustrated(text: str) -> bool:
    low = (text or "").lower()
    abusive = (
        r"\b(chutiya|chutiye|madarchod|bc\b|b\.c\.|gandu|randi|fuck|shit|idiot|nonsense|bakwas|"
        r"timepass|fraud|scam|chor)\b"
    )
    return bool(re.search(abusive, low, re.I))


def analyze_intent(message: str, memory: dict[str, Any]) -> dict[str, Any]:
    """Return only lightweight signals (no GPT)."""
    low = (message or "").lower()

    wants_call = bool(
        re.search(
            r"\b(call|phone|meeting|baat karni hai|call karo|phone karo|call pe|"
            r"baat kar|zoom|meet)\b",
            low,
        )
    )

    ready_to_buy = bool(
        re.search(
            r"\b(start karo|kar do|proceed|pay now|chalu karo|start now|book now|"
            r"payment|pay kar|order|go ahead)\b",
            low,
        )
    )
    if not wants_call and re.search(r"\b(start|pay)\b", low):
        ready_to_buy = True
    if wants_call:
        ready_to_buy = False

    wants_human = bool(
        re.search(
            r"\b(human|real person|agent|talk to human|banda|owner se baat|"
            r"insan se|manager se)\b",
            low,
        )
    )

    urgency = bool(
        re.search(r"\b(urgent|urgently|asap|jaldi|aaj|abhi|immediately|today)\b", low)
    )

    frustrated = _frustrated(message)

    budget = _extract_budget(message)
    service = _extract_service(message)

    return {
        "wants_call": wants_call,
        "ready_to_buy": ready_to_buy,
        "wants_human": wants_human,
        "budget": budget,
        "urgency": urgency,
        "frustrated": frustrated,
        "service": service,
    }
