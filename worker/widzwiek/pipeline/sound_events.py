"""Etap detekcji dźwięków niewerbalnych.

Tryby:
- Mock (PoC) — MockSoundEventProvider (przykładowe [oklaski], [muzyka]...).
- TBD — NoopSoundEventProvider: nic nie wykrywa (zamiast zmyślać dźwięki dla
  realnego audio). Walidator WCAG zgłosi wtedy INFO o braku opisów dźwięków.
"""
from __future__ import annotations

from typing import Optional

from ..contracts import MediaInfo
from .base import SoundEvent, SoundEventProvider
from . import mock_data


class MockSoundEventProvider(SoundEventProvider):
    name = "mock"

    def detect(self, audio_path: Optional[str], media: MediaInfo) -> list[SoundEvent]:
        return mock_data.mock_sounds()


class NoopSoundEventProvider(SoundEventProvider):
    """TBD: brak detekcji dźwięków niewerbalnych (placeholder dla trybu API)."""
    name = "noop-tbd"

    def detect(self, audio_path: Optional[str], media: MediaInfo) -> list[SoundEvent]:
        return []


class AudioTaggingSoundEventProvider(SoundEventProvider):
    """TBD — klasyfikacja zdarzeń dźwiękowych.

    Wariant A: model audio-tagging (YAMNet / PANNs) -> mapowanie etykiet na
               polskie opisy [muzyka], [oklaski], [pukanie]...
    Wariant B: LLM po transkrypcji + cechy audio (do walidacji jakości na PoC).
    """
    name = "yamnet"

    def detect(self, audio_path: Optional[str], media: MediaInfo) -> list[SoundEvent]:
        raise NotImplementedError("AudioTaggingSoundEventProvider: integracja AI = TBD po GO z PoC.")


def get_sound_provider(name: str) -> SoundEventProvider:
    if name in ("yamnet", "panns"):
        return AudioTaggingSoundEventProvider()
    if name in ("noop", "noop-tbd", "none"):
        return NoopSoundEventProvider()
    return MockSoundEventProvider()
