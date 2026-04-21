from openai import OpenAI
import json
import re

from app.ai.prompts import build_system_prompt
from app.config import Settings


def get_ai_reply(
    settings: Settings,
    user_message: str,
    wa_user_id: str | None = None,
    mode: str = "client",
) -> str:
    client = OpenAI(api_key=settings.openai_api_key)
    response = client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": build_system_prompt(mode, wa_user_id)},
            {"role": "user", "content": user_message},
        ],
    )
    return response.choices[0].message.content or ""


def generate_lead_recommendation(
    settings: Settings,
    business_type: str,
    challenge: str,
) -> str:
    """Create a short, business-focused recommendation for lead capture."""
    client = OpenAI(api_key=settings.openai_api_key)
    response = client.chat.completions.create(
        model=settings.openai_model,
        temperature=0.5,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are Stratxcel's senior growth systems advisor.\n"
                    "Write one concise recommendation (2-3 short sentences) tailored to the user's"
                    " business type and main challenge.\n"
                    "Tone: premium, practical, confident, business-focused.\n"
                    "No fluff, no emojis, no markdown bullets."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Business type: {business_type}\n"
                    f"Biggest challenge: {challenge}\n"
                    "Provide a clear first-step strategy using AI lead capture/workflow automation."
                ),
            },
        ],
    )
    return (response.choices[0].message.content or "").strip()


def generate_lead_one_line_summary(
    settings: Settings,
    business_type: str,
    pain_point: str,
    transcript_excerpt: str,
) -> str:
    """One-line executive summary for owner alerts."""
    excerpt = (transcript_excerpt or "").strip()
    if len(excerpt) > 800:
        excerpt = excerpt[:800] + "…"

    client = OpenAI(api_key=settings.openai_api_key)
    response = client.chat.completions.create(
        model=settings.openai_model,
        temperature=0.35,
        messages=[
            {
                "role": "system",
                "content": (
                    "Write exactly one sentence (max 220 characters) summarizing the lead for a founder. "
                    "No emojis, no quotes, no markdown."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Business: {business_type}\n"
                    f"Need: {pain_point}\n"
                    f"User messages (may be noisy):\n{excerpt or '(none)'}"
                ),
            },
        ],
    )
    line = (response.choices[0].message.content or "").strip().split("\n")[0].strip()
    return line[:220] if line else "Lead interested in AI systems and automation."


def _extract_budget_inr(text: str) -> int | None:
    t = (text or "").lower()
    m = re.search(r"(?:₹|rs\.?|inr)?\s*([0-9]{2,7})(?:\s*(k|l|lac|lakh))?", t)
    if not m:
        return None
    try:
        n = int(m.group(1))
    except Exception:
        return None
    mul = (m.group(2) or "").lower()
    if mul == "k":
        n *= 1000
    elif mul in {"l", "lac", "lakh"}:
        n *= 100000
    return n


def extract_lead_qualification(
    settings: Settings,
    *,
    latest_message: str,
    transcript_excerpt: str = "",
) -> dict:
    """
    Extract BANT-like signal (budget / need / timeline) from real chat text.
    Returns a conservative dict and never raises.
    """
    msg = (latest_message or "").strip()
    excerpt = (transcript_excerpt or "").strip()
    if len(excerpt) > 1200:
        excerpt = excerpt[-1200:]

    base = {
        "budget_inr": _extract_budget_inr(msg),
        "need_summary": "",
        "timeline": "",
        "qualified": False,
        "hot_lead": False,
        "book_call_intent": False,
        "proposal_intent": False,
        "payment_intent": False,
        "human_intent": False,
        "confidence": 0.0,
    }
    if not settings.openai_api_key:
        return base

    try:
        client = OpenAI(api_key=settings.openai_api_key)
        response = client.chat.completions.create(
            model=settings.openai_model,
            temperature=0.1,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Extract sales qualification from WhatsApp lead chat.\n"
                        "Return only strict JSON with keys:\n"
                        "budget_inr (number|null), need_summary (string), timeline (string),\n"
                        "qualified (boolean), hot_lead (boolean), book_call_intent (boolean),\n"
                        "proposal_intent (boolean), payment_intent (boolean), human_intent (boolean), confidence (0..1).\n"
                        "Rules: conservative; don't infer facts not present."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Latest message:\n{msg or '(none)'}\n\n"
                        f"Recent transcript:\n{excerpt or '(none)'}"
                    ),
                },
            ],
        )
        raw = (response.choices[0].message.content or "").strip()
        data = json.loads(raw)
        out = {**base}
        for k in out:
            if k in data:
                out[k] = data[k]
        if out["budget_inr"] is None:
            out["budget_inr"] = base["budget_inr"]
        return out
    except Exception:
        return base
