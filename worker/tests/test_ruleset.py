"""Krok 1 — jedno zrodlo prawdy WCAG.

Pilnuje, ze progi w Pythonie (rules.py) == kanoniczny contracts/wcag_ruleset.json,
oraz ze lustro klienta (web/src/lib/wcagRuleset.ts) ma te sama wersje i progi.
Jesli ktos zmieni jedno miejsce a zapomni o drugim — test pada.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from widzwiek.wcag import rules

ROOT = Path(__file__).resolve().parents[2]
RULESET = ROOT / "contracts" / "wcag_ruleset.json"
TS_MIRROR = ROOT / "web" / "src" / "lib" / "wcagRuleset.ts"


def _canon() -> dict:
    return json.loads(RULESET.read_text(encoding="utf-8"))


def test_python_matches_json():
    c = _canon()
    t = c["thresholds"]
    assert rules.RULESET_VERSION == c["version"]
    assert rules.TARGET == c["target"]
    assert rules.MAX_CHARS_PER_LINE == t["max_chars_per_line"]
    assert rules.RECOMMENDED_CHARS_PER_LINE == t["recommended_chars_per_line"]
    assert rules.MAX_LINES == t["max_lines"]
    assert rules.MIN_DURATION_MS == t["min_duration_ms"]
    assert rules.MAX_DURATION_MS == t["max_duration_ms"]
    assert rules.MIN_GAP_MS == t["min_gap_ms"]
    assert rules.MAX_CHARS_PER_SECOND == t["max_chars_per_second"]
    assert set(rules.ALLOWED_CAPS_TOKENS) == set(c["allowed_caps_tokens"])


def _ts_const(name: str, src: str) -> str:
    m = re.search(rf"export const {name}\s*=\s*([^;]+);", src)
    assert m, f"brak {name} w wcagRuleset.ts"
    return m.group(1).strip().strip('"')


def test_ts_mirror_matches_json():
    if not TS_MIRROR.is_file():
        return  # w deployu samego workera lustro TS moze nie istniec
    src = TS_MIRROR.read_text(encoding="utf-8")
    c = _canon()
    t = c["thresholds"]
    assert _ts_const("RULESET_VERSION", src) == c["version"]
    assert int(_ts_const("MAX_CHARS_PER_LINE", src)) == t["max_chars_per_line"]
    assert int(_ts_const("RECOMMENDED_CHARS_PER_LINE", src)) == t["recommended_chars_per_line"]
    assert int(_ts_const("MAX_LINES", src)) == t["max_lines"]
    assert int(_ts_const("MIN_DURATION_MS", src)) == t["min_duration_ms"]
    assert int(_ts_const("MAX_DURATION_MS", src)) == t["max_duration_ms"]
    assert int(_ts_const("MIN_GAP_MS", src)) == t["min_gap_ms"]
    assert int(_ts_const("MAX_CPS", src)) == int(t["max_chars_per_second"])


def test_report_carries_ruleset_version():
    from widzwiek.pipeline import run_pipeline
    doc = run_pipeline("film.mp4")
    assert doc.wcag.ruleset_version == rules.RULESET_VERSION
