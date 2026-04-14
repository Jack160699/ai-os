"""Keyword detection for human handoff, pricing, buy, call."""

from __future__ import annotations

import re

_HUMAN = re.compile(
    r"\b(human|agent|real person|support team|call me back|callback|"
    r"consultant|expert|talk to someone|representative|help desk|live agent)\b",
    re.I,
)
_SUPPORT = re.compile(r"\b(support|talk to (a\s+)?person|real human)\b", re.I)
_STRATEGY_OR_BOOK_CALL = re.compile(
    r"\b(strategy\s+call|book(ing)?\s+a?\s*call|schedule\s+a?\s*call|phone\s+call|voice\s+call)\b",
    re.I,
)
_WANT_CALL = re.compile(r"\b(want|need|prefer|like)\s+(a\s+)?(strategy\s+)?call\b", re.I)
_PRICING = re.compile(
    r"\b(price|pricing|cost|how much|quote|estimate|budget|investment|fee|charges)\b",
    re.I,
)
_BUY = re.compile(
    r"\b(yes,?\s*proceed|proceed|buy|purchase|pay|payment|invoice|"
    r"start now|go ahead|confirm|i'?m in|let'?s do it|book it|checkout)\b",
    re.I,
)


def wants_call_phrase(text: str) -> bool:
    t = text or ""
    return bool(_STRATEGY_OR_BOOK_CALL.search(t) or _WANT_CALL.search(t))


def wants_human(text: str) -> bool:
    t = text or ""
    if wants_call_phrase(t):
        return False
    if _HUMAN.search(t) or _SUPPORT.search(t):
        return True
    if re.search(r"\bcall\b", t, re.I):
        return True
    return False


def wants_pricing(text: str) -> bool:
    return bool(_PRICING.search(text or ""))


def wants_buy(text: str) -> bool:
    return bool(_BUY.search(text or ""))
