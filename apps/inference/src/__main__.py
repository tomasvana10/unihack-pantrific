import json
import os
import sys
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv()

API_URL = os.environ.get("API_URL")
ACCESS_KEY = os.environ.get("ACCESS_KEY")
CACHE_PATH = Path(__file__).resolve().parent.parent / ".credentials.json"

if not API_URL or not ACCESS_KEY:
    print("Error: API_URL and ACCESS_KEY must be set in .env")
    sys.exit(1)


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
        headers={"Authorization": f"Bearer {ACCESS_KEY}"},
    )
    if res.status_code not in (200, 201):
        print(f"failed to create pantry: {res.status_code} {res.text}")
        sys.exit(1)
    return res.json()


def main():
    print("-- pantrific inference --\n")

    cache = load_cache()

    if cache:
        print(f"Using cached credentials (device: {cache['pantry_name']})")
        print(f"User: {cache['username']}")
        use_cached = input("Continue with these? [Y/n] ").strip().lower()
        if use_cached not in ("n", "no"):
            print("\nAuthenticating...")
            data = authenticate(cache["username"], cache["password"])
            print(f"Authenticated as {data['username']} (id: {data['id']})")
            print(f"Pantry: {cache['pantry_name']} ({cache['pantry_id']})")
            print("Starting...")
            return

    username = input("Username: ").strip()
    if not username:
        print("Username is required.")
        sys.exit(1)

    password = input("Password: ").strip()
    if not password:
        print("Password is required.")
        sys.exit(1)

    pantry_name = input("Pantry identifier (e.g. Kitchen Fridge): ").strip()
    if not pantry_name:
        print("Pantry identifier is required.")
        sys.exit(1)

    print("\nAuthenticating...")
    data = authenticate(username, password)
    user_id = data["id"]
    print(f"Authenticated as {data['username']} (id: {user_id})")

    print(f"Creating pantry '{pantry_name}'...")
    pantry = create_pantry(user_id, pantry_name)
    pantry_id = pantry["id"]
    print(f"Pantry created (id: {pantry_id})")

    save_cache(
        {
            "username": username,
            "password": password,
            "user_id": user_id,
            "pantry_name": pantry_name,
            "pantry_id": pantry_id,
        }
    )
    print("Credentials cached for next run.")
    print("Starting...")


if __name__ == "__main__":
    main()
