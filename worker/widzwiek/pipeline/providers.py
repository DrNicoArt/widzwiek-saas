"""Centralny wybór silników pipeline'u na podstawie PIPELINE_MODE.

To jedyne miejsce, które tłumaczy tryb -> konkretne providery. Dzięki temu
dodanie realnego etapu nie narusza orkiestracji (runner) ani kontraktu danych.

- mock : pełna symulacja (jak dotychczas) — działa bez kluczy API.
- api  : realna transkrypcja (OpenAI) + diaryzacja/dźwięki jako TBD.

Nadpisania per-etap (WIDZWIEK_*_PROVIDER) mają pierwszeństwo, jeśli ustawione.
"""
from __future__ import annotations

from dataclasses import dataclass

from ..config import Settings
from .asr import MockASRProvider, OpenAIASRProvider, get_asr_provider
from .base import ASRProvider, DiarizationProvider, SoundEventProvider
from .diarization import (
    MockDiarizationProvider,
    SingleSpeakerDiarizationProvider,
    get_diarization_provider,
)
from .sound_events import (
    MockSoundEventProvider,
    NoopSoundEventProvider,
    get_sound_provider,
)

VALID_MODES = ("mock", "api")


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
        diar: DiarizationProvider = SingleSpeakerDiarizationProvider()   # TBD
        sound: SoundEventProvider = NoopSoundEventProvider()             # TBD
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
