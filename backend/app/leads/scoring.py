"""Lead scoring (Hot / Warm / Cold) — thin wrapper over classification heuristics."""

from __future__ import annotations

from dataclasses import dataclass

from app.leads.classification import (
    action_recommendation,
    detect_urgency,
    extract_budget,
    intent_score_label,
)


@dataclass(frozen=True)
class LeadScore:
    intent_score: str
    urgency: str
    budget: str
    budget_stated: bool
    action: str
    is_hot: bool


def compute_lead_score(
    *,
    transcript: str,
    wants_call: bool,
    intent_code: str,
) -> LeadScore:
    urgency = detect_urgency(transcript)
    budget = extract_budget(transcript)
    budget_stated = budget != "Not stated"
    intent_score = intent_score_label(
        wants_call=wants_call,
        budget_stated=budget_stated,
        urgency=urgency,
        intent_code=intent_code,
    )
    action = action_recommendation(intent_score, urgency, wants_call)
    is_hot = intent_score == "Hot"
    return LeadScore(
        intent_score=intent_score,
        urgency=urgency,
        budget=budget,
        budget_stated=budget_stated,
        action=action,
        is_hot=is_hot,
    )


def action_label_for_alert(action: str) -> str:
    """Short owner-facing action line."""
    if action == "Follow up today":
        return "Follow up"
    if action == "Nurture later":
        return "Nurture"
    return action
