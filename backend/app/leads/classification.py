"""Heuristic classification for lead capture (business type, pain, urgency, budget)."""

from __future__ import annotations

import re
from typing import Optional

BUSINESS_OPTIONS = {
    "1": "Agency",
    "2": "Local Business",
    "3": "Online Business",
    "4": "Other",
}

# Interactive list / button reply ids (Cloud API) → canonical business_type labels
BUSINESS_INTERACTIVE_IDS: dict[str, str] = {
    "agency": "Agency",
    "local": "Local Business",
    "online": "Online Business",
    "other": "Other",
}

CHALLENGE_OPTIONS = {
    "1": "Getting Leads",
    "2": "Slow Follow-ups",
    "3": "Too Much Manual Work",
    "4": "Scaling Operations",
}

_URGENCY_WORDS = (
    "urgent",
    "urgently",
    "asap",
    "a.s.a.p",
    "now",
    "immediately",
    "immediate",
    "today",
    "tonight",
    "fast",
    "quickly",
    "quick",
    "hurry",
    "emergency",
    "critical",
    "soonest",
)

_BUDGET_PATTERNS = (
    re.compile(r"\$\s?\d[\d,]*(?:\.\d+)?(?:k|m|b)?", re.I),
    re.compile(r"£\s?\d[\d,]*(?:\.\d+)?(?:k|m|b)?", re.I),
    re.compile(r"€\s?\d[\d,]*(?:\.\d+)?(?:k|m|b)?", re.I),
    re.compile(r"\b\d[\d,]*(?:\.\d+)?\s?(?:usd|inr|gbp|eur|dollars?|rupees?)\b", re.I),
    re.compile(r"\b(?:inr|rs\.?|₹)\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:lac|lakh|lakhs|crore|cr))?s?\b", re.I),
    re.compile(r"\b\d[\d,]*(?:\.\d+)?\s?(?:k|lac|lakh|lakhs|crore|cr)\b", re.I),
    re.compile(r"\bbudget\s*(?:of|:)?\s*\$?\d", re.I),
)


def _norm(text: str) -> str:
    return (text or "").strip().lower()


def _menu_digit(text: str) -> Optional[str]:
    """Match only explicit 1–4 menu picks (not '2pm', '3 leads', etc.)."""
    t = (text or "").strip()
    emoji_map = {"1️⃣": "1", "2️⃣": "2", "3️⃣": "3", "4️⃣": "4"}
    key = t.lower()
    if t in emoji_map:
        return emoji_map[t]
    if key in emoji_map:
        return emoji_map[key]
    if len(key) == 1 and key in "1234":
        return key
    return None


def map_business_interactive_id(raw: str) -> Optional[str]:
    """Map list_reply.id / button_reply.id to the same labels as classify_business_type."""
    if not raw:
        return None
    return BUSINESS_INTERACTIVE_IDS.get(raw.strip().lower())


def classify_business_type(text: str) -> Optional[str]:
    """Map free text or 1–4 to a business bucket."""
    d = _menu_digit(text)
    if d and d in BUSINESS_OPTIONS:
        return BUSINESS_OPTIONS[d]
    t = _norm(text)
    if not t:
        return None

    if any(w in t for w in ("agency", "agencies", "marketing agency", "digital agency", "creative agency")):
        return "Agency"
    if any(
        w in t
        for w in (
            "local",
            "shop",
            "store",
            "restaurant",
            "retail",
            "brick",
            "clinic",
            "salon",
            "gym",
            "cafe",
            "coffee",
            "franchise",
        )
    ):
        return "Local Business"
    if any(
        w in t
        for w in (
            "online",
            "ecommerce",
            "e-commerce",
            "e commerce",
            "saas",
            "software",
            "web",
            "website",
            "dropship",
            "amazon",
            "shopify",
        )
    ):
        return "Online Business"
    if len(t) >= 3:
        return "Other"
    return None


def classify_challenge(text: str) -> Optional[str]:
    """Map free text or 1–4 to a challenge bucket."""
    d = _menu_digit(text)
    if d and d in CHALLENGE_OPTIONS:
        return CHALLENGE_OPTIONS[d]
    t = _norm(text)
    if not t:
        return None

    if any(w in t for w in ("lead", "leads", "pipeline", "prospect", "customer acquisition", "acquisition")):
        return "Getting Leads"
    if any(w in t for w in ("follow", "follow-up", "followup", "slow response", "slow reply", "response time")):
        return "Slow Follow-ups"
    if any(w in t for w in ("manual", "repetitive", "tedious", "spreadsheet", "too much work", "automat")):
        return "Too Much Manual Work"
    if any(w in t for w in ("scale", "scaling", "operations", "growth", "capacity", "team size")):
        return "Scaling Operations"
    if len(t) >= 8:
        return None
    return None


def classify_no_menu_choice(text: str) -> Optional[str]:
    """Map free text to pricing / recommendation / later."""
    t = _norm(text)
    if t in {"1", "2", "3"}:
        return t
    if "price" in t or "pricing" in t or "cost" in t or "quote" in t:
        return "1"
    if "recommend" in t or "advice" in t or "suggest" in t:
        return "2"
    if "later" in t or "not now" in t or "maybe" in t or "busy" in t:
        return "3"
    return None


def detect_urgency(text: str) -> str:
    """High / Medium / Low from conversation text."""
    t = _norm(text)
    if any(w in t for w in _URGENCY_WORDS):
        return "High"
    if any(w in t for w in ("this week", "week", "soon", "priority", "important")):
        return "Medium"
    return "Low"


def extract_budget(text: str) -> str:
    """Return a short budget snippet or 'Not stated'."""
    raw = (text or "").strip()
    if not raw:
        return "Not stated"
    for pat in _BUDGET_PATTERNS:
        m = pat.search(raw)
        if m:
            return m.group(0).strip()
    return "Not stated"


def intent_score_label(
    *,
    wants_call: bool,
    budget_stated: bool,
    urgency: str,
    intent_code: str,
) -> str:
    """
    Hot / Warm / Cold heuristic.

    HOT: budget + wants call + High urgency
    WARM: wants call but no budget (or engaged but not hot)
    COLD: general / defer / no strong signal
    """
    high = urgency == "High"
    if budget_stated and wants_call and high:
        return "Hot"
    if wants_call and not budget_stated:
        return "Warm"
    if intent_code in {"no_later", "no_pricing"} and not wants_call:
        return "Cold"
    if not wants_call and not budget_stated and not high:
        return "Cold"
    return "Warm"


def action_recommendation(intent_score: str, urgency: str, wants_call: bool) -> str:
    if intent_score == "Hot" or (wants_call and urgency == "High"):
        return "Call now"
    if intent_score == "Warm" or wants_call:
        return "Follow up today"
    return "Nurture later"
