def classify_lead_score(memory: dict, intent: str) -> str:
    budget = memory.get("budget") or 0
    urgent = bool(memory.get("urgency"))
    ready = intent in {"payment", "call", "proposal", "pricing"}
    if budget and urgent and ready:
        return "hot"
    if ready or budget or urgent:
        return "warm"
    return "cold"


def next_best_action(intent: str, lead_score: str) -> str:
    if intent in {"payment"}:
        return "close_payment"
    if intent in {"call"}:
        return "book_call"
    if intent in {"proposal", "pricing"}:
        return "send_proposal"
    if lead_score == "hot":
        return "notify_owner"
    return "qualify_need"
