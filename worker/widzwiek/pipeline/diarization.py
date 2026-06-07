"""Etap diaryzacji (rozpoznawanie mówców).

Tryby:
- Mock (PoC) — MockDiarizationProvider (dane z mock_data).
- Hybrydowy/TBD — SingleSpeakerDiarizationProvider: realne segmenty ASR, ale
  jeden domyślny mówca, dopóki nie wepniemy prawdziwej diaryzacji (pyannote).
"""
from __future__ import annotations

from typing import Optional

from ..contracts import Speaker
from .base import DiarizationProvider, DiarizationResult, SpeechSegment
from . import mock_data


class MockDiarizationProvider(DiarizationProvider):
    name = "mock"

    def diarize(self, audio_path: Optional[str], segments: list[SpeechSegment]) -> DiarizationResult:
        return mock_data.mock_diarize(segments)


class SingleSpeakerDiarizationProvider(DiarizationProvider):
    """TBD (hybryda): nie rozpoznaje mówców — przypisuje wszystkie segmenty do
    jednego mówcy. Zgodne z kontraktem (Speaker + speaker_id). Do podmiany na
    pyannote w kolejnym etapie."""
    name = "single-speaker-tbd"

    def diarize(self, audio_path: Optional[str], segments: list[SpeechSegment]) -> DiarizationResult:
        speaker = Speaker(id="S1", label="Mówca", color="white")
        out = [SpeechSegment(s.start_ms, s.end_ms, s.text, speaker.id) for s in segments]
        return DiarizationResult(segments=out, speakers=[speaker] if out else [])


class PyannoteDiarizationProvider(DiarizationProvider):
    """TBD — pyannote.audio (wymaga tokenu Hugging Face, licencja modelu).

    Wynik: granice mówców -> przypisanie speaker_id do segmentów ASR +
    mapowanie na kolory WCAG (white/yellow/cyan/green).
    """
    name = "pyannote"

    def diarize(self, audio_path: Optional[str], segments: list[SpeechSegment]) -> DiarizationResult:
        raise NotImplementedError("PyannoteDiarizationProvider: integracja AI = TBD po GO z PoC.")


def get_diarization_provider(name: str) -> DiarizationProvider:
    if name == "pyannote":
        return PyannoteDiarizationProvider()
    if name in ("single-speaker", "single-speaker-tbd"):
        return SingleSpeakerDiarizationProvider()
    return MockDiarizationProvider()
