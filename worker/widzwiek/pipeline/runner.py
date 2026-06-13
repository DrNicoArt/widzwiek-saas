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
    Severity,
    SourceKind,
    WcagIssue,
)
from ..wcag import validate
from . import formatter
from .audio import AUDIO_EXT, ensure_audio, probe_duration_ms
from .flash import analyze_video_flashes
from .mock_data import MOCK_DURATION_MS
from .orchestrator import ProcessingDecision, apply_quality
from .providers import select_providers
from . import mock_data


def _probe_media(filename: str, mode: str, audio_path: Optional[str] = None) -> MediaInfo:
    """Ingest. Czas trwania: w trybie mock staly (mock_data); w trybie api realny
    przez ffprobe (bez API), a gdy niedostepny - 0 i dopelnienie z transkrypcji."""
    ext = os.path.splitext(filename or "")[1].lower()
    kind = SourceKind.audio if ext in AUDIO_EXT else SourceKind.video
    duration = MOCK_DURATION_MS if mode == "mock" else probe_duration_ms(audio_path)
    return MediaInfo(filename=filename or "sample", source_kind=kind,
                     duration_ms=duration, language="pl")


def run_pipeline(filename: str, audio_path: Optional[str] = None) -> CaptionDocument:
    mode = (settings.pipeline_mode or "mock").lower()
    providers = select_providers(settings)
    media = _probe_media(filename, mode, audio_path)
    decision = ProcessingDecision(
        strategy=settings.processing_strategy,
        transcript_source="mock" if mode == "mock" else "local-file-asr",
        asr_provider=providers.asr.name,
        diarization_provider=providers.diarization.name,
        sound_provider=providers.sound_events.name,
        no_api_first=mode != "api",
    )

    # Obsługa wejścia — no-API-first i odporność: brak pliku/modeli => transkrypt demonstracyjny,
    # zamiast wywalać job. Realny ASR uruchamiamy tylko, gdy jest plik i dostępne modele.
    prepared = None
    asr_input = audio_path

    def _demo_segments():
        decision.fallback_used = True
        decision.transcript_source = "demo"
        media.duration_ms = media.duration_ms or MOCK_DURATION_MS
        return mock_data.mock_transcribe()

    try:
        # 1) Ekstrakcja audio (tylko realne tryby z plikiem; awaria => fallback w trybach no-key)
        if mode != "mock" and audio_path:
            try:
                prepared = ensure_audio(audio_path or "", filename)
                asr_input = prepared.path
            except Exception as exc:  # noqa: BLE001
                if mode == "api":
                    raise
                decision.fallbacks.append("audio-extract -> demo-transcript")
                decision.notes.append(f"Ekstrakcja audio niedostępna: {exc}")
                asr_input = None

        # 2) ASR / źródło transkryptu
        if mode == "mock":
            segments = providers.asr.transcribe(asr_input, media)
        elif not asr_input:
            if mode == "api":
                raise FileNotFoundError("Tryb API wymaga pliku audio/wideo.")
            decision.notes.append("Brak pliku — użyto demonstracyjnego transkryptu (no-API-first).")
            segments = _demo_segments()
        else:
            try:
                segments = providers.asr.transcribe(asr_input, media)
            except Exception as exc:  # noqa: BLE001
                if mode in ("auto", "local", "free"):
                    decision.fallbacks.append(f"{providers.asr.name} -> demo-transcript")
                    decision.notes.append(f"Lokalny ASR niedostępny: {exc}")
                    segments = _demo_segments()
                else:
                    raise

        # 3) Diaryzacja  4) Dźwięki niewerbalne
        diar_result = providers.diarization.diarize(asr_input, segments)
        sounds = providers.sound_events.detect(asr_input, media, diar_result.segments)
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

    # 6a) Detekcja migotania (WCAG 2.3.1) — tylko wideo, gdy włączone i jest plik źródłowy.
    if settings.flash_detection and media.source_kind == SourceKind.video and audio_path:
        try:
            fr = analyze_video_flashes(audio_path)
            if fr.analyzed and not fr.passed:
                where = f" (ok. {fr.worst_time_s:.0f}s)" if fr.worst_time_s is not None else ""
                doc.wcag.issues.append(WcagIssue(
                    code="FLASH_2_3_1", severity=Severity.error,
                    message=(f"Wykryto ryzyko migotania{where}: ~{fr.flashes_per_sec:.1f} błysków/s "
                             "(WCAG 2.3.1, próg 3/s). Przesiewowo — zweryfikuj fragment."),
                ))
                doc.wcag.stats.error_count += 1
                doc.wcag.compliant = doc.wcag.stats.error_count == 0
                decision.notes.append("Analiza migotania (2.3.1): wykryto ryzyko — dodano do raportu.")
            elif fr.analyzed:
                decision.notes.append("Analiza migotania (2.3.1): brak ryzyka.")
        except Exception as exc:  # noqa: BLE001
            decision.notes.append(f"Analiza migotania pominięta: {exc}")

    return apply_quality(doc, decision, segments, diar_result, sounds)


def run_pipeline_from_segments(
    filename: str,
    segments,
    sounds=None,
    transcript_source: str = "captions-import",
) -> CaptionDocument:
    """Buduje dokument z gotowych napisów/transkryptu bez ASR."""
    providers = select_providers(settings)
    media = _probe_media(filename, "captions", None)
    media.duration_ms = max((s.end_ms for s in segments), default=0)
    decision = ProcessingDecision(
        strategy=settings.processing_strategy,
        transcript_source=transcript_source,
        asr_provider="not-used",
        diarization_provider=providers.diarization.name,
        sound_provider=providers.sound_events.name,
        no_api_first=True,
    )
    diar_result = providers.diarization.diarize(None, segments)
    sound_events = sounds or []
    cues = formatter.build_cues(diar_result.segments, sound_events)
    doc = CaptionDocument(
        media=media,
        speakers=diar_result.speakers,
        cues=cues,
        meta=DocumentMeta(pipeline=PipelineMeta(
            asr="not-used",
            diarization=providers.diarization.name,
            sound_events=providers.sound_events.name,
        )),
    )
    doc.wcag = validate(doc)
    return apply_quality(doc, decision, diar_result.segments, diar_result, sound_events)
