from collections import Counter
from pathlib import Path

import numpy as np
from ultralytics import YOLO

from .config import CONFIDENCE_THRESHOLD


def run_inference(model: YOLO, source: Path | np.ndarray) -> list[dict]:
    """Run YOLO on a single image or frame.

    Returns list of {name, quantity, confidence}.
    """
    input_src = str(source) if isinstance(source, Path) else source
    results = model(input_src, verbose=False)

    detections: list[tuple[str, float]] = []
    for r in results:
        for box in r.boxes:
            conf = float(box.conf[0])
            if conf < CONFIDENCE_THRESHOLD:
                continue
            cls_id = int(box.cls[0])
            name = model.names[cls_id]
            detections.append((name, conf))

    if not detections:
        return []

    counts: Counter[str] = Counter()
    conf_sums: dict[str, float] = {}
    for name, conf in detections:
        counts[name] += 1
        conf_sums[name] = conf_sums.get(name, 0.0) + conf

    return [
        {
            "name": name.replace("_", " ").title(),
            "quantity": qty,
            "confidence": round(conf_sums[name] / qty, 3),
        }
        for name, qty in counts.items()
    ]


def aggregate_detections(all_items: list[list[dict]]) -> list[dict]:
    """Merge detections from multiple images into a single item list."""
    total_counts: Counter[str] = Counter()
    total_conf: dict[str, float] = {}
    total_det: dict[str, int] = {}

    for items in all_items:
        for item in items:
            name = item["name"]
            qty = item["quantity"]
            conf = item["confidence"]
            total_counts[name] += qty
            total_conf[name] = total_conf.get(name, 0.0) + conf * qty
            total_det[name] = total_det.get(name, 0) + qty

    return [
        {
            "name": name,
            "quantity": qty,
            "confidence": round(total_conf[name] / total_det[name], 3),
        }
        for name, qty in total_counts.most_common()
    ]
