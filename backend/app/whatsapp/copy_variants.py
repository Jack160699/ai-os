"""Rotating copy for key bot prompts (reduces repetition)."""

from __future__ import annotations

import random

_WELCOME = (
    (
        "Hey 👋 Welcome to Stratxcel.\n\n"
        "We help businesses capture leads, automate workflows, and grow using AI systems.\n\n"
        "What kind of business do you run? Open the menu to pick one, or just describe it in your own words."
    ),
    (
        "Hi there — Stratxcel here.\n\n"
        "We build AI-powered lead capture and workflow automation for growing teams.\n\n"
        "Tell us what you run: use the menu, or describe your business in a line or two."
    ),
    (
        "Hello 👋 You are chatting with Stratxcel.\n\n"
        "We help you turn conversations into booked revenue with AI systems.\n\n"
        "What type of business is yours? Pick from the menu or type freely."
    ),
)

_CHALLENGE_INTROS = (
    (
        "What’s your biggest challenge right now?\n\n"
        "For example: getting leads, slow follow-ups, too much manual work, or scaling — "
        "even a short phrase is perfect."
    ),
    (
        "Where is most of the friction today?\n\n"
        "Leads, follow-ups, manual work, or scaling — a quick line is enough."
    ),
    (
        "What would you fix first if you could wave a wand?\n\n"
        "Leads, follow-ups, manual ops, or growth — say it however you like."
    ),
)

_BOOKING_QUESTIONS = (
    "Would you like to book a quick strategy call?",
    "Want to lock in a short strategy call with us?",
    "Should we set up a quick call to map the next step?",
)

_NO_OPTION_INTROS = (
    (
        "No problem. What would help most: pricing, a tailored recommendation, "
        "or should we reconnect later?"
    ),
    (
        "All good. Are you after pricing, a quick recommendation, or would you rather pick this up later?"
    ),
    (
        "Totally fine. Pricing, a personalized recommendation, or circle back later — what fits?"
    ),
)

_YES_NO_NUDGE = (
    "Tap Yes or No below, or type yes / no.",
    "Use the buttons, or just reply yes or no.",
    "A quick yes or no works — buttons or text is fine.",
)

_REMINDER_1H = (
    "Still here if you want to continue — reply whenever you are ready.",
    "Quick check-in: message us when you have a moment to pick up where we left off.",
    "Whenever you are free, reply here and we will continue from your last step.",
)

_NO_MENU_NUDGE = (
    "Say pricing, recommendation, or later — whatever fits best.",
    "A word like pricing, recommendation, or later is enough.",
    "Pricing, a recommendation, or later — tell us what you prefer.",
)

_REMINDER_24H = (
    "Friendly follow-up — reply anytime if you would like to continue, no pressure.",
    "We will pause here for now. Ping this chat anytime if you want to resume.",
    "Closing the loop for now. You can always message back when it suits you.",
)

_REMINDER_3D = (
    "Quick case study: a similar team automated lead follow-ups and improved reply rates in 10 days. Want a version for your workflow?",
    "Helpful example: one client replaced manual lead triage and recovered 6+ hours/week. Want us to sketch that for you?",
    "Value share: teams like yours use lightweight automations to speed responses and increase conversions. Want the playbook?",
)

_REMINDER_7D = (
    "Still open to revisit this? We can send a concise step-by-step plan tailored to your business.",
    "If this is still relevant, reply and we will map next actions in plain language.",
    "Happy to re-engage whenever you are ready. Want us to restart from where we left off?",
)

_REMINDER_30D_SOFT = (
    "Final check-in from us. If priorities changed, no worries. If you want to restart later, this thread stays open.",
    "We will close this thread for now. Message anytime if you want to revive the plan.",
    "Last follow-up from our side. Reach out whenever you want to resume.",
)

_REMINDER_30D_CTA = (
    "Final revival note: if improving conversions is still on your roadmap, reply now and we will prioritize your plan.",
    "Last check-in: want us to reopen your strategy thread this week?",
    "Final nudge from Stratxcel. Reply to restart with a focused action plan.",
)


def pick_welcome_message() -> str:
    return random.choice(_WELCOME)


def pick_challenge_prompt() -> str:
    return random.choice(_CHALLENGE_INTROS)


def pick_booking_question() -> str:
    return random.choice(_BOOKING_QUESTIONS)


def pick_no_options_message() -> str:
    return random.choice(_NO_OPTION_INTROS)


def pick_yes_no_nudge() -> str:
    return random.choice(_YES_NO_NUDGE)


def pick_followup_1h() -> str:
    return random.choice(_REMINDER_1H)


def pick_followup_24h() -> str:
    return random.choice(_REMINDER_24H)


def pick_no_menu_nudge() -> str:
    return random.choice(_NO_MENU_NUDGE)


def pick_followup_3d(*, name: str, business: str, pain_point: str) -> str:
    base = random.choice(_REMINDER_3D)
    if name and business:
        return f"{name}, this could help your {business.lower()} team with {pain_point.lower()}. {base}"
    return base


def pick_followup_7d(*, name: str, business: str) -> str:
    base = random.choice(_REMINDER_7D)
    if name:
        return f"{name}, {base}"
    if business:
        return f"For your {business.lower()}, {base[0].lower() + base[1:]}"
    return base


def pick_followup_30d(*, name: str, business: str, soft: bool) -> str:
    pool = _REMINDER_30D_SOFT if soft else _REMINDER_30D_CTA
    base = random.choice(pool)
    if name:
        return f"{name}, {base}"
    if business:
        return f"For your {business.lower()}, {base[0].lower() + base[1:]}"
    return base
