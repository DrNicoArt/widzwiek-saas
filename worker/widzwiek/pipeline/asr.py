"""Etap ASR (transkrypcja).

Tryby:
- Mock (PoC) — MockASRProvider, dane z mock_data.
- API — OpenAIASRProvider, realna transkrypcja przez OpenAI audio transcriptions.

Provider API jest łatwo wymienny na innego dostawcę: wystarczy nowa klasa
implementująca ASRProvider + wpięcie w pipeline/providers.py. Sekrety wyłącznie z ENV.
"""
from __future__ import annotations

from typing import Optional

from ..contracts import MediaInfo
from .base import ASRProvider, SpeechSegment
from . import mock_data


class MockASRProvider(ASRProvider):
    name = "mock"

    def transcribe(self, audio_path: Optional[str], media: MediaInfo) -> list[SpeechSegment]:
        return mock_data.mock_transcribe()


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
        out.append(SpeechSegment(start_ms=start_ms, end_ms=end_ms, text=text))

    if not out:
        text = (data.get("text") or "").strip()
        if text:
            dur = data.get("duration")
            end_ms = int(round(float(dur) * 1000)) if dur else max(2000, len(text) * 60)
            out.append(SpeechSegment(start_ms=0, end_ms=end_ms, text=text))
    return out


def get_asr_provider(name: str) -> ASRProvider:
    """Zachowane dla zgodności (nadpisania per-etap). Wybór trybu robi providers.py."""
    if name == "openai":
        from ..config import settings
        return OpenAIASRProvider(settings.openai_api_key, settings.openai_transcription_model)
    return MockASRProvider()
