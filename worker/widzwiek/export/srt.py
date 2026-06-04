"""Eksport do SRT. Bez kolorów (ograniczenie SRT) — zmiana mówcy oznaczana
etykietą tekstową; zgodnie z PoC SRT służy kompatybilności (YouTube itd.).

Eksport jest odseparowany od walidacji (ADR-005): dekoracje formatu (etykieta
mówcy) dodajemy tu, a nie w kanonicznych liniach Cue.
"""
from __future__ import annotations

from ..contracts import CaptionDocument, CueKind


def _ts(ms: int) -> str:
    ms = max(0, ms)
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1_000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def to_srt(doc: CaptionDocument) -> str:
    multi = len(doc.speakers) >= 2
    blocks: list[str] = []

    for cue in doc.cues:
        lines = list(cue.lines)
        if cue.kind == CueKind.speech and multi:
            sp = doc.speaker_by_id(cue.speaker_id)
            label = sp.label if sp else "Mówca"
            # etykieta mówcy w pierwszej linii (SRT nie przenosi kolorów)
            lines[0] = f"[{label}] {lines[0]}"

        block = f"{cue.index}\n{_ts(cue.start_ms)} --> {_ts(cue.end_ms)}\n" + "\n".join(lines)
        blocks.append(block)

    return "\n\n".join(blocks) + "\n"
