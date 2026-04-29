from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

import requests

DEFAULT_BATCH_ID = "00000000-0000-0000-0000-000000000001"
_STAGE_ID_CACHE: dict[tuple[str, str], str] = {}


def _env(name: str, default: str = "") -> str:
    return (os.getenv(name, default) or "").strip()


def _enabled() -> bool:
    return bool(_env("NEXT_PUBLIC_SUPABASE_URL") and (_env("SUPABASE_SERVICE_ROLE_KEY") or _env("NEXT_PUBLIC_SUPABASE_ANON_KEY")))


def _base() -> str:
    return _env("NEXT_PUBLIC_SUPABASE_URL").rstrip("/")


def _key() -> str:
    return _env("SUPABASE_SERVICE_ROLE_KEY") or _env("NEXT_PUBLIC_SUPABASE_ANON_KEY")


def _headers(prefer: str = "") -> dict[str, str]:
    h = {
        "apikey": _key(),
        "Authorization": f"Bearer {_key()}",
        "Content-Type": "application/json",
    }
    if prefer:
        h["Prefer"] = prefer
    return h


def _postgrest(path: str, *, method: str = "GET", params: dict[str, str] | None = None, json_payload: Any = None, prefer: str = "") -> Any:
    url = f"{_base()}/rest/v1/{path.lstrip('/')}"
    r = requests.request(method, url, params=params, json=json_payload, headers=_headers(prefer=prefer), timeout=12)
    r.raise_for_status()
    if not r.text:
        return None
    try:
        return r.json()
    except Exception:
        return None


def _batch_id() -> str:
    return _env("SUPABASE_RESET_BATCH_ID", DEFAULT_BATCH_ID)


def _stage_id(stage_key: str) -> str | None:
    bid = _batch_id()
    ck = (bid, stage_key)
    if ck in _STAGE_ID_CACHE:
        return _STAGE_ID_CACHE[ck]
    rows = _postgrest(
        "pipeline_stages",
        params={
            "select": "id",
            "reset_batch_id": f"eq.{bid}",
            "stage_key": f"eq.{stage_key}",
            "limit": "1",
        },
    )
    if isinstance(rows, list) and rows:
        sid = str(rows[0].get("id") or "")
        if sid:
            _STAGE_ID_CACHE[ck] = sid
            return sid
    return None


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_or_create_lead(*, phone: str, profile_name: str, stage_key: str, budget_inr: int | None, hot: bool) -> dict[str, Any] | None:
    print("Saving lead to Supabase:", phone)
    bid = _batch_id()
    rows = _postgrest(
        "leads",
        params={
            "select": "id,full_name,pipeline_stage_id,temperature,estimated_value_cents,has_unreplied",
            "reset_batch_id": f"eq.{bid}",
            "phone": f"eq.{phone}",
            "archived": "eq.false",
            "limit": "1",
        },
    )
    if isinstance(rows, list) and rows:
        lead = rows[0]
        patch: dict[str, Any] = {
            "has_unreplied": True,
            "updated_at": _iso_now(),
        }
        if hot and str(lead.get("temperature") or "") != "hot":
            patch["temperature"] = "hot"
        sid = _stage_id(stage_key)
        if sid and str(lead.get("pipeline_stage_id") or "") != sid:
            patch["pipeline_stage_id"] = sid
        if budget_inr and int(lead.get("estimated_value_cents") or 0) <= 0:
            patch["estimated_value_cents"] = int(budget_inr) * 100
        _postgrest(f"leads?id=eq.{lead['id']}", method="PATCH", json_payload=patch)
        return {"id": str(lead["id"])}

    sid = _stage_id(stage_key) or _stage_id("new")
    if not sid:
        return None
    payload = {
        "reset_batch_id": bid,
        "pipeline_stage_id": sid,
        "full_name": (profile_name or f"Lead {phone[-4:]}").strip(),
        "phone": phone,
        "source": "whatsapp",
        "ai_score": 82 if hot else 56,
        "temperature": "hot" if hot else "warm",
        "estimated_value_cents": int((budget_inr or 0) * 100),
        "has_unreplied": True,
    }
    rows = _postgrest("leads", method="POST", json_payload=payload, prefer="return=representation")
    if isinstance(rows, list) and rows:
        return {"id": str(rows[0].get("id") or "")}
    return None


def _get_or_create_conversation(lead_id: str) -> str | None:
    bid = _batch_id()
    rows = _postgrest(
        "conversations",
        params={
            "select": "id",
            "reset_batch_id": f"eq.{bid}",
            "lead_id": f"eq.{lead_id}",
            "channel": "eq.whatsapp",
            "archived": "eq.false",
            "limit": "1",
        },
    )
    if isinstance(rows, list) and rows:
        return str(rows[0].get("id") or "")
    payload = {
        "reset_batch_id": bid,
        "lead_id": lead_id,
        "channel": "whatsapp",
        "last_message_at": _iso_now(),
    }
    created = _postgrest("conversations", method="POST", json_payload=payload, prefer="return=representation")
    if isinstance(created, list) and created:
        return str(created[0].get("id") or "")
    return None


def sync_message_event(
    *,
    phone: str,
    profile_name: str,
    direction: str,
    body: str,
    stage_key: str = "new",
    budget_inr: int | None = None,
    hot: bool = False,
    created_at_iso: str | None = None,
) -> None:
    if not _enabled():
        return
    try:
        lead = _get_or_create_lead(
            phone=phone,
            profile_name=profile_name,
            stage_key=stage_key,
            budget_inr=budget_inr,
            hot=hot,
        )
        if not lead:
            return
        conv_id = _get_or_create_conversation(lead["id"])
        if not conv_id:
            return
        d = (direction or "").strip().lower()
        if d in ("in", "incoming", "inbound", "user"):
            _dir_label = "in"
        elif d in ("out", "outgoing", "outbound", "bot", "admin", "system", "assistant"):
            _dir_label = "out"
        else:
            _dir_label = "out"
        db_direction = "out" if _dir_label == "out" else "in"
        payload = {
            "reset_batch_id": _batch_id(),
            "conversation_id": conv_id,
            "body": (body or "").strip()[:4000],
            "direction": db_direction,
        }
        if created_at_iso:
            payload["created_at"] = created_at_iso
        _postgrest("messages", method="POST", json_payload=payload)
        print("[supabase-sync] message inserted:", payload.get("direction"), "lead_id=", lead["id"])
        _postgrest(
            f"conversations?id=eq.{conv_id}",
            method="PATCH",
            json_payload={"last_message_at": created_at_iso or _iso_now()},
        )
        print("[supabase-sync] message write success:", phone)
    except Exception as e:
        print(f"[supabase-sync] message sync failed: {e}")


def sync_activity(
    *,
    phone: str,
    profile_name: str,
    kind: str,
    summary: str,
    meta: dict[str, Any] | None = None,
    stage_key: str = "new",
) -> None:
    if not _enabled():
        return
    try:
        print("Activity:", kind)
        lead = _get_or_create_lead(phone=phone, profile_name=profile_name, stage_key=stage_key, budget_inr=None, hot=False)
        if not lead:
            return
        payload = {
            "reset_batch_id": _batch_id(),
            "lead_id": lead["id"],
            "kind": kind,
            "summary": (summary or "").strip()[:500],
            "meta": meta or {},
        }
        _postgrest("activities", method="POST", json_payload=payload)
        print("[supabase-sync] activity write success:", kind, "lead_id=", lead["id"])
    except Exception as e:
        print(f"[supabase-sync] activity sync failed: {e}")

