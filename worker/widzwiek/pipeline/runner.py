"""Orkiestracja pipeline'u: ingest -> ASR -> diaryzacja -> dźwięki ->
formatowanie -> walidacja WCAG. Zwraca kompletny CaptionDocument.
"""
from __future__ import annotations

import os
from typing import Optional

from ..config import settings
from ..contracts import (
    CaptionDocument,
    DocumentMeta,
    MediaInfo,
    PipelineMeta,
    SourceKind,
)
from ..wcag import validate
from . import formatter
from .asr import get_asr_provider
from .diarization import get_diarization_provider
from .mock_data import MOCK_DURATION_MS
from .sound_events import get_sound_provider

_AUDIO_EXT = {".mp3", ".wav", ".m4a", ".flac", ".aac", ".ogg"}


def _probe_media(filename: str, audio_path: Optional[str]) -> MediaInfo:
    """Ingest. PoC: heurystyka po rozszerzeniu + długość z mocka.
    TBD: ffprobe (realny czas trwania, ekstrakcja audio z wideo)."""
    ext = os.path.splitext(filename or "")[1].lower()
    kind = SourceKind.audio if ext in _AUDIO_EXT else SourceKind.video
    return MediaInfo(filename=filename or "sample", source_kind=kind,
                     duration_ms=MOCK_DURATION_MS, language="pl")


def run_pipeline(filename: str, audio_path: Optional[str] = None) -> CaptionDocument:
    media = _probe_media(filename, audio_path)

    asr = get_asr_provider(settings.asr_provider)
    diar = get_diarization_provider(settings.diarization_provider)
    sound = get_sound_provider(settings.sound_provider)

    # 2) ASR
    segments = asr.transcribe(audio_path, media)
    # 3) Diaryzacja
    diar_result = diar.diarize(audio_path, segments)
    # 4) Dźwięki niewerbalne
    sounds = sound.detect(audio_path, media)
    # 5) Formatowanie napisów
    cues = formatter.build_cues(diar_result.segments, sounds)

    doc = CaptionDocument(
        media=media,
        speakers=diar_result.speakers,
        cues=cues,
        meta=DocumentMeta(pipeline=PipelineMeta(
            asr=asr.name, diarization=diar.name, sound_events=sound.name,
        )),
    )
    # 6) Walidacja WCAG
    doc.wcag = validate(doc)
    return doc
