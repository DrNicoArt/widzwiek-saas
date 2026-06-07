"""Eksport czystego transkryptu (.txt) — bez timingu, do szybkiego copy/paste.
Mowa: 'Etykieta: tekst'; dzwieki: '[opis]'. Offline."""
from __future__ import annotations

from ..contracts import CaptionDocument, CueKind


def to_txt(doc: CaptionDocument) -> str:
    out: list[str] = []
    for c in doc.cues:
        if c.kind == CueKind.speech:
            sp = doc.speaker_by_id(c.speaker_id)
            prefix = f"{sp.label}: " if sp else ""
            out.append(f"{prefix}{c.text}")
        else:
            out.append(c.text)
    return "\n".join(out) + "\n"
