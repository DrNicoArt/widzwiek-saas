# Architektura — Widźwięk

## 1. Cel i ograniczenia

Produkt ma docelowo: przyjąć plik audio/wideo → przetworzyć (transkrypcja, mówcy, dźwięki) →
sformatować napisy zgodne z WCAG → wyeksportować SRT/VTT → wystawić raport zgodności WCAG (TAK/NIE + lista problemów).

Kluczowe ograniczenie techniczne: **ciężkie AI/audio nie zmieści się w serverless (Vercel)**:

| Ograniczenie Vercel (Hobby/Pro) | Skutek dla Widźwięku |
|---|---|
| Limit czasu funkcji 10–300 s | 5-min wideo + modele ML się nie wyrobią |
| Limit RAM ~1–3 GB | Whisper/diaryzacja potrzebują więcej, najlepiej GPU |
| Efemeryczny dysk, brak GPU | Brak miejsca na modele i pliki robocze |
| Body request ~4.5 MB | Upload wideo trzeba kierować poza funkcję |

**Wniosek:** rozdzielamy frontend (Vercel) od workera AI (lokalnie / osobny serwer z GPU).

## 2. Warstwy

```
                        ┌─────────────────────────────────────────────┐
   Przeglądarka         │                  web/ (Next.js)             │
   użytkownika  ───────▶│  Upload · Status · Podgląd · Raport · Pobierz│
                        │  Vercel-ready. Tylko UI + klient API.        │
                        └───────────────┬─────────────────────────────┘
                                        │ HTTP (JSON / multipart)
                                        ▼
                        ┌─────────────────────────────────────────────┐
                        │              worker/ (FastAPI)               │
                        │  REST API + Pipeline + WCAG + Eksport        │
                        │  Lokalnie / VPS / serwer GPU.                │
                        └───────────────┬─────────────────────────────┘
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            ▼                           ▼                           ▼
   ASR / Diaryzacja / Dźwięki    WCAG Validator              Eksport SRT/VTT
   (interfejsy + Mock/TBD)       (reguły AA z briefu)        (z CaptionDocument)
```

Rozdzielenie odpowiedzialności (świadomie, zgodnie z wytycznymi):
- **AI ≠ walidacja WCAG ≠ eksport.** Trzy osobne moduły (`pipeline/`, `wcag/`, `export/`).
- **UI ≠ pipeline.** Frontend nigdy nie liczy WCAG ani nie formatuje napisów — tylko renderuje wynik z workera.
- **Silniki AI za interfejsem.** Podmiana modelu = jedna nowa klasa, reszta bez zmian.

## 3. Pipeline (etapy)

Każdy etap przyjmuje i wzbogaca jeden obiekt `CaptionDocument` (patrz `DATA_CONTRACT.md`).

| # | Etap | Moduł | Wejście | Wyjście | Provider (PoC → docelowo) |
|---|------|-------|---------|---------|---------------------------|
| 1 | Ingest | `pipeline/runner` | plik | `MediaInfo` (czas, format) | stub → ffprobe |
| 2 | ASR (transkrypcja) | `pipeline/asr` | audio | segmenty mowy + czasy | Mock → **Whisper** |
| 3 | Diaryzacja (mówcy) | `pipeline/diarization` | audio + segmenty | `speaker_id` per segment | Mock → **pyannote** |
| 4 | Dźwięki niewerbalne | `pipeline/sound_events` | audio | cues `[oklaski]`, `[muzyka]`… | Mock → **YAMNet/PANNs** (TBD) |
| 5 | Formatowanie napisów | `pipeline/formatter` | segmenty + dźwięki | cues 1–2 linie, ≤42 zn., timing | reguły deterministyczne |
| 6 | Walidacja WCAG | `wcag/validator` | cues | `WcagReport` (TAK/NIE + issues) | reguły AA |
| 7 | Eksport | `export/srt`, `export/vtt` | `CaptionDocument` | pliki .srt / .vtt | deterministyczne |

Etapy 2–4 to AI (wymienne). Etapy 5–7 to logika deterministyczna (testowalna, bez modeli).

## 4. API workera

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/health` | liveness |
| POST | `/api/jobs` | upload pliku (multipart) → utworzenie joba, uruchomienie pipeline |
| GET | `/api/jobs/{id}` | status + (gdy gotowe) `CaptionDocument` z raportem WCAG |
| GET | `/api/jobs/{id}/export/srt` | pobranie .srt |
| GET | `/api/jobs/{id}/export/vtt` | pobranie .vtt |

Status joba: `queued → processing → done | error`. Na PoC pipeline jest szybki (mock), więc job
kończy się niemal natychmiast; kontrakt statusów jest już gotowy pod realne, długie przetwarzanie.

## 5. Przechowywanie wyników

PoC: in-memory store + opcjonalny zrzut JSON na dysk (`WIDZWIEK_STORAGE_DIR`). Bez bazy danych —
celowo, żeby nie budować infrastruktury przed walidacją technologii. Migracja do MVP: patrz `ROADMAP.md`.

## 6. Dlaczego ten stack (skrót)

- **Next.js + TypeScript** — naturalny wybór pod Vercel, typowany kontrakt, szybki demo UI.
- **Python + FastAPI** — ekosystem AI audio (Whisper, pyannote, torch), typowanie przez pydantic
  (te same modele służą jako kontrakt i jako walidacja wejścia API), auto-dokumentacja `/docs`.
- **Brak mikroserwisów / brak DB / brak kolejki na PoC** — minimalizujemy ruchome części; wszystko,
  co dodajemy, ma uzasadnienie w `DECISIONS.md`.
