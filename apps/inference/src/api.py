import json
import sys

import httpx

from .config import API_URL, CACHE_PATH, HEADERS


def load_cache() -> dict | None:
    if CACHE_PATH.exists():
        try:
            return json.loads(CACHE_PATH.read_text())
        except (json.JSONDecodeError, OSError):
            return None
    return None


def save_cache(data: dict):
    CACHE_PATH.write_text(json.dumps(data, indent=2))


def authenticate(username: str, password: str) -> dict:
    try:
        res = httpx.post(
            f"{API_URL}/auth/login",
            json={"username": username, "password": password},
        )
    except httpx.ConnectError:
        print(f"could not connect to API at {API_URL}")
        sys.exit(1)

    if res.status_code == 401:
        print("invalid credentials")
        sys.exit(1)

    if res.status_code != 200:
        print(f"API returned {res.status_code}")
        sys.exit(1)

    return res.json()


def create_pantry(user_id: str, name: str) -> dict:
    res = httpx.post(
        f"{API_URL}/pantries/{user_id}",
        json={"name": name},
        headers=HEADERS,
    )
    if res.status_code not in (200, 201):
        print(f"failed to create pantry: {res.status_code} {res.text}")
        sys.exit(1)
    return res.json()


def upload_items(user_id: str, pantry_id: str, items: list[dict]):
    res = httpx.put(
        f"{API_URL}/pantries/{user_id}/{pantry_id}/items",
        json={"items": items},
        headers=HEADERS,
    )
    if res.status_code != 200:
        print(f"  upload failed: {res.status_code} {res.text}")
    else:
        print(f"  uploaded {len(items)} items")


def poll_refresh(user_id: str) -> bool:
    try:
        res = httpx.post(
            f"{API_URL}/pantries/{user_id}/refresh/poll",
            headers=HEADERS,
        )
        if res.status_code == 200:
            return res.json().get("refresh", False)
    except httpx.ConnectError:
        pass
    return False
