"""Lead / ops constants (WhatsApp owner identity for CEO mode + alerts)."""

import os

# WhatsApp Cloud API sends `from` as digits only (no +). Must match exactly.
OWNER_NUMBER = (os.getenv("OWNER_NUMBER", "917777812777") or "917777812777").strip()
