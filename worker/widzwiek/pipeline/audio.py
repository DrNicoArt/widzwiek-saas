"""Pomocnicze operacje na pliku wejściowym dla trybu API.

Obsługa audio + ścieżka dla wideo: jeśli plik to wideo i dostępny jest ffmpeg,
ekstrahujemy ścieżkę audio (mono, 16 kHz) do pliku tymczasowego. Gdy ffmpeg nie
jest dostępny, przekazujemy plik bez zmian (OpenAI potrafi przyjąć część
kontenerów wideo, limit 25 MB) i sygnalizujemy to przez flagę.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from typing import Optional

AUDIO_EXT = {".mp3", ".wav", ".m4a", ".flac", ".aac", ".ogg", ".oga", ".opus", ".webm"}
VIDEO_EXT = {".mp4", ".mov", ".mkv", ".avi", ".m4v", ".wmv", ".mpeg", ".mpg"}


def is_video(filename: str) -> bool:
    return os.path.splitext(filename or "")[1].lower() in VIDEO_EXT


def ffmpeg_available() -> bool:
    return shutil.which("ffmpeg") is not None


@dataclass
class PreparedAudio:
    path: str
    cleanup: bool          # czy usunąć plik po użyciu (plik tymczasowy)
    extracted: bool        # czy audio zostało wyekstrahowane z wideo
    note: Optional[str] = None


def ensure_audio(input_path: str, filename: str) -> PreparedAudio:
    """Zwraca ścieżkę do pliku audio gotowego do wysłania do API.

    Rzuca czytelny błąd, gdy pliku brak.
    """
    if not input_path or not os.path.exists(input_path):
        raise FileNotFoundError(
            "Brak pliku wejściowego do transkrypcji. Upewnij się, że plik został przesłany."
        )

    if not is_video(filename):
        # plik audio — używamy bez zmian
        return PreparedAudio(path=input_path, cleanup=False, extracted=False)

    # plik wideo
    if not ffmpeg_available():
        return PreparedAudio(
            path=input_path, cleanup=False, extracted=False,
            note=("ffmpeg niedostępny — wysyłam plik wideo bezpośrednio (limit API 25 MB). "
                  "Zainstaluj ffmpeg, aby ekstrahować audio i obsłużyć większe pliki."),
        )

    out_fd, out_path = tempfile.mkstemp(suffix=".mp3")
    os.close(out_fd)
    cmd = ["ffmpeg", "-y", "-i", input_path, "-vn", "-ac", "1", "-ar", "16000",
           "-b:a", "64k", out_path]
    try:
        subprocess.run(cmd, check=True, capture_output=True)
    except subprocess.CalledProcessError as exc:
        try:
            os.unlink(out_path)
        except OSError:
            pass
        stderr = (exc.stderr or b"").decode("utf-8", "ignore")[-500:]
        raise RuntimeError(f"Ekstrakcja audio z wideo (ffmpeg) nie powiodła się: {stderr}") from exc

    return PreparedAudio(path=out_path, cleanup=True, extracted=True)
