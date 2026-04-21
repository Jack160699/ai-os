import os
import re
from typing import Any

from openai import OpenAI

_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

FAILSAFE = "Got your message 👍 Give me a sec, helping you now."


def _limit_lines(text: str, max_lines: int = 4) -> str:
    lines = [ln.strip() for ln in (text or "").splitlines() if ln.strip()]
    if not lines:
        return FAILSAFE
    return "\n".join(lines[:max_lines])


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
        parts.append(f"Context: {memory['summary']}")
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

    prompt = f"""You are a high-converting WhatsApp sales agent for Stratxcel.

Your job:
Close deals, guide users naturally, sound human, and keep chat efficient.

CONTEXT:

User message:
{message}

Memory summary:
{memory_summary}

Current mode:
{mode}

Stage:
{stage}

Detected signals:
{signals_str}

RULES:

1. Reply in 2 to 4 short WhatsApp lines max
2. Natural human tone
3. Never robotic
4. Never repeat same thing
5. Always move conversation forward
6. Use same language as user (English/Hindi/Hinglish)
7. Be concise and smart

MODE RULES:

If mode=call:
Focus only on scheduling or confirming call.
Do not ask features/questions.

If mode=close:
Assume buyer is ready.
Move to payment/starting next step.

If mode=handoff:
Tell user human teammate will join shortly.
Keep short.

If mode=normal:
Guide toward decision naturally.

EMOTIONAL RULES:

If frustrated:
Stay calm.
Simplify.
Do not argue.

If trust signal:
Acknowledge briefly.

STRICTLY AVOID:

- Free resources nonsense
- Random topic changes
- Asking same question repeatedly
- Long paragraphs
- Generic AI assistant tone

GOAL:
Act like a real closer on WhatsApp.

Reply now:
"""

    try:
        res = _client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.55,
            timeout=12,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = _strip_fences((res.choices[0].message.content or "").strip())
        if not raw:
            return FAILSAFE
        return _limit_lines(raw, max_lines=4)
    except Exception:
        return FAILSAFE
