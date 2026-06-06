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


_FONT_CSS = {
    "system": "system-ui, sans-serif", "sans": "Arial, sans-serif", "arial": "Arial, sans-serif",
    "verdana": "Verdana, sans-serif", "tahoma": "Tahoma, sans-serif", "helvetica": "Helvetica, Arial, sans-serif",
    "serif": "Georgia, serif", "georgia": "Georgia, serif", "times": "'Times New Roman', serif",
    "mono": "monospace", "courier": "'Courier New', monospace", "atkinson": "'Atkinson Hyperlegible', Verdana, sans-serif",
}


def _font_css(key: str) -> str:
    return _FONT_CSS.get(key, key or "system-ui, sans-serif")


def _color_css(c: str) -> str:
    if not c:
        return "#ffffff"
    if c.startswith("#") or c.startswith("rgb"):
        return c
    return _COLOR_CSS.get(c, c)


def _token_color_classes(doc: CaptionDocument) -> dict:
    """Zbiera unikalne kolory tokenow -> klasy CSS (wcN)."""
    colors: dict[str, str] = {}
    for cue in doc.cues:
        for tok in (cue.tokens or []):
            if tok.color and tok.color not in colors:
                colors[tok.color] = f"wc{len(colors)}"
    return colors


def _style_block(doc: CaptionDocument, token_classes: dict) -> str:
    st = doc.style
    base = (f"font-family: {_font_css(st.font_family)}; font-size: {st.font_size}px; "
            + ("background: rgba(0,0,0,0.75);" if st.background else "background: transparent;"))
    rules = [f"::cue {{ {base} }}"]
    for sp in doc.speakers:
        rules.append(f'::cue(v[voice="{sp.label}"]) {{ color: {_color_css(sp.color)}; }}')
    for color, cls in token_classes.items():
        rules.append(f"::cue(.{cls}) {{ color: {_color_css(color)}; }}")
    return "STYLE\n" + "\n".join(rules) + "\n\n"


def _cue_settings(doc: CaptionDocument) -> str:
    return " line:5%" if doc.style.position == "top" else ""


def _render_text(cue, token_classes: dict) -> str:
    if cue.tokens:
        parts = []
        for tok in cue.tokens:
            t = tok.text
            if tok.color and tok.color in token_classes:
                t = f"<c.{token_classes[tok.color]}>{t}</c>"
            if tok.bold:
                t = f"<b>{t}</b>"
            parts.append(t)
        return " ".join(parts)
    return "\n".join(cue.lines)


def to_vtt(doc: CaptionDocument) -> str:
    token_classes = _token_color_classes(doc)
    header = "WEBVTT\n\n" + _style_block(doc, token_classes)

    blocks: list[str] = []
    for cue in doc.cues:
        text = _render_text(cue, token_classes)
        if cue.kind == CueKind.speech:
            sp = doc.speaker_by_id(cue.speaker_id)
            if sp:
                text = f"<v {sp.label}>{text}</v>"
        block = f"{cue.index}\n{_ts(cue.start_ms)} --> {_ts(cue.end_ms)}{_cue_settings(doc)}\n{text}"
        blocks.append(block)

    return header + "\n\n".join(blocks) + "\n"
