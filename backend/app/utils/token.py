"""Simple HMAC-based token utility using only stdlib."""
import hmac
import hashlib
import base64
import json
import time
import os

_SECRET = os.environ.get("TOKEN_SECRET", "task-manager-secret-key-change-in-prod")


def create_token(user_id: int, username: str, expires_in: int = 86400) -> str:
    payload = {
        "sub": user_id,
        "username": username,
        "exp": int(time.time()) + expires_in,
    }
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
    signature = hmac.new(_SECRET.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{signature}"


def verify_token(token: str) -> dict | None:
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        payload_b64, signature = parts
        expected = hmac.new(_SECRET.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            return None
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None
