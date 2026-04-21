import os
import json
import time
from pathlib import Path
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MEMORY_FILE = Path("memory.json")


def load_db():
    if not MEMORY_FILE.exists():
        return {}
    try:
        with open(MEMORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {}


def save_db(db):
    with open(MEMORY_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2)


def normalize_phone(phone):
    phone = str(phone).replace("+", "").strip()
    return phone[-10:]


def get_memory(phone):
    db = load_db()
    key = normalize_phone(phone)

    if key not in db:
        db[key] = {
            "user_id": key,
            "user_type": "unknown",
            "summary": "",
            "last_intent": "",
            "human_required": False,
            "stage": "new",
            "last_seen": int(time.time())
        }
        save_db(db)

    return db[key]


def save_memory(phone, memory):
    db = load_db()
    key = normalize_phone(phone)
    db[key] = memory
    save_db(db)


def handle_lead_message(phone, message):
    return handle_conversation(phone, message)


def handle_conversation(phone, message):
    memory = get_memory(phone)
    msg = str(message).strip()

    lower = msg.lower()

    handoff_words = [
        "human",
        "agent",
        "real person",
        "talk to human"
    ]

    if any(word in lower for word in handoff_words):
        memory["human_required"] = True
        memory["stage"] = "human_required"
        save_memory(phone, memory)
        return "Connecting you to a strategist now. You'll get a reply shortly."

    if memory.get("human_required"):
        return None

    result = ai_reply(memory, msg)

    memory["summary"] = result["summary"]
    memory["user_type"] = result["user_type"]
    memory["last_intent"] = result["intent"]
    memory["stage"] = result["stage"]
    memory["last_seen"] = int(time.time())

    save_memory(phone, memory)

    return result["reply"]


def ai_reply(memory, user_message):
    prompt = f"""
You are Stratxcel AI.

You represent the company in chat.

Roles:
lead = sales naturally
client = support
founder = assistant
unknown = understand first

Current Memory:
User type: {memory["user_type"]}
Summary: {memory["summary"]}
Last intent: {memory["last_intent"]}
Stage: {memory["stage"]}

User Message:
{user_message}

Rules:
- Sound human
- No robotic replies
- No repetitive CTA
- Use context
- Keep replies short

Return ONLY valid JSON:

{{
  "reply": "...",
  "user_type": "...",
  "intent": "...",
  "stage": "...",
  "summary": "..."
}}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.7,
            messages=[
                {"role": "system", "content": "You are a business AI operator."},
                {"role": "user", "content": prompt}
            ]
        )

        text = response.choices[0].message.content.strip()
        return json.loads(text)

    except Exception:
        return {
            "reply": "Got it — tell me a bit more so I can help properly.",
            "user_type": memory["user_type"],
            "intent": "unknown",
            "stage": memory["stage"],
            "summary": memory["summary"]
        }
from datetime import datetime
import json
import os

DB_FILE = "state.json"

FINAL_STAGES = ["payment_ready", "call_ready", "human_required"]


def normalize_phone(phone):
    phone = str(phone or "").replace("+", "").strip()
    if phone.startswith("91") and len(phone) > 10:
        return phone[-10:]
    return phone


def load_db():
    if not os.path.exists(DB_FILE):
        return {}
    with open(DB_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_db(db):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f)


def get_state(phone):
    phone = normalize_phone(phone)
    db = load_db()
    return db.get(phone, {
        "stage": "new",
        "human_required": False,
        "service": None,
        "budget": None,
        "urgency": False,
        "last_updated": str(datetime.utcnow())
    })


def save_state(phone, state):
    phone = normalize_phone(phone)
    db = load_db()
    state["last_updated"] = str(datetime.utcnow())
    db[phone] = state
    save_db(db)


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
    phone = normalize_phone(phone)
    msg = message.lower().strip()
    state = get_state(phone)
    print("STATE:", phone, state)

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
