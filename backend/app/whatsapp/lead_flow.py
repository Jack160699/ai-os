from datetime import datetime

MEMORY = {}

FINAL_STAGES = ["payment_ready", "call_ready", "human_required"]


def get_state(phone):
    return MEMORY.get(phone, {
        "stage": "new",
        "human_required": False,
        "service": None,
        "budget": None,
        "urgency": False,
        "last_updated": str(datetime.utcnow())
    })


def save_state(phone, state):
    state["last_updated"] = str(datetime.utcnow())
    MEMORY[phone] = state


def contains(msg, words):
    return any(w in msg for w in words)


def detect_service(msg):
    if "app" in msg:
        return "app"
    if "website" in msg or "web" in msg:
        return "website"
    if "marketing" in msg or "ads" in msg:
        return "marketing"
    if "seo" in msg:
        return "seo"
    return None


def extract_budget(msg):
    import re
    m = re.search(r'(\d+)\s*k?', msg)
    if m:
        val = int(m.group(1))
        if "k" in msg:
            val *= 1000
        return val
    return None


def notify_admin(phone, state):
    print(f"🚨 {phone} → {state['stage']}")


def handle_final_stage(phone, state, msg):

    if state["stage"] == "human_required":
        return None

    if state["stage"] == "payment_ready":
        if "upi" in msg:
            return "Done. Sharing UPI payment link now."
        if "bank" in msg:
            return "Sharing bank transfer details now."
        return "Want UPI, bank transfer, or payment link?"

    if state["stage"] == "call_ready":
        return f"Confirmed for {msg}. Our strategist will call you."

    return None


def handle_lead_message(phone, message):

    msg = message.lower().strip()
    state = get_state(phone)

    # HUMAN HANDOFF (TOP PRIORITY)
    if contains(msg, ["human", "real person", "agent", "talk to human"]):
        state["human_required"] = True
        state["stage"] = "human_required"
        save_state(phone, state)

        notify_admin(phone, state)

        return "Connecting you to a strategist now. You'll get a reply shortly."

    # FINAL STAGE LOCK
    if state["stage"] in FINAL_STAGES:
        return handle_final_stage(phone, state, msg)

    # DATA EXTRACTION
    service = detect_service(msg)
    budget = extract_budget(msg)
    urgency = contains(msg, ["urgent", "asap", "today", "immediately"])

    if service:
        state["service"] = service

    if budget:
        state["budget"] = budget

    if urgency:
        state["urgency"] = True

    # PAYMENT
    if contains(msg, ["pay", "payment"]):
        state["stage"] = "payment_ready"
        save_state(phone, state)

        notify_admin(phone, state)

        return "Perfect. I’ll arrange payment details today. Want UPI, bank transfer, or payment link?"

    # CALL
    if contains(msg, ["call", "talk", "meeting"]):
        state["stage"] = "call_ready"
        save_state(phone, state)

        notify_admin(phone, state)

        return "Great. A strategist can speak with you today. Share your preferred time slot."

    # PROPOSAL
    if contains(msg, ["proposal", "quote", "pricing"]):
        state["stage"] = "proposal_requested"
        save_state(phone, state)

        return f"Proposal ready for your {state['service'] or 'project'}. We’ll structure scope, timeline, and pricing around ₹{state['budget'] or ''}. Reply 'pay now' or 'book call'."

    # FIRST MESSAGE
    if state["stage"] == "new":
        state["stage"] = "intent_captured"
        save_state(phone, state)

        if state["urgency"] and state["budget"]:
            return f"Got it — urgent and clear. We can deliver fast within ₹{state['budget']}. Want a quick proposal or strategist call now?"

        if state["budget"]:
            return f"₹{state['budget']} is workable. Want proposal or quick call?"

        return "Got it. We can help. Want proposal or quick call?"

    save_state(phone, state)
    return "Want to move ahead with a proposal or quick call?"
