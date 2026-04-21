import os
import re
from typing import Any

from openai import OpenAI

_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

FAILSAFE = "Got your message 👍 Give me a sec, helping you now."

_SYSTEM = (
    "You are the WhatsApp text for Stratxcel only. Output plain reply lines only: no markdown, "
    "no bullet stars, no em dash essays. Never invent discounts, legal terms, or prices not implied "
    "by the user. Never claim humans already joined unless mode is handoff. If context is thin, "
    "ask one sharp question instead of guessing."
)


def _limit_lines(text: str, max_lines: int = 4) -> str:
    lines = [ln.strip() for ln in (text or "").splitlines() if ln.strip()]
    if not lines:
        return FAILSAFE
    capped: list[str] = []
    for ln in lines[:max_lines]:
        s = ln.strip()
        if len(s) > 220:
            s = s[:217].rstrip() + "…"
        capped.append(s)
    return "\n".join(capped)


def _strip_fences(text: str) -> str:
    t = (text or "").strip()
    t = re.sub(r"^```[a-zA-Z]*\s*", "", t)
    t = re.sub(r"\s*```$", "", t)
    return t.strip()


def _memory_summary(memory: dict[str, Any]) -> str:
    parts: list[str] = []
    if memory.get("name"):
        parts.append(f"Name: {memory['name']}")
    if memory.get("service"):
        parts.append(f"Service: {memory['service']}")
    b = memory.get("budget")
    if b is not None and b != "":
        parts.append(f"Budget: {b}")
    if memory.get("urgency"):
        parts.append("Urgency: yes")
    if memory.get("summary"):
        parts.append(f"Earlier chat: {memory['summary']}")
    return "\n".join(parts) if parts else "None yet."


def _state(memory: dict[str, Any]) -> dict[str, str]:
    st = memory.get("state")
    if isinstance(st, dict):
        mode = str(st.get("mode") or "normal")
        stage = str(st.get("stage") or "explore")
        return {"mode": mode, "stage": stage}
    return {"mode": "normal", "stage": "explore"}


def generate_reply(message: str, memory: dict[str, Any], signals: dict[str, Any]) -> str:
    st = _state(memory)
    mode = st["mode"]
    stage = st["stage"]
    memory_summary = _memory_summary(memory)
    signals_str = str(signals)
    last_reply = str(memory.get("last_reply") or "").strip()
    last_user = str(memory.get("last_inbound_norm") or "").strip()
    lang = str(memory.get("preferred_language") or "english")

    continuity = ""
    if last_reply or last_user:
        continuity = (
            f"\nPrevious user line (do not repeat their words back): {last_user or '[none]'}\n"
            f"Your last reply (do NOT copy phrasing; advance the chat): {last_reply or '[none]'}\n"
        )

    extra = ""
    if signals.get("budget_objection"):
        extra += "\nUser is pushing on price or budget: handle smartly, one empathetic line + one concrete path.\n"
    if signals.get("budget_affirmed"):
        extra += "\nUser confirmed budget is fixed: acknowledge and move to next step.\n"
    if signals.get("re_engagement"):
        extra += "\nUser is re-engaging or checking interest: acknowledge memory naturally, no amnesia.\n"
    if signals.get("unclear_message"):
        extra += "\nMessage is unclear or only punctuation: ask one friendly clarifying question.\n"
    if signals.get("time_slot") and mode == "call":
        extra += "\nUser gave or hinted a call time: confirm that time briefly, no sales pitch.\n"

    prompt = f"""You are a high-converting WhatsApp sales agent for Stratxcel.

Your job:
Close deals, guide users naturally, sound human, and keep chat efficient.

CONTEXT:

User message:
{message}

Memory summary:
{memory_summary}

Preferred language tag: {lang} (still mirror user's actual mix of English/Hindi/Hinglish in their message)

Current mode:
{mode}

Stage:
{stage}

Detected signals:
{signals_str}
{continuity}{extra}
RULES:

1. Reply in 2 to 4 short WhatsApp lines max
2. Natural human tone — sharp, premium, trustworthy; never corporate brochure voice
3. Never robotic or generic-chatbot ("happy to help", "let me assist", "as an AI")
4. Never repeat the same question you already implied in your last reply
5. Always move conversation forward one step
6. Match the user's language mix (English / Hindi / Hinglish) closely
7. Be concise; no paragraphs, no numbered essays

MODE RULES:

If mode=call:
Focus only on scheduling or confirming call.
Do not pitch features or discovery questions.

If mode=close:
Assume buyer is ready.
Move to payment or clear onboarding next step (e.g. payment link, UPI, invoice, kickoff) without stalling.

If mode=handoff:
Say a human teammate will join shortly. Very short. No sales pitch.

If mode=normal:
Guide toward a clear decision; one sharp question max if needed.

EMOTIONAL RULES:

If frustrated signal is true:
Stay calm, simplify, no arguing or moralizing.

If trust / "do it" style urgency in the message:
Acknowledge briefly and move to close.

STRICTLY AVOID:

- Free resources / random pivots
- Repeating yourself from your last reply
- Long blocks of text
- Inventing Stratxcel policies or guarantees

GOAL:
Sound like a real human closer on WhatsApp, not a chatbot.

Reply now:
"""

    try:
        res = _client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.52,
            timeout=12,
            messages=[
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": prompt},
            ],
        )
        raw = _strip_fences((res.choices[0].message.content or "").strip())
        if not raw:
            return FAILSAFE
        return _limit_lines(raw, max_lines=4)
    except Exception:
        return FAILSAFE
