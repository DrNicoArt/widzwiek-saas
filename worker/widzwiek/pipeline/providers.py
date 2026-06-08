"""Centralny wybór providerów.

Zasada produktu: no-API-first. Tryby auto/local/free wybierają lokalne i darmowe
mechanizmy. Tryb api to płatna/premium transkrypcja, nie fundament produktu.
"""
from __future__ import annotations

from dataclasses import dataclass

from ..config import Settings
from .asr import FasterWhisperASRProvider, MockASRProvider, OpenAIASRProvider, get_asr_provider
from .base import ASRProvider, DiarizationProvider, SoundEventProvider
from .diarization import (
    MockDiarizationProvider,
    HeuristicTurnDiarizationProvider,
    SingleSpeakerDiarizationProvider,
    get_diarization_provider,
)
from .sound_events import (
    MockSoundEventProvider,
    OpenAudioSoundEventProvider,
    get_sound_provider,
)

VALID_MODES = ("auto", "local", "free", "mock", "api")


@dataclass
class Providers:
    asr: ASRProvider
    diarization: DiarizationProvider
    sound_events: SoundEventProvider


def select_providers(settings: Settings) -> Providers:
    mode = (settings.pipeline_mode or "mock").lower()
    if mode not in VALID_MODES:
        raise ValueError(
            f"Nieznany PIPELINE_MODE='{settings.pipeline_mode}'. Dozwolone: {', '.join(VALID_MODES)}."
        )

    if mode == "api":
        asr: ASRProvider = OpenAIASRProvider(
            settings.openai_api_key, settings.openai_transcription_model
        )
        diar: DiarizationProvider = HeuristicTurnDiarizationProvider()
        sound: SoundEventProvider = OpenAudioSoundEventProvider() if settings.enable_sound_events else get_sound_provider("none")
    elif mode in ("auto", "local", "free"):
        asr = FasterWhisperASRProvider(settings.local_asr_model, compute_type=settings.local_asr_compute_type)
        diar = HeuristicTurnDiarizationProvider()
        sound = OpenAudioSoundEventProvider() if settings.enable_sound_events else get_sound_provider("none")
    else:  # mock
        asr = MockASRProvider()
        diar = MockDiarizationProvider()
        sound = MockSoundEventProvider()

    # Nadpisania per-etap (zaawansowane) — mają pierwszeństwo, jeśli podane.
    if settings.asr_provider:
        asr = get_asr_provider(settings.asr_provider)
    if settings.diarization_provider:
        diar = get_diarization_provider(settings.diarization_provider)
    if settings.sound_provider:
        sound = get_sound_provider(settings.sound_provider)

    return Providers(asr=asr, diarization=diar, sound_events=sound)
