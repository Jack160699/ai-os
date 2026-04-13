"""One-line lead summaries — OpenAI with compact rule-based fallback."""

from __future__ import annotations

from app.ai.assistant import generate_lead_one_line_summary
from app.config import Settings


def rule_based_lead_summary(
    *,
    business_type: str,
    pain_point: str,
    budget: str,
    urgency: str,
) -> str:
    b = (budget or "Not stated").strip()
    need = (pain_point or "systems").strip()
    parts = [
        f"{business_type} lead",
        f"needs {need.lower()}",
        f"{b} budget" if b and b != "Not stated" else "budget not stated",
        f"{urgency.lower()} urgency",
    ]
    line = ", ".join(p for p in parts if p)[:220]
    return line or "Lead exploring AI systems and automation."


def build_lead_summary_line(
    settings: Settings,
    *,
    business_type: str,
    pain_point: str,
    transcript: str,
    budget: str,
    urgency: str,
) -> str:
    try:
        line = generate_lead_one_line_summary(
            settings,
            business_type,
            pain_point,
            transcript,
        )
        if line and len(line.strip()) >= 8:
            return line.strip()[:220]
    except Exception as e:
        print(f"[lead-summary] OpenAI error: {e}")
    return rule_based_lead_summary(
        business_type=business_type,
        pain_point=pain_point,
        budget=budget,
        urgency=urgency,
    )
