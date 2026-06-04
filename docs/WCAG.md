# Parametry WCAG w Widźwięku

Cel: **WCAG 2.1 AA** (obowiązek prawny PL/UE — EAA od 28.06.2026), WCAG 2.2 AA jako przewaga.
Parametry pochodzą z dokumentu PoC SubrosAI i są zakodowane w `worker/widzwiek/wcag/rules.py`.

## Reguły walidatora (etap AA)

| Kod | Reguła (AA) | Próg | Severity |
|-----|-------------|------|----------|
| `LINE_TOO_LONG` | Znaki na linię | maks. **42** (zalecane ≤37) | `error` (>42) / `warning` (38–42) |
| `TOO_MANY_LINES` | Linie jednocześnie na ekranie | maks. **2** | `error` |
| `ALL_CAPS` | Mixed case — nigdy CAPS (caps = krzyk) | — | `error` (poza dozwolonym BLEEP) |
| `DURATION_TOO_SHORT` | Min. czas wyświetlania | **≥ 1000 ms** | `error` |
| `DURATION_TOO_LONG` | Maks. czas wyświetlania | **≤ 7000 ms** | `warning` |
| `GAP_TOO_SHORT` | Przerwa między napisami (anty-miganie) | **≥ 1500 ms** | `warning` |
| `OVERLAP` | Napisy nie mogą się nakładać w czasie | brak nakładania | `error` |
| `READING_SPEED` | Prędkość czytania (160–180 WPM ≈ ≤21 znaków/s) | **≤ 21 zn./s** | `warning` |
| `NO_SPEAKER_ID` | Identyfikacja mówcy przy ≥2 mówcach | etykieta/kolor obecne | `warning` |
| `NO_SOUND_DESCRIPTION` | Opisy dźwięków niewerbalnych (WCAG 1.2.2) | ≥1 cue typu `sound` | `info` |

`compliant = (liczba błędów error == 0)`. Ostrzeżenia są listowane jako „do poprawy", nie blokują TAK.

## Reguły poza zakresem PoC (oznaczone TBD)

Wymagają warstwy wideo/renderowania, więc walidator je sygnalizuje, ale nie ocenia automatycznie:

- **Kontrast tekst/tło ≥ 4.5:1**, półprzezroczyste tło, drop shadow — zależy od odtwarzacza/renderu (TBD).
- **Bezpieczna strefa 5%**, pozycjonowanie — VTT to wspiera; walidacja wymaga geometrii ekranu (TBD).
- **Synchronizacja ±80 ms** — wymaga referencji/ścieżki dźwiękowej do porównania (TBD, dawałby metrykę PoC).
- **Powiększenie do 200%** — własność odtwarzacza, nie pliku napisów (TBD).
- **Kursywa niedozwolona** — kontrakt na PoC nie przenosi znaczników kursywy, więc reguła nieaktywna (info).

## Mapowanie na formaty eksportu

- **SRT** — bez kolorów; zmiana mówcy = myślnik `-` na początku wypowiedzi; mówca poza kadrem = etykieta `[Lektor]:`.
- **VTT** — kolory mówców przez klasy/`<c>` lub `STYLE` (pełna zgodność WCAG), pozycjonowanie możliwe.
- **EBU-TT** — TBD (broadcasting), poza zakresem PoC.
