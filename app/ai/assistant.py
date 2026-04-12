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
