"""Konfiguracja workera — czytana ze zmiennych środowiskowych (.env)."""
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

    # Wybór silników AI (PoC: "mock"). TBD: "whisper", "pyannote", "yamnet".
    asr_provider: str = os.getenv("WIDZWIEK_ASR_PROVIDER", "mock")
    diarization_provider: str = os.getenv("WIDZWIEK_DIARIZATION_PROVIDER", "mock")
    sound_provider: str = os.getenv("WIDZWIEK_SOUND_PROVIDER", "mock")

    storage_dir: str = os.getenv("WIDZWIEK_STORAGE_DIR", "./storage")


settings = Settings()
