from app.leads.constants import OWNER_NUMBER


def detect_role(phone: str, message: str, memory: dict) -> str:
    digits = str(phone or "").strip()
    if digits.endswith(str(OWNER_NUMBER)[-10:]):
        return "owner"
    if memory.get("role") in {"client", "vendor", "lead"}:
        return str(memory.get("role"))
    txt = (message or "").lower()
    if any(k in txt for k in ("invoice", "issue", "support", "bug", "not working")):
        return "client"
    if any(k in txt for k in ("quotation for us", "vendor", "supply", "partnership")):
        return "vendor"
    return "lead"
