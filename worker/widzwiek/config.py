"""Konfiguracja workera — czytana ze zmiennych środowiskowych (.env).

Sekrety (klucze API) NIGDY nie są zapisywane w kodzie — wyłącznie przez ENV/.env.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field


def _origins() -> list[str]:
    raw = os.getenv("WIDZWIEK_CORS_ORIGINS", "http://localhost:3000")
    return [o.strip() for o in raw.split(",") if o.strip()]


def _api_tokens() -> dict:
    """WIDZWIEK_API_TOKENS = "token1:org1,token2:org2". Pusty => auth wylaczony (tryb demo)."""
    raw = os.getenv("WIDZWIEK_API_TOKENS", "").strip()
    out: dict = {}
    for part in raw.split(","):
        part = part.strip()
        if ":" in part:
            tok, org = part.split(":", 1)
            if tok.strip() and org.strip():
                out[tok.strip()] = org.strip()
    return out


@dataclass
class Settings:
    host: str = os.getenv("WIDZWIEK_HOST", "127.0.0.1")
    port: int = int(os.getenv("WIDZWIEK_PORT", "8000"))
    cors_origins: list[str] = field(default_factory=_origins)

    # Główny przełącznik pipeline'u:
    # auto/local/free = no-API-first orkiestrator, mock = demo, api = premium/fallback.
    pipeline_mode: str = os.getenv("PIPELINE_MODE", "auto").strip().lower()
    processing_strategy: str = os.getenv("WIDZWIEK_PROCESSING_STRATEGY", "automatic").strip().lower()

    # Nadpisania pojedynczych etapów (zaawansowane). Domyślnie wynikają z pipeline_mode.
    asr_provider: str = os.getenv("WIDZWIEK_ASR_PROVIDER", "").strip().lower()
    diarization_provider: str = os.getenv("WIDZWIEK_DIARIZATION_PROVIDER", "").strip().lower()
    sound_provider: str = os.getenv("WIDZWIEK_SOUND_PROVIDER", "").strip().lower()

    # OpenAI (tryb api). Klucz tylko z ENV.
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_transcription_model: str = os.getenv("OPENAI_TRANSCRIPTION_MODEL", "whisper-1")

    # Lokalne/no-key modele i narzędzia.
    local_asr_model: str = os.getenv("WIDZWIEK_LOCAL_ASR_MODEL", "small")
    local_asr_compute_type: str = os.getenv("WIDZWIEK_LOCAL_ASR_COMPUTE_TYPE", "int8")
    prefer_platform_captions: bool = os.getenv("WIDZWIEK_PREFER_PLATFORM_CAPTIONS", "1") != "0"
    # Gdy URL nie ma napisów: pobierz audio i wykonaj transkrypcję (ASR). 1=wł (domyślnie).
    url_asr_fallback: bool = os.getenv("WIDZWIEK_URL_ASR_FALLBACK", "1") != "0"
    # Analiza migotania (WCAG 2.3.1) dla wideo, gdy dostępny ffmpeg. 1=wł (domyślnie).
    flash_detection: bool = os.getenv("WIDZWIEK_FLASH_DETECTION", "1") != "0"
    enable_sound_events: bool = os.getenv("WIDZWIEK_ENABLE_SOUND_EVENTS", "1") != "0"

    admin_token: str = os.getenv("WIDZWIEK_ADMIN_TOKEN", "")  # gdy ustawiony: /api/config wymaga naglowka X-Admin-Token
    async_jobs: bool = os.getenv("WIDZWIEK_ASYNC", "0") == "1"  # 1 = przetwarzanie w tle (dlugie pliki nie blokuja)
    api_tokens: dict = field(default_factory=_api_tokens)  # token API -> org_id; pusty = tryb otwarty
    storage_dir: str = os.getenv("WIDZWIEK_STORAGE_DIR", "./storage")
    storage_limit_mb: int = int(os.getenv("WIDZWIEK_STORAGE_LIMIT_MB", "200"))


settings = Settings()
