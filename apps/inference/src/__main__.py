import os
import sys

import httpx
from dotenv import load_dotenv

load_dotenv()

API_URL = os.environ.get("API_URL")
ACCESS_KEY = os.environ.get("ACCESS_KEY")

if not API_URL or not ACCESS_KEY:
    print("Error: API_URL and ACCESS_KEY must be set in .env")
    sys.exit(1)


def main():
    print("-- pantrific inference --\n")

    username = input("Username: ").strip()
    if not username:
        print("Username is required.")
        sys.exit(1)

    password = input("Password: ").strip()
    if not password:
        print("Password is required.")
        sys.exit(1)

    print("\nAuthenticating...")

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

    data = res.json()
    print(f"\nAuthenticated as {data['username']} (id: {data['id']})")
    print("Starting...")


if __name__ == "__main__":
    main()
