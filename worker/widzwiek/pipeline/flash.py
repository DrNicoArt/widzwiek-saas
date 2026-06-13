"""Detekcja migotania (WCAG 2.3.1 — Three Flashes or Below Threshold).

To przesiewowy heurystyczny detektor, NIE certyfikowany analizator (PEAT). Liczy gwałtowne
zmiany luminancji klatek i flaguje materiał, gdy w dowolnym oknie 1 s wykryje > 3 błyski/s
(błysk = para przeciwnych przejść jasności). Nie uwzględnia progu czerwieni ani powierzchni
>10% ekranu — to świadome uproszczenie PoC, zaznaczone w komunikacie.
"""
from __future__ import annotations

import re
import shutil
import subprocess
from dataclasses import dataclass, field


@dataclass
class FlashResult:
    analyzed: bool
    passed: bool
    flashes_per_sec: float = 0.0
    worst_time_s: float | None = None
    frames: int = 0
    note: str = ""


def detect_flashes(
    luma: list[float],
    fps: float,
    *,
    change_threshold: float = 25.0,   # ~10% z zakresu 0–255 = istotna zmiana jasności
    max_flashes_per_sec: float = 3.0,  # próg WCAG 2.3.1
) -> FlashResult:
    """Czysta logika (testowalna bez ffmpeg). luma: średnia jasność klatek 0–255 przy fps."""
    if fps <= 0 or len(luma) < 2:
        return FlashResult(analyzed=True, passed=True, frames=len(luma), note="Za mało klatek do analizy.")
    # istotne przejścia jasności (z kierunkiem)
    transitions: list[int] = []  # indeksy klatek z istotną zmianą
    last = luma[0]
    for i in range(1, len(luma)):
        if abs(luma[i] - last) >= change_threshold:
            transitions.append(i)
            last = luma[i]
    win = max(1, int(round(fps)))  # okno 1 s
    max_in_win = 0
    worst_frame: int | None = None
    for j, f in enumerate(transitions):
        hi = f + win
        cnt = 0
        k = j
        while k < len(transitions) and transitions[k] < hi:
            cnt += 1
            k += 1
        if cnt > max_in_win:
            max_in_win = cnt
            worst_frame = f
    flashes = max_in_win / 2.0  # błysk = przejście w górę + w dół
    passed = flashes <= max_flashes_per_sec
    return FlashResult(
        analyzed=True,
        passed=passed,
        flashes_per_sec=round(flashes, 2),
        worst_time_s=round(worst_frame / fps, 2) if (worst_frame is not None and not passed) else None,
        frames=len(luma),
        note="" if passed else f"Wykryto ~{flashes:.1f} błysków/s (próg WCAG 2.3.1: 3).",
    )


def ffmpeg_available() -> bool:
    return shutil.which("ffmpeg") is not None


_YAVG = re.compile(r"lavfi\.signalstats\.YAVG=([0-9.]+)")


def analyze_video_flashes(path: str, sample_fps: int = 30, timeout: int = 120) -> FlashResult:
    """Pobiera średnią luminancję klatek (ffmpeg signalstats) i ocenia migotanie.
    Zwraca FlashResult(analyzed=False), gdy ffmpeg niedostępny lub analiza się nie powiodła."""
    if not ffmpeg_available():
        return FlashResult(analyzed=False, passed=True, note="Brak ffmpeg — pominięto analizę migotania.")
    cmd = [
        "ffmpeg", "-hide_banner", "-nostats", "-i", path,
        "-vf", f"fps={sample_fps},scale=64:36,format=gray,signalstats,metadata=print:file=-",
        "-an", "-f", "null", "-",
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except Exception as exc:  # noqa: BLE001
        return FlashResult(analyzed=False, passed=True, note=f"Analiza migotania niedostępna: {exc}")
    luma = [float(m) for m in _YAVG.findall((proc.stdout or "") + "\n" + (proc.stderr or ""))]
    if len(luma) < 2:
        return FlashResult(analyzed=False, passed=True, note="Nie udało się odczytać luminancji klatek.")
    return detect_flashes(luma, float(sample_fps))
