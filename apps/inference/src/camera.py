from pathlib import Path

import cv2
import numpy as np

from .config import CAMERA_INDEX, IMAGE_DIR


def capture_frame() -> np.ndarray | None:
    """Capture a single frame from the camera via OpenCV."""
    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        print(f"  could not open camera {CAMERA_INDEX}")
        return None

    ret, frame = cap.read()
    cap.release()

    if not ret or frame is None:
        print("  failed to capture frame")
        return None

    return frame


def save_frame(frame: np.ndarray, path: Path | None = None) -> Path:
    """Save a frame to disk and return the path."""
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    if path is None:
        import time
        path = IMAGE_DIR / f"capture_{int(time.time())}.jpg"
    cv2.imwrite(str(path), frame)
    return path


def load_images_from_dir() -> list[Path]:
    """Load all image files from the configured image directory."""
    if not IMAGE_DIR.exists():
        return []
    return sorted(
        p
        for p in IMAGE_DIR.iterdir()
        if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".bmp", ".webp")
    )
