"""Lead / ops constants (WhatsApp owner identity for CEO mode + alerts)."""

import os

# WhatsApp Cloud API sends `from` as digits only (no +). Must match exactly.
OWNER_NUMBER = (os.getenv("OWNER_NUMBER", "919584735857") or "919584735857").strip()
