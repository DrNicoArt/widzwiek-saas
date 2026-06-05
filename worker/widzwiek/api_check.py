"""Offline checker gotowości trybu API — bez żadnych wywołań sieciowych ani płatnych.

Sprawdza tylko lokalną konfigurację: tryb, obecność klucza (czy ustawiony, NIE waliduje go),
czy pakiet `openai` jest zainstalowany, czy `ffmpeg` jest w PATH. Używany też przez /health.

Uruchom: python -m widzwiek.api_check
"""
from __future__ import annotations

import importlib.util
import shutil

from .config import Settings, settings


def readiness(s: Settings = settings) -> dict:
    mode = (s.pipeline_mode or "mock").lower()
    api_key_present = bool(s.openai_api_key)
    openai_installed = importlib.util.find_spec("openai") is not None
    ffmpeg_present = shutil.which("ffmpeg") is not None

    notes: list[str] = []
    if mode == "api":
        if not api_key_present:
            notes.append("Brak OPENAI_API_KEY — ustaw w .env (tryb api wymaga klucza).")
        if not openai_installed:
            notes.append("Pakiet 'openai' niezainstalowany — odkomentuj w requirements.txt i zainstaluj.")
        if not ffmpeg_present:
            notes.append("ffmpeg niedostępny — wideo pójdzie wprost do API (limit 25 MB).")
    else:
        notes.append("Tryb mock — demo działa bez kluczy, openai i ffmpeg.")

    ready = mode != "api" or (api_key_present and openai_installed)
    return {
        "mode": mode,
        "api_key_present": api_key_present,
        "openai_installed": openai_installed,
        "ffmpeg_present": ffmpeg_present,
        "ready": ready,
        "notes": notes,
    }


def main() -> int:
    r = readiness()
    print("=" * 56)
    print("WIDŹWIĘK — gotowość trybu API (offline, bez wywołań sieci)")
    print("=" * 56)
    print(f"PIPELINE_MODE      : {r['mode']}")
    print(f"OPENAI_API_KEY     : {'ustawiony' if r['api_key_present'] else 'BRAK'}")
    print(f"pakiet openai      : {'OK' if r['openai_installed'] else 'brak'}")
    print(f"ffmpeg w PATH      : {'OK' if r['ffmpeg_present'] else 'brak'}")
    print(f"GOTOWY DO API      : {'TAK' if r['ready'] else 'NIE'}")
    for n in r["notes"]:
        print(f"  - {n}")
    # exit 0 zawsze (to checker, nie test); 0 = informacyjnie
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
