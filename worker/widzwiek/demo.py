"""Szybkie demo workera bez frontendu i bez sieci.

Uruchom: python -m widzwiek.demo
Wypisze raport WCAG (TAK/NIE) oraz przykładowe SRT i VTT dla mockowego materiału.
"""
from __future__ import annotations

from .export import to_srt, to_vtt
from .pipeline import run_pipeline


def main() -> None:
    doc = run_pipeline("film_tomka.mp4")

    print("=" * 60)
    print("WIDŹWIĘK — DEMO (mock pipeline)")
    print("=" * 60)
    print(f"Plik: {doc.media.filename}  |  typ: {doc.media.source_kind.value}  "
          f"|  czas: {doc.media.duration_ms/1000:.1f}s  |  język: {doc.media.language}")
    print(f"Mówcy: {', '.join(f'{s.label}({s.color})' for s in doc.speakers)}")
    print(f"Liczba napisów (cues): {len(doc.cues)}")

    print("\n--- RAPORT WCAG ---")
    r = doc.wcag
    print(f"Cel: {r.target}")
    print(f"Spełnia WCAG: {'TAK' if r.compliant else 'NIE'}")
    print(f"Błędy: {r.stats.error_count}  |  Ostrzeżenia: {r.stats.warning_count}")
    for it in r.issues:
        loc = f" [{it.cue_id}]" if it.cue_id else ""
        print(f"  - {it.severity.value.upper()}{loc} {it.code}: {it.message}")

    print("\n--- SRT ---")
    print(to_srt(doc))
    print("--- VTT ---")
    print(to_vtt(doc))


if __name__ == "__main__":
    main()
