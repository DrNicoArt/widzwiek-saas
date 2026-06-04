"""Etap diaryzacji (rozpoznawanie mówców). PoC: Mock. Docelowo: pyannote (TBD)."""
from __future__ import annotations

from typing import Optional

from .base import DiarizationProvider, DiarizationResult, SpeechSegment
from . import mock_data


class MockDiarizationProvider(DiarizationProvider):
    name = "mock"

    def diarize(self, audio_path: Optional[str], segments: list[SpeechSegment]) -> DiarizationResult:
        return mock_data.mock_diarize(segments)


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
    return MockDiarizationProvider()
