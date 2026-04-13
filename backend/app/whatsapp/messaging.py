import requests

from app.config import Settings


def send_whatsapp_text(settings: Settings, to: str, message: str) -> requests.Response:
    url = (
        f"https://graph.facebook.com/{settings.graph_api_version}/"
        f"{settings.wa_phone_number_id}/messages"
    )
    headers = {
        "Authorization": f"Bearer {settings.wa_access_token}",
        "Content-Type": "application/json",
    }
    data = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": message},
    }
    return requests.post(url, headers=headers, json=data, timeout=60)
