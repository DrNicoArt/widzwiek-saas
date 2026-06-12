"""URL captions ingestion bez płatnych API.

Używa yt-dlp tylko do listowania/pobrania napisów lub auto-captionów. Nie pobiera
wideo/audio i nie obchodzi zabezpieczeń platform. Jeśli napisy są dostępne,
normalizujemy je do SpeechSegment i dalej do CaptionDocument.
"""
from __future__ import annotations

import os
import re
import shutil
import subprocess
import tempfile
from dataclasses import dataclass, field

from .base import SoundEvent, SpeechSegment


class NoCaptionsAvailable(RuntimeError):
    """Brak napisów/auto-captionów dla URL — sygnał do fallbacku na pobranie audio + ASR."""


@dataclass
class URLCaptionIngestResult:
    title: str
    filename: str
    source: str
    segments: list[SpeechSegment]
    sounds: list[SoundEvent] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)


_TIMECODE = re.compile(
    r"(?P<h>\d{1,2}):(?P<m>\d{2}):(?P<s>\d{2})[,.](?P<ms>\d{3})"
)


def yt_dlp_available() -> bool:
    return shutil.which("yt-dlp") is not None


def ingest_url_captions(url: str, languages: str = "pl,en,*") -> URLCaptionIngestResult:
    if not yt_dlp_available():
        raise RuntimeError("Brak yt-dlp. Zainstaluj zależności workera (`pip install -r requirements.txt`).")
    with tempfile.TemporaryDirectory() as tmp:
        out_template = os.path.join(tmp, "%(id)s.%(ext)s")
        cmd = [
            "yt-dlp",
            "--skip-download",
            "--write-subs",
            "--write-auto-subs",
            "--sub-langs",
            languages,
            "--sub-format",
            "vtt/srt/best",
            "-o",
            out_template,
            url,
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
        if proc.returncode != 0:
            err = (proc.stderr or proc.stdout or "").strip()[-700:]
            raise RuntimeError(f"Nie udało się pobrać napisów z URL: {err}")
        subtitle = _find_subtitle(tmp)
        if not subtitle:
            raise NoCaptionsAvailable("Nie znaleziono dostępnych napisów ani auto-captionów dla tego URL.")
        text = open(subtitle, encoding="utf-8", errors="ignore").read()
        segments, sounds = parse_subtitle_text(text)
        if not segments and not sounds:
            raise NoCaptionsAvailable("Pobrane napisy nie zawierają segmentów możliwych do zaimportowania.")
        return URLCaptionIngestResult(
            title=os.path.basename(subtitle),
            filename=os.path.basename(subtitle),
            source="yt-dlp-captions",
            segments=segments,
            sounds=sounds,
            notes=["Użyto istniejących napisów/auto-captionów z platformy; ASR nie był potrzebny."],
        )


def _find_subtitle(directory: str) -> str | None:
    candidates: list[str] = []
    for name in os.listdir(directory):
        low = name.lower()
        if low.endswith((".srt", ".vtt")):
            candidates.append(os.path.join(directory, name))
    if not candidates:
        return None
    # Preferuj polskie napisy, potem dowolne.
    candidates.sort(key=lambda p: (".pl." not in os.path.basename(p).lower(), p))
    return candidates[0]


def _ms(raw: str) -> int:
    m = _TIMECODE.search(raw)
    if not m:
        return 0
    return (
        int(m.group("h")) * 3_600_000
        + int(m.group("m")) * 60_000
        + int(m.group("s")) * 1000
        + int(m.group("ms"))
    )


def parse_subtitle_text(text: str) -> tuple[list[SpeechSegment], list[SoundEvent]]:
    clean = text.replace("\ufeff", "").replace("\r\n", "\n")
    blocks = re.split(r"\n\s*\n", clean)
    speech: list[SpeechSegment] = []
    sounds: list[SoundEvent] = []
    for block in blocks:
        lines = [l.strip() for l in block.split("\n") if l.strip()]
        if not lines or lines[0].upper() == "WEBVTT" or lines[0].startswith(("STYLE", "NOTE")):
            continue
        time_idx = next((i for i, l in enumerate(lines) if "-->" in l), -1)
        if time_idx < 0:
            continue
        start_raw, end_raw = lines[time_idx].split("-->", 1)
        start_ms, end_ms = _ms(start_raw), _ms(end_raw)
        if end_ms <= start_ms:
            end_ms = start_ms + 1000
        caption = " ".join(lines[time_idx + 1:]).strip()
        caption = re.sub(r"<[^>]+>", "", caption)
        caption = re.sub(r"\s+", " ", caption).strip()
        if not caption:
            continue
        if caption.startswith("[") and caption.endswith("]"):
            sounds.append(SoundEvent(start_ms, end_ms, caption, 0.74, "platform-captions", "accepted"))
        else:
            speech.append(SpeechSegment(start_ms, end_ms, caption, confidence=0.72, source="platform-captions"))
    return speech, sounds


def download_url_audio(url: str, timeout: int = 300) -> tuple[str, str]:
    """Pobiera audio z URL (yt-dlp -x) do katalogu tymczasowego; zwraca (audio_path, title).
    Wywołujący usuwa katalog nadrzędny po użyciu.
    UWAGA: pobieranie mediów z platform może podlegać ich regulaminom — używać świadomie i zgodnie z prawem.
    """
    if not yt_dlp_available():
        raise RuntimeError("Brak yt-dlp. Zainstaluj zależności workera (`pip install -r requirements.txt`).")
    tmp = tempfile.mkdtemp(prefix="wz_url_")
    out_template = os.path.join(tmp, "%(id)s.%(ext)s")
    cmd = [
        "yt-dlp", "-x", "--audio-format", "mp3", "--audio-quality", "0",
        "--no-playlist", "-o", out_template, url,
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    if proc.returncode != 0:
        shutil.rmtree(tmp, ignore_errors=True)
        err = (proc.stderr or proc.stdout or "").strip()[-700:]
        raise RuntimeError(f"Nie udało się pobrać audio z URL: {err}")
    audio = None
    for name in os.listdir(tmp):
        if name.lower().endswith((".mp3", ".m4a", ".webm", ".opus", ".wav")):
            audio = os.path.join(tmp, name)
            break
    if not audio:
        shutil.rmtree(tmp, ignore_errors=True)
        raise RuntimeError("Pobrano plik, ale nie znaleziono audio do transkrypcji.")
    title = os.path.splitext(os.path.basename(audio))[0]
    return audio, title
