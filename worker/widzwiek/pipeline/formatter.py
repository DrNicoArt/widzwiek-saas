"""Formatowanie napisow: segmenty mowy + dzwieki -> Cue (1-2 linie, timing).

Deterministyczne, bez AI. Lamie tekst na maks. 2 linie <= limitu znakow,
laczy mowe i dzwieki w jedna os czasu, nadaje kolejnosc (index).
Patrz docs/WCAG.md (parametry) i docs/DATA_CONTRACT.md (Cue).
"""
from __future__ import annotations

from ..contracts import Cue, CueKind
from ..wcag import rules
from .base import SoundEvent, SpeechSegment


def wrap_two_lines(text: str, max_chars: int = rules.MAX_CHARS_PER_LINE) -> list[str]:
    words = text.split()
    if not words:
        return [""]
    if len(text) <= max_chars:
        return [text]

    best_split = 1
    best_score = None
    for i in range(1, len(words)):
        left = " ".join(words[:i])
        right = " ".join(words[i:])
        diff = abs(len(left) - len(right))
        penalty = 0 if (len(left) <= max_chars and len(right) <= max_chars) else 10_000
        score = diff + penalty
        if best_score is None or score < best_score:
            best_score = score
            best_split = i

    left = " ".join(words[:best_split])
    right = " ".join(words[best_split:])
    return [left, right]


def build_cues(speech, sounds):
    raw = []
    for seg in speech:
        raw.append(dict(start_ms=seg.start_ms, end_ms=seg.end_ms, kind=CueKind.speech,
                        speaker_id=seg.speaker_id, lines=wrap_two_lines(seg.text), text=seg.text))
    for ev in sounds:
        raw.append(dict(start_ms=ev.start_ms, end_ms=ev.end_ms, kind=CueKind.sound,
                        speaker_id=None, lines=[ev.label], text=ev.label))
    raw.sort(key=lambda r: (r["start_ms"], r["end_ms"]))
    cues = []
    for i, r in enumerate(raw, start=1):
        cues.append(Cue(id=f"c{i}", index=i, **r))
    return cues
