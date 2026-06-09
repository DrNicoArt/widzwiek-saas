"""Parametry WCAG 2.1 AA — JEDNO ZRODLO PRAWDY.

Wartosci pochodza z kanonicznego contracts/wcag_ruleset.json (wersjonowany ruleset).
Jesli plik jest dostepny, ladujemy z niego; w przeciwnym razie uzywamy wartosci
wbudowanych (identycznych), zeby worker byl samowystarczalny przy deployu.
Klient (TS) lustruje te same wartosci w web/src/lib/wcagRuleset.ts.
Patrz docs/WCAG.md i docs/PLATFORM_AUDIT.md (Krok 1).
"""
from __future__ import annotations

import json
import os
from pathlib import Path

# --- Wartosci domyslne (fallback, musza odpowiadac contracts/wcag_ruleset.json) ---
_DEFAULTS = {
    "version": "1.0.0",
    "target": "WCAG 2.1 AA",
    "thresholds": {
        "max_chars_per_line": 42,
        "recommended_chars_per_line": 37,
        "max_lines": 2,
        "min_duration_ms": 1000,
        "max_duration_ms": 7000,
        "min_gap_ms": 1500,
        "max_chars_per_second": 21.0,
    },
    "allowed_caps_tokens": ["BLEEP"],
}


def _candidate_paths() -> list[Path]:
    env = os.environ.get("WCAG_RULESET_PATH")
    paths: list[Path] = []
    if env:
        paths.append(Path(env))
    here = Path(__file__).resolve()
    # repo-root/contracts/wcag_ruleset.json  (wcag -> widzwiek -> worker -> repo)
    paths.append(here.parents[3] / "contracts" / "wcag_ruleset.json")
    # kopia spakowana z paczka (gdyby worker byl deployowany osobno)
    paths.append(here.parent / "ruleset.json")
    return paths


def _load() -> dict:
    for p in _candidate_paths():
        try:
            if p.is_file():
                with open(p, encoding="utf-8") as f:
                    data = json.load(f)
                # walidacja minimalna — brakujace klucze uzupelniamy domyslnymi
                t = {**_DEFAULTS["thresholds"], **data.get("thresholds", {})}
                return {
                    "version": data.get("version", _DEFAULTS["version"]),
                    "target": data.get("target", _DEFAULTS["target"]),
                    "thresholds": t,
                    "allowed_caps_tokens": data.get("allowed_caps_tokens", _DEFAULTS["allowed_caps_tokens"]),
                }
        except Exception:  # noqa: BLE001 — uszkodzony/niedostepny plik -> fallback
            continue
    return _DEFAULTS


_R = _load()
_T = _R["thresholds"]

RULESET_VERSION: str = _R["version"]

# Tekst i formatowanie
MAX_CHARS_PER_LINE = int(_T["max_chars_per_line"])
RECOMMENDED_CHARS_PER_LINE = int(_T["recommended_chars_per_line"])
MAX_LINES = int(_T["max_lines"])

# Timing (ms)
MIN_DURATION_MS = int(_T["min_duration_ms"])
MAX_DURATION_MS = int(_T["max_duration_ms"])
MIN_GAP_MS = int(_T["min_gap_ms"])

# Predkosc czytania (zn./s)
MAX_CHARS_PER_SECOND = float(_T["max_chars_per_second"])

# Dozwolony wyjatek od reguly "nigdy CAPS": ocenzurowane slowo (bleep).
ALLOWED_CAPS_TOKENS = set(_R["allowed_caps_tokens"])

# Poziom docelowy raportu
TARGET = _R["target"]
