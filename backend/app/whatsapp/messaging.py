from __future__ import annotations

from typing import Iterable, Sequence, Tuple

import requests

from app.config import Settings

ButtonRow = Tuple[str, str]  # id, title (title max 20 chars for Cloud API)
ListRow = Tuple[str, str, str | None]  # id, title (max 24), optional description (max 72)


def _messages_url(settings: Settings) -> str:
    return (
        f"https://graph.facebook.com/{settings.graph_api_version}/"
        f"{settings.wa_phone_number_id}/messages"
    )


def _messages_headers(settings: Settings) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.wa_access_token}",
        "Content-Type": "application/json",
    }


def send_whatsapp_text(settings: Settings, to: str, message: str) -> requests.Response:
    data = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": message},
    }
    return requests.post(
        _messages_url(settings),
        headers=_messages_headers(settings),
        json=data,
        timeout=60,
    )


def send_interactive_buttons(
    settings: Settings,
    to: str,
    text: str,
    buttons: Sequence[ButtonRow],
) -> requests.Response:
    """
    WhatsApp Cloud API — interactive reply buttons (type button, max 3 options).
    `buttons` is a sequence of (id, title); title is truncated to 20 chars if longer.
    """
    rows = list(buttons)
    if not rows:
        raise ValueError("send_interactive_buttons requires at least one button")
    if len(rows) > 3:
        raise ValueError("WhatsApp allows at most 3 reply buttons per message")

    action_buttons = []
    for bid, title in rows:
        label = (title or "")[:20]
        action_buttons.append({"type": "reply", "reply": {"id": str(bid), "title": label}})

    data = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {"text": (text or "")[:1024]},
            "action": {"buttons": action_buttons},
        },
    }
    return requests.post(
        _messages_url(settings),
        headers=_messages_headers(settings),
        json=data,
        timeout=60,
    )


def send_interactive_list(
    settings: Settings,
    to: str,
    body: str,
    *,
    button_label: str,
    section_title: str,
    rows: Iterable[ListRow],
) -> requests.Response:
    """
    Interactive list (for more than 3 options). Row ids are returned in list_reply.id.
    """
    row_list: list[dict] = []
    for rid, title, desc in rows:
        row: dict = {"id": str(rid), "title": (title or "")[:24]}
        if desc:
            row["description"] = str(desc)[:72]
        row_list.append(row)

    if not row_list:
        raise ValueError("send_interactive_list requires at least one row")

    data = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "interactive",
        "interactive": {
            "type": "list",
            "body": {"text": (body or "")[:1024]},
            "action": {
                "button": (button_label or "Menu")[:20],
                "sections": [{"title": (section_title or "Options")[:24], "rows": row_list}],
            },
        },
    }
    return requests.post(
        _messages_url(settings),
        headers=_messages_headers(settings),
        json=data,
        timeout=60,
    )
