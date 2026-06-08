"""Interfejsy etapów AI + typy pośrednie pipeline'u.

Silniki AI (ASR, diaryzacja, dźwięki) są ukryte za interfejsami, żeby dało się
podmienić model po wynikach PoC bez ruszania reszty (ADR-004). Na PoC używamy
implementacji Mock* z mock_data.py; realne providery to TBD.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional

from ..contracts import MediaInfo, Speaker


# --- Typy pośrednie (przed formatowaniem w Cue) -------------------------------

@dataclass
class SpeechSegment:
    start_ms: int
    end_ms: int
    text: str
    speaker_id: Optional[str] = None
    confidence: float = 0.0
    source: str = "unknown"


@dataclass
class SoundEvent:
    start_ms: int
    end_ms: int
    label: str  # opis w nawiasach kwadratowych, np. "[oklaski]"
    confidence: float = 0.0
    source: str = "unknown"
    relevance: str = "unknown"


@dataclass
class DiarizationResult:
    segments: list[SpeechSegment]
    speakers: list[Speaker] = field(default_factory=list)


# --- Interfejsy AI ------------------------------------------------------------

class ASRProvider(ABC):
    """Transkrypcja mowy -> segmenty z czasami."""
    name: str = "abstract"

    @abstractmethod
    def transcribe(self, audio_path: Optional[str], media: MediaInfo) -> list[SpeechSegment]:
        ...


class DiarizationProvider(ABC):
    """Rozpoznawanie mówców -> przypisanie speaker_id + lista mówców."""
    name: str = "abstract"

    @abstractmethod
    def diarize(self, audio_path: Optional[str], segments: list[SpeechSegment]) -> DiarizationResult:
        ...


class SoundEventProvider(ABC):
    """Detekcja dźwięków niewerbalnych -> opisy [muzyka], [oklaski]..."""
    name: str = "abstract"

    @abstractmethod
    def detect(
        self,
        audio_path: Optional[str],
        media: MediaInfo,
        speech_segments: Optional[list[SpeechSegment]] = None,
    ) -> list[SoundEvent]:
        ...
