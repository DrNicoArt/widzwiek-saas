"""Kontrakt danych Widźwięku — jedyne źródło prawdy.

Jeden obiekt `CaptionDocument` płynie przez cały pipeline (ASR -> diaryzacja ->
dźwięki -> formatowanie -> WCAG -> eksport) i jest też odpowiedzią API do frontendu.

Patrz docs/DATA_CONTRACT.md. Schema JSON: contracts/caption_document.schema.json
(generowana z tych modeli przez `python -m widzwiek.export_schema`).
"""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, Field

SCHEMA_VERSION = "1.0"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# --- Słowniki / enumy ---------------------------------------------------------

class SourceKind(str, Enum):
    audio = "audio"
    video = "video"


class CueKind(str, Enum):
    speech = "speech"   # wypowiedź mówcy
    sound = "sound"     # dźwięk niewerbalny, np. [oklaski]


class Severity(str, Enum):
    error = "error"      # łamie WCAG AA -> compliant = False
    warning = "warning"  # do poprawy, nie łamie zgodności
    info = "info"        # informacja / TBD


# Kolory mówców zgodne z WCAG (kolejność = priorytet przydziału)
WCAG_SPEAKER_COLORS = ["white", "yellow", "cyan", "green"]


# --- Modele -------------------------------------------------------------------

class MediaInfo(BaseModel):
    filename: str
    source_kind: SourceKind
    duration_ms: int = Field(ge=0)
    language: str = "pl"


class Speaker(BaseModel):
    id: str
    label: str                       # etykieta tekstowa, np. "Lektor"
    color: str = "white"             # kolor WCAG dla VTT


class Cue(BaseModel):
    id: str
    index: int = Field(ge=1)         # kolejność wyświetlania / numer SRT
    start_ms: int = Field(ge=0)
    end_ms: int = Field(ge=0)
    kind: CueKind
    speaker_id: Optional[str] = None  # None dla dźwięku lub nieznanego mówcy
    lines: list[str]                  # 1-2 linie (limit WCAG)
    text: str                         # pełny, niepołamany tekst

    @property
    def duration_ms(self) -> int:
        return self.end_ms - self.start_ms

    @property
    def char_count(self) -> int:
        return sum(len(l) for l in self.lines)


class WcagIssue(BaseModel):
    code: str
    severity: Severity
    message: str
    cue_id: Optional[str] = None
    field: Optional[str] = None


class WcagStats(BaseModel):
    cue_count: int = 0
    error_count: int = 0
    warning_count: int = 0


class WcagReport(BaseModel):
    target: str = "WCAG 2.1 AA"
    compliant: bool = False          # KLUCZOWA wartość produktu: TAK/NIE
    generated_at: str = Field(default_factory=_now_iso)
    stats: WcagStats = Field(default_factory=WcagStats)
    issues: list[WcagIssue] = Field(default_factory=list)


class PipelineMeta(BaseModel):
    asr: str = "mock"
    diarization: str = "mock"
    sound_events: str = "mock"


class DocumentMeta(BaseModel):
    generated_at: str = Field(default_factory=_now_iso)
    pipeline: PipelineMeta = Field(default_factory=PipelineMeta)


class CaptionDocument(BaseModel):
    schema_version: Literal["1.0"] = SCHEMA_VERSION
    media: MediaInfo
    speakers: list[Speaker] = Field(default_factory=list)
    cues: list[Cue] = Field(default_factory=list)
    wcag: WcagReport = Field(default_factory=WcagReport)
    meta: DocumentMeta = Field(default_factory=DocumentMeta)

    def speaker_by_id(self, speaker_id: Optional[str]) -> Optional[Speaker]:
        if speaker_id is None:
            return None
        return next((s for s in self.speakers if s.id == speaker_id), None)


# --- Modele API ---------------------------------------------------------------

class JobStatus(str, Enum):
    queued = "queued"
    processing = "processing"
    done = "done"
    error = "error"


class Job(BaseModel):
    id: str
    status: JobStatus = JobStatus.queued
    created_at: str = Field(default_factory=_now_iso)
    updated_at: str = Field(default_factory=_now_iso)
    filename: Optional[str] = None
    error: Optional[str] = None
    result: Optional[CaptionDocument] = None
