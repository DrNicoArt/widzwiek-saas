"""Etap ASR (transkrypcja). PoC: Mock. Docelowo: Whisper (TBD)."""
from __future__ import annotations

from typing import Optional

from ..contracts import MediaInfo
from .base import ASRProvider, SpeechSegment
from . import mock_data


class MockASRProvider(ASRProvider):
    name = "mock"

    def transcribe(self, audio_path: Optional[str], media: MediaInfo) -> list[SpeechSegment]:
        return mock_data.mock_transcribe()


class WhisperASRProvider(ASRProvider):
    """TBD — integracja Whisper (large-v3 lokalnie lub API OpenAI).

    Wariant A: openai-whisper / faster-whisper lokalnie (GPU).
    Wariant B: API OpenAI (audio.transcriptions).
    Decyzja po pomiarze jakości/kosztu na PoC (patrz docs/DECISIONS.md).
    """
    name = "whisper"

    def transcribe(self, audio_path: Optional[str], media: MediaInfo) -> list[SpeechSegment]:
        raise NotImplementedError("WhisperASRProvider: integracja AI = TBD po GO z PoC.")


def get_asr_provider(name: str) -> ASRProvider:
    if name == "whisper":
        return WhisperASRProvider()
    return MockASRProvider()
