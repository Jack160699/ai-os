import re
from typing import Any

# Lightweight NLU only — no GPT here. English + Hinglish.


def _extract_budget(text: str) -> int | None:
    t = (text or "").lower()
    m = re.search(
        r"\b(?:under|below|upto|up to|within|max|tak|se kam)\s*(?:₹|rs\.?|inr)?\s*([0-9]{2,4})\s*k\b",
        t,
    )
    if m:
        return int(m.group(1)) * 1000
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
    if re.search(r"\b(website|web site|web app|landing|portfolio|ecommerce|e-commerce)\b", low):
        return "website"
    if re.search(
        r"\b(app|android|ios|mobile app|mygate|gated|society app|resident app)\b",
        low,
    ):
        return "app"
    if re.search(r"\b(hotel|restaurant|cafe|shop)\b.*\b(site|website|web)\b", low):
        return "website"
    if re.search(r"\b(site|website|web)\b.*\b(hotel|restaurant|shop|store)\b", low):
        return "website"
    if re.search(r"\b(marketing|ads|meta|facebook ads|google ads|seo)\b", low):
        return "marketing"
    if re.search(r"\b(consult|consulting|strategy|advisory)\b", low):
        return "consulting"
    return None


def _frustrated(text: str) -> bool:
    low = (text or "").lower()
    abusive = (
        r"\b(chutiya|chutiye|madarchod|bc\b|b\.c\.|gandu|randi|fuck|shit|idiot|nonsense|bakwas|"
        r"timepass|fraud|scam|chor|bewakoof|bewakuf|pagal|mental|faltu|baklol)\b"
    )
    if re.search(abusive, low, re.I):
        return True
    phrases = (
        "faltu baat",
        "pagal hai",
        "pagal ho",
        "dimag mat khao",
        "time waste",
        "bakwas mat",
        "bakwaas",
        "bewakoofi",
        "sir pe chadhao",
    )
    return any(p in low for p in phrases)


def _unclear_message(message: str) -> bool:
    t = (message or "").strip()
    if not t:
        return True
    if len(t) <= 6 and re.fullmatch(r"[\s?.!]+", t):
        return True
    if re.fullmatch(r"(\?|\.|!|…)+", t):
        return True
    return False


def _time_slot_mentioned(text: str) -> bool:
    low = (text or "").lower().strip()
    if re.search(
        r"\b\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)\b|\b\d{1,2}\s*(?:baje|bje|baj)\b",
        low,
    ):
        return True
    if re.fullmatch(r"\d{1,2}(?::\d{2})?", low):
        return True
    return False


def analyze_intent(message: str, memory: dict[str, Any]) -> dict[str, Any]:
    """Return lightweight signals (no GPT)."""
    low = (message or "").lower()

    wants_call = bool(
        re.search(
            r"\b(call|phone|meeting|baat karni hai|call karo|call karao|karao call|phone karo|"
            r"call pe|call par|baat kar|zoom|meet|phone lagao|phone pe|"
            r"ek baar call|call pe baat|baat kar lete|baat karlete)\b",
            low,
        )
    )

    ready_to_buy = bool(
        re.search(
            r"\b(start karo|kar do|karwa do|proceed|pay now|chalu karo|start now|book now|"
            r"payment|pay kar|order|go ahead|jaldi karo|jaldi kar|bas karo|lock karo|"
            r"close it|do it|just do it|no time|no time to waste|trust you|i trust you|i trust\b|"
            r"we trust|trust hai|bharosa hai|tum kar do|aap kar do|aap dekh lo|tum dekh lo)\b",
            low,
        )
    )
    if not wants_call and re.search(r"\b(start|pay)\b", low):
        ready_to_buy = True
    if wants_call:
        ready_to_buy = False

    wants_human = bool(
        re.search(
            r"\b(human|real person|talk to human|live agent|banda|bande se|insan se|manager se|"
            r"owner se baat|founder se|team se baat|representative)\b",
            low,
        )
    )

    urgency = bool(
        re.search(
            r"\b(urgent|urgently|asap|jaldi|aaj|abhi|immediately|today|turant|fatafat)\b",
            low,
        )
    )

    frustrated = _frustrated(message)
    unclear_message = _unclear_message(message)
    time_slot = _time_slot_mentioned(message)

    re_engagement = bool(
        re.search(
            r"\b(still interested|revert|follow up|any update|kya hua|"
            r"abhi bhi|soch rahe|soch raha|age badhao|aage badhao)\b",
            low,
        )
        or (
            re.search(r"\binterested\b", low)
            and not re.search(r"\bnot\s+interested\b", low)
            and not re.search(r"\bno interest\b", low)
        )
    )

    budget_objection = bool(
        re.search(
            r"\b(too expensive|expensive|costly|zyada|kam kar|discount|nego|negotiate|"
            r"budget nahi|budget tight|kam budget|sasta|cheap|rate kam)\b",
            low,
        )
    )

    budget_affirmed = bool(
        re.search(r"\b(budget fix|fix hai|final budget|itna hi|utna hi|yehi budget)\b", low)
    )

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
        "unclear_message": unclear_message,
        "time_slot": time_slot,
        "re_engagement": re_engagement,
        "budget_objection": budget_objection,
        "budget_affirmed": budget_affirmed,
    }
