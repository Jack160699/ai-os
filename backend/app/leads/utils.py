"""Shared lead helpers — no imports from analytics or growth_hot_score (avoids circular deps)."""

from __future__ import annotations

from datetime import datetime, timezone


def parse_iso(ts: str) -> datetime | None:
    try:
        if ts.endswith("Z"):
            ts = ts[:-1] + "+00:00"
        dt = datetime.fromisoformat(ts)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:
        return None
