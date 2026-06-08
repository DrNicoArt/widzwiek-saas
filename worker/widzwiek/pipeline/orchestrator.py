"""No-API-first Provider Orchestrator.

Orkiestrator ma najpierw używać źródeł i modeli niewymagających płatnych API:
captions z platform/importu, FFmpeg, lokalny ASR, lokalna/heurystyczna diarizacja,
VAD/speech-music-noise/sound events. Płatne API są warstwą premium/fallback.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from statistics import mean
from typing import Iterable

from ..contracts import CaptionDocument, ProcessingDecisionMeta, QualityScores
from ..wcag import rules
from .base import DiarizationResult, SoundEvent, SpeechSegment


@dataclass(frozen=True)
class ProviderCapability:
    id: str
    kind: str
    status: str
    cost: str
    speed: str
    quality: str
    requires_api_key: bool
    capabilities: tuple[str, ...]
    notes: str = ""


@dataclass
class ProcessingDecision:
    strategy: str = "automatic"
    transcript_source: str = "local-asr"
    asr_provider: str = "faster-whisper-local"
    diarization_provider: str = "heuristic-turns"
    sound_provider: str = "open-audio-events"
    no_api_first: bool = True
    fallback_used: bool = False
    fallbacks: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)

    def to_meta(self) -> ProcessingDecisionMeta:
        return ProcessingDecisionMeta(
            strategy=self.strategy,
            transcript_source=self.transcript_source,
            no_api_first=self.no_api_first,
            fallback_used=self.fallback_used,
            fallbacks=self.fallbacks,
            notes=self.notes,
        )


PROVIDER_REGISTRY: tuple[ProviderCapability, ...] = (
    ProviderCapability("platform-captions", "transcript_source", "planned", "free", "fast", "source-dependent", False, ("captions_import",), "yt-dlp/provider adapters"),
    ProviderCapability("yt-dlp-captions", "transcript_source", "available", "free", "fast", "source-dependent", False, ("captions_import", "url_metadata"), "creator/auto captions where available"),
    ProviderCapability("srt-vtt-import", "transcript_source", "active_demo", "free", "instant", "source-dependent", False, ("captions_import",), "already wired"),
    ProviderCapability("ffmpeg-audio", "ingest", "available", "free", "fast", "stable", False, ("url_audio_extract", "media_probe"), "local binary"),
    ProviderCapability("faster-whisper", "transcription", "available", "free", "standard", "high", False, ("batch_asr", "word_timestamps"), "local CTranslate2 Whisper"),
    ProviderCapability("whisperx", "alignment", "planned", "free", "standard", "high", False, ("forced_alignment", "word_timestamps", "speaker_diarization"), "optional future local stack"),
    ProviderCapability("silero-vad", "vad", "planned", "free", "fast", "high", False, ("voice_activity_detection",), "optional local model"),
    ProviderCapability("ina-speech-segmenter", "sound_events", "available", "free", "standard", "standard", False, ("sound_events", "music_detection", "vad"), "optional local model if installed"),
    ProviderCapability("speechbrain", "diarization", "planned", "free", "standard", "high", False, ("speaker_diarization", "speaker_recognition"), "optional open-source toolkit"),
    ProviderCapability("pyannote", "diarization", "planned", "free/premium", "standard", "high", True, ("speaker_diarization", "vad"), "often needs accepted model/token"),
    ProviderCapability("openai", "transcription", "premium", "paid", "fast", "high", True, ("batch_asr", "word_timestamps"), "premium fallback"),
)


def registry_snapshot() -> list[dict]:
    return [p.__dict__ | {"capabilities": list(p.capabilities)} for p in PROVIDER_REGISTRY]


def wcag_score(doc: CaptionDocument) -> float:
    if not doc.cues:
        return 0.0
    errors = doc.wcag.stats.error_count
    warnings = doc.wcag.stats.warning_count
    penalty = min(1.0, errors * 0.25 + warnings * 0.06)
    return round(max(0.0, 1.0 - penalty), 3)


def _avg_conf(items: Iterable[object], default: float) -> float:
    vals = [float(getattr(x, "confidence", 0.0) or 0.0) for x in items]
    vals = [v for v in vals if v > 0]
    return round(mean(vals), 3) if vals else default


def segmentation_score(segments: list[SpeechSegment]) -> float:
    if not segments:
        return 0.0
    ok = 0
    for s in segments:
        dur = max(1, s.end_ms - s.start_ms)
        line_len = len(s.text)
        cps = line_len / (dur / 1000)
        if dur <= rules.MAX_DURATION_MS and cps <= rules.MAX_CHARS_PER_SECOND + 3:
            ok += 1
    return round(ok / len(segments), 3)


def completeness_score(doc: CaptionDocument, speech: list[SpeechSegment], sounds: list[SoundEvent]) -> float:
    score = 0.25
    if speech:
        score += 0.35
    if doc.speakers:
        score += 0.15
    if sounds or any(c.kind.value == "sound" for c in doc.cues):
        score += 0.15
    if doc.media.duration_ms and doc.cues:
        covered = sum(max(0, c.end_ms - c.start_ms) for c in doc.cues)
        score += min(0.10, covered / max(1, doc.media.duration_ms) * 0.10)
    return round(min(1.0, score), 3)


def apply_quality(
    doc: CaptionDocument,
    decision: ProcessingDecision,
    speech: list[SpeechSegment],
    diarization: DiarizationResult,
    sounds: list[SoundEvent],
) -> CaptionDocument:
    wcag = wcag_score(doc)
    transcription = _avg_conf(speech, 0.55 if decision.fallback_used else 0.72)
    diar = 0.45 if diarization.speakers else 0.0
    if diarization.speakers and len(diarization.speakers) > 1:
        diar = 0.62
    sound_score = _avg_conf(sounds, 0.35 if sounds else 0.0)
    segment_score = segmentation_score(speech)
    complete = completeness_score(doc, speech, sounds)
    overall = round(mean([transcription, diar, max(sound_score, 0.35), segment_score, wcag, complete]), 3)
    doc.meta.decision = decision.to_meta()
    doc.meta.quality = QualityScores(
        transcription=transcription,
        diarization=diar,
        sound_events=sound_score,
        segmentation=segment_score,
        wcag=wcag,
        completeness=complete,
        overall=overall,
    )
    return doc
