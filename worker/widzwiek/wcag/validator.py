"""Walidator WCAG 2.1 AA.

Odseparowany od AI i od eksportu (ADR-005). Bierze cues z CaptionDocument i
produkuje WcagReport: compliant TAK/NIE + lista konkretnych problemów.

To jest główna wartość produktu: raport "spełnia WCAG: TAK/NIE".
"""
from __future__ import annotations

import re

from ..contracts import (
    CaptionDocument,
    CueKind,
    Severity,
    WcagIssue,
    WcagReport,
    WcagStats,
)
from . import rules

_WORD_RE = re.compile(r"[^\W\d_]{2,}", re.UNICODE)  # słowa min. 2 litery


def _is_shouting(line: str) -> bool:
    """Czy linia to krzyk (CAPS). Nie karzemy pojedynczych akronimow (WCAG, SRT)
    ani dozwolonego BLEEP — liczymy udzial wielkich liter w calej linii.
    Wyklucza opisy dzwiekow w nawiasach kwadratowych."""
    stripped = re.sub(r"\[[^\]]*\]", "", line)          # usun [opisy dzwiekow]
    # usun dozwolone tokeny (np. BLEEP), zeby nie liczyly sie jako krzyk
    for tok in rules.ALLOWED_CAPS_TOKENS:
        stripped = stripped.replace(tok, "")
    letters = [c for c in stripped if c.isalpha()]
    if len(letters) <= 4:                               # za krotka linia / akronim
        return False
    upper = sum(1 for c in letters if c.isupper())
    return (upper / len(letters)) > 0.6                 # przewaga wielkich liter = krzyk


def validate(doc: CaptionDocument) -> WcagReport:
    issues: list[WcagIssue] = []
    cues = sorted(doc.cues, key=lambda c: c.start_ms)
    multi_speaker = len([s for s in doc.speakers]) >= 2

    for i, cue in enumerate(cues):
        # Liczba linii
        if len(cue.lines) > rules.MAX_LINES:
            issues.append(WcagIssue(
                code="TOO_MANY_LINES", severity=Severity.error, cue_id=cue.id, field="lines",
                message=f"Napis ma {len(cue.lines)} linie — maksimum to {rules.MAX_LINES}.",
            ))

        # Długość linii + CAPS
        for line in cue.lines:
            n = len(line)
            if n > rules.MAX_CHARS_PER_LINE:
                issues.append(WcagIssue(
                    code="LINE_TOO_LONG", severity=Severity.error, cue_id=cue.id, field="lines",
                    message=f"Linia ma {n} znaków — limit {rules.MAX_CHARS_PER_LINE}: \"{line}\"",
                ))
            elif n > rules.RECOMMENDED_CHARS_PER_LINE:
                issues.append(WcagIssue(
                    code="LINE_TOO_LONG", severity=Severity.warning, cue_id=cue.id, field="lines",
                    message=f"Linia ma {n} znaków — zalecane <= {rules.RECOMMENDED_CHARS_PER_LINE}: \"{line}\"",
                ))
            if _is_shouting(line):
                issues.append(WcagIssue(
                    code="ALL_CAPS", severity=Severity.error, cue_id=cue.id, field="lines",
                    message=f"Tekst wielkimi literami (CAPS = krzyk), niedozwolone w AA: \"{line}\"",
                ))

        # Czas trwania
        dur = cue.duration_ms
        if dur < rules.MIN_DURATION_MS:
            issues.append(WcagIssue(
                code="DURATION_TOO_SHORT", severity=Severity.error, cue_id=cue.id, field="end_ms",
                message=f"Napis wyświetlany {dur} ms — minimum {rules.MIN_DURATION_MS} ms.",
            ))
        if dur > rules.MAX_DURATION_MS:
            issues.append(WcagIssue(
                code="DURATION_TOO_LONG", severity=Severity.warning, cue_id=cue.id, field="end_ms",
                message=f"Napis wyświetlany {dur} ms — zalecane maks. {rules.MAX_DURATION_MS} ms.",
            ))

        # Prędkość czytania (tylko mowa)
        if cue.kind == CueKind.speech and dur > 0:
            cps = cue.char_count / (dur / 1000.0)
            if cps > rules.MAX_CHARS_PER_SECOND:
                issues.append(WcagIssue(
                    code="READING_SPEED", severity=Severity.warning, cue_id=cue.id,
                message=f"Prędkość czytania {cps:.1f} zn./s — zalecane <= {rules.MAX_CHARS_PER_SECOND:.0f} zn./s.",
                ))

        # Nakładanie / przerwa względem poprzedniego
        if i > 0:
            prev = cues[i - 1]
            gap = cue.start_ms - prev.end_ms
            if gap < 0:
                issues.append(WcagIssue(
                    code="OVERLAP", severity=Severity.error, cue_id=cue.id, field="start_ms",
                    message=f"Napis nakłada się na poprzedni o {-gap} ms.",
                ))
            elif gap < rules.MIN_GAP_MS:
                issues.append(WcagIssue(
                    code="GAP_TOO_SHORT", severity=Severity.warning, cue_id=cue.id, field="start_ms",
                    message=f"Przerwa {gap} ms względem poprzedniego napisu — zalecane >= {rules.MIN_GAP_MS} ms (anty-miganie).",
                ))

        # Identyfikacja mówcy przy wielu mówcach
        if multi_speaker and cue.kind == CueKind.speech:
            sp = doc.speaker_by_id(cue.speaker_id)
            if sp is None or not sp.label:
                issues.append(WcagIssue(
                    code="NO_SPEAKER_ID", severity=Severity.warning, cue_id=cue.id, field="speaker_id",
                    message="Brak identyfikacji mówcy (etykieta/kolor) przy ≥2 mówcach.",
                ))

    # Obecność opisów dźwięków niewerbalnych (WCAG 1.2.2)
    if not any(c.kind == CueKind.sound for c in cues):
        issues.append(WcagIssue(
            code="NO_SOUND_DESCRIPTION", severity=Severity.info,
            message="Brak opisów dźwięków niewerbalnych ([muzyka], [oklaski]...). WCAG 1.2.2 ich wymaga, jeśli występują.",
        ))

    errors = sum(1 for it in issues if it.severity == Severity.error)
    warnings = sum(1 for it in issues if it.severity == Severity.warning)

    return WcagReport(
        target=rules.TARGET,
        ruleset_version=rules.RULESET_VERSION,
        compliant=(errors == 0),
        stats=WcagStats(cue_count=len(cues), error_count=errors, warning_count=warnings),
        issues=issues,
    )
