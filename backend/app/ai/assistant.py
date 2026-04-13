from openai import OpenAI

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
