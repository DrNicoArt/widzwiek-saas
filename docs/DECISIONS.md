# Decyzje techniczne (ADR skrócony)

Każda decyzja ma powód. Format: Decyzja → Powód → Alternatywy → Status.

## ADR-001 — Rozdział web (Vercel) i worker (Python)
**Decyzja:** dwie warstwy: frontend Next.js + osobny backend Python/FastAPI.
**Powód:** modele AI audio (Whisper, diaryzacja) i 5-min wideo przekraczają limity serverless Vercel
(czas, RAM, dysk, brak GPU). Frontend nadaje się na Vercel, AI nie.
**Alternatywy:** wszystko na Vercel (odrzucone — niewykonalne dla AI); wszystko w Node (odrzucone —
ekosystem AI audio jest w Pythonie). **Status:** przyjęte.

## ADR-002 — Python + FastAPI dla pipeline
**Powód:** Whisper/pyannote/torch to Python; pydantic daje jeden model jako kontrakt danych + walidację
wejścia API; auto-dokumentacja `/docs`. **Alternatywy:** Flask (mniej typowania), Node+ONNX (gorsze
wsparcie modeli). **Status:** przyjęte.

## ADR-003 — Jeden `CaptionDocument` jako kontrakt
**Decyzja:** wszystkie etapy wzbogacają jeden wersjonowany obiekt (patrz `DATA_CONTRACT.md`).
**Powód:** brak transformacji między etapami, łatwa serializacja i testy, naturalna ewolucja do MVP.
**Alternatywy:** osobny payload per etap (więcej mapowań, więcej błędów). **Status:** przyjęte.

## ADR-004 — Provider Orchestrator + adaptery providerów
**Decyzja:** orkiestrator wybiera źródło transkryptu i adaptery (`TranscriptSourceProvider`,
`ASRProvider`, `DiarizationProvider`, `SoundEventProvider`, `ExportProvider`). `Mock*` działa w demo,
OpenAI jest pierwszym live providerem, reszta to placeholdery.
**Powód:** produkt ma być provider-agnostic i automatyczny dla użytkownika. Podmiana providera = adapter,
nie przebudowa UI ani kontraktu.
**Status:** przyjęte.

## ADR-005 — WCAG, formatowanie i eksport jako osobne moduły
**Decyzja:** `pipeline/formatter` (łamanie linii/timing) ≠ `wcag/validator` (ocena) ≠ `export/` (pliki).
**Powód:** wymóg briefu o rozdziale; walidator musi być niezależnie testowalny i to on daje główną
wartość produktu (raport TAK/NIE). **Status:** przyjęte.

## ADR-006 — Brak DB / kolejki / auth / płatności na PoC
**Decyzja:** in-memory job store + opcjonalny zrzut JSON; brak logowania i płatności.
**Powód:** PoC waliduje technologię, nie model sprzedaży; minimalizujemy ruchome części.
**Alternatywy:** Postgres + Redis + queue od razu (przedwczesne). **Status:** przyjęte; migracja w `ROADMAP.md`.

## ADR-007 — Mock pipeline zwraca realistyczny materiał PL
**Decyzja:** mock generuje spójny przykład (lektor + gość + dźwięki + 1 ostrzeżenie WCAG) niezależnie od pliku.
**Powód:** demo musi pokazać CAŁY przepływ produktu (łącznie z wartością raportu) przed integracją AI.
**Status:** przyjęte.

## Otwarte kwestie (TBD)
- Alternatywni providerzy ASR/API/hosted model — decyzja po pomiarze jakości/kosztu; self-hosted/lokalne
  modele tylko jako later/dev eksperyment infrastrukturalny, nie strategia produktu.
- Diaryzacja: pyannote.audio (licencja/HF token) vs alternatywy.
- Detekcja dźwięków: YAMNet/PANNs vs LLM po transkrypcji — do walidacji.
- Walidacja kontrastu/synchronizacji/pozycji — wymaga warstwy wideo (poza PoC).
- Format EBU-TT — po MVP.
