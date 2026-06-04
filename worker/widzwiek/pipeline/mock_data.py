"""Przykladowy material PL dla mock pipeline (ADR-007).

Sekwencyjna os czasu (~30 s): lektor + ekspertka + dzwieki niewerbalne.
Skomponowana tak, by raport WCAG = TAK z jednym ostrzezeniem (linia 42 zn.),
co pokazuje wartosc raportu (wykrywanie i listowanie problemow).
"""
from __future__ import annotations

from ..contracts import Speaker
from .base import DiarizationResult, SoundEvent, SpeechSegment

MOCK_DURATION_MS = 30000

MOCK_SPEAKERS = [
    Speaker(id="S1", label="Lektor", color="white"),
    Speaker(id="S2", label="Ekspertka", color="yellow"),
]

# 42-znakowa pierwsza wypowiedz -> swiadome ostrzezenie (zalecane <=37 zn.)
MOCK_SPEECH = [
    SpeechSegment(3500, 7500, "Dzień dobry, witam w naszym kursie online.", "S1"),
    SpeechSegment(9000, 13000, "Dziś wyjaśnimy, czym są napisy zgodne z WCAG.", "S1"),
    SpeechSegment(20500, 24500, "Napisy to nie tylko tekst. To też opis dźwięków otoczenia.", "S2"),
    SpeechSegment(26000, 29500, "Dzięki temu materiał jest dostępny dla każdego widza.", "S2"),
]

MOCK_SOUNDS = [
    SoundEvent(0, 2000, "[muzyka spokojna w tle]"),
    SoundEvent(14500, 16000, "[oklaski]"),
    SoundEvent(17500, 19000, "[pukanie do drzwi]"),
]


def mock_transcribe():
    return [SpeechSegment(s.start_ms, s.end_ms, s.text) for s in MOCK_SPEECH]


def mock_diarize(segments):
    speaker_by_text = {s.text: s.speaker_id for s in MOCK_SPEECH}
    out = []
    for seg in segments:
        out.append(SpeechSegment(seg.start_ms, seg.end_ms, seg.text,
                                 speaker_by_text.get(seg.text, "S1")))
    return DiarizationResult(segments=out, speakers=list(MOCK_SPEAKERS))


def mock_sounds():
    return list(MOCK_SOUNDS)
