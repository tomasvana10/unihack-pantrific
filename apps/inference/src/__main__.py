import sys
import time

from ultralytics import YOLO

from .api import (
    authenticate,
    create_pantry,
    load_cache,
    poll_refresh,
    save_cache,
    upload_items,
)
from .camera import capture_frame, load_images_from_dir
from .config import IMAGE_DIR, MODEL_PATH, POLL_INTERVAL
from .detect import aggregate_detections, run_inference


def scan_and_upload(model: YOLO, user_id: str, pantry_id: str):
    """Capture from camera or load images, run inference, upload."""
    # Try camera first
    frame = capture_frame()
    if frame is not None:
        print("Captured frame from camera")
        items = run_inference(model, frame)
    else:
        # Fall back to image directory
        images = load_images_from_dir()
        if not images:
            print("No camera and no images found.")
            return
        print(f"Processing {len(images)} images from {IMAGE_DIR}...")
        all_items = [run_inference(model, img) for img in images]
        items = aggregate_detections(all_items)

    if not items:
        print("No items detected.")
        return

    print(f"Detected {len(items)} unique items:")
    for item in items:
        print(f"  {item['name']}: x{item['quantity']} ({item['confidence']:.0%})")

    upload_items(user_id, pantry_id, items)


def run_loop(model: YOLO, user_id: str, pantry_id: str):
    print(f"\nPolling for refresh every {POLL_INTERVAL}s")
    print("Press Ctrl+C to stop.\n")

    # Initial scan
    scan_and_upload(model, user_id, pantry_id)

    while True:
        try:
            time.sleep(POLL_INTERVAL)
            if poll_refresh(user_id):
                print("\n[refresh requested]")
                scan_and_upload(model, user_id, pantry_id)
        except KeyboardInterrupt:
            print("\nStopping.")
            break


def setup_credentials() -> tuple[str, str]:
    """Interactive credential setup, returns (user_id, pantry_id)."""
    cache = load_cache()

    if cache:
        print(f"Cached credentials: {cache['username']} → {cache['pantry_name']}")
        if input("Continue? [Y/n] ").strip().lower() not in ("n", "no"):
            print("Authenticating...")
            data = authenticate(cache["username"], cache["password"])
            print(f"Authenticated as {data['username']}")
            return cache["user_id"], cache["pantry_id"]

    username = input("Username: ").strip()
    password = input("Password: ").strip()
    pantry_name = input("Pantry identifier (e.g. Kitchen Fridge): ").strip()

    if not all([username, password, pantry_name]):
        print("All fields required.")
        sys.exit(1)

    print("Authenticating...")
    data = authenticate(username, password)
    user_id = data["id"]
    print(f"Authenticated as {data['username']} (id: {user_id})")

    print(f"Creating pantry '{pantry_name}'...")
    pantry = create_pantry(user_id, pantry_name)
    pantry_id = pantry["id"]
    print(f"Pantry created (id: {pantry_id})")

    save_cache({
        "username": username,
        "password": password,
        "user_id": user_id,
        "pantry_name": pantry_name,
        "pantry_id": pantry_id,
    })
    return user_id, pantry_id


def main():
    print("-- pantrific inference --\n")

    if not MODEL_PATH.exists():
        print(f"Error: model not found at {MODEL_PATH}")
        sys.exit(1)

    print(f"Loading model...")
    model = YOLO(str(MODEL_PATH))
    print(f"Model loaded ({len(model.names)} classes)\n")

    user_id, pantry_id = setup_credentials()
    run_loop(model, user_id, pantry_id)


if __name__ == "__main__":
    main()
