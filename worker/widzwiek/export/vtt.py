"""Eksport do WebVTT. VTT przenosi kolory mówców i pozycjonowanie -> pełna
zgodność z WCAG (patrz PoC: "tylko VTT przekazuje kolory mówców").

Kolory realizujemy przez blok STYLE + voice tag <v Label>...</v>.
"""
from __future__ import annotations

from ..contracts import CaptionDocument, CueKind

# Mapowanie nazw kolorów WCAG na wartości CSS
_COLOR_CSS = {
    "white": "#ffffff",
    "yellow": "#ffff00",
    "cyan": "#00ffff",
    "green": "#00ff00",
}


def _ts(ms: int) -> str:
    ms = max(0, ms)
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1_000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def _style_block(doc: CaptionDocument) -> str:
    rules = []
    for sp in doc.speakers:
        css = _COLOR_CSS.get(sp.color, "#ffffff")
        # dopasowanie po atrybucie voice
        rules.append(f'::cue(v[voice="{sp.label}"]) {{ color: {css}; }}')
    if not rules:
        return ""
    return "STYLE\n" + "\n".join(rules) + "\n\n"


def to_vtt(doc: CaptionDocument) -> str:
    out = ["WEBVTT", ""]
    style = _style_block(doc)
    header = "\n".join(out) + "\n" + (style if style else "")

    blocks: list[str] = []
    for cue in doc.cues:
        text = "\n".join(cue.lines)
        if cue.kind == CueKind.speech:
            sp = doc.speaker_by_id(cue.speaker_id)
            if sp:
                # voice tag niesie etykietę + (przez STYLE) kolor mówcy
                text = f"<v {sp.label}>{text}</v>"
        block = f"{cue.index}\n{_ts(cue.start_ms)} --> {_ts(cue.end_ms)}\n{text}"
        blocks.append(block)

    return header + "\n\n".join(blocks) + "\n"
