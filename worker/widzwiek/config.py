"""Konfiguracja workera — czytana ze zmiennych środowiskowych (.env).

Sekrety (klucze API) NIGDY nie są zapisywane w kodzie — wyłącznie przez ENV/.env.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field


def _origins() -> list[str]:
    raw = os.getenv("WIDZWIEK_CORS_ORIGINS", "http://localhost:3000")
    return [o.strip() for o in raw.split(",") if o.strip()]


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
    enable_sound_events: bool = os.getenv("WIDZWIEK_ENABLE_SOUND_EVENTS", "1") != "0"

    storage_dir: str = os.getenv("WIDZWIEK_STORAGE_DIR", "./storage")
    storage_limit_mb: int = int(os.getenv("WIDZWIEK_STORAGE_LIMIT_MB", "200"))


settings = Settings()
