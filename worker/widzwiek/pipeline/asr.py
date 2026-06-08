"""Etap ASR (transkrypcja).

Kolejność produktu: źródła napisów/import -> lokalne/no-key ASR -> płatne API jako premium/fallback.
"""
from __future__ import annotations

from typing import Optional
import math

from ..contracts import MediaInfo
from .base import ASRProvider, SpeechSegment
from . import mock_data


class MockASRProvider(ASRProvider):
    name = "mock"

    def transcribe(self, audio_path: Optional[str], media: MediaInfo) -> list[SpeechSegment]:
        return [
            SpeechSegment(s.start_ms, s.end_ms, s.text, s.speaker_id, confidence=0.86, source=self.name)
            for s in mock_data.mock_transcribe()
        ]


class FasterWhisperASRProvider(ASRProvider):
    """Lokalna transkrypcja bez kluczy API przez faster-whisper/CTranslate2."""
    name = "faster-whisper-local"

    def __init__(self, model_size: str = "small", language: str = "pl", compute_type: str = "int8") -> None:
        self._model_size = model_size
        self._language = language
        self._compute_type = compute_type

    def transcribe(self, audio_path: Optional[str], media: MediaInfo) -> list[SpeechSegment]:
        if not audio_path:
            raise FileNotFoundError("Brak pliku audio dla lokalnej transkrypcji.")
        try:
            from faster_whisper import WhisperModel
        except ImportError as exc:
            raise RuntimeError(
                "Brak pakietu 'faster-whisper'. Zainstaluj zależności workera (`pip install -r requirements.txt`) "
                "albo użyj importu SRT/VTT/url captions. Płatne API nie jest wymagane."
            ) from exc

        model = WhisperModel(self._model_size, device="cpu", compute_type=self._compute_type)
        segments, _info = model.transcribe(
            audio_path,
            language=self._language,
            vad_filter=True,
            word_timestamps=True,
            beam_size=5,
        )
        out: list[SpeechSegment] = []
        for seg in segments:
            text = (getattr(seg, "text", "") or "").strip()
            if not text:
                continue
            start_ms = int(round(float(getattr(seg, "start", 0.0) or 0.0) * 1000))
            end_ms = int(round(float(getattr(seg, "end", 0.0) or 0.0) * 1000))
            if end_ms <= start_ms:
                end_ms = start_ms + 1000
            avg_logprob = float(getattr(seg, "avg_logprob", -0.7) or -0.7)
            confidence = max(0.05, min(0.98, math.exp(avg_logprob)))
            out.append(SpeechSegment(start_ms, end_ms, text, confidence=round(confidence, 3), source=self.name))
        return out


class OpenAIASRProvider(ASRProvider):
    """Realna transkrypcja przez OpenAI (domyślnie whisper-1, verbose_json).

    Mapuje segmenty {start, end, text} (sekundy) na SpeechSegment (ms).
    Diaryzacja i dźwięki niewerbalne to kolejne, osobne etapy (tu nieobsługiwane).
    """
    name = "openai"

    def __init__(self, api_key: str, model: str = "whisper-1", language: str = "pl") -> None:
        self._api_key = api_key
        self._model = model
        self._language = language

    # --- wydzielone wywołanie API (łatwe do podmiany/monkeypatch w testach) ---
    def _request_transcription(self, audio_path: str) -> dict:
        if not self._api_key:
            raise ValueError(
                "Brak OPENAI_API_KEY. Ustaw klucz w .env (PIPELINE_MODE=api wymaga klucza API)."
            )
        try:
            from openai import OpenAI  # import leniwy — niepotrzebny w trybie mock
        except ImportError as exc:
            raise RuntimeError(
                "Pakiet 'openai' nie jest zainstalowany. Uruchom: pip install -r requirements.txt"
            ) from exc

        client = OpenAI(api_key=self._api_key)
        try:
            with open(audio_path, "rb") as fh:
                resp = client.audio.transcriptions.create(
                    model=self._model,
                    file=fh,
                    language=self._language,
                    response_format="verbose_json",
                )
        except Exception as exc:  # noqa: BLE001 — opakowujemy w czytelny komunikat
            raise RuntimeError(f"Błąd API transkrypcji OpenAI: {exc}") from exc

        if hasattr(resp, "model_dump"):
            return resp.model_dump()
        if hasattr(resp, "to_dict"):
            return resp.to_dict()
        if isinstance(resp, dict):
            return resp
        return {"text": getattr(resp, "text", ""), "segments": getattr(resp, "segments", [])}

    def transcribe(self, audio_path: Optional[str], media: MediaInfo) -> list[SpeechSegment]:
        if not audio_path:
            raise FileNotFoundError("Tryb API: brak ścieżki do pliku audio do transkrypcji.")
        data = self._request_transcription(audio_path)
        return map_transcription(data)


def map_transcription(data: dict) -> list[SpeechSegment]:
    """Mapuje odpowiedź transkrypcji (verbose_json) na SpeechSegment (ms).

    Fallback: gdy brak segmentów, a jest sam tekst — jeden segment 0..duration.
    """
    segments = data.get("segments") or []
    out: list[SpeechSegment] = []
    for seg in segments:
        start = seg.get("start", 0.0) or 0.0
        end = seg.get("end", start) or start
        text = (seg.get("text") or "").strip()
        if not text:
            continue
        start_ms = int(round(float(start) * 1000))
        end_ms = int(round(float(end) * 1000))
        if end_ms <= start_ms:
            end_ms = start_ms + 1000
        out.append(SpeechSegment(start_ms=start_ms, end_ms=end_ms, text=text, confidence=0.78, source="openai"))

    if not out:
        text = (data.get("text") or "").strip()
        if text:
            dur = data.get("duration")
            end_ms = int(round(float(dur) * 1000)) if dur else max(2000, len(text) * 60)
            out.append(SpeechSegment(start_ms=0, end_ms=end_ms, text=text, confidence=0.62, source="openai"))
    return out


def get_asr_provider(name: str) -> ASRProvider:
    """Zachowane dla zgodności (nadpisania per-etap). Wybór trybu robi providers.py."""
    if name in ("faster-whisper", "faster-whisper-local", "local"):
        from ..config import settings
        return FasterWhisperASRProvider(settings.local_asr_model)
    if name == "openai":
        from ..config import settings
        return OpenAIASRProvider(settings.openai_api_key, settings.openai_transcription_model)
    return MockASRProvider()
