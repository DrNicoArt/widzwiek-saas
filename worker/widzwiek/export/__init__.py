"""Eksport napisów — odseparowany od walidacji WCAG."""
from .srt import to_srt
from .vtt import to_vtt

__all__ = ["to_srt", "to_vtt"]
