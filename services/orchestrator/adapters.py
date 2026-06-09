"""Interfejsy adapterów providerów + metadane zdolności.

Każdy provider (OpenAI/Deepgram/Speechmatics/AssemblyAI/ElevenLabs/Google/Azure/faster-whisper)
jest adapterem jednego rodzaju (transcription/diarization/sound_events/translation/cleanup).
Klucze to sekrety PLATFORMY (nie użytkownika). Tu definiujemy kontrakt i profile; realne
implementacje (wywołania API) dokładamy bez zmiany Routera.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional

ProviderKind = str  # "transcription" | "diarization" | "sound_events" | "translation" | "cleanup"


@dataclass(frozen=True)
class ProviderProfile:
    """Deklarowane charakterystyki providera (0..1 wyżej=lepiej; cost_per_min w centach)."""
    id: str
    kind: ProviderKind
    languages: tuple[str, ...]          # ("pl","en",...) lub ("*",) = wszystkie
    cost_per_min_cents: float
    quality: float                      # 0..1 deklarowana jakość
    speed: float                        # 0..1 (1 = najszybszy)
    reliability: float                  # 0..1
    requires_api_key: bool = True
    status: str = "available"           # available | planned | disabled
    notes: str = ""

    def supports(self, language: str) -> bool:
        return "*" in self.languages or language.lower() in self.languages


@dataclass
class TranscriptionResult:
    segments: list                      # SpeechSegment-like
    confidence: float = 0.0
    cost_cents: int = 0
    provider: str = ""
    latency_ms: int = 0


class ASRAdapter(ABC):
    profile: ProviderProfile
    @abstractmethod
    def transcribe(self, audio_ref: str, language: str, hints: Optional[dict] = None) -> TranscriptionResult: ...


# --- Rejestr profili (metadane; liczby przykładowe/TBD do kalibracji telemetrią) ---
ASR_PROFILES: tuple[ProviderProfile, ...] = (
    ProviderProfile("faster-whisper-local", "transcription", ("*",), cost_per_min_cents=0.0,  quality=0.78, speed=0.55, reliability=0.85, requires_api_key=False, notes="lokalny, no-API-first, baza kosztowa"),
    ProviderProfile("openai-whisper",       "transcription", ("*",), cost_per_min_cents=0.6,  quality=0.90, speed=0.85, reliability=0.92),
    ProviderProfile("deepgram-nova",        "transcription", ("en","pl","de","es","fr"), cost_per_min_cents=0.43, quality=0.88, speed=0.95, reliability=0.93),
    ProviderProfile("speechmatics",         "transcription", ("pl","en","de","uk"), cost_per_min_cents=0.7, quality=0.91, speed=0.7, reliability=0.9, notes="mocny w PL/UE"),
    ProviderProfile("assemblyai",           "transcription", ("en",), cost_per_min_cents=0.5, quality=0.89, speed=0.8, reliability=0.9, notes="EN-first"),
)


def asr_profiles() -> list[ProviderProfile]:
    return [p for p in ASR_PROFILES if p.status == "available"]
