"""Orkiestracja pipeline'u: ingest -> ASR -> diaryzacja -> dźwięki ->
formatowanie -> walidacja WCAG. Zwraca kompletny CaptionDocument.

Tryb wybierany jest przez PIPELINE_MODE (patrz pipeline/providers.py). Etapy po
ASR (formatowanie, WCAG, eksport) są wspólne dla obu trybów — ten sam kontrakt.
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
from .audio import AUDIO_EXT, ensure_audio
from .mock_data import MOCK_DURATION_MS
from .providers import select_providers


def _probe_media(filename: str, mode: str) -> MediaInfo:
    """Ingest. Czas trwania: w trybie mock stały (z mock_data), w trybie api
    ustalany później na podstawie transkrypcji. TBD: ffprobe dla realnego czasu."""
    ext = os.path.splitext(filename or "")[1].lower()
    kind = SourceKind.audio if ext in AUDIO_EXT else SourceKind.video
    duration = MOCK_DURATION_MS if mode == "mock" else 0
    return MediaInfo(filename=filename or "sample", source_kind=kind,
                     duration_ms=duration, language="pl")


def run_pipeline(filename: str, audio_path: Optional[str] = None) -> CaptionDocument:
    mode = (settings.pipeline_mode or "mock").lower()
    providers = select_providers(settings)
    media = _probe_media(filename, mode)

    # Obsługa pliku wejściowego (audio/wideo) — istotne tylko w trybie api.
    prepared = None
    asr_input = audio_path
    if mode == "api":
        prepared = ensure_audio(audio_path or "", filename)
        asr_input = prepared.path

    try:
        # 2) ASR
        segments = providers.asr.transcribe(asr_input, media)
        # 3) Diaryzacja
        diar_result = providers.diarization.diarize(asr_input, segments)
        # 4) Dźwięki niewerbalne
        sounds = providers.sound_events.detect(asr_input, media)
    finally:
        if prepared and prepared.cleanup:
            try:
                os.unlink(prepared.path)
            except OSError:
                pass

    # 5) Formatowanie napisów
    cues = formatter.build_cues(diar_result.segments, sounds)

    # Czas trwania z transkrypcji (tryb api), jeśli nie znany z ingest.
    if media.duration_ms == 0 and cues:
        media.duration_ms = max(c.end_ms for c in cues)

    doc = CaptionDocument(
        media=media,
        speakers=diar_result.speakers,
        cues=cues,
        meta=DocumentMeta(pipeline=PipelineMeta(
            asr=providers.asr.name,
            diarization=providers.diarization.name,
            sound_events=providers.sound_events.name,
        )),
    )
    # 6) Walidacja WCAG
    doc.wcag = validate(doc)
    return doc
