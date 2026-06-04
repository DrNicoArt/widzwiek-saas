"""Parametry WCAG 2.1 AA — wartości z dokumentu PoC SubrosAI.

Trzymane osobno od logiki walidatora, żeby parametry były jednym, czytelnym
miejscem do strojenia. Patrz docs/WCAG.md.
"""
from __future__ import annotations

# Tekst i formatowanie
MAX_CHARS_PER_LINE = 42          # twardy limit AA (>42 = error)
RECOMMENDED_CHARS_PER_LINE = 37  # zalecane (38-42 = warning)
MAX_LINES = 2                    # maks. linie jednocześnie na ekranie

# Timing (ms)
MIN_DURATION_MS = 1000           # min. czas wyświetlania napisu
MAX_DURATION_MS = 7000           # opt. górny zakres 1-7 s
MIN_GAP_MS = 1500                # przerwa między napisami (anty-miganie)

# Prędkość czytania: 160-180 WPM. Przy ~6 znakach/słowo (ze spacją)
# 180 WPM ~= 18 znaków/s; przyjmujemy próg ostrzegawczy 21 zn./s (bufor).
MAX_CHARS_PER_SECOND = 21.0

# Dozwolony wyjątek od reguły "nigdy CAPS": ocenzurowane słowo (bleep).
ALLOWED_CAPS_TOKENS = {"BLEEP"}

# Poziom docelowy raportu
TARGET = "WCAG 2.1 AA"
