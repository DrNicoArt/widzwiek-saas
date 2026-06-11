"""Rejestr zuzycia (append-only) — fundament billingu. Jednostka: MINUTA ZGODNOSCI WCAG
(niezalezna od providera). Per organizacja, plik JSONL w storage. Docelowo -> tabela usage_events
(infra/db/0001_init.sql) bez zmiany logiki naliczania.
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from math import ceil

from .config import settings
from .contracts import CaptionDocument, CueKind


def wcag_minutes(doc: CaptionDocument) -> int:
    """Minuty audio * mnoznik kompozycji (mowcy/dzwieki/raport). Niezalezne od providera."""
    dur_ms = doc.media.duration_ms or 0
    base = max(1, ceil(dur_ms / 60000)) if dur_ms > 0 else 0
    if base == 0:
        return 0
    has_speakers = len(doc.speakers) >= 1
    has_sounds = any(c.kind == CueKind.sound for c in doc.cues)
    mult = 1.0 + (0.3 if has_speakers else 0.0) + (0.3 if has_sounds else 0.0) + 0.1  # raport zawsze
    return ceil(base * mult)


def _path(org_id: str) -> str:
    d = os.path.join(settings.storage_dir or "./storage", "usage")
    os.makedirs(d, exist_ok=True)
    return os.path.join(d, f"{org_id}.jsonl")


def record(org_id: str, job_id: str, doc: CaptionDocument) -> dict:
    qty = wcag_minutes(doc)
    ev = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "org_id": org_id, "job_id": job_id,
        "unit": "wcag_minute", "quantity": qty, "credits": qty,
    }
    try:
        with open(_path(org_id), "a", encoding="utf-8") as f:
            f.write(json.dumps(ev, ensure_ascii=False) + "\n")
    except OSError:
        pass  # rejestr zuzycia jest best-effort; nie blokuje wyniku
    return ev


def summary(org_id: str) -> dict:
    total_min = 0
    total_credits = 0.0
    count = 0
    path = _path(org_id)
    if os.path.isfile(path):
        with open(path, encoding="utf-8") as f:
            for line in f:
                try:
                    e = json.loads(line)
                except Exception:  # noqa: BLE001
                    continue
                total_min += int(e.get("quantity", 0))
                total_credits += float(e.get("credits", 0))
                count += 1
    return {"org_id": org_id, "events": count, "wcag_minutes": total_min, "credits": round(total_credits, 2)}
