import json
import os
from typing import Any

from openai import OpenAI

_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_reply(message: str, memory: dict[str, Any], role: str, intent_data: dict[str, Any]) -> str:
    prompt = f"""
You are StratXcel AI business agent.
Role mode: {role}
Detected intent: {intent_data.get("intent")}
Service: {intent_data.get("service")}
Budget: {intent_data.get("budget")}
Urgency: {intent_data.get("urgency")}
Lead score: {memory.get("lead_score")}
Language: {memory.get("preferred_language")}
Last summary: {memory.get("last_conversation_summary")}
Next action: {memory.get("next_best_action")}

User message: {message}

Rules:
- Sound human and contextual
- No repetitive spam CTA
- Keep concise unless user asks detail
- If user says hi after old context, reference prior context naturally
- Match user language (English/Hindi/Hinglish)
Return JSON only: {{"reply":"...","summary":"...","objection":"...","interest":"..."}}
"""
    try:
        res = _client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.6,
            timeout=12,
            messages=[{"role": "user", "content": prompt}],
        )
        payload = json.loads((res.choices[0].message.content or "").strip())
        return str(payload.get("reply") or "Got it. Tell me what outcome you want and I will help right away.")
    except Exception:
        return "Got it. Tell me what outcome you want and I will help right away."
