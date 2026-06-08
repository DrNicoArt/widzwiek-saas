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
        result = mock_data.mock_diarize(segments)
        result.segments = [
            SpeechSegment(s.start_ms, s.end_ms, s.text, s.speaker_id, confidence=s.confidence or 0.86, source=s.source or self.name)
            for s in result.segments
        ]
        return result


class SingleSpeakerDiarizationProvider(DiarizationProvider):
    """TBD (hybryda): nie rozpoznaje mówców — przypisuje wszystkie segmenty do
    jednego mówcy. Zgodne z kontraktem (Speaker + speaker_id). Do podmiany na
    pyannote w kolejnym etapie."""
    name = "single-speaker-tbd"

    def diarize(self, audio_path: Optional[str], segments: list[SpeechSegment]) -> DiarizationResult:
        speaker = Speaker(id="S1", label="Mówca", color="white")
        out = [SpeechSegment(s.start_ms, s.end_ms, s.text, speaker.id, s.confidence, s.source) for s in segments]
        return DiarizationResult(segments=out, speakers=[speaker] if out else [])


class HeuristicTurnDiarizationProvider(DiarizationProvider):
    """No-key MVP: segmentacja tur rozmowy na podstawie pauz i znaków dialogu.

    Nie udaje biometrycznej identyfikacji mówcy. Daje jednak czytelne speaker turns
    i realnie wpływa na captions/WCAG bez płatnego API.
    """
    name = "heuristic-turns"

    def diarize(self, audio_path: Optional[str], segments: list[SpeechSegment]) -> DiarizationResult:
        if not segments:
            return DiarizationResult(segments=[], speakers=[])
        speakers = [
            Speaker(id="S1", label="Mówca 1", color="white"),
            Speaker(id="S2", label="Mówca 2", color="yellow"),
        ]
        current = 0
        out: list[SpeechSegment] = []
        prev_end = None
        for seg in segments:
            text = seg.text.strip()
            gap = 0 if prev_end is None else max(0, seg.start_ms - prev_end)
            dialogue_marker = text.startswith(("-", "–", "—")) or text.endswith("?")
            if out and (gap >= 1200 or dialogue_marker):
                current = 1 - current
            speaker_id = speakers[current].id
            out.append(SpeechSegment(seg.start_ms, seg.end_ms, text.lstrip("-–— ").strip(), speaker_id, seg.confidence, seg.source))
            prev_end = seg.end_ms
        used_ids = {s.speaker_id for s in out}
        return DiarizationResult(segments=out, speakers=[s for s in speakers if s.id in used_ids])


class PyannoteDiarizationProvider(DiarizationProvider):
    """TBD — pyannote.audio (wymaga tokenu Hugging Face, licencja modelu).

    Wynik: granice mówców -> przypisanie speaker_id do segmentów ASR +
    mapowanie na kolory WCAG (white/yellow/cyan/green).
    """
    name = "pyannote"

    def diarize(self, audio_path: Optional[str], segments: list[SpeechSegment]) -> DiarizationResult:
        raise NotImplementedError("PyannoteDiarizationProvider: integracja AI = TBD po GO z PoC.")


def get_diarization_provider(name: str) -> DiarizationProvider:
    if name in ("heuristic", "heuristic-turns", "turns"):
        return HeuristicTurnDiarizationProvider()
    if name == "pyannote":
        return PyannoteDiarizationProvider()
    if name in ("single-speaker", "single-speaker-tbd"):
        return SingleSpeakerDiarizationProvider()
    return MockDiarizationProvider()
