import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

API_URL = os.environ.get("API_URL", "")
ACCESS_KEY = os.environ.get("ACCESS_KEY", "")
IMAGE_DIR = Path(os.environ.get("IMAGE_DIR", "images"))
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL", "5"))
CONFIDENCE_THRESHOLD = float(os.environ.get("CONFIDENCE_THRESHOLD", "0.25"))
CAMERA_INDEX = int(os.environ.get("CAMERA_INDEX", "0"))

ROOT_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = ROOT_DIR / "model.pt"
CACHE_PATH = ROOT_DIR / ".credentials.json"
HEADERS = {"Authorization": f"Bearer {ACCESS_KEY}"}

if not API_URL or not ACCESS_KEY:
    print("Error: API_URL and ACCESS_KEY must be set in .env")
    sys.exit(1)
